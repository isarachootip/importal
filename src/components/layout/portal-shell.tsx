import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/auth/types";
import type { DevUserOption } from "./dev-role-switcher";
import { CorporateSidebar } from "./corporate-sidebar";
import { CorporateTopbar } from "./corporate-topbar";

interface PortalShellProps {
  breadcrumbs: Array<{ label: string; current?: boolean }>;
  user: SessionUser | null;
  devUsers?: DevUserOption[];
  children: ReactNode;
}

export function PortalShell({ breadcrumbs, user, devUsers, children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-[#eef1f4] text-[#1f2933] flex flex-col md:flex-row">
      <CorporateSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <CorporateTopbar breadcrumbs={breadcrumbs} user={user} devUsers={devUsers} />
        <main className="p-6 lg:px-7 lg:py-6 flex flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
