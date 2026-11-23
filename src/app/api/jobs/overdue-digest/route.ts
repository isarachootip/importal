import { NextResponse } from "next/server";
import { assertAnyRole } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { handleApiError } from "@/lib/services/api-helpers";
import { runOverdueDigestJob } from "@/lib/services/overdue-digest-service";

export async function POST(request: Request) {
  try {
    const env = getEnv();
    const cronHeader = request.headers.get("x-cron-secret");
    const isValidCron = Boolean(cronHeader && cronHeader === env.CRON_SECRET);

    if (!isValidCron) {
      const user = await getCurrentUser();
      assertAnyRole(user, ["ADMIN"]);
    }

    const result = await runOverdueDigestJob();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
