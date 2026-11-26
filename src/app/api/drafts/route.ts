import { getTrackerSession } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { deleteFormDraft, saveFormDraft } from "@/lib/services/settings-service";
import { DraftSaveSchema } from "@/lib/validations/aw-schemas";

export async function PUT(req: Request) {
  try {
    const session = await getTrackerSession();
    const body: unknown = await req.json();
    const parsed = DraftSaveSchema.parse(body);
    const draft = await saveFormDraft(
      parsed.key,
      parsed.values,
      parsed.fileNames,
      session.userDisplayName
    );
    return jsonOk({ draft });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key") ?? "";
    if (!key) throw new Error("กรุณาระบุ draft key");
    await deleteFormDraft(key);
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
