"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface DevUserOption {
  id: string;
  email: string;
  thaiName: string | null;
  nickname: string | null;
  roles: string[];
}

interface DevRoleSwitcherProps {
  currentUserId: string;
  users: DevUserOption[];
}

export function DevRoleSwitcher({ currentUserId, users }: DevRoleSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function handleChange(userId: string) {
    setSwitching(true);
    try {
      const res = await fetch("/api/dev/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm text-[#5f6b76]">
      <span className="hidden lg:inline font-semibold text-xs text-[#0f5c4d] bg-[#e6f2ef] border border-[#b9ddd5] px-2 py-0.5 rounded">
        Dev Role
      </span>
      <select
        aria-label="สลับผู้ใช้โหมดพัฒนา"
        disabled={switching}
        value={currentUserId}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-[#c7ced5] bg-white px-2.5 py-1.5 min-h-[38px] text-sm text-[#1f2933] focus:border-[#0f5c4d] focus:outline-none"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.thaiName ?? u.email} ({u.roles.join("/")})
          </option>
        ))}
      </select>
    </label>
  );
}
