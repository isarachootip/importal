import type { z } from "zod";
import type { TrackerSession } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { SUB_MAP } from "@/lib/domain/aw-constants";
import type { JobFileEntry, JobRecord, OutboxMail } from "@/lib/domain/job-types";
import { curSub, isOpenJob } from "@/lib/domain/sla-engine";
import { applyJobTransition, type TransitionInput } from "@/lib/domain/workflow-transitions";
import { todayBangkok } from "@/lib/domain/working-days";
import type { TransitionActionSchema } from "@/lib/validations/aw-schemas";
import { dispatchJobNotification } from "./email-service";
import { fetchHolidaySet, getJobByIdOrCode, JOB_INCLUDE, mapDbJobToRecord } from "./job-service";

function toDomainFiles(
  files: Array<{ name: string; storageKey?: string | null; mimeType?: string | null; sizeBytes?: number | null }>,
  role: string,
  today: string
): JobFileEntry[] {
  return files.map((f) => ({
    name: f.name,
    storageKey: f.storageKey ?? null,
    link: false,
    mimeType: f.mimeType ?? null,
    sizeBytes: f.sizeBytes ?? null,
    by: role,
    d: today,
  }));
}

export async function executeJobTransition(
  jobId: string,
  action: z.infer<typeof TransitionActionSchema>,
  session: TrackerSession
): Promise<{ job: JobRecord; toast: string; mail: OutboxMail | null }> {
  const existing = await getJobByIdOrCode(jobId);
  if (!existing) throw new Error("ไม่พบงานในระบบ");

  const currentSub = curSub(existing);
  const draftKeyBefore = `act:${existing.id}:${currentSub}`;
  const today = todayBangkok();

  if (action.kind === "cancel") {
    if (session.role !== "import" && session.role !== "mgmt") {
      throw new Error("ยกเลิกงานได้เฉพาะ Import หรือผู้บริหารเท่านั้น");
    }
    if (!isOpenJob(existing)) throw new Error("งานนี้ปิดหรือยกเลิกไปแล้ว");
  } else if (action.kind !== "grSync") {
    const allowedRoles = SUB_MAP[currentSub].roles;
    if (!allowedRoles.includes(session.role)) {
      throw new Error(`ขั้นตอนนี้รอ ${allowedRoles.join(" / ")} ดำเนินการ`);
    }
  }

  let domainInput: TransitionInput;
  switch (action.kind) {
    case "check":
      domainInput = { ...action, actorRole: session.role, today };
      break;
    case "photo":
    case "more":
      domainInput = { ...action, actorRole: session.role, today };
      break;
    case "draft":
    case "present":
    case "evpfix":
      domainInput = {
        ...action,
        actorRole: session.role,
        today,
        uploadedFiles: toDomainFiles(action.uploadedFiles, session.role, today),
      };
      break;
    case "imp":
    case "mdsg":
    case "evp":
      domainInput = {
        ...action,
        actorRole: session.role,
        today,
        uploadedFiles: toDomainFiles(action.uploadedFiles, session.role, today),
      };
      break;
    case "final":
      domainInput = {
        ...action,
        actorRole: session.role,
        today,
        uploadedFiles: toDomainFiles(action.uploadedFiles, session.role, today),
      };
      break;
    case "factory":
      domainInput = { ...action, actorRole: session.role, today };
      break;
    case "grSync":
      domainInput = { kind: "grSync", actorRole: "system", today };
      break;
    case "cancel":
      domainInput = { ...action, actorRole: session.role, today };
      break;
  }

  const prevHistLen = existing.history.length;
  const prevFilesLen = existing.files.length;
  const result = applyJobTransition(existing, domainInput);
  const newHistoryItems = result.job.history.slice(prevHistLen);
  const newFileItems = result.job.files.slice(prevFilesLen);

  const updatedRow = await prisma.$transaction(async (tx) => {
    if (curSub(result.job) !== currentSub) {
      await tx.formDraft.deleteMany({ where: { draftKey: draftKeyBefore } });
    }

    if (action.kind === "factory" || action.kind === "grSync") {
      await tx.jobSku.deleteMany({ where: { jobId: existing.id } });
      if (result.job.skus.length > 0) {
        await tx.jobSku.createMany({
          data: result.job.skus.map((s, idx) => ({
            jobId: existing.id,
            seq: idx,
            skuCode: s.sku,
            mmsCreatedDate: s.created,
            goodsReceivedDate: s.gr,
          })),
        });
      }
    }

    return tx.packagingJob.update({
      where: { id: existing.id },
      data: {
        designerName: result.job.designer,
        briefRequired: result.job.brief,
        hasPhotoShoot: result.job.photo,
        leadtimeDays: result.job.leadtime ?? null,
        poNumber: result.job.poNumber ?? null,
        skuFileName: result.job.skuFile ?? null,
        history: {
          create: newHistoryItems.map((h, idx) => ({
            seq: prevHistLen + idx,
            subStatus: h.sub,
            actionDate: h.d,
            actorRole: h.by,
            actionTitle: h.act,
            note: h.note,
            mark: h.mark ?? null,
          })),
        },
        files: {
          create: newFileItems.map((f) => ({
            fileName: f.name,
            storageKey: f.storageKey ?? null,
            isLink: Boolean(f.link),
            mimeType: f.mimeType ?? null,
            sizeBytes: f.sizeBytes ?? null,
            uploadedByRole: f.by,
            uploadedDate: f.d,
          })),
        },
      },
      include: JOB_INCLUDE,
    });
  });

  const updatedJob = mapDbJobToRecord(updatedRow);
  const holidays = await fetchHolidaySet();
  const mail = result.notifyEventKey
    ? await dispatchJobNotification(updatedJob, result.notifyEventKey, today, holidays)
    : null;

  return { job: updatedJob, toast: result.toastMessage, mail };
}
