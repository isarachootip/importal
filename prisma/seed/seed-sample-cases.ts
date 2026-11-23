import { PrismaClient } from "@prisma/client";
import { SAMPLE_CASES } from "./sample-cases-data";

interface SeedRefs {
  userByEmail: Map<string, string>;
  brandByName: Map<string, string>;
  subclassByCode: Map<string, string>;
  vendorByCode: Map<string, string>;
  caseConfigByNum: Map<number, string>;
  pkgTypeByCode: Map<string, string>;
}

export async function seedSampleCases(prisma: PrismaClient, refs: SeedRefs) {
  for (const item of SAMPLE_CASES) {
    const brandId = refs.brandByName.get(item.brandName);
    const ownerId = refs.userByEmail.get(item.ownerEmail);
    if (!brandId || !ownerId) continue;

    const importCase = await prisma.importCase.upsert({
      where: { caseCode: item.caseCode },
      update: {
        productTitle: item.productTitle,
        currentStage: item.currentStage,
        sourcingStatus: item.sourcingStatus,
        poStatus: item.poStatus,
        productionStatus: item.productionStatus,
        logisticStatus: item.logisticStatus,
      },
      create: {
        caseCode: item.caseCode,
        productTitle: item.productTitle,
        brandId,
        ownerId,
        subclassId: refs.subclassByCode.get(item.subclassCode) ?? null,
        vendorId: refs.vendorByCode.get(item.vendorCode) ?? null,
        currentStage: item.currentStage,
        sourcingStatus: item.sourcingStatus,
        poStatus: item.poStatus,
        productionStatus: item.productionStatus,
        logisticStatus: item.logisticStatus,
        isNewPhoto: Boolean(item.isNewPhoto),
        requiresTisi: Boolean(item.requiresTisi),
      },
    });

    if (item.piNumber && item.piDate && item.caseNumber && item.packagingStep && item.timelineStatus) {
      const caseConfigId = refs.caseConfigByNum.get(item.caseNumber);
      if (!caseConfigId) continue;

      const job = await prisma.packagingJob.upsert({
        where: { caseId: importCase.id },
        update: {
          currentStep: item.packagingStep,
          timelineStatus: item.timelineStatus,
          preQcRejectCount: item.preQcRejectCount ?? 0,
        },
        create: {
          caseId: importCase.id,
          piNumber: item.piNumber,
          piDate: new Date(`${item.piDate}T00:00:00.000Z`),
          skuCount: item.skuCount ?? 1,
          caseConfigId,
          currentStep: item.packagingStep,
          timelineStatus: item.timelineStatus,
          preQcRejectCount: item.preQcRejectCount ?? 0,
        },
      });

      for (const code of item.pkgTypeCodes ?? []) {
        const packagingTypeId = refs.pkgTypeByCode.get(code);
        if (packagingTypeId) {
          await prisma.packagingJobType.upsert({
            where: { packagingJobId_packagingTypeId: { packagingJobId: job.id, packagingTypeId } },
            update: {},
            create: { packagingJobId: job.id, packagingTypeId },
          });
        }
      }
    }
  }
}
