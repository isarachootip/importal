"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TimelineBoardStatus } from "@prisma/client";
import type { EnrichedCaseSummary } from "@/lib/domain/case-analytics";
import { BOARD_STATUS_LABELS } from "@/lib/domain/packaging-labels";
import { PackagingCard } from "./packaging-card";

interface FilterOption {
  id: string;
  label: string;
}

interface Props {
  items: EnrichedCaseSummary[];
  myCaseIds: string[];
  brands: FilterOption[];
  owners: FilterOption[];
  initialMineOnly?: boolean;
}

const ACTIVE_COLUMNS: TimelineBoardStatus[] = [
  "PENDING_IMPORT",
  "PRE_QC_GD",
  "ON_PROCESS",
  "SENT_DRAFT_1",
  "SENT_DRAFT_2",
  "SENT_DRAFT_3",
  "APPROVE_FINAL",
];

export function PackagingBoardClient({
  items,
  myCaseIds,
  brands,
  owners,
  initialMineOnly = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [brandId, setBrandId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [caseNum, setCaseNum] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(initialMineOnly);
  const [showCompleted, setShowCompleted] = useState(false);

  const mySet = useMemo(() => new Set(myCaseIds), [myCaseIds]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const p = item.packaging;
      if (!p) return false;
      if (brandId && item.brandId !== brandId) return false;
      if (ownerId && item.ownerId !== ownerId) return false;
      if (caseNum && p.caseNumber !== Number(caseNum)) return false;
      if (overdueOnly && p.overdueDays <= 0) return false;
      if (mineOnly && !mySet.has(item.id)) return false;
      if (needle) {
        const hay = `${item.caseCode} ${item.productTitle} ${item.brandName} ${p.piNumber}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, brandId, ownerId, caseNum, overdueOnly, mineOnly, query, mySet]);

  const completedItems = filtered.filter((i) => i.packaging?.timelineStatus === "APPROVED_FINAL");
  const activeCount = filtered.length - completedItems.length;

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md px-5 py-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-[#1f2933]">Packaging Design Board (7 คอลัมน์)</h1>
            <p className="text-sm text-[#5f6b76]">
              งานกำลังดำเนินการ {activeCount} รายการ · อนุมัติ Final แล้ว {completedItems.length} รายการ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCompleted((v) => !v)}
              className="px-3 py-1.5 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933]"
            >
              {showCompleted ? "ซ่อนงานที่อนุมัติ Final แล้ว" : `ดูงานอนุมัติ Final แล้ว (${completedItems.length})`}
            </button>
            <Link
              href="/cases/new"
              className="px-3.5 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold"
            >
              + ลงทะเบียน PI ใหม่
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#e5e9ed] text-sm">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา Case, PI, สินค้า..."
            className="border border-[#c7ced5] rounded-md px-3 py-1.5 w-52 text-[#1f2933]"
          />
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
            <option value="">ทุก Brand</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
            <option value="">ผู้รับผิดชอบทุกคน</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <select value={caseNum} onChange={(e) => setCaseNum(e.target.value)} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
            <option value="">Case 1–6 ทั้งหมด</option>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Case {n}</option>)}
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1f2933] cursor-pointer ml-1">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="accent-[#0f5c4d]" />
            เฉพาะรอฉันดำเนินการ
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b91c1c] cursor-pointer">
            <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} className="accent-[#b91c1c]" />
            เฉพาะงานล่าช้า
          </label>
        </div>
      </section>

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-7 gap-3 min-w-[1540px]">
          {ACTIVE_COLUMNS.map((status) => {
            const colItems = filtered.filter((i) => i.packaging?.timelineStatus === status);
            return (
              <section key={status} className="bg-[#f5f7f9] border border-[#d9dee3] rounded-md flex flex-col">
                <header className="px-3 py-2.5 border-b border-[#d9dee3] bg-white rounded-t-md flex items-center justify-between gap-2">
                  <h2 className="text-[13px] font-bold text-[#1f2933]">{BOARD_STATUS_LABELS[status]}</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#e6f2ef] text-[#0f5c4d] tabular-nums">
                    {colItems.length}
                  </span>
                </header>
                <div className="p-2.5 space-y-2.5 min-h-[260px]">
                  {colItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#9aa5b1]">ไม่มีงานในคอลัมน์นี้</div>
                  ) : (
                    colItems.map((item) => (
                      <PackagingCard key={item.id} item={item} isMine={mySet.has(item.id)} />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {showCompleted ? (
        <section className="bg-white border border-[#d9dee3] rounded-md p-4 space-y-3">
          <h3 className="text-[15px] font-bold text-[#0f5c4d]">
            อนุมัติ Final แล้ว ({completedItems.length} รายการ)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {completedItems.map((item) => (
              <PackagingCard key={item.id} item={item} isMine={false} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
