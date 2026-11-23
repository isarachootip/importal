import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/services/api-helpers";
import { getCaseDetail } from "@/lib/services/case-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const detail = await getCaseDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "ไม่พบข้อมูล Case นี้" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return handleApiError(error);
  }
}
