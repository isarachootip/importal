import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { addPackagingComment } from "@/lib/services/packaging-pi-service";
import { createCommentSchema } from "@/lib/validations/packaging";

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { jobId } = await context.params;
    const body: unknown = await request.json();
    const parsed = createCommentSchema.parse(body);
    const comment = await addPackagingComment(jobId, parsed, user);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
