import { getCurrentUser } from "@/lib/auth/session";
import { isActionRequiredForUser } from "@/lib/domain/case-analytics";
import { getDevUsersForShell, getEnrichedCaseSummaries } from "@/lib/services/dashboard-service";
import { getMasterBootstrap } from "@/lib/services/master-service";
import { PortalShell } from "@/components/layout/portal-shell";
import { PackagingBoardClient } from "@/components/board/packaging-board-client";

export const dynamic = "force-dynamic";

export default async function PackagingBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialMineOnly = params.mine === "1";

  const [user, devUsers, allCases, master] = await Promise.all([
    getCurrentUser(),
    getDevUsersForShell(),
    getEnrichedCaseSummaries(),
    getMasterBootstrap(),
  ]);

  const packagingItems = allCases.filter((c) => c.packaging !== null);
  const myCaseIds = packagingItems
    .filter((c) => isActionRequiredForUser(c, user))
    .map((c) => c.id);

  return (
    <PortalShell
      breadcrumbs={[{ label: "งานนำเข้า" }, { label: "Packaging Board", current: true }]}
      user={user}
      devUsers={devUsers}
    >
      <PackagingBoardClient
        items={packagingItems}
        myCaseIds={myCaseIds}
        brands={master.brands.map((b) => ({ id: b.id, label: b.name }))}
        owners={master.users
          .filter((u) => u.roles.some((r) => r.role === "IMPORT"))
          .map((u) => ({ id: u.id, label: u.nickname ?? u.thaiName ?? u.name }))}
        initialMineOnly={initialMineOnly}
      />
    </PortalShell>
  );
}
