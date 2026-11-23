"use client";

import { useState, type FormEvent } from "react";
import { Mail, Trash2 } from "lucide-react";
import { formatDateShort } from "@/lib/utils/date-th";
import type { AdminHolidayDto, AdminSettingDto } from "./admin-types";

interface Props {
  holidays: AdminHolidayDto[];
  settings: AdminSettingDto[];
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}

export function HolidaysSettingsTab({ holidays, settings, onMutate, busy }: Props) {
  const [date, setDate] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [isSubstitute, setIsSubstitute] = useState(false);
  const [digestStatus, setDigestStatus] = useState<string | null>(null);
  const [runningDigest, setRunningDigest] = useState(false);

  async function handleAddHoliday(e: FormEvent) {
    e.preventDefault();
    await onMutate({ entity: "HOLIDAY_CREATE", date, nameTh, isSubstitute });
    setDate("");
    setNameTh("");
    setIsSubstitute(false);
  }

  async function triggerDigestNow() {
    setRunningDigest(true);
    setDigestStatus(null);
    try {
      const res = await fetch("/api/jobs/overdue-digest", { method: "POST" });
      const json = (await res.json()) as { error?: string; usersNotified?: number; emailsSent?: number; overdueItemsCount?: number };
      if (!res.ok) throw new Error(json.error ?? "รันงานแจ้งเตือนไม่สำเร็จ");
      setDigestStatus(
        `ส่ง Digest เรียบร้อย: พบงานล่าช้า/ใกล้ครบกำหนด ${json.overdueItemsCount} งาน · แจ้งเตือน ${json.usersNotified} คน · ส่งอีเมลสำเร็จ ${json.emailsSent} ฉบับ (ตรวจดูได้ที่ Mailpit :8025)`
      );
    } catch (err) {
      setDigestStatus(err instanceof Error ? err.message : "รันงานแจ้งเตือนไม่สำเร็จ");
    } finally {
      setRunningDigest(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#1f2933]">Daily 08:00 Overdue Digest Job</h2>
            <p className="text-xs text-[#5f6b76]">
              ส่งอีเมลและแจ้งเตือนสรุปงานล่าช้า/ใกล้ครบกำหนดให้ผู้รับผิดชอบแต่ละคน (Cron: <code className="font-mono">0 8 * * 1-5</code>)
            </p>
          </div>
          <button
            type="button"
            disabled={runningDigest}
            onClick={triggerDigestNow}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {runningDigest ? "กำลังส่งอีเมล..." : "รัน Overdue Digest ทันที"}
          </button>
        </div>
        {digestStatus ? (
          <div className="rounded-md bg-[#eef7f5] border border-[#a7d7ca] px-3.5 py-2 text-xs text-[#0f5c4d]">
            {digestStatus}
          </div>
        ) : null}
      </section>

      <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-3">
        <h2 className="text-[16px] font-bold text-[#1f2933]">ตั้งค่าระบบ (System Settings)</h2>
        <div className="divide-y divide-[#e5e9ed]">
          {settings.map((s) => (
            <div key={s.key} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <div className="font-mono text-xs font-semibold text-[#1f2933]">{s.key}</div>
                {s.description ? <div className="text-xs text-[#5f6b76]">{s.description}</div> : null}
              </div>
              {typeof s.value === "boolean" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMutate({ entity: "SYSTEM_SETTING_UPDATE", key: s.key, value: !s.value })}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    s.value ? "bg-[#e6f2ef] text-[#0f5c4d]" : "bg-[#eef1f4] text-[#5f6b76]"
                  }`}
                >
                  {s.value ? "เปิดใช้งาน (true)" : "ปิดไว้ (false)"}
                </button>
              ) : (
                <span className="font-bold text-[#1f2933] tabular-nums">{String(s.value)}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-4">
        <h2 className="text-[16px] font-bold text-[#1f2933]">วันหยุดประจำปีบริษัท ({holidays.length} วัน)</h2>
        <form onSubmit={handleAddHoliday} className="flex flex-wrap items-end gap-2.5 text-sm">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">วันที่ *</span>
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-[#c7ced5] rounded-md px-3 py-1.5 text-[#1f2933]" />
          </label>
          <label className="space-y-1 flex-1 min-w-[200px]">
            <span className="text-xs font-semibold text-[#5f6b76]">ชื่อวันหยุด *</span>
            <input required value={nameTh} onChange={(e) => setNameTh(e.target.value)} placeholder="เช่น วันขึ้นปีใหม่" className="w-full border border-[#c7ced5] rounded-md px-3 py-1.5 text-[#1f2933]" />
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-[#1f2933] pb-2">
            <input type="checkbox" checked={isSubstitute} onChange={(e) => setIsSubstitute(e.target.checked)} className="accent-[#0f5c4d]" />
            วันหยุดชดเชย
          </label>
          <button type="submit" disabled={busy} className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white font-semibold disabled:opacity-50">
            + เพิ่มวันหยุด
          </button>
        </form>

        <div className="divide-y divide-[#e5e9ed] max-h-80 overflow-y-auto border-t border-[#e5e9ed]">
          {holidays.map((h) => (
            <div key={h.id} className="py-2 flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0f5c4d] tabular-nums w-20">{formatDateShort(h.date)}</span>
                <span className="text-[#1f2933]">{h.nameTh}</span>
                {h.isSubstitute ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#eef1f4] text-[#5f6b76]">ชดเชย</span> : null}
              </div>
              <button
                type="button"
                disabled={busy}
                aria-label={`ลบ ${h.nameTh}`}
                onClick={() => onMutate({ entity: "HOLIDAY_DELETE", id: h.id })}
                className="p-1 text-[#5f6b76] hover:text-[#b91c1c]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
