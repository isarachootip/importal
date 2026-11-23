import type { RoleCode } from "@prisma/client";
import { assertAnyRole } from "@/lib/auth/rbac";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import type {
  UpdateLogisticInput,
  UpdatePoInput,
  UpdateProductionInput,
} from "@/lib/validations/lifecycle";

function primaryRoleOf(user: SessionUser): RoleCode {
  return user.roles[0] ?? "IMPORT";
}

function todayUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function isoToUtcOrNull(iso: string | null | undefined): Date | null | undefined {
  if (iso === undefined) return undefined;
  return iso ? new Date(`${iso}T00:00:00.000Z`) : null;
}

async function resolveCase(idOrCode: string) {
  return prisma.importCase.findFirstOrThrow({
    where: { OR: [{ id: idOrCode }, { caseCode: idOrCode }] },
  });
}

export async function updatePurchaseOrderStage(
  idOrCode: string,
  input: UpdatePoInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "GM", "VP", "EVP", "VENDOR", "ADMIN"]);
  const c = await resolveCase(idOrCode);

  if (
    input.poStatus === "PO_APPROVED" &&
    !user.roles.some((r) => ["GM", "VP", "EVP", "ADMIN"].includes(r))
  ) {
    throw new AuthError("FORBIDDEN", "เฉพาะ GM / VP / EVP เท่านั้นที่สามารถอนุมัติ PO ได้");
  }

  const advanceToProduction =
    input.poStatus === "PO_ACCEPTED" &&
    (c.currentStage === "PURCHASE_ORDER" || c.currentStage === "PACKAGING");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.importCase.update({
      where: { id: c.id },
      data: {
        poStatus: input.poStatus,
        ...(input.poNumber !== undefined ? { poNumber: input.poNumber || null } : {}),
        ...(input.poTotalAmount !== undefined ? { poTotalAmount: input.poTotalAmount } : {}),
        ...(input.poCurrency !== undefined ? { poCurrency: input.poCurrency } : {}),
        ...(input.incoterm !== undefined ? { incoterm: input.incoterm || null } : {}),
        ...(advanceToProduction
          ? {
              poActualEnd: todayUtc(),
              currentStage: "PRODUCTION",
              productionStatus: c.productionStatus === "NOT_STARTED" ? "PO_ACCEPTED" : c.productionStatus,
            }
          : {}),
      },
    });

    await recordAuditEvent(
      {
        caseId: c.id,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "PURCHASE_ORDER",
        stepKey: input.poStatus,
        action: "PO_UPDATED",
        beforeState: { poStatus: c.poStatus, poNumber: c.poNumber },
        afterState: { poStatus: updated.poStatus, poNumber: updated.poNumber },
        reason: input.note,
      },
      tx
    );

    return updated;
  });
}

export async function updateProductionStage(
  idOrCode: string,
  input: UpdateProductionInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "VENDOR", "ADMIN"]);
  const c = await resolveCase(idOrCode);

  const advanceToLogistic =
    input.productionStatus === "READY_TO_SHIP" &&
    (c.currentStage === "PRODUCTION" || c.currentStage === "PURCHASE_ORDER");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.importCase.update({
      where: { id: c.id },
      data: {
        productionStatus: input.productionStatus,
        ...(advanceToLogistic
          ? {
              prodActualEnd: todayUtc(),
              currentStage: "LOGISTIC",
              logisticStatus: c.logisticStatus === "NOT_STARTED" ? "BOOKED" : c.logisticStatus,
            }
          : {}),
      },
    });

    await recordAuditEvent(
      {
        caseId: c.id,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "PRODUCTION",
        stepKey: input.productionStatus,
        action: "PRODUCTION_UPDATED",
        beforeState: { productionStatus: c.productionStatus },
        afterState: { productionStatus: updated.productionStatus, currentStage: updated.currentStage },
        reason: input.note,
      },
      tx
    );

    return updated;
  });
}

export async function updateLogisticStage(
  idOrCode: string,
  input: UpdateLogisticInput,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "FORWARDER", "ADMIN"]);
  const c = await resolveCase(idOrCode);

  const isClosing = input.logisticStatus === "RECEIVED_COMPLETE";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.importCase.update({
      where: { id: c.id },
      data: {
        logisticStatus: input.logisticStatus,
        ...(input.shippingMode !== undefined ? { shippingMode: input.shippingMode } : {}),
        ...(input.forwarderName !== undefined ? { forwarderName: input.forwarderName || null } : {}),
        ...(input.blOrAwbNumber !== undefined ? { blOrAwbNumber: input.blOrAwbNumber || null } : {}),
        ...(input.containerNumber !== undefined ? { containerNumber: input.containerNumber || null } : {}),
        ...(input.etd !== undefined ? { etd: isoToUtcOrNull(input.etd) } : {}),
        ...(input.eta !== undefined ? { eta: isoToUtcOrNull(input.eta) } : {}),
        ...(input.whIssueNote !== undefined ? { whIssueNote: input.whIssueNote || null } : {}),
        ...(isClosing
          ? {
              logisticActualEnd: todayUtc(),
              currentStage: "CLOSED",
              closedAt: new Date(),
            }
          : {}),
      },
    });

    await recordAuditEvent(
      {
        caseId: c.id,
        actorId: user.id,
        actorRole: primaryRoleOf(user),
        stage: "LOGISTIC",
        stepKey: input.logisticStatus,
        action: isClosing ? "CASE_CLOSED" : "LOGISTIC_UPDATED",
        beforeState: { logisticStatus: c.logisticStatus },
        afterState: { logisticStatus: updated.logisticStatus, currentStage: updated.currentStage },
        reason: input.note ?? input.whIssueNote ?? undefined,
      },
      tx
    );

    return updated;
  });
}
