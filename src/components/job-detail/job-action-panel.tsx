"use client";

import React, { useState } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { DraftBanner } from "@/components/ui/status-badges";
import { ROLE_TH, ROLES_META, SUB_MAP } from "@/lib/domain/aw-constants";
import type { TrackerRoleKey } from "@/lib/domain/directory-import-design";
import type { JobRecord, OutboxMail } from "@/lib/domain/job-types";
import { curSub, dayInStage, lastNoteEntry, slaOf } from "@/lib/domain/sla-engine";
import { fmtThaiDate } from "@/lib/domain/working-days";
import { ActionFactoryAndGrView } from "./action-factory-form";
import { ActionOpenAndDesignerForms } from "./action-open-steps-form";
import { ActionReviewForm } from "./action-review-form";

async function uploadSelectedFiles(files: File[]) {
  if (!files.length) return [];
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const res = await fetch("/api/files", { method: "POST", body: fd });
  const data = (await res.json()) as { uploaded?: Array<{ name: string; storageKey: string | null; mimeType: string; sizeBytes: number }> };
  return data.uploaded ?? [];
}

export function JobActionPanel({ job }: { job: JobRecord }) {
  const { session, today, holidaySet, drafts, switchSession, saveDraftRemote, deleteDraftRemote, upsertJobState, showToast } = useTracker();
  const s = curSub(job);
  const def = SUB_MAP[s];
  const draftKey = `act:${job.id}:${s}`;
  const activeDraft = drafts[draftKey];
  const [busy, setBusy] = useState(false);

  async function postTransition(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { job?: JobRecord; toast?: string; mail?: OutboxMail | null; error?: string };
      if (!res.ok || !data.job) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      upsertJobState(data.job, data.mail);
      showToast(data.toast ?? "บันทึกแล้ว");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  const head = (
    <>
      <h2>สิ่งที่ต้องทำตอนนี้</h2>
      <div className="hint" style={{ marginBottom: 14 }}>
        {s} · {def.label}
        {def.sla != null || s === "In Production" ? ` · SLA ${slaOf(job)} วัน · อยู่ในขั้นนี้ ${dayInStage(job, today, holidaySet)} วัน` : ""}
      </div>
    </>
  );

  if (s === "Cancelled") return <>{head}<div className="notice">งานนี้ถูกยกเลิก · ไม่นำไปคิด Performance</div></>;

  if (s === "Goods Received" || s === "In Production") {
    return (
      <>
        {head}
        <ActionFactoryAndGrView job={job} mode={s} holidays={holidaySet} draft={activeDraft} busy={busy} showToast={showToast} onSaveDraft={(v, fn) => void saveDraftRemote(draftKey, v, fn)} onSubmitFactory={() => {}} onTriggerGrSync={() => void postTransition({ kind: "grSync" })} />
      </>
    );
  }

  if (!def.roles.includes(session.role)) {
    return (
      <>
        {head}
        <div className="notice">งานนี้รอ <b>{def.roles.map((r) => ROLE_TH[r] ?? r).join(" / ")}</b> ดำเนินการ · คุณกำลังใช้งานในบทบาท {session.roleName}</div>
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {def.roles.filter((r): r is TrackerRoleKey => r in ROLES_META).map((r) => (
            <button key={r} type="button" className="btn sm" onClick={() => void switchSession(r)}>สลับเป็น {ROLES_META[r].name} (Demo)</button>
          ))}
        </div>
      </>
    );
  }

  const fb = lastNoteEntry(job);
  return (
    <>
      {head}
      {fb && ["Revising", "EVP Revising", "Info Incomplete"].includes(s) && (
        <div className="notice" style={{ marginBottom: 14 }}>
          <b>{s === "Revising" ? "ผลตรวจรวมจาก Import + MDSG" : "คอมเมนต์ล่าสุด"}</b> ({fmtThaiDate(fb.d)})<br />
          {fb.note.split(" | ").map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}
        </div>
      )}
      <DraftBanner draft={activeDraft} onDelete={() => { void deleteDraftRemote(draftKey); showToast("ลบร่างแล้ว"); }} />

      {s === "Send to Factory" ? (
        <ActionFactoryAndGrView job={job} mode="Send to Factory" holidays={holidaySet} draft={activeDraft} busy={busy} showToast={showToast} onSaveDraft={(v, fn) => void saveDraftRemote(draftKey, v, fn)} onSubmitFactory={(p) => void postTransition({ kind: "factory", ...p })} onTriggerGrSync={() => {}} />
      ) : s === "Import Review" || s === "MDSG Review" || s === "EVP Review" ? (
        <ActionReviewForm
          key={draftKey} job={job} mode={s === "Import Review" ? "imp" : s === "MDSG Review" ? "mdsg" : "evp"} draft={activeDraft} busy={busy}
          onSaveDraft={(v, fn) => void saveDraftRemote(draftKey, v, fn)}
          onSubmit={async (p) => {
            if (p.linkUrl && !/^https?:\/\/\S+$/i.test(p.linkUrl.trim())) { showToast("Link ต้องขึ้นต้นด้วย http:// หรือ https://"); return; }
            const uploadedFiles = await uploadSelectedFiles(p.files);
            await postTransition({ kind: p.kind, result: p.result, reason: p.reason, reviewerComments: p.reviewerComments ?? [], linkUrl: p.linkUrl, uploadedFiles, note: p.note });
          }}
        />
      ) : (
        <ActionOpenAndDesignerForms
          job={job} sub={s} draft={activeDraft} busy={busy}
          onSaveDraft={(v, fn) => void saveDraftRemote(draftKey, v, fn)}
          onSubmitCheck={(p) => void postTransition({ kind: "check", ...p })}
          onSubmitSimple={(kind, note) => void postTransition({ kind, note })}
          onSubmitDesignerFile={async (kind, linkUrl, files, note) => {
            if (linkUrl && !/^https?:\/\/\S+$/i.test(linkUrl.trim())) { showToast("Link ต้องขึ้นต้นด้วย http:// หรือ https://"); return; }
            const uploadedFiles = await uploadSelectedFiles(files);
            await postTransition({ kind, linkUrl, uploadedFiles, note });
          }}
        />
      )}
    </>
  );
}
