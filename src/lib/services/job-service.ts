import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { TrackerSession } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import type { SubStatus } from "@/lib/domain/aw-constants";
import type { HistoryMark, JobRecord, OutboxMail } from "@/lib/domain/job-types";
import { HOL_DEFAULT, todayBangkok } from "@/lib/domain/working-days";
import type { JobFormSchema } from "@/lib/validations/aw-schemas";
import { dispatchJobNotification } from "./email-service";

export { editExistingJob } from "./job-edit-service";

export const JOB_INCLUDE = {
  history: { orderBy: { seq: "asc" as const } },
  edits: { orderBy: { createdAt: "desc" as const } },
  files: { orderBy: { createdAt: "asc" as const } },
  skus: { orderBy: { seq: "asc" as const } },
} satisfies Prisma.PackagingJobInclude;

type DbJobWithRelations = Prisma.PackagingJobGetPayload<{ include: typeof JOB_INCLUDE }>;

export function mapDbJobToRecord(row: DbJobWithRelations): JobRecord {
  const sdepts = row.sdeptCodes.length > 0 ? row.sdeptCodes : [102];
  return {
    id: row.id,
    jobCode: row.jobCode,
    pi: row.piNumber,
    piDate: row.piDate,
    bu: row.bu,
    supplier: row.supplier,
    brand: row.brand,
    pattern: row.patternId,
    sdept: sdepts[0]!,
    sdepts,
    folder: row.folderUrl,
    items: row.itemCount,
    license: row.license,
    packages: row.packages,
    importer: row.importerName,
    designer: row.designerName,
    brief: row.briefRequired === "Y" ? "Y" : "N",
    photo: row.hasPhotoShoot,
    leadtime: row.leadtimeDays,
    poNumber: row.poNumber,
    skuFile: row.skuFileName,
    history: row.history.map((h) => ({
      id: h.id,
      sub: h.subStatus as SubStatus,
      d: h.actionDate,
      by: h.actorRole,
      act: h.actionTitle,
      note: h.note,
      mark: (h.mark as HistoryMark | null) ?? null,
    })),
    edits: row.edits.map((e) => ({
      id: e.id,
      d: e.editedDate,
      by: e.actorRole,
      user: e.actorUser,
      ch: e.changes,
      sla: e.slaDiff,
    })),
    files: row.files.map((f) => ({
      id: f.id,
      name: f.fileName,
      storageKey: f.storageKey,
      link: f.isLink,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      by: f.uploadedByRole,
      d: f.uploadedDate,
    })),
    skus: row.skus.map((s) => ({
      id: s.id,
      sku: s.skuCode,
      created: s.mmsCreatedDate,
      gr: s.goodsReceivedDate,
    })),
  };
}

export async function fetchHolidaySet(): Promise<Set<string>> {
  const rows = await prisma.companyHoliday.findMany({ select: { date: true } });
  return new Set(rows.length > 0 ? rows.map((r) => r.date) : HOL_DEFAULT);
}

export async function listAllJobs(): Promise<JobRecord[]> {
  const rows = await prisma.packagingJob.findMany({
    include: JOB_INCLUDE,
    orderBy: { piDate: "desc" },
  });
  return rows.map(mapDbJobToRecord);
}

export async function getJobByIdOrCode(idOrCode: string): Promise<JobRecord | null> {
  const row = await prisma.packagingJob.findFirst({
    where: { OR: [{ id: idOrCode }, { jobCode: idOrCode }, { piNumber: idOrCode }] },
    include: JOB_INCLUDE,
  });
  return row ? mapDbJobToRecord(row) : null;
}

export async function createNewJob(
  input: z.infer<typeof JobFormSchema>,
  session: TrackerSession
): Promise<{ job: JobRecord; mail: OutboxMail | null }> {
  if (session.role !== "import" && session.role !== "mgmt") {
    throw new Error("การแจ้งงานใหม่ทำได้โดย Import เท่านั้น");
  }
  const dup = await prisma.packagingJob.findUnique({ where: { piNumber: input.pi } });
  if (dup) throw new Error("PI Number นี้มีในระบบแล้ว");

  const today = todayBangkok();
  const totalCount = await prisma.packagingJob.count();
  const jobCode = `J${1001 + totalCount + Math.floor(Math.random() * 900)}`;

  const created = await prisma.$transaction(async (tx) => {
    await tx.formDraft.deleteMany({ where: { draftKey: `create:${session.role}` } });
    return tx.packagingJob.create({
      data: {
        jobCode,
        piNumber: input.pi,
        piDate: input.piDate,
        bu: input.bu,
        supplier: input.supplier,
        brand: input.brand,
        patternId: input.pattern,
        sdeptCodes: input.sdepts,
        itemCount: input.items,
        license: input.license,
        packages: input.packages,
        importerName: session.role === "import" ? session.userDisplayName : "คุณหมู",
        designerName: input.designer,
        briefRequired: input.brief,
        folderUrl: input.folder,
        history: {
          create: {
            seq: 0,
            subStatus: "Info Checking",
            actionDate: today,
            actorRole: "import",
            actionTitle: "แจ้งงานออกแบบ (Create Job)",
            note: "",
            mark: "create",
          },
        },
      },
      include: JOB_INCLUDE,
    });
  });

  const job = mapDbJobToRecord(created);
  const holidays = await fetchHolidaySet();
  const mail = await dispatchJobNotification(job, "_create", today, holidays);
  return { job, mail };
}
