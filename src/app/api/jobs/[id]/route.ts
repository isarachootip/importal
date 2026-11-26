import { getTrackerSession } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { editExistingJob, getJobByIdOrCode } from "@/lib/services/job-service";
import { JobFormSchema } from "@/lib/validations/aw-schemas";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const job = await getJobByIdOrCode(id);
    if (!job) return jsonOk({ error: "ไม่พบงาน" }, 404);
    return jsonOk({ job });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const session = await getTrackerSession();
    const body: unknown = await req.json();
    const parsed = JobFormSchema.parse(body);
    const result = await editExistingJob(id, parsed, session);
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
