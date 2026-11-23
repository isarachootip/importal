import Link from "next/link";
import type { EnrichedCaseSummary } from "@/lib/domain/case-analytics";
import { BOARD_STATUS_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateShort } from "@/lib/utils/date-th";

interface Props {
  myQueue: EnrichedCaseSummary[];
  overdueOrAtRisk: EnrichedCaseSummary[];
  userDisplayName: string;
}

export function ActionQueuesGrid({ myQueue, overdueOrAtRisk, userDisplayName }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section id="my-queue" className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-[#d9dee3]">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2933]">รอฉันดำเนินการ ({myQueue.length})</h2>
            <p className="text-xs text-[#5f6b76]">คิวงาน Packaging ที่รอการดำเนินการจาก {userDisplayName}</p>
          </div>
          <Link href="/packaging?mine=1" className="text-xs font-semibold text-[#0f5c4d] hover:underline">
            ดูบน Board
          </Link>
        </div>

        {myQueue.length === 0 ? (
          <div className="p-5 text-sm text-[#5f6b76]">
            ไม่มีงานค้างในคิวของคุณขณะนี้ (สามารถสลับผู้ใช้งานที่มุมขวาบนเพื่อดูคิวของบทบาทอื่นได้)
          </div>
        ) : (
          <ul className="divide-y divide-[#e5e9ed]">
            {myQueue.map((item) => {
              const p = item.packaging!;
              return (
                <li key={item.id}>
                  <Link
                    href={`/cases/${item.caseCode}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-[#f9fafb] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0f5c4d] text-sm">{item.caseCode}</span>
                        <span className="text-xs font-semibold text-[#5f6b76]">{item.brandName}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eff6ff] text-[#1d4ed8]">
                          {BOARD_STATUS_LABELS[p.timelineStatus]}
                        </span>
                      </div>
                      <div className="text-sm text-[#1f2933] truncate mt-0.5">{item.productTitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-[#5f6b76] tabular-nums">
                        กำหนด: <span className="font-semibold text-[#1f2933]">{formatDateShort(p.stepPlannedEnd)}</span>
                      </div>
                      {p.overdueDays > 0 ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef2f2] text-[#b91c1c]">
                          ล่าช้า +{p.overdueDays} วัน
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#0f5c4d]">ดำเนินการ →</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-[#d9dee3]">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2933]">ล่าช้ากว่าแผน / ใกล้ครบกำหนด ({overdueOrAtRisk.length})</h2>
            <p className="text-xs text-[#5f6b76]">งานที่เลยกำหนดขั้นปัจจุบันหรือเหลือเวลา ≤ 3 วัน</p>
          </div>
          <Link href="/cases?overdueOnly=1" className="text-xs font-semibold text-[#b91c1c] hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        {overdueOrAtRisk.length === 0 ? (
          <div className="p-5 text-sm text-[#0f5c4d]">ยอดเยี่ยม! ยังไม่มีงาน Packaging ที่ล่าช้ากว่าแผน</div>
        ) : (
          <ul className="divide-y divide-[#e5e9ed]">
            {overdueOrAtRisk.slice(0, 8).map((item) => {
              const p = item.packaging!;
              const isOverdue = p.overdueDays > 0;
              return (
                <li key={item.id}>
                  <Link
                    href={`/cases/${item.caseCode}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-[#f9fafb] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#1f2933] text-sm">{item.caseCode}</span>
                        <span className="text-xs text-[#5f6b76]">{item.brandName} · ผู้รับผิดชอบ: {p.responsibleLabel}</span>
                      </div>
                      <div className="text-sm text-[#1f2933] truncate mt-0.5">{item.productTitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          isOverdue
                            ? "bg-[#fef2f2] text-[#b91c1c]"
                            : "bg-[#fefce8] text-[#a16207]"
                        }`}
                      >
                        {isOverdue ? `ล่าช้า +${p.overdueDays} วัน` : "ใกล้ครบกำหนด"}
                      </span>
                      <div className="text-xs text-[#5f6b76] mt-0.5 tabular-nums">
                        แผน: {formatDateShort(p.stepPlannedEnd)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
