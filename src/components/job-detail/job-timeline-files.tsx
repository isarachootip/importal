"use client";

import React from "react";
import { ROLE_TH, STATUS_COLORS, STEP_SUBS, SUB_MAP, type SubStatus } from "@/lib/domain/aw-constants";
import type { JobRecord } from "@/lib/domain/job-types";
import { isOpenJob, slaOf } from "@/lib/domain/sla-engine";
import { diffWorkingDays, fmtThaiDate } from "@/lib/domain/working-days";

const TRACKED_SUBS: SubStatus[] = [...STEP_SUBS, "In Production"];

export function JobTimelineAndFiles({
  job,
  today,
  holidays,
}: {
  job: JobRecord;
  today: string;
  holidays: ReadonlySet<string>;
}) {
  const h = job.history;
  const open = isOpenJob(job);

  const items = h
    .map((e, i) => {
      const next = h[i + 1];
      const end = next ? next.d : open ? today : null;
      const startIso =
        e.sub === "MDSG Review" && i > 0 && h[i - 1]?.sub === "Import Review"
          ? h[i - 1]!.d
          : e.d;
      const dur = end != null ? diffWorkingDays(startIso, end, holidays) : null;
      const s = slaOf(job, e.sub);
      const isLast = i === h.length - 1;
      const showChip = dur != null && s != null && TRACKED_SUBS.includes(e.sub);

      return { e, dur, s, isLast, showChip, idx: i };
    })
    .reverse();

  return (
    <div className="grid">
      <div className="card">
        <h2>ประวัติการดำเนินงาน</h2>
        <div className="hint" style={{ marginBottom: 14 }}>
          ทุกการเปลี่ยน Sub Status ระบบบันทึกวันที่และผู้ทำรายการอัตโนมัติ
        </div>
        <div className="tl">
          {items.map(({ e, dur, s, isLast, showChip, idx }) => (
            <div key={e.id ?? idx} className="tli">
              <div
                className="b"
                style={{
                  background: isLast ? "var(--navy)" : STATUS_COLORS[SUB_MAP[e.sub].st],
                }}
              />
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <b>{e.act}</b>
                  {showChip && (
                    <span className={`chip ${(dur ?? 0) > (s ?? 0) ? "bad" : "ok"}`}>
                      {dur}/{s} วัน
                    </span>
                  )}
                  {isLast && open && <span className="chip neu">ขั้นปัจจุบัน</span>}
                </div>
                <div className="hint">
                  {fmtThaiDate(e.d)} · โดย {ROLE_TH[e.by] ?? e.by} → {e.sub}
                </div>
                {e.note && (
                  <div
                    style={{
                      fontSize: 13,
                      marginTop: 4,
                      background: "var(--soft)",
                      padding: "6px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {e.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>ไฟล์จากการทำงาน</h2>
        <div className="hint">
          Draft / ไฟล์คอมเมนต์ / Final AW / SKU number · ข้อมูลตั้งต้นอยู่ใน Share Folder
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {job.files.length > 0 ? (
            job.files.map((f, idx) => (
              <div
                key={f.id ?? idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 13,
                  padding: "6px 0",
                  borderBottom: "1px solid #EDF0F4",
                }}
              >
                <span style={{ wordBreak: "break-all" }}>
                  {f.link ? (
                    <>
                      Link:{" "}
                      <a href={f.name} target="_blank" rel="noopener noreferrer">
                        {f.name}
                      </a>
                    </>
                  ) : f.id ? (
                    <a href={`/api/files/${f.id}`}>{f.name}</a>
                  ) : (
                    f.name
                  )}
                </span>
                <span className="hint" style={{ whiteSpace: "nowrap" }}>
                  {ROLE_TH[f.by] ?? f.by} · {fmtThaiDate(f.d)}
                </span>
              </div>
            ))
          ) : (
            <div className="hint">ยังไม่มีไฟล์</div>
          )}
        </div>
      </div>
    </div>
  );
}
