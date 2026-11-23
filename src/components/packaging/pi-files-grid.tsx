"use client";

import { useState } from "react";
import type { PiFileSlot } from "@prisma/client";
import { Download, ExternalLink, Upload } from "lucide-react";
import { PI_FILE_SLOTS } from "@/lib/domain/packaging-labels";
import { formatDateTimeTh } from "@/lib/utils/date-th";
import type { PiFileDto } from "./case-detail-types";

interface Props {
  jobId: string;
  piFiles: PiFileDto[];
  canUpload: boolean;
  onRefresh: () => void;
}

export function PiFilesGrid({ jobId, piFiles, canUpload, onRefresh }: Props) {
  const [uploadingSlot, setUploadingSlot] = useState<PiFileSlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(slot: PiFileSlot, file: File | null) {
    if (!file) return;
    setUploadingSlot(slot);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("slot", slot);
      fd.set("file", file);
      const res = await fetch(`/api/packaging/${jobId}/files`, { method: "POST", body: fd });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "อัปโหลดไฟล์ไม่สำเร็จ");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ");
    } finally {
      setUploadingSlot(null);
    }
  }

  return (
    <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[17px] font-bold text-[#1f2933]">ไฟล์ข้อมูล PI ส่งฝ่าย Graphic (6 ช่อง)</h3>
          <p className="text-xs text-[#5f6b76]">รองรับการอัปโหลดซ้ำเพื่อเก็บ Version อัตโนมัติ (สูงสุด 25 MB/ไฟล์)</p>
        </div>
        {piFiles.length > 0 ? (
          <a
            href={`/api/packaging/${jobId}/files/download-all`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933]"
          >
            <Download className="w-4 h-4 text-[#0f5c4d]" /> All Download (.zip)
          </a>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-2 text-xs text-[#b91c1c]">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PI_FILE_SLOTS.map((slotDef) => {
          const versions = piFiles.filter((f) => f.slot === slotDef.slot);
          const latest = versions[0] ?? null;
          const isBusy = uploadingSlot === slotDef.slot;

          return (
            <div key={slotDef.slot} className="border border-[#d9dee3] rounded-md p-3.5 bg-[#fafbfc] flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-[#1f2933]">{slotDef.labelTh}</div>
                  {latest ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f2ef] text-[#0f5c4d] shrink-0">
                      v{latest.version}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eef1f4] text-[#5f6b76] shrink-0">
                      ยังไม่แนบ
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5f6b76] mt-0.5">{slotDef.hint}</p>

                {latest ? (
                  <div className="mt-2 pt-2 border-t border-[#e5e9ed] text-xs space-y-1">
                    <div className="font-semibold text-[#1f2933] truncate" title={latest.fileName}>
                      {latest.fileName}
                    </div>
                    <div className="text-[#5f6b76]">
                      {(latest.sizeBytes / 1024).toFixed(1)} KB · {formatDateTimeTh(latest.createdAt)}
                    </div>
                    <div className="flex items-center gap-3 pt-0.5">
                      <a
                        href={`/api/files/pi/${latest.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#0f5c4d] hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" /> ดูไฟล์
                      </a>
                      <a
                        href={`/api/files/pi/${latest.id}?download=1`}
                        className="inline-flex items-center gap-1 text-[#5f6b76] hover:text-[#1f2933] font-semibold"
                      >
                        <Download className="w-3 h-3" /> ดาวน์โหลด
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>

              {canUpload ? (
                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-xs font-semibold text-[#1f2933] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#0f5c4d]" />
                  {isBusy ? "กำลังอัปโหลด..." : latest ? "อัปโหลดเวอร์ชันใหม่" : "เลือกไฟล์อัปโหลด"}
                  <input
                    type="file"
                    accept={slotDef.accept}
                    disabled={isBusy}
                    className="hidden"
                    onChange={(e) => handleUpload(slotDef.slot, e.target.files?.[0] ?? null)}
                  />
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
