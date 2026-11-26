"use client";

import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { GlobalFilterBar } from "@/components/ui/global-filter-bar";
import { StatusPill } from "@/components/ui/status-badges";
import { sdeptLabel, STATUS_LIST, type MainStatus } from "@/lib/domain/aw-constants";
import { curStatus, curSub, dayInStage, isOpenJob, isOverdue, ownerLabel, roundsCount, slaOf } from "@/lib/domain/sla-engine";
import { fmtThaiDate } from "@/lib/domain/working-days";

export function JobsListView() {
  const router = useRouter();
  const { jobs, filter, jobsTab, setJobsTab, jobsQuery, setJobsQuery, today, holidaySet, showToast } = useTracker();

  const baseFiltered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (!filter.year || j.piDate.slice(0, 4) === filter.year) &&
          (!filter.month || Number(j.piDate.slice(5, 7)) === Number(filter.month)) &&
          (!filter.sdept || j.sdepts.some((x) => String(x) === filter.sdept)) &&
          (!filter.importer || j.importer === filter.importer) &&
          (!filter.designer || j.designer === filter.designer) &&
          (!filter.brand || j.brand === filter.brand)
      ),
    [jobs, filter]
  );

  const counts = useMemo(() => {
    const out: Record<MainStatus, number> = { Open: 0, "Draft AW": 0, "Final AW": 0, Production: 0, "Goods Received": 0, Cancelled: 0 };
    baseFiltered.forEach((j) => { out[curStatus(j)]++; });
    return out;
  }, [baseFiltered]);

  const displayed = useMemo(() => {
    let F = [...baseFiltered];
    if (jobsTab === "overdue") F = F.filter((j) => isOverdue(j, today, holidaySet));
    else if (jobsTab) F = F.filter((j) => curStatus(j) === jobsTab);
    if (jobsQuery.trim()) {
      const q = jobsQuery.trim().toLowerCase();
      F = F.filter((j) => (j.pi + j.brand + j.supplier + j.importer + j.designer).toLowerCase().includes(q));
    }
    return F.sort((a, b) => b.piDate.localeCompare(a.piDate));
  }, [baseFiltered, jobsTab, jobsQuery, today, holidaySet]);

  function handleExportExcel() {
    if (!displayed.length) { showToast("ไม่มีงานให้ Export"); return; }
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (jobsTab) params.set("tab", jobsTab);
    if (jobsQuery.trim()) params.set("q", jobsQuery.trim());
    window.location.href = `/api/jobs/export?${params.toString()}`;
    showToast(`กำลังดาวน์โหลดไฟล์ Excel (${displayed.length} PI · 5 ชีต)`);
  }

  return (
    <>
      <GlobalFilterBar />
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="tabs">
            <button type="button" className={`tab${!jobsTab ? " on" : ""}`} onClick={() => setJobsTab("")}>ทั้งหมด</button>
            {STATUS_LIST.map((s) => (
              <button key={s} type="button" className={`tab${jobsTab === s ? " on" : ""}`} onClick={() => setJobsTab(s)}>{s} ({counts[s]})</button>
            ))}
            <button type="button" className={`tab${jobsTab === "overdue" ? " on" : ""}`} style={{ color: jobsTab === "overdue" ? "#fff" : "var(--org-d)" }} onClick={() => setJobsTab("overdue")}>เกิน SLA</button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input aria-label="ค้นหา" placeholder="ค้นหา PI / Brand / Supplier / ชื่อ" value={jobsQuery} onChange={(e) => setJobsQuery(e.target.value)} style={{ border: "1px solid #C9D2DE", borderRadius: 8, padding: "8px 12px", minWidth: 260 }} />
            <button type="button" className="btn sm" onClick={handleExportExcel} title="Export ตามตัวกรองที่เลือก">⬇ Export Excel</button>
          </div>
        </div>

        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr><th>PI No.</th><th>PI อนุมัติ</th><th>House Brand</th><th>Sdept</th><th>Pattern</th><th className="r">Items</th><th>Status</th><th>Sub Status</th><th>ค้างที่</th><th className="r">วันในขั้น / SLA</th><th>Designer</th><th>Import</th></tr>
            </thead>
            <tbody>
              {displayed.length > 0 ? displayed.map((j) => {
                const open = isOpenJob(j);
                const over = isOverdue(j, today, holidaySet);
                const rds = roundsCount(j);
                return (
                  <tr key={j.id} className="click" onClick={() => router.push(`/jobs/${j.id}`)}>
                    <td><a href={`/jobs/${j.id}`} onClick={(e) => e.preventDefault()}>{j.pi}</a></td>
                    <td>{fmtThaiDate(j.piDate)}</td><td>{j.brand}</td><td>{j.sdepts.map(sdeptLabel).join(" / ")}</td>
                    <td>{j.pattern})</td><td className="r">{j.items}</td>
                    <td><StatusPill status={curStatus(j)} /></td>
                    <td>{curSub(j)}{rds > 0 && <span className="chip neu" style={{ marginLeft: 6 }}>แก้ {rds} รอบ</span>}</td>
                    <td>{ownerLabel(j)}</td>
                    <td className="r">{open ? <span style={{ color: over ? "var(--org-d)" : "inherit", fontWeight: over ? 700 : 400 }}>{dayInStage(j, today, holidaySet)} / {slaOf(j)}</span> : "–"}</td>
                    <td>{j.designer}</td><td>{j.importer}</td>
                  </tr>
                );
              }) : <tr><td colSpan={12} className="hint">ไม่พบงานตามเงื่อนไข</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="hint" style={{ marginTop: 8 }}>{displayed.length} งาน · {displayed.reduce((a, j) => a + j.items, 0).toLocaleString()} items</div>
      </div>
    </>
  );
}
