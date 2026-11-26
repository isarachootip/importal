import { getTrackerSession } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { executeJobTransition } from "@/lib/services/transition-service";
import { TransitionActionSchema } from "@/lib/validations/aw-schemas";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const session = await getTrackerSession();
    const body: unknown = await req.json();
    const action = TransitionActionSchema.parse(body);
    const result = await executeJobTransition(id, action, session);
    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}
