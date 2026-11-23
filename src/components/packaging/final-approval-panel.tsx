"use client";

import { useState } from "react";
import type { RoleCode } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { APPROVAL_DECISION_LABELS, ROLE_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateTimeTh } from "@/lib/utils/date-th";
import type { PackagingJobDto } from "./case-detail-types";
import { FinalFileUploadCard } from "./final-file-upload-card";

interface Props {
  job: PackagingJobDto;
  userRoles: readonly RoleCode[];
  onRefresh: () => void;
}

export function FinalApprovalPanel({ job, userRoles, onRefresh }: Props) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRoles.includes("ADMIN");
  const isGd = userRoles.includes("GD") || isAdmin;
  const latestArt = job.artworks[0] ?? null;
  const finalArt = job.artworks.find((a) => a.stageKind === "FINAL_FILE") ?? null;

  const gmVpRows = job.approvals.filter((a) => a.stepKey === "APPROVE_GM_VP");
  const evpRows = job.approvals.filter((a) => a.stepKey === "APPROVE_EVP");

  const activeFinalPending = job.approvals.find(
    (a) =>
      a.stepKey === job.currentStep &&
      (a.stepKey === "APPROVE_GM_VP" || a.stepKey === "APPROVE_EVP") &&
      a.decision === "PENDING" &&
      (isAdmin || userRoles.includes(a.role))
  );

  async function actFinal(type: "APPROVE_STEP" | "REQUEST_REVISION") {
    if (!activeFinalPending) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/packaging/${job.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          actingRole: activeFinalPending.role,
          reason: reason.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกผลอนุมัติไม่สำเร็จ");
      setReason("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกผลอนุมัติไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-4 py-2.5 text-sm text-[#b91c1c]">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "1. GM / VP Approved (1 วันทำการ)", rows: gmVpRows },
          {
            title: job.isMinorChange
              ? "2. EVP Approved (ข้ามได้ — Repeat Order / Minor Change)"
              : "2. EVP Approved — K.Chodok / K.Warunee (1 วันทำการ)",
            rows: evpRows,
          },
        ].map((card) => (
          <section key={card.title} className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] font-bold text-[#1f2933]">{card.title}</h3>
              {latestArt ? (
                <a
                  href={`/api/files/artwork/${latestArt.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f5c4d] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View PDF
                </a>
              ) : null}
            </div>

            {card.rows.length === 0 ? (
              <p className="text-sm text-[#5f6b76]">ยังไม่เข้าสู่ขั้นอนุมัติ Final</p>
            ) : (
              <div className="divide-y divide-[#e5e9ed]">
                {card.rows.map((row) => (
                  <div key={row.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-semibold text-[#1f2933]">{ROLE_LABELS[row.role]}</span>
                      {row.actedBy ? (
                        <span className="text-xs text-[#5f6b76] ml-2">
                          ({row.actedBy.nickname ?? row.actedBy.thaiName} · {formatDateTimeTh(row.actedAt)})
                        </span>
                      ) : null}
                      {row.reason ? <div className="text-xs text-[#5f6b76] mt-0.5">{row.reason}</div> : null}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        row.decision === "APPROVED"
                          ? "bg-[#e6f2ef] text-[#0f5c4d]"
                          : row.decision === "REVISION_REQUESTED"
                            ? "bg-[#fef2f2] text-[#b91c1c]"
                            : "bg-[#eff6ff] text-[#1d4ed8]"
                      }`}
                    >
                      {APPROVAL_DECISION_LABELS[row.decision]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {activeFinalPending ? (
        <section className="bg-white border border-[#0f5c4d] rounded-md p-5 space-y-3">
          <h4 className="text-[16px] font-bold text-[#0f5c4d]">
            ดำเนินการอนุมัติ Final ในบทบาท {ROLE_LABELS[activeFinalPending.role]}
          </h4>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ระบุความเห็นหรือจุดที่ให้แก้ไข (บังคับเมื่อขอแก้ไข)"
            className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-sm text-[#1f2933]"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={() => actFinal("REQUEST_REVISION")}
              className="px-4 py-2 rounded-md border border-[#dc2626] text-[#b91c1c] bg-white hover:bg-[#fef2f2] text-sm font-semibold disabled:opacity-50"
            >
              แจ้งแก้ไข Final (เข้า Buffer 5 วัน)
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => actFinal("APPROVE_STEP")}
              className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
            >
              อนุมัติ Final ผ่าน
            </button>
          </div>
        </section>
      ) : null}

      <FinalFileUploadCard
        jobId={job.id}
        finalArt={finalArt}
        canUploadFinal={isGd && job.currentStep === "FINAL_FILE"}
        onRefresh={onRefresh}
      />
    </div>
  );
}
