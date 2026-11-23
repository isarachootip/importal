import { ArtworkStageKind, PiFileSlot, RoleCode } from "@prisma/client";
import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const piFileSlotSchema = z.nativeEnum(PiFileSlot);
export const artworkStageKindSchema = z.nativeEnum(ArtworkStageKind);
export const roleCodeSchema = z.nativeEnum(RoleCode);

export const checklistAnswerInputSchema = z.object({
  checklistItemId: z.string().trim().min(1),
  checked: z.boolean(),
  note: z.string().trim().max(300).optional().nullable(),
});

export const updatePiSchema = z.object({
  piNumber: z.string().trim().min(2, "กรุณาระบุเลขที่ PI").max(80).optional(),
  piDate: z.string().regex(ISO_DATE_REGEX, "รูปแบบวันที่ PI ต้องเป็น YYYY-MM-DD").optional(),
  skuCount: z.coerce.number().int().min(1).max(5000).optional(),
  caseConfigId: z.string().trim().min(1).optional(),
  isMinorChange: z.boolean().optional(),
  isNewPhoto: z.boolean().optional(),
  requiresTisi: z.boolean().optional(),
  requiresFda: z.boolean().optional(),
  isTileImport: z.boolean().optional(),
  isNewBrandOrLogo: z.boolean().optional(),
  packagingTypeIds: z.array(z.string().trim().min(1)).optional(),
  checklistAnswers: z.array(checklistAnswerInputSchema).optional(),
});

export type UpdatePiInput = z.infer<typeof updatePiSchema>;

export const packagingTransitionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SUBMIT_PI") }),
  z.object({
    type: z.literal("PRE_QC_REJECT"),
    failedCodes: z.array(z.string().trim().min(1)).default([]),
    reason: z.string().trim().max(1000).optional(),
  }),
  z.object({
    type: z.literal("PRE_QC_ACCEPT"),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({ type: z.literal("UPLOAD_DRAFT_1") }),
  z.object({
    type: z.literal("APPROVE_STEP"),
    actingRole: roleCodeSchema,
    reason: z.string().trim().max(1000).optional(),
  }),
  z.object({
    type: z.literal("REQUEST_REVISION"),
    actingRole: roleCodeSchema,
    reason: z.string().trim().min(2, "กรุณาระบุรายละเอียดที่ต้องการแก้ไข").max(1000),
  }),
  z.object({ type: z.literal("SUBMIT_REVISION") }),
  z.object({ type: z.literal("SUBMIT_FINAL_REVISION") }),
  z.object({ type: z.literal("UPLOAD_FINAL_FILE") }),
]);

export type PackagingTransitionInput = z.infer<typeof packagingTransitionSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "กรุณาพิมพ์ข้อความคอมเมนต์").max(2000),
  artworkVersionId: z.string().trim().min(1).optional().nullable(),
  pinX: z.number().min(0).max(100).optional().nullable(),
  pinY: z.number().min(0).max(100).optional().nullable(),
  pageNumber: z.number().int().min(1).max(200).optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
