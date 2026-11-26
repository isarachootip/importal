"use client";

import React from "react";
import { useTracker } from "@/components/context/tracker-context";
import { fmtThaiDate } from "@/lib/domain/working-days";

export function EmailOutboxAndOrgSection() {
  const { outbox, setMailModal } = useTracker();

  return (
    <>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>3. ข้อมูลองค์กรที่เชื่อมต่อแล้ว</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "6px 28px", fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
          <div><b>รายชื่อผู้ใช้จริง:</b> เชื่อมต่อ Designer 5 ท่าน, Import 30 ท่าน, EVP (K.Chodok) และ Photo Team พร้อมอีเมล @chg.co.th</div>
          <div><b>MDSG (56 ท่าน):</b> ผูก Buyer (DIV) / GM / VP เข้ากับรหัส Sdept ทั้ง 44 แผนกอัตโนมัติ</div>
          <div><b>ช่องทางส่ง:</b> ส่งผ่าน SMTP (Nodemailer / Mailpit) จากบัญชี no-reply@chg.co.th</div>
          <div><b>ลิงก์ในอีเมล:</b> เปิดตรงเข้าหน้ารายละเอียดงาน (/jobs/[id]) ได้ทันที</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>4. ประวัติอีเมลที่ระบบส่ง (บันทึกในฐานข้อมูล)</h2>
        <div className="hint" style={{ marginBottom: 12 }}>
          {outbox.length} ฉบับ · บันทึกทุกครั้งที่มีการแจ้งงานใหม่หรือส่งต่องาน
        </div>
        <div className="scroll">
          <table className="tbl sm">
            <thead>
              <tr><th>วันที่</th><th>ถึง</th><th>สำเนา</th><th>เรื่อง</th><th>รูปแบบ</th><th>สถานะ SMTP</th><th /></tr>
            </thead>
            <tbody>
              {outbox.length > 0 ? (
                outbox.map((m) => (
                  <tr key={m.id}>
                    <td>{fmtThaiDate(m.t)}</td>
                    <td>{m.to.join(", ")}</td>
                    <td className="hint">{m.cc.join(", ") || "–"}</td>
                    <td>{m.subj}</td>
                    <td>{m.mode}</td>
                    <td><span className={`chip ${m.smtpDelivered ? "ok" : "neu"}`}>{m.smtpDelivered ? "ส่งแล้ว" : "บันทึก Log"}</span></td>
                    <td>
                      <button type="button" className="btn sm" onClick={() => setMailModal({ title: "อีเมลที่ระบบส่ง", mail: m })}>
                        เปิด
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="hint">ยังไม่มี · ลองแจ้งงานใหม่ หรือกดดำเนินงานในงานใดก็ได้</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
