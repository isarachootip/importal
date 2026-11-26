"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { CANCEL_REASONS, NEXT_ACTION_LABEL, ROLES_META, SUB_MAP } from "@/lib/domain/aw-constants";
import type { OutboxMail } from "@/lib/domain/job-types";
import { curSub, dayInStage, isOverdue, slaOf, stageStart } from "@/lib/domain/sla-engine";
import { addWorkingDays, fmtThaiDate } from "@/lib/domain/working-days";
import { SingleMailCard } from "./single-mail-card";
import { SlaChip } from "./status-badges";

export function OverlayModalsLayer() {
  const {
    jobs,
    today,
    holidaySet,
    mailPop,
    setMailPop,
    mailModal,
    setMailModal,
    cancelJobId,
    setCancelJobId,
    toast,
    showToast,
    upsertJobState,
  } = useTracker();

  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState("");
  const [busy, setBusy] = useState(false);
  const cancelJob = cancelJobId ? jobs.find((j) => j.id === cancelJobId) : null;

  async function submitCancel() {
    if (!cancelJob) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${cancelJob.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "cancel", reason: cancelReason, note: cancelNote }),
      });
      const data = (await res.json()) as { job?: typeof cancelJob; mail?: OutboxMail | null; toast?: string; error?: string };
      if (!res.ok || !data.job) throw new Error(data.error ?? "ยกเลิกงานไม่สำเร็จ");
      upsertJobState(data.job, data.mail);
      setCancelJobId(null);
      setCancelNote("");
      showToast(data.toast ?? "บันทึกการยกเลิกงานแล้ว");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  const digestRole = mailModal?.digestRole;
  const digestJobs = digestRole
    ? jobs
        .filter((j) => SUB_MAP[curSub(j)].roles.includes(digestRole))
        .sort((a, b) => (slaOf(a) ?? 999) - dayInStage(a, today, holidaySet) - ((slaOf(b) ?? 999) - dayInStage(b, today, holidaySet)))
    : [];

  return (
    <>
      {cancelJob && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setCancelJobId(null); }}>
          <div className="modal">
            <h2 style={{ margin: 0, fontSize: 18, color: "var(--navy)" }}>ยกเลิกงาน (Cancelled) · {cancelJob.pi}</h2>
            <div className="hint">งานที่ยกเลิกจะไม่ถูกนำไปคิด Performance</div>
            <label className="fld">
              เหตุผล
              <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="fld">
              รายละเอียดเพิ่มเติม
              <textarea rows={3} maxLength={1000} value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} />
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setCancelJobId(null)}>ยกเลิก</button>
              <button type="button" className="btn pri" disabled={busy} onClick={submitCancel}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {mailModal && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setMailModal(null); }}>
          <div className="modal" style={{ width: "min(680px, 100%)", maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 17, color: "var(--navy)" }}>{mailModal.title}</h2>
              <button type="button" className="btn sm" onClick={() => setMailModal(null)}>ปิด</button>
            </div>
            {mailModal.mail && <SingleMailCard m={mailModal.mail} onClose={() => setMailModal(null)} />}
            {digestRole && (
              <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "var(--soft)", fontSize: 13, lineHeight: 1.7 }}>
                  <div><b>ถึง:</b> {ROLES_META[digestRole].defaultUser}</div>
                  <div><b>เรื่อง:</b> [AW] สรุปงานที่รอคุณ {fmtThaiDate(today)} · {digestJobs.length} งาน (เกิน SLA {digestJobs.filter((j) => isOverdue(j, today, holidaySet)).length})</div>
                  <div className="hint">ส่งทุกวันทำงาน 08:30</div>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <table className="tbl sm">
                    <thead><tr><th>PI</th><th>House Brand</th><th>สิ่งที่ต้องทำ</th><th>ครบกำหนด</th><th className="r">สถานะ</th></tr></thead>
                    <tbody>
                      {digestJobs.length > 0 ? digestJobs.map((j) => (
                        <tr key={j.id}>
                          <td><Link href={`/jobs/${j.id}`} onClick={() => setMailModal(null)}>{j.pi}</Link></td>
                          <td>{j.brand}</td>
                          <td>{NEXT_ACTION_LABEL[curSub(j)] ?? SUB_MAP[curSub(j)].label}</td>
                          <td>{fmtThaiDate(addWorkingDays(stageStart(j), slaOf(j) ?? 1, holidaySet))}</td>
                          <td className="r"><SlaChip job={j} today={today} holidays={holidaySet} /></td>
                        </tr>
                      )) : <tr><td colSpan={5} className="hint">ไม่มีงานรอ</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mailPop && !mailModal && (
        <div
          role="status"
          style={{
            position: "fixed", right: 24, bottom: toast ? 84 : 24, zIndex: 45,
            width: "min(380px, calc(100vw - 48px))", background: "#fff", border: "1px solid #9DB5E0",
            borderRadius: 12, boxShadow: "0 10px 30px rgba(31,58,95,.18)", padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <span className="chip ok">{mailPop.smtpDelivered ? "ส่งอีเมลแล้ว (SMTP)" : "อีเมลแจ้งเตือน"}</span>
            <button type="button" className="btn sm" style={{ padding: "2px 8px" }} onClick={() => setMailPop(null)}>✕</button>
          </div>
          <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
            <b>ถึง:</b> {mailPop.to.join(", ")}
            {mailPop.cc.length > 0 && <><br /><b>สำเนา:</b> {mailPop.cc.join(", ")}</>}
            <br /><b>{mailPop.subj}</b>
          </div>
          <button type="button" className="btn sm pri" style={{ marginTop: 10 }} onClick={() => { setMailModal({ title: "รายละเอียดอีเมลที่ระบบส่ง", mail: mailPop }); setMailPop(null); }}>
            ดูอีเมล
          </button>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
