"use client";

import { AlertTriangle } from "lucide-react";
import { buildLeadTimeAlerts } from "@/lib/domain/schedule-engine";

export interface CaseFlagsState {
  isNewPhoto: boolean;
  isMinorChange: boolean;
  requiresTisi: boolean;
  requiresFda: boolean;
  isTileImport: boolean;
  isNewBrandOrLogo: boolean;
}

interface Props {
  packagingTypes: Array<{ id: string; nameTh: string }>;
  selectedTypeIds: string[];
  onToggleType: (id: string) => void;
  flags: CaseFlagsState;
  onChangeFlag: <K extends keyof CaseFlagsState>(key: K, val: boolean) => void;
}

export function CaseFlagsPicker({
  packagingTypes,
  selectedTypeIds,
  onToggleType,
  flags,
  onChangeFlag,
}: Props) {
  const alerts = buildLeadTimeAlerts({
    requiresTisi: flags.requiresTisi,
    requiresFda: flags.requiresFda,
    isTileImport: flags.isTileImport,
    isNewBrandOrLogo: flags.isNewBrandOrLogo,
  });

  const checkboxList: Array<{ key: keyof CaseFlagsState; label: string }> = [
    { key: "isNewPhoto", label: "ถ่ายรูปสินค้าใหม่ (+7 วันทำการ)" },
    { key: "isMinorChange", label: "Repeat Order / Minor Change (ข้าม EVP)" },
    { key: "requiresTisi", label: "ขอ มอก./TISI" },
    { key: "requiresFda", label: "ขอ อย." },
    { key: "isTileImport", label: "กระเบื้อง (อินเดีย/จีน)" },
    { key: "isNewBrandOrLogo", label: "New Brand / Logo" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-semibold text-[#1f2933]">รูปแบบ Packaging * (เลือกอย่างน้อย 1 รายการ)</div>
        <div className="flex flex-wrap gap-1.5">
          {packagingTypes.map((pt) => {
            const active = selectedTypeIds.includes(pt.id);
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => onToggleType(pt.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                  active ? "bg-[#0f5c4d] border-[#0f5c4d] text-white" : "bg-white border-[#c7ced5] text-[#1f2933]"
                }`}
              >
                {pt.nameTh}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#1f2933] pt-2 border-t border-[#e5e9ed]">
        {checkboxList.map((item) => (
          <label key={item.key} className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={flags[item.key]}
              onChange={(e) => onChangeFlag(item.key, e.target.checked)}
              className="accent-[#0f5c4d]"
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-1.5">
          {alerts.map((a) => (
            <div
              key={a.code}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#fefce8] border border-[#fde047] text-xs text-[#854d0e]"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{a.messageTh}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
