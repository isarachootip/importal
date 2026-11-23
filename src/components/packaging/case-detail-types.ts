import type {
  ApprovalDecision,
  ArtworkStageKind,
  ChecklistCategory,
  ImportStage,
  LogisticStatus,
  PackagingStepKey,
  PiFileSlot,
  PoStatus,
  PreQcDecision,
  ProductionStatus,
  RoleCode,
  SourcingStatus,
  TimelineBoardStatus,
} from "@prisma/client";
import type { LeadTimeAlert } from "@/lib/domain/schedule-engine";
import type { AuditEventDto, CaseDocumentDto, QuotationDto, UserBriefDto } from "./case-shared-types";

export type { AuditEventDto, CaseDocumentDto, QuotationDto, UserBriefDto } from "./case-shared-types";

export interface ScheduleStepDto {
  id: string;
  stepKey: PackagingStepKey;
  plannedDays: number;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  isBuffer: boolean;
}

export interface PiFileDto {
  id: string;
  slot: PiFileSlot;
  version: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: UserBriefDto;
}

export interface ChecklistItemDto {
  id: string;
  category: ChecklistCategory;
  code: string;
  labelTh: string;
  isRequired: boolean;
  sortOrder: number;
}

export interface ChecklistAnswerDto {
  checklistItemId: string;
  checked: boolean;
  note: string | null;
}

export interface PreQcReviewDto {
  id: string;
  round: number;
  decision: PreQcDecision;
  failedCodes: string[];
  note: string | null;
  createdAt: string;
  reviewer: UserBriefDto;
}

export interface ArtworkDto {
  id: string;
  stageKind: ArtworkStageKind;
  version: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: UserBriefDto;
}

export interface ApprovalDto {
  id: string;
  stepKey: PackagingStepKey;
  round: number;
  stepOrder: number;
  role: RoleCode;
  decision: ApprovalDecision;
  reason: string | null;
  actedAt: string | null;
  actedBy: UserBriefDto | null;
}

export interface CommentDto {
  id: string;
  artworkVersionId: string | null;
  authorRole: RoleCode;
  body: string;
  pinNumber: number | null;
  pinX: number | null;
  pinY: number | null;
  pageNumber: number | null;
  createdAt: string;
  author: UserBriefDto;
}

export interface PackagingJobDto {
  id: string;
  piNumber: string;
  piDate: string;
  skuCount: number;
  caseConfigId: string;
  caseNumber: number;
  caseConfigName: string;
  currentStep: PackagingStepKey;
  timelineStatus: TimelineBoardStatus;
  isMinorChange: boolean;
  preQcRejectCount: number;
  packagingTypeIds: string[];
  packagingTypeNames: string[];
  scheduleSteps: ScheduleStepDto[];
  piFiles: PiFileDto[];
  checklistAnswers: ChecklistAnswerDto[];
  preQcReviews: PreQcReviewDto[];
  artworks: ArtworkDto[];
  approvals: ApprovalDto[];
  comments: CommentDto[];
}

export interface CaseDetailDto {
  id: string;
  caseCode: string;
  productTitle: string;
  brandId: string;
  brandName: string;
  owner: UserBriefDto;
  subclassName: string | null;
  vendorName: string | null;
  currentStage: ImportStage;
  sourcingStatus: SourcingStatus;
  poStatus: PoStatus;
  productionStatus: ProductionStatus;
  logisticStatus: LogisticStatus;
  isNewPhoto: boolean;
  requiresTisi: boolean;
  requiresFda: boolean;
  isTileImport: boolean;
  isNewBrandOrLogo: boolean;
  sourcingPlanEnd: string | null;
  sourcingActualEnd: string | null;
  poPlanEnd: string | null;
  poActualEnd: string | null;
  prodPlanEnd: string | null;
  prodActualEnd: string | null;
  logisticPlanEnd: string | null;
  logisticActualEnd: string | null;
  poNumber: string | null;
  poTotalAmount: number | null;
  poCurrency: string | null;
  incoterm: string | null;
  shippingMode: string | null;
  forwarderName: string | null;
  blOrAwbNumber: string | null;
  containerNumber: string | null;
  etd: string | null;
  eta: string | null;
  whIssueNote: string | null;
  closedAt: string | null;
  quotations: QuotationDto[];
  documents: CaseDocumentDto[];
  packaging: PackagingJobDto | null;
  auditEvents: AuditEventDto[];
  leadTimeAlerts: LeadTimeAlert[];
}

export interface MasterOptionsDto {
  caseConfigs: Array<{ id: string; caseNumber: number; name: string; infoDays: number; designDays: number }>;
  packagingTypes: Array<{ id: string; code: string; nameTh: string }>;
  checklists: ChecklistItemDto[];
}
