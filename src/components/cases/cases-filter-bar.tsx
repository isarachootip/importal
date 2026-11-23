import Link from "next/link";
import type { ImportStage, TimelineBoardStatus } from "@prisma/client";
import { Download } from "lucide-react";
import { BOARD_STATUS_LABELS, STAGE_LABELS } from "@/lib/domain/packaging-labels";
import type { CaseFilterInput } from "@/lib/validations/case-filters";

interface OptionItem {
  id: string;
  label: string;
}

interface Props {
  filters: CaseFilterInput;
  brands: OptionItem[];
  owners: OptionItem[];
  totalCount: number;
}

const STAGE_OPTIONS: ImportStage[] = [
  "SOURCING",
  "PACKAGING",
  "PURCHASE_ORDER",
  "PRODUCTION",
  "LOGISTIC",
  "CLOSED",
];

const STATUS_OPTIONS: TimelineBoardStatus[] = [
  "PENDING_IMPORT",
  "PRE_QC_GD",
  "ON_PROCESS",
  "SENT_DRAFT_1",
  "SENT_DRAFT_2",
  "SENT_DRAFT_3",
  "APPROVE_FINAL",
  "APPROVED_FINAL",
];

function buildExportUrl(filters: CaseFilterInput): string {
  const qs = new URLSearchParams();
  if (filters.q) qs.set("q", filters.q);
  if (filters.stage) qs.set("stage", filters.stage);
  if (filters.brandId) qs.set("brandId", filters.brandId);
  if (filters.ownerId) qs.set("ownerId", filters.ownerId);
  if (filters.timelineStatus) qs.set("timelineStatus", filters.timelineStatus);
  if (filters.caseNumber) qs.set("caseNumber", String(filters.caseNumber));
  if (filters.overdueOnly) qs.set("overdueOnly", "1");
  const query = qs.toString();
  return query ? `/api/cases/export?${query}` : "/api/cases/export";
}

export function CasesFilterBar({ filters, brands, owners, totalCount }: Props) {
  const exportHref = buildExportUrl(filters);

  return (
    <section className="bg-white border border-[#d9dee3] rounded-md px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#1f2933]">รายการ Import Cases ทั้งหมด</h1>
          <p className="text-sm text-[#5f6b76]">พบข้อมูลที่ตรงเงื่อนไข {totalCount} รายการ</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm font-semibold text-[#1f2933]"
          >
            <Download className="w-4 h-4 text-[#0f5c4d]" /> Export Excel (.csv)
          </a>
          <Link
            href="/cases/new"
            className="px-4 py-2 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold"
          >
            + สร้าง Case / ลงทะเบียน PI
          </Link>
        </div>
      </div>

      <form action="/cases" method="GET" className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#e5e9ed] text-sm">
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="ค้นหารหัส Case, PI, สินค้า, Brand..."
          className="border border-[#c7ced5] rounded-md px-3 py-1.5 w-60 text-[#1f2933]"
        />

        <select name="stage" defaultValue={filters.stage ?? ""} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
          <option value="">ทุกขั้นตอนหลัก</option>
          {STAGE_OPTIONS.map((st) => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
        </select>

        <select name="brandId" defaultValue={filters.brandId ?? ""} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
          <option value="">ทุก Brand</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>

        <select name="ownerId" defaultValue={filters.ownerId ?? ""} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
          <option value="">ผู้รับผิดชอบทุกคน</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <select name="timelineStatus" defaultValue={filters.timelineStatus ?? ""} className="border border-[#c7ced5] rounded-md px-2.5 py-1.5 bg-white text-[#1f2933]">
          <option value="">ทุกสถานะ Packaging</option>
          {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{BOARD_STATUS_LABELS[st]}</option>)}
        </select>

        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b91c1c] cursor-pointer">
          <input type="checkbox" name="overdueOnly" value="1" defaultChecked={filters.overdueOnly} className="accent-[#b91c1c]" />
          เฉพาะล่าช้า
        </label>

        <button
          type="submit"
          className="px-3.5 py-1.5 rounded-md bg-[#0f5c4d] hover:bg-[#0b483c] text-white text-sm font-semibold"
        >
          กรองข้อมูล
        </button>
        <Link
          href="/cases"
          className="px-3 py-1.5 rounded-md border border-[#c7ced5] bg-white hover:bg-[#f5f7f9] text-sm text-[#5f6b76]"
        >
          ล้างตัวกรอง
        </Link>
      </form>
    </section>
  );
}
