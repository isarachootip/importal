"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SlaChip, StatusPill } from "@/components/ui/status-badges";
import { DESIGNER_NAMES, IMPORTER_NAMES, sdeptLabel, SUB_MAP } from "@/lib/domain/aw-constants";
import { curStatus, curSub, dayInStage, isOverdue, jobPattern, slaOf } from "@/lib/domain/sla-engine";
import { fmtThaiDate } from "@/lib/domain/working-days";

export function MyTasksView() {
  const { jobs, session, today, holidaySet, drafts, tasksFilter, setTasksFilter } = useTracker();

  const allMyTasks = useMemo(
    () => jobs.filter((j) => SUB_MAP[curSub(j)].roles.includes(session.role)),
    [jobs, session.role]
  );

  const sdeptOpts = useMemo(() => {
    const codes = [...new Set(allMyTasks.flatMap((j) => j.sdepts))].sort((a, b) => a - b);
    return codes.map((c): [number, string] => [c, sdeptLabel(c)]);
  }, [allMyTasks]);

  const filteredTasks = useMemo(() => {
    const leftOf = (j: (typeof allMyTasks)[number]) => {
      const s = slaOf(j);
      return s == null ? 1e9 : s - dayInStage(j, today, holidaySet);
    };
    return allMyTasks
      .filter(
        (j) =>
          (!tasksFilter.importer || j.importer === tasksFilter.importer) &&
          (!tasksFilter.designer || j.designer === tasksFilter.designer) &&
          (!tasksFilter.sdept || j.sdepts.some((x) => String(x) === tasksFilter.sdept))
      )
      .sort((a, b) => leftOf(a) - leftOf(b));
  }, [allMyTasks, tasksFilter, today, holidaySet]);

  if (session.role === "mgmt") {
    return (
      <div className="info">
        บทบาทผู้บริหารไม่มีงานที่ต้องดำเนินการ ดูภาพรวมได้ที่{" "}
        <Link href="/dashboard">Dashboard</Link>
      </div>
    );
  }

  const hasActiveFilter = Boolean(tasksFilter.importer || tasksFilter.designer || tasksFilter.sdept);
  const overdueCount = filteredTasks.filter((j) => isOverdue(j, today, holidaySet)).length;
  const dueSoonCount = filteredTasks.filter((j) => {
    const s = slaOf(j);
    if (s == null) return false;
    const left = s - dayInStage(j, today, holidaySet);
    return left >= 0 && left <= 1;
  }).length;
  const createDraft = drafts[`create:${session.role}`];

  return (
    <>
      <div className="card filters" style={{ padding: "14px 16px", marginBottom: 18 }}>
        <label className="fl">
          Import Name
          <SearchableSelect
            ariaLabel="Import Name"
            value={tasksFilter.importer}
            options={IMPORTER_NAMES}
            allLabel="ทั้งหมด"
            onChange={(v) => setTasksFilter((prev) => ({ ...prev, importer: v }))}
          />
        </label>
        <label className="fl">
          Designer&apos;s Name
          <SearchableSelect
            ariaLabel="Designer's Name"
            value={tasksFilter.designer}
            options={DESIGNER_NAMES}
            allLabel="ทั้งหมด"
            onChange={(v) => setTasksFilter((prev) => ({ ...prev, designer: v }))}
          />
        </label>
        <label className="fl">
          Sdept
          <SearchableSelect
            ariaLabel="Sdept"
            value={tasksFilter.sdept}
            options={sdeptOpts}
            allLabel="ทั้งหมด"
            onChange={(v) => setTasksFilter((prev) => ({ ...prev, sdept: v }))}
          />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => setTasksFilter({ importer: "", designer: "", sdept: "" })}
          >
            ล้างตัวกรอง
          </button>
          {hasActiveFilter && (
            <span className="hint" style={{ paddingBottom: 8 }}>
              แสดง {filteredTasks.length} จาก {allMyTasks.length} งาน
            </span>
          )}
        </div>
      </div>

      {createDraft && (
        <div className="draftbar">
          <span>
            📝 <b>มีร่างแจ้งงานที่ยังไม่ได้ส่ง</b>
            {createDraft.v.pi ? ` · ${String(createDraft.v.pi)}` : ""} · บันทึกไว้{" "}
            {fmtThaiDate(createDraft.d)} {createDraft.t} น.
          </span>
          <Link href="/create" className="btn sm pri">
            กรอกต่อ
          </Link>
        </div>
      )}

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="card kpi">
          <div className="l">งานที่รอคุณ</div>
          <div className="v" style={{ color: "var(--navy)" }}>{filteredTasks.length}</div>
          <div className="s">{session.roleName} · {session.userDisplayName}</div>
        </div>
        <div className="card kpi">
          <div className="l">เกิน SLA</div>
          <div className="v" style={{ color: "var(--org-d)" }}>{overdueCount}</div>
          <div className="s">ควรเคลียร์ก่อน</div>
        </div>
        <div className="card kpi">
          <div className="l">ครบกำหนดวันนี้ / พรุ่งนี้</div>
          <div className="v" style={{ color: "var(--blue-d)" }}>{dueSoonCount}</div>
          <div className="s">เหลือไม่เกิน 1 วัน</div>
        </div>
      </div>

      <div className="card">
        <h2>รายการที่ต้องทำ</h2>
        <div className="hint" style={{ marginBottom: 12 }}>
          เรียงจากใกล้ครบ / เกิน SLA มากสุด · คลิกเพื่อเปิดงาน
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((j) => {
              const s = curSub(j);
              const draftKey = `act:${j.id}:${s}`;
              return (
                <Link key={j.id} href={`/jobs/${j.id}`} className="task">
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <b>{j.pi}</b>
                      <StatusPill status={curStatus(j)} />
                      <span className="hint">
                        {s} · {SUB_MAP[s].label}
                      </span>
                      {Boolean(drafts[draftKey]) && (
                        <span className="chip" style={{ background: "#EEF6EE", color: "#1E7B34" }}>
                          📝 มีร่างบันทึกไว้
                        </span>
                      )}
                    </div>
                    <div className="hint" style={{ marginTop: 4 }}>
                      {j.brand} · {j.sdepts.map(sdeptLabel).join(" / ")} · {jobPattern(j).name} ·{" "}
                      {j.items} items · Import: {j.importer} · Designer: {j.designer}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <SlaChip job={j} today={today} holidays={holidaySet} />
                    <div className="hint" style={{ marginTop: 4 }}>
                      อยู่ในขั้นนี้ {dayInStage(j, today, holidaySet)} วัน
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="info">{hasActiveFilter ? "ไม่มีงานตามตัวกรองที่เลือก" : "ไม่มีงานค้าง"}</div>
          )}
        </div>
      </div>
    </>
  );
}
