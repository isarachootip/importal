import Link from "next/link";
import type { EnrichedCaseSummary } from "@/lib/domain/case-analytics";
import { BOARD_STATUS_LABELS, STAGE_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateShort } from "@/lib/utils/date-th";

export function CasesTable({ rows }: { rows: EnrichedCaseSummary[] }) {
  return (
    <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="bg-[#f5f7f9] text-[#5f6b76] text-[13px] font-semibold">
              <th className="py-2.5 px-5">รหัส Case</th>
              <th className="py-2.5 px-2.5">สินค้า / Brand</th>
              <th className="py-2.5 px-2.5">ผู้รับผิดชอบ</th>
              <th className="py-2.5 px-2.5">ขั้นตอนหลัก</th>
              <th className="py-2.5 px-2.5">PI / Case / SKU</th>
              <th className="py-2.5 px-2.5">สถานะ Packaging</th>
              <th className="py-2.5 px-2.5">กำหนดขั้นนี้</th>
              <th className="py-2.5 px-5 text-right">แผนเข้าคลัง (WH)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-sm text-[#5f6b76]">
                  ไม่พบรายการ Case ที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const p = c.packaging;
                return (
                  <tr key={c.id} className="border-t border-[#e5e9ed] hover:bg-[#f9fafb]">
                    <td className="py-2.5 px-5 font-bold text-[#0f5c4d] whitespace-nowrap">
                      <Link href={`/cases/${c.caseCode}`} className="hover:underline">
                        {c.caseCode}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2.5">
                      <Link href={`/cases/${c.caseCode}`} className="font-semibold text-[#1f2933] hover:text-[#0f5c4d] block">
                        {c.productTitle}
                      </Link>
                      <span className="text-xs text-[#5f6b76]">
                        {c.brandName}
                        {c.vendorName ? ` · ${c.vendorName}` : ""}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-[#5f6b76] whitespace-nowrap">{c.ownerName}</td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[#eef1f4] text-[#1f2933]">
                        {STAGE_LABELS[c.currentStage]}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-[#5f6b76] whitespace-nowrap tabular-nums">
                      {p ? (
                        <div>
                          <div className="font-semibold text-[#1f2933]">{p.piNumber}</div>
                          <div className="text-xs">Case {p.caseNumber} · {p.skuCount} SKUs</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      {p ? (
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[#e6f2ef] text-[#0f5c4d]">
                            {BOARD_STATUS_LABELS[p.timelineStatus]}
                          </span>
                          <div className="text-[11px] text-[#5f6b76]">คิว: {p.responsibleLabel}</div>
                        </div>
                      ) : (
                        <span className="text-[#5f6b76]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap tabular-nums">
                      {p ? (
                        <div>
                          <div className="text-[#1f2933]">{formatDateShort(p.stepPlannedEnd)}</div>
                          {p.overdueDays > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#fef2f2] text-[#b91c1c]">
                              ล่าช้า +{p.overdueDays} วัน
                            </span>
                          ) : p.isDueSoon ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#fefce8] text-[#a16207]">
                              ใกล้ครบกำหนด
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-5 text-right whitespace-nowrap font-semibold text-[#1f2933] tabular-nums">
                      {formatDateShort(c.logisticPlanEnd)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
