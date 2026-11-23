import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma as defaultPrisma } from "@/lib/db/prisma";
import { calculatePackagingSchedule, type DesignWeights, type PackagingScheduleResult } from "@/lib/domain/schedule-engine";

const weightsSchema = z.object({
  aw: z.number().int().positive(),
  p1: z.number().int().positive(),
  r1: z.number().int().positive(),
  p2: z.number().int().positive(),
  r2: z.number().int().positive(),
  p3: z.number().int().positive(),
  r3: z.number().int().positive(),
});

const DEFAULT_WEIGHTS: DesignWeights = { aw: 7, p1: 2, r1: 3, p2: 2, r2: 3, p3: 2, r3: 3 };

function toIsoDateKey(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

function fromIsoDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

function readNumericSetting(map: Map<string, Prisma.JsonValue>, key: string, fallback: number): number {
  const val = map.get(key);
  return typeof val === "number" && Number.isFinite(val) ? val : fallback;
}

function readBooleanSetting(map: Map<string, Prisma.JsonValue>, key: string, fallback: boolean): boolean {
  const val = map.get(key);
  return typeof val === "boolean" ? val : fallback;
}

export async function recalculatePackagingSchedule(
  packagingJobId: string,
  db: PrismaClient = defaultPrisma
): Promise<PackagingScheduleResult> {
  const [job, holidays, settings] = await Promise.all([
    db.packagingJob.findUniqueOrThrow({
      where: { id: packagingJobId },
      include: { caseConfig: true, importCase: true },
    }),
    db.companyHoliday.findMany({ select: { date: true } }),
    db.systemSetting.findMany(),
  ]);

  const holidaySet = new Set(holidays.map((h) => toIsoDateKey(h.date)));
  const settingMap = new Map(settings.map((s) => [s.key, s.value]));
  const parsedWeights = weightsSchema.safeParse(job.caseConfig.designWeights);

  const schedule = calculatePackagingSchedule({
    piDate: toIsoDateKey(job.piDate),
    skuCount: job.skuCount,
    isNewPhoto: job.importCase.isNewPhoto,
    isMinorChange: job.isMinorChange,
    minorChangeRuleEnabled: readBooleanSetting(settingMap, "repeat_order_minor_change_enabled", true),
    skuBatchSize: readNumericSetting(settingMap, "sku_batch_size", 30),
    skuBatchExtraDays: readNumericSetting(settingMap, "sku_batch_extra_days", 7),
    newPhotoExtraDays: readNumericSetting(settingMap, "new_photo_extra_days", 7),
    poDays: readNumericSetting(settingMap, "po_default_days", 5),
    holidaySet,
    caseConfig: {
      caseNumber: job.caseConfig.caseNumber,
      infoDays: job.caseConfig.infoDays,
      designDays: job.caseConfig.designDays,
      briefDays: job.caseConfig.briefDays,
      finalDays: job.caseConfig.finalDays,
      reviseFinalDays: job.caseConfig.reviseFinalDays,
      productionDays: job.caseConfig.productionDays,
      logisticDays: job.caseConfig.logisticDays,
      designWeights: parsedWeights.success ? parsedWeights.data : DEFAULT_WEIGHTS,
    },
  });

  await db.$transaction(async (tx) => {
    const activeKeys = schedule.steps.map((s) => s.stepKey);
    await tx.packagingScheduleStep.deleteMany({
      where: { packagingJobId: job.id, stepKey: { notIn: activeKeys } },
    });

    for (const step of schedule.steps) {
      await tx.packagingScheduleStep.upsert({
        where: { packagingJobId_stepKey: { packagingJobId: job.id, stepKey: step.stepKey } },
        update: {
          plannedDays: step.plannedDays,
          plannedStart: fromIsoDateKey(step.plannedStart),
          plannedEnd: fromIsoDateKey(step.plannedEnd),
          isBuffer: step.isBuffer,
        },
        create: {
          packagingJobId: job.id,
          stepKey: step.stepKey,
          plannedDays: step.plannedDays,
          plannedStart: fromIsoDateKey(step.plannedStart),
          plannedEnd: fromIsoDateKey(step.plannedEnd),
          isBuffer: step.isBuffer,
        },
      });
    }

    await tx.importCase.update({
      where: { id: job.caseId },
      data: {
        poPlanEnd: fromIsoDateKey(schedule.downstream.poPlanEnd),
        prodPlanEnd: fromIsoDateKey(schedule.downstream.productionPlanEnd),
        logisticPlanEnd: fromIsoDateKey(schedule.downstream.warehousePlanDate),
      },
    });
  });

  return schedule;
}
