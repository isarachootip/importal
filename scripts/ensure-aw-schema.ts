import { PrismaClient } from "@prisma/client";

async function checkLegacyDb(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw<Array<{ has_legacy: boolean; has_aw: boolean }>>`
      SELECT
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ImportCase') AS has_legacy,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SdeptMaster') AS has_aw
    `;
    const state = rows[0];
    await prisma.$disconnect();
    if (state?.has_legacy && !state.has_aw) {
      console.log("LEGACY_DB_DETECTED");
      process.exit(10);
    }
    process.exit(0);
  } catch (err) {
    console.error("[AW Schema Check] Warning:", err);
    await prisma.$disconnect();
    process.exit(0);
  }
}

void checkLegacyDb();
