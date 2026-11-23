import type { ArtworkStageKind, PiFileSlot, RoleCode } from "@prisma/client";
import JSZip from "jszip";
import { assertAnyRole, canActOnBrand } from "@/lib/auth/rbac";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { getObjectBuffer, putObjectBuffer, sanitizeFileName } from "@/lib/storage/s3";
import { MAX_UPLOAD_BYTES } from "@/lib/validations/packaging";

function primaryRoleOf(user: SessionUser): RoleCode {
  return user.roles[0] ?? "IMPORT";
}

function assertUploadFile(file: File): void {
  if (!file || file.size === 0) {
    throw new Error("กรุณาเลือกไฟล์ที่ต้องการอัปโหลด");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("ขนาดไฟล์ต้องไม่เกิน 25 MB");
  }
}

export async function savePiFile(
  jobId: string,
  slot: PiFileSlot,
  file: File,
  user: SessionUser | null
) {
  assertAnyRole(user, ["IMPORT", "ADMIN"]);
  assertUploadFile(file);

  const job = await prisma.packagingJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { importCase: true },
  });
  if (!canActOnBrand(user, job.importCase.brandId)) {
    throw new AuthError("FORBIDDEN", "คุณไม่มีสิทธิ์อัปโหลดไฟล์ของ Brand นี้");
  }

  const latest = await prisma.packagingPiFile.findFirst({
    where: { packagingJobId: job.id, slot },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;
  const safeName = sanitizeFileName(file.name);
  const storageKey = `cases/${job.importCase.caseCode}/pi/${slot}/v${version}-${Date.now()}-${safeName}`;
  const contentType = file.type || "application/octet-stream";

  const buffer = Buffer.from(await file.arrayBuffer());
  await putObjectBuffer(storageKey, buffer, contentType);

  const created = await prisma.packagingPiFile.create({
    data: {
      packagingJobId: job.id,
      slot,
      version,
      fileName: file.name,
      storageKey,
      mimeType: contentType,
      sizeBytes: buffer.byteLength,
      uploadedById: user.id,
    },
  });

  await recordAuditEvent({
    caseId: job.caseId,
    actorId: user.id,
    actorRole: primaryRoleOf(user),
    stage: "PACKAGING",
    stepKey: job.currentStep,
    action: "PI_FILE_UPLOADED",
    metadata: { slot, version, fileName: file.name },
  });

  return created;
}

export async function saveArtworkFile(
  jobId: string,
  stageKind: ArtworkStageKind,
  file: File,
  user: SessionUser | null
) {
  assertAnyRole(user, ["GD", "ADMIN"]);
  assertUploadFile(file);

  const job = await prisma.packagingJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { importCase: true },
  });

  const latest = await prisma.packagingArtwork.findFirst({
    where: { packagingJobId: job.id, stageKind },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;
  const safeName = sanitizeFileName(file.name);
  const storageKey = `cases/${job.importCase.caseCode}/artwork/${stageKind}/v${version}-${Date.now()}-${safeName}`;
  const contentType = file.type || "application/octet-stream";

  const buffer = Buffer.from(await file.arrayBuffer());
  await putObjectBuffer(storageKey, buffer, contentType);

  const created = await prisma.packagingArtwork.create({
    data: {
      packagingJobId: job.id,
      stageKind,
      version,
      fileName: file.name,
      storageKey,
      mimeType: contentType,
      sizeBytes: buffer.byteLength,
      uploadedById: user.id,
    },
  });

  await recordAuditEvent({
    caseId: job.caseId,
    actorId: user.id,
    actorRole: user.roles.includes("GD") ? "GD" : primaryRoleOf(user),
    stage: "PACKAGING",
    stepKey: job.currentStep,
    action: "ARTWORK_UPLOADED",
    metadata: { stageKind, version, fileName: file.name },
  });

  return created;
}

export async function buildPiFilesZip(jobId: string, user: SessionUser | null) {
  assertAnyRole(user, ["IMPORT", "MER", "GD", "GM", "VP", "EVP", "ADMIN"]);

  const job = await prisma.packagingJob.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      importCase: { select: { caseCode: true } },
      piFiles: { orderBy: [{ slot: "asc" }, { version: "desc" }] },
    },
  });

  const latestBySlot = new Map<PiFileSlot, (typeof job.piFiles)[number]>();
  for (const file of job.piFiles) {
    if (!latestBySlot.has(file.slot)) {
      latestBySlot.set(file.slot, file);
    }
  }

  if (latestBySlot.size === 0) {
    throw new Error("ยังไม่มีไฟล์ข้อมูล PI สำหรับดาวน์โหลด");
  }

  const zip = new JSZip();
  for (const [slot, file] of latestBySlot.entries()) {
    const obj = await getObjectBuffer(file.storageKey);
    zip.file(`${slot}_v${file.version}_${sanitizeFileName(file.fileName)}`, obj.body);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const zipName = `${job.importCase.caseCode}_${sanitizeFileName(job.piNumber)}_PI_Files.zip`;

  return { zipBuffer, zipName };
}
