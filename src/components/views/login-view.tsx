"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useTracker } from "@/components/context/tracker-context";
import { ROLES_META } from "@/lib/domain/aw-constants";
import type { TrackerRoleKey } from "@/lib/domain/directory-import-design";

const ROLE_ORDER: TrackerRoleKey[] = ["import", "designer", "mdsg", "evp", "photographer", "mgmt"];

export function LoginDirectoryView() {
  const router = useRouter();
  const { staff, session, switchSession, showToast } = useTracker();
  const [roleTab, setRoleTab] = useState<TrackerRoleKey>(session.role);
  const [q, setQ] = useState("");

  const list = staff.filter(
    (s) =>
      s.role === roleTab &&
      (!q.trim() ||
        (s.displayName + s.fullName + s.email + s.jobTitle + s.sdeptCodes.join(","))
          .toLowerCase()
          .includes(q.trim().toLowerCase()))
  );

  async function selectUser(role: TrackerRoleKey, displayName: string) {
    await switchSession(role, displayName);
    showToast(`เข้าใช้งานในชื่อ ${displayName} (${ROLES_META[role].name})`);
    router.push("/");
  }

  return (
    <div className="card">
      <h2>เลือกบัญชีพนักงาน (@chg.co.th)</h2>
      <div className="hint" style={{ marginBottom: 14 }}>
        ฐานข้อมูลพนักงานจริง {staff.length} บัญชี · คลิกเพื่อสลับเข้าใช้งานในบทบาทและชื่อนั้นทันที
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginBottom: 14 }}>
        <div className="tabs">
          {ROLE_ORDER.map((r) => (
            <button
              key={r}
              type="button"
              className={`tab${roleTab === r ? " on" : ""}`}
              onClick={() => setRoleTab(r)}
            >
              {ROLES_META[r].name} ({staff.filter((s) => s.role === r).length})
            </button>
          ))}
        </div>
        <input
          placeholder="ค้นหาชื่อ / อีเมล / ตำแหน่ง / รหัส Sdept…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ border: "1px solid #C9D2DE", borderRadius: 8, padding: "7px 12px", minWidth: 260 }}
        />
      </div>

      <div className="scroll">
        <table className="tbl sm">
          <thead>
            <tr>
              <th>ชื่อแสดงในระบบ</th>
              <th>ชื่อ-นามสกุล</th>
              <th>Email</th>
              <th>ระดับ</th>
              <th>ตำแหน่งงาน</th>
              <th>Sdept ที่ดูแล</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const isCurrent = session.userDisplayName === u.displayName && session.role === roleTab;
              return (
                <tr key={u.id}>
                  <td><b>{u.displayName}</b></td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td><span className="chip neu">{u.orgLevel}</span></td>
                  <td className="hint">{u.jobTitle}</td>
                  <td className="hint">{u.sdeptCodes.length > 0 ? u.sdeptCodes.join(", ") : "–"}</td>
                  <td className="r">
                    <button
                      type="button"
                      className={`btn sm${isCurrent ? "" : " pri"}`}
                      disabled={isCurrent}
                      onClick={() => void selectUser(roleTab, u.displayName)}
                    >
                      {isCurrent ? "กำลังใช้งาน" : "เลือกใช้บัญชีนี้"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
