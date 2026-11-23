"use client";

import { useState } from "react";
import type { CaseDocType, ImportStage } from "@prisma/client";
import { CheckCircle2, Download, ExternalLink, Upload } from "lucide-react";
import type { CaseDocumentDto } from "@/components/packaging/case-detail-types";
import { CASE_DOC_TYPE_LABELS } from "@/lib/domain/lifecycle-labels";
import { formatDateTimeTh } from "@/lib/utils/date-th";

interface Props {
  caseId: string;
  stage: ImportStage;
  title: string;
  allowedDocTypes: readonly CaseDocType[];
  requiredDocTypes?: readonly CaseDocType[];
  documents: CaseDocumentDto[];
  canUpload: boolean;
  onRefresh: () => void;
}

export function StageDocumentsCard({
  caseId,
  stage,
  title,
  allowedDocTypes,
  requiredDocTypes = [],
  documents,
  canUpload,
  onRefresh,
}: Props) {
  const [docType, setDocType] = useState<CaseDocType>(allowedDocTypes[0] ?? "OTHER");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageDocs = documents.filter((d) => d.stage === stage);
  const uploadedTypes = new Set(stageDocs.map((d) => d.docType));

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("stage", stage);
      fd.set("docType", docType);
      fd.set("file", file);
      const res = await fetch(`/api/cases/${caseId}/documents`, { method: "POST", body: fd });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "อัปโหลดเอกสารไม่สำเร็จ");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดเอกสารไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[16px] font-bold text-[#1f2933]">{title}</h3>
        {canUpload ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as CaseDocType)}
              className="text-xs border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]"
            >
              {allowedDocTypes.map((dt) => (
                <option key={dt} value={dt}>
                  {CASE_DOC_TYPE_LABELS[dt]}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-xs font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "กำลังอัปโหลด..." : "แนบเอกสาร"}
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-1.5 text-xs text-[#b91c1c]">{error}</div>
      ) : null}

      {requiredDocTypes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {requiredDocTypes.map((req) => {
            const ok = uploadedTypes.has(req);
            return (
              <span
                key={req}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                  ok ? "bg-[#e6f2ef] text-[#0f5c4d]" : "bg-[#f5f7f9] text-[#5f6b76]"
                }`}
              >
                {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                {CASE_DOC_TYPE_LABELS[req]}
              </span>
            );
          })}
        </div>
      ) : null}

      {stageDocs.length === 0 ? (
        <p className="text-sm text-[#5f6b76]">ยังไม่มีเอกสารแนบในขั้นตอนนี้</p>
      ) : (
        <ul className="divide-y divide-[#e5e9ed]">
          {stageDocs.map((doc) => (
            <li key={doc.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#eef1f4] text-[#1f2933]">
                    {CASE_DOC_TYPE_LABELS[doc.docType]}
                  </span>
                  <span className="font-semibold text-[#1f2933]">{doc.fileName}</span>
                </div>
                <div className="text-xs text-[#5f6b76] mt-0.5">
                  {(doc.sizeBytes / 1024).toFixed(1)} KB · โดย {doc.uploadedBy.nickname ?? doc.uploadedBy.thaiName} ·{" "}
                  {formatDateTimeTh(doc.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <a href={`/api/files/doc/${doc.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#0f5c4d] hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> เปิดดู
                </a>
                <a href={`/api/files/doc/${doc.id}?download=1`} className="inline-flex items-center gap-1 text-[#5f6b76] hover:text-[#1f2933]">
                  <Download className="w-3.5 h-3.5" /> ดาวน์โหลด
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
