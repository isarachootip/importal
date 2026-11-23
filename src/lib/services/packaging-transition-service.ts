import { canActOnBrand } from "@/lib/auth/rbac";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import {
  buildApprovalsForStep,
  transitionPackaging,
  type ApprovalRule,
  type PackagingMachineState,
  type StepApprovalSlot,
} from "@/lib/domain/packaging-machine";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { notifyPackagingTransition } from "@/lib/services/notification-service";
import type { PackagingTransitionInput } from "@/lib/validations/packaging";
import {
  resolveAuditMeta,
  resolveRequiredArtworks,
  todayUtcDate,
  toMachineAction,
} from "./packaging-transition-helpers";

export async function executePackagingTransition(
  jobId: string,
  input: PackagingTransitionInput,
  user: SessionUser | null
) {
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบก่อนดำเนินการ");
  }

  const [job, requiredChecklistItems, ruleRows, minorChangeSetting] = await Promise.all([
    prisma.packagingJob.findUniqueOrThrow({
      where: { id: jobId },
      include: {
        importCase: true,
        caseConfig: true,
        packagingTypes: true,
        checklistAnswers: true,
        approvals: { orderBy: [{ round: "desc" }, { stepOrder: "asc" }] },
        artworks: { select: { stageKind: true } },
        preQcReviews: { orderBy: { round: "desc" }, take: 1 },
      },
    }),
    prisma.checklistItemConfig.findMany({
      where: { category: "IMPORT_PRE_SUBMIT", isActive: true, isRequired: true },
      select: { id: true },
    }),
    prisma.approvalRuleConfig.findMany({ orderBy: [{ stageKey: "asc" }, { stepOrder: "asc" }] }),
    prisma.systemSetting.findUnique({ where: { key: "repeat_order_minor_change_enabled" } }),
  ]);

  if (input.type === "SUBMIT_PI" && !canActOnBrand(user, job.importCase.brandId)) {
    throw new AuthError("FORBIDDEN", "คุณไม่มีสิทธิ์ส่งข้อมูล PI ของ Brand นี้");
  }

  const rules: ApprovalRule[] = ruleRows.map((r) => ({
    stageKey: r.stageKey, stepOrder: r.stepOrder, role: r.role, isParallel: r.isParallel, isEnabled: r.isEnabled,
  }));

  const stepApprovalsAll = job.approvals.filter((a) => a.stepKey === job.currentStep);
  const latestRound = stepApprovalsAll.reduce((max, a) => Math.max(max, a.round), 0);
  const activeStepRows = stepApprovalsAll.filter((a) => a.round === latestRound);

  const currentStepApprovals: StepApprovalSlot[] =
    activeStepRows.length > 0
      ? activeStepRows.map((a) => ({ role: a.role, stepOrder: a.stepOrder, decision: a.decision }))
      : buildApprovalsForStep(job.currentStep, rules);

  const checkedSet = new Set(job.checklistAnswers.filter((c) => c.checked).map((c) => c.checklistItemId));
  const requiredChecklistComplete = requiredChecklistItems.every((item) => checkedSet.has(item.id));
  const requiredStages = resolveRequiredArtworks(input.type, job.currentStep);
  const hasFile =
    requiredStages.length === 0 || job.artworks.some((art) => requiredStages.includes(art.stageKind));

  const currentState: PackagingMachineState = {
    caseNumber: job.caseConfig.caseNumber,
    currentStep: job.currentStep,
    timelineStatus: job.timelineStatus,
    piNumber: job.piNumber,
    packagingTypeCount: job.packagingTypes.length,
    requiredChecklistComplete,
    isMinorChange: job.isMinorChange,
    minorChangeRuleEnabled: minorChangeSetting?.value !== false,
    preQcRejectCount: job.preQcRejectCount,
    currentStepApprovals,
    approvalRules: rules,
  };

  const nextState = transitionPackaging(currentState, toMachineAction(input, user.roles, hasFile));
  const now = new Date();
  const today = todayUtcDate();
  const stepChanged = nextState.currentStep !== job.currentStep;
  const auditMeta = resolveAuditMeta(input, user.roles);

  await prisma.$transaction(async (tx) => {
    let workingStepRows = activeStepRows;
    if (workingStepRows.length === 0 && currentStepApprovals.length > 0) {
      const initRound = latestRound + 1;
      await tx.packagingApproval.createMany({
        data: currentStepApprovals.map((s) => ({
          packagingJobId: job.id,
          stepKey: job.currentStep,
          round: initRound,
          stepOrder: s.stepOrder,
          role: s.role,
          decision: "PENDING",
        })),
      });
      workingStepRows = await tx.packagingApproval.findMany({
        where: { packagingJobId: job.id, stepKey: job.currentStep, round: initRound },
      });
    }

    if (input.type === "PRE_QC_REJECT" || input.type === "PRE_QC_ACCEPT") {
      await tx.packagingPreQc.create({
        data: {
          packagingJobId: job.id,
          round: (job.preQcReviews[0]?.round ?? 0) + 1,
          decision: input.type === "PRE_QC_ACCEPT" ? "SUBMITTED" : "REJECTED",
          failedCodes: input.type === "PRE_QC_REJECT" ? input.failedCodes : [],
          note: input.type === "PRE_QC_REJECT" ? input.reason ?? null : input.note ?? null,
          reviewerId: user.id,
        },
      });
    }

    if (input.type === "APPROVE_STEP" || input.type === "REQUEST_REVISION") {
      const targetRow = workingStepRows.find(
        (row) => row.role === input.actingRole && row.decision === "PENDING"
      );
      if (targetRow) {
        await tx.packagingApproval.update({
          where: { id: targetRow.id },
          data: {
            decision: input.type === "APPROVE_STEP" ? "APPROVED" : "REVISION_REQUESTED",
            reason: input.reason?.trim() || null,
            actedById: user.id,
            actedAt: now,
          },
        });
      }
    }

    await tx.packagingJob.update({
      where: { id: job.id },
      data: { currentStep: nextState.currentStep, timelineStatus: nextState.timelineStatus, preQcRejectCount: nextState.preQcRejectCount },
    });

    if (stepChanged) {
      await tx.packagingScheduleStep.updateMany({ where: { packagingJobId: job.id, stepKey: job.currentStep }, data: { actualEnd: today } });
      await tx.packagingScheduleStep.updateMany({ where: { packagingJobId: job.id, stepKey: nextState.currentStep, actualStart: null }, data: { actualStart: today } });

      if (nextState.currentStepApprovals.length > 0) {
        const prevMax = job.approvals.filter((a) => a.stepKey === nextState.currentStep).reduce((m, a) => Math.max(m, a.round), 0);
        await tx.packagingApproval.createMany({
          data: nextState.currentStepApprovals.map((slot) => ({
            packagingJobId: job.id,
            stepKey: nextState.currentStep,
            round: prevMax + 1,
            stepOrder: slot.stepOrder,
            role: slot.role,
            decision: "PENDING",
          })),
        });
      }

      if (nextState.currentStep === "COMPLETED" && job.importCase.currentStage === "PACKAGING") {
        await tx.importCase.update({ where: { id: job.caseId }, data: { currentStage: "PURCHASE_ORDER", poStatus: "PO_DRAFT" } });
      }
    }

    await recordAuditEvent(
      {
        caseId: job.caseId,
        actorId: user.id,
        actorRole: auditMeta.actorRole,
        stage: "PACKAGING",
        stepKey: nextState.currentStep,
        action: input.type,
        beforeState: { step: job.currentStep, timelineStatus: job.timelineStatus },
        afterState: { step: nextState.currentStep, timelineStatus: nextState.timelineStatus },
        reason: auditMeta.reason,
      },
      tx
    );
  });

  try {
    await notifyPackagingTransition({
      caseId: job.caseId, caseCode: job.importCase.caseCode, productTitle: job.importCase.productTitle,
      ownerId: job.importCase.ownerId, actionType: input.type, nextStep: nextState.currentStep,
      nextPendingRoles: nextState.currentStepApprovals.filter((s) => s.decision === "PENDING").map((s) => s.role),
      reason: auditMeta.reason,
    });
  } catch (err) { console.error("[Importal Notification]", err); }

  return nextState;
}
