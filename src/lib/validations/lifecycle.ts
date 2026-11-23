import {
  CaseDocType,
  ImportStage,
  LogisticStatus,
  PoStatus,
  ProductionStatus,
  SourcingStatus,
} from "@prisma/client";
import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const optionalIsoDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v ?? null))
  .refine((v) => v === null || ISO_DATE_REGEX.test(v), "รูปแบบวันที่ต้องเป็น YYYY-MM-DD");

export const createQuotationSchema = z.object({
  vendorId: z.string().trim().optional().nullable(),
  vendorName: z.string().trim().min(2, "กรุณาระบุชื่อโรงงาน").max(150),
  unitPrice: z.coerce.number().positive("ราคาต่อหน่วยต้องมากกว่า 0"),
  currency: z.enum(["USD", "CNY", "THB", "EUR"]).default("USD"),
  moq: z.coerce.number().int().min(1, "MOQ ต้องมากกว่า 0"),
  leadTimeDays: z.coerce.number().int().min(1, "Lead Time ต้องมากกว่า 0").max(365),
  incoterm: z.enum(["EXW", "FOB", "CIF", "CFR", "DDP"]).default("FOB"),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

export const updateSourcingSchema = z.object({
  sourcingStatus: z.nativeEnum(SourcingStatus).optional(),
  selectQuotationId: z.string().trim().min(1).optional(),
  sourcingPlanEnd: optionalIsoDate,
  note: z.string().trim().max(500).optional(),
});

export type UpdateSourcingInput = z.infer<typeof updateSourcingSchema>;

export const attachPiToCaseSchema = z.object({
  piNumber: z.string().trim().min(2, "กรุณาระบุเลขที่ PI").max(80),
  piDate: z.string().regex(ISO_DATE_REGEX, "รูปแบบวันที่ PI ต้องเป็น YYYY-MM-DD"),
  skuCount: z.coerce.number().int().min(1).max(5000),
  caseConfigId: z.string().trim().min(1, "กรุณาเลือก Case 1-6"),
  packagingTypeIds: z.array(z.string().trim().min(1)).min(1, "กรุณาเลือกรูปแบบ Packaging อย่างน้อย 1 รายการ"),
  isMinorChange: z.boolean().default(false),
});

export type AttachPiToCaseInput = z.infer<typeof attachPiToCaseSchema>;

export const updatePoSchema = z.object({
  poStatus: z.nativeEnum(PoStatus),
  poNumber: z.string().trim().max(80).optional().nullable(),
  poTotalAmount: z.coerce.number().positive().optional().nullable(),
  poCurrency: z.enum(["USD", "CNY", "THB", "EUR"]).optional(),
  incoterm: z.enum(["EXW", "FOB", "CIF", "CFR", "DDP"]).optional().nullable(),
  note: z.string().trim().max(500).optional(),
});

export type UpdatePoInput = z.infer<typeof updatePoSchema>;

export const updateProductionSchema = z.object({
  productionStatus: z.nativeEnum(ProductionStatus),
  note: z.string().trim().max(500).optional(),
});

export type UpdateProductionInput = z.infer<typeof updateProductionSchema>;

export const updateLogisticSchema = z.object({
  logisticStatus: z.nativeEnum(LogisticStatus),
  shippingMode: z.enum(["SEA_FCL", "SEA_LCL", "AIR", "TRUCK"]).optional().nullable(),
  forwarderName: z.string().trim().max(150).optional().nullable(),
  blOrAwbNumber: z.string().trim().max(100).optional().nullable(),
  containerNumber: z.string().trim().max(100).optional().nullable(),
  etd: optionalIsoDate,
  eta: optionalIsoDate,
  whIssueNote: z.string().trim().max(1000).optional().nullable(),
  note: z.string().trim().max(500).optional(),
});

export type UpdateLogisticInput = z.infer<typeof updateLogisticSchema>;

export const caseDocMetaSchema = z.object({
  stage: z.nativeEnum(ImportStage),
  docType: z.nativeEnum(CaseDocType),
});
