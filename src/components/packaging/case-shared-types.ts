import type { CaseDocType, ImportStage, RoleCode } from "@prisma/client";

export interface UserBriefDto {
  id: string;
  thaiName: string | null;
  nickname: string | null;
}

export interface QuotationDto {
  id: string;
  vendorId: string | null;
  vendorName: string;
  unitPrice: number;
  currency: string;
  moq: number;
  leadTimeDays: number;
  incoterm: string;
  notes: string | null;
  isSelected: boolean;
  createdAt: string;
}

export interface CaseDocumentDto {
  id: string;
  stage: ImportStage;
  docType: CaseDocType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: UserBriefDto;
}

export interface AuditEventDto {
  id: string;
  actorRole: RoleCode;
  stage: ImportStage;
  stepKey: string | null;
  action: string;
  reason: string | null;
  createdAt: string;
  actor: UserBriefDto;
}
