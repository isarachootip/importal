"use client";

import React, { useMemo } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { BRANDS, DESIGNER_NAMES, IMPORTER_NAMES, sdeptLabel } from "@/lib/domain/aw-constants";
import type { DesignerDashboardData } from "@/lib/domain/dashboard-designer";
import { KpiCard, PctBar, pctText, SectionHeading } from "./dash-shared";

export function DashDesignerPart1({ data }: { data: DesignerDashboardData }) {
  const { jobs, dash2Filter, setDash2Filter } = useTracker();

  const sdAll = useMemo(() => {
    const codes = [...new Set(jobs.flatMap((j) => j.sdepts))].sort((a, b) => a - b);
    return codes.map((c): [number, string] => [c, sdeptLabel(c)]);
  }, [jobs]);

  const d2on = Object.values(dash2Filter).some(Boolean);
  const mineSum = data.workloadRows.reduce((a, x) => a + x.mine, 0);
  const odSum = data.workloadRows.reduce((a, x) => a + x.od, 0);
  const exNote = data.licenseIncludedCount
    ? ` · รวมงานที่ขอ TISI / อย. ${data.licenseIncludedCount} งาน (ใบอนุญาตไม่กระทบช่วงออกแบบ จึงไม่บวกเวลาเพิ่ม)`
    : "";

  const renderChips = (arr: Array<[string, number]>, neutral?: boolean) =>
    arr.length > 0 ? (
      arr.map(([s, n]) => (
        <span key={s} className={`chip ${neutral ? "neu" : "ok"}`} style={{ margin: "2px 4px 2px 0" }}>
          {s} {n}
        </span>
      ))
    ) : (
      <span className="hint">–</span>
    );

  return (
    <>
      <SectionHeading
        num={2}
        title="ภาพรวมงาน Designer และ Photographer"
        sub="นับจากวันยืนยัน Info Complete → Final AW"
      />
      <div
        className="card filters"
        style={{
          padding: "14px 16px",
          marginBottom: 16,
          borderColor: d2on ? "#9DB5E0" : "var(--line)",
          background: d2on ? "#F4F7FD" : "#fff",
        }}
      >
        <div className="full" style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
          ตัวกรองของส่วนที่ 2{" "}
          <span className="hint" style={{ fontWeight: 400 }}>
            · ใช้กับทุกตาราง ⑤–⑩ เพิ่มจากตัวกรองด้านบนสุด (Year / Month)
          </span>
        </div>
        <label className="fl">
          Sdept
          <SearchableSelect ariaLabel="Sdept ส่วนที่ 2" value={dash2Filter.sdept} options={sdAll} allLabel="ทั้งหมด" onChange={(v) => setDash2Filter((p) => ({ ...p, sdept: v }))} />
        </label>
        <label className="fl">
          Designer
          <SearchableSelect ariaLabel="Designer ส่วนที่ 2" value={dash2Filter.designer} options={DESIGNER_NAMES} allLabel="ทั้งหมด" onChange={(v) => setDash2Filter((p) => ({ ...p, designer: v }))} />
        </label>
        <label className="fl">
          Import
          <SearchableSelect ariaLabel="Import ส่วนที่ 2" value={dash2Filter.importer} options={IMPORTER_NAMES} allLabel="ทั้งหมด" onChange={(v) => setDash2Filter((p) => ({ ...p, importer: v }))} />
        </label>
        <label className="fl">
          House Brand
          <SearchableSelect ariaLabel="House Brand ส่วนที่ 2" value={dash2Filter.brand} options={BRANDS} allLabel="ทั้งหมด" onChange={(v) => setDash2Filter((p) => ({ ...p, brand: v }))} />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => setDash2Filter({ sdept: "", designer: "", importer: "", brand: "" })}
          >
            ล้างตัวกรองส่วนที่ 2
          </button>
        </div>
      </div>

      <div className="card">
        <h2>⑤ งานค้างอยู่ที่ Designer ท่านใด</h2>
        <div className="hint" style={{ marginBottom: 12 }}>
          งานทั้งหมด = PI ที่มอบหมาย · ค้างที่ Designer = งานที่ Designer ต้องทำต่อ · รอคนอื่น = รอ Import / MDSG / EVP / Photographer
        </div>
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Designer</th>
                <th className="r">งานทั้งหมด</th>
                <th className="r">ค้างที่ Designer</th>
                <th className="r">เกิน SLA</th>
                <th>สถานะงานที่ค้าง</th>
                <th className="r">รอคนอื่น</th>
                <th>รออยู่ที่</th>
                <th className="r">Final AW แล้ว</th>
              </tr>
            </thead>
            <tbody>
              {data.workloadRows.map((x) => (
                <tr key={x.n}>
                  <td style={{ whiteSpace: "nowrap" }}><b>{x.n}</b></td>
                  <td className="r">{x.all}</td>
                  <td className="r"><b>{x.mine}</b></td>
                  <td className="r" style={{ color: "var(--org-d)", fontWeight: 700 }}>{x.od || "–"}</td>
                  <td>{renderChips(x.by)}</td>
                  <td className="r">{x.wait}</td>
                  <td>{renderChips(x.wby, true)}</td>
                  <td className="r">{x.done}</td>
                </tr>
              ))}
              <tr className="tot">
                <td>รวม Designer</td>
                <td className="r">{data.workloadRows.reduce((a, x) => a + x.all, 0)}</td>
                <td className="r">{mineSum}</td>
                <td className="r">{odSum}</td>
                <td />
                <td className="r">{data.workloadRows.reduce((a, x) => a + x.wait, 0)}</td>
                <td />
                <td className="r">{data.workloadRows.reduce((a, x) => a + x.done, 0)}</td>
              </tr>
              <tr>
                <td style={{ whiteSpace: "nowrap" }}>
                  <b>Photographer</b> <span className="hint">(Photo Team)</span>
                </td>
                <td className="r">{data.photoAll}</td>
                <td className="r"><b>{data.photoNow}</b></td>
                <td className="r" style={{ color: "var(--org-d)", fontWeight: 700 }}>{data.photoOverdue || "–"}</td>
                <td>{renderChips(data.photoNow ? [["Photo Shoot", data.photoNow]] : [])}</td>
                <td className="r">–</td>
                <td />
                <td className="r">{data.photoAll - data.photoNow}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="kpis" style={{ marginTop: 16 }}>
        <KpiCard label="% On-time Designer" value={pctText(data.awOnTimeCount, data.awDoneCount)} sub={`${data.awOnTimeCount} จาก ${data.awDoneCount} AW · นับจากวันยืนยัน Info Complete → Final AW`} color="var(--blue-d)" />
        <KpiCard label="งานค้างที่ Designer" value={mineSum} sub={`เกิน SLA ${odSum} งาน`} color="var(--navy)" />
        <KpiCard label="งานค้างที่ Photographer" value={data.photoNow} sub={`ถ่ายรูปไปแล้ว ${data.photoAll - data.photoNow} งาน`} color="var(--navy)" />
        <KpiCard label="รอบแก้เฉลี่ย" value={data.avgRounds} sub="ครั้งต่องาน (Import/MDSG + EVP)" color="var(--navy)" />
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>⑥ Designer Performance ตาม Pattern</h2>
          <div className="hint" style={{ marginBottom: 12 }}>นับจาก Confirm Info Complete → Submit Final AW{exNote}</div>
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Case</th><th className="r">SLA AW</th><th className="r">AW เสร็จ</th><th className="r">On-time</th><th className="r">Delay</th><th style={{ width: "26%" }}>%On-time</th><th className="r">เฉลี่ยจริง</th></tr></thead>
              <tbody>
                {data.patternRows.map((x) => (
                  <tr key={x.p.id}>
                    <td style={{ whiteSpace: "nowrap" }}><b>{x.p.name}</b></td><td className="r">{x.p.aw}</td><td className="r">{x.n}</td>
                    <td className="r" style={{ color: "var(--blue-d)", fontWeight: 600 }}>{x.on}</td><td className="r" style={{ color: "var(--org-d)", fontWeight: 600 }}>{x.n - x.on}</td>
                    <td><PctBar on={x.on} total={x.n} /></td><td className="r">{x.avg ?? "–"}</td>
                  </tr>
                ))}
                <tr className="tot"><td>รวม</td><td /><td className="r">{data.awDoneCount}</td><td className="r">{data.awOnTimeCount}</td><td className="r">{data.awDoneCount - data.awOnTimeCount}</td><td>{pctText(data.awOnTimeCount, data.awDoneCount)}</td><td /></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>⑦ Designer Performance รายคน</h2>
          <div className="hint" style={{ marginBottom: 12 }}>รอบแก้เฉลี่ย = จำนวนครั้งที่ถูกตีกลับจาก Import/MDSG + EVP ต่องาน{exNote}</div>
          <div className="scroll">
            <table className="tbl">
              <thead><tr><th>Designer</th><th className="r">AW เสร็จ</th><th className="r">On-time</th><th style={{ width: "30%" }}>%On-time</th><th className="r">รอบแก้เฉลี่ย</th></tr></thead>
              <tbody>
                {data.personRows.map((x) => (
                  <tr key={x.n}>
                    <td style={{ whiteSpace: "nowrap" }}><b>{x.n}</b></td><td className="r">{x.c}</td><td className="r">{x.on}</td>
                    <td><PctBar on={x.on} total={x.c} /></td><td className="r">{x.r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
