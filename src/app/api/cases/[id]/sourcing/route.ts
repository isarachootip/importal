import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { updateSourcingStage } from "@/lib/services/lifecycle-sourcing-service";
import { updateSourcingSchema } from "@/lib/validations/lifecycle";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = updateSourcingSchema.parse(body);
    const updated = await updateSourcingStage(id, parsed, user);
    return NextResponse.json({ importCase: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
