import { NextResponse } from "next/server";
import { assertAnyRole } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { buildCasesCsv } from "@/lib/domain/case-analytics";
import { handleApiError } from "@/lib/services/api-helpers";
import { getEnrichedCaseSummaries } from "@/lib/services/dashboard-service";
import { toBangkokDateKey } from "@/lib/utils/date-th";
import { caseFilterSchema } from "@/lib/validations/case-filters";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    assertAnyRole(user, ["IMPORT", "MER", "GD", "GM", "VP", "EVP", "VENDOR", "FORWARDER", "ADMIN"]);

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const filters = caseFilterSchema.parse(rawParams);

    const rows = await getEnrichedCaseSummaries(filters);
    const csv = buildCasesCsv(rows);
    const today = toBangkokDateKey(new Date());

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="importal-cases-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
