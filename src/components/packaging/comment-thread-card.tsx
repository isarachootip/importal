"use client";

import { useState } from "react";
import { ROLE_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateTimeTh } from "@/lib/utils/date-th";
import type { CommentDto } from "./case-detail-types";

interface Props {
  jobId: string;
  draftLabel: string;
  comments: CommentDto[];
  selectedArtworkId: string | null;
  pendingPin: { x: number; y: number } | null;
  onClearPin: () => void;
  onRefresh: () => void;
}

export function CommentThreadCard({
  jobId,
  draftLabel,
  comments,
  selectedArtworkId,
  pendingPin,
  onClearPin,
  onRefresh,
}: Props) {
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postComment() {
    if (!commentBody.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/packaging/${jobId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentBody.trim(),
          artworkVersionId: selectedArtworkId,
          pinX: pendingPin?.x ?? null,
          pinY: pendingPin?.y ?? null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "ส่งคอมเมนต์ไม่สำเร็จ");
      setCommentBody("");
      onClearPin();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งคอมเมนต์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white border border-[#d9dee3] rounded-md p-5 flex flex-col gap-3">
      <h3 className="text-[17px] font-bold text-[#1f2933]">คอมเมนต์ {draftLabel}</h3>

      {error ? (
        <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-1.5 text-xs text-[#b91c1c]">{error}</div>
      ) : null}

      <div className="divide-y divide-[#e5e9ed] max-h-[280px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-[#5f6b76] py-3">ยังไม่มีคอมเมนต์สำหรับงานนี้</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="py-2.5">
              <div className="text-xs text-[#5f6b76] flex items-center gap-1.5 flex-wrap">
                <strong className="text-[#1f2933]">{ROLE_LABELS[c.authorRole]}</strong>
                <span>· {c.author.nickname ?? c.author.thaiName}</span>
                <span>{formatDateTimeTh(c.createdAt)}</span>
                {c.pinNumber !== null ? (
                  <span className="px-1.5 py-0.5 rounded bg-[#e6f2ef] text-[#0f5c4d] font-bold">
                    หมุด #{c.pinNumber}
                  </span>
                ) : null}
              </div>
              <p className="text-[15px] text-[#1f2933] mt-0.5 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-[#e5e9ed] space-y-2">
        {pendingPin ? (
          <div className="flex items-center justify-between text-xs bg-[#eff6ff] text-[#1d4ed8] px-2.5 py-1.5 rounded">
            <span>ปักหมุดพิกัด ({pendingPin.x}%, {pendingPin.y}%) บน Artwork</span>
            <button type="button" onClick={onClearPin} className="underline font-semibold">
              ยกเลิกหมุด
            </button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <input
            type="text"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="พิมพ์คอมเมนต์หรือจุดที่ต้องแก้ไข..."
            className="flex-1 rounded-md border border-[#c7ced5] px-3 py-2 text-sm text-[#1f2933] focus:outline-none focus:border-[#0f5c4d]"
          />
          <button
            type="button"
            disabled={busy || !commentBody.trim()}
            onClick={postComment}
            className="px-3.5 py-2 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933] disabled:opacity-50"
          >
            ส่ง
          </button>
        </div>
      </div>
    </section>
  );
}
