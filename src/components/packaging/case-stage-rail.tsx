import type { ImportStage } from "@prisma/client";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDateShort } from "@/lib/utils/date-th";
import { cn } from "@/lib/utils/cn";
import type { CaseDetailDto } from "./case-detail-types";

const STAGES: Array<{ key: ImportStage; title: string; subtitle: string }> = [
  { key: "SOURCING", title: "1. Sourcing", subtitle: "หาสินค้า & ใบเสนอราคา" },
  { key: "PACKAGING", title: "2. PI & Packaging", subtitle: "ลงทะเบียน PI & ออกแบบ" },
  { key: "PURCHASE_ORDER", title: "3. Purchase Order", subtitle: "ออก & อนุมัติ PO" },
  { key: "PRODUCTION", title: "4. Production", subtitle: "ผลิต & ตรวจ QC โรงงาน" },
  { key: "LOGISTIC", title: "5. Logistic & WH", subtitle: "ขนส่ง, ศุลกากร & เข้าคลัง" },
];

const STAGE_ORDER: Record<ImportStage, number> = {
  SOURCING: 0,
  PACKAGING: 1,
  PURCHASE_ORDER: 2,
  PRODUCTION: 3,
  LOGISTIC: 4,
  CLOSED: 5,
};

export function CaseStageRail({
  data,
  selectedStage,
  onSelectStage,
}: {
  data: CaseDetailDto;
  selectedStage?: ImportStage;
  onSelectStage?: (stage: ImportStage) => void;
}) {
  const currentIdx = STAGE_ORDER[data.currentStage];
  const pkgEndStep = data.packaging?.scheduleSteps.filter((s) => !s.isBuffer).at(-1);

  function stageDates(key: ImportStage): { plan: string | null; actual: string | null } {
    switch (key) {
      case "SOURCING":
        return { plan: data.sourcingPlanEnd, actual: data.sourcingActualEnd };
      case "PACKAGING":
        return { plan: pkgEndStep?.plannedEnd ?? null, actual: pkgEndStep?.actualEnd ?? null };
      case "PURCHASE_ORDER":
        return { plan: data.poPlanEnd, actual: data.poActualEnd };
      case "PRODUCTION":
        return { plan: data.prodPlanEnd, actual: data.prodActualEnd };
      case "LOGISTIC":
        return { plan: data.logisticPlanEnd, actual: data.logisticActualEnd };
      default:
        return { plan: null, actual: null };
    }
  }

  return (
    <div className="space-y-3">
      <section className="bg-white border border-[#d9dee3] rounded-md px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs font-semibold text-[#5f6b76] uppercase tracking-wide">
            Import Lifecycle Progress (5 ขั้นตอน)
          </div>
          {data.logisticPlanEnd ? (
            <div className="text-xs text-[#5f6b76]">
              แผนสินค้าเข้าคลัง (WH):{" "}
              <span className="font-bold text-[#0f5c4d] tabular-nums">{formatDateShort(data.logisticPlanEnd)}</span>
            </div>
          ) : null}
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {STAGES.map((stage, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const viewing = selectedStage === stage.key;
            const dates = stageDates(stage.key);
            return (
              <li key={stage.key}>
                <button
                  type="button"
                  onClick={() => onSelectStage?.(stage.key)}
                  className={cn(
                    "w-full text-left rounded-md border px-3 py-2.5 transition-colors cursor-pointer",
                    viewing && "ring-2 ring-[#0f5c4d]/30 border-[#0f5c4d]",
                    active && "border-[#0f5c4d] bg-[#f2f8f6]",
                    done && !active && "border-[#cfe3dd] bg-white hover:border-[#0f5c4d]",
                    !active && !done && "border-[#e5e9ed] bg-[#fafbfc] hover:border-[#0f5c4d]"
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={cn(
                        "text-[13px] font-bold",
                        active || viewing ? "text-[#0f5c4d]" : done ? "text-[#1f2933]" : "text-[#5f6b76]"
                      )}
                    >
                      {stage.title}
                    </span>
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-[#0f5c4d] shrink-0" />
                    ) : active ? (
                      <Clock className="w-4 h-4 text-[#1d4ed8] shrink-0" />
                    ) : null}
                  </div>
                  <div className="text-xs text-[#5f6b76] mt-0.5">{stage.subtitle}</div>
                  <div className="text-xs text-[#5f6b76] mt-1.5 tabular-nums">
                    แผน: <span className="font-semibold text-[#1f2933]">{formatDateShort(dates.plan)}</span>
                    {dates.actual ? (
                      <span className="ml-2 text-[#0f5c4d]">จริง: {formatDateShort(dates.actual)}</span>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {data.leadTimeAlerts.length > 0 ? (
        <div className="space-y-1.5">
          {data.leadTimeAlerts.map((alert) => (
            <div
              key={alert.code}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-md border text-sm",
                alert.severity === "warning"
                  ? "bg-[#fefce8] border-[#fde047] text-[#854d0e]"
                  : "bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]"
              )}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{alert.messageTh}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
