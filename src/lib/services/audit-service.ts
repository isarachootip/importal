import type { ImportStage, Prisma, PrismaClient, RoleCode } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db/prisma";

export interface AuditInput {
  caseId: string;
  actorId: string;
  actorRole: RoleCode;
  stage: ImportStage;
  stepKey?: string;
  action: string;
  beforeState?: Prisma.InputJsonValue;
  afterState?: Prisma.InputJsonValue;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function recordAuditEvent(
  input: AuditInput,
  db: PrismaClient | Prisma.TransactionClient = defaultPrisma
) {
  return db.auditEvent.create({
    data: {
      caseId: input.caseId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      stage: input.stage,
      stepKey: input.stepKey,
      action: input.action,
      beforeState: input.beforeState,
      afterState: input.afterState,
      reason: input.reason,
      metadata: input.metadata,
    },
  });
}
