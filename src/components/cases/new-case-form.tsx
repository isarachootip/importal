"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CaseFlagsPicker, type CaseFlagsState } from "./case-flags-picker";

interface BrandOption {
  id: string;
  name: string;
  groupName: string;
  ownerLabel: string;
}

interface Props {
  brands: BrandOption[];
  caseConfigs: Array<{ id: string; caseNumber: number; name: string; infoDays: number; designDays: number }>;
  packagingTypes: Array<{ id: string; nameTh: string }>;
  subclasses: Array<{ id: string; code: string; nameTh: string }>;
  vendors: Array<{ id: string; name: string }>;
}

export function NewCaseForm({ brands, caseConfigs, packagingTypes, subclasses, vendors }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [productTitle, setProductTitle] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [subclassId, setSubclassId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [piNumber, setPiNumber] = useState("");
  const [piDate, setPiDate] = useState(today);
  const [skuCount, setSkuCount] = useState(1);
  const [caseConfigId, setCaseConfigId] = useState(caseConfigs[1]?.id ?? caseConfigs[0]?.id ?? "");
  const [packagingTypeIds, setPackagingTypeIds] = useState<string[]>(
    packagingTypes[0] ? [packagingTypes[0].id] : []
  );
  const [flags, setFlags] = useState<CaseFlagsState>({
    isNewPhoto: false,
    isMinorChange: false,
    requiresTisi: false,
    requiresFda: false,
    isTileImport: false,
    isNewBrandOrLogo: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBrand = brands.find((b) => b.id === brandId);

  function togglePkgType(id: string) {
    setPackagingTypeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle,
          brandId,
          subclassId: subclassId || null,
          vendorId: vendorId || null,
          piNumber,
          piDate,
          skuCount: Number(skuCount),
          caseConfigId,
          packagingTypeIds,
          ...flags,
        }),
      });
      const json = (await res.json()) as { error?: string; importCase?: { caseCode: string } };
      if (!res.ok) throw new Error(json.error ?? "สร้าง Case ไม่สำเร็จ");
      router.push(`/cases/${json.importCase?.caseCode ?? ""}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้าง Case ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#d9dee3] rounded-md p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-[#1f2933]">สร้าง Import Case & ลงทะเบียน PI ใหม่</h1>
        <p className="text-sm text-[#5f6b76] mt-0.5">
          ระบบจะผูกผู้รับผิดชอบ Import ตาม Brand และคำนวณแผนวันทำการ (ข้ามวันหยุดบริษัท) ให้อัตโนมัติ
        </p>
      </div>

      {error ? (
        <div className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-4 py-2.5 text-sm text-[#b91c1c]">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <label className="space-y-1 md:col-span-2">
          <span className="font-semibold text-[#1f2933]">ชื่อสินค้า / รายละเอียดรุ่น *</span>
          <input required value={productTitle} onChange={(e) => setProductTitle(e.target.value)} placeholder="เช่น ถังขยะสแตนเลส 12L ระบบเหยียบ" className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933]" />
        </label>

        <label className="space-y-1">
          <span className="font-semibold text-[#1f2933]">Brand *</span>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 bg-white text-[#1f2933]">
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.groupName})</option>
            ))}
          </select>
          {selectedBrand ? <span className="text-xs text-[#0f5c4d]">ผู้รับผิดชอบอัตโนมัติ: {selectedBrand.ownerLabel}</span> : null}
        </label>

        <label className="space-y-1">
          <span className="font-semibold text-[#1f2933]">เลขที่ PI *</span>
          <input required value={piNumber} onChange={(e) => setPiNumber(e.target.value)} placeholder="เช่น PI-2026-088" className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933]" />
        </label>

        <label className="space-y-1">
          <span className="font-semibold text-[#1f2933]">วันที่ PI *</span>
          <input required type="date" value={piDate} onChange={(e) => setPiDate(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933]" />
        </label>

        <label className="space-y-1">
          <span className="font-semibold text-[#1f2933]">จำนวน SKU *</span>
          <input required type="number" min={1} value={skuCount} onChange={(e) => setSkuCount(Number(e.target.value))} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 text-[#1f2933]" />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="font-semibold text-[#1f2933]">ประเภทงาน Packaging (Case 1–6) *</span>
          <select value={caseConfigId} onChange={(e) => setCaseConfigId(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 bg-white text-[#1f2933]">
            {caseConfigs.map((cfg) => (
              <option key={cfg.id} value={cfg.id}>
                Case {cfg.caseNumber}: {cfg.name} (เตรียมข้อมูล {cfg.infoDays} วัน + ออกแบบ {cfg.designDays} วัน)
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="font-semibold text-[#1f2933]">หมวดสินค้า (Subclass)</span>
          <select value={subclassId} onChange={(e) => setSubclassId(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 bg-white text-[#1f2933]">
            <option value="">— ไม่ระบุ —</option>
            {subclasses.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.code} · {sc.nameTh}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="font-semibold text-[#1f2933]">โรงงานผู้ผลิต (Vendor)</span>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full rounded-md border border-[#c7ced5] px-3 py-2 bg-white text-[#1f2933]">
            <option value="">— ไม่ระบุ —</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </label>
      </div>

      <CaseFlagsPicker
        packagingTypes={packagingTypes}
        selectedTypeIds={packagingTypeIds}
        onToggleType={togglePkgType}
        flags={flags}
        onChangeFlag={(k, v) => setFlags((prev) => ({ ...prev, [k]: v }))}
      />

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933]">
          ยกเลิก
        </button>
        <button type="submit" disabled={busy || packagingTypeIds.length === 0} className="px-5 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50">
          {busy ? "กำลังสร้าง Case..." : "บันทึกและสร้างแผนงาน"}
        </button>
      </div>
    </form>
  );
}
