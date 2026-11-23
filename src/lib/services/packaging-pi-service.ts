import type { RoleCode } from "@prisma/client";
import { assertAnyRole, canActOnBrand } from "@/lib/auth/rbac";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { recalculatePackagingSchedule } from "@/lib/services/packaging-schedule-service";
import type { CreateCommentInput, UpdatePiInput } from "@/lib/validations/packaging";

function primaryRoleOf(user: SessionUser): RoleCode {
  return user.roles[0] ?? "IMPORT";
}

export async function updatePiAndChecklist(
  jobId: string,
  input: UpdatePiInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "ADMIN"]);

  const job = await prisma.packagingJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { importCase: true },
  });

  if (!canActOnBrand(user, job.importCase.brandId)) {
    throw new AuthError("FORBIDDEN", "คุณไม่มีสิทธิ์แก้ไขข้อมูล PI ของ Brand นี้");
  }

  const scheduleAffected =
    input.piDate !== undefined ||
    input.skuCount !== undefined ||
    input.caseConfigId !== undefined ||
    input.isMinorChange !== undefined ||
    input.isNewPhoto !== undefined;

  await prisma.$transaction(async (tx) => {
    await tx.packagingJob.update({
      where: { id: job.id },
      data: {
        ...(input.piNumber !== undefined ? { piNumber: input.piNumber } : {}),
        ...(input.piDate !== undefined ? { piDate: new Date(`${input.piDate}T00:00:00.000Z`) } : {}),
        ...(input.skuCount !== undefined ? { skuCount: input.skuCount } : {}),
        ...(input.caseConfigId !== undefined ? { caseConfigId: input.caseConfigId } : {}),
        ...(input.isMinorChange !== undefined ? { isMinorChange: input.isMinorChange } : {}),
      },
    });

    if (
      input.isNewPhoto !== undefined ||
      input.requiresTisi !== undefined ||
      input.requiresFda !== undefined ||
      input.isTileImport !== undefined ||
      input.isNewBrandOrLogo !== undefined
    ) {
      await tx.importCase.update({
        where: { id: job.caseId },
        data: {
          ...(input.isNewPhoto !== undefined ? { isNewPhoto: input.isNewPhoto } : {}),
          ...(input.requiresTisi !== undefined ? { requiresTisi: input.requiresTisi } : {}),
          ...(input.requiresFda !== undefined ? { requiresFda: input.requiresFda } : {}),
          ...(input.isTileImport !== undefined ? { isTileImport: input.isTileImport } : {}),
          ...(input.isNewBrandOrLogo !== undefined ? { isNewBrandOrLogo: input.isNewBrandOrLogo } : {}),
        },
      });
    }

    if (input.packagingTypeIds !== undefined) {
      await tx.packagingJobType.deleteMany({ where: { packagingJobId: job.id } });
      if (input.packagingTypeIds.length > 0) {
        await tx.packagingJobType.createMany({
          data: input.packagingTypeIds.map((packagingTypeId) => ({
            packagingJobId: job.id,
            packagingTypeId,
          })),
        });
      }
    }

    if (input.checklistAnswers !== undefined) {
      for (const ans of input.checklistAnswers) {
        await tx.packagingChecklistAnswer.upsert({
          where: {
            packagingJobId_checklistItemId: {
              packagingJobId: job.id,
              checklistItemId: ans.checklistItemId,
            },
          },
          update: { checked: ans.checked, note: ans.note ?? null },
          create: {
            packagingJobId: job.id,
            checklistItemId: ans.checklistItemId,
            checked: ans.checked,
            note: ans.note ?? null,
          },
        });
      }
    }

    await recordAuditEvent(
      {
        caseId: job.caseId,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "PACKAGING",
        stepKey: job.currentStep,
        action: "PI_UPDATED",
        metadata: { scheduleAffected },
      },
      tx
    );
  });

  if (scheduleAffected) {
    await recalculatePackagingSchedule(job.id);
  }

  return prisma.packagingJob.findUniqueOrThrow({ where: { id: job.id } });
}

export async function addPackagingComment(
  jobId: string,
  input: CreateCommentInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "MER", "GD", "GM", "VP", "EVP", "ADMIN"]);

  const job = await prisma.packagingJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { id: true, caseId: true, currentStep: true },
  });

  let pinNumber: number | null = null;
  const hasPin = typeof input.pinX === "number" && typeof input.pinY === "number";
  if (hasPin) {
    const existingPins = await prisma.packagingComment.count({
      where: {
        packagingJobId: job.id,
        artworkVersionId: input.artworkVersionId ?? null,
        pinNumber: { not: null },
      },
    });
    pinNumber = existingPins + 1;
  }

  const created = await prisma.packagingComment.create({
    data: {
      packagingJobId: job.id,
      artworkVersionId: input.artworkVersionId ?? null,
      authorId: user.id,
      authorRole: primaryRoleOf(user),
      body: input.body,
      pinNumber,
      pinX: hasPin ? input.pinX : null,
      pinY: hasPin ? input.pinY : null,
      pageNumber: input.pageNumber ?? (hasPin ? 1 : null),
    },
    include: { author: { select: { id: true, thaiName: true, nickname: true } } },
  });

  await recordAuditEvent({
    caseId: job.caseId,
    actorId: user.id,
    actorRole: primaryRoleOf(user),
    stage: "PACKAGING",
    stepKey: job.currentStep,
    action: "COMMENT_ADDED",
    metadata: { commentId: created.id, pinNumber },
  });

  return created;
}
