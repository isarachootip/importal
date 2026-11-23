"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { formatDateTimeTh } from "@/lib/utils/date-th";

interface NotifItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  importCase: { caseCode: string } | null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { items: NotifItem[]; unreadCount: number };
      setItems(json.items ?? []);
      setUnreadCount(json.unreadCount ?? 0);
    } catch {
      // ignore transient network errors
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setUnreadCount(0);
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="การแจ้งเตือน"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) fetchNotifications();
        }}
        className="relative p-2 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-[#1f2933]"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#b91c1c] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#d9dee3] rounded-md shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#e5e9ed] flex items-center justify-between">
            <span className="text-sm font-bold text-[#1f2933]">การแจ้งเตือน ({unreadCount} ยังไม่อ่าน)</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f5c4d] hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" /> อ่านทั้งหมด
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#e5e9ed]">
            {items.length === 0 ? (
              <div className="p-4 text-xs text-[#5f6b76] text-center">ยังไม่มีการแจ้งเตือน</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`px-4 py-2.5 text-xs ${n.isRead ? "bg-white" : "bg-[#f2f8f6]"}`}>
                  {n.importCase ? (
                    <Link
                      href={`/cases/${n.importCase.caseCode}`}
                      onClick={() => setOpen(false)}
                      className="font-bold text-[#0f5c4d] hover:underline block"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <div className="font-bold text-[#1f2933]">{n.title}</div>
                  )}
                  <p className="text-[#5f6b76] mt-0.5 line-clamp-2 whitespace-pre-line">{n.body}</p>
                  <div className="text-[11px] text-[#9aa5b1] mt-1">{formatDateTimeTh(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
