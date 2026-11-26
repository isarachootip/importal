import { REASONS, type SubStatus } from "./aw-constants";
import type { HistoryMark, JobRecord } from "./job-types";
import { addWorkingDays } from "./working-days";

export function simulateJobHistory(
  j: JobRecord,
  today: string,
  recentAnchor: string,
  holidays: ReadonlySet<string>,
  r: () => number,
  ri: (a: number, b: number) => number,
  pick: <T>(arr: readonly T[]) => T
): void {
  let d = addWorkingDays(j.piDate, ri(1, [3, 5].includes(j.pattern) ? 8 : 3), holidays);
  const push = (sub: SubStatus, date: string, by: string, act: string, note = "", mark?: HistoryMark) => {
    j.history.push({ sub, d: date, by, act, note, mark });
  };
  const recent = j.piDate >= recentAnchor;
  const slow = recent ? (r() < 0.35 ? 2.5 : 1) : r() < 0.2 ? 1.5 : 1;
  const go = (next: SubStatus, dur: number, by: string, act: string, note = "", mark?: HistoryMark): boolean => {
    const nd = addWorkingDays(d, Math.round(dur * (next === "Goods Received" ? 1 : slow)), holidays);
    if (nd > today) return false;
    d = nd;
    push(next, d, by, act, note, mark);
    return true;
  };

  if (d > today) d = today;
  push("Info Checking", d, "import", "แจ้งงานออกแบบ (Create Job)", "", "create");
  j.brief = r() < 0.5 ? "Y" : "N";
  let wait = ri(1, 3);
  if (r() < 0.28) {
    j.photo = true;
    if (!go("Photo Shoot", wait, "designer", "ไม่มีรูปสินค้าจากโรงงาน → ส่งถ่ายรูป")) return;
    if (!go("Info Checking", ri(4, 9), "photographer", "อัปโหลดรูปสินค้าแล้ว")) return;
    wait = ri(1, 3);
  }
  if (r() < 0.3) {
    if (!go("Info Incomplete", wait, "designer", "ข้อมูลไม่ครบ ส่งกลับ Import", "ขาด Packaging Size & Dimension / Shipping Mark")) return;
    if (!go("Info Checking", ri(1, 5), "import", "ส่งข้อมูลเพิ่มเติมแล้ว")) return;
    wait = ri(1, 3);
  }
  if (!go("Drafting", wait, "designer", `Confirm Info Complete · Brief: ${j.brief}`, "", "info")) return;
  if (!go("Import Review", ri(4, 9), "designer", "ส่ง Draft รอบ 1")) return;
  let round = 1;
  for (;;) {
    const pf = round === 1 ? 0.25 : round === 2 ? 0.12 : 0.05;
    const iF = r() < pf;
    const mF = r() < pf;
    const iR = iF ? pick(REASONS) : "";
    const mR = mF ? pick(REASONS) : "";
    if (!go("MDSG Review", ri(1, 2), "import", iF ? "Import: Fail → ส่งให้ MDSG ตรวจ" : "Import: Pass → ส่งให้ MDSG ตรวจ", iR)) return;
    if (iF || mF) {
      if (!go("Revising", ri(1, 2), "mdsg", `สรุปผลตรวจ รอบ ${round}: Import ${iF ? "Fail" : "Pass"} · MDSG ${mF ? "Fail" : "Pass"} → ส่งกลับแก้ไข`, `Import: ${iF ? iR : "Pass"} | MDSG: ${mF ? mR : "Pass"}`, "fail")) return;
      round++;
      if (!go("Import Review", ri(2, 4), "designer", `ส่ง Draft รอบ ${round}`)) return;
      continue;
    }
    if (!go("Present AW", ri(1, 2), "mdsg", "สรุปผลตรวจ: Import Pass · MDSG Pass → Confirm AW", "", "confirm")) return;
    break;
  }
  if (!go("EVP Review", ri(0, 1), "designer", "Present AW ให้ EVP")) return;
  while (r() < 0.18) {
    if (!go("EVP Revising", ri(1, 4), "evp", "EVP ไม่อนุมัติ · ให้แก้ไข", pick(REASONS), "fail")) return;
    if (!go("EVP Review", ri(1, 2), "designer", "ส่ง AW แก้ไขให้ EVP")) return;
  }
  if (!go("Final AW", ri(1, 3), "evp", "EVP อนุมัติ AW")) return;
  if (!go("Send to Factory", ri(0, 2), "designer", "Submit Final AW (.ai / .pdf)", "", "final")) return;
  j.files.push({ name: `FinalAW_${j.pi}.ai`, by: "designer", d });
  const lt = ri(40, 55);
  if (!go("In Production", ri(0, 2), "import", `ส่ง Final AW ให้โรงงาน · Leadtime ${lt} วัน · Upload SKU number แล้ว`)) return;
  j.leadtime = lt;
  j.skuFile = `SKU_${j.pi}.xlsx`;
  j.files.push({ name: j.skuFile, by: "import", d });
  const extraLic = j.license === "TISI (มอก.)" ? ri(70, 110) : j.license === "อย." ? ri(40, 75) : 0;
  go("Goods Received", lt + ri(14, 26) + extraLic, "system", "Auto Sync PO · Goods received date", "", "gr");
}
