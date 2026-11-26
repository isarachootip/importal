"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { useTracker } from "@/components/context/tracker-context";
import { ROLES_META } from "@/lib/domain/aw-constants";
import type { TrackerRoleKey } from "@/lib/domain/directory-import-design";

const PAGE_TITLES: Record<string, [string, string]> = {
  "/": ["งานของฉัน", "งานที่รอคุณดำเนินการ ตามบทบาทที่เลือก"],
  "/jobs": ["รายการงานทั้งหมด", "ค้นหาและติดตามทุก PI"],
  "/create": ["แจ้งงานออกแบบ Packaging", "Step 1 · Import แจ้งงานหลัง EVP อนุมัติ PI"],
  "/dashboard": ["Dashboard", "สรุป Status และ Performance On-time / Delay"],
  "/workflow": ["Workflow & SLA", "ขั้นตอนการทำงานและระยะเวลามาตรฐานแต่ละขั้น"],
  "/rules": ["เกณฑ์การวัด", "มาตรฐานและวิธีคำนวณทั้งหมด สำหรับให้ทีม Review"],
  "/notifications": ["การแจ้งเตือนทางอีเมล", "ส่งอีเมลเมื่องานถูกส่งต่อ และเตือนเมื่อใกล้ / เกิน SLA"],
  "/login": ["เลือกบัญชีพนักงาน (@chg.co.th)", "สลับผู้ใช้งานหรือบทบาทเพื่อทดสอบระบบ"],
};

export function TrackerTopbar() {
  const pathname = usePathname();
  const { session, staff, switchSession } = useTracker();

  const [title, sub] = pathname.startsWith("/jobs/")
    ? ["รายละเอียดงาน", "ติดตามความคืบหน้า บันทึกผลตรวจ และประวัติการดำเนินงาน"]
    : (PAGE_TITLES[pathname] ?? ["AW Packaging Tracker", ""]);

  const roleStaff = staff.filter((s) => s.role === session.role);

  return (
    <header className="top">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>

      <div className="role">
        <div className="av">{session.initials}</div>
        <label htmlFor="roleSel">ใช้งานในบทบาท</label>
        <select
          id="roleSel"
          value={session.role}
          onChange={(e) => void switchSession(e.target.value as TrackerRoleKey)}
        >
          {(Object.entries(ROLES_META) as Array<[TrackerRoleKey, (typeof ROLES_META)[TrackerRoleKey]]>).map(
            ([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            )
          )}
        </select>

        {roleStaff.length > 1 && (
          <select
            aria-label="เลือกชื่อผู้ใช้งาน"
            value={session.userDisplayName}
            onChange={(e) => void switchSession(session.role, e.target.value)}
            style={{ fontWeight: 500, maxWidth: 200 }}
          >
            {roleStaff.map((u) => (
              <option key={u.id} value={u.displayName}>
                {u.displayName}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
}
