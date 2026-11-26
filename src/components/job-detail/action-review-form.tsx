"use client";

import React, { useMemo, useState } from "react";
import { SaveDraftButton } from "@/components/ui/status-badges";
import { REASONS } from "@/lib/domain/aw-constants";
import type { DraftData, JobRecord } from "@/lib/domain/job-types";
import { resolveMdsgChain } from "@/lib/domain/mdsg-resolver";
import { importReviewResult, roundsCount } from "@/lib/domain/sla-engine";
import { fmtThaiDate } from "@/lib/domain/working-days";

export interface ReviewSubmitPayload {
  kind: "imp" | "mdsg" | "evp";
  result: "pass" | "fail";
  reason: string;
  reviewerComments?: string[];
  linkUrl: string;
  files: File[];
  note: string;
}

export function ActionReviewForm({
  job, mode, draft, busy, onSaveDraft, onSubmit,
}: {
  job: JobRecord;
  mode: "imp" | "mdsg" | "evp";
  draft: DraftData | undefined;
  busy: boolean;
  onSaveDraft: (values: Record<string, string | boolean>, fileNames: string[]) => void;
  onSubmit: (payload: ReviewSubmitPayload) => void;
}) {
  const mdsgChain = useMemo(() => resolveMdsgChain(job.sdepts, job.pattern), [job.sdepts, job.pattern]);
  const [result, setResult] = useState<"pass" | "fail">(() => (draft?.v.result === "fail" ? "fail" : "pass"));
  const [reason, setReason] = useState<string>(() => (typeof draft?.v.reason === "string" ? draft.v.reason : ""));
  const [linkUrl, setLinkUrl] = useState<string>(() => (typeof draft?.v.linkUrl === "string" ? draft.v.linkUrl : ""));
  const [note, setNote] = useState<string>(() => (typeof draft?.v.note === "string" ? draft.v.note : ""));
  const [files, setFiles] = useState<File[]>([]);
  const [checkedSlots, setCheckedSlots] = useState<boolean[]>(() =>
    mdsgChain.slots.map((_, idx) => (draft?.v[`rv${idx}`] !== undefined ? Boolean(draft.v[`rv${idx}`]) : idx === 0))
  );
  const [slotComments, setSlotComments] = useState<string[]>(() =>
    mdsgChain.slots.map((_, idx) => (typeof draft?.v[`rc${idx}`] === "string" ? String(draft.v[`rc${idx}`]) : ""))
  );

  const ip = importReviewResult(job);
  const r = roundsCount(job);

  function collectDraftValues(): Record<string, string | boolean> {
    const out: Record<string, string | boolean> = { result, reason, linkUrl, note };
    mdsgChain.slots.forEach((_, idx) => {
      out[`rv${idx}`] = checkedSlots[idx] ?? false;
      out[`rc${idx}`] = slotComments[idx] ?? "";
    });
    return out;
  }

  const whoLabel = mode === "imp" ? "Import" : mode === "mdsg" ? "MDSG" : "EVP";
  const btnLabel = mode === "imp" ? "บันทึกผล Import · ส่งต่อ MDSG" : mode === "mdsg" ? "บันทึกผล MDSG · สรุปผลรวม" : "บันทึกผล";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {mode === "imp" && (
        <div className="info">
          Draft รอบ {r + 1} · ขั้นที่ 1/2: <b>Import ตรวจ</b><br />
          ผ่านหรือไม่ผ่าน ระบบส่งต่อให้ MDSG ตรวจทุกกรณี แล้วรวมผลทั้ง 2 ทีมส่งให้ Designer แก้ครั้งเดียว
        </div>
      )}

      {mode === "mdsg" && (
        <>
          <div className="info">
            Draft รอบ {r + 1} · ขั้นที่ 2/2: <b>MDSG ตรวจ</b><br />
            ผลของ Import: {ip.pass ? <span className="chip ok">Pass</span> : <span className="chip bad">Fail</span>}{" "}
            <span className="hint">{ip.d ? fmtThaiDate(ip.d) : ""}{ip.note ? ` · ${ip.note}` : ""}</span><br />
            <span className="hint">Pass ทั้ง 2 ทีม = Confirm AW · ถ้าทีมใดไม่ผ่าน ระบบรวมคอมเมนต์ทั้ง 2 ทีมส่งให้ Designer แก้ครั้งเดียว</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>ผู้ตรวจฝั่ง MDSG (ผูกตาม Sdept {job.sdepts.join(", ")})</div>
            {mdsgChain.slots.map((slot, i) => (
              <div key={slot.roleLabel} className="check" style={{ gridTemplateColumns: "24px minmax(140px, 210px) minmax(0, 1fr)" }}>
                <input type="checkbox" aria-label={`${slot.roleLabel} ตรวจแล้ว`} checked={checkedSlots[i] ?? false} onChange={(e) => setCheckedSlots((prev) => prev.map((v, idx) => (idx === i ? e.target.checked : v)))} />
                <span><b>{slot.roleLabel}</b><div className="hint" style={{ fontSize: 11 }}>{slot.summaryNames}</div></span>
                <input aria-label={`คอมเมนต์ ${slot.roleLabel}`} placeholder="คอมเมนต์ (ถ้ามี)" value={slotComments[i] ?? ""} onChange={(e) => setSlotComments((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))} style={{ border: "1px solid #C9D2DE", borderRadius: 6, padding: "5px 8px" }} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="fld">
        <span>{mode === "evp" ? "EVP Approve" : `Confirm draft AW (${whoLabel})`}</span>
        <div style={{ display: "flex", gap: 16, fontWeight: 400, flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" checked={result === "pass"} onChange={() => setResult("pass")} />{mode === "evp" ? "Yes · อนุมัติ" : "Yes · Pass"}</label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" checked={result === "fail"} onChange={() => setResult("fail")} />{mode === "evp" ? "No · ให้แก้ไข" : "No · ส่งกลับแก้ไข"}</label>
        </div>
      </div>

      <label className="fld">
        Reason
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">{mode === "evp" ? "– เลือกเหตุผล (กรณีไม่อนุมัติ) –" : "– เลือกเหตุผล (กรณี No) –"}</option>
          {REASONS.map((rsn) => <option key={rsn} value={rsn}>{rsn}</option>)}
        </select>
      </label>

      <div className="fld">
        <span>แนบไฟล์ที่ Markup คอมเมนต์ หรือ Link Share Folder</span>
        <div className="drop">
          <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" aria-label="แนบไฟล์คอมเมนต์" onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])} />
          <div className="hint" style={{ margin: "6px 0" }}>หรือ กรอก Link Share Folder</div>
          <input type="url" placeholder="https://…" aria-label="Link Share Folder" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={{ border: "1px solid #C9D2DE", borderRadius: 6, padding: "7px 9px", width: "100%" }} />
          <div className="hint" style={{ marginTop: 4 }}>JPG, JPEG, PNG, PDF หรือ Link อย่างใดอย่างหนึ่ง · ไม่ใส่ก็ส่งได้</div>
        </div>
      </div>

      <label className="fld">Reason (Free Text)<textarea rows={3} maxLength={1000} placeholder="ไม่เกิน 1,000 ตัวอักษร" value={note} onChange={(e) => setNote(e.target.value)} /></label>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <SaveDraftButton onClick={() => onSaveDraft(collectDraftValues(), files.map((f) => f.name))} />
        <button type="button" className="btn pri" disabled={busy} onClick={() => onSubmit({ kind: mode, result, reason, reviewerComments: mode === "mdsg" ? slotComments : undefined, linkUrl, files, note })}>{btnLabel}</button>
      </div>
    </div>
  );
}
