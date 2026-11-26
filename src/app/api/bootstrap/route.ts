import { getTrackerSession } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { getBootstrapState } from "@/lib/services/settings-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getTrackerSession();
    const data = await getBootstrapState(session);
    return jsonOk(data);
  } catch (err) {
    return handleApiError(err);
  }
}
