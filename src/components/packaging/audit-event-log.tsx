import { AUDIT_ACTION_LABELS, ROLE_LABELS, STEP_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateTimeTh } from "@/lib/utils/date-th";
import type { PackagingStepKey } from "@prisma/client";
import type { AuditEventDto } from "./case-detail-types";

export function AuditEventLog({ events }: { events: AuditEventDto[] }) {
  return (
    <section className="bg-white border border-[#d9dee3] rounded-md overflow-hidden">
      <div className="px-5 py-3 border-b border-[#d9dee3] flex items-center justify-between">
        <h3 className="text-[17px] font-bold text-[#1f2933]">Event Log & Audit Trail (Append-Only)</h3>
        <span className="text-xs text-[#5f6b76]">ทั้งหมด {events.length} รายการ</span>
      </div>

      {events.length === 0 ? (
        <div className="p-5 text-sm text-[#5f6b76]">ยังไม่มีบันทึกกิจกรรม</div>
      ) : (
        <ol className="divide-y divide-[#e5e9ed]">
          {events.map((ev) => {
            const stepLabel =
              ev.stepKey && ev.stepKey in STEP_LABELS
                ? STEP_LABELS[ev.stepKey as PackagingStepKey]
                : ev.stepKey;

            return (
              <li key={ev.id} className="px-5 py-3 flex flex-wrap items-start justify-between gap-2 text-sm">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#1f2933]">
                      {AUDIT_ACTION_LABELS[ev.action] ?? ev.action}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#eef1f4] text-[#1f2933]">
                      {ROLE_LABELS[ev.actorRole]}
                    </span>
                    {stepLabel ? <span className="text-xs text-[#0f5c4d] font-medium">· {stepLabel}</span> : null}
                  </div>
                  <div className="text-xs text-[#5f6b76]">
                    โดย {ev.actor.nickname ?? ev.actor.thaiName}
                    {ev.reason ? <span className="text-[#1f2933] ml-2">— {ev.reason}</span> : null}
                  </div>
                </div>
                <time className="text-xs text-[#5f6b76] tabular-nums shrink-0">
                  {formatDateTimeTh(ev.createdAt)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
