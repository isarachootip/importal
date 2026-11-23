import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { savePiFile } from "@/lib/services/packaging-file-service";
import { piFileSlotSchema } from "@/lib/validations/packaging";

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { jobId } = await context.params;
    const formData = await request.formData();
    const slotRaw = formData.get("slot");
    const file = formData.get("file");

    const slot = piFileSlotSchema.parse(slotRaw);
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "กรุณาแนบไฟล์ที่ต้องการอัปโหลด" }, { status: 400 });
    }

    const saved = await savePiFile(jobId, slot, file, user);
    return NextResponse.json({ file: saved }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
