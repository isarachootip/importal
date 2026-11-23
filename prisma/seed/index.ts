import { PrismaClient } from "@prisma/client";
import { seedUsersAndBrands } from "./seed-users-brands";
import { seedPackagingMeta } from "./seed-packaging-meta";
import { seedHolidays } from "./seed-holidays";
import { seedSampleCases } from "./seed-sample-cases";
import { seedPackagingDetails } from "./seed-packaging-details";
import { seedLifecycleDetails } from "./seed-lifecycle-details";
import { recalculatePackagingSchedule } from "../../src/lib/services/packaging-schedule-service";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Importal Master Data & Sample Cases...");
  const userBrandRefs = await seedUsersAndBrands(prisma);
  const metaRefs = await seedPackagingMeta(prisma);
  await seedHolidays(prisma);
  await seedSampleCases(prisma, { ...userBrandRefs, ...metaRefs });
  await seedPackagingDetails(prisma, userBrandRefs.userByEmail);
  await seedLifecycleDetails(prisma);

  const jobs = await prisma.packagingJob.findMany({ select: { id: true } });
  for (const job of jobs) {
    await recalculatePackagingSchedule(job.id, prisma);
  }

  const [users, brands, cases, holidays, pkgTypes, scheduleSteps] = await Promise.all([
    prisma.user.count(),
    prisma.brand.count(),
    prisma.importCase.count(),
    prisma.companyHoliday.count(),
    prisma.packagingType.count(),
    prisma.packagingScheduleStep.count(),
  ]);

  console.log(
    `Seed completed: ${users} users, ${brands} brands, ${pkgTypes} packaging types, ${holidays} holidays, ${cases} cases, ${scheduleSteps} schedule steps.`
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
