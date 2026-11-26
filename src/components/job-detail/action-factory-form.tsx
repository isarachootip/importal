"use client";

import React, { useState } from "react";
import { SaveDraftButton } from "@/components/ui/status-badges";
import type { DraftData, JobRecord, JobSkuEntry } from "@/lib/domain/job-types";
import { ProductionAndGrStatusView, SkuListTable } from "./sku-list-and-gr-status";

export function ActionFactoryAndGrView({
  job,
  mode,
  holidays,
  draft,
  busy,
  showToast,
  onSaveDraft,
  onSubmitFactory,
  onTriggerGrSync,
}: {
  job: JobRecord;
  mode: "Send to Factory" | "In Production" | "Goods Received";
  holidays: ReadonlySet<string>;
  draft: DraftData | undefined;
  busy: boolean;
  showToast: (msg: string) => void;
  onSaveDraft: (values: Record<string, string | boolean>, fileNames: string[]) => void;
  onSubmitFactory: (payload: {
    leadtime: number;
    poNumber: string;
    skuFileName: string;
    skuStorageKey: string | null;
    skus: JobSkuEntry[];
    note: string;
  }) => void;
  onTriggerGrSync: () => void;
}) {
  const [sentChecked, setSentChecked] = useState(() => draft?.v.sentChecked !== false);
  const [leadtime, setLeadtime] = useState<number>(() => (draft?.v.leadtime ? Number(draft.v.leadtime) || 55 : 55));
  const [poNumber, setPoNumber] = useState<string>(() => (typeof draft?.v.poNumber === "string" ? draft.v.poNumber : job.poNumber ?? ""));
  const [note, setNote] = useState<string>(() => (typeof draft?.v.note === "string" ? draft.v.note : ""));
  const [skuDraft, setSkuDraft] = useState<{ file: string; storageKey: string | null; list: JobSkuEntry[]; warn: string[] } | null>(null);

  if (mode === "Goods Received" || mode === "In Production") {
    return <ProductionAndGrStatusView job={job} mode={mode} holidays={holidays} busy={busy} onTriggerGrSync={onTriggerGrSync} />;
  }

  async function handleSkuUpload(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("piDate", job.piDate);
    const res = await fetch("/api/jobs/sku-template", { method: "POST", body: fd });
    const data = (await res.json()) as { file?: string; storageKey?: string | null; list?: JobSkuEntry[]; warn?: string[]; error?: string };
    if (!res.ok || !data.list) {
      showToast(data.error ?? "อ่านไฟล์ไม่ได้ · กรุณาใช้แบบฟอร์มที่ดาวน์โหลด");
      return;
    }
    setSkuDraft({ file: data.file ?? file.name, storageKey: data.storageKey ?? null, list: data.list, warn: data.warn ?? [] });
    showToast(data.list.length > 0 ? `อ่านได้ ${data.list.length} SKU · ดึงวันที่สร้าง SKU จาก MMS แล้ว` : "ไม่พบเลข SKU ใน Column A");
  }

  async function handleUseDemoSku() {
    const res = await fetch("/api/jobs/sku-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "demo", pi: job.pi, items: job.items, piDate: job.piDate }),
    });
    const data = (await res.json()) as { file: string; storageKey: string | null; list: JobSkuEntry[]; warn: string[] };
    setSkuDraft(data);
    showToast(`อ่านได้ ${data.list.length} SKU · ดึงวันที่สร้าง SKU จาก MMS แล้ว`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label className="fld" style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400 }}>
        <input type="checkbox" checked={sentChecked} onChange={(e) => setSentChecked(e.target.checked)} />
        ส่ง Final AW ให้โรงงานแล้ว
      </label>

      <div className="form">
        <label className="fld">
          Production Leadtime (วัน)
          <input type="number" min={1} step={1} value={leadtime} onChange={(e) => setLeadtime(Math.max(1, Number(e.target.value) || 1))} />
        </label>
        <label className="fld">
          <span>PO Number <small>(ไม่บังคับ · อ้างอิงตาม Flow)</small></span>
          <input placeholder="เช่น PO-2026-001" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
        </label>
      </div>

      <div className="fld">
        <span>SKU number</span>
        <div className="drop" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <a href={`/api/jobs/sku-template?pi=${encodeURIComponent(job.pi)}`} className="btn sm" onClick={() => showToast("กำลังดาวน์โหลดแบบฟอร์ม · กรอกเลข SKU ใน Column A เท่านั้น")}>
              ดาวน์โหลดแบบฟอร์ม Excel
            </a>
            <span className="hint">กรอกเลข SKU ใน <b>Column A เท่านั้น</b> (แถวแรกเป็นหัว &quot;SKU&quot;)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <input type="file" accept=".xlsx,.csv" aria-label="Upload SKU number" onChange={(e) => void handleSkuUpload(e.target.files?.[0])} />
            <button type="button" className="btn sm" onClick={() => void handleUseDemoSku()}>ใช้ SKU ตัวอย่าง (Demo)</button>
          </div>
        </div>
      </div>

      {skuDraft && (
        <>
          <div className="info">
            <b>{skuDraft.file}</b> · อ่านได้ {skuDraft.list.length} SKU · ดึงวันที่สร้าง SKU จาก MMS แล้ว <span className="hint">(จำลอง)</span>
            {skuDraft.warn.length > 0 && <div style={{ color: "var(--org-d)", marginTop: 4 }}>{skuDraft.warn.join(" · ")}</div>}
          </div>
          {skuDraft.list.length > 0 && <SkuListTable list={skuDraft.list} showGr={false} />}
        </>
      )}

      <label className="fld">หมายเหตุ<textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <SaveDraftButton onClick={() => onSaveDraft({ sentChecked, leadtime: String(leadtime), poNumber, note }, skuDraft ? [skuDraft.file] : [])} />
        <button
          type="button"
          className="btn pri"
          disabled={busy}
          onClick={() => {
            if (!skuDraft || skuDraft.list.length === 0) {
              showToast("กรุณา Upload SKU number (ดาวน์โหลดแบบฟอร์ม แล้วกรอกเลข SKU ใน Column A)");
              return;
            }
            onSubmitFactory({ leadtime, poNumber, skuFileName: skuDraft.file, skuStorageKey: skuDraft.storageKey, skus: skuDraft.list, note });
          }}
        >
          บันทึก
        </button>
      </div>
    </div>
  );
}
