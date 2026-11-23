import Link from "next/link";
import { AlertTriangle, CheckSquare, FolderKanban, Package } from "lucide-react";

interface KpiStripProps {
  totalActiveCases: number;
  activePackagingCount: number;
  myQueueCount: number;
  overdueCount: number;
  totalPreQcRejects: number;
}

export function KpiStrip({
  totalActiveCases,
  activePackagingCount,
  myQueueCount,
  overdueCount,
  totalPreQcRejects,
}: KpiStripProps) {
  const cards = [
    {
      label: "Case เปิดอยู่ทั้งหมด",
      value: totalActiveCases,
      sub: "5 ขั้นตอนนำเข้า (Sourcing → WH)",
      href: "/cases",
      accent: "text-[#1f2933]",
      icon: FolderKanban,
    },
    {
      label: "Packaging กำลังดำเนินการ",
      value: activePackagingCount,
      sub: `Pre QC ตีกลับสะสม ${totalPreQcRejects} ครั้ง`,
      href: "/packaging",
      accent: "text-[#0f5c4d]",
      icon: Package,
    },
    {
      label: "รอฉันดำเนินการ",
      value: myQueueCount,
      sub: "คิวที่ต้องตรวจ/อนุมัติในบทบาทคุณ",
      href: "#my-queue",
      accent: "text-[#1d4ed8]",
      icon: CheckSquare,
    },
    {
      label: "ล่าช้ากว่าแผน",
      value: overdueCount,
      sub: overdueCount > 0 ? "เกินกำหนดขั้นปัจจุบัน" : "ทุกงานอยู่ในแผนปกติ",
      href: "/cases?overdueOnly=1",
      accent: overdueCount > 0 ? "text-[#b91c1c]" : "text-[#0f5c4d]",
      icon: AlertTriangle,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-[#d9dee3] hover:border-[#0f5c4d] rounded-md px-4 py-3.5 transition-colors flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#5f6b76]">{card.label}</span>
              <Icon className="w-4 h-4 text-[#5f6b76] shrink-0" />
            </div>
            <div className={`text-[28px] font-bold leading-none tabular-nums ${card.accent}`}>
              {card.value}
            </div>
            <div className="text-xs text-[#5f6b76]">{card.sub}</div>
          </Link>
        );
      })}
    </section>
  );
}
