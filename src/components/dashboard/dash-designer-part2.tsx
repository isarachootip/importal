"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { NEXT_ACTION_LABEL, sdeptLabel, SUB_MAP } from "@/lib/domain/aw-constants";
import type { DesignerDashboardData } from "@/lib/domain/dashboard-designer";
import { fmtThaiDate } from "@/lib/domain/working-days";

export function DashDesignerPart2({ data }: { data: DesignerDashboardData }) {
  const router = useRouter();
  const od = data.unsubmittedFinalAw;
  const totalItems = od.reduce((a, r) => a + r.job.items, 0);

  const renderDelta = (v: number) =>
    v > 0 ? <b style={{ color: "var(--org-d)" }}>+{v}</b> : v < 0 ? <span style={{ color: "var(--blue-d)" }}>{v}</span> : <span className="hint">0</span>;

  return (
    <>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>⑧ Delay เกิดที่ขั้นไหน</h2>
          <div className="hint" style={{ marginBottom: 14 }}>วันเฉลี่ยจริงต่อขั้น เทียบเส้น SLA (│) · สีส้ม = เกิน SLA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {data.stepDelayRows.map((x) => (
              <div key={x.s} style={{ display: "grid", gridTemplateColumns: "130px minmax(0, 1fr) 84px", gap: 10, alignItems: "center", fontSize: 13 }}>
                <div><b>{x.s}</b><div className="hint" style={{ fontSize: 11 }}>{x.rolesLabel}</div></div>
                <div style={{ position: "relative", height: 14, borderRadius: 4, background: "#EDF0F4" }}>
                  <div style={{ height: 14, borderRadius: 4, width: `${Math.min(100, (x.avg / data.stepDelayMax) * 100)}%`, background: x.avg > x.sla ? "var(--org)" : "var(--blue)" }} />
                  <div style={{ position: "absolute", top: -3, bottom: -3, width: 2, background: "var(--ink)", left: `${Math.min(100, (x.sla / data.stepDelayMax) * 100)}%` }} />
                </div>
                <div style={{ textAlign: "right", fontSize: 12 }}><b>{x.avg} วัน</b><span className="hint"> / {x.sla}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>⑨ เหตุผลที่ตีกลับ Draft</h2>
          <div className="hint" style={{ marginBottom: 14 }}>จาก Reason (Dropdown) ตอน Fail / ไม่อนุมัติ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {data.reasonRows.length > 0 ? data.reasonRows.map(([k, n]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "200px minmax(0, 1fr) 30px", gap: 10, alignItems: "center", fontSize: 13 }}>
                <span>{k}</span>
                <div className="bar" style={{ height: 14 }}><div style={{ width: `${(n / data.reasonMax) * 100}%`, background: "var(--org)" }} /></div>
                <b style={{ textAlign: "right" }}>{n}</b>
              </div>
            )) : <div className="hint">ยังไม่มีการตีกลับ</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>⑩ งานที่ยังไม่ส่ง Final AW</h2>
        <div className="hint" style={{ marginBottom: 12 }}>{od.length} งาน · {totalItems.toLocaleString()} items · เรียงจาก Final AW ช้าที่สุด · ตามตัวกรองส่วนที่ 2 · คลิกเพื่อเปิดงาน</div>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>PI No.</th><th>PI Approval</th><th>House Brand · Sdept</th><th className="r">Items</th><th>Status</th><th>ค้างที่</th><th>ขั้นตอนถัดไป</th>
                <th style={{ borderLeft: "2px solid #fff" }}>กำหนดส่ง Final AW</th><th className="r">+/- Day</th>
                <th style={{ borderLeft: "2px solid #fff" }}>กำหนดสินค้าเข้า</th><th className="r">+/- Day</th>
                <th style={{ borderLeft: "2px solid #fff" }}>Designer</th><th>Import</th>
              </tr>
            </thead>
            <tbody>
              {od.length > 0 ? od.map((r) => (
                <tr key={r.job.id} className="click" onClick={() => router.push(`/jobs/${r.job.id}`)}>
                  <td style={{ whiteSpace: "nowrap" }}><a href={`/jobs/${r.job.id}`} onClick={(e) => e.preventDefault()}>{r.job.pi}</a></td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtThaiDate(r.job.piDate)}</td>
                  <td>{r.job.brand}<div className="hint" style={{ fontSize: 11 }}>{r.job.sdepts.map(sdeptLabel).join(" / ")}</div></td>
                  <td className="r">{r.job.items}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{r.status}<div className="hint" style={{ fontSize: 11 }}>{r.sub}{r.rounds > 0 ? ` · แก้ ${r.rounds} รอบ` : ""}</div></td>
                  <td>{r.owner}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{NEXT_ACTION_LABEL[r.sub] ?? SUB_MAP[r.sub].label}</td>
                  <td style={{ whiteSpace: "nowrap", borderLeft: "2px solid #EDF0F4" }}>{fmtThaiDate(r.awDueIso)}</td>
                  <td className="r">{renderDelta(r.awDelta)}</td>
                  <td style={{ whiteSpace: "nowrap", borderLeft: "2px solid #EDF0F4" }}>{fmtThaiDate(r.grDueIso)}{r.licAdd > 0 && <div className="hint" style={{ fontSize: 11 }}>{r.job.license} +{r.licAdd}</div>}</td>
                  <td className="r">{renderDelta(r.grDelta)}</td>
                  <td style={{ borderLeft: "2px solid #EDF0F4" }}>{r.job.designer}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{r.job.importer}</td>
                </tr>
              )) : <tr><td colSpan={13} className="hint">ไม่มีงานที่ยังไม่ส่ง Final AW</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="hint" style={{ marginTop: 10, lineHeight: 1.7 }}>
          <b>กำหนดส่ง Final AW</b> = PI Approval + SLA Info + SLA AW (+7 วันถ้าถ่ายรูปใหม่, +7 วันทุก 30 SKUs) · <b>กำหนดสินค้าเข้า</b> = PI Approval + SLA รวม (รวม TISI +90 / อย. +60)<br />
          <b>+/- Day</b>: <b style={{ color: "var(--org-d)" }}>+</b> = ช้ากว่ากำหนดแล้วกี่วัน · <span style={{ color: "var(--blue-d)" }}>−</span> = เหลือเวลาอีกกี่วัน
        </div>
      </div>
    </>
  );
}
