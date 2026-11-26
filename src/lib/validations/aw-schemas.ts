import { z } from "zod";
import { BU_LIST, LICENSE_LIST } from "@/lib/domain/aw-constants";

const httpUrlRegex = /^https?:\/\/\S+$/i;

export const JobFormSchema = z
  .object({
    pi: z.string().trim().min(1, "กรุณาระบุ PI Number").max(80),
    piDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาระบุ PI approval date"),
    bu: z.enum(BU_LIST),
    supplier: z.string().trim().min(1, "กรุณาระบุชื่อ Supplier").max(160),
    brand: z.string().trim().min(1, "กรุณาเลือก House Brand").max(120),
    pattern: z.number().int().min(2).max(5),
    sdepts: z.array(z.number().int().positive()).min(1, "กรุณาเลือก Sdept & Sdept Name 1").max(3),
    items: z.number().int().min(1).max(10000),
    license: z.enum(LICENSE_LIST),
    designer: z.string().trim().min(1),
    brief: z.enum(["Y", "N"], { errorMap: () => ({ message: "กรุณาเลือกว่าต้องประชุม Brief กับ Designer หรือไม่ (Y/N)" }) }),
    packages: z.array(z.string().trim().min(1)).default([]),
    folder: z.string().trim().regex(httpUrlRegex, "กรุณากรอก Link Share Folder (ขึ้นต้นด้วย http:// หรือ https://)"),
  })
  .refine((v) => new Set(v.sdepts).size === v.sdepts.length, {
    message: "เลือก Sdept ซ้ำกัน",
    path: ["sdepts"],
  });

const UploadedFileMetaSchema = z.object({
  name: z.string().min(1),
  storageKey: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
});

const SkuEntrySchema = z.object({
  sku: z.string().trim().min(1),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const TransitionActionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("check"),
    designer: z.string().trim().min(1),
    brief: z.enum(["Y", "N"]),
    availablePhoto: z.enum(["Yes", "No"]),
    missingItems: z.array(z.string()),
    note: z.string().max(1000).default(""),
  }),
  z.object({ kind: z.literal("photo"), note: z.string().max(1000).default("") }),
  z.object({ kind: z.literal("more"), note: z.string().max(1000).default("") }),
  z.object({
    kind: z.literal("draft"),
    linkUrl: z.string().trim().optional().default(""),
    uploadedFiles: z.array(UploadedFileMetaSchema).default([]),
    note: z.string().max(1000).default(""),
  }),
  z.object({
    kind: z.literal("imp"),
    result: z.enum(["pass", "fail"]),
    reason: z.string().optional().default(""),
    linkUrl: z.string().trim().optional().default(""),
    uploadedFiles: z.array(UploadedFileMetaSchema).default([]),
    note: z.string().max(1000).default(""),
  }),
  z.object({
    kind: z.literal("mdsg"),
    result: z.enum(["pass", "fail"]),
    reason: z.string().optional().default(""),
    reviewerComments: z.array(z.string()).default([]),
    linkUrl: z.string().trim().optional().default(""),
    uploadedFiles: z.array(UploadedFileMetaSchema).default([]),
    note: z.string().max(1000).default(""),
  }),
  z.object({
    kind: z.literal("present"),
    linkUrl: z.string().trim().optional().default(""),
    uploadedFiles: z.array(UploadedFileMetaSchema).default([]),
    note: z.string().max(1000).default(""),
  }),
  z.object({
    kind: z.literal("evp"),
    result: z.enum(["pass", "fail"]),
    reason: z.string().optional().default(""),
    linkUrl: z.string().trim().optional().default(""),
    uploadedFiles: z.array(UploadedFileMetaSchema).default([]),
    note: z.string().max(1000).default(""),
  }),
  z.object({
    kind: z.literal("evpfix"),
    linkUrl: z.string().trim().optional().default(""),
    uploadedFiles: z.array(UploadedFileMetaSchema).default([]),
    note: z.string().max(1000).default(""),
  }),
  z.object({
    kind: z.literal("final"),
    uploadedFiles: z.array(UploadedFileMetaSchema).default([]),
    note: z.string().max(1000).default(""),
  }),
  z.object({
    kind: z.literal("factory"),
    leadtime: z.number().int().min(1).max(365),
    poNumber: z.string().trim().max(80).optional().default(""),
    skuFileName: z.string().trim().min(1),
    skuStorageKey: z.string().nullable().optional(),
    skus: z.array(SkuEntrySchema).min(1, "กรุณา Upload SKU number อย่างน้อย 1 รายการ"),
    note: z.string().max(1000).default(""),
  }),
  z.object({ kind: z.literal("grSync") }),
  z.object({
    kind: z.literal("cancel"),
    reason: z.string().trim().min(1),
    note: z.string().max(1000).default(""),
  }),
]);

export const SessionSwitchSchema = z.object({
  role: z.enum(["import", "mdsg", "evp", "designer", "photographer", "mgmt"]),
  userDisplayName: z.string().trim().optional(),
});

export const DraftSaveSchema = z.object({
  key: z.string().trim().min(1).max(160),
  values: z.record(z.string(), z.union([z.string(), z.boolean()])),
  fileNames: z.array(z.string()).default([]),
});

export const HolidaysSaveSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  resetDefault: z.boolean().optional(),
});

export const ReviewSaveSchema = z.object({
  key: z.string().trim().min(1).max(120),
  status: z.string().max(60),
  note: z.string().max(500),
});

export const NotifModeUpdateSchema = z.object({
  eventKey: z.string().trim().min(1),
  mode: z.enum(["ทันที", "สรุปรายวัน", "ปิด"]),
});
