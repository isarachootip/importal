"use client";

import { useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { formatDateTimeTh } from "@/lib/utils/date-th";
import type { ArtworkDto } from "./case-detail-types";

interface Props {
  jobId: string;
  finalArt: ArtworkDto | null;
  canUploadFinal: boolean;
  onRefresh: () => void;
}

export function FinalFileUploadCard({ jobId, finalArt, canUploadFinal, onRefresh }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadAndCompleteFinal(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("stageKind", "FINAL_FILE");
      fd.set("file", file);
      const up = await fetch(`/api/packaging/${jobId}/artworks`, { method: "POST", body: fd });
      const upJson = (await up.json()) as { error?: string };
      if (!up.ok) throw new Error(upJson.error ?? "อัปโหลด Final File ไม่สำเร็จ");

      const tr = await fetch(`/api/packaging/${jobId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "UPLOAD_FINAL_FILE" }),
      });
      const trJson = (await tr.json()) as { error?: string };
      if (!tr.ok) throw new Error(trJson.error ?? "ปิดงาน Packaging ไม่สำเร็จ");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลด Final File ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-2">
      {error ? (
        <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-2 text-xs text-[#b91c1c]">{error}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-[16px] font-bold text-[#1f2933]">Final File สำหรับส่งโรงงาน</h4>
          <p className="text-xs text-[#5f6b76]">
            {finalArt
              ? `อัปโหลดแล้ว: ${finalArt.fileName} (${formatDateTimeTh(finalArt.createdAt)})`
              : "เมื่ออนุมัติ Final ครบแล้ว ฝ่าย Graphic อัปโหลด Final File (AI/PDF) เพื่อส่งต่อขั้น Purchase Order"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {finalArt ? (
            <a
              href={`/api/files/artwork/${finalArt.id}?download=1`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#c7ced5] text-sm font-semibold text-[#1f2933] hover:bg-[#f5f7f9]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#0f5c4d]" /> ดาวน์โหลด Final File
            </a>
          ) : null}
          {canUploadFinal ? (
            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold cursor-pointer">
              <Upload className="w-4 h-4" />
              {busy ? "กำลังอัปโหลด..." : "อัปโหลด Final File & ปิดงาน Packaging"}
              <input
                type="file"
                className="hidden"
                disabled={busy}
                onChange={(e) => uploadAndCompleteFinal(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : null}
        </div>
      </div>
    </section>
  );
}
