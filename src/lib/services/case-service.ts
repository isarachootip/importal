import type { RoleCode } from "@prisma/client";
import { assertAnyRole, canActOnBrand } from "@/lib/auth/rbac";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { buildLeadTimeAlerts } from "@/lib/domain/schedule-engine";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { recalculatePackagingSchedule } from "@/lib/services/packaging-schedule-service";
import { formatNextCaseCode, type CreateCaseInput } from "@/lib/validations/case";

function primaryRoleOf(user: SessionUser): RoleCode {
  return user.roles[0] ?? "IMPORT";
}

export async function generateNextCaseCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `IP-${year}-`;
  const existing = await prisma.importCase.findMany({
    where: { caseCode: { startsWith: prefix } },
    select: { caseCode: true },
  });
  return formatNextCaseCode(
    year,
    existing.map((c) => c.caseCode)
  );
}

export async function createImportCaseWithPi(input: CreateCaseInput, user: SessionUser | null) {
  assertAnyRole(user, ["IMPORT", "ADMIN"]);

  const brand = await prisma.brand.findUnique({
    where: { id: input.brandId },
    select: { id: true, name: true, ownerId: true },
  });
  if (!brand) {
    throw new Error("ไม่พบ Brand ที่เลือก");
  }

  if (brand.ownerId && !canActOnBrand(user, brand.id)) {
    throw new AuthError("FORBIDDEN", `คุณไม่มีสิทธิ์สร้างงานสำหรับ Brand ${brand.name}`);
  }

  const caseCode = await generateNextCaseCode();
  const ownerId = brand.ownerId ?? user.id;

  const importChecklists = await prisma.checklistItemConfig.findMany({
    where: { category: "IMPORT_PRE_SUBMIT", isActive: true },
    select: { id: true },
  });

  const created = await prisma.$transaction(async (tx) => {
    const newCase = await tx.importCase.create({
      data: {
        caseCode,
        productTitle: input.productTitle,
        brandId: brand.id,
        ownerId,
        subclassId: input.subclassId || null,
        vendorId: input.vendorId || null,
        currentStage: "PACKAGING",
        sourcingStatus: "APPROVED",
        isNewPhoto: input.isNewPhoto,
        requiresTisi: input.requiresTisi,
        requiresFda: input.requiresFda,
        isTileImport: input.isTileImport,
        isNewBrandOrLogo: input.isNewBrandOrLogo,
      },
    });

    const job = await tx.packagingJob.create({
      data: {
        caseId: newCase.id,
        piNumber: input.piNumber,
        piDate: new Date(`${input.piDate}T00:00:00.000Z`),
        skuCount: input.skuCount,
        caseConfigId: input.caseConfigId,
        currentStep: "INFO",
        timelineStatus: "PENDING_IMPORT",
        isMinorChange: input.isMinorChange,
        packagingTypes: {
          create: input.packagingTypeIds.map((packagingTypeId) => ({ packagingTypeId })),
        },
        checklistAnswers: {
          create: importChecklists.map((item) => ({
            checklistItemId: item.id,
            checked: false,
          })),
        },
      },
    });

    await recordAuditEvent(
      {
        caseId: newCase.id,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "PACKAGING",
        stepKey: "INFO",
        action: "CASE_CREATED",
        afterState: { caseCode, piNumber: input.piNumber, skuCount: input.skuCount },
      },
      tx
    );

    return { importCase: newCase, packagingJob: job };
  });

  await recalculatePackagingSchedule(created.packagingJob.id);

  return created;
}

export async function getCaseDetail(idOrCode: string) {
  const importCase = await prisma.importCase.findFirst({
    where: { OR: [{ id: idOrCode }, { caseCode: idOrCode }] },
    include: {
      brand: { include: { owner: { select: { id: true, thaiName: true, nickname: true, email: true } } } },
      owner: { select: { id: true, thaiName: true, nickname: true, email: true } },
      subclass: true,
      vendor: true,
      quotations: { orderBy: [{ isSelected: "desc" }, { unitPrice: "asc" }] },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { id: true, thaiName: true, nickname: true } } },
      },
      packaging: {
        include: {
          caseConfig: true,
          packagingTypes: { include: { packagingType: true } },
          scheduleSteps: { orderBy: { plannedStart: "asc" } },
          piFiles: {
            orderBy: [{ slot: "asc" }, { version: "desc" }],
            include: { uploadedBy: { select: { id: true, thaiName: true, nickname: true } } },
          },
          checklistAnswers: {
            include: { checklistItem: true },
            orderBy: { checklistItem: { sortOrder: "asc" } },
          },
          preQcReviews: {
            orderBy: { round: "desc" },
            include: { reviewer: { select: { id: true, thaiName: true, nickname: true } } },
          },
          artworks: {
            orderBy: [{ createdAt: "desc" }],
            include: {
              uploadedBy: { select: { id: true, thaiName: true, nickname: true } },
            },
          },
          approvals: {
            orderBy: [{ createdAt: "asc" }, { stepOrder: "asc" }],
            include: { actedBy: { select: { id: true, thaiName: true, nickname: true } } },
          },
          comments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, thaiName: true, nickname: true } } },
          },
        },
      },
      auditEvents: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { actor: { select: { id: true, thaiName: true, nickname: true } } },
      },
    },
  });

  if (!importCase) return null;

  const [checklists, approvalRules] = await Promise.all([
    prisma.checklistItemConfig.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.approvalRuleConfig.findMany({
      where: { isEnabled: true },
      orderBy: [{ stageKey: "asc" }, { stepOrder: "asc" }],
    }),
  ]);

  const leadTimeAlerts = buildLeadTimeAlerts({
    requiresTisi: importCase.requiresTisi,
    requiresFda: importCase.requiresFda,
    isTileImport: importCase.isTileImport,
    isNewBrandOrLogo: importCase.isNewBrandOrLogo,
  });

  return { importCase, checklists, approvalRules, leadTimeAlerts };
}
