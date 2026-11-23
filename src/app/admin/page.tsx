import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { getDevUsersForShell } from "@/lib/auth/dev-users";
import { getAdminMasterData } from "@/lib/services/admin-service";
import { PortalShell } from "@/components/layout/portal-shell";
import { AdminConsoleClient } from "@/components/admin/admin-console-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [user, devUsers] = await Promise.all([getCurrentUser(), getDevUsersForShell()]);
  const isAdmin = hasRole(user, "ADMIN");

  if (!isAdmin) {
    return (
      <PortalShell
        breadcrumbs={[{ label: "ตั้งค่า" }, { label: "Master Data", current: true }]}
        user={user}
        devUsers={devUsers}
      >
        <section className="bg-white border border-[#d9dee3] rounded-md p-6 space-y-2">
          <h1 className="text-[20px] font-bold text-[#1f2933]">เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น</h1>
          <p className="text-sm text-[#5f6b76]">
            บัญชีปัจจุบันของคุณไม่มีสิทธิ์เข้าถึงหน้า Master Data Admin กรุณาสลับผู้ใช้งานเป็น{" "}
            <strong className="text-[#0f5c4d]">admin@chg.co.th</strong> ที่แถบมุมขวาบนเพื่อจัดการข้อมูลตั้งต้น
          </p>
        </section>
      </PortalShell>
    );
  }

  const raw = await getAdminMasterData();

  return (
    <PortalShell
      breadcrumbs={[{ label: "ตั้งค่า" }, { label: "Master Data", current: true }]}
      user={user}
      devUsers={devUsers}
    >
      <AdminConsoleClient
        data={{
          brands: raw.brands.map((b) => ({
            id: b.id,
            code: b.code,
            name: b.name,
            groupName: b.groupName,
            ownerId: b.ownerId,
            isActive: b.isActive,
          })),
          users: raw.users.map((u) => ({
            id: u.id,
            label: `${u.nickname ?? u.thaiName ?? u.name} (${u.email})`,
            roles: u.roles.map((r) => r.role),
          })),
          caseConfigs: raw.caseConfigs.map((c) => ({
            id: c.id,
            caseNumber: c.caseNumber,
            name: c.name,
            infoDays: c.infoDays,
            designDays: c.designDays,
            productionDays: c.productionDays,
            logisticDays: c.logisticDays,
          })),
          approvalRules: raw.approvalRules.map((r) => ({
            id: r.id,
            stageKey: r.stageKey,
            stepOrder: r.stepOrder,
            role: r.role,
            isParallel: r.isParallel,
            isEnabled: r.isEnabled,
          })),
          holidays: raw.holidays.map((h) => ({
            id: h.id,
            date: h.date.toISOString(),
            yearBE: h.yearBE,
            nameTh: h.nameTh,
            isSubstitute: h.isSubstitute,
          })),
          settings: raw.settings.map((s) => ({
            key: s.key,
            value:
              typeof s.value === "boolean" || typeof s.value === "number" || typeof s.value === "string"
                ? s.value
                : JSON.stringify(s.value),
            description: s.description,
          })),
        }}
      />
    </PortalShell>
  );
}
