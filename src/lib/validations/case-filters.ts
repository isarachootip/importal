import { ImportStage, TimelineBoardStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const caseFilterSchema = z.object({
  q: z.preprocess(emptyToUndef, z.string().trim().max(120).optional()),
  stage: z.preprocess(emptyToUndef, z.nativeEnum(ImportStage).optional()),
  brandId: z.preprocess(emptyToUndef, z.string().trim().optional()),
  ownerId: z.preprocess(emptyToUndef, z.string().trim().optional()),
  timelineStatus: z.preprocess(emptyToUndef, z.nativeEnum(TimelineBoardStatus).optional()),
  caseNumber: z.preprocess(emptyToUndef, z.coerce.number().int().min(1).max(6).optional()),
  overdueOnly: z
    .preprocess((v) => v === "1" || v === "true" || v === true, z.boolean())
    .optional()
    .default(false),
});

export type CaseFilterInput = z.infer<typeof caseFilterSchema>;
