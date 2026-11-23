"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { AdminMasterDto } from "./admin-types";
import { BrandsAdminTab } from "./brands-admin-tab";
import { CaseRulesAdminTab } from "./case-rules-admin-tab";
import { HolidaysSettingsTab } from "./holidays-settings-tab";

type AdminTab = "brands" | "rules" | "holidays";

export function AdminConsoleClient({ data }: { data: AdminMasterDto }) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("brands");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const importOwners = data.users.filter((u) => u.roles.includes("IMPORT"));

  async function handleMutate(payload: Record<string, unknown>) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกข้อมูลไม่สำเร็จ");
      setFeedback({ type: "ok", text: "อัปเดตข้อมูล Master Data เรียบร้อยแล้ว" });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "err", text: err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  const tabs: Array<{ key: AdminTab; label: string }> = [
    { key: "brands", label: `Brands & เจ้าของงาน (${data.brands.length})` },
    { key: "rules", label: "Case 1–6 & ลำดับอนุมัติ" },
    { key: "holidays", label: `วันหยุด (${data.holidays.length}) & Digest Job` },
  ];

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md px-5 py-4">
        <h1 className="text-[22px] font-bold text-[#1f2933]">Master Data & System Admin</h1>
        <p className="text-sm text-[#5f6b76] mt-0.5">
          จัดการ Brand, Lead Time Case 1–6, ลำดับอนุมัติ, วันหยุดประจำปี และรันงานแจ้งเตือน Overdue Digest
        </p>
      </section>

      {feedback ? (
        <div
          className={`px-4 py-2.5 rounded-md text-sm border ${
            feedback.type === "ok"
              ? "bg-[#eef7f5] border-[#a7d7ca] text-[#0f5c4d]"
              : "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 border-b border-[#d9dee3] pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3.5 py-2 rounded-md text-sm font-semibold transition-colors",
              tab === t.key ? "bg-[#0f5c4d] text-white" : "bg-white border border-[#d9dee3] text-[#1f2933] hover:bg-[#f5f7f9]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "brands" ? (
        <BrandsAdminTab brands={data.brands} importOwners={importOwners} onMutate={handleMutate} busy={busy} />
      ) : tab === "rules" ? (
        <CaseRulesAdminTab caseConfigs={data.caseConfigs} approvalRules={data.approvalRules} onMutate={handleMutate} busy={busy} />
      ) : (
        <HolidaysSettingsTab holidays={data.holidays} settings={data.settings} onMutate={handleMutate} busy={busy} />
      )}
    </div>
  );
}
