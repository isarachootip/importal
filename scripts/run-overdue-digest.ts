import { runOverdueDigestJob } from "../src/lib/services/overdue-digest-service";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  console.log("[Importal Cron] Starting Daily 08:00 Overdue Digest...");
  const result = await runOverdueDigestJob();
  console.log(
    `[Importal Cron] Completed: ${result.overdueItemsCount} at-risk items, ${result.usersNotified} users notified, ${result.emailsSent} emails sent.`
  );
}

main()
  .catch((err) => {
    console.error("[Importal Cron] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
