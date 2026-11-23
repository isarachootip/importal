"use client";

import type { ChecklistItemDto } from "./case-detail-types";

interface Props {
  items: ChecklistItemDto[];
  checkedMap: Record<string, boolean>;
  canEdit: boolean;
  canSubmit: boolean;
  busy: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onSubmitToPreQc: () => void;
}

export function PiChecklistCard({
  items,
  checkedMap,
  canEdit,
  canSubmit,
  busy,
  onToggle,
  onSubmitToPreQc,
}: Props) {
  return (
    <section className="bg-white border border-[#d9dee3] rounded-md p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[17px] font-bold text-[#1f2933]">Checklist ข้อมูลก่อนส่ง Graphic (9 ข้อ)</h3>
          <p className="text-xs text-[#5f6b76]">ติ๊กตรวจสอบความครบถ้วนและกดบันทึกก่อนส่งให้ฝ่าย Graphic Pre QC</p>
        </div>
        {canSubmit ? (
          <button
            type="button"
            disabled={busy}
            onClick={onSubmitToPreQc}
            className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold disabled:opacity-50"
          >
            Submit ส่งให้ Graphic Pre QC
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-2.5 p-2.5 rounded-md border border-[#e5e9ed] hover:bg-[#fafbfc] cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={Boolean(checkedMap[item.id])}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              className="mt-0.5 accent-[#0f5c4d]"
            />
            <span className="text-[#1f2933]">
              {item.labelTh}
              {item.isRequired ? <span className="text-[#b91c1c] ml-1">*</span> : null}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
