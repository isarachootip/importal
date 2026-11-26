"use client";

import Link from "next/link";
import React from "react";
import type { OutboxMail } from "@/lib/domain/job-types";
import { fmtThaiDate } from "@/lib/domain/working-days";

export function SingleMailCard({ m, onClose }: { m: OutboxMail; onClose: () => void }) {
  const firstTo = m.to[0] ?? "ผู้เกี่ยวข้อง";
  const greet = /^คุณ/.test(firstTo) ? firstTo : `ทีม ${firstTo.split(" ·")[0]}`;
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", background: "var(--soft)", fontSize: 13, lineHeight: 1.7 }}>
        <div>
          <b>ถึง:</b> {m.to.join(", ")}{" "}
          {m.toEmails.length > 0 && <span className="hint">({m.toEmails.join(", ")})</span>}
        </div>
        {m.cc.length > 0 && (
          <div>
            <b>สำเนา:</b> {m.cc.join(", ")}{" "}
            {m.ccEmails.length > 0 && <span className="hint">({m.ccEmails.join(", ")})</span>}
          </div>
        )}
        <div><b>เรื่อง:</b> {m.subj}</div>
        <div className="hint">
          ส่งจาก: AW Packaging Tracker (no-reply@chg.co.th) · {fmtThaiDate(m.t)} · รูปแบบ: {m.mode}
        </div>
      </div>
      <div style={{ padding: "16px 18px", fontSize: 14, lineHeight: 1.7 }}>
        <p style={{ margin: "0 0 10px" }}>เรียน {greet}</p>
        <p style={{ margin: "0 0 12px" }}>
          {m.head} · งาน <b>{m.pi}</b>
          {m.due ? (
            <> รอคุณดำเนินการ: <b>{m.todo}</b> ภายใน <b style={{ color: "var(--org-d)" }}>{fmtThaiDate(m.due)}</b></>
          ) : (
            ` (${m.todo})`
          )}
        </p>
        <table style={{ borderCollapse: "collapse", fontSize: 13, marginBottom: 12 }}>
          <tbody>
            {m.info.map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: "3px 14px 3px 0", color: "var(--mut)" }}>{k}</td>
                <td style={{ padding: "3px 0" }}><b>{v}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        {m.note && (
          <div className="notice" style={{ marginBottom: 12 }}>
            <b>คอมเมนต์ / เหตุผล</b>
            <br />
            {m.note.split(" | ").map((line, i) => (
              <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
            ))}
          </div>
        )}
        {m.jid && (
          <Link href={`/jobs/${m.jid}`} className="btn pri" onClick={onClose}>
            เปิดงานในระบบ
          </Link>
        )}
        <p className="hint" style={{ margin: "14px 0 0" }}>
          อีเมลนี้ส่งอัตโนมัติผ่าน SMTP · ปรับการแจ้งเตือนได้ที่เมนู &quot;แจ้งเตือน Email&quot;
        </p>
      </div>
    </div>
  );
}
