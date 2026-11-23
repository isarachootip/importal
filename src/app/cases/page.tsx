import { getCurrentUser } from "@/lib/auth/session";
import { getDevUsersForShell, getEnrichedCaseSummaries } from "@/lib/services/dashboard-service";
import { getMasterBootstrap } from "@/lib/services/master-service";
import { caseFilterSchema } from "@/lib/validations/case-filters";
import { PortalShell } from "@/components/layout/portal-shell";
import { CasesFilterBar } from "@/components/cases/cases-filter-bar";
import { CasesTable } from "@/components/cases/cases-table";

export const dynamic = "force-dynamic";

function flattenSearchParams(raw: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
    else if (Array.isArray(v) && typeof v[0] === "string") out[k] = v[0];
  }
  return out;
}

export default async function CasesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = caseFilterSchema.safeParse(flattenSearchParams(raw));
  const filters = parsed.success ? parsed.data : { overdueOnly: false };

  const [user, devUsers, rows, master] = await Promise.all([
    getCurrentUser(),
    getDevUsersForShell(),
    getEnrichedCaseSummaries(filters),
    getMasterBootstrap(),
  ]);

  return (
    <PortalShell
      breadcrumbs={[{ label: "งานนำเข้า" }, { label: "Import Cases", current: true }]}
      user={user}
      devUsers={devUsers}
    >
      <CasesFilterBar
        filters={filters}
        brands={master.brands.map((b) => ({ id: b.id, label: b.name }))}
        owners={master.users
          .filter((u) => u.roles.some((r) => r.role === "IMPORT"))
          .map((u) => ({ id: u.id, label: u.nickname ?? u.thaiName ?? u.name }))}
        totalCount={rows.length}
      />
      <CasesTable rows={rows} />
    </PortalShell>
  );
}
