"use client";

import { useState, type FormEvent } from "react";
import type { LogisticStatus, RoleCode } from "@prisma/client";
import type { CaseDetailDto } from "@/components/packaging/case-detail-types";
import {
  LOGISTIC_STATUS_LABELS,
  LOGISTIC_STATUS_ORDER,
  REQUIRED_LOGISTIC_DOCS,
} from "@/lib/domain/lifecycle-labels";
import { formatDateShort } from "@/lib/utils/date-th";
import { StageDocumentsCard } from "./stage-documents-card";

interface Props {
  data: CaseDetailDto;
  userRoles: readonly RoleCode[];
  onRefresh: () => void;
}

export function LogisticPanel({ data, userRoles, onRefresh }: Props) {
  const [logisticStatus, setLogisticStatus] = useState<LogisticStatus>(data.logisticStatus);
  const [shippingMode, setShippingMode] = useState(data.shippingMode ?? "SEA_FCL");
  const [forwarderName, setForwarderName] = useState(data.forwarderName ?? "");
  const [blOrAwbNumber, setBlOrAwbNumber] = useState(data.blOrAwbNumber ?? "");
  const [containerNumber, setContainerNumber] = useState(data.containerNumber ?? "");
  const [etd, setEtd] = useState(data.etd?.slice(0, 10) ?? "");
  const [eta, setEta] = useState(data.eta?.slice(0, 10) ?? "");
  const [whIssueNote, setWhIssueNote] = useState(data.whIssueNote ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const canEdit = userRoles.some((r) => ["IMPORT", "FORWARDER", "ADMIN"].includes(r));

  async function saveLogistic(targetStatus: LogisticStatus) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cases/${data.id}/logistic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logisticStatus: targetStatus,
          shippingMode: shippingMode || null,
          forwarderName: forwarderName.trim() || null,
          blOrAwbNumber: blOrAwbNumber.trim() || null,
          containerNumber: containerNumber.trim() || null,
          etd: etd || null,
          eta: eta || null,
          whIssueNote: whIssueNote.trim() || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "อัปเดตสถานะขนส่งไม่สำเร็จ");
      setLogisticStatus(targetStatus);
      setMessage({
        type: "ok",
        text:
          targetStatus === "RECEIVED_COMPLETE"
            ? "บันทึกการตรวจรับสินค้าเข้าคลังครบถ้วน — ปิดงานนำเข้าเรียบร้อยแล้ว"
            : `อัปเดตสถานะเป็น "${LOGISTIC_STATUS_LABELS[targetStatus]}" เรียบร้อยแล้ว`,
      });
      onRefresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveLogistic(logisticStatus);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2933]">ขั้นตอนที่ 5: Inspection, Logistic & รับเข้าคลัง (WH)</h2>
            <p className="text-xs text-[#5f6b76]">
              สถานะปัจจุบัน: <strong className="text-[#0f5c4d]">{LOGISTIC_STATUS_LABELS[data.logisticStatus]}</strong> · แผนเข้าคลัง:{" "}
              <span className="font-semibold text-[#1f2933]">{formatDateShort(data.logisticPlanEnd)}</span>
            </p>
          </div>
          {canEdit && data.logisticStatus !== "RECEIVED_COMPLETE" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => saveLogistic("RECEIVED_COMPLETE")}
              className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
            >
              คลังรับสินค้าครบ & ปิดงาน
            </button>
          ) : null}
        </div>

        {message ? (
          <div className={`px-3.5 py-2 rounded-md text-sm border ${message.type === "ok" ? "bg-[#eef7f5] border-[#a7d7ca] text-[#0f5c4d]" : "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]"}`}>
            {message.text}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {[...LOGISTIC_STATUS_ORDER, "ISSUE_REPORTED" as LogisticStatus].map((st) => (
            <button
              key={st}
              type="button"
              disabled={!canEdit}
              onClick={() => setLogisticStatus(st)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border ${
                logisticStatus === st
                  ? st === "ISSUE_REPORTED"
                    ? "bg-[#b91c1c] border-[#b91c1c] text-white"
                    : "bg-[#0f5c4d] border-[#0f5c4d] text-white"
                  : "bg-[#fafbfc] border-[#d9dee3] text-[#1f2933] hover:border-[#0f5c4d]"
              }`}
            >
              {LOGISTIC_STATUS_LABELS[st]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">รูปแบบขนส่ง</span>
            <select value={shippingMode} disabled={!canEdit} onChange={(e) => setShippingMode(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 bg-white text-[#1f2933] disabled:bg-[#f5f7f9]">
              <option value="SEA_FCL">ทางเรือ (Sea FCL)</option>
              <option value="SEA_LCL">ทางเรือ (Sea LCL)</option>
              <option value="AIR">ทางอากาศ (Air Freight)</option>
              <option value="TRUCK">ทางรถ (Cross-Border Truck)</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">Forwarder / สายเรือ</span>
            <input value={forwarderName} disabled={!canEdit} onChange={(e) => setForwarderName(e.target.value)} placeholder="เช่น COSCO / K-Line / Freight Forwarder" className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">เลข B/L หรือ AWB</span>
            <input value={blOrAwbNumber} disabled={!canEdit} onChange={(e) => setBlOrAwbNumber(e.target.value)} placeholder="เช่น COSU6348192010" className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">หมายเลขตู้คอนเทนเนอร์</span>
            <input value={containerNumber} disabled={!canEdit} onChange={(e) => setContainerNumber(e.target.value)} placeholder="เช่น CBHU8921045" className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">ETD (วันออกจากจีน)</span>
            <input type="date" value={etd} disabled={!canEdit} onChange={(e) => setEtd(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">ETA (วันถึงไทย)</span>
            <input type="date" value={eta} disabled={!canEdit} onChange={(e) => setEta(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-xs font-semibold text-[#5f6b76]">หมายเหตุคลังสินค้า / แจ้งปัญหา (Shortage / Damage Claim)</span>
          <textarea rows={2} value={whIssueNote} disabled={!canEdit} onChange={(e) => setWhIssueNote(e.target.value)} placeholder="ระบุรายละเอียดหากพบปัญหาตอนตรวจรับที่คลัง..." className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
        </label>

        {canEdit ? (
          <div className="flex justify-end">
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50">
              {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล Logistic"}
            </button>
          </div>
        ) : null}
      </form>

      <StageDocumentsCard
        caseId={data.id}
        stage="LOGISTIC"
        title="ชุดเอกสารนำเข้า & พิธีการศุลกากร (Shipping Docs)"
        allowedDocTypes={[...REQUIRED_LOGISTIC_DOCS, "OTHER"]}
        requiredDocTypes={REQUIRED_LOGISTIC_DOCS}
        documents={data.documents}
        canUpload={canEdit}
        onRefresh={onRefresh}
      />
    </div>
  );
}
