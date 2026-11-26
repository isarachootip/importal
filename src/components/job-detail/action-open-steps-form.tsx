"use client";

import React, { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SaveDraftButton } from "@/components/ui/status-badges";
import { CHECK_ITEMS, DESIGNER_NAMES, type SubStatus } from "@/lib/domain/aw-constants";
import type { DraftData, JobRecord } from "@/lib/domain/job-types";
import { briefLabelTh, roundsCount } from "@/lib/domain/sla-engine";

export function ActionOpenAndDesignerForms({
  job,
  sub,
  draft,
  busy,
  onSaveDraft,
  onSubmitCheck,
  onSubmitSimple,
  onSubmitDesignerFile,
}: {
  job: JobRecord;
  sub: SubStatus;
  draft: DraftData | undefined;
  busy: boolean;
  onSaveDraft: (values: Record<string, string | boolean>, fileNames?: string[]) => void;
  onSubmitCheck: (p: { designer: string; brief: "Y" | "N"; availablePhoto: "Yes" | "No"; missingItems: string[]; note: string }) => void;
  onSubmitSimple: (kind: "photo" | "more", note: string) => void;
  onSubmitDesignerFile: (kind: "draft" | "present" | "evpfix" | "final", linkUrl: string, files: File[], note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [doneChecked, setDoneChecked] = useState(true);
  const [checkDesigner, setCheckDesigner] = useState(job.designer);
  const [checkBrief, setCheckBrief] = useState<"Y" | "N">(job.brief);
  const [availPhoto, setAvailPhoto] = useState<"Yes" | "No">("Yes");
  const [checkAnswers, setCheckAnswers] = useState<Array<"Yes" | "No">>(() => CHECK_ITEMS.map(() => "Yes"));

  useEffect(() => {
    setNote(typeof draft?.v.note === "string" ? draft.v.note : "");
    setLinkUrl(typeof draft?.v.linkUrl === "string" ? draft.v.linkUrl : "");
    setFiles([]);
    setDoneChecked(draft?.v.doneChecked !== false);
    setCheckDesigner(typeof draft?.v.designer === "string" ? draft.v.designer : job.designer);
    setCheckBrief(draft?.v.brief === "Y" || draft?.v.brief === "N" ? draft.v.brief : job.brief);
    setAvailPhoto(draft?.v.availPhoto === "No" ? "No" : "Yes");
    setCheckAnswers(CHECK_ITEMS.map((_, idx) => (draft?.v[`ck${idx}`] === "No" ? "No" : "Yes")));
  }, [draft, job.designer, job.brief, sub]);

  if (sub === "Info Checking") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="info">
          ตรวจข้อมูลให้เสร็จภายใน <b>2 วันทำงาน</b> · Import ระบุ Brief: <b>{briefLabelTh(job.brief)}</b>
          {job.brief === "Y" ? " · นัดประชุมกับ Import" : ""}
        </div>
        <div className="check" style={{ fontWeight: 600 }}>
          <span>ประชุม Brief (เปลี่ยนได้ถ้า Designer ต้องการคุยเพิ่ม)</span>
          <select value={checkBrief} onChange={(e) => setCheckBrief(e.target.value as "Y" | "N")}>
            <option value="Y">Y · ประชุม</option>
            <option value="N">N · ไม่ต้อง</option>
          </select>
        </div>
        <label className="fld">
          Designer&apos;s name
          <SearchableSelect ariaLabel="Designer's name" value={checkDesigner} options={DESIGNER_NAMES} onChange={setCheckDesigner} />
        </label>
        <div className="check" style={{ fontWeight: 600 }}>
          <span>Available Photos from Factory</span>
          <select value={availPhoto} onChange={(e) => setAvailPhoto(e.target.value as "Yes" | "No")}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, margin: "6px 0" }}>ตรวจความครบถ้วนของข้อมูล</div>
          {CHECK_ITEMS.map((c, idx) => (
            <div key={c} className="check">
              <span>{c}</span>
              <select value={checkAnswers[idx] ?? "Yes"} onChange={(e) => setCheckAnswers((prev) => prev.map((v, i) => (i === idx ? (e.target.value as "Yes" | "No") : v)))}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          ))}
        </div>
        <label className="fld">หมายเหตุ<textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <SaveDraftButton onClick={() => {
            const v: Record<string, string | boolean> = { designer: checkDesigner, brief: checkBrief, availPhoto, note };
            checkAnswers.forEach((ans, idx) => { v[`ck${idx}`] = ans; });
            onSaveDraft(v);
          }} />
          <button type="button" className="btn pri" disabled={busy} onClick={() => onSubmitCheck({ designer: checkDesigner, brief: checkBrief, availablePhoto: availPhoto, missingItems: CHECK_ITEMS.filter((_, i) => checkAnswers[i] === "No"), note })}>
            บันทึกผลตรวจ
          </button>
        </div>
      </div>
    );
  }

  if (sub === "Photo Shoot" || sub === "Info Incomplete") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="info">Share Folder: <a href={job.folder} target="_blank" rel="noopener noreferrer">{job.folder}</a></div>
        <label className="fld" style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input type="checkbox" checked={doneChecked} onChange={(e) => setDoneChecked(e.target.checked)} />
          {sub === "Photo Shoot" ? "อัปโหลดรูปสินค้าลง Share Folder แล้ว" : "เพิ่มข้อมูล / รูปลง Share Folder แล้ว"}
        </label>
        {sub === "Info Incomplete" && <div className="hint">ถ้าเปลี่ยน Folder ให้กด &quot;แก้ไขข้อมูล&quot; ด้านบนเพื่ออัปเดต Link</div>}
        <label className="fld">หมายเหตุ<textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <SaveDraftButton onClick={() => onSaveDraft({ doneChecked, note })} />
          <button type="button" className="btn pri" disabled={busy} onClick={() => onSubmitSimple(sub === "Photo Shoot" ? "photo" : "more", note)}>
            {sub === "Photo Shoot" ? "ส่งรูปให้ Designer" : "ส่งข้อมูลเพิ่มเติม"}
          </button>
        </div>
      </div>
    );
  }

  const label = sub === "Drafting" ? "อัปโหลด Draft" : sub === "Revising" ? `อัปโหลด Draft แก้ไข (รอบ ${roundsCount(job) + 1})` : sub === "Present AW" ? "ไฟล์ AW สำหรับ Present" : sub === "EVP Revising" ? "อัปโหลด AW ที่แก้ไขแล้ว" : "Final AW (.ai, .pdf)";
  const kind = sub === "Drafting" || sub === "Revising" ? "draft" : sub === "Present AW" ? "present" : sub === "EVP Revising" ? "evpfix" : "final";
  const btnText = sub === "Drafting" || sub === "Revising" ? "ส่ง Draft ให้ Import ตรวจ" : sub === "Present AW" ? "ส่งให้ EVP พิจารณา" : sub === "EVP Revising" ? "ส่งกลับให้ EVP" : "Submit Final AW";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="fld">
        <span>{label}</span>
        <div className="drop">
          <input type="file" multiple accept={sub === "Final AW" ? ".ai,.pdf" : ".jpg,.jpeg,.png,.pdf"} onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])} />
          {sub !== "Final AW" && (
            <>
              <div className="hint" style={{ margin: "6px 0" }}>หรือ กรอก Link Share Folder</div>
              <input type="url" placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={{ border: "1px solid #C9D2DE", borderRadius: 6, padding: "7px 9px", width: "100%" }} />
            </>
          )}
          <div className="hint" style={{ marginTop: 4 }}>{sub === "Final AW" ? "AI, PDF · ไม่แนบก็ส่งได้" : "JPG, JPEG, PNG, PDF หรือ Link อย่างใดอย่างหนึ่ง · ไม่ใส่ก็ส่งได้"}</div>
        </div>
      </div>
      <label className="fld">หมายเหตุ<textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <SaveDraftButton onClick={() => onSaveDraft({ linkUrl, note }, files.map((f) => f.name))} />
        <button type="button" className="btn pri" disabled={busy} onClick={() => onSubmitDesignerFile(kind, linkUrl, files, note)}>{btnText}</button>
      </div>
    </div>
  );
}
