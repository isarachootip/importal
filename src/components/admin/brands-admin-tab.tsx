"use client";

import { useState, type FormEvent } from "react";
import type { AdminBrandDto, AdminUserOption } from "./admin-types";

interface Props {
  brands: AdminBrandDto[];
  importOwners: AdminUserOption[];
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}

export function BrandsAdminTab({ brands, importOwners, onMutate, busy }: Props) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("House Brand");
  const [ownerId, setOwnerId] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await onMutate({ entity: "BRAND_CREATE", code, name, groupName, ownerId: ownerId || null });
    setCode("");
    setName("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="bg-white border border-[#d9dee3] rounded-md p-4 flex flex-wrap items-end gap-2.5 text-sm">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-[#5f6b76]">รหัส Brand *</span>
          <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น KASSA_PRO" className="border border-[#c7ced5] rounded-md px-3 py-1.5 w-36 text-[#1f2933]" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-[#5f6b76]">ชื่อ Brand *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Kassa Pro" className="border border-[#c7ced5] rounded-md px-3 py-1.5 w-44 text-[#1f2933]" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-[#5f6b76]">กลุ่ม</span>
          <input required value={groupName} onChange={(e) => setGroupName(e.target.value)} className="border border-[#c7ced5] rounded-md px-3 py-1.5 w-40 text-[#1f2933]" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-[#5f6b76]">เจ้าของงาน Import</span>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
            <option value="">— ไม่ระบุ (Power Buy) —</option>
            {importOwners.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </label>
        <button type="submit" disabled={busy} className="px-4 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white font-semibold disabled:opacity-50">
          + เพิ่ม Brand
        </button>
      </form>

      <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-[#f5f7f9] text-[#5f6b76] text-xs font-semibold">
                <th className="py-2.5 px-5">รหัส</th>
                <th className="py-2.5 px-3">ชื่อ Brand</th>
                <th className="py-2.5 px-3">กลุ่ม</th>
                <th className="py-2.5 px-3">ผู้รับผิดชอบ (Import Owner)</th>
                <th className="py-2.5 px-5 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-[#e5e9ed]">
                  <td className="py-2 px-5 font-mono text-xs text-[#5f6b76]">{b.code}</td>
                  <td className="py-2 px-3 font-semibold text-[#1f2933]">{b.name}</td>
                  <td className="py-2 px-3 text-[#5f6b76]">{b.groupName}</td>
                  <td className="py-2 px-3">
                    <select
                      disabled={busy}
                      defaultValue={b.ownerId ?? ""}
                      onChange={(e) =>
                        onMutate({ entity: "BRAND_UPDATE", id: b.id, ownerId: e.target.value || null })
                      }
                      className="border border-[#c7ced5] rounded-md px-2 py-1 bg-white text-xs text-[#1f2933]"
                    >
                      <option value="">— ไม่ระบุ (Power Buy) —</option>
                      {importOwners.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-5 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onMutate({ entity: "BRAND_UPDATE", id: b.id, ownerId: b.ownerId, isActive: !b.isActive })}
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        b.isActive ? "bg-[#e6f2ef] text-[#0f5c4d]" : "bg-[#eef1f4] text-[#5f6b76]"
                      }`}
                    >
                      {b.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
