"use client";

import { useState, type FormEvent } from "react";
import type { PoStatus, RoleCode } from "@prisma/client";
import type { CaseDetailDto } from "@/components/packaging/case-detail-types";
import { PO_STATUS_LABELS, PO_STATUS_ORDER } from "@/lib/domain/lifecycle-labels";
import { formatDateShort } from "@/lib/utils/date-th";
import { StageDocumentsCard } from "./stage-documents-card";

interface Props {
  data: CaseDetailDto;
  userRoles: readonly RoleCode[];
  onRefresh: () => void;
}

export function PoPanel({ data, userRoles, onRefresh }: Props) {
  const [poStatus, setPoStatus] = useState<PoStatus>(data.poStatus);
  const [poNumber, setPoNumber] = useState(data.poNumber ?? "");
  const [poTotalAmount, setPoTotalAmount] = useState(data.poTotalAmount ? String(data.poTotalAmount) : "");
  const [poCurrency, setPoCurrency] = useState(data.poCurrency ?? "USD");
  const [incoterm, setIncoterm] = useState(data.incoterm ?? "FOB");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const canEdit = userRoles.some((r) => ["IMPORT", "GM", "VP", "EVP", "VENDOR", "ADMIN"].includes(r));
  const canApprove = userRoles.some((r) => ["GM", "VP", "EVP", "ADMIN"].includes(r));

  async function savePo(targetStatus: PoStatus) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cases/${data.id}/po`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poStatus: targetStatus,
          poNumber: poNumber.trim() || null,
          poTotalAmount: poTotalAmount ? Number(poTotalAmount) : null,
          poCurrency,
          incoterm: incoterm || null,
          note: note.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "อัปเดต PO ไม่สำเร็จ");
      setPoStatus(targetStatus);
      setNote("");
      setMessage({ type: "ok", text: `อัปเดตสถานะ PO เป็น "${PO_STATUS_LABELS[targetStatus]}" เรียบร้อยแล้ว` });
      onRefresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "อัปเดต PO ไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    savePo(poStatus);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2933]">ขั้นตอนที่ 3: Purchase Order (PO & Approval)</h2>
            <p className="text-xs text-[#5f6b76]">
              สถานะปัจจุบัน: <strong className="text-[#0f5c4d]">{PO_STATUS_LABELS[data.poStatus]}</strong> · แผนเสร็จ:{" "}
              <span className="font-semibold text-[#1f2933]">{formatDateShort(data.poPlanEnd)}</span>
            </p>
          </div>
          {canApprove && data.poStatus === "PO_DRAFT" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => savePo("PO_APPROVED")}
              className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
            >
              อนุมัติ PO (GM / VP / EVP)
            </button>
          ) : null}
        </div>

        {message ? (
          <div className={`px-3.5 py-2 rounded-md text-sm border ${message.type === "ok" ? "bg-[#eef7f5] border-[#a7d7ca] text-[#0f5c4d]" : "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]"}`}>
            {message.text}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {PO_STATUS_ORDER.map((st) => (
            <button
              key={st}
              type="button"
              disabled={!canEdit}
              onClick={() => setPoStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                poStatus === st
                  ? "bg-[#0f5c4d] border-[#0f5c4d] text-white"
                  : "bg-[#fafbfc] border-[#d9dee3] text-[#1f2933] hover:border-[#0f5c4d]"
              }`}
            >
              {PO_STATUS_LABELS[st]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">เลขที่ PO</span>
            <input value={poNumber} disabled={!canEdit} onChange={(e) => setPoNumber(e.target.value)} placeholder="เช่น PO-2026-015" className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">มูลค่า PO รวม</span>
            <input type="number" step="0.01" min="0" value={poTotalAmount} disabled={!canEdit} onChange={(e) => setPoTotalAmount(e.target.value)} placeholder="0.00" className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">สกุลเงิน</span>
            <select value={poCurrency} disabled={!canEdit} onChange={(e) => setPoCurrency(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 bg-white text-[#1f2933] disabled:bg-[#f5f7f9]">
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="THB">THB</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">Incoterm</span>
            <select value={incoterm} disabled={!canEdit} onChange={(e) => setIncoterm(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 bg-white text-[#1f2933] disabled:bg-[#f5f7f9]">
              <option value="FOB">FOB</option>
              <option value="EXW">EXW</option>
              <option value="CIF">CIF</option>
              <option value="CFR">CFR</option>
              <option value="DDP">DDP</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e5e9ed]">
          <input value={note} disabled={!canEdit} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุการออก/อนุมัติ PO..." className="flex-1 min-w-[220px] rounded-md border border-[#c7ced5] px-3 py-1.5 text-sm text-[#1f2933]" />
          {canEdit ? (
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50">
              {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล PO"}
            </button>
          ) : null}
        </div>
      </form>

      <StageDocumentsCard
        caseId={data.id}
        stage="PURCHASE_ORDER"
        title="เอกสารใบสั่งซื้อ (PO File)"
        allowedDocTypes={["PO_FILE", "OTHER"]}
        requiredDocTypes={["PO_FILE"]}
        documents={data.documents}
        canUpload={canEdit}
        onRefresh={onRefresh}
      />
    </div>
  );
}
