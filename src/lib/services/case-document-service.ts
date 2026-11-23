import type { CaseDocType, ImportStage, RoleCode } from "@prisma/client";
import { assertAnyRole } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { putObjectBuffer, sanitizeFileName } from "@/lib/storage/s3";
import { MAX_UPLOAD_BYTES } from "@/lib/validations/packaging";

function primaryRoleOf(user: SessionUser): RoleCode {
  return user.roles[0] ?? "IMPORT";
}

export async function saveCaseDocument(
  idOrCode: string,
  stage: ImportStage,
  docType: CaseDocType,
  file: File,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "MER", "VENDOR", "FORWARDER", "GM", "VP", "EVP", "ADMIN"]);

  if (!file || file.size === 0) {
    throw new Error("กรุณาเลือกไฟล์เอกสารที่ต้องการอัปโหลด");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("ขนาดไฟล์ต้องไม่เกิน 25 MB");
  }

  const c = await prisma.importCase.findFirstOrThrow({
    where: { OR: [{ id: idOrCode }, { caseCode: idOrCode }] },
    select: { id: true, caseCode: true },
  });

  const safeName = sanitizeFileName(file.name);
  const storageKey = `cases/${c.caseCode}/docs/${stage}/${docType}-${Date.now()}-${safeName}`;
  const contentType = file.type || "application/octet-stream";

  const buffer = Buffer.from(await file.arrayBuffer());
  await putObjectBuffer(storageKey, buffer, contentType);

  const created = await prisma.caseDocument.create({
    data: {
      caseId: c.id,
      stage,
      docType,
      fileName: file.name,
      storageKey,
      mimeType: contentType,
      sizeBytes: buffer.byteLength,
      uploadedById: user.id,
    },
    include: { uploadedBy: { select: { id: true, thaiName: true, nickname: true } } },
  });

  await recordAuditEvent({
    caseId: c.id,
    actorId: user.id,
    actorRole: primaryRoleOf(user),
    stage,
    action: "CASE_DOC_UPLOADED",
    metadata: { docType, fileName: file.name },
  });

  return created;
}
