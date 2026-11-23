"use client";

import { useState, type FormEvent } from "react";

interface Props {
  caseId: string;
  onRefresh: () => void;
}

export function AddQuotationForm({ caseId, onRefresh }: Props) {
  const [vendorName, setVendorName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [moq, setMoq] = useState("500");
  const [leadTimeDays, setLeadTimeDays] = useState("45");
  const [incoterm, setIncoterm] = useState("FOB");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName,
          unitPrice: Number(unitPrice),
          currency,
          moq: Number(moq),
          leadTimeDays: Number(leadTimeDays),
          incoterm,
          notes: notes.trim() || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "เพิ่มใบเสนอราคาไม่สำเร็จ");
      setVendorName("");
      setUnitPrice("");
      setNotes("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มใบเสนอราคาไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#e5e9ed] pt-4 space-y-3 text-sm">
      <div className="font-bold text-[#1f2933]">+ เพิ่มใบเสนอราคาเพื่อเปรียบเทียบ</div>
      {error ? (
        <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-1.5 text-xs text-[#b91c1c]">{error}</div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        <input required value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="ชื่อโรงงานผู้ผลิต *" className="lg:col-span-2 rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
        <input required type="number" step="0.0001" min="0.0001" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="ราคา/หน่วย *" className="rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-md border border-[#c7ced5] px-2.5 py-1.5 bg-white text-[#1f2933]">
          <option value="USD">USD</option>
          <option value="CNY">CNY</option>
          <option value="THB">THB</option>
          <option value="EUR">EUR</option>
        </select>
        <input required type="number" min="1" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="MOQ *" className="rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
        <input required type="number" min="1" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} placeholder="Lead Time (วัน)" className="rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <select value={incoterm} onChange={(e) => setIncoterm(e.target.value)} className="rounded-md border border-[#c7ced5] px-2.5 py-1.5 bg-white text-[#1f2933]">
          <option value="FOB">FOB</option>
          <option value="EXW">EXW</option>
          <option value="CIF">CIF</option>
          <option value="CFR">CFR</option>
          <option value="DDP">DDP</option>
        </select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="เงื่อนไขเพิ่มเติม / สเปก / การรับประกัน..." className="flex-1 min-w-[200px] rounded-md border border-[#c7ced5] px-3 py-1.5 text-[#1f2933]" />
        <button type="submit" disabled={busy} className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white font-semibold disabled:opacity-50">
          {busy ? "กำลังบันทึก..." : "บันทึกใบเสนอราคา"}
        </button>
      </div>
    </form>
  );
}
