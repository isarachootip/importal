"use client";

import Link from "next/link";
import React from "react";
import { useTracker } from "@/components/context/tracker-context";
import { StatusPill } from "@/components/ui/status-badges";
import type { MainStatus } from "@/lib/domain/aw-constants";
import {
  awDueDays,
  curStatus,
  curSub,
  dateOfMark,
  hasLicense,
  isOpenJob,
  jobPattern,
  licenseDays,
  roundsCount,
  slaAdjustment,
  totalSla,
} from "@/lib/domain/sla-engine";
import { addWorkingDays, diffWorkingDays, fmtThaiDate } from "@/lib/domain/working-days";
import { JobActionPanel } from "./job-action-panel";
import { JobInfoCard } from "./job-info-card";
import { JobTimelineAndFiles } from "./job-timeline-files";

const MAIN_STEPS: MainStatus[] = ["Open", "Draft AW", "Final AW", "Production", "Goods Received"];

export function JobDetailView({ jobId }: { jobId: string }) {
  const { jobs, session, today, holidaySet, setCancelJobId } = useTracker();
  const job = jobs.find((x) => x.id === jobId || x.jobCode === jobId || x.pi === jobId);

  if (!job) {
    return (
      <>
        <Link href="/jobs" className="btn sm" style={{ marginBottom: 14 }}>
          ← กลับไปรายการงาน
        </Link>
        <div className="notice">ไม่พบงานในระบบ</div>
      </>
    );
  }

  const st = curStatus(job);
  const ci = MAIN_STEPS.indexOf(st);
  const grDate = dateOfMark(job, "gr");
  const used = diffWorkingDays(job.piDate, grDate ?? today, holidaySet);
  const tot = totalSla(job);
  const wpct = Math.min(100, Math.round((used / Math.max(1, tot)) * 100));
  const canCancel = (session.role === "import" || session.role === "mgmt") && isOpenJob(job);
  const adj = slaAdjustment(job);

  return (
    <>
      <Link href="/jobs" className="btn sm" style={{ marginBottom: 14 }}>
        ← กลับไปรายการงาน
      </Link>

      <div className="card">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>{job.pi}</h2>
              <StatusPill status={st} />
              <span className="chip neu">{curSub(job)}</span>
              {hasLicense(job) && (
                <span className="chip neu">
                  {job.license} · SLA +{licenseDays(job.license)} วัน
                </span>
              )}
            </div>
            <div className="hint" style={{ marginTop: 6 }}>
              {job.brand} · {job.supplier} · {jobPattern(job).name} · {job.items} items · Import:{" "}
              {job.importer} · Designer: {job.designer}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canCancel && (
              <button
                type="button"
                className="btn sm warn"
                onClick={() => setCancelJobId(job.id)}
              >
                ยกเลิกงาน
              </button>
            )}
          </div>
        </div>

        <div className="stepper">
          {MAIN_STEPS.map((m, i) => {
            const done = i < ci || st === "Goods Received";
            const cur = i === ci && st !== "Goods Received";
            return (
              <div key={m} className={`stp${done ? " done" : cur ? " cur" : ""}`}>
                <div className="c">{done ? "✓" : i + 1}</div>
                {m}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 14,
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--line)",
          }}
        >
          <div>
            <div className="hint">กำหนดส่ง Final AW</div>
            <b>{fmtThaiDate(addWorkingDays(job.piDate, awDueDays(job), holidaySet))}</b>
          </div>
          <div>
            <div className="hint">SLA รวม (ปรับแล้ว)</div>
            <b>{tot} วัน</b> {adj > 0 && <span className="hint">(+{adj} วัน)</span>}
          </div>
          <div>
            <div className="hint">กำหนดสินค้าเข้า</div>
            <b>{fmtThaiDate(addWorkingDays(job.piDate, tot, holidaySet))}</b>
          </div>
          <div>
            <div className="hint">{grDate ? "ใช้เวลาจริง" : "ผ่านไปแล้ว"}</div>
            <b style={{ color: used > tot ? "var(--org-d)" : "inherit" }}>{used} วัน</b>
            <div className="bar" style={{ marginTop: 6 }}>
              <div
                style={{
                  width: `${wpct}%`,
                  background: used > tot ? "var(--org)" : "var(--blue)",
                }}
              />
            </div>
          </div>
          <div>
            <div className="hint">รอบแก้ไข</div>
            <b>{roundsCount(job)} รอบ</b>
          </div>
        </div>
      </div>

      <JobInfoCard job={job} />

      <div className="grid g2" style={{ marginTop: 16, alignItems: "start" }}>
        <div className="card">
          <JobActionPanel job={job} />
        </div>
        <JobTimelineAndFiles job={job} today={today} holidays={holidaySet} />
      </div>
    </>
  );
}
