import type { ImportStage, PackagingStepKey, RoleCode, TimelineBoardStatus } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/types";
import { BOARD_STATUS_LABELS, ROLE_LABELS, STAGE_LABELS } from "@/lib/domain/packaging-labels";
import { formatDateShort } from "@/lib/utils/date-th";

export interface EnrichedCaseSummary {
  id: string;
  caseCode: string;
  productTitle: string;
  brandId: string;
  brandName: string;
  ownerId: string;
  ownerName: string;
  currentStage: ImportStage;
  vendorName: string | null;
  poPlanEnd: string | null;
  prodPlanEnd: string | null;
  logisticPlanEnd: string | null;
  packaging: {
    id: string;
    piNumber: string;
    piDate: string;
    skuCount: number;
    caseNumber: number;
    caseConfigName: string;
    currentStep: PackagingStepKey;
    timelineStatus: TimelineBoardStatus;
    preQcRejectCount: number;
    isMinorChange: boolean;
    stepPlannedEnd: string | null;
    packagingPlanEnd: string | null;
    pendingRoles: RoleCode[];
    responsibleLabel: string;
    overdueDays: number;
    isDueSoon: boolean;
  } | null;
}

const MS_PER_DAY = 86_400_000;

function parseIsoDayUtc(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1);
}

export function computeStepOverdueDays(
  plannedEndIso: string | null | undefined,
  actualEndIso: string | null | undefined,
  todayIso: string
): number {
  if (!plannedEndIso || actualEndIso) return 0;
  const diffMs = parseIsoDayUtc(todayIso) - parseIsoDayUtc(plannedEndIso);
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / MS_PER_DAY);
}

export function isDueWithinDays(
  plannedEndIso: string | null | undefined,
  actualEndIso: string | null | undefined,
  todayIso: string,
  days = 3
): boolean {
  if (!plannedEndIso || actualEndIso) return false;
  const diffDays = Math.floor((parseIsoDayUtc(plannedEndIso) - parseIsoDayUtc(todayIso)) / MS_PER_DAY);
  return diffDays >= 0 && diffDays <= days;
}

export function deriveResponsibleLabel(
  step: PackagingStepKey,
  pendingRoles: readonly RoleCode[]
): string {
  if (pendingRoles.length > 0) {
    return pendingRoles.map((r) => ROLE_LABELS[r]).join(" / ");
  }
  if (step === "INFO") return "Import";
  if (step === "COMPLETED") return "เสร็จสิ้น";
  return "Graphic";
}

export function isActionRequiredForUser(
  item: EnrichedCaseSummary,
  user: SessionUser | null
): boolean {
  if (!user || !item.packaging) return false;
  const { currentStep, pendingRoles } = item.packaging;
  if (currentStep === "COMPLETED") return false;

  const isAdmin = user.roles.includes("ADMIN");
  const ownsCase = item.ownerId === user.id || user.ownedBrandIds.includes(item.brandId);

  if (currentStep === "INFO") {
    return isAdmin || (user.roles.includes("IMPORT") && ownsCase);
  }

  if (pendingRoles.length > 0) {
    return pendingRoles.some((role) => {
      if (isAdmin) return true;
      if (!user.roles.includes(role)) return false;
      if (role === "IMPORT") return ownsCase;
      return true;
    });
  }

  // GD working steps: PRE_QC, AW_DRAFT_1, REVISE_1..3, REVISE_FINAL, FINAL_FILE
  return isAdmin || user.roles.includes("GD");
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCasesCsv(rows: readonly EnrichedCaseSummary[]): string {
  const headers = [
    "รหัส Case",
    "สินค้า",
    "Brand",
    "ผู้รับผิดชอบ",
    "โรงงาน",
    "ขั้นตอนหลัก",
    "เลขที่ PI",
    "วันที่ PI",
    "Case ประเภทงาน",
    "SKU",
    "สถานะ Packaging",
    "ผู้รับผิดชอบขั้นนี้",
    "กำหนดขั้นนี้",
    "ล่าช้า (วัน)",
    "แผนเสร็จ Packaging",
    "แผนเข้าคลัง (WH)",
    "Pre QC ตีกลับ (ครั้ง)",
  ];

  const lines = [headers.map(escapeCsvCell).join(",")];

  for (const r of rows) {
    const p = r.packaging;
    const cells = [
      r.caseCode,
      r.productTitle,
      r.brandName,
      r.ownerName,
      r.vendorName ?? "",
      STAGE_LABELS[r.currentStage],
      p?.piNumber ?? "",
      p ? formatDateShort(p.piDate) : "",
      p ? `Case ${p.caseNumber}: ${p.caseConfigName}` : "",
      p?.skuCount ?? "",
      p ? BOARD_STATUS_LABELS[p.timelineStatus] : "",
      p?.responsibleLabel ?? "",
      p ? formatDateShort(p.stepPlannedEnd) : "",
      p?.overdueDays ?? 0,
      p ? formatDateShort(p.packagingPlanEnd) : "",
      formatDateShort(r.logisticPlanEnd),
      p?.preQcRejectCount ?? 0,
    ];
    lines.push(cells.map(escapeCsvCell).join(","));
  }

  return `\uFEFF${lines.join("\r\n")}`;
}
