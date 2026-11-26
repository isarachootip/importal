import { prisma } from "@/lib/db/prisma";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { resetDemoJobsInDb } from "@/lib/services/demo-seed-service";

export async function POST() {
  try {
    const count = await resetDemoJobsInDb(prisma);
    return jsonOk({ reset: true, count });
  } catch (err) {
    return handleApiError(err);
  }
}
