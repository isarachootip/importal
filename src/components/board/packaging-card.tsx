import Link from "next/link";
import type { EnrichedCaseSummary } from "@/lib/domain/case-analytics";
import { formatDateShort } from "@/lib/utils/date-th";

interface Props {
  item: EnrichedCaseSummary;
  isMine: boolean;
}

export function PackagingCard({ item, isMine }: Props) {
  const p = item.packaging;
  if (!p) return null;

  const isOverdue = p.overdueDays > 0;

  return (
    <Link
      href={`/cases/${item.caseCode}`}
      className={`block bg-white rounded-md border p-3 transition-colors space-y-2 ${
        isOverdue
          ? "border-[#fca5a5] hover:border-[#dc2626]"
          : isMine
            ? "border-[#0f5c4d] hover:bg-[#fafdfb]"
            : "border-[#d9dee3] hover:border-[#0f5c4d]"
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs font-bold text-[#0f5c4d]">{item.caseCode}</span>
        <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#eef1f4] text-[#1f2933] truncate max-w-[130px]">
          {item.brandName}
        </span>
      </div>

      <div className="text-sm font-semibold text-[#1f2933] leading-snug line-clamp-2">
        {item.productTitle}
      </div>

      <div className="text-xs text-[#5f6b76] flex items-center justify-between gap-2 tabular-nums">
        <span className="truncate">{p.piNumber}</span>
        <span className="shrink-0 font-semibold text-[#1f2933]">
          C{p.caseNumber} · {p.skuCount} SKU
        </span>
      </div>

      <div className="pt-2 border-t border-[#e5e9ed] flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <span className="text-[#5f6b76]">
          คิว: <strong className="text-[#1f2933]">{p.responsibleLabel}</strong>
        </span>
        <span className="text-[#5f6b76] tabular-nums">
          แผน: <strong className="text-[#1f2933]">{formatDateShort(p.stepPlannedEnd)}</strong>
        </span>
      </div>

      {(isOverdue || p.isDueSoon || p.preQcRejectCount > 0 || isMine) ? (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {isMine ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#e6f2ef] text-[#0f5c4d]">
              รอฉันดำเนินการ
            </span>
          ) : null}
          {isOverdue ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef2f2] text-[#b91c1c]">
              ล่าช้า +{p.overdueDays} วัน
            </span>
          ) : p.isDueSoon ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fefce8] text-[#a16207]">
              ใกล้ครบกำหนด
            </span>
          ) : null}
          {p.preQcRejectCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#fff1f2] text-[#be123c]">
              Reject {p.preQcRejectCount}x
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
