import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthEnabled } from "@/lib/env";
import { getCaseDetail } from "@/lib/services/case-service";
import { serializeCaseDetail } from "@/lib/services/case-serializer";
import { getMasterBootstrap } from "@/lib/services/master-service";
import { PortalShell } from "@/components/layout/portal-shell";
import { PackagingWorkspace } from "@/components/packaging/packaging-workspace";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detail, master, user, devUsers] = await Promise.all([
    getCaseDetail(id),
    getMasterBootstrap(),
    getCurrentUser(),
    isDevAuthEnabled()
      ? prisma.user.findMany({
          where: { isActive: true },
          orderBy: { email: "asc" },
          include: { roles: { select: { role: true } } },
        })
      : Promise.resolve([]),
  ]);

  if (!detail) {
    notFound();
  }

  const dto = serializeCaseDetail(detail);

  return (
    <PortalShell
      breadcrumbs={[
        { label: "Packaging" },
        { label: dto.caseCode },
        { label: dto.packaging ? "Design" : "Detail", current: true },
      ]}
      user={user}
      devUsers={devUsers.map((u) => ({
        id: u.id,
        email: u.email,
        thaiName: u.thaiName,
        nickname: u.nickname,
        roles: u.roles.map((r) => r.role),
      }))}
    >
      <PackagingWorkspace
        data={dto}
        master={{
          caseConfigs: master.caseConfigs.map((cfg) => ({
            id: cfg.id,
            caseNumber: cfg.caseNumber,
            name: cfg.name,
            infoDays: cfg.infoDays,
            designDays: cfg.designDays,
          })),
          packagingTypes: master.packagingTypes.map((pt) => ({
            id: pt.id,
            code: pt.code,
            nameTh: pt.nameTh,
          })),
          checklists: master.checklists.map((cl) => ({
            id: cl.id,
            category: cl.category,
            code: cl.code,
            labelTh: cl.labelTh,
            isRequired: cl.isRequired,
            sortOrder: cl.sortOrder,
          })),
        }}
        userRoles={user?.roles ?? []}
      />
    </PortalShell>
  );
}
