"use client";

import { useState, type FormEvent } from "react";
import type { MasterOptionsDto } from "@/components/packaging/case-detail-types";

interface Props {
  caseId: string;
  master: MasterOptionsDto;
  onRefresh: () => void;
}

export function AttachPiCard({ caseId, master, onRefresh }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [piNumber, setPiNumber] = useState("");
  const [piDate, setPiDate] = useState(today);
  const [skuCount, setSkuCount] = useState(1);
  const [caseConfigId, setCaseConfigId] = useState(master.caseConfigs[1]?.id ?? master.caseConfigs[0]?.id ?? "");
  const [packagingTypeIds, setPackagingTypeIds] = useState<string[]>(
    master.packagingTypes[0] ? [master.packagingTypes[0].id] : []
  );
  const [isMinorChange, setIsMinorChange] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleType = (id: string) =>
    setPackagingTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/packaging`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piNumber, piDate, skuCount: Number(skuCount), caseConfigId, packagingTypeIds, isMinorChange }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "ลงทะเบียน PI ไม่สำเร็จ");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลงทะเบียน PI ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#0f5c4d] rounded-md p-5 space-y-4">
      <div>
        <h3 className="text-[16px] font-bold text-[#0f5c4d]">เปิดขั้นที่ 2: ลงทะเบียน PI & สร้างแผน Packaging</h3>
        <p className="text-xs text-[#5f6b76]">เมื่อสรุปราคาจากโรงงานแล้ว สามารถกรอกเลข PI เพื่อเริ่มคำนวณตารางวันออกแบบ Packaging ได้ทันที</p>
      </div>
      {error ? <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-1.5 text-xs text-[#b91c1c]">{error}</div> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <input required value={piNumber} onChange={(e) => setPiNumber(e.target.value)} placeholder="เลขที่ PI *" className="rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
        <input required type="date" value={piDate} onChange={(e) => setPiDate(e.target.value)} className="rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
        <select value={caseConfigId} onChange={(e) => setCaseConfigId(e.target.value)} className="rounded-md border border-[#c7ced5] px-2.5 py-1.5 bg-white text-[#1f2933]">
          {master.caseConfigs.map((cfg) => (
            <option key={cfg.id} value={cfg.id}>Case {cfg.caseNumber}: {cfg.name}</option>
          ))}
        </select>
        <input required type="number" min={1} value={skuCount} onChange={(e) => setSkuCount(Number(e.target.value))} placeholder="จำนวน SKU" className="rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {master.packagingTypes.slice(0, 12).map((pt) => {
          const active = packagingTypeIds.includes(pt.id);
          return (
            <button key={pt.id} type="button" onClick={() => toggleType(pt.id)} className={`px-2 py-1 rounded text-xs font-semibold border ${active ? "bg-[#0f5c4d] border-[#0f5c4d] text-white" : "bg-white border-[#c7ced5] text-[#1f2933]"}`}>
              {pt.nameTh}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-xs text-[#1f2933]">
          <input type="checkbox" checked={isMinorChange} onChange={(e) => setIsMinorChange(e.target.checked)} className="accent-[#0f5c4d]" />
          Repeat Order / Minor Change (ข้าม EVP)
        </label>
        <button type="submit" disabled={busy || packagingTypeIds.length === 0} className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50">
          {busy ? "กำลังสร้างแผน..." : "ลงทะเบียน PI & เริ่มงาน Packaging"}
        </button>
      </div>
    </form>
  );
}
