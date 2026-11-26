"use client";

import React, { useEffect, useState } from "react";
import { useTracker } from "@/components/context/tracker-context";
import {
  buildInitialFormValues,
  deserializeFormDraft,
  JobFormFields,
  serializeFormDraft,
  validateAndBuildApiPayload,
} from "@/components/forms/job-form-fields";
import { DraftBanner, SaveDraftButton } from "@/components/ui/status-badges";
import { ROLE_TH, sdeptLabel } from "@/lib/domain/aw-constants";
import type { JobRecord } from "@/lib/domain/job-types";
import { briefLabelTh, curSub, jobPattern } from "@/lib/domain/sla-engine";
import { fmtThaiDate } from "@/lib/domain/working-days";

export function JobInfoCard({ job }: { job: JobRecord }) {
  const { session, today, drafts, saveDraftRemote, deleteDraftRemote, upsertJobState, showToast } = useTracker();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const draftKey = `edit:${job.id}`;
  const activeDraft = drafts[draftKey];

  const [values, setValues] = useState(() => {
    const base = buildInitialFormValues(today, job);
    return activeDraft ? deserializeFormDraft(activeDraft.v, base) : base;
  });

  useEffect(() => {
    const base = buildInitialFormValues(today, job);
    setValues(activeDraft ? deserializeFormDraft(activeDraft.v, base) : base);
  }, [job, today, activeDraft]);

  const canEdit = (session.role === "import" || session.role === "designer") && curSub(job) !== "Cancelled";
  const p = jobPattern(job);

  async function handleSaveEdit() {
    const checked = validateAndBuildApiPayload(values);
    if ("err" in checked) { showToast(checked.err ?? "ข้อมูลไม่ครบถ้วน"); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(checked.data) });
      const json = (await res.json()) as { job?: JobRecord; changed?: boolean; slaChangedTo?: number | null; error?: string };
      if (!res.ok || !json.job) throw new Error(json.error ?? "บันทึกการแก้ไขไม่สำเร็จ");
      upsertJobState(json.job);
      setEditing(false);
      showToast(!json.changed ? "ไม่มีการเปลี่ยนแปลง" : `บันทึกการแก้ไขแล้ว${json.slaChangedTo ? ` · SLA รวมเปลี่ยนเป็น ${json.slaChangedTo} วัน` : ""}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="card" style={{ marginTop: 16, borderColor: "#9DB5E0" }}>
        <DraftBanner draft={activeDraft} onDelete={() => { void deleteDraftRemote(draftKey); setValues(buildInitialFormValues(today, job)); showToast("ลบร่างแล้ว"); }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>แก้ไขข้อมูลงาน</h2>
          <span className="hint">แก้โดย {session.roleName} · ระบบบันทึกประวัติการแก้ไขทุกครั้ง</span>
        </div>
        <JobFormFields values={values} today={today} onChange={setValues} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={() => setEditing(false)}>ยกเลิก</button>
          <SaveDraftButton onClick={() => void saveDraftRemote(draftKey, serializeFormDraft(values))} />
          <button type="button" className="btn pri" disabled={busy} onClick={() => void handleSaveEdit()}>บันทึกการแก้ไข</button>
        </div>
      </div>
    );
  }

  const itemCell = (label: string, val: React.ReactNode, full?: boolean) => (
    <div key={label} style={{ gridColumn: full ? "1 / -1" : undefined, padding: "10px 0", borderBottom: "1px solid #EDF0F4" }}>
      <div className="hint" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>{val}</div>
    </div>
  );

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>ข้อมูลที่แจ้งงาน</h2>
        {canEdit ? <button type="button" className="btn sm" onClick={() => setEditing(true)}>{activeDraft ? "📝 แก้ไขข้อมูล (มีร่าง)" : "แก้ไขข้อมูล"}</button> : <span className="hint">แก้ไขได้โดย Import และ Designer</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", columnGap: 28, marginTop: 6 }}>
        {itemCell("PI Number", job.pi)}
        {itemCell("PI approval date by EVP", fmtThaiDate(job.piDate))}
        {itemCell("BU", job.bu)}
        {itemCell("Supplier Name", job.supplier)}
        {itemCell("House Brand Name", job.brand)}
        {itemCell("No. of items", `${job.items} items`)}
        {itemCell("Type of Pattern", <>{p.name}<div className="hint" style={{ fontWeight: 400 }}>{p.grp} · {p.desc}</div></>)}
        {itemCell("Apply for a license / permit", job.license)}
        {job.sdepts.map((c, idx) => itemCell(`Sdept & Sdept Name ${idx + 1}`, sdeptLabel(c)))}
        {itemCell("Package Design", job.packages.join(", ") || "–")}
        {itemCell("Designer", job.designer)}
        {itemCell("ประชุม Brief กับ Designer", briefLabelTh(job.brief))}
        {itemCell("Import", job.importer)}
        {job.poNumber && itemCell("PO Number", job.poNumber)}
        {itemCell("Link Share Folder · Data for designing Packaging", job.folder ? <a href={job.folder} target="_blank" rel="noopener noreferrer">{job.folder}</a> : "–", true)}
      </div>

      {job.edits.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ประวัติการแก้ไขข้อมูล</div>
          {job.edits.map((e, idx) => (
            <div key={e.id ?? idx} style={{ fontSize: 13, padding: "8px 10px", background: "var(--soft)", borderRadius: 8, marginBottom: 6 }}>
              <b>{fmtThaiDate(e.d)}</b> · {ROLE_TH[e.by] ?? e.by} ({e.user})
              <div>{e.ch.map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</div>
              {e.sla && <div style={{ color: "var(--org-d)", fontWeight: 600 }}>{e.sla}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
