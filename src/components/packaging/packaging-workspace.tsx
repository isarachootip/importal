"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtworkStageKind, ImportStage, PackagingStepKey, RoleCode } from "@prisma/client";
import { BOARD_STATUS_LABELS, ROLE_LABELS, STAGE_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateShort } from "@/lib/utils/date-th";
import { cn } from "@/lib/utils/cn";
import { AttachPiCard } from "@/components/lifecycle/attach-pi-card";
import { LogisticPanel } from "@/components/lifecycle/logistic-panel";
import { PoPanel } from "@/components/lifecycle/po-panel";
import { ProductionPanel } from "@/components/lifecycle/production-panel";
import { SourcingPanel } from "@/components/lifecycle/sourcing-panel";
import { ApprovalMatrixCard } from "./approval-matrix-card";
import { ArtworkPinViewer } from "./artwork-pin-viewer";
import { AuditEventLog } from "./audit-event-log";
import type { CaseDetailDto, MasterOptionsDto } from "./case-detail-types";
import { CaseStageRail } from "./case-stage-rail";
import { DesignProofPanel } from "./design-proof-panel";
import { FinalApprovalPanel } from "./final-approval-panel";
import { PiRegistrationPanel } from "./pi-registration-panel";
import { PreQcPanel } from "./pre-qc-panel";

type PkgTabKey = "design" | "pi" | "preqc" | "final" | "events";

interface Props {
  data: CaseDetailDto;
  master: MasterOptionsDto;
  userRoles: readonly RoleCode[];
}

const ARTWORK_STAGE_BY_STEP: Partial<Record<PackagingStepKey, ArtworkStageKind>> = {
  AW_DRAFT_1: "DRAFT_1", REVISE_1: "REVISE_1", REVISE_2: "REVISE_2",
  REVISE_3: "REVISE_3", REVISE_FINAL: "REVISE_FINAL", FINAL_FILE: "FINAL_FILE",
};

function defaultPkgTab(step: PackagingStepKey): PkgTabKey {
  if (step === "INFO") return "pi";
  if (step === "PRE_QC") return "preqc";
  if (step === "APPROVE_GM_VP" || step === "APPROVE_EVP" || step === "FINAL_FILE" || step === "COMPLETED") return "final";
  return "design";
}

function defaultArtworkStage(step: PackagingStepKey): ArtworkStageKind {
  return ARTWORK_STAGE_BY_STEP[step] ?? "DRAFT_2";
}

function getResponsibleText(job: NonNullable<CaseDetailDto["packaging"]>): string {
  const pending = job.approvals.filter((a) => a.stepKey === job.currentStep && a.decision === "PENDING");
  if (pending.length > 0) {
    const minOrder = Math.min(...pending.map((p) => p.stepOrder));
    return pending.filter((p) => p.stepOrder === minOrder).map((p) => ROLE_LABELS[p.role]).join(" / ");
  }
  if (job.currentStep === "INFO") return "Import";
  if (job.currentStep === "COMPLETED") return "เสร็จสิ้น";
  return "Graphic";
}

export function PackagingWorkspace({ data, master, userRoles }: Props) {
  const router = useRouter();
  const job = data.packaging;
  const initialStage: ImportStage = data.currentStage === "CLOSED" ? "LOGISTIC" : data.currentStage;
  const [activeStage, setActiveStage] = useState<ImportStage>(initialStage);
  const [pkgTab, setPkgTab] = useState<PkgTabKey>(job ? defaultPkgTab(job.currentStep) : "pi");
  const [showEvents, setShowEvents] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(job?.artworks[0]?.id ?? null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  const canUploadArtwork = userRoles.includes("GD") || userRoles.includes("ADMIN");
  const preQcReasons = master.checklists.filter((c) => c.category === "GD_PRE_QC_REJECT");
  const currentStepPlan = job?.scheduleSteps.find((s) => s.stepKey === job.currentStep);
  const finalPlanStep = job?.scheduleSteps.filter((s) => !s.isBuffer).at(-1);

  const pkgTabs: Array<{ key: PkgTabKey; label: string; badge?: string }> = [
    { key: "design", label: "ตรวจแบบ & ประวัติอนุมัติ" },
    { key: "pi", label: "ข้อมูล PI & ไฟล์ (6 ช่อง)", badge: job ? `${job.piFiles.length}` : undefined },
    { key: "preqc", label: "Graphic Pre QC", badge: job && job.preQcRejectCount > 0 ? `ตีกลับ ${job.preQcRejectCount}` : undefined },
    { key: "final", label: "อนุมัติ Final & ไฟล์จริง" },
  ];

  const handleSelectStage = (stage: ImportStage) => {
    setActiveStage(stage);
    setShowEvents(false);
  };

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md px-5 py-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1f2933] leading-tight">
            {activeStage === "PACKAGING" && job ? "Timeline Packaging Design" : `${data.caseCode} · ${data.productTitle}`}
          </h1>
          <p className="text-sm text-[#5f6b76] mt-0.5">
            {data.brandName} · {data.productTitle}
            {job ? ` · ${job.caseConfigName} · ${job.skuCount} SKUs · PI ${job.piNumber}` : ""}
          </p>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-7 gap-y-0.5 text-sm">
          <dt className="text-[#5f6b76]">สถานะ</dt>
          <dt className="text-[#5f6b76]">ผู้รับผิดชอบ</dt>
          <dt className="text-[#5f6b76]">{job ? "กำหนดขั้นนี้" : "ขั้นตอนหลัก"}</dt>
          <dt className="text-[#5f6b76]">{job ? "แผนเสร็จ Packaging" : "แผนเข้าคลัง"}</dt>
          <dd className="font-bold text-[#1d4ed8]">
            {job && activeStage === "PACKAGING" ? BOARD_STATUS_LABELS[job.timelineStatus] : STAGE_LABELS[data.currentStage]}
          </dd>
          <dd className="font-bold text-[#1f2933]">
            {job && activeStage === "PACKAGING" ? getResponsibleText(job) : data.owner.nickname ?? data.owner.thaiName}
          </dd>
          <dd className="font-bold text-[#1f2933] tabular-nums">
            {job ? formatDateShort(currentStepPlan?.plannedEnd) : STAGE_LABELS[data.currentStage]}
          </dd>
          <dd className="font-bold text-[#1f2933] tabular-nums">
            {job ? formatDateShort(finalPlanStep?.plannedEnd) : formatDateShort(data.logisticPlanEnd)}
          </dd>
        </dl>
      </section>

      <CaseStageRail data={data} selectedStage={showEvents ? undefined : activeStage} onSelectStage={handleSelectStage} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d9dee3] pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {activeStage === "PACKAGING" && job && !showEvents
            ? pkgTabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPkgTab(item.key)}
                  className={cn(
                    "px-3.5 py-2 rounded-md text-sm font-semibold transition-colors inline-flex items-center gap-1.5",
                    pkgTab === item.key ? "bg-[#0f5c4d] text-white" : "bg-white border border-[#d9dee3] text-[#1f2933] hover:bg-[#f5f7f9]"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className={cn("text-xs px-1.5 rounded", pkgTab === item.key ? "bg-white/20 text-white" : "bg-[#eef1f4] text-[#5f6b76]")}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))
            : (
                <span className="text-sm font-semibold text-[#5f6b76]">
                  {showEvents ? "บันทึกกิจกรรมทั้งหมดของ Case" : `กำลังดูขั้นตอน: ${STAGE_LABELS[activeStage]}`}
                </span>
              )}
        </div>

        <button
          type="button"
          onClick={() => setShowEvents((v) => !v)}
          className={cn(
            "px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors",
            showEvents ? "bg-[#0f5c4d] text-white" : "bg-white border border-[#d9dee3] text-[#1f2933] hover:bg-[#f5f7f9]"
          )}
        >
          Event Log ({data.auditEvents.length})
        </button>
      </div>

      {showEvents ? (
        <AuditEventLog events={data.auditEvents} />
      ) : activeStage === "SOURCING" ? (
        <SourcingPanel data={data} master={master} userRoles={userRoles} onRefresh={() => router.refresh()} />
      ) : activeStage === "PURCHASE_ORDER" ? (
        <PoPanel data={data} userRoles={userRoles} onRefresh={() => router.refresh()} />
      ) : activeStage === "PRODUCTION" ? (
        <ProductionPanel data={data} userRoles={userRoles} onRefresh={() => router.refresh()} />
      ) : activeStage === "LOGISTIC" || activeStage === "CLOSED" ? (
        <LogisticPanel data={data} userRoles={userRoles} onRefresh={() => router.refresh()} />
      ) : !job ? (
        <AttachPiCard caseId={data.id} master={master} onRefresh={() => router.refresh()} />
      ) : pkgTab === "design" ? (
        <div className="space-y-4">
          <ApprovalMatrixCard job={job} />
          <ArtworkPinViewer jobId={job.id} artworks={job.artworks} comments={job.comments} selectedArtworkId={selectedArtworkId} onSelectArtwork={setSelectedArtworkId} pendingPin={pendingPin} onPickPin={setPendingPin} canUploadArtwork={canUploadArtwork} defaultUploadStage={defaultArtworkStage(job.currentStep)} onRefresh={() => router.refresh()} />
          <DesignProofPanel job={job} userRoles={userRoles} selectedArtworkId={selectedArtworkId} pendingPin={pendingPin} onClearPin={() => setPendingPin(null)} onRefresh={() => router.refresh()} />
        </div>
      ) : pkgTab === "pi" ? (
        <PiRegistrationPanel data={data} master={master} userRoles={userRoles} onRefresh={() => router.refresh()} />
      ) : pkgTab === "preqc" ? (
        <PreQcPanel job={job} preQcReasons={preQcReasons} userRoles={userRoles} onRefresh={() => router.refresh()} />
      ) : (
        <FinalApprovalPanel job={job} userRoles={userRoles} onRefresh={() => router.refresh()} />
      )}
    </div>
  );
}
