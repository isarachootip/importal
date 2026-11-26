import { getTrackerSession } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { createNewJob, listAllJobs } from "@/lib/services/job-service";
import { JobFormSchema } from "@/lib/validations/aw-schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await listAllJobs();
    return jsonOk({ jobs });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getTrackerSession();
    const body: unknown = await req.json();
    const input = JobFormSchema.parse(body);
    const result = await createNewJob(input, session);
    return jsonOk(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
