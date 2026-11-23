import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { saveCaseDocument } from "@/lib/services/case-document-service";
import { caseDocMetaSchema } from "@/lib/validations/lifecycle";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const formData = await request.formData();
    const meta = caseDocMetaSchema.parse({
      stage: formData.get("stage"),
      docType: formData.get("docType"),
    });
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์เอกสาร" }, { status: 400 });
    }
    const document = await saveCaseDocument(id, meta.stage, meta.docType, file, user);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
