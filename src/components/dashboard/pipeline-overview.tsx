import Link from "next/link";
import type { ImportStage, TimelineBoardStatus } from "@prisma/client";
import type { EnrichedCaseSummary } from "@/lib/domain/case-analytics";
import { BOARD_STATUS_LABELS, STAGE_LABELS } from "@/lib/domain/packaging-labels";

interface Props {
  stageCounts: Record<ImportStage, number>;
  boardCounts: Record<TimelineBoardStatus, number>;
  allCases: EnrichedCaseSummary[];
}

const PIPELINE_STAGES: ImportStage[] = [
  "SOURCING",
  "PACKAGING",
  "PURCHASE_ORDER",
  "PRODUCTION",
  "LOGISTIC",
];

const PACKAGING_STAGES: TimelineBoardStatus[] = [
  "PENDING_IMPORT",
  "PRE_QC_GD",
  "ON_PROCESS",
  "SENT_DRAFT_1",
  "SENT_DRAFT_2",
  "SENT_DRAFT_3",
  "APPROVE_FINAL",
];

export function PipelineOverview({ stageCounts, boardCounts, allCases }: Props) {
  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#d9dee3]">
          <h2 className="text-[17px] font-bold text-[#1f2933]">Import Pipeline (5 ขั้นตอนหลัก)</h2>
          <Link href="/cases" className="text-sm font-semibold text-[#0f5c4d] hover:underline">
            ดูรายการ Case ทั้งหมด →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#e5e9ed]">
          {PIPELINE_STAGES.map((stage) => {
            const items = allCases.filter((c) => c.currentStage === stage).slice(0, 3);
            return (
              <div key={stage} className="p-3.5 flex flex-col gap-2.5 bg-white">
                <Link
                  href={`/cases?stage=${stage}`}
                  className="flex items-center justify-between gap-2 group"
                >
                  <span className="text-[13px] font-bold text-[#1f2933] group-hover:text-[#0f5c4d]">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#e6f2ef] text-[#0f5c4d] tabular-nums">
                    {stageCounts[stage]}
                  </span>
                </Link>

                <div className="space-y-1.5">
                  {items.length === 0 ? (
                    <div className="text-xs text-[#9aa5b1] py-2">ไม่มีงานในขั้นนี้</div>
                  ) : (
                    items.map((c) => (
                      <Link
                        key={c.id}
                        href={`/cases/${c.caseCode}`}
                        className="block rounded border border-[#e5e9ed] hover:border-[#0f5c4d] bg-[#fafbfc] px-2.5 py-2 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1 text-xs">
                          <span className="font-bold text-[#0f5c4d]">{c.caseCode}</span>
                          <span className="text-[#5f6b76] truncate">{c.brandName}</span>
                        </div>
                        <div className="text-xs text-[#1f2933] truncate mt-0.5">{c.productTitle}</div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-[#d9dee3] rounded-md px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <h3 className="text-[15px] font-bold text-[#1f2933]">สรุปคิวงาน Packaging Board (7 คอลัมน์)</h3>
          <Link href="/packaging" className="text-sm font-semibold text-[#0f5c4d] hover:underline">
            เปิด Packaging Board →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PACKAGING_STAGES.map((status) => (
            <Link
              key={status}
              href={`/cases?timelineStatus=${status}`}
              className="rounded-md border border-[#e5e9ed] hover:border-[#0f5c4d] bg-[#fafbfc] px-3 py-2 text-center transition-colors"
            >
              <div className="text-lg font-bold text-[#1f2933] tabular-nums">{boardCounts[status]}</div>
              <div className="text-[11px] font-semibold text-[#5f6b76] leading-tight mt-0.5">
                {BOARD_STATUS_LABELS[status]}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
