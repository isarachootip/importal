import { describe, expect, it } from "vitest";
import {
  buildLeadTimeAlerts,
  calculatePackagingSchedule,
  distributeDesignDays,
  type CaseConfigInput,
} from "@/lib/domain/schedule-engine";

const DEFAULT_WEIGHTS = { aw: 7, p1: 2, r1: 3, p2: 2, r2: 3, p3: 2, r3: 3 };

const CASE_1: CaseConfigInput = {
  caseNumber: 1,
  infoDays: 2,
  designDays: 0,
  briefDays: 1,
  finalDays: 1,
  reviseFinalDays: 1,
  productionDays: 55,
  logisticDays: 20,
  designWeights: DEFAULT_WEIGHTS,
};

const CASE_2: CaseConfigInput = { ...CASE_1, caseNumber: 2, infoDays: 4, designDays: 15 };
const CASE_5: CaseConfigInput = { ...CASE_1, caseNumber: 5, infoDays: 9, designDays: 25 };
const CASE_6: CaseConfigInput = { ...CASE_1, caseNumber: 6, infoDays: 14, designDays: 30 };

const EMPTY_HOLIDAYS = new Set<string>();

describe("Packaging schedule engine (Case 1–6 business days)", () => {
  it("matches exact prompt example: Case 5, 6 SKUs, new photo -> info 16d, design 23d split 8/2/3/2/3/2/3", () => {
    const result = calculatePackagingSchedule({
      piDate: "2026-11-02", // Monday
      skuCount: 6,
      isNewPhoto: true,
      isMinorChange: false,
      minorChangeRuleEnabled: true,
      caseConfig: CASE_5,
      holidaySet: EMPTY_HOLIDAYS,
    });

    const daysByStep = Object.fromEntries(result.steps.map((s) => [s.stepKey, s.plannedDays]));
    expect(daysByStep.INFO).toBe(16);
    expect(daysByStep.PRE_QC).toBe(1);
    expect(daysByStep.AW_DRAFT_1).toBe(8);
    expect(daysByStep.PROOF_1).toBe(2);
    expect(daysByStep.REVISE_1).toBe(3);
    expect(daysByStep.PROOF_2).toBe(2);
    expect(daysByStep.REVISE_2).toBe(3);
    expect(daysByStep.PROOF_3).toBe(2);
    expect(daysByStep.REVISE_3).toBe(3);
    expect(daysByStep.APPROVE_GM_VP).toBe(1);
    expect(daysByStep.REVISE_FINAL).toBe(1);
    expect(result.steps.find((s) => s.stepKey === "REVISE_FINAL")?.isBuffer).toBe(true);
    expect(result.totalPackagingBusinessDays).toBe(16 + 25); // info + design (brief+dist+final)
  });

  it("adds +7 business days for every 30 SKUs on INFO step", () => {
    const res30 = calculatePackagingSchedule({
      piDate: "2026-11-02",
      skuCount: 30,
      isNewPhoto: false,
      isMinorChange: false,
      minorChangeRuleEnabled: true,
      caseConfig: CASE_2,
      holidaySet: EMPTY_HOLIDAYS,
    });
    const res65 = calculatePackagingSchedule({
      piDate: "2026-11-02",
      skuCount: 65,
      isNewPhoto: true,
      isMinorChange: false,
      minorChangeRuleEnabled: true,
      caseConfig: CASE_2,
      holidaySet: EMPTY_HOLIDAYS,
    });

    expect(res30.steps.find((s) => s.stepKey === "INFO")?.plannedDays).toBe(4 + 7);
    expect(res65.steps.find((s) => s.stepKey === "INFO")?.plannedDays).toBe(4 + 14 + 7);
  });

  it("uses shortcut path INFO -> PRE_QC -> FINAL for Case 1 (No Change AW)", () => {
    const res = calculatePackagingSchedule({
      piDate: "2026-11-02",
      skuCount: 5,
      isNewPhoto: false,
      isMinorChange: false,
      minorChangeRuleEnabled: true,
      caseConfig: CASE_1,
      holidaySet: EMPTY_HOLIDAYS,
    });

    const keys = res.steps.map((s) => s.stepKey);
    expect(keys).toEqual(["INFO", "PRE_QC", "APPROVE_GM_VP", "APPROVE_EVP", "REVISE_FINAL"]);
    expect(res.steps.find((s) => s.stepKey === "INFO")?.plannedDays).toBe(2);
  });

  it("skips EVP step when Repeat Order Minor Change is checked and rule is enabled", () => {
    const res = calculatePackagingSchedule({
      piDate: "2026-11-02",
      skuCount: 5,
      isNewPhoto: false,
      isMinorChange: true,
      minorChangeRuleEnabled: true,
      caseConfig: CASE_1,
      holidaySet: EMPTY_HOLIDAYS,
    });

    const keys = res.steps.map((s) => s.stepKey);
    expect(keys).not.toContain("APPROVE_EVP");
  });

  it("distributes Case 6 (30d - 2 = 28d) cleanly without losing any remainder day", () => {
    const dist = distributeDesignDays(CASE_6.designDays - 2, DEFAULT_WEIGHTS);
    const total = dist.aw + dist.p1 + dist.r1 + dist.p2 + dist.r2 + dist.p3 + dist.r3;
    expect(total).toBe(28);
    expect(dist).toEqual({ aw: 9, p1: 3, r1: 4, p2: 2, r2: 4, p3: 2, r3: 4 });
  });

  it("projects downstream PO (5d) + Production (55d) + Logistic (20d) calendar dates and builds alerts", () => {
    const res = calculatePackagingSchedule({
      piDate: "2026-11-02",
      skuCount: 5,
      isNewPhoto: false,
      isMinorChange: false,
      minorChangeRuleEnabled: true,
      caseConfig: CASE_1,
      holidaySet: EMPTY_HOLIDAYS,
      poDays: 5,
    });

    expect(res.downstream.poPlanEnd).toBeTruthy();
    expect(res.downstream.productionPlanEnd).toBeTruthy();
    expect(res.downstream.warehousePlanDate).toBeTruthy();

    const alerts = buildLeadTimeAlerts({
      requiresTisi: true,
      requiresFda: true,
      isTileImport: true,
      isNewBrandOrLogo: true,
    });
    expect(alerts).toHaveLength(4);
    expect(alerts.some((a) => a.code === "TISI")).toBe(true);
    expect(alerts.some((a) => a.code === "FDA")).toBe(true);
  });
});
