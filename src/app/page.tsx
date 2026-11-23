import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardSnapshot, getDevUsersForShell } from "@/lib/services/dashboard-service";
import { PortalShell } from "@/components/layout/portal-shell";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { ActionQueuesGrid } from "@/components/dashboard/action-queues-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [devUsers, snapshot] = await Promise.all([
    getDevUsersForShell(),
    getDashboardSnapshot(user),
  ]);

  return (
    <PortalShell
      breadcrumbs={[{ label: "งานนำเข้า" }, { label: "Dashboard", current: true }]}
      user={user}
      devUsers={devUsers}
    >
      <section className="bg-white border border-[#d9dee3] rounded-md px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1f2933] leading-tight">
            ภาพรวมงานนำเข้า (Importal Dashboard)
          </h1>
          <p className="text-sm text-[#5f6b76] mt-0.5">
            ติดตามสถานะ 5 ขั้นตอนนำเข้าสินค้า House Brand, คิวงานที่รอคุณ และงานล่าช้ากว่าแผนแบบเรียลไทม์
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/packaging"
            className="px-3.5 py-2 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933]"
          >
            Packaging Board
          </Link>
          <Link
            href="/cases/new"
            className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold"
          >
            + สร้าง Case / ลงทะเบียน PI
          </Link>
        </div>
      </section>

      <KpiStrip
        totalActiveCases={snapshot.kpis.totalActiveCases}
        activePackagingCount={snapshot.kpis.activePackagingCount}
        myQueueCount={snapshot.kpis.myQueueCount}
        overdueCount={snapshot.kpis.overdueCount}
        totalPreQcRejects={snapshot.kpis.totalPreQcRejects}
      />

      <ActionQueuesGrid
        myQueue={snapshot.myQueue}
        overdueOrAtRisk={snapshot.overdueOrAtRisk}
        userDisplayName={user ? `${user.nickname ?? user.thaiName ?? user.name} (${user.roles.join(", ")})` : "ผู้ใช้งาน"}
      />

      <PipelineOverview
        stageCounts={snapshot.stageCounts}
        boardCounts={snapshot.boardCounts}
        allCases={snapshot.allCases}
      />
    </PortalShell>
  );
}
