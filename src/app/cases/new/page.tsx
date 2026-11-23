import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isDevAuthEnabled } from "@/lib/env";
import { getMasterBootstrap } from "@/lib/services/master-service";
import { PortalShell } from "@/components/layout/portal-shell";
import { NewCaseForm } from "@/components/cases/new-case-form";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const [master, user, devUsers] = await Promise.all([
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

  return (
    <PortalShell
      breadcrumbs={[
        { label: "Import Cases" },
        { label: "สร้าง Case / ลงทะเบียน PI", current: true },
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
      <NewCaseForm
        brands={master.brands.map((b) => ({
          id: b.id,
          name: b.name,
          groupName: b.groupName,
          ownerLabel: b.owner ? `${b.owner.nickname ?? b.owner.thaiName} (${b.owner.email})` : "ผู้สร้างงาน (Power Buy)",
        }))}
        caseConfigs={master.caseConfigs.map((cfg) => ({
          id: cfg.id,
          caseNumber: cfg.caseNumber,
          name: cfg.name,
          infoDays: cfg.infoDays,
          designDays: cfg.designDays,
        }))}
        packagingTypes={master.packagingTypes.map((pt) => ({ id: pt.id, nameTh: pt.nameTh }))}
        subclasses={master.subclasses.map((sc) => ({ id: sc.id, code: sc.code, nameTh: sc.nameTh }))}
        vendors={master.vendors.map((v) => ({ id: v.id, name: v.name }))}
      />
    </PortalShell>
  );
}
