import type { PackagingStepKey } from "@prisma/client";
import { addBusinessDays, addCalendarDays } from "./business-days";

export interface DesignWeights {
  aw: number;
  p1: number;
  r1: number;
  p2: number;
  r2: number;
  p3: number;
  r3: number;
}

export interface CaseConfigInput {
  caseNumber: number;
  infoDays: number;
  designDays: number;
  briefDays: number;
  finalDays: number;
  reviseFinalDays: number;
  productionDays: number;
  logisticDays: number;
  designWeights: DesignWeights;
}

export interface ScheduleInput {
  piDate: string; // YYYY-MM-DD
  skuCount: number;
  isNewPhoto: boolean;
  isMinorChange: boolean;
  minorChangeRuleEnabled: boolean;
  caseConfig: CaseConfigInput;
  holidaySet: ReadonlySet<string>;
  skuBatchSize?: number;
  skuBatchExtraDays?: number;
  newPhotoExtraDays?: number;
  poDays?: number;
}

export interface PlannedStepItem {
  stepKey: PackagingStepKey;
  plannedDays: number;
  plannedStart: string;
  plannedEnd: string;
  isBuffer: boolean;
}

export interface PackagingScheduleResult {
  steps: PlannedStepItem[];
  totalPackagingBusinessDays: number;
  packagingPlanEnd: string;
  downstream: {
    poPlanEnd: string;
    productionPlanEnd: string;
    warehousePlanDate: string;
  };
}

export interface LeadTimeAlert {
  code: "TISI" | "FDA" | "TILE" | "NEW_BRAND";
  severity: "warning" | "info";
  messageTh: string;
}

const REMAINDER_PRIORITY: Array<keyof DesignWeights> = ["aw", "r1", "r2", "r3", "p1", "p2", "p3"];

export function distributeDesignDays(distributableDays: number, weights: DesignWeights): DesignWeights {
  const keys: Array<keyof DesignWeights> = ["aw", "p1", "r1", "p2", "r2", "p3", "r3"];
  const totalWeight = keys.reduce((sum, k) => sum + weights[k], 0);
  const safeTotal = Math.max(keys.length, distributableDays);

  const alloc: DesignWeights = { aw: 1, p1: 1, r1: 1, p2: 1, r2: 1, p3: 1, r3: 1 };
  let allocated = 0;

  for (const key of keys) {
    const raw = totalWeight > 0 ? Math.floor((safeTotal * weights[key]) / totalWeight) : 1;
    alloc[key] = Math.max(1, raw);
    allocated += alloc[key];
  }

  let remainder = safeTotal - allocated;
  let idx = 0;
  while (remainder > 0) {
    const key = REMAINDER_PRIORITY[idx % REMAINDER_PRIORITY.length]!;
    alloc[key] += 1;
    remainder -= 1;
    idx += 1;
  }

  return alloc;
}

export function calculatePackagingSchedule(input: ScheduleInput): PackagingScheduleResult {
  const skuBatchSize = input.skuBatchSize ?? 30;
  const skuBatchExtraDays = input.skuBatchExtraDays ?? 7;
  const newPhotoExtraDays = input.newPhotoExtraDays ?? 7;
  const poDays = input.poDays ?? 5;
  const { caseConfig, holidaySet } = input;

  const skuBatches = skuBatchSize > 0 ? Math.floor(Math.max(0, input.skuCount) / skuBatchSize) : 0;
  const infoDays = caseConfig.infoDays + skuBatches * skuBatchExtraDays + (input.isNewPhoto ? newPhotoExtraDays : 0);
  const skipEvp = input.isMinorChange && input.minorChangeRuleEnabled;
  const isCase1Shortcut = caseConfig.caseNumber === 1 || caseConfig.designDays === 0;

  const sequence: Array<{ stepKey: PackagingStepKey; days: number; isBuffer?: boolean }> = [
    { stepKey: "INFO", days: infoDays },
    { stepKey: "PRE_QC", days: caseConfig.briefDays },
  ];

  if (!isCase1Shortcut) {
    const distributable = Math.max(7, caseConfig.designDays - (caseConfig.briefDays + caseConfig.finalDays));
    const dist = distributeDesignDays(distributable, caseConfig.designWeights);
    sequence.push(
      { stepKey: "AW_DRAFT_1", days: dist.aw },
      { stepKey: "PROOF_1", days: dist.p1 },
      { stepKey: "REVISE_1", days: dist.r1 },
      { stepKey: "PROOF_2", days: dist.p2 },
      { stepKey: "REVISE_2", days: dist.r2 },
      { stepKey: "PROOF_3", days: dist.p3 },
      { stepKey: "REVISE_3", days: dist.r3 }
    );
  }

  sequence.push({ stepKey: "APPROVE_GM_VP", days: caseConfig.finalDays });
  if (!skipEvp) {
    sequence.push({ stepKey: "APPROVE_EVP", days: caseConfig.finalDays });
  }
  sequence.push({ stepKey: "REVISE_FINAL", days: caseConfig.reviseFinalDays, isBuffer: true });

  const steps: PlannedStepItem[] = [];
  let cursor = input.piDate;
  let mainBusinessDays = 0;

  for (const item of sequence) {
    const start = cursor;
    const end = addBusinessDays(start, item.days, holidaySet);
    const isBuffer = Boolean(item.isBuffer);
    steps.push({ stepKey: item.stepKey, plannedDays: item.days, plannedStart: start, plannedEnd: end, isBuffer });
    if (!isBuffer) {
      cursor = end;
      if (item.stepKey !== "APPROVE_EVP" || isCase1Shortcut) {
        mainBusinessDays += item.days;
      }
    }
  }

  const packagingPlanEnd = cursor;
  const poPlanEnd = addCalendarDays(packagingPlanEnd, poDays);
  const productionPlanEnd = addCalendarDays(poPlanEnd, caseConfig.productionDays);
  const warehousePlanDate = addCalendarDays(productionPlanEnd, caseConfig.logisticDays);

  return {
    steps,
    totalPackagingBusinessDays: isCase1Shortcut ? mainBusinessDays : infoDays + caseConfig.designDays,
    packagingPlanEnd,
    downstream: { poPlanEnd, productionPlanEnd, warehousePlanDate },
  };
}

export function buildLeadTimeAlerts(flags: {
  requiresTisi: boolean;
  requiresFda: boolean;
  isTileImport: boolean;
  isNewBrandOrLogo: boolean;
}): LeadTimeAlert[] {
  const alerts: LeadTimeAlert[] = [];
  if (flags.requiresTisi) {
    alerts.push({ code: "TISI", severity: "warning", messageTh: "สินค้าขอ มอก./TISI (โรงงานหรือสินค้า) อาจใช้เวลามากกว่าปกติ > 90 วัน (ไม่รวมในแผน)" });
  }
  if (flags.requiresFda) {
    alerts.push({ code: "FDA", severity: "warning", messageTh: "สินค้าขอใบอนุญาต อย. อาจใช้เวลามากกว่าปกติ > 60 วัน (ไม่รวมในแผน)" });
  }
  if (flags.isTileImport) {
    alerts.push({ code: "TILE", severity: "info", messageTh: "กระเบื้องจากอินเดีย / จีน ขั้น Inspection + Logistic มีระยะเวลาบวกเพิ่ม" });
  }
  if (flags.isNewBrandOrLogo) {
    alerts.push({ code: "NEW_BRAND", severity: "warning", messageTh: "New Brand / New Logo ต้องขออนุมัติให้เรียบร้อยก่อนอนุมัติ PI" });
  }
  return alerts;
}
