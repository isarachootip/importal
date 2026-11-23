"use client";

import { useState } from "react";
import type { RoleCode } from "@prisma/client";
import { PiChecklistCard } from "./pi-checklist-card";
import { PiFilesGrid } from "./pi-files-grid";
import type { CaseDetailDto, MasterOptionsDto } from "./case-detail-types";

interface Props {
  data: CaseDetailDto;
  master: MasterOptionsDto;
  userRoles: readonly RoleCode[];
  onRefresh: () => void;
}

export function PiRegistrationPanel({ data, master, userRoles, onRefresh }: Props) {
  const job = data.packaging;
  const canEdit = userRoles.includes("IMPORT") || userRoles.includes("ADMIN");

  const [piNumber, setPiNumber] = useState(job?.piNumber ?? "");
  const [piDate, setPiDate] = useState(job?.piDate.slice(0, 10) ?? "");
  const [skuCount, setSkuCount] = useState(job?.skuCount ?? 1);
  const [caseConfigId, setCaseConfigId] = useState(job?.caseConfigId ?? "");
  const [isMinorChange, setIsMinorChange] = useState(job?.isMinorChange ?? false);
  const [flags, setFlags] = useState({
    isNewPhoto: data.isNewPhoto,
    requiresTisi: data.requiresTisi,
    requiresFda: data.requiresFda,
    isTileImport: data.isTileImport,
    isNewBrandOrLogo: data.isNewBrandOrLogo,
  });
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(job?.packagingTypeIds ?? []);

  const importChecklistItems = master.checklists.filter((c) => c.category === "IMPORT_PRE_SUBMIT");
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const ans of job?.checklistAnswers ?? []) map[ans.checklistItemId] = ans.checked;
    return map;
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  if (!job) return null;

  const toggleType = (id: string) =>
    setSelectedTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function savePi() {
    if (!job) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/packaging/${job.id}/pi`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piNumber,
          piDate,
          skuCount: Number(skuCount),
          caseConfigId,
          isMinorChange,
          ...flags,
          packagingTypeIds: selectedTypeIds,
          checklistAnswers: importChecklistItems.map((item) => ({
            checklistItemId: item.id,
            checked: Boolean(checkedMap[item.id]),
          })),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกข้อมูล PI ไม่สำเร็จ");
      setMessage({ type: "ok", text: "บันทึกข้อมูล PI และคำนวณแผนวันทำงานใหม่เรียบร้อยแล้ว" });
      onRefresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" });
    } finally {
      setBusy(false);
    }
  }

  async function submitToPreQc() {
    if (!job) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/packaging/${job.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SUBMIT_PI" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "ส่งงานไป Pre QC ไม่สำเร็จ");
      setMessage({ type: "ok", text: "ส่งข้อมูล PI ให้ฝ่าย Graphic Pre QC เรียบร้อยแล้ว" });
      onRefresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "ส่งงานไม่สำเร็จ" });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[17px] font-bold text-[#1f2933]">ข้อมูล PI & ประเภทงานออกแบบ</h3>
          {canEdit ? (
            <button
              type="button"
              disabled={busy}
              onClick={savePi}
              className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล & คำนวณแผน"}
            </button>
          ) : null}
        </div>

        {message ? (
          <div
            className={`px-3.5 py-2 rounded-md text-sm border ${
              message.type === "ok"
                ? "bg-[#eef7f5] border-[#a7d7ca] text-[#0f5c4d]"
                : "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">เลขที่ PI</span>
            <input type="text" value={piNumber} disabled={!canEdit} onChange={(e) => setPiNumber(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">วันที่ PI (วันเริ่มนับแผน)</span>
            <input type="date" value={piDate} disabled={!canEdit} onChange={(e) => setPiDate(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">ประเภทงาน (Case 1–6)</span>
            <select value={caseConfigId} disabled={!canEdit} onChange={(e) => setCaseConfigId(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] bg-white disabled:bg-[#f5f7f9]">
              {master.caseConfigs.map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  Case {cfg.caseNumber}: {cfg.name} ({cfg.infoDays}+{cfg.designDays} วัน)
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-[#5f6b76]">จำนวน SKU</span>
            <input type="number" min={1} value={skuCount} disabled={!canEdit} onChange={(e) => setSkuCount(Number(e.target.value))} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933] disabled:bg-[#f5f7f9]" />
          </label>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#1f2933]">
          <label className="inline-flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={flags.isNewPhoto} onChange={(e) => setFlags((f) => ({ ...f, isNewPhoto: e.target.checked }))} className="accent-[#0f5c4d]" /> ถ่ายรูปสินค้าใหม่ (+7 วัน)</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={isMinorChange} onChange={(e) => setIsMinorChange(e.target.checked)} className="accent-[#0f5c4d]" /> Repeat Order / Minor Change (ข้าม EVP)</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={flags.requiresTisi} onChange={(e) => setFlags((f) => ({ ...f, requiresTisi: e.target.checked }))} className="accent-[#0f5c4d]" /> ขอ มอก./TISI</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={flags.requiresFda} onChange={(e) => setFlags((f) => ({ ...f, requiresFda: e.target.checked }))} className="accent-[#0f5c4d]" /> ขอ อย.</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={flags.isTileImport} onChange={(e) => setFlags((f) => ({ ...f, isTileImport: e.target.checked }))} className="accent-[#0f5c4d]" /> กระเบื้อง (อินเดีย/จีน)</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={flags.isNewBrandOrLogo} onChange={(e) => setFlags((f) => ({ ...f, isNewBrandOrLogo: e.target.checked }))} className="accent-[#0f5c4d]" /> New Brand / Logo</label>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-[#5f6b76]">รูปแบบ Packaging (เลือกได้หลายรายการ)</div>
          <div className="flex flex-wrap gap-1.5">
            {master.packagingTypes.map((pt) => {
              const active = selectedTypeIds.includes(pt.id);
              return (
                <button
                  key={pt.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => toggleType(pt.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                    active ? "bg-[#0f5c4d] border-[#0f5c4d] text-white" : "bg-white border-[#c7ced5] text-[#1f2933] hover:bg-[#f5f7f9]"
                  }`}
                >
                  {pt.nameTh}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <PiFilesGrid jobId={job.id} piFiles={job.piFiles} canUpload={canEdit} onRefresh={onRefresh} />

      <PiChecklistCard
        items={importChecklistItems}
        checkedMap={checkedMap}
        canEdit={canEdit}
        canSubmit={canEdit && job.currentStep === "INFO"}
        busy={busy}
        onToggle={(id, checked) => setCheckedMap((m) => ({ ...m, [id]: checked }))}
        onSubmitToPreQc={submitToPreQc}
      />
    </div>
  );
}
