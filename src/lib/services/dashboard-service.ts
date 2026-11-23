import type { ImportStage, RoleCode, TimelineBoardStatus } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import {
  computeStepOverdueDays,
  deriveResponsibleLabel,
  isActionRequiredForUser,
  isDueWithinDays,
  type EnrichedCaseSummary,
} from "@/lib/domain/case-analytics";
import { toBangkokDateKey } from "@/lib/utils/date-th";
import type { CaseFilterInput } from "@/lib/validations/case-filters";

export { getDevUsersForShell } from "@/lib/auth/dev-users";

function isoOrNull(dt: Date | null | undefined): string | null {
  return dt ? dt.toISOString().slice(0, 10) : null;
}

export async function getEnrichedCaseSummaries(
  filters?: Partial<CaseFilterInput>
): Promise<EnrichedCaseSummary[]> {
  const todayIso = toBangkokDateKey(new Date());

  const rows = await prisma.importCase.findMany({
    where: {
      ...(filters?.stage ? { currentStage: filters.stage } : {}),
      ...(filters?.brandId ? { brandId: filters.brandId } : {}),
      ...(filters?.ownerId ? { ownerId: filters.ownerId } : {}),
    },
    orderBy: { caseCode: "desc" },
    include: {
      brand: { select: { id: true, name: true } },
      owner: { select: { id: true, thaiName: true, nickname: true } },
      vendor: { select: { name: true } },
      packaging: {
        include: {
          caseConfig: { select: { caseNumber: true, name: true } },
          scheduleSteps: { orderBy: { plannedStart: "asc" } },
          approvals: { orderBy: [{ round: "desc" }, { stepOrder: "asc" }] },
        },
      },
    },
  });

  const summaries: EnrichedCaseSummary[] = rows.map((c) => {
    const p = c.packaging;
    if (!p) {
      return {
        id: c.id,
        caseCode: c.caseCode,
        productTitle: c.productTitle,
        brandId: c.brand.id,
        brandName: c.brand.name,
        ownerId: c.owner.id,
        ownerName: c.owner.nickname ?? c.owner.thaiName ?? "—",
        currentStage: c.currentStage,
        vendorName: c.vendor?.name ?? null,
        poPlanEnd: isoOrNull(c.poPlanEnd),
        prodPlanEnd: isoOrNull(c.prodPlanEnd),
        logisticPlanEnd: isoOrNull(c.logisticPlanEnd),
        packaging: null,
      };
    }

    const activeStep = p.scheduleSteps.find((s) => s.stepKey === p.currentStep);
    const lastMainStep = p.scheduleSteps.filter((s) => !s.isBuffer).at(-1);
    const stepPlannedEnd = isoOrNull(activeStep?.plannedEnd);
    const stepActualEnd = isoOrNull(activeStep?.actualEnd);

    const stepApprovals = p.approvals.filter((a) => a.stepKey === p.currentStep);
    const maxRound = stepApprovals.reduce((m, a) => Math.max(m, a.round), 0);
    const pendingRows = stepApprovals.filter((a) => a.round === maxRound && a.decision === "PENDING");
    const minOrder = pendingRows.length > 0 ? Math.min(...pendingRows.map((a) => a.stepOrder)) : null;
    const pendingRoles: RoleCode[] =
      minOrder !== null
        ? pendingRows.filter((a) => a.stepOrder === minOrder).map((a) => a.role)
        : [];

    const overdueDays =
      p.currentStep === "COMPLETED"
        ? 0
        : computeStepOverdueDays(stepPlannedEnd, stepActualEnd, todayIso);
    const isDueSoon =
      p.currentStep === "COMPLETED"
        ? false
        : isDueWithinDays(stepPlannedEnd, stepActualEnd, todayIso, 3);

    return {
      id: c.id,
      caseCode: c.caseCode,
      productTitle: c.productTitle,
      brandId: c.brand.id,
      brandName: c.brand.name,
      ownerId: c.owner.id,
      ownerName: c.owner.nickname ?? c.owner.thaiName ?? "—",
      currentStage: c.currentStage,
      vendorName: c.vendor?.name ?? null,
      poPlanEnd: isoOrNull(c.poPlanEnd),
      prodPlanEnd: isoOrNull(c.prodPlanEnd),
      logisticPlanEnd: isoOrNull(c.logisticPlanEnd),
      packaging: {
        id: p.id,
        piNumber: p.piNumber,
        piDate: isoOrNull(p.piDate) ?? "",
        skuCount: p.skuCount,
        caseNumber: p.caseConfig.caseNumber,
        caseConfigName: p.caseConfig.name,
        currentStep: p.currentStep,
        timelineStatus: p.timelineStatus,
        preQcRejectCount: p.preQcRejectCount,
        isMinorChange: p.isMinorChange,
        stepPlannedEnd,
        packagingPlanEnd: isoOrNull(lastMainStep?.plannedEnd),
        pendingRoles,
        responsibleLabel: deriveResponsibleLabel(p.currentStep, pendingRoles),
        overdueDays,
        isDueSoon,
      },
    };
  });

  return summaries.filter((item) => {
    if (filters?.timelineStatus && item.packaging?.timelineStatus !== filters.timelineStatus) {
      return false;
    }
    if (filters?.caseNumber && item.packaging?.caseNumber !== filters.caseNumber) {
      return false;
    }
    if (filters?.overdueOnly && (item.packaging?.overdueDays ?? 0) <= 0) {
      return false;
    }
    if (filters?.q) {
      const needle = filters.q.toLowerCase();
      const hay = [
        item.caseCode,
        item.productTitle,
        item.brandName,
        item.ownerName,
        item.vendorName ?? "",
        item.packaging?.piNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

export async function getDashboardSnapshot(user: SessionUser | null) {
  const allCases = await getEnrichedCaseSummaries();
  const activeCases = allCases.filter((c) => c.currentStage !== "CLOSED");
  const activePackaging = allCases.filter(
    (c) => c.packaging && c.packaging.currentStep !== "COMPLETED"
  );

  const myQueue = activePackaging
    .filter((c) => isActionRequiredForUser(c, user))
    .sort((a, b) => (a.packaging?.stepPlannedEnd ?? "9999").localeCompare(b.packaging?.stepPlannedEnd ?? "9999"));

  const overdueOrAtRisk = activePackaging
    .filter((c) => (c.packaging?.overdueDays ?? 0) > 0 || c.packaging?.isDueSoon)
    .sort((a, b) => (b.packaging?.overdueDays ?? 0) - (a.packaging?.overdueDays ?? 0));

  const stageCounts: Record<ImportStage, number> = {
    SOURCING: 0, PACKAGING: 0, PURCHASE_ORDER: 0, PRODUCTION: 0, LOGISTIC: 0, CLOSED: 0,
  };
  for (const c of allCases) stageCounts[c.currentStage] += 1;

  const boardCounts: Record<TimelineBoardStatus, number> = {
    PENDING_IMPORT: 0, PRE_QC_GD: 0, ON_PROCESS: 0, SENT_DRAFT_1: 0,
    SENT_DRAFT_2: 0, SENT_DRAFT_3: 0, APPROVE_FINAL: 0, APPROVED_FINAL: 0,
  };
  for (const c of allCases) {
    if (c.packaging) boardCounts[c.packaging.timelineStatus] += 1;
  }

  return {
    allCases,
    kpis: {
      totalActiveCases: activeCases.length,
      activePackagingCount: activePackaging.length,
      myQueueCount: myQueue.length,
      overdueCount: activePackaging.filter((c) => (c.packaging?.overdueDays ?? 0) > 0).length,
      totalPreQcRejects: allCases.reduce((sum, c) => sum + (c.packaging?.preQcRejectCount ?? 0), 0),
    },
    stageCounts,
    boardCounts,
    myQueue,
    overdueOrAtRisk,
  };
}
