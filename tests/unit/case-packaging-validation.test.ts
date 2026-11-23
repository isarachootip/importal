import { describe, expect, it } from "vitest";
import { createCaseSchema, formatNextCaseCode } from "@/lib/validations/case";
import { createCommentSchema, packagingTransitionSchema, updatePiSchema } from "@/lib/validations/packaging";

describe("formatNextCaseCode", () => {
  it("starts at 001 when no codes exist for year", () => {
    expect(formatNextCaseCode(2026, [])).toBe("IP-2026-001");
  });

  it("increments from highest sequence in same year and ignores other years", () => {
    expect(formatNextCaseCode(2026, ["IP-2025-099", "IP-2026-004", "IP-2026-030", "IP-2026-021"])).toBe(
      "IP-2026-031"
    );
  });
});

describe("createCaseSchema", () => {
  it("validates a complete Case + PI registration payload", () => {
    const parsed = createCaseSchema.parse({
      productTitle: "ถังขยะสแตนเลส 12L",
      brandId: "brand_1",
      piNumber: "PI-2026-099",
      piDate: "2026-11-23",
      skuCount: "6",
      caseConfigId: "case_2",
      packagingTypeIds: ["pkg_1"],
    });
    expect(parsed.skuCount).toBe(6);
    expect(parsed.isNewPhoto).toBe(false);
  });

  it("rejects empty packaging types or bad date format", () => {
    const res = createCaseSchema.safeParse({
      productTitle: "สินค้า",
      brandId: "brand_1",
      piNumber: "PI-1",
      piDate: "23/11/2026",
      skuCount: 2,
      caseConfigId: "case_1",
      packagingTypeIds: [],
    });
    expect(res.success).toBe(false);
  });
});

describe("packagingTransitionSchema & updatePiSchema & createCommentSchema", () => {
  it("requires reason on REQUEST_REVISION", () => {
    const bad = packagingTransitionSchema.safeParse({
      type: "REQUEST_REVISION",
      actingRole: "MER",
      reason: "",
    });
    expect(bad.success).toBe(false);

    const ok = packagingTransitionSchema.safeParse({
      type: "REQUEST_REVISION",
      actingRole: "MER",
      reason: "ปรับขนาดบาร์โค้ด",
    });
    expect(ok.success).toBe(true);
  });

  it("validates partial PI updates and pin comments", () => {
    expect(updatePiSchema.parse({ skuCount: 15, isMinorChange: true }).skuCount).toBe(15);
    const pin = createCommentSchema.parse({
      body: "ขยับโลโก้ขึ้น 2mm",
      artworkVersionId: "art_1",
      pinX: 42.5,
      pinY: 18.2,
    });
    expect(pin.pinX).toBe(42.5);
  });
});
