"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useTracker } from "@/components/context/tracker-context";
import { SUB_MAP } from "@/lib/domain/aw-constants";
import { curSub } from "@/lib/domain/sla-engine";
import { fmtThaiDate } from "@/lib/domain/working-days";

const NAV_ITEMS = [
  {
    href: "/",
    key: "tasks",
    label: "งานของฉัน",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
      </svg>
    ),
  },
  {
    href: "/jobs",
    key: "jobs",
    label: "รายการงานทั้งหมด",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    href: "/create",
    key: "create",
    label: "แจ้งงานออกแบบใหม่",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    key: "dash",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/workflow",
    key: "flow",
    label: "Workflow & SLA",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="6" rx="1" />
        <rect x="14" y="15" width="7" height="6" rx="1" />
        <path d="M6.5 9v4a2 2 0 0 0 2 2H14" />
      </svg>
    ),
  },
  {
    href: "/rules",
    key: "rules",
    label: "เกณฑ์การวัด (Review)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    key: "notif",
    label: "แจ้งเตือน Email",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
] as const;

export function TrackerSidebar() {
  const pathname = usePathname();
  const { jobs, session, outbox, today, resetDemoRemote } = useTracker();

  const myTaskCount = jobs.filter((j) => SUB_MAP[curSub(j)].roles.includes(session.role)).length;

  return (
    <aside className="side">
      <div className="brand">
        <b>AW Packaging Tracker</b>
        <span>งานออกแบบบรรจุภัณฑ์ สินค้า Import</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const count =
          item.key === "tasks" ? myTaskCount : item.key === "notif" ? outbox.length : 0;

        return (
          <Link key={item.key} href={item.href} className={`nav${active ? " on" : ""}`}>
            {item.icon}
            <span>{item.label}</span>
            {count > 0 && <span className="cnt">{count}</span>}
          </Link>
        );
      })}

      <div className="foot">
        <div>ผู้ใช้งาน: <b>{session.userDisplayName}</b></div>
        <div style={{ opacity: 0.8 }}>{session.userEmail}</div>
        <div style={{ marginTop: 4 }}>วันที่ปัจจุบัน: {fmtThaiDate(today)}</div>
        <Link
          href="/login"
          style={{
            display: "block",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,.35)",
            color: "#fff",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            marginTop: 8,
            textDecoration: "none",
          }}
        >
          สลับบัญชีพนักงาน (@chg.co.th)
        </Link>
        <button type="button" onClick={() => void resetDemoRemote()}>
          รีเซ็ตข้อมูล Demo
        </button>
      </div>
    </aside>
  );
}
