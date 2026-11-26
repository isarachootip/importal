"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useTracker } from "@/components/context/tracker-context";
import { StatusPill } from "@/components/ui/status-badges";
import { STATUS_COLORS } from "@/lib/domain/aw-constants";
import type { OverallDashboardData } from "@/lib/domain/dashboard-overall";
import { TH_MONTHS_FULL } from "@/lib/domain/working-days";
import { KpiCard, PctBar, pctText, SectionHeading } from "./dash-shared";

const OC_SEGMENTS = [
  ["on", "ทันกำหนด", "#185FA5", "#fff"],
  ["late", "ช้ากว่ากำหนด", "#D85A30", "#fff"],
  ["pOver", "Pending · เลยกำหนดแล้ว", "#EF9F27", "#412402"],
  ["pOk", "Pending · ยังไม่ถึงกำหนด", "#D3D1C7", "#444441"],
] as const;

export function DashOverallSection({ data }: { data: OverallDashboardData }) {
  const router = useRouter();
  const { setFilter, setJobsTab } = useTracker();

  const pendRows = data.statusRows.filter((x) =>
    ["Open", "Draft AW", "Final AW", "Production"].includes(x.s)
  );
  const restRows = data.statusRows.filter((x) => !pendRows.includes(x));
  const pn = pendRows.reduce((a, x) => a + x.n, 0);
  const pit = pendRows.reduce((a, x) => a + x.it, 0);
  const mTotal = data.monthlyRows.reduce((a, x) => a + x.t, 0);
  const mCx = data.monthlyRows.reduce((a, x) => a + x.cx, 0);
  const mOn = data.monthlyRows.reduce((a, x) => a + x.on, 0);
  const mG = data.monthlyRows.reduce((a, x) => a + x.g, 0);

  const goMonth = (yr: string, mo: number) => {
    setFilter((p) => ({ ...p, year: yr, month: String(mo) }));
    setJobsTab("");
    router.push("/jobs");
  };

  return (
    <>
      <SectionHeading num={1} title="ภาพรวมทุกส่วนงาน" sub="Import · MDSG · Designer · Production" />
      <div className="kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <KpiCard label="PI ทั้งหมด" value={data.totalPi} sub={`${data.totalItems.toLocaleString()} items`} color="var(--navy)" />
        <KpiCard label="งานที่ยังค้าง" value={data.pendingCount} sub={`${data.pendingItems.toLocaleString()} items · Open + Draft AW + Final AW`} color="var(--navy)" />
        <KpiCard label="Production" value={data.prodCount} sub={`${data.prodItems.toLocaleString()} items · ส่งโรงงานแล้ว รอสินค้าเข้า`} color="var(--navy)" />
        <KpiCard label="Goods Received" value={data.grCount} sub={`${data.grItems.toLocaleString()} items · สินค้าเข้าแล้ว`} color="#2F8F6B" />
        <KpiCard label="Cancelled (ยกเลิก)" value={data.cancelledCount} sub={`${data.cancelledItems.toLocaleString()} items · ไม่นำไปคิด Performance`} color="#B4410C" />
        <KpiCard label="% On-time Overall" value={pctText(data.grOnTimeCount, data.grCount)} sub={`${data.grOnTimeCount} จาก ${data.grCount} PI ที่สินค้าเข้าแล้ว · PI Approval → Goods Received`} color="var(--blue-d)" />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px 16px", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>① งานเข้ารายเดือน &amp; % On-time</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 12 }}>
            {OC_SEGMENTS.map((o) => (
              <span key={o[0]} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: o[2] }} />
                {o[1]}
              </span>
            ))}
          </div>
        </div>
        <div className="hint" style={{ margin: "4px 0 14px" }}>
          ตามเดือน PI Approval · ความยาวแท่ง = จำนวน PI ของเดือนนั้น · % On-time คิดจาก PI ที่สินค้าเข้าแล้ว · คลิกแถวเพื่อดูรายการ PI
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "110px 44px minmax(0, 1fr) 150px", gap: "0 12px", alignItems: "center", fontSize: 13 }}>
          <div className="hint" style={{ paddingBottom: 6 }}>เดือน PI Approval</div>
          <div className="hint" style={{ textAlign: "right", paddingBottom: 6 }}>PI</div>
          <div />
          <div className="hint" style={{ textAlign: "right", paddingBottom: 6 }}>% On-time</div>
          {data.monthlyRows.map((x) => {
            const mo = Number(x.m.slice(5));
            const yr = x.m.slice(0, 4);
            return (
              <React.Fragment key={x.m}>
                <div onClick={() => goMonth(yr, mo)} style={{ cursor: "pointer", padding: "7px 0", borderTop: "1px solid #EDF0F4" }}>{TH_MONTHS_FULL[mo - 1]} {yr.slice(2)}</div>
                <div onClick={() => goMonth(yr, mo)} style={{ cursor: "pointer", textAlign: "right", fontWeight: 700, padding: "7px 0", borderTop: "1px solid #EDF0F4" }}>{x.t}</div>
                <div onClick={() => goMonth(yr, mo)} style={{ cursor: "pointer", padding: "7px 0", borderTop: "1px solid #EDF0F4" }}>
                  <div style={{ display: "flex", gap: 1, borderRadius: 4, overflow: "hidden", width: `${(x.t / data.monthlyMax) * 100}%`, minWidth: 4 }}>
                    {OC_SEGMENTS.filter((o) => x[o[0]] > 0).map((o) => (
                      <div key={o[0]} title={`${o[1]}: ${x[o[0]]}`} style={{ flex: x[o[0]], height: 20, background: o[2], color: o[3], fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {x[o[0]] / data.monthlyMax > 0.05 ? x[o[0]] : ""}
                      </div>
                    ))}
                  </div>
                </div>
                <div onClick={() => goMonth(yr, mo)} style={{ cursor: "pointer", textAlign: "right", padding: "7px 0", borderTop: "1px solid #EDF0F4" }}>
                  {x.g ? <><b style={{ fontSize: 15, color: x.on / x.g >= 0.8 ? "var(--blue-d)" : "var(--org-d)" }}>{Math.round((x.on / x.g) * 100)}%</b> <span className="hint">{x.on}/{x.g}</span></> : <span className="chip neu">ยังไม่มีงานเข้า</span>}
                </div>
              </React.Fragment>
            );
          })}
          <div style={{ padding: "8px 0", borderTop: "2px solid #C9D2DE", fontWeight: 700 }}>รวม</div>
          <div style={{ textAlign: "right", fontWeight: 700, padding: "8px 0", borderTop: "2px solid #C9D2DE" }}>{mTotal}</div>
          <div style={{ padding: "8px 0", borderTop: "2px solid #C9D2DE" }}>
            <b>{mTotal} PI</b>{mCx > 0 && <span style={{ color: "var(--mut)" }}> (+ ยกเลิก {mCx} = {mTotal + mCx})</span>}
            <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 2 }}>
              {OC_SEGMENTS.map((o, i) => (
                <React.Fragment key={o[0]}>{i > 0 && " · "}{o[1]} <b style={{ color: "var(--ink)" }}>{data.monthlyRows.reduce((a, x) => a + x[o[0]], 0)}</b></React.Fragment>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", padding: "8px 0", borderTop: "2px solid #C9D2DE" }}>
            {mG ? <><b style={{ fontSize: 15 }}>{Math.round((mOn / mG) * 100)}%</b> <span className="hint">{mOn}/{mG}</span></> : "–"}
          </div>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 16, alignItems: "start" }}>
        <div className="card">
          <h2>② งาน Pending อยู่สถานะไหน</h2>
          <div className="hint" style={{ marginBottom: 12 }}>Pending = Open + Draft AW + Final AW + Production · คลิกแถวเพื่อดูรายการงาน</div>
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Status</th><th className="r">Number PI</th><th className="r">%PI</th><th style={{ width: "28%" }} /><th className="r">Number Items</th><th className="r">%Item</th></tr></thead>
              <tbody>
                {pendRows.map((x) => (
                  <tr key={x.s} className="click" onClick={() => { setJobsTab(x.s); router.push("/jobs"); }}>
                    <td><StatusPill status={x.s} /></td><td className="r">{x.n}</td><td className="r">{pctText(x.n, data.totalPi)}</td>
                    <td><div className="bar"><div style={{ width: `${data.totalPi ? (x.n / data.totalPi) * 100 : 0}%`, background: STATUS_COLORS[x.s] }} /></div></td>
                    <td className="r">{x.it.toLocaleString()}</td><td className="r">{pctText(x.it, data.totalItems)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#F4F7FD" }}>
                  <td><b>รวม Pending</b> <span className="hint">ยังไม่รับสินค้า</span></td><td className="r"><b>{pn}</b></td><td className="r"><b>{pctText(pn, data.totalPi)}</b></td><td /><td className="r"><b>{pit.toLocaleString()}</b></td><td className="r"><b>{pctText(pit, data.totalItems)}</b></td>
                </tr>
                {restRows.map((x) => (
                  <tr key={x.s} className="click" onClick={() => { setJobsTab(x.s); router.push("/jobs"); }}>
                    <td><StatusPill status={x.s} /></td><td className="r">{x.n}</td><td className="r">{pctText(x.n, data.totalPi)}</td>
                    <td><div className="bar"><div style={{ width: `${data.totalPi ? (x.n / data.totalPi) * 100 : 0}%`, background: STATUS_COLORS[x.s] }} /></div></td>
                    <td className="r">{x.it.toLocaleString()}</td><td className="r">{pctText(x.it, data.totalItems)}</td>
                  </tr>
                ))}
                <tr className="tot"><td>รวม</td><td className="r">{data.totalPi}</td><td className="r">100%</td><td /><td className="r">{data.totalItems.toLocaleString()}</td><td className="r">100%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>③ Pending ค้างที่ขั้นไหน / รอใคร</h2>
          <div className="hint" style={{ marginBottom: 12 }}>แยกตาม Sub Status · ตัวเลขสีส้ม = จำนวนที่เกิน SLA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {data.subBottlenecks.length > 0 ? data.subBottlenecks.map((x) => (
              <div key={x.s} style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr) 34px 60px", gap: 10, alignItems: "center", fontSize: 13 }}>
                <div><b>{x.s}</b><div className="hint" style={{ fontSize: 11 }}>{x.rolesLabel}</div></div>
                <div className="bar" style={{ height: 14 }}><div style={{ width: `${(x.n / data.subMax) * 100}%`, background: "#5B8BD0" }} /></div>
                <b style={{ textAlign: "right" }}>{x.n}</b>
                <span style={{ textAlign: "right", color: "var(--org-d)", fontWeight: 600, fontSize: 12 }}>{x.o ? `${x.o} เกิน` : ""}</span>
              </div>
            )) : <div className="hint">ไม่มีงานค้าง</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>④ On-time Overall</h2>
        <div className="hint" style={{ marginBottom: 12 }}>นับจากวันอนุมัติ PI → Goods Received · เฉพาะ PI ที่สินค้าเข้าแล้ว · รวมเวลาขอ TISI +90 วัน / อย. +60 วัน</div>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Pattern</th><th>Case</th><th className="r">SLA ตั้งต้น (วัน)</th><th className="r">สินค้าเข้าแล้ว</th><th className="r">On-time</th><th className="r">Delay</th><th style={{ width: "18%" }}>%On-time</th><th className="r">เฉลี่ยจริง</th><th className="r">Delay เฉลี่ย</th></tr></thead>
            <tbody>
              {data.overallPatternRows.map((x) => (
                <tr key={x.p.id}>
                  <td className="hint">{x.p.grp}</td><td style={{ whiteSpace: "nowrap" }}><b>{x.p.name}</b></td><td className="r">{x.p.total}</td><td className="r">{x.n}</td>
                  <td className="r" style={{ color: "var(--blue-d)", fontWeight: 600 }}>{x.on}</td><td className="r" style={{ color: "var(--org-d)", fontWeight: 600 }}>{x.n - x.on}</td>
                  <td><PctBar on={x.on} total={x.n} /></td><td className="r">{x.avg ?? "–"}</td><td className="r">{x.dl ?? "–"}</td>
                </tr>
              ))}
              <tr className="tot"><td /><td>รวม</td><td /><td className="r">{data.grCount}</td><td className="r">{data.grOnTimeCount}</td><td className="r">{data.grCount - data.grOnTimeCount}</td><td>{pctText(data.grOnTimeCount, data.grCount)}</td><td /><td /></tr>
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 15, margin: "18px 0 8px" }}>แยกตามการขอใบอนุญาต</h2>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>ใบอนุญาต</th><th className="r">บวกเวลาเพิ่ม (วัน)</th><th className="r">สินค้าเข้าแล้ว</th><th className="r">On-time</th><th className="r">Delay</th><th style={{ width: "18%" }}>%On-time</th><th className="r">เฉลี่ยจริง</th><th className="r">SLA เฉลี่ย (ปรับแล้ว)</th></tr></thead>
            <tbody>
              {data.licenseRows.map((x) => (
                <tr key={x.l}>
                  <td><b>{x.l === "ไม่มี" ? "ไม่ขอใบอนุญาต" : x.l}</b></td><td className="r">{x.add ? `+${x.add}` : "–"}</td><td className="r">{x.n}</td>
                  <td className="r" style={{ color: "var(--blue-d)", fontWeight: 600 }}>{x.on}</td><td className="r" style={{ color: "var(--org-d)", fontWeight: 600 }}>{x.n - x.on}</td>
                  <td><PctBar on={x.on} total={x.n} /></td><td className="r">{x.avg ?? "–"}</td><td className="r">{x.sla ?? "–"}</td>
                </tr>
              ))}
              <tr className="tot"><td>รวม</td><td /><td className="r">{data.grCount}</td><td className="r">{data.grOnTimeCount}</td><td className="r">{data.grCount - data.grOnTimeCount}</td><td>{pctText(data.grOnTimeCount, data.grCount)}</td><td /><td /></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
