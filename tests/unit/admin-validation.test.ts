import { describe, expect, it } from "vitest";
import { adminMasterMutationSchema } from "@/lib/validations/admin";

describe("adminMasterMutationSchema", () => {
  it("validates brand update, case config update, approval rule toggle, and holiday create", () => {
    expect(
      adminMasterMutationSchema.parse({ entity: "BRAND_UPDATE", id: "b1", ownerId: null, isActive: true }).entity
    ).toBe("BRAND_UPDATE");

    const cfg = adminMasterMutationSchema.parse({
      entity: "CASE_CONFIG_UPDATE",
      id: "cfg1",
      infoDays: "9",
      designDays: "25",
      productionDays: "55",
      logisticDays: "20",
    });
    expect(cfg.entity === "CASE_CONFIG_UPDATE" && cfg.designDays).toBe(25);

    expect(
      adminMasterMutationSchema.parse({ entity: "APPROVAL_RULE_TOGGLE", id: "r1", isEnabled: true }).entity
    ).toBe("APPROVAL_RULE_TOGGLE");

    expect(
      adminMasterMutationSchema.parse({ entity: "HOLIDAY_CREATE", date: "2027-01-01", nameTh: "วันขึ้นปีใหม่" }).entity
    ).toBe("HOLIDAY_CREATE");
  });

  it("rejects malformed holiday dates", () => {
    expect(
      adminMasterMutationSchema.safeParse({ entity: "HOLIDAY_CREATE", date: "01/01/2027", nameTh: "วันขึ้นปีใหม่" })
        .success
    ).toBe(false);
  });
});
