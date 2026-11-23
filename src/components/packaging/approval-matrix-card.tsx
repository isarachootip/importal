"use client";

import { useState } from "react";
import type { PackagingStepKey, RoleCode } from "@prisma/client";
import { STEP_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateShort } from "@/lib/utils/date-th";
import { cn } from "@/lib/utils/cn";
import type { ApprovalDto, PackagingJobDto } from "./case-detail-types";

interface Props {
  job: PackagingJobDto;
}

function formatApprovalCell(rows: ApprovalDto[], roles: RoleCode[]): { label: string; tone: "ok" | "warn" | "wait" | "muted" } {
  const matched = rows.filter((r) => roles.includes(r.role));
  if (matched.length === 0) return { label: "—", tone: "muted" };
  const latest = matched[matched.length - 1]!;
  if (latest.decision === "APPROVED") {
    return { label: `ผ่าน ${formatDateShort(latest.actedAt).slice(0, 5)}`, tone: "ok" };
  }
  if (latest.decision === "REVISION_REQUESTED") {
    return { label: `แจ้งแก้ ${formatDateShort(latest.actedAt).slice(0, 5)}`, tone: "warn" };
  }
  return { label: "รอตรวจ", tone: "wait" };
}

export function ApprovalMatrixCard({ job }: Props) {
  const [showSchedule, setShowSchedule] = useState(false);

  const rounds: Array<{
    round: number;
    proofStep: PackagingStepKey;
    draftStage: string[];
  }> = [
    { round: 1, proofStep: "PROOF_1", draftStage: ["DRAFT_1"] },
    { round: 2, proofStep: "PROOF_2", draftStage: ["REVISE_1", "DRAFT_2"] },
    { round: 3, proofStep: "PROOF_3", draftStage: ["REVISE_2", "DRAFT_3"] },
  ];

  const gmVpApprovals = job.approvals.filter((a) => a.stepKey === "APPROVE_GM_VP");
  const evpApprovals = job.approvals.filter((a) => a.stepKey === "APPROVE_EVP");
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#d9dee3]">
        <h2 className="text-[17px] font-bold text-[#1f2933]">ประวัติการตรวจและอนุมัติ</h2>
        <button
          type="button"
          onClick={() => setShowSchedule((v) => !v)}
          className="px-3 py-1.5 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933]"
        >
          {showSchedule ? "ซ่อนตารางแผนวันทำงาน" : "ดูตารางแผนวันทำงานทั้งหมด"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[15px] text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="bg-[#f5f7f9] text-[#5f6b76] text-[13px] font-semibold">
              <th className="py-2.5 px-5">รอบ</th>
              <th className="py-2.5 px-2.5">Draft</th>
              <th className="py-2.5 px-2.5">Import</th>
              <th className="py-2.5 px-2.5">MER</th>
              <th className="py-2.5 px-2.5">GM / VP</th>
              <th className="py-2.5 px-2.5">EVP</th>
              <th className="py-2.5 px-5 text-right">แผน</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => {
              const stepPlan = job.scheduleSteps.find((s) => s.stepKey === r.proofStep);
              const draftArt = job.artworks.find((a) => r.draftStage.includes(a.stageKind));
              const stepApprovals = job.approvals.filter((a) => a.stepKey === r.proofStep);
              const importCell = formatApprovalCell(stepApprovals, ["IMPORT"]);
              const merCell = formatApprovalCell(stepApprovals, ["MER"]);
              const showFinalInRow =
                r.round === 3 ||
                (r.round === 2 && job.currentStep === "PROOF_2") ||
                gmVpApprovals.length > 0;
              const gmCell = showFinalInRow ? formatApprovalCell(gmVpApprovals, ["GM", "VP"]) : { label: "—", tone: "muted" as const };
              const evpCell = showFinalInRow ? formatApprovalCell(evpApprovals, ["EVP"]) : { label: "—", tone: "muted" as const };

              return (
                <tr key={r.round} className="border-t border-[#e5e9ed]">
                  <td className="py-2.5 px-5 font-bold text-[#1f2933]">{r.round}</td>
                  <td className="py-2.5 px-2.5 text-[#1f2933] tabular-nums">
                    {draftArt ? `${formatDateShort(draftArt.createdAt).slice(0, 5)} ✓` : "—"}
                  </td>
                  <td className={cn("py-2.5 px-2.5 tabular-nums", cellToneClass(importCell.tone))}>
                    {importCell.label}
                  </td>
                  <td className={cn("py-2.5 px-2.5 tabular-nums", cellToneClass(merCell.tone))}>
                    {merCell.label}
                  </td>
                  <td className={cn("py-2.5 px-2.5 tabular-nums", cellToneClass(gmCell.tone))}>
                    {gmCell.label}
                  </td>
                  <td className={cn("py-2.5 px-2.5 tabular-nums", cellToneClass(evpCell.tone))}>
                    {evpCell.label}
                  </td>
                  <td className="py-2.5 px-5 text-right text-[#5f6b76] tabular-nums">
                    {stepPlan ? formatDateShort(stepPlan.plannedEnd).slice(0, 5) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showSchedule ? (
        <div className="border-t border-[#d9dee3] bg-[#fafbfc] px-5 py-3.5">
          <div className="text-xs font-semibold text-[#5f6b76] mb-2">
            ตารางแผนวันทำงานรายขั้นตอน (ไม่นับเสาร์-อาทิตย์ และวันหยุดบริษัท)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="text-[#5f6b76] text-xs border-b border-[#d9dee3]">
                  <th className="py-2 pr-3">ขั้นตอน</th>
                  <th className="py-2 px-2 text-right">วันทำการ</th>
                  <th className="py-2 px-2">แผนเริ่ม</th>
                  <th className="py-2 px-2">แผนเสร็จ</th>
                  <th className="py-2 px-2">เสร็จจริง</th>
                  <th className="py-2 pl-2 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {job.scheduleSteps.map((step) => {
                  const isCurrent = step.stepKey === job.currentStep;
                  const isOverdue = !step.actualEnd && !step.isBuffer && step.plannedEnd.slice(0, 10) < todayIso && isCurrent;
                  return (
                    <tr
                      key={step.id}
                      className={cn("border-t border-[#e5e9ed]", isCurrent && "bg-[#eef7f5] font-semibold")}
                    >
                      <td className="py-1.5 pr-3 text-[#1f2933]">
                        {STEP_LABELS[step.stepKey]}
                        {step.isBuffer ? (
                          <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-[#eef1f4] text-[#5f6b76]">
                            Buffer
                          </span>
                        ) : null}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-[#5f6b76]">{step.plannedDays} วัน</td>
                      <td className="py-1.5 px-2 tabular-nums text-[#5f6b76]">{formatDateShort(step.plannedStart)}</td>
                      <td className="py-1.5 px-2 tabular-nums text-[#1f2933]">{formatDateShort(step.plannedEnd)}</td>
                      <td className="py-1.5 px-2 tabular-nums text-[#0f5c4d]">{formatDateShort(step.actualEnd)}</td>
                      <td className="py-1.5 pl-2 text-right">
                        {step.actualEnd ? (
                          <span className="text-xs font-semibold text-[#0f5c4d]">เสร็จแล้ว</span>
                        ) : isOverdue ? (
                          <span className="text-xs font-semibold text-[#b91c1c]">ล่าช้ากว่าแผน</span>
                        ) : isCurrent ? (
                          <span className="text-xs font-semibold text-[#1d4ed8]">กำลังดำเนินการ</span>
                        ) : (
                          <span className="text-xs text-[#5f6b76]">รอคิว</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function cellToneClass(tone: "ok" | "warn" | "wait" | "muted"): string {
  switch (tone) {
    case "ok":
      return "text-[#0f5c4d] font-semibold";
    case "warn":
      return "text-[#b45309] font-semibold";
    case "wait":
      return "text-[#1d4ed8] font-semibold";
    default:
      return "text-[#5f6b76]";
  }
}
