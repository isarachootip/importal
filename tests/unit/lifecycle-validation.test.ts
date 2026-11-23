import { describe, expect, it } from "vitest";
import {
  attachPiToCaseSchema,
  caseDocMetaSchema,
  createQuotationSchema,
  updateLogisticSchema,
  updatePoSchema,
  updateProductionSchema,
  updateSourcingSchema,
} from "@/lib/validations/lifecycle";

describe("Phase 5 lifecycle Zod schemas", () => {
  it("validates quotation input and coerces numeric fields", () => {
    const parsed = createQuotationSchema.parse({
      vendorName: "Shenzhen Lighting Factory",
      unitPrice: "12.45",
      currency: "USD",
      moq: "500",
      leadTimeDays: "45",
      incoterm: "FOB",
    });
    expect(parsed.unitPrice).toBe(12.45);
    expect(parsed.moq).toBe(500);
  });

  it("rejects negative unitPrice or invalid PO status", () => {
    expect(
      createQuotationSchema.safeParse({
        vendorName: "Factory A",
        unitPrice: -5,
        moq: 100,
        leadTimeDays: 30,
      }).success
    ).toBe(false);

    expect(updatePoSchema.safeParse({ poStatus: "INVALID_STATUS" }).success).toBe(false);
  });

  it("validates sourcing, attach PI, PO, production, logistic, and case document schemas", () => {
    expect(updateSourcingSchema.parse({ sourcingStatus: "APPROVED" }).sourcingStatus).toBe("APPROVED");

    const pi = attachPiToCaseSchema.parse({
      piNumber: "PI-2026-018",
      piDate: "2026-11-23",
      skuCount: 5,
      caseConfigId: "cfg_3",
      packagingTypeIds: ["pt_1"],
    });
    expect(pi.isMinorChange).toBe(false);

    expect(
      updatePoSchema.parse({
        poStatus: "PO_APPROVED",
        poNumber: "PO-2026-015",
        poTotalAmount: "45200.5",
        poCurrency: "USD",
      }).poTotalAmount
    ).toBe(45200.5);

    expect(updateProductionSchema.parse({ productionStatus: "QC_INSPECTION" }).productionStatus).toBe("QC_INSPECTION");

    const logi = updateLogisticSchema.parse({
      logisticStatus: "DEPARTED",
      shippingMode: "SEA_FCL",
      blOrAwbNumber: "COSU6348192010",
      etd: "2026-11-25",
      eta: "",
    });
    expect(logi.etd).toBe("2026-11-25");
    expect(logi.eta).toBeNull();

    expect(caseDocMetaSchema.parse({ stage: "LOGISTIC", docType: "FORM_E" }).docType).toBe("FORM_E");
  });
});
