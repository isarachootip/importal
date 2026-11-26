import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../../src/lib/services/demo-seed-service";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(async () => {
    const [users, jobs, sdepts] = await Promise.all([
      prisma.user.count(),
      prisma.packagingJob.count(),
      prisma.sdeptMaster.count(),
    ]);
    console.log(`[AW Packaging Tracker] Seed complete: ${users} users, ${sdepts} Sdepts, ${jobs} demo PIs.`);
    await prisma.$disconnect();
  })
  .catch(async (err: unknown) => {
    console.error("[AW Packaging Tracker] Seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
