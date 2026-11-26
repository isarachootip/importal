import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { saveMetricReview } from "@/lib/services/settings-service";
import { ReviewSaveSchema } from "@/lib/validations/aw-schemas";

export async function PUT(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = ReviewSaveSchema.parse(body);
    await saveMetricReview(parsed.key, parsed.status, parsed.note);
    return jsonOk({ saved: true });
  } catch (err) {
    return handleApiError(err);
  }
}
