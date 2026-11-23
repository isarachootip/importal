import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { executePackagingTransition } from "@/lib/services/packaging-transition-service";
import { packagingTransitionSchema } from "@/lib/validations/packaging";

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { jobId } = await context.params;
    const body: unknown = await request.json();
    const parsed = packagingTransitionSchema.parse(body);
    const nextState = await executePackagingTransition(jobId, parsed, user);
    return NextResponse.json({ state: nextState });
  } catch (error) {
    return handleApiError(error);
  }
}
