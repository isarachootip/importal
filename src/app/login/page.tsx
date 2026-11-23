import { prisma } from "@/lib/db/prisma";
import { isDevAuthEnabled } from "@/lib/env";
import { LoginClient } from "./login-client";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const devEnabled = isDevAuthEnabled();
  const users = devEnabled
    ? await prisma.user.findMany({
        where: { isActive: true },
        orderBy: { email: "asc" },
        include: { roles: { select: { role: true } } },
      })
    : [];

  return (
    <main className="min-h-screen bg-[#eef1f4] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white border border-[#d9dee3] rounded-md overflow-hidden grid grid-cols-1 md:grid-cols-12">
        <aside className="md:col-span-4 bg-[#0d3b33] text-[#d6e6e1] p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-md bg-white text-[#0d3b33] font-bold text-base flex items-center justify-center">
                IP
              </span>
              <span className="text-xl font-bold text-white">Importal</span>
            </div>
            <p className="text-sm text-[#b9d4cc] leading-relaxed">
              ระบบบริหารงานนำเข้าสินค้า House Brand และ Packaging Design Workflow สำหรับทีม Import (@chg.co.th)
            </p>
          </div>
          <div className="text-xs text-[#8fb3a9]">Corporate Sidebar Theme · v0.1</div>
        </aside>

        <section className="md:col-span-8 p-6 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2933]">เข้าสู่ระบบ</h1>
            <p className="text-sm text-[#5f6b76]">ใช้อีเมลบริษัท @chg.co.th หรือเลือกบทบาทในโหมดพัฒนา</p>
          </div>

          <div className="rounded-md border border-[#d9dee3] p-4 bg-[#f5f7f9] space-y-2">
            <div className="text-sm font-semibold text-[#1f2933]">เข้าสู่ระบบองค์กร (SSO)</div>
            <p className="text-xs text-[#5f6b76]">
              รองรับ Microsoft Entra ID / Google Workspace (ตั้งค่า Client ID ใน .env สำหรับ Production)
            </p>
            <button
              type="button"
              disabled
              className="mt-1 inline-flex items-center justify-center rounded-md bg-[#0f5c4d]/50 text-white px-4 py-2 text-sm font-semibold cursor-not-allowed"
            >
              Sign in with Microsoft Entra ID (@chg.co.th)
            </button>
          </div>

          {devEnabled && (
            <LoginClient
              users={users.map((u) => ({
                id: u.id,
                email: u.email,
                thaiName: u.thaiName ?? u.name,
                roles: u.roles.map((r) => r.role),
              }))}
            />
          )}
        </section>
      </div>
    </main>
  );
}
