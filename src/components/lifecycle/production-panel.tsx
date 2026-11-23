"use client";

import { useState } from "react";
import type { ProductionStatus, RoleCode } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";
import type { CaseDetailDto } from "@/components/packaging/case-detail-types";
import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUS_ORDER } from "@/lib/domain/lifecycle-labels";
import { formatDateShort } from "@/lib/utils/date-th";
import { StageDocumentsCard } from "./stage-documents-card";

interface Props {
  data: CaseDetailDto;
  userRoles: readonly RoleCode[];
  onRefresh: () => void;
}

export function ProductionPanel({ data, userRoles, onRefresh }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<ProductionStatus>(data.productionStatus);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const canEdit = userRoles.some((r) => ["IMPORT", "VENDOR", "ADMIN"].includes(r));
  const currentIdx = PRODUCTION_STATUS_ORDER.indexOf(data.productionStatus);

  async function saveProduction(target: ProductionStatus) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cases/${data.id}/production`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productionStatus: target, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "อัปเดตสถานะการผลิตไม่สำเร็จ");
      setSelectedStatus(target);
      setNote("");
      setMessage({
        type: "ok",
        text:
          target === "READY_TO_SHIP"
            ? "สินค้าพร้อมส่งออกแล้ว — ระบบเปิดขั้นตอนที่ 5 (Logistic) ให้อัตโนมัติ"
            : `อัปเดตสถานะเป็น "${PRODUCTION_STATUS_LABELS[target]}" เรียบร้อยแล้ว`,
      });
      onRefresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2933]">ขั้นตอนที่ 4: Production (MTO) & ตรวจ QC โรงงาน</h2>
            <p className="text-xs text-[#5f6b76]">
              สถานะปัจจุบัน: <strong className="text-[#0f5c4d]">{PRODUCTION_STATUS_LABELS[data.productionStatus]}</strong> · แผนผลิตเสร็จ:{" "}
              <span className="font-semibold text-[#1f2933]">{formatDateShort(data.prodPlanEnd)}</span>
              {data.prodActualEnd ? <span className="ml-2 text-[#0f5c4d]">เสร็จจริง: {formatDateShort(data.prodActualEnd)}</span> : null}
            </p>
          </div>
          {canEdit && data.productionStatus !== "READY_TO_SHIP" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => saveProduction("READY_TO_SHIP")}
              className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
            >
              ผ่าน QC พร้อมส่งออก (Ready to Ship)
            </button>
          ) : null}
        </div>

        {message ? (
          <div className={`px-3.5 py-2 rounded-md text-sm border ${message.type === "ok" ? "bg-[#eef7f5] border-[#a7d7ca] text-[#0f5c4d]" : "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]"}`}>
            {message.text}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRODUCTION_STATUS_ORDER.filter((s) => s !== "NOT_STARTED").map((st) => {
            const idx = PRODUCTION_STATUS_ORDER.indexOf(st);
            const done = idx <= currentIdx;
            const active = st === selectedStatus;
            return (
              <button
                key={st}
                type="button"
                disabled={!canEdit}
                onClick={() => setSelectedStatus(st)}
                className={`text-left px-3.5 py-2.5 rounded-md border text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                  active
                    ? "bg-[#0f5c4d] border-[#0f5c4d] text-white"
                    : done
                      ? "bg-[#eef7f5] border-[#b6dcd2] text-[#0f5c4d]"
                      : "bg-[#fafbfc] border-[#d9dee3] text-[#1f2933] hover:border-[#0f5c4d]"
                }`}
              >
                <span>{PRODUCTION_STATUS_LABELS[st]}</span>
                {done && !active ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e5e9ed]">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="บันทึกความคืบหน้าการผลิต / ผล QC (เช่น % ผลิตเสร็จ, ผลสุ่มตรวจ AQL)..."
              className="flex-1 min-w-[240px] rounded-md border border-[#c7ced5] px-3 py-2 text-sm text-[#1f2933]"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => saveProduction(selectedStatus)}
              className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "กำลังบันทึก..." : "อัปเดตสถานะการผลิต"}
            </button>
          </div>
        ) : null}
      </section>

      <StageDocumentsCard
        caseId={data.id}
        stage="PRODUCTION"
        title="รายงานการตรวจคุณภาพสินค้า (QC Report)"
        allowedDocTypes={["QC_REPORT", "OTHER"]}
        requiredDocTypes={["QC_REPORT"]}
        documents={data.documents}
        canUpload={canEdit}
        onRefresh={onRefresh}
      />
    </div>
  );
}
