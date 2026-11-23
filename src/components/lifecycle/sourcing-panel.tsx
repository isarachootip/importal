"use client";

import { useState } from "react";
import type { RoleCode, SourcingStatus } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";
import type { CaseDetailDto, MasterOptionsDto } from "@/components/packaging/case-detail-types";
import { SOURCING_STATUS_LABELS, SOURCING_STATUS_ORDER } from "@/lib/domain/lifecycle-labels";
import { AddQuotationForm } from "./add-quotation-form";
import { AttachPiCard } from "./attach-pi-card";
import { StageDocumentsCard } from "./stage-documents-card";

interface Props {
  data: CaseDetailDto;
  master: MasterOptionsDto;
  userRoles: readonly RoleCode[];
  onRefresh: () => void;
}

export function SourcingPanel({ data, master, userRoles, onRefresh }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = userRoles.some((r) => ["IMPORT", "MER", "GM", "VP", "ADMIN"].includes(r));
  const canQuote = canManage || userRoles.includes("VENDOR");
  const canAttachPi = !data.packaging && userRoles.some((r) => ["IMPORT", "ADMIN"].includes(r));

  async function patchSourcing(payload: { sourcingStatus?: SourcingStatus; selectQuotationId?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${data.id}/sourcing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "อัปเดต Sourcing ไม่สำเร็จ");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปเดต Sourcing ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const lowestPrice =
    data.quotations.length > 0 ? Math.min(...data.quotations.map((q) => q.unitPrice)) : null;

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2933]">ขั้นตอนที่ 1: Sourcing & เปรียบเทียบใบเสนอราคา</h2>
            <p className="text-xs text-[#5f6b76]">
              สถานะปัจจุบัน: <strong className="text-[#0f5c4d]">{SOURCING_STATUS_LABELS[data.sourcingStatus]}</strong>
            </p>
          </div>
          {canManage && data.sourcingStatus !== "APPROVED" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => patchSourcing({ sourcingStatus: "APPROVED" })}
              className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
            >
              อนุมัติ Sourcing ผ่าน
            </button>
          ) : null}
        </div>

        {error ? <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-2 text-xs text-[#b91c1c]">{error}</div> : null}

        <div className="flex flex-wrap gap-1.5">
          {SOURCING_STATUS_ORDER.map((st) => {
            const active = st === data.sourcingStatus;
            return (
              <button
                key={st}
                type="button"
                disabled={!canManage || busy}
                onClick={() => patchSourcing({ sourcingStatus: st })}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-[#0f5c4d] border-[#0f5c4d] text-white"
                    : "bg-[#fafbfc] border-[#d9dee3] text-[#1f2933] hover:border-[#0f5c4d]"
                }`}
              >
                {SOURCING_STATUS_LABELS[st]}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto border border-[#e5e9ed] rounded-md">
          <table className="w-full text-sm text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-[#f5f7f9] text-[#5f6b76] text-xs font-semibold">
                <th className="py-2.5 px-4">โรงงานผู้ผลิต</th>
                <th className="py-2.5 px-3 text-right">ราคา/หน่วย</th>
                <th className="py-2.5 px-3 text-right">MOQ</th>
                <th className="py-2.5 px-3 text-right">Lead Time</th>
                <th className="py-2.5 px-3">Incoterm</th>
                <th className="py-2.5 px-3">หมายเหตุ</th>
                <th className="py-2.5 px-4 text-right">เลือกข้อเสนอ</th>
              </tr>
            </thead>
            <tbody>
              {data.quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-[#5f6b76]">
                    ยังไม่มีใบเสนอราคา — เพิ่มใบเสนอราคาจากโรงงานด้านล่างเพื่อเปรียบเทียบ
                  </td>
                </tr>
              ) : (
                data.quotations.map((q) => (
                  <tr key={q.id} className={`border-t border-[#e5e9ed] ${q.isSelected ? "bg-[#eef7f5]" : ""}`}>
                    <td className="py-2.5 px-4 font-semibold text-[#1f2933]">
                      {q.vendorName}
                      {q.unitPrice === lowestPrice && data.quotations.length > 1 ? (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#e6f2ef] text-[#0f5c4d]">
                          ราคาต่ำสุด
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-[#1f2933]">
                      {q.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} {q.currency}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#5f6b76]">{q.moq.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#5f6b76]">{q.leadTimeDays} วัน</td>
                    <td className="py-2.5 px-3 text-[#1f2933]">{q.incoterm}</td>
                    <td className="py-2.5 px-3 text-xs text-[#5f6b76]">{q.notes ?? "—"}</td>
                    <td className="py-2.5 px-4 text-right">
                      {q.isSelected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0f5c4d]">
                          <CheckCircle2 className="w-4 h-4" /> เลือกแล้ว
                        </span>
                      ) : canManage ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => patchSourcing({ selectQuotationId: q.id })}
                          className="px-2.5 py-1 rounded border border-[#c7ced5] bg-white hover:border-[#0f5c4d] text-xs font-semibold text-[#1f2933]"
                        >
                          เลือกข้อเสนอนี้
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {canQuote ? <AddQuotationForm caseId={data.id} onRefresh={onRefresh} /> : null}
      </section>

      {canAttachPi ? <AttachPiCard caseId={data.id} master={master} onRefresh={onRefresh} /> : null}

      <StageDocumentsCard
        caseId={data.id}
        stage="SOURCING"
        title="เอกสารใบเสนอราคา & Spec (Sourcing)"
        allowedDocTypes={["QUOTATION", "OTHER"]}
        documents={data.documents}
        canUpload={canQuote}
        onRefresh={onRefresh}
      />
    </div>
  );
}
