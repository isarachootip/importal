"use client";

import { useState } from "react";
import { ROLE_LABELS } from "@/lib/domain/packaging-labels";
import type { AdminApprovalRuleDto, AdminCaseConfigDto } from "./admin-types";

interface Props {
  caseConfigs: AdminCaseConfigDto[];
  approvalRules: AdminApprovalRuleDto[];
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}

export function CaseRulesAdminTab({ caseConfigs, approvalRules, onMutate, busy }: Props) {
  const [drafts, setDrafts] = useState<Record<string, AdminCaseConfigDto>>(() =>
    Object.fromEntries(caseConfigs.map((c) => [c.id, c]))
  );

  function updateField(id: string, field: "infoDays" | "designDays" | "productionDays" | "logisticDays", val: number) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id]!, [field]: val } }));
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-[#d9dee3]">
          <h2 className="text-[16px] font-bold text-[#1f2933]">กำหนด Lead Time มาตรฐาน (Case 1–6)</h2>
          <p className="text-xs text-[#5f6b76]">วันเตรียมข้อมูลและวันออกแบบนับเป็นวันทำการ · Production และ Logistic นับเป็นวันปฏิทิน</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[740px]">
            <thead>
              <tr className="bg-[#f5f7f9] text-[#5f6b76] text-xs font-semibold">
                <th className="py-2.5 px-5">Case</th>
                <th className="py-2.5 px-3">เตรียมข้อมูล (วันทำการ)</th>
                <th className="py-2.5 px-3">ออกแบบ (วันทำการ)</th>
                <th className="py-2.5 px-3">ผลิต (วัน)</th>
                <th className="py-2.5 px-3">ขนส่ง (วัน)</th>
                <th className="py-2.5 px-5 text-right">บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {caseConfigs.map((cfg) => {
                const row = drafts[cfg.id] ?? cfg;
                return (
                  <tr key={cfg.id} className="border-t border-[#e5e9ed]">
                    <td className="py-2 px-5 font-semibold text-[#1f2933]">
                      Case {cfg.caseNumber}: {cfg.name}
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} value={row.infoDays} onChange={(e) => updateField(cfg.id, "infoDays", Number(e.target.value))} className="w-20 border border-[#c7ced5] rounded px-2 py-1 text-right tabular-nums" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={0} value={row.designDays} onChange={(e) => updateField(cfg.id, "designDays", Number(e.target.value))} className="w-20 border border-[#c7ced5] rounded px-2 py-1 text-right tabular-nums" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={1} value={row.productionDays} onChange={(e) => updateField(cfg.id, "productionDays", Number(e.target.value))} className="w-20 border border-[#c7ced5] rounded px-2 py-1 text-right tabular-nums" />
                    </td>
                    <td className="py-2 px-3">
                      <input type="number" min={1} value={row.logisticDays} onChange={(e) => updateField(cfg.id, "logisticDays", Number(e.target.value))} className="w-20 border border-[#c7ced5] rounded px-2 py-1 text-right tabular-nums" />
                    </td>
                    <td className="py-2 px-5 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          onMutate({
                            entity: "CASE_CONFIG_UPDATE",
                            id: cfg.id,
                            infoDays: row.infoDays,
                            designDays: row.designDays,
                            productionDays: row.productionDays,
                            logisticDays: row.logisticDays,
                          })
                        }
                        className="px-3 py-1 rounded bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-xs font-semibold disabled:opacity-50"
                      >
                        บันทึก
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-[#d9dee3]">
          <h2 className="text-[16px] font-bold text-[#1f2933]">กฎลำดับการอนุมัติ Packaging (Configurable Approval Rules)</h2>
          <p className="text-xs text-[#5f6b76]">เปิด/ปิดสิทธิ์การตรวจแต่ละขั้นได้โดยไม่ต้องแก้โค้ด (เช่น เปิดโหมดเข้มงวดให้ GM/VP ตรวจทุก Draft)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#f5f7f9] text-[#5f6b76] text-xs font-semibold">
                <th className="py-2 px-5">Stage Key</th>
                <th className="py-2 px-3">ลำดับ</th>
                <th className="py-2 px-3">บทบาท</th>
                <th className="py-2 px-3">รูปแบบ</th>
                <th className="py-2 px-5 text-right">เปิดใช้งาน</th>
              </tr>
            </thead>
            <tbody>
              {approvalRules.map((rule) => (
                <tr key={rule.id} className="border-t border-[#e5e9ed]">
                  <td className="py-2 px-5 font-mono text-xs text-[#1f2933]">{rule.stageKey}</td>
                  <td className="py-2 px-3 text-[#5f6b76] tabular-nums">{rule.stepOrder}</td>
                  <td className="py-2 px-3 font-semibold text-[#1f2933]">{ROLE_LABELS[rule.role]}</td>
                  <td className="py-2 px-3 text-xs text-[#5f6b76]">{rule.isParallel ? "คู่ขนาน (Parallel)" : "ตามลำดับ (Sequential)"}</td>
                  <td className="py-2 px-5 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onMutate({ entity: "APPROVAL_RULE_TOGGLE", id: rule.id, isEnabled: !rule.isEnabled })}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        rule.isEnabled ? "bg-[#e6f2ef] text-[#0f5c4d]" : "bg-[#eef1f4] text-[#5f6b76]"
                      }`}
                    >
                      {rule.isEnabled ? "เปิดใช้งาน" : "ปิดไว้"}
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
