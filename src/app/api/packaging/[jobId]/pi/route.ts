import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { updatePiAndChecklist } from "@/lib/services/packaging-pi-service";
import { updatePiSchema } from "@/lib/validations/packaging";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { jobId } = await context.params;
    const body: unknown = await request.json();
    const parsed = updatePiSchema.parse(body);
    const updated = await updatePiAndChecklist(jobId, parsed, user);
    return NextResponse.json({ packagingJob: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
