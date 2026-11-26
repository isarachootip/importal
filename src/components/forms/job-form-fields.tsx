"use client";

import React, { useMemo } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  BRANDS,
  BU_LIST,
  DESIGNER_NAMES,
  LICENSE_LIST,
  OTHER_SUPPLIER,
  PACKAGES,
  PATTERNS,
  SUPPLIERS,
} from "@/lib/domain/aw-constants";
import { SDEPT_MASTER } from "@/lib/domain/directory-import-design";
import type { JobFormValues } from "./job-form-helpers";

export {
  buildInitialFormValues,
  deserializeFormDraft,
  serializeFormDraft,
  validateAndBuildApiPayload,
  type JobFormValues,
} from "./job-form-helpers";

export function JobFormFields({
  values,
  today,
  onChange,
}: {
  values: JobFormValues;
  today: string;
  onChange: React.Dispatch<React.SetStateAction<JobFormValues>>;
}) {
  const sdeptOpts = useMemo(
    () => SDEPT_MASTER.map((s): [number, string] => [s.code, `${s.code} ${s.name} (${s.vpGroup})`]),
    []
  );
  const patOpts = useMemo(
    () => PATTERNS.map((p): [number, string] => [p.id, `${p.name} / ${p.desc}`]),
    []
  );
  const supOpts = useMemo(() => [...SUPPLIERS, OTHER_SUPPLIER], []);

  return (
    <div className="form">
      <label className="fld">
        <span>PI Number <span className="req">*</span></span>
        <input value={values.pi} placeholder="เช่น PI-2611-065" onChange={(e) => onChange((p) => ({ ...p, pi: e.target.value }))} />
      </label>

      <label className="fld">
        <span>PI approval date by EVP <span className="req">*</span></span>
        <input type="date" value={values.piDate} max={today} onChange={(e) => onChange((p) => ({ ...p, piDate: e.target.value }))} />
      </label>

      <label className="fld">
        BU
        <SearchableSelect ariaLabel="BU" value={values.bu} options={BU_LIST} onChange={(val) => onChange((p) => ({ ...p, bu: val }))} />
      </label>

      <div className="fld">
        <span>Supplier Name</span>
        <SearchableSelect ariaLabel="Supplier Name" value={values.supplierSelect} options={supOpts} onChange={(val) => onChange((p) => ({ ...p, supplierSelect: val }))} />
        {values.supplierSelect === OTHER_SUPPLIER && (
          <input aria-label="ระบุชื่อ Supplier" placeholder="ระบุชื่อร้านค้า / Supplier" value={values.supplierOther} onChange={(e) => onChange((p) => ({ ...p, supplierOther: e.target.value }))} />
        )}
      </div>

      <label className="fld">
        House Brand Name
        <SearchableSelect ariaLabel="House Brand Name" value={values.brand} options={BRANDS} onChange={(val) => onChange((p) => ({ ...p, brand: val }))} />
      </label>

      <label className="fld">
        No. of items
        <input type="number" min={1} step={1} value={values.items} onChange={(e) => onChange((p) => ({ ...p, items: Math.max(1, Number(e.target.value) || 1) }))} />
      </label>

      <label className="fld">
        <span>Sdept &amp; Sdept Name 1 <span className="req">*</span></span>
        <SearchableSelect ariaLabel="Sdept & Sdept Name 1" value={values.sd1} options={sdeptOpts} allLabel="– เลือก Sdept –" onChange={(val) => onChange((p) => ({ ...p, sd1: val }))} />
      </label>

      <label className="fld">
        Sdept &amp; Sdept Name 2
        <SearchableSelect ariaLabel="Sdept & Sdept Name 2" value={values.sd2} options={sdeptOpts} allLabel="– ไม่ระบุ –" onChange={(val) => onChange((p) => ({ ...p, sd2: val }))} />
      </label>

      <label className="fld">
        Sdept &amp; Sdept Name 3
        <SearchableSelect ariaLabel="Sdept & Sdept Name 3" value={values.sd3} options={sdeptOpts} allLabel="– ไม่ระบุ –" onChange={(val) => onChange((p) => ({ ...p, sd3: val }))} />
      </label>

      <label className="fld full">
        Type of Pattern
        <SearchableSelect ariaLabel="Type of Pattern" value={String(values.pattern)} options={patOpts} onChange={(val) => onChange((p) => ({ ...p, pattern: Number(val) || 3 }))} />
      </label>

      <label className="fld">
        Apply for a license / permit
        <select value={values.license} onChange={(e) => onChange((p) => ({ ...p, license: e.target.value }))}>
          {LICENSE_LIST.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label className="fld">
        Designer
        <SearchableSelect ariaLabel="Designer" value={values.designer} options={DESIGNER_NAMES} onChange={(val) => onChange((p) => ({ ...p, designer: val }))} />
        <small>ทีมออกแบบยืนยันอีกครั้งตอนตรวจข้อมูล</small>
      </label>

      <div className="fld">
        <span>ประชุม Brief กับ Designer <span className="req">*</span></span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontWeight: 400 }}>
          {([["Y", "Y · นัดประชุม Brief"], ["N", "N · ไม่ต้อง Brief"]] as const).map(([val, lab]) => (
            <label key={val} className="tab" style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input type="radio" name="briefChoice" checked={values.brief === val} onChange={() => onChange((p) => ({ ...p, brief: val }))} />
              {lab}
            </label>
          ))}
        </div>
        <small>N = ข้อมูลใน Folder ชัดเจนแล้ว Designer เริ่มงานได้โดยไม่ต้องนัดคุย</small>
      </div>

      <div className="fld full">
        <span>Package Design <small>(เลือกได้มากกว่า 1 ประเภท)</small></span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontWeight: 400 }}>
          {PACKAGES.map((pkg) => (
            <label key={pkg} className="tab" style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={values.packages.includes(pkg)}
                onChange={(e) => onChange((p) => ({ ...p, packages: e.target.checked ? [...p.packages, pkg] : p.packages.filter((x) => x !== pkg) }))}
              />
              {pkg}
            </label>
          ))}
        </div>
      </div>

      <div className="fld full" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <span>Link Share Folder · Data for designing Packaging <span className="req">*</span></span>
        <input type="url" value={values.folder} placeholder="https://… (ตั้งชื่อ Folder เป็นเลขที่ PI)" onChange={(e) => onChange((p) => ({ ...p, folder: e.target.value }))} />
        <small>ใน Folder ควรมี: Product information · Product&apos;s Pictures · Packaging&apos;s Size &amp; Dimension · Reference Design · Package Design · มอก. · Shipping Mark</small>
      </div>
    </div>
  );
}
