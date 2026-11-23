import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { addSourcingQuotation } from "@/lib/services/lifecycle-sourcing-service";
import { createQuotationSchema } from "@/lib/validations/lifecycle";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = createQuotationSchema.parse(body);
    const quotation = await addSourcingQuotation(id, parsed, user);
    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
