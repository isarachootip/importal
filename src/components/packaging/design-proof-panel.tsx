"use client";

import { useState } from "react";
import type { RoleCode } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/domain/packaging-labels";
import type { PackagingJobDto } from "./case-detail-types";
import { CommentThreadCard } from "./comment-thread-card";

interface Props {
  job: PackagingJobDto;
  userRoles: readonly RoleCode[];
  selectedArtworkId: string | null;
  pendingPin: { x: number; y: number } | null;
  onClearPin: () => void;
  onRefresh: () => void;
}

export function DesignProofPanel({
  job,
  userRoles,
  selectedArtworkId,
  pendingPin,
  onClearPin,
  onRefresh,
}: Props) {
  const [decision, setDecision] = useState<"APPROVE_STEP" | "REQUEST_REVISION">("APPROVE_STEP");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRoles.includes("ADMIN");
  const isGd = userRoles.includes("GD") || isAdmin;

  const stepApprovalsAll = job.approvals.filter((a) => a.stepKey === job.currentStep);
  const latestRound = stepApprovalsAll.reduce((m, a) => Math.max(m, a.round), 0);
  const pendingSlots = stepApprovalsAll.filter((a) => a.round === latestRound && a.decision === "PENDING");
  const minOrder = pendingSlots.length > 0 ? Math.min(...pendingSlots.map((s) => s.stepOrder)) : null;

  const actionableSlot =
    minOrder !== null
      ? pendingSlots.find((s) => s.stepOrder === minOrder && (isAdmin || userRoles.includes(s.role))) ?? null
      : null;

  const draftLabel =
    job.currentStep === "PROOF_1" || job.currentStep === "REVISE_1"
      ? "Draft 1"
      : job.currentStep === "PROOF_2" || job.currentStep === "REVISE_2"
        ? "Draft 2"
        : job.currentStep === "PROOF_3" || job.currentStep === "REVISE_3"
          ? "Draft 3"
          : "Artwork";

  async function callTransition(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/packaging/${job.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "ดำเนินการไม่สำเร็จ");
      setReason("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const isGdActionStep =
    job.currentStep === "AW_DRAFT_1" ||
    job.currentStep === "REVISE_1" ||
    job.currentStep === "REVISE_2" ||
    job.currentStep === "REVISE_3" ||
    job.currentStep === "REVISE_FINAL";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CommentThreadCard
        jobId={job.id}
        draftLabel={draftLabel}
        comments={job.comments}
        selectedArtworkId={selectedArtworkId}
        pendingPin={pendingPin}
        onClearPin={onClearPin}
        onRefresh={onRefresh}
      />

      <section className="bg-white border border-[#d9dee3] rounded-md p-5 flex flex-col justify-between gap-3">
        <div className="space-y-3">
          <h3 className="text-[17px] font-bold text-[#1f2933]">ผลการตรวจของคุณ</h3>

          {error ? (
            <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-2 text-xs text-[#b91c1c]">
              {error}
            </div>
          ) : null}

          {actionableSlot ? (
            <>
              <div className="text-xs text-[#5f6b76]">
                กำลังบันทึกผลในบทบาท:{" "}
                <span className="font-bold text-[#0f5c4d]">{ROLE_LABELS[actionableSlot.role]}</span>
              </div>
              <div className="flex items-center gap-5 text-[15px] text-[#1f2933]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="proof-decision"
                    checked={decision === "APPROVE_STEP"}
                    onChange={() => setDecision("APPROVE_STEP")}
                    className="accent-[#0f5c4d]"
                  />
                  <span>ผ่าน</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="proof-decision"
                    checked={decision === "REQUEST_REVISION"}
                    onChange={() => setDecision("REQUEST_REVISION")}
                    className="accent-[#0f5c4d]"
                  />
                  <span>แจ้งแก้</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={decision === "REQUEST_REVISION" ? "ระบุจุดที่ต้องการแก้ไข (บังคับ)" : "หมายเหตุ (ถ้ามี)"}
                className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-sm text-[#1f2933] focus:outline-none focus:border-[#0f5c4d]"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReason("")}
                  className="px-4 py-2 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933]"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={busy || (decision === "REQUEST_REVISION" && !reason.trim())}
                  onClick={() =>
                    callTransition(
                      decision === "APPROVE_STEP"
                        ? { type: "APPROVE_STEP", actingRole: actionableSlot.role, reason: reason.trim() || undefined }
                        : { type: "REQUEST_REVISION", actingRole: actionableSlot.role, reason: reason.trim() }
                    )
                  }
                  className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {busy ? "กำลังบันทึก..." : "บันทึกผลตรวจ"}
                </button>
              </div>
            </>
          ) : isGd && isGdActionStep ? (
            <div className="space-y-3">
              <p className="text-sm text-[#5f6b76]">
                ขั้นตอนนี้รอฝ่าย Graphic Designer อัปโหลดไฟล์ Artwork ด้านบนแล้วกดส่งเข้าคิวตรวจแบบ
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  callTransition({
                    type:
                      job.currentStep === "AW_DRAFT_1"
                        ? "UPLOAD_DRAFT_1"
                        : job.currentStep === "REVISE_FINAL"
                          ? "SUBMIT_FINAL_REVISION"
                          : "SUBMIT_REVISION",
                  })
                }
                className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
              >
                {job.currentStep === "AW_DRAFT_1"
                  ? "ส่ง Artwork Draft 1 ให้ทีมตรวจ"
                  : job.currentStep === "REVISE_FINAL"
                    ? "ส่งไฟล์แก้ไข Final เพื่ออนุมัติอีกครั้ง"
                    : "ส่งไฟล์ Artwork ฉบับแก้ไขให้ทีมตรวจ"}
              </button>
            </div>
          ) : (
            <div className="rounded-md bg-[#f5f7f9] border border-[#e5e9ed] p-4 text-sm text-[#5f6b76]">
              ขณะนี้ยังไม่ใช่คิวตรวจของบทบาทคุณ (สามารถสลับผู้ใช้งานจากมุมขวาบนเพื่อทดสอบแต่ละบทบาทได้)
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
