"use client";

import React from "react";
import { useTracker } from "@/components/context/tracker-context";
import { buildClientEventPreviewMail, buildClientRemindPreviewMail } from "@/lib/domain/mail-preview";
import { NOTIF_DEFS, type NotifMode, REMIND_DEFS } from "@/lib/domain/rules-metadata";
import { EmailOutboxAndOrgSection } from "./email-outbox-card";
import { ReviewInputCells } from "./review-input-cells";

const NOTIF_MODES: NotifMode[] = ["ทันที", "สรุปรายวัน", "ปิด"];

export function EmailNotifView() {
  const {
    jobs, session, today, holidaySet, notifModes, reviews,
    showMailPopOnSend, setShowMailPopOnSend, setMailModal, updateNotifModeRemote, showToast,
  } = useTracker();

  function exportNotifCsv() {
    const rows: string[][] = [["หมวด", "รายการ", "ส่งถึง", "สำเนา", "รูปแบบ", "ผล Review", "ความเห็น"]];
    NOTIF_DEFS.forEach((n) => {
      const v = reviews[`n:${n.key}`] ?? { st: "", note: "" };
      rows.push(["แจ้งเตือนตามเหตุการณ์", n.whenLabel, n.toDesc, n.ccDesc, notifModes[n.key] ?? n.defaultMode, v.st, v.note]);
    });
    REMIND_DEFS.forEach((r) => {
      const v = reviews[`n:${r[0]}`] ?? { st: "", note: "" };
      rows.push(["แจ้งเตือนตาม SLA", `${r[1]} · ${r[2]}`, r[3], r[4], r[5], v.st, v.note]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `AW_Email_Notification_Review_${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
    showToast("Export ผล Review การแจ้งเตือนแล้ว");
  }

  return (
    <>
      <div className="card" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>การแจ้งเตือนทางอีเมล</h2>
          <div className="hint" style={{ marginTop: 4 }}>ระบบส่งอีเมลผ่าน SMTP ถึงอีเมลจริง (@chg.co.th) เมื่องานถูกส่งต่อ และเตือนเมื่อใกล้ / เกิน SLA</div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontSize: 13 }}>
            <input type="checkbox" checked={showMailPopOnSend} onChange={(e) => setShowMailPopOnSend(e.target.checked)} />
            แสดงป๊อปอัปตัวอย่างอีเมลทุกครั้งที่งานถูกส่งต่อ
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={() => setMailModal({ title: "ตัวอย่างอีเมลสรุปงานรายวัน", digestRole: session.role === "mgmt" ? "designer" : session.role })}>
            ดูตัวอย่างอีเมลสรุปรายวัน
          </button>
          <button type="button" className="btn pri" onClick={exportNotifCsv}>Export ผล Review (Excel)</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>1. แจ้งเตือนเมื่องานถูกส่งต่อ</h2>
        <div className="hint" style={{ marginBottom: 12 }}>ทุกครั้งที่งานเปลี่ยนขั้น ระบบส่งอีเมลถึงผู้ที่ต้องทำต่อ · &quot;สรุปรายวัน&quot; = รวมไว้ในอีเมลเช้า 08:30 แทนการส่งทันที</div>
        <div className="scroll">
          <table className="tbl sm">
            <thead><tr><th>เมื่อ</th><th>ส่งถึง</th><th>สำเนา (CC)</th><th>สิ่งที่ผู้รับต้องทำ</th><th>รูปแบบ</th><th>ตัวอย่าง</th><th>ผล Review</th><th>ความเห็น</th></tr></thead>
            <tbody>
              {NOTIF_DEFS.map((n) => {
                const mode = notifModes[n.key] ?? n.defaultMode;
                return (
                  <tr key={n.key}>
                    <td style={{ whiteSpace: "nowrap" }}><b>{n.whenLabel}</b><div className="hint" style={{ fontSize: 11 }}>{n.key === "_create" ? "Create Job" : `→ ${n.key}`}</div></td>
                    <td>{n.toDesc}</td><td>{n.ccDesc}</td><td>{n.todo}</td>
                    <td>
                      <select aria-label="รูปแบบการส่ง" value={mode} onChange={(e) => void updateNotifModeRemote(n.key, e.target.value as NotifMode)} style={{ border: "1px solid #C9D2DE", borderRadius: 6, padding: "4px 6px", fontSize: 12 }}>
                        {NOTIF_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>
                    <td>
                      <button type="button" className="btn sm" onClick={() => setMailModal({ title: `ตัวอย่างอีเมล · ${n.whenLabel}`, mail: buildClientEventPreviewMail(jobs, n.key, today, holidaySet, mode) })}>ดูอีเมล</button>
                    </td>
                    <ReviewInputCells itemKey={`n:${n.key}`} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>2. แจ้งเตือนตาม SLA</h2>
        <div className="hint" style={{ marginBottom: 12 }}>นับเป็นวันทำงาน · ส่งตอนเช้าวันทำงาน</div>
        <div className="scroll">
          <table className="tbl sm">
            <thead><tr><th>ประเภท</th><th>เงื่อนไข</th><th>ส่งถึง</th><th>สำเนา (CC)</th><th>เวลาส่ง</th><th>ตัวอย่าง</th><th>ผล Review</th><th>ความเห็น</th></tr></thead>
            <tbody>
              {REMIND_DEFS.map((r) => (
                <tr key={r[0]}>
                  <td style={{ whiteSpace: "nowrap" }}><b>{r[1]}</b></td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td>
                  <td>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() =>
                        r[0] === "r4"
                          ? setMailModal({ title: "ตัวอย่างอีเมลสรุปงานรายวัน", digestRole: session.role === "mgmt" ? "designer" : session.role })
                          : setMailModal({ title: `ตัวอย่างอีเมลแจ้งเตือน · ${r[1]}`, mail: buildClientRemindPreviewMail(jobs, r[0], today, holidaySet) })
                      }
                    >
                      ดูอีเมล
                    </button>
                  </td>
                  <ReviewInputCells itemKey={`n:${r[0]}`} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmailOutboxAndOrgSection />
    </>
  );
}
