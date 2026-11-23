import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/services/api-helpers";
import { saveArtworkFile } from "@/lib/services/packaging-file-service";
import { artworkStageKindSchema } from "@/lib/validations/packaging";

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { jobId } = await context.params;
    const formData = await request.formData();
    const stageRaw = formData.get("stageKind");
    const file = formData.get("file");

    const stageKind = artworkStageKindSchema.parse(stageRaw);
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "กรุณาแนบไฟล์ Artwork" }, { status: 400 });
    }

    const saved = await saveArtworkFile(jobId, stageKind, file, user);
    return NextResponse.json({ artwork: saved }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
