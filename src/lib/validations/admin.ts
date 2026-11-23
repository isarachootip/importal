import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const adminMasterMutationSchema = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("BRAND_UPDATE"),
    id: z.string().trim().min(1),
    ownerId: z.string().trim().nullable(),
    isActive: z.boolean().optional(),
  }),
  z.object({
    entity: z.literal("BRAND_CREATE"),
    code: z.string().trim().min(2).max(30),
    name: z.string().trim().min(2).max(100),
    groupName: z.string().trim().min(2).max(100),
    ownerId: z.string().trim().nullable().optional(),
  }),
  z.object({
    entity: z.literal("CASE_CONFIG_UPDATE"),
    id: z.string().trim().min(1),
    infoDays: z.coerce.number().int().min(0).max(120),
    designDays: z.coerce.number().int().min(0).max(120),
    productionDays: z.coerce.number().int().min(1).max(365),
    logisticDays: z.coerce.number().int().min(1).max(180),
  }),
  z.object({
    entity: z.literal("APPROVAL_RULE_TOGGLE"),
    id: z.string().trim().min(1),
    isEnabled: z.boolean(),
  }),
  z.object({
    entity: z.literal("HOLIDAY_CREATE"),
    date: z.string().regex(ISO_DATE_REGEX, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
    nameTh: z.string().trim().min(2, "กรุณาระบุชื่อวันหยุด").max(150),
    isSubstitute: z.boolean().default(false),
  }),
  z.object({
    entity: z.literal("HOLIDAY_DELETE"),
    id: z.string().trim().min(1),
  }),
  z.object({
    entity: z.literal("SYSTEM_SETTING_UPDATE"),
    key: z.string().trim().min(1),
    value: z.union([z.boolean(), z.number(), z.string()]),
  }),
]);

export type AdminMasterMutationInput = z.infer<typeof adminMasterMutationSchema>;
