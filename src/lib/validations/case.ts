import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createCaseSchema = z.object({
  productTitle: z.string().trim().min(2, "กรุณาระบุชื่อสินค้าอย่างน้อย 2 ตัวอักษร").max(200),
  brandId: z.string().trim().min(1, "กรุณาเลือก Brand"),
  subclassId: z.string().trim().optional().nullable(),
  vendorId: z.string().trim().optional().nullable(),
  isNewPhoto: z.boolean().default(false),
  requiresTisi: z.boolean().default(false),
  requiresFda: z.boolean().default(false),
  isTileImport: z.boolean().default(false),
  isNewBrandOrLogo: z.boolean().default(false),
  piNumber: z.string().trim().min(2, "กรุณาระบุเลขที่ PI").max(80),
  piDate: z.string().regex(ISO_DATE_REGEX, "รูปแบบวันที่ PI ต้องเป็น YYYY-MM-DD"),
  skuCount: z.coerce.number().int().min(1, "จำนวน SKU ต้องมากกว่า 0").max(5000),
  caseConfigId: z.string().trim().min(1, "กรุณาเลือกประเภทงาน (Case 1-6)"),
  packagingTypeIds: z.array(z.string().trim().min(1)).min(1, "กรุณาเลือกรูปแบบ Packaging อย่างน้อย 1 รายการ"),
  isMinorChange: z.boolean().default(false),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export function formatNextCaseCode(year: number, existingCodes: readonly string[]): string {
  const prefix = `IP-${year}-`;
  let maxSeq = 0;
  for (const code of existingCodes) {
    if (!code.startsWith(prefix)) continue;
    const parsed = Number.parseInt(code.slice(prefix.length), 10);
    if (Number.isFinite(parsed) && parsed > maxSeq) {
      maxSeq = parsed;
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}
