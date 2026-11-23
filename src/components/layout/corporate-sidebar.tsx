"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  matchPrefix?: string;
}

const IMPORT_NAV: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/cases", label: "Import Cases", matchPrefix: "/cases" },
  { href: "/packaging", label: "Packaging", matchPrefix: "/packaging" },
  { href: "/cases?stage=PURCHASE_ORDER", label: "PO & Production" },
  { href: "/cases?stage=LOGISTIC", label: "Shipment" },
];

const SETTINGS_NAV: NavItem[] = [
  { href: "/admin", label: "Master Data", matchPrefix: "/admin" },
  { href: "/login", label: "สลับผู้ใช้งาน (Dev)", matchPrefix: "/login" },
];

export function CorporateSidebar() {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    if (item.href === "/") return pathname === "/";
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return false;
  }

  return (
    <aside className="w-full md:w-60 md:min-h-screen shrink-0 bg-[#0d3b33] text-[#d6e6e1] px-3.5 py-5 flex flex-col gap-1">
      <Link href="/" className="flex items-center gap-2.5 px-2.5 pt-1 pb-4">
        <span className="w-8 h-8 rounded-md bg-white text-[#0d3b33] font-bold text-sm flex items-center justify-center shrink-0">
          IP
        </span>
        <span className="font-bold text-[17px] text-white tracking-tight">Importal</span>
      </Link>

      <div className="text-xs text-[#8fb3a9] px-2.5 pt-2 pb-1">งานนำเข้า</div>
      <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto">
        {IMPORT_NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "px-3 py-2.5 rounded-md text-[15px] whitespace-nowrap transition-colors",
              isActive(item)
                ? "bg-[#17574b] text-white font-semibold"
                : "text-[#d6e6e1] hover:bg-[#134b40] hover:text-white"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="text-xs text-[#8fb3a9] px-2.5 pt-4 pb-1">ตั้งค่า</div>
      <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto">
        {SETTINGS_NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "px-3 py-2.5 rounded-md text-[15px] whitespace-nowrap transition-colors",
              isActive(item)
                ? "bg-[#17574b] text-white font-semibold"
                : "text-[#d6e6e1] hover:bg-[#134b40] hover:text-white"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
