import type { z } from "zod";
import type { TrackerSession } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { PATTERNS, sdeptLabel } from "@/lib/domain/aw-constants";
import type { JobRecord } from "@/lib/domain/job-types";
import { briefLabelTh, curSub, totalSla } from "@/lib/domain/sla-engine";
import { fmtThaiDate, todayBangkok } from "@/lib/domain/working-days";
import type { JobFormSchema } from "@/lib/validations/aw-schemas";
import { getJobByIdOrCode, JOB_INCLUDE, mapDbJobToRecord } from "./job-service";

const FIELD_LABELS: Array<[keyof z.infer<typeof JobFormSchema>, string]> = [
  ["pi", "PI Number"], ["piDate", "PI approval date"], ["bu", "BU"], ["supplier", "Supplier"],
  ["brand", "House Brand"], ["pattern", "Type of Pattern"], ["sdepts", "Sdept"],
  ["items", "No. of items"], ["license", "License"], ["designer", "Designer"],
  ["brief", "ประชุม Brief"], ["packages", "Package Design"], ["folder", "Share Folder"],
];

function formatFieldVal(key: string, val: unknown): string {
  if (key === "pattern") return PATTERNS.find((x) => x.id === val)?.name ?? String(val);
  if (key === "sdepts" && Array.isArray(val)) return val.map((c) => sdeptLabel(Number(c))).join(" / ");
  if (key === "packages" && Array.isArray(val)) return val.join(", ") || "–";
  if (key === "piDate") return fmtThaiDate(String(val));
  if (key === "brief") return briefLabelTh(String(val));
  return String(val ?? "");
}

export async function editExistingJob(
  id: string,
  input: z.infer<typeof JobFormSchema>,
  session: TrackerSession
): Promise<{ job: JobRecord; changed: boolean; slaChangedTo: number | null }> {
  if (session.role !== "import" && session.role !== "designer") {
    throw new Error("แก้ไขข้อมูลงานได้เฉพาะบทบาท Import และ Designer");
  }
  const existing = await getJobByIdOrCode(id);
  if (!existing) throw new Error("ไม่พบงานในระบบ");
  if (curSub(existing) === "Cancelled") throw new Error("งานที่ยกเลิกแล้วไม่สามารถแก้ไขได้");

  if (input.pi !== existing.pi) {
    const dup = await prisma.packagingJob.findUnique({ where: { piNumber: input.pi } });
    if (dup) throw new Error("PI Number นี้มีในระบบแล้ว");
  }

  const changes: string[] = [];
  for (const [k, label] of FIELD_LABELS) {
    const beforeVal = existing[k as keyof JobRecord];
    const afterVal = input[k];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changes.push(`${label}: ${formatFieldVal(k, beforeVal)} → ${formatFieldVal(k, afterVal)}`);
    }
  }

  if (changes.length === 0) {
    await prisma.formDraft.deleteMany({ where: { draftKey: `edit:${existing.id}` } });
    return { job: existing, changed: false, slaChangedTo: null };
  }

  const slaBefore = totalSla(existing);
  const previewAfter: JobRecord = {
    ...existing,
    pi: input.pi,
    piDate: input.piDate,
    bu: input.bu,
    supplier: input.supplier,
    brand: input.brand,
    pattern: input.pattern,
    sdept: input.sdepts[0]!,
    sdepts: input.sdepts,
    items: input.items,
    license: input.license,
    designer: input.designer,
    brief: input.brief,
    packages: input.packages,
    folder: input.folder,
  };
  const slaAfter = totalSla(previewAfter);
  const slaDiff = slaBefore !== slaAfter ? `SLA รวม ${slaBefore} → ${slaAfter} วัน` : "";
  const today = todayBangkok();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.formDraft.deleteMany({ where: { draftKey: `edit:${existing.id}` } });
    return tx.packagingJob.update({
      where: { id: existing.id },
      data: {
        piNumber: input.pi,
        piDate: input.piDate,
        bu: input.bu,
        supplier: input.supplier,
        brand: input.brand,
        patternId: input.pattern,
        sdeptCodes: input.sdepts,
        itemCount: input.items,
        license: input.license,
        designerName: input.designer,
        briefRequired: input.brief,
        packages: input.packages,
        folderUrl: input.folder,
        edits: {
          create: {
            editedDate: today,
            actorRole: session.role,
            actorUser: session.userDisplayName,
            changes,
            slaDiff,
          },
        },
      },
      include: JOB_INCLUDE,
    });
  });

  return {
    job: mapDbJobToRecord(updated),
    changed: true,
    slaChangedTo: slaBefore !== slaAfter ? slaAfter : null,
  };
}
