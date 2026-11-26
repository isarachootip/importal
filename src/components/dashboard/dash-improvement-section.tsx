"use client";

import React from "react";
import type {
  DepartmentImprovementCard,
  PhaseSummary,
  StepStatSummary,
} from "@/lib/domain/dashboard-improvement";
import { pctText, SectionHeading } from "./dash-shared";

function f1(v: number | null | undefined): string {
  if (v == null) return "–";
  return (Math.round(v * 10) / 10).toLocaleString();
}

function DeltaChip({ avg, sla }: { avg: number; sla: number }) {
  const d = avg - sla;
  if (d > 0.05) return <span className="chip bad">+{f1(d)} วัน</span>;
  return <span className="chip ok">{d < -0.05 ? `−${f1(-d)} วัน` : "ตามมาตรฐาน"}</span>;
}

function TrendLabel({ stat }: { stat: StepStatSummary }) {
  if (stat.rec == null || stat.old == null) return <span className="hint">ข้อมูลไม่พอ</span>;
  const d = stat.rec - stat.old;
  if (Math.abs(d) < 0.3) return <span className="hint">ทรงตัว</span>;
  if (d < 0) {
    return <span style={{ color: "var(--blue-d)", fontWeight: 600 }}>▼ ดีขึ้น {f1(-d)} วัน</span>;
  }
  return <span style={{ color: "var(--org-d)", fontWeight: 600 }}>▲ ช้าลง {f1(d)} วัน</span>;
}

export function DashImprovementSection({
  phases,
  departments,
}: {
  phases: PhaseSummary[];
  departments: DepartmentImprovementCard[];
}) {
  return (
    <>
      <SectionHeading
        num={3}
        title="มุมมอง Improvement · ระยะเวลาแต่ละขั้นเทียบมาตรฐาน"
        sub="หน่วยเป็นวันทำงาน · นับเฉพาะขั้นที่ทำเสร็จแล้ว · ใช้ตัวกรองด้านบนสุด"
      />
      <div className="kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {phases.map((p) => (
          <div key={p.k} className="card kpi">
            <div className="l">{p.k}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span
                className="v"
                style={{ color: p.avg > p.sla ? "var(--org-d)" : "var(--blue-d)" }}
              >
                {f1(p.avg)}
              </span>
              <span className="hint">วัน · มาตรฐาน {f1(p.sla)}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <DeltaChip avg={p.avg} sla={p.sla} />{" "}
              <span className="hint">
                ทัน {pctText(p.ok, p.n)} · {p.n} PI
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        {departments.map((dept) => (
          <div key={dept.roleKey} className="card">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <h2 style={{ margin: 0 }}>{dept.name}</h2>
              <span className={`chip ${dept.overCount > 0 ? "bad" : "ok"}`}>
                {dept.overCount > 0
                  ? `เกินมาตรฐาน ${dept.overCount} จาก ${dept.totalWithSla} ขั้น`
                  : "ทุกขั้นอยู่ในมาตรฐาน"}
              </span>
            </div>
            {dept.worstStep && (
              <div className="hint" style={{ marginTop: 4 }}>
                ควรปรับก่อน: <b style={{ color: "var(--org-d)" }}>{dept.worstStep.lab}</b> เฉลี่ยเกิน{" "}
                {f1(dept.worstStep.diff)} วัน · ทันมาตรฐาน {dept.worstStep.okPct} ของครั้งทั้งหมด
              </div>
            )}
            <div className="scroll" style={{ marginTop: 10 }}>
              <table className="tbl sm">
                <thead>
                  <tr>
                    <th>ขั้นตอน</th>
                    <th className="r">มาตรฐาน</th>
                    <th className="r">เฉลี่ยจริง</th>
                    <th style={{ width: "22%" }}>เทียบมาตรฐาน (│)</th>
                    <th>สูง / ต่ำกว่า</th>
                    <th className="r">% ทัน</th>
                    <th>3 เดือนล่าสุด vs ก่อนหน้า</th>
                    <th className="r">ครั้ง</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.rows.map(({ k, lab, subHint, stat }) =>
                    stat.sla == null ? (
                      <tr key={k}>
                        <td style={{ whiteSpace: "nowrap", paddingLeft: 22 }}>{lab}</td>
                        <td className="r hint">–</td>
                        <td className="r">{f1(stat.avg)}</td>
                        <td>
                          <div className="bar" style={{ height: 8 }}>
                            <div
                              style={{
                                width: `${Math.min((stat.avg / dept.maxVal) * 100, 100)}%`,
                                background: "#9DB5E0",
                              }}
                            />
                          </div>
                        </td>
                        <td className="hint">สัดส่วนในเวลารวม</td>
                        <td />
                        <td />
                        <td className="r hint">{stat.n}</td>
                      </tr>
                    ) : (
                      <tr key={k}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <b>{lab}</b>
                          <div className="hint" style={{ fontSize: 11 }}>{subHint}</div>
                        </td>
                        <td className="r">{f1(stat.sla)}</td>
                        <td className="r"><b>{f1(stat.avg)}</b></td>
                        <td>
                          <div style={{ position: "relative", height: 12, borderRadius: 4, background: "#EDF0F4" }}>
                            <div
                              style={{
                                height: 12,
                                borderRadius: 4,
                                width: `${Math.min((stat.avg / dept.maxVal) * 100, 100)}%`,
                                background: stat.avg > stat.sla ? "var(--org)" : "var(--blue)",
                              }}
                            />
                            <div
                              title={`มาตรฐาน ${f1(stat.sla)} วัน`}
                              style={{
                                position: "absolute",
                                top: -3,
                                bottom: -3,
                                width: 2,
                                background: "var(--ink)",
                                left: `${Math.min((stat.sla / dept.maxVal) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <DeltaChip avg={stat.avg} sla={stat.sla} />
                        </td>
                        <td className="r">{pctText(stat.ok ?? 0, stat.n)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <TrendLabel stat={stat} />
                        </td>
                        <td className="r hint">{stat.n}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <div className="hint" style={{ marginTop: 10, lineHeight: 1.7 }}>
        มาตรฐาน = SLA ของขั้นตอน (เตรียมข้อมูล Old SKU 2 / New SKU 7 วัน · Import + MDSG ตรวจ Draft รวม 2 วัน · Production = Leadtime ที่ Import กรอก + 20 วัน) · นับเป็นวันทำงาน ไม่รวมเสาร์-อาทิตย์และวันหยุดประจำปี
      </div>
    </>
  );
}
