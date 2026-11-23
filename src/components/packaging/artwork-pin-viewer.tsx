"use client";

import { useState, type MouseEvent } from "react";
import type { ArtworkStageKind } from "@prisma/client";
import { Download, ExternalLink, MapPin, Upload } from "lucide-react";
import { ARTWORK_STAGE_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateTimeTh } from "@/lib/utils/date-th";
import type { ArtworkDto, CommentDto } from "./case-detail-types";

interface Props {
  jobId: string;
  artworks: ArtworkDto[];
  comments: CommentDto[];
  selectedArtworkId: string | null;
  onSelectArtwork: (id: string) => void;
  pendingPin: { x: number; y: number } | null;
  onPickPin: (pin: { x: number; y: number } | null) => void;
  canUploadArtwork: boolean;
  defaultUploadStage: ArtworkStageKind;
  onRefresh: () => void;
}

export function ArtworkPinViewer({
  jobId,
  artworks,
  comments,
  selectedArtworkId,
  onSelectArtwork,
  pendingPin,
  onPickPin,
  canUploadArtwork,
  defaultUploadStage,
  onRefresh,
}: Props) {
  const [uploadStage, setUploadStage] = useState<ArtworkStageKind>(defaultUploadStage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = artworks.find((a) => a.id === selectedArtworkId) ?? artworks[0] ?? null;
  const activePins = comments.filter(
    (c) => c.artworkVersionId === active?.id && c.pinNumber !== null && c.pinX !== null && c.pinY !== null
  );

  function handleImageClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));
    onPickPin({ x, y });
  }

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("stageKind", uploadStage);
      fd.set("file", file);
      const res = await fetch(`/api/packaging/${jobId}/artworks`, { method: "POST", body: fd });
      const json = (await res.json()) as { error?: string; artwork?: { id: string } };
      if (!res.ok) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      if (json.artwork?.id) onSelectArtwork(json.artwork.id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  const isImage = active?.mimeType.startsWith("image/") ?? false;
  const isPdf = active?.mimeType === "application/pdf";
  const fileUrl = active ? `/api/files/artwork/${active.id}` : null;

  return (
    <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#d9dee3]">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[16px] font-bold text-[#1f2933]">ไฟล์ Artwork & ปักหมุดจุดแก้ไข</h3>
          {artworks.length > 0 ? (
            <select
              value={active?.id ?? ""}
              onChange={(e) => onSelectArtwork(e.target.value)}
              className="text-sm border border-[#c7ced5] rounded-md px-2.5 py-1 bg-white text-[#1f2933]"
            >
              {artworks.map((a) => (
                <option key={a.id} value={a.id}>
                  {ARTWORK_STAGE_LABELS[a.stageKind]} v{a.version} · {a.fileName}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {fileUrl ? (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#c7ced5] text-xs font-semibold text-[#1f2933] hover:bg-[#f5f7f9]"
              >
                <ExternalLink className="w-3.5 h-3.5" /> เปิดดูเต็มจอ
              </a>
              <a
                href={`${fileUrl}?download=1`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#c7ced5] text-xs font-semibold text-[#1f2933] hover:bg-[#f5f7f9]"
              >
                <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
              </a>
            </>
          ) : null}
          {canUploadArtwork ? (
            <div className="flex items-center gap-1.5">
              <select
                value={uploadStage}
                onChange={(e) => setUploadStage(e.target.value as ArtworkStageKind)}
                className="text-xs border border-[#c7ced5] rounded-md px-2 py-1.5 bg-white text-[#1f2933]"
              >
                {(Object.keys(ARTWORK_STAGE_LABELS) as ArtworkStageKind[]).map((k) => (
                  <option key={k} value={k}>
                    {ARTWORK_STAGE_LABELS[k]}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลด Artwork"}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.ai,.zip"
                  disabled={uploading}
                  onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <div className="px-5 py-2 text-xs text-[#b91c1c] bg-[#fef2f2]">{error}</div> : null}

      <div className="p-4 bg-[#f5f7f9]">
        {!active ? (
          <div className="text-center py-8 text-sm text-[#5f6b76]">
            ยังไม่มีไฟล์ Artwork อัปโหลดในระบบ (Graphic Designer สามารถอัปโหลดไฟล์ PDF / PNG / JPG ได้ด้านบน)
          </div>
        ) : isImage && fileUrl ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#5f6b76]">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0f5c4d]" />
                คลิกบนภาพเพื่อปักหมุดจุดแก้ไข ({activePins.length} หมุด)
              </span>
              <span>อัปโหลดเมื่อ {formatDateTimeTh(active.createdAt)} โดย {active.uploadedBy.nickname ?? active.uploadedBy.thaiName}</span>
            </div>
            <div
              onClick={handleImageClick}
              className="relative inline-block max-w-full cursor-crosshair border border-[#d9dee3] rounded bg-white overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={active.fileName} className="max-h-[420px] w-auto object-contain block" />
              {activePins.map((pin) => (
                <span
                  key={pin.id}
                  title={`#${pin.pinNumber}: ${pin.body}`}
                  style={{ left: `${pin.pinX}%`, top: `${pin.pinY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0f5c4d] text-white text-xs font-bold flex items-center justify-center shadow ring-2 ring-white"
                >
                  {pin.pinNumber}
                </span>
              ))}
              {pendingPin ? (
                <span
                  style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1d4ed8] text-white text-xs font-bold flex items-center justify-center shadow ring-2 ring-white animate-pulse"
                >
                  +
                </span>
              ) : null}
            </div>
          </div>
        ) : isPdf && fileUrl ? (
          <iframe src={fileUrl} title={active.fileName} className="w-full h-[420px] rounded border border-[#d9dee3] bg-white" />
        ) : (
          <div className="text-center py-6 text-sm text-[#1f2933]">
            ไฟล์ <span className="font-semibold">{active.fileName}</span> พร้อมให้ดาวน์โหลด (ไม่รองรับการแสดงตัวอย่างในเบราว์เซอร์)
          </div>
        )}
      </div>
    </section>
  );
}
