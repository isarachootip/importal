import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/lib/auth/types";
import {
  buildCasesCsv,
  computeStepOverdueDays,
  isActionRequiredForUser,
  isDueWithinDays,
  type EnrichedCaseSummary,
} from "@/lib/domain/case-analytics";
import { caseFilterSchema } from "@/lib/validations/case-filters";

function makeCase(overrides?: Partial<EnrichedCaseSummary>): EnrichedCaseSummary {
  return {
    id: "c1",
    caseCode: "IP-2026-021",
    productTitle: 'ถังขยะ "สแตนเลส", 5L',
    brandId: "b_kassa",
    brandName: "Kassa Home",
    ownerId: "u_king",
    ownerName: "K.กิ่ง",
    currentStage: "PACKAGING",
    vendorName: "Ningbo Houseware",
    poPlanEnd: "2026-12-01",
    prodPlanEnd: "2027-01-25",
    logisticPlanEnd: "2027-02-14",
    packaging: {
      id: "p1",
      piNumber: "PI-2026-KSH-021",
      piDate: "2026-10-23",
      skuCount: 4,
      caseNumber: 2,
      caseConfigName: "Repeat SKU",
      currentStep: "PROOF_2",
      timelineStatus: "SENT_DRAFT_2",
      preQcRejectCount: 0,
      isMinorChange: false,
      stepPlannedEnd: "2026-11-20",
      packagingPlanEnd: "2026-12-08",
      pendingRoles: ["MER"],
      responsibleLabel: "MER",
      overdueDays: 3,
      isDueSoon: false,
    },
    ...overrides,
  };
}

describe("overdue and due-soon date calculations", () => {
  it("computes overdue days only when incomplete and past plannedEnd", () => {
    expect(computeStepOverdueDays("2026-11-20", null, "2026-11-23")).toBe(3);
    expect(computeStepOverdueDays("2026-11-23", null, "2026-11-23")).toBe(0);
    expect(computeStepOverdueDays("2026-11-20", "2026-11-21", "2026-11-23")).toBe(0);
  });

  it("detects due-within-N-days accurately", () => {
    expect(isDueWithinDays("2026-11-25", null, "2026-11-23", 3)).toBe(true);
    expect(isDueWithinDays("2026-11-23", null, "2026-11-23", 3)).toBe(true);
    expect(isDueWithinDays("2026-11-22", null, "2026-11-23", 3)).toBe(false);
    expect(isDueWithinDays("2026-11-28", null, "2026-11-23", 3)).toBe(false);
  });
});

describe("isActionRequiredForUser", () => {
  const merUser: SessionUser = {
    id: "u_mer",
    email: "mer@chg.co.th",
    name: "MER",
    thaiName: "MER",
    nickname: "MER",
    roles: ["MER"],
    ownedBrandIds: [],
  };
  const kingUser: SessionUser = {
    id: "u_king",
    email: "naparat@chg.co.th",
    name: "K.กิ่ง",
    thaiName: "ณภัทร",
    nickname: "K.กิ่ง",
    roles: ["IMPORT"],
    ownedBrandIds: ["b_kassa"],
  };
  const gdUser: SessionUser = {
    id: "u_gd",
    email: "gd@chg.co.th",
    name: "GD",
    thaiName: "Graphic",
    nickname: "GD",
    roles: ["GD"],
    ownedBrandIds: [],
  };

  it("matches pending approval role for MER and excludes non-pending IMPORT", () => {
    const item = makeCase();
    expect(isActionRequiredForUser(item, merUser)).toBe(true);
    expect(isActionRequiredForUser(item, kingUser)).toBe(false);
  });

  it("matches GD on PRE_QC / AW_DRAFT_1 and brand owner on INFO", () => {
    const preQcItem = makeCase({
      packaging: { ...makeCase().packaging!, currentStep: "PRE_QC", pendingRoles: [] },
    });
    expect(isActionRequiredForUser(preQcItem, gdUser)).toBe(true);
    expect(isActionRequiredForUser(preQcItem, merUser)).toBe(false);

    const infoItem = makeCase({
      packaging: { ...makeCase().packaging!, currentStep: "INFO", pendingRoles: [] },
    });
    expect(isActionRequiredForUser(infoItem, kingUser)).toBe(true);
    expect(isActionRequiredForUser(infoItem, gdUser)).toBe(false);
  });
});

describe("buildCasesCsv & caseFilterSchema", () => {
  it("generates UTF-8 BOM CSV with proper quote escaping", () => {
    const csv = buildCasesCsv([makeCase()]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"ถังขยะ ""สแตนเลส"", 5L"');
    expect(csv).toContain("IP-2026-021");
  });

  it("parses empty query strings cleanly into undefined", () => {
    const parsed = caseFilterSchema.parse({ q: "", stage: "", overdueOnly: "1", caseNumber: "5" });
    expect(parsed.q).toBeUndefined();
    expect(parsed.stage).toBeUndefined();
    expect(parsed.overdueOnly).toBe(true);
    expect(parsed.caseNumber).toBe(5);
  });
});
