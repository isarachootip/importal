import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { updateNotifMode } from "@/lib/services/settings-service";
import { NotifModeUpdateSchema } from "@/lib/validations/aw-schemas";

export async function PATCH(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = NotifModeUpdateSchema.parse(body);
    await updateNotifMode(parsed.eventKey, parsed.mode);
    return jsonOk({ updated: true });
  } catch (err) {
    return handleApiError(err);
  }
}
