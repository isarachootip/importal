import { handleApiError, jsonOk } from "@/lib/services/api-helpers";
import { updateCompanyHolidays } from "@/lib/services/settings-service";
import { HolidaysSaveSchema } from "@/lib/validations/aw-schemas";

export async function PUT(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = HolidaysSaveSchema.parse(body);
    const holidays = await updateCompanyHolidays(parsed.dates, parsed.resetDefault);
    return jsonOk({ holidays, count: holidays.length });
  } catch (err) {
    return handleApiError(err);
  }
}
