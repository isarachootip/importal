import type { SubStatus } from "./aw-constants";
import type { HistoryMark, JobFileEntry, JobRecord, JobSkuEntry } from "./job-types";
import { curSub, importReviewResult, roundsCount } from "./sla-engine";

export type TransitionInput =
  | { kind: "check"; actorRole: string; today: string; designer: string; brief: "Y" | "N"; availablePhoto: "Yes" | "No"; missingItems: string[]; note: string }
  | { kind: "photo"; actorRole: string; today: string; note: string }
  | { kind: "more"; actorRole: string; today: string; note: string }
  | { kind: "draft"; actorRole: string; today: string; linkUrl?: string; uploadedFiles: JobFileEntry[]; note: string }
  | { kind: "imp"; actorRole: string; today: string; result: "pass" | "fail"; reason?: string; linkUrl?: string; uploadedFiles: JobFileEntry[]; note: string }
  | { kind: "mdsg"; actorRole: string; today: string; result: "pass" | "fail"; reason?: string; reviewerComments: string[]; linkUrl?: string; uploadedFiles: JobFileEntry[]; note: string }
  | { kind: "present"; actorRole: string; today: string; linkUrl?: string; uploadedFiles: JobFileEntry[]; note: string }
  | { kind: "evp"; actorRole: string; today: string; result: "pass" | "fail"; reason?: string; linkUrl?: string; uploadedFiles: JobFileEntry[]; note: string }
  | { kind: "evpfix"; actorRole: string; today: string; linkUrl?: string; uploadedFiles: JobFileEntry[]; note: string }
  | { kind: "final"; actorRole: string; today: string; uploadedFiles: JobFileEntry[]; note: string }
  | { kind: "factory"; actorRole: string; today: string; leadtime: number; poNumber?: string; skuFileName: string; skuStorageKey?: string | null; skus: JobSkuEntry[]; note: string }
  | { kind: "grSync"; actorRole: string; today: string }
  | { kind: "cancel"; actorRole: string; today: string; reason: string; note: string };

export interface TransitionResult {
  job: JobRecord;
  nextSub: SubStatus;
  notifyEventKey: string | null;
  toastMessage: string;
}

function appendFilesOrLink(
  files: JobFileEntry[],
  linkUrl: string | undefined,
  uploadedFiles: JobFileEntry[],
  fallbackName: string | null,
  role: string,
  today: string
): JobFileEntry[] {
  const next = [...files];
  const trimmed = linkUrl?.trim() ?? "";
  if (trimmed) {
    if (!/^https?:\/\/\S+$/i.test(trimmed)) {
      throw new Error("Link ต้องขึ้นต้นด้วย http:// หรือ https://");
    }
    next.push({ name: trimmed, link: true, by: role, d: today });
    if (uploadedFiles.length === 0) return next;
  }
  if (uploadedFiles.length > 0) {
    uploadedFiles.forEach((f) => next.push(f));
  } else if (fallbackName) {
    next.push({ name: fallbackName, by: role, d: today });
  }
  return next;
}

export function applyJobTransition(source: JobRecord, input: TransitionInput): TransitionResult {
  const job: JobRecord = {
    ...source,
    history: [...source.history],
    files: [...source.files],
    skus: source.skus.map((s) => ({ ...s })),
  };
  const r = roundsCount(job);

  const pushMove = (next: SubStatus, act: string, note: string, mark?: HistoryMark, by?: string) => {
    job.history.push({ sub: next, d: input.today, by: by ?? input.actorRole, act, note, mark });
  };

  switch (input.kind) {
    case "check": {
      job.designer = input.designer;
      job.brief = input.brief;
      if (input.availablePhoto === "No") {
        job.photo = true;
        pushMove("Photo Shoot", "ไม่มีรูปสินค้าจากโรงงาน → ส่งถ่ายรูป", input.note);
        return { job, nextSub: "Photo Shoot", notifyEventKey: "Photo Shoot", toastMessage: "ส่งงานให้ Photographer แล้ว (SLA +7 วัน)" };
      }
      if (input.missingItems.length > 0) {
        const msg = `ขาด: ${input.missingItems.join(", ")}${input.note ? ` · ${input.note}` : ""}`;
        pushMove("Info Incomplete", "ข้อมูลไม่ครบ ส่งกลับ Import", msg);
        return { job, nextSub: "Info Incomplete", notifyEventKey: "Info Incomplete", toastMessage: "ส่งกลับ Import ให้เติมข้อมูล" };
      }
      pushMove("Drafting", `Confirm Info Complete · Brief: ${job.brief}`, input.note, "info");
      return { job, nextSub: "Drafting", notifyEventKey: "Drafting", toastMessage: "ยืนยันข้อมูลครบแล้ว · เริ่มนับ SLA Draft 7 วันทำงาน" };
    }
    case "photo": {
      pushMove("Info Checking", "อัปโหลดรูปสินค้าลง Share Folder แล้ว", input.note);
      return { job, nextSub: "Info Checking", notifyEventKey: "Info Checking", toastMessage: "ส่งรูปให้ Designer แล้ว" };
    }
    case "more": {
      pushMove("Info Checking", "เพิ่มข้อมูลลง Share Folder แล้ว", input.note);
      return { job, nextSub: "Info Checking", notifyEventKey: "Info Checking", toastMessage: "ส่งข้อมูลเพิ่มให้ Designer แล้ว" };
    }
    case "draft": {
      job.files = appendFilesOrLink(job.files, input.linkUrl, input.uploadedFiles, `Draft_R${r + 1}_${job.pi}.pdf`, input.actorRole, input.today);
      pushMove("Import Review", `ส่ง Draft รอบ ${r + 1}`, input.note);
      return { job, nextSub: "Import Review", notifyEventKey: "Import Review", toastMessage: "ส่ง Draft ให้ Import ตรวจแล้ว" };
    }
    case "imp": {
      if (input.result === "fail" && !input.reason?.trim()) throw new Error("กรุณาเลือก Reason กรณี No");
      job.files = appendFilesOrLink(job.files, input.linkUrl, input.uploadedFiles, null, input.actorRole, input.today);
      const note = [input.result === "fail" ? input.reason : "", input.note].filter(Boolean).join(" · ");
      pushMove("MDSG Review", input.result === "fail" ? "Import: Fail → ส่งให้ MDSG ตรวจ" : "Import: Pass → ส่งให้ MDSG ตรวจ", note);
      return { job, nextSub: "MDSG Review", notifyEventKey: "MDSG Review", toastMessage: `บันทึกผล Import (${input.result === "fail" ? "Fail" : "Pass"}) แล้ว · ส่งต่อให้ MDSG ตรวจ` };
    }
    case "mdsg": {
      if (input.result === "fail" && !input.reason?.trim()) throw new Error("กรุณาเลือก Reason กรณี No");
      job.files = appendFilesOrLink(job.files, input.linkUrl, input.uploadedFiles, null, input.actorRole, input.today);
      const cm = input.reviewerComments.map((c) => c.trim()).filter(Boolean).join(" / ");
      const ip = importReviewResult(job);
      const mPass = input.result !== "fail";
      const mNote = mPass
        ? (cm || input.note ? ["Pass", cm, input.note].filter(Boolean).join(" · ") : "Pass")
        : [input.reason, cm, input.note].filter(Boolean).join(" · ");
      if (ip.pass && mPass) {
        pushMove("Present AW", "สรุปผลตรวจ: Import Pass · MDSG Pass → Confirm AW", [cm, input.note].filter(Boolean).join(" · "), "confirm");
        return { job, nextSub: "Present AW", notifyEventKey: "Present AW", toastMessage: "Confirm AW แล้ว (Pass ทั้ง Import และ MDSG) · Designer เตรียม Present AW ให้ EVP" };
      }
      const combined = `Import: ${ip.pass ? "Pass" : (ip.note || "Fail")} | MDSG: ${mNote}`;
      pushMove("Revising", `สรุปผลตรวจ รอบ ${r + 1}: Import ${ip.pass ? "Pass" : "Fail"} · MDSG ${mPass ? "Pass" : "Fail"} → ส่งกลับแก้ไข`, combined, "fail");
      return { job, nextSub: "Revising", notifyEventKey: "Revising", toastMessage: "รวมผลตรวจทั้ง 2 ทีมแล้ว · ส่งให้ Designer แก้ไขครั้งเดียว" };
    }
    case "present": {
      job.files = appendFilesOrLink(job.files, input.linkUrl, input.uploadedFiles, `Present_AW_${job.pi}.pdf`, input.actorRole, input.today);
      pushMove("EVP Review", "Present AW ให้ EVP", input.note);
      return { job, nextSub: "EVP Review", notifyEventKey: "EVP Review", toastMessage: "ส่งให้ EVP พิจารณาแล้ว" };
    }
    case "evp": {
      if (input.result === "fail") {
        if (!input.reason?.trim()) throw new Error("กรุณาเลือก Reason กรณีไม่อนุมัติ");
        job.files = appendFilesOrLink(job.files, input.linkUrl, input.uploadedFiles, null, input.actorRole, input.today);
        pushMove("EVP Revising", "EVP ไม่อนุมัติ · ให้แก้ไข", [input.reason, input.note].filter(Boolean).join(" · "), "fail");
        return { job, nextSub: "EVP Revising", notifyEventKey: "EVP Revising", toastMessage: "ส่งกลับ Designer แก้ไข · SLA 1 วัน" };
      }
      job.files = appendFilesOrLink(job.files, input.linkUrl, input.uploadedFiles, null, input.actorRole, input.today);
      pushMove("Final AW", "EVP อนุมัติ AW", input.note);
      return { job, nextSub: "Final AW", notifyEventKey: "Final AW", toastMessage: "EVP อนุมัติแล้ว · Designer ส่ง Final AW" };
    }
    case "evpfix": {
      job.files = appendFilesOrLink(job.files, input.linkUrl, input.uploadedFiles, `AW_EVP_fix_${job.pi}.pdf`, input.actorRole, input.today);
      pushMove("EVP Review", "ส่ง AW แก้ไขให้ EVP", input.note);
      return { job, nextSub: "EVP Review", notifyEventKey: "EVP Review", toastMessage: "ส่งกลับให้ EVP แล้ว" };
    }
    case "final": {
      job.files = appendFilesOrLink(job.files, undefined, input.uploadedFiles, `FinalAW_${job.pi}.ai`, input.actorRole, input.today);
      pushMove("Send to Factory", "Submit Final AW (.ai / .pdf)", input.note, "final");
      return { job, nextSub: "Send to Factory", notifyEventKey: "Send to Factory", toastMessage: "ส่ง Final AW แล้ว · แจ้ง Import ส่งโรงงาน" };
    }
    case "factory": {
      if (!input.leadtime || input.leadtime < 1) throw new Error("กรุณาใส่ Production Leadtime");
      if (!input.skus.length) throw new Error("กรุณา Upload SKU number (ดาวน์โหลดแบบฟอร์ม แล้วกรอกเลข SKU ใน Column A)");
      job.leadtime = input.leadtime;
      job.poNumber = input.poNumber?.trim() || null;
      job.skuFile = input.skuFileName;
      job.skus = input.skus;
      job.files.push({ name: input.skuFileName, storageKey: input.skuStorageKey ?? null, by: "import", d: input.today });
      const poTxt = job.poNumber ? ` · PO ${job.poNumber}` : "";
      pushMove("In Production", `ส่ง Final AW ให้โรงงาน · Leadtime ${input.leadtime} วัน${poTxt} · SKU ${job.skus.length} รายการ`, input.note);
      return { job, nextSub: "In Production", notifyEventKey: "In Production", toastMessage: `บันทึกแล้ว · ${job.skus.length} SKU · ระบบจะเช็ก Goods Received ผ่าน API (PI + SKU)` };
    }
    case "grSync": {
      const wait = job.skus.filter((s) => !s.gr);
      if (!wait.length) return { job, nextSub: curSub(job), notifyEventKey: null, toastMessage: "รับครบทุก SKU แล้ว" };
      const first = !job.skus.some((s) => s.gr);
      const count = wait.length > 1 && first ? Math.ceil(wait.length / 2) : wait.length;
      wait.slice(0, count).forEach((s) => { s.gr = input.today; });
      const left = job.skus.filter((s) => !s.gr).length;
      if (curSub(job) === "In Production") {
        pushMove("Goods Received", `Auto Sync Goods Received (API: PI + SKU) · SKU แรกเข้า${left ? ` · รออีก ${left} SKU` : " · รับครบทุก SKU"}`, "", "gr", "system");
        return { job, nextSub: "Goods Received", notifyEventKey: "Goods Received", toastMessage: `SKU แรกเข้าแล้ว · บันทึกวันที่สินค้าเข้าของ PI${left ? ` · รออีก ${left} SKU` : ""}` };
      }
      return { job, nextSub: curSub(job), notifyEventKey: null, toastMessage: left ? `API: รับแล้ว ${job.skus.length - left}/${job.skus.length} SKU` : "รับครบทุก SKU แล้ว" };
    }
    case "cancel": {
      const note = [input.reason, input.note].filter(Boolean).join(" · ");
      pushMove("Cancelled", "ยกเลิกงาน", note);
      return { job, nextSub: "Cancelled", notifyEventKey: "Cancelled", toastMessage: "บันทึกการยกเลิกงานแล้ว" };
    }
  }
}
