import type { SessionUser } from "@/lib/auth/types";
import { DevRoleSwitcher, type DevUserOption } from "./dev-role-switcher";
import { NotificationBell } from "./notification-bell";

interface CorporateTopbarProps {
  breadcrumbs: Array<{ label: string; current?: boolean }>;
  user: SessionUser | null;
  devUsers?: DevUserOption[];
}

export function CorporateTopbar({ breadcrumbs, user, devUsers }: CorporateTopbarProps) {
  const roleLabel = user ? user.roles.join(", ") : "";
  const userLabel = user ? `${user.name} (${roleLabel})` : "ไม่ได้เข้าสู่ระบบ";

  return (
    <header className="bg-white border-b border-[#d9dee3] px-6 lg:px-7 py-3 flex flex-wrap items-center gap-3">
      <div className="text-sm text-[#5f6b76] flex items-center gap-1.5">
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {idx > 0 && <span className="text-[#9aa5b1]">/</span>}
            <span className={crumb.current ? "font-semibold text-[#1f2933]" : ""}>{crumb.label}</span>
          </span>
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-wrap items-center gap-3">
        <form action="/cases" method="GET">
          <input
            type="search"
            name="q"
            aria-label="ค้นหาเลข PI หรือ SKU"
            placeholder="ค้นหาเลข PI, SKU…"
            className="text-[15px] border border-[#c7ced5] rounded-md px-3 py-1.5 min-h-[38px] w-56 text-[#1f2933] placeholder:text-[#7b8794] focus:border-[#0f5c4d] focus:outline-none"
          />
        </form>
        {user && <NotificationBell />}
        {user && devUsers && devUsers.length > 0 && (
          <DevRoleSwitcher currentUserId={user.id} users={devUsers} />
        )}
        <span className="text-sm text-[#5f6b76] whitespace-nowrap">{userLabel}</span>
      </div>
    </header>
  );
}
