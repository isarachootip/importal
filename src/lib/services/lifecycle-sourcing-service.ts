import type { RoleCode } from "@prisma/client";
import { assertAnyRole, canActOnBrand } from "@/lib/auth/rbac";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { recalculatePackagingSchedule } from "@/lib/services/packaging-schedule-service";
import type {
  AttachPiToCaseInput,
  CreateQuotationInput,
  UpdateSourcingInput,
} from "@/lib/validations/lifecycle";

const primaryRoleOf = (user: SessionUser): RoleCode => user.roles[0] ?? "IMPORT";
const todayUtc = (): Date => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
const resolveCase = (idOrCode: string) =>
  prisma.importCase.findFirstOrThrow({
    where: { OR: [{ id: idOrCode }, { caseCode: idOrCode }] },
    include: { packaging: { select: { id: true } } },
  });

export async function addSourcingQuotation(
  idOrCode: string,
  input: CreateQuotationInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "MER", "VENDOR", "ADMIN"]);
  const c = await resolveCase(idOrCode);

  const created = await prisma.$transaction(async (tx) => {
    const quote = await tx.sourcingQuotation.create({
      data: {
        caseId: c.id,
        vendorId: input.vendorId || null,
        vendorName: input.vendorName,
        unitPrice: input.unitPrice,
        currency: input.currency,
        moq: input.moq,
        leadTimeDays: input.leadTimeDays,
        incoterm: input.incoterm,
        notes: input.notes || null,
      },
    });

    if (c.sourcingStatus === "DRAFT" || c.sourcingStatus === "RFQ_SENT") {
      await tx.importCase.update({
        where: { id: c.id },
        data: { sourcingStatus: "QUOTE_RECEIVED" },
      });
    }

    await recordAuditEvent(
      {
        caseId: c.id,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "SOURCING",
        action: "QUOTATION_ADDED",
        afterState: { vendorName: input.vendorName, unitPrice: input.unitPrice, currency: input.currency },
      },
      tx
    );

    return quote;
  });

  return created;
}

export async function updateSourcingStage(
  idOrCode: string,
  input: UpdateSourcingInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "MER", "GM", "VP", "ADMIN"]);
  const c = await resolveCase(idOrCode);

  if (input.sourcingStatus === "APPROVED" && !user.roles.some((r) => ["IMPORT", "MER", "GM", "VP", "ADMIN"].includes(r))) {
    throw new AuthError("FORBIDDEN", "ไม่มีสิทธิ์อนุมัติ Sourcing");
  }

  return prisma.$transaction(async (tx) => {
    let selectedVendorId = c.vendorId;
    if (input.selectQuotationId) {
      const targetQuote = await tx.sourcingQuotation.findFirstOrThrow({
        where: { id: input.selectQuotationId, caseId: c.id },
      });
      await tx.sourcingQuotation.updateMany({ where: { caseId: c.id }, data: { isSelected: false } });
      await tx.sourcingQuotation.update({ where: { id: targetQuote.id }, data: { isSelected: true } });
      if (targetQuote.vendorId) selectedVendorId = targetQuote.vendorId;
    }

    const nextStatus = input.sourcingStatus ?? (input.selectQuotationId ? "OFFER_SELECTED" : c.sourcingStatus);
    const shouldAdvanceToPackaging = nextStatus === "APPROVED" && c.currentStage === "SOURCING";

    const updated = await tx.importCase.update({
      where: { id: c.id },
      data: {
        sourcingStatus: nextStatus,
        vendorId: selectedVendorId,
        ...(input.sourcingPlanEnd !== undefined
          ? { sourcingPlanEnd: input.sourcingPlanEnd ? new Date(`${input.sourcingPlanEnd}T00:00:00.000Z`) : null }
          : {}),
        ...(shouldAdvanceToPackaging
          ? { currentStage: "PACKAGING", sourcingActualEnd: todayUtc() }
          : {}),
      },
    });

    await recordAuditEvent(
      {
        caseId: c.id,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "SOURCING",
        stepKey: nextStatus,
        action: "SOURCING_UPDATED",
        beforeState: { sourcingStatus: c.sourcingStatus, currentStage: c.currentStage },
        afterState: { sourcingStatus: updated.sourcingStatus, currentStage: updated.currentStage },
        reason: input.note,
      },
      tx
    );

    return updated;
  });
}

export async function attachPiToExistingCase(
  idOrCode: string,
  input: AttachPiToCaseInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "ADMIN"]);
  const c = await resolveCase(idOrCode);
  if (!canActOnBrand(user, c.brandId)) {
    throw new AuthError("FORBIDDEN", "คุณไม่มีสิทธิ์ลงทะเบียน PI สำหรับ Brand นี้");
  }
  if (c.packaging) {
    throw new Error("Case นี้ลงทะเบียน PI & Packaging ไปแล้ว");
  }

  const importChecklists = await prisma.checklistItemConfig.findMany({
    where: { category: "IMPORT_PRE_SUBMIT", isActive: true },
    select: { id: true },
  });

  const job = await prisma.$transaction(async (tx) => {
    const createdJob = await tx.packagingJob.create({
      data: {
        caseId: c.id,
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
          create: importChecklists.map((item) => ({ checklistItemId: item.id, checked: false })),
        },
      },
    });

    await tx.importCase.update({
      where: { id: c.id },
      data: {
        currentStage: "PACKAGING",
        sourcingStatus: "APPROVED",
        sourcingActualEnd: c.sourcingActualEnd ?? todayUtc(),
      },
    });

    await recordAuditEvent(
      {
        caseId: c.id,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "PACKAGING",
        stepKey: "INFO",
        action: "PI_ATTACHED",
        afterState: { piNumber: input.piNumber, skuCount: input.skuCount },
      },
      tx
    );

    return createdJob;
  });

  await recalculatePackagingSchedule(job.id);
  return job;
}
