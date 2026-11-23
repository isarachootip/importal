"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginUserItem {
  id: string;
  email: string;
  thaiName: string;
  roles: string[];
}

export function LoginClient({ users }: { users: LoginUserItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function selectUser(userId: string) {
    setLoadingId(userId);
    try {
      const res = await fetch("/api/dev/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1f2933]">โหมดพัฒนา (เลือกบทบาท)</h2>
        <span className="text-xs font-semibold text-[#0f5c4d] bg-[#e6f2ef] border border-[#b9ddd5] px-2 py-0.5 rounded">
          DEV MODE
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            disabled={loadingId !== null}
            onClick={() => selectUser(u.id)}
            className="text-left rounded-md border border-[#d9dee3] hover:border-[#0f5c4d] hover:bg-[#f5f9f8] bg-white px-3.5 py-2.5 transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-sm text-[#1f2933]">{u.thaiName}</div>
            <div className="text-xs text-[#5f6b76]">{u.email}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {u.roles.map((r) => (
                <span key={r} className="text-[11px] font-semibold bg-[#eef1f4] text-[#0d3b33] px-1.5 py-0.5 rounded">
                  {r}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
