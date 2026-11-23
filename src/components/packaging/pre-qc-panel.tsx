"use client";

import { useState } from "react";
import type { RoleCode } from "@prisma/client";
import { Download } from "lucide-react";
import { PI_FILE_SLOTS } from "@/lib/domain/packaging-labels";
import { formatDateTimeTh } from "@/lib/utils/date-th";
import type { ChecklistItemDto, PackagingJobDto } from "./case-detail-types";

interface Props {
  job: PackagingJobDto;
  preQcReasons: ChecklistItemDto[];
  userRoles: readonly RoleCode[];
  onRefresh: () => void;
}

export function PreQcPanel({ job, preQcReasons, userRoles, onRefresh }: Props) {
  const canReview = (userRoles.includes("GD") || userRoles.includes("ADMIN")) && job.currentStep === "PRE_QC";
  const [failedCodes, setFailedCodes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonLabelMap = new Map(preQcReasons.map((r) => [r.code, r.labelTh]));

  function toggleReason(code: string) {
    setFailedCodes((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  }

  async function submitPreQc(decision: "PRE_QC_ACCEPT" | "PRE_QC_REJECT") {
    setBusy(true);
    setError(null);
    try {
      const payload =
        decision === "PRE_QC_ACCEPT"
          ? { type: "PRE_QC_ACCEPT", note: note.trim() || undefined }
          : { type: "PRE_QC_REJECT", failedCodes, reason: note.trim() || undefined };
      const res = await fetch(`/api/packaging/${job.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกผล Pre QC ไม่สำเร็จ");
      setFailedCodes([]);
      setNote("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกผล Pre QC ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const uploadedSlotCount = new Set(job.piFiles.map((f) => f.slot)).size;

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-bold text-[#1f2933]">Graphic Pre QC — ตรวจรับข้อมูลก่อนเริ่มออกแบบ</h3>
            <p className="text-xs text-[#5f6b76]">
              ไฟล์แนบแล้ว {uploadedSlotCount}/{PI_FILE_SLOTS.length} ช่อง · ประวัติการตีกลับทั้งหมด {job.preQcRejectCount} ครั้ง
            </p>
          </div>
          {job.piFiles.length > 0 ? (
            <a
              href={`/api/packaging/${job.id}/files/download-all`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold"
            >
              <Download className="w-4 h-4" /> All Download (.zip)
            </a>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-2 text-xs text-[#b91c1c]">{error}</div>
        ) : null}

        {canReview ? (
          <div className="border-t border-[#e5e9ed] pt-4 space-y-3">
            <div className="text-sm font-semibold text-[#1f2933]">เลือกหัวข้อที่ไม่ครบ/ไม่ผ่าน (กรณีต้องการ Reject กลับ Import)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {preQcReasons.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-md border border-[#e5e9ed] hover:bg-[#fafbfc] cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={failedCodes.includes(item.code)}
                    onChange={() => toggleReason(item.code)}
                    className="mt-0.5 accent-[#b91c1c]"
                  />
                  <span className="text-[#1f2933]">{item.labelTh}</span>
                </label>
              ))}
            </div>

            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติมสำหรับ Import / ทีมออกแบบ..."
              className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-sm text-[#1f2933] focus:outline-none focus:border-[#0f5c4d]"
            />

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy || (failedCodes.length === 0 && !note.trim())}
                onClick={() => submitPreQc("PRE_QC_REJECT")}
                className="px-4 py-2 rounded-md border border-[#dc2626] text-[#b91c1c] bg-white hover:bg-[#fef2f2] text-sm font-semibold disabled:opacity-50"
              >
                Reject ตีกลับให้ Import แก้ไข
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => submitPreQc("PRE_QC_ACCEPT")}
                className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
              >
                Submit รับงานเข้าออกแบบ
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-[#f5f7f9] border border-[#e5e9ed] px-4 py-3 text-sm text-[#5f6b76]">
            {job.currentStep === "PRE_QC"
              ? "งานนี้อยู่ในคิว Graphic Pre QC (เฉพาะบทบาท GD หรือ ADMIN จึงจะกดอนุมัติ/ตีกลับได้)"
              : "งานนี้ไม่ได้อยู่ในขั้น PRE_QC ในขณะนี้"}
          </div>
        )}
      </section>

      <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-[#d9dee3]">
          <h4 className="text-[15px] font-bold text-[#1f2933]">ประวัติ Graphic Pre QC ({job.preQcReviews.length} รอบ)</h4>
        </div>
        {job.preQcReviews.length === 0 ? (
          <div className="p-5 text-sm text-[#5f6b76]">ยังไม่มีประวัติการตรวจ Pre QC</div>
        ) : (
          <div className="divide-y divide-[#e5e9ed]">
            {job.preQcReviews.map((rev) => (
              <div key={rev.id} className="px-5 py-3 text-sm flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1f2933]">รอบที่ {rev.round}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        rev.decision === "SUBMITTED"
                          ? "bg-[#e6f2ef] text-[#0f5c4d]"
                          : "bg-[#fef2f2] text-[#b91c1c]"
                      }`}
                    >
                      {rev.decision === "SUBMITTED" ? "ผ่าน — รับงานแล้ว" : "Reject ตีกลับ"}
                    </span>
                  </div>
                  <span className="text-xs text-[#5f6b76]">
                    โดย {rev.reviewer.nickname ?? rev.reviewer.thaiName} · {formatDateTimeTh(rev.createdAt)}
                  </span>
                </div>
                {rev.failedCodes.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-[#b91c1c]">
                    {rev.failedCodes.map((code) => (
                      <li key={code}>{reasonLabelMap.get(code) ?? code}</li>
                    ))}
                  </ul>
                ) : null}
                {rev.note ? <p className="text-xs text-[#5f6b76]">หมายเหตุ: {rev.note}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
