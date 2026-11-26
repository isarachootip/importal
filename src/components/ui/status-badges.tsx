"use client";

import React from "react";
import { STATUS_COLORS, type MainStatus } from "@/lib/domain/aw-constants";
import type { DraftData, JobRecord } from "@/lib/domain/job-types";
import { dayInStage, slaOf } from "@/lib/domain/sla-engine";
import { fmtThaiDate } from "@/lib/domain/working-days";

export function StatusPill({ status }: { status: MainStatus }) {
  const color = STATUS_COLORS[status];
  const textColor = status === "Open" ? "#4A5263" : color;
  return (
    <span className="pill" style={{ background: `${color}1F`, color: textColor }}>
      <span className="dot" style={{ background: color }} />
      {status}
    </span>
  );
}

export function SlaChip({
  job,
  today,
  holidays,
}: {
  job: JobRecord;
  today: string;
  holidays: ReadonlySet<string>;
}) {
  const s = slaOf(job);
  if (s == null) return <span className="chip neu">–</span>;
  const left = s - dayInStage(job, today, holidays);
  if (left < 0) return <span className="chip bad">เกิน {-left} วัน</span>;
  return <span className="chip ok">เหลือ {left} วัน</span>;
}

export function DraftBanner({
  draft,
  onDelete,
}: {
  draft: DraftData | undefined;
  onDelete: () => void;
}) {
  if (!draft) return null;
  return (
    <div className="draftbar">
      <span>
        📝 <b>เปิดจากร่างที่บันทึกไว้</b> · {fmtThaiDate(draft.d)} {draft.t} น. โดย {draft.by}
        {draft.files.length > 0 ? ` · ไฟล์ที่แนบไว้: ${draft.files.join(", ")}` : ""}
      </span>
      <button type="button" className="btn sm" onClick={onDelete}>
        ลบร่าง
      </button>
    </div>
  );
}

export function SaveDraftButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn"
      onClick={onClick}
      title="บันทึกข้อมูลที่กรอกไว้ลงฐานข้อมูล แล้วกลับมากรอกต่อภายหลัง"
    >
      💾 บันทึกร่าง
    </button>
  );
}
