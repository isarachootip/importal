-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('YOUR_TURN', 'PRE_QC_REJECTED', 'REVISION_REQUESTED', 'APPROVED', 'OVERDUE_DIGEST');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('IMPORT', 'MER', 'GD', 'GM', 'VP', 'EVP', 'VENDOR', 'FORWARDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ImportStage" AS ENUM ('SOURCING', 'PACKAGING', 'PURCHASE_ORDER', 'PRODUCTION', 'LOGISTIC', 'CLOSED');

-- CreateEnum
CREATE TYPE "SourcingStatus" AS ENUM ('DRAFT', 'RFQ_SENT', 'QUOTE_RECEIVED', 'NEGOTIATING', 'OFFER_SELECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "PoStatus" AS ENUM ('NOT_STARTED', 'PO_DRAFT', 'PO_APPROVED', 'PO_SENT', 'PO_ACCEPTED');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('NOT_STARTED', 'PO_ACCEPTED', 'DEPOSIT_PAID', 'MATERIAL_PREP', 'IN_PRODUCTION', 'QC_INSPECTION', 'READY_TO_SHIP');

-- CreateEnum
CREATE TYPE "LogisticStatus" AS ENUM ('NOT_STARTED', 'BOOKED', 'EXPORT_CLEARED_CN', 'DEPARTED', 'ARRIVED_TH', 'CUSTOMS_CLEARED_TH', 'DELIVERED_TO_WH', 'RECEIVED_COMPLETE', 'ISSUE_REPORTED');

-- CreateEnum
CREATE TYPE "CaseDocType" AS ENUM ('QUOTATION', 'PO_FILE', 'QC_REPORT', 'COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'FORM_E', 'IMPORT_DECLARATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PatternGroup" AS ENUM ('APPROVAL_PATTERN', 'NEW_PATTERN');

-- CreateEnum
CREATE TYPE "SkuCategory" AS ENUM ('REPEAT_SKU', 'NEW_SKU');

-- CreateEnum
CREATE TYPE "ChecklistCategory" AS ENUM ('IMPORT_PRE_SUBMIT', 'GD_PRE_QC_REJECT');

-- CreateEnum
CREATE TYPE "PackagingStepKey" AS ENUM ('INFO', 'PRE_QC', 'AW_DRAFT_1', 'PROOF_1', 'REVISE_1', 'PROOF_2', 'REVISE_2', 'PROOF_3', 'REVISE_3', 'APPROVE_GM_VP', 'APPROVE_EVP', 'REVISE_FINAL', 'FINAL_FILE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TimelineBoardStatus" AS ENUM ('PENDING_IMPORT', 'PRE_QC_GD', 'ON_PROCESS', 'SENT_DRAFT_1', 'SENT_DRAFT_2', 'SENT_DRAFT_3', 'APPROVE_FINAL', 'APPROVED_FINAL');

-- CreateEnum
CREATE TYPE "PiFileSlot" AS ENUM ('EXCEL_DATA', 'DICUT_DIMENSION', 'PICTURE_DATA', 'MANUAL_DATA', 'OLD_PATTERN_REF', 'REF_OTHER');

-- CreateEnum
CREATE TYPE "PreQcDecision" AS ENUM ('SUBMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ArtworkStageKind" AS ENUM ('DRAFT_1', 'REVISE_1', 'DRAFT_2', 'REVISE_2', 'DRAFT_3', 'REVISE_3', 'REVISE_FINAL', 'FINAL_FILE');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REVISION_REQUESTED');

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "RoleCode" NOT NULL,
    "stage" "ImportStage" NOT NULL,
    "stepKey" TEXT,
    "action" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thaiName" TEXT,
    "nickname" TEXT,
    "isHeadImport" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoleCode" NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportCase" (
    "id" TEXT NOT NULL,
    "caseCode" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "subclassId" TEXT,
    "vendorId" TEXT,
    "currentStage" "ImportStage" NOT NULL DEFAULT 'SOURCING',
    "sourcingStatus" "SourcingStatus" NOT NULL DEFAULT 'DRAFT',
    "poStatus" "PoStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "productionStatus" "ProductionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "logisticStatus" "LogisticStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isNewPhoto" BOOLEAN NOT NULL DEFAULT false,
    "requiresTisi" BOOLEAN NOT NULL DEFAULT false,
    "requiresFda" BOOLEAN NOT NULL DEFAULT false,
    "isTileImport" BOOLEAN NOT NULL DEFAULT false,
    "isNewBrandOrLogo" BOOLEAN NOT NULL DEFAULT false,
    "sourcingPlanEnd" DATE,
    "sourcingActualEnd" DATE,
    "poPlanEnd" DATE,
    "poActualEnd" DATE,
    "prodPlanEnd" DATE,
    "prodActualEnd" DATE,
    "logisticPlanEnd" DATE,
    "logisticActualEnd" DATE,
    "poNumber" TEXT,
    "poTotalAmount" DECIMAL(14,2),
    "poCurrency" TEXT DEFAULT 'USD',
    "incoterm" TEXT,
    "shippingMode" TEXT,
    "forwarderName" TEXT,
    "blOrAwbNumber" TEXT,
    "containerNumber" TEXT,
    "etd" DATE,
    "eta" DATE,
    "whIssueNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "ImportCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcingQuotation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "moq" INTEGER NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "incoterm" TEXT NOT NULL,
    "notes" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourcingQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "stage" "ImportStage" NOT NULL,
    "docType" "CaseDocType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "ownerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorFactory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CN',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorFactory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandVendor" (
    "brandId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "BrandVendor_pkey" PRIMARY KEY ("brandId","vendorId")
);

-- CreateTable
CREATE TABLE "ProductSubclass" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductSubclass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PackagingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingCaseConfig" (
    "id" TEXT NOT NULL,
    "caseNumber" INTEGER NOT NULL,
    "patternGroup" "PatternGroup" NOT NULL,
    "skuCategory" "SkuCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "descriptionTh" TEXT NOT NULL,
    "infoDays" INTEGER NOT NULL,
    "designDays" INTEGER NOT NULL,
    "briefDays" INTEGER NOT NULL DEFAULT 1,
    "finalDays" INTEGER NOT NULL DEFAULT 1,
    "reviseFinalDays" INTEGER NOT NULL DEFAULT 1,
    "productionDays" INTEGER NOT NULL DEFAULT 55,
    "logisticDays" INTEGER NOT NULL DEFAULT 20,
    "designWeights" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingCaseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItemConfig" (
    "id" TEXT NOT NULL,
    "category" "ChecklistCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "labelTh" TEXT NOT NULL,
    "labelEn" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChecklistItemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRuleConfig" (
    "id" TEXT NOT NULL,
    "stageKey" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "role" "RoleCode" NOT NULL,
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "slaDays" INTEGER NOT NULL DEFAULT 1,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApprovalRuleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalApproverConfig" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "RoleCode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FinalApproverConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyHoliday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "yearBE" INTEGER NOT NULL,
    "nameTh" TEXT NOT NULL,
    "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "announcementRef" TEXT,

    CONSTRAINT "CompanyHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PackagingJob" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "piNumber" TEXT NOT NULL,
    "piDate" DATE NOT NULL,
    "skuCount" INTEGER NOT NULL,
    "caseConfigId" TEXT NOT NULL,
    "currentStep" "PackagingStepKey" NOT NULL DEFAULT 'INFO',
    "timelineStatus" "TimelineBoardStatus" NOT NULL DEFAULT 'PENDING_IMPORT',
    "isMinorChange" BOOLEAN NOT NULL DEFAULT false,
    "preQcRejectCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingJobType" (
    "packagingJobId" TEXT NOT NULL,
    "packagingTypeId" TEXT NOT NULL,

    CONSTRAINT "PackagingJobType_pkey" PRIMARY KEY ("packagingJobId","packagingTypeId")
);

-- CreateTable
CREATE TABLE "PackagingScheduleStep" (
    "id" TEXT NOT NULL,
    "packagingJobId" TEXT NOT NULL,
    "stepKey" "PackagingStepKey" NOT NULL,
    "plannedDays" INTEGER NOT NULL,
    "plannedStart" DATE NOT NULL,
    "plannedEnd" DATE NOT NULL,
    "actualStart" DATE,
    "actualEnd" DATE,
    "isBuffer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PackagingScheduleStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingPiFile" (
    "id" TEXT NOT NULL,
    "packagingJobId" TEXT NOT NULL,
    "slot" "PiFileSlot" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackagingPiFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingChecklistAnswer" (
    "id" TEXT NOT NULL,
    "packagingJobId" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingChecklistAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingPreQc" (
    "id" TEXT NOT NULL,
    "packagingJobId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "decision" "PreQcDecision" NOT NULL,
    "failedCodes" TEXT[],
    "note" TEXT,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackagingPreQc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingArtwork" (
    "id" TEXT NOT NULL,
    "packagingJobId" TEXT NOT NULL,
    "stageKind" "ArtworkStageKind" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackagingArtwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingApproval" (
    "id" TEXT NOT NULL,
    "packagingJobId" TEXT NOT NULL,
    "stepKey" "PackagingStepKey" NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "stepOrder" INTEGER NOT NULL,
    "role" "RoleCode" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "actedById" TEXT,
    "actedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackagingApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingComment" (
    "id" TEXT NOT NULL,
    "packagingJobId" TEXT NOT NULL,
    "artworkVersionId" TEXT,
    "authorId" TEXT NOT NULL,
    "authorRole" "RoleCode" NOT NULL,
    "body" TEXT NOT NULL,
    "pinNumber" INTEGER,
    "pinX" DOUBLE PRECISION,
    "pinY" DOUBLE PRECISION,
    "pageNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackagingComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEvent_caseId_createdAt_idx" ON "AuditEvent"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "ImportCase_caseCode_key" ON "ImportCase"("caseCode");

-- CreateIndex
CREATE UNIQUE INDEX "ImportCase_poNumber_key" ON "ImportCase"("poNumber");

-- CreateIndex
CREATE INDEX "ImportCase_currentStage_idx" ON "ImportCase"("currentStage");

-- CreateIndex
CREATE INDEX "ImportCase_brandId_idx" ON "ImportCase"("brandId");

-- CreateIndex
CREATE INDEX "ImportCase_ownerId_idx" ON "ImportCase"("ownerId");

-- CreateIndex
CREATE INDEX "SourcingQuotation_caseId_idx" ON "SourcingQuotation"("caseId");

-- CreateIndex
CREATE INDEX "CaseDocument_caseId_stage_idx" ON "CaseDocument"("caseId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Brand_ownerId_idx" ON "Brand"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorFactory_code_key" ON "VendorFactory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSubclass_code_key" ON "ProductSubclass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingType_code_key" ON "PackagingType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingCaseConfig_caseNumber_key" ON "PackagingCaseConfig"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistItemConfig_code_key" ON "ChecklistItemConfig"("code");

-- CreateIndex
CREATE INDEX "ChecklistItemConfig_category_sortOrder_idx" ON "ChecklistItemConfig"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "ApprovalRuleConfig_stageKey_isEnabled_idx" ON "ApprovalRuleConfig"("stageKey", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRuleConfig_stageKey_stepOrder_role_key" ON "ApprovalRuleConfig"("stageKey", "stepOrder", "role");

-- CreateIndex
CREATE UNIQUE INDEX "FinalApproverConfig_email_key" ON "FinalApproverConfig"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyHoliday_date_key" ON "CompanyHoliday"("date");

-- CreateIndex
CREATE INDEX "CompanyHoliday_yearBE_idx" ON "CompanyHoliday"("yearBE");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingJob_caseId_key" ON "PackagingJob"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingJob_piNumber_key" ON "PackagingJob"("piNumber");

-- CreateIndex
CREATE INDEX "PackagingJob_timelineStatus_idx" ON "PackagingJob"("timelineStatus");

-- CreateIndex
CREATE INDEX "PackagingJob_currentStep_idx" ON "PackagingJob"("currentStep");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingScheduleStep_packagingJobId_stepKey_key" ON "PackagingScheduleStep"("packagingJobId", "stepKey");

-- CreateIndex
CREATE INDEX "PackagingPiFile_packagingJobId_slot_idx" ON "PackagingPiFile"("packagingJobId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingChecklistAnswer_packagingJobId_checklistItemId_key" ON "PackagingChecklistAnswer"("packagingJobId", "checklistItemId");

-- CreateIndex
CREATE INDEX "PackagingPreQc_packagingJobId_round_idx" ON "PackagingPreQc"("packagingJobId", "round");

-- CreateIndex
CREATE INDEX "PackagingArtwork_packagingJobId_stageKind_idx" ON "PackagingArtwork"("packagingJobId", "stageKind");

-- CreateIndex
CREATE INDEX "PackagingApproval_packagingJobId_stepKey_decision_idx" ON "PackagingApproval"("packagingJobId", "stepKey", "decision");

-- CreateIndex
CREATE INDEX "PackagingComment_packagingJobId_artworkVersionId_idx" ON "PackagingComment"("packagingJobId", "artworkVersionId");

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ImportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ImportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCase" ADD CONSTRAINT "ImportCase_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCase" ADD CONSTRAINT "ImportCase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCase" ADD CONSTRAINT "ImportCase_subclassId_fkey" FOREIGN KEY ("subclassId") REFERENCES "ProductSubclass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCase" ADD CONSTRAINT "ImportCase_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorFactory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingQuotation" ADD CONSTRAINT "SourcingQuotation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ImportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingQuotation" ADD CONSTRAINT "SourcingQuotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorFactory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ImportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandVendor" ADD CONSTRAINT "BrandVendor_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandVendor" ADD CONSTRAINT "BrandVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorFactory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingJob" ADD CONSTRAINT "PackagingJob_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ImportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingJob" ADD CONSTRAINT "PackagingJob_caseConfigId_fkey" FOREIGN KEY ("caseConfigId") REFERENCES "PackagingCaseConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingJobType" ADD CONSTRAINT "PackagingJobType_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingJobType" ADD CONSTRAINT "PackagingJobType_packagingTypeId_fkey" FOREIGN KEY ("packagingTypeId") REFERENCES "PackagingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingScheduleStep" ADD CONSTRAINT "PackagingScheduleStep_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingPiFile" ADD CONSTRAINT "PackagingPiFile_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingPiFile" ADD CONSTRAINT "PackagingPiFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingChecklistAnswer" ADD CONSTRAINT "PackagingChecklistAnswer_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingChecklistAnswer" ADD CONSTRAINT "PackagingChecklistAnswer_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItemConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingPreQc" ADD CONSTRAINT "PackagingPreQc_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingPreQc" ADD CONSTRAINT "PackagingPreQc_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingArtwork" ADD CONSTRAINT "PackagingArtwork_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingArtwork" ADD CONSTRAINT "PackagingArtwork_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingApproval" ADD CONSTRAINT "PackagingApproval_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingApproval" ADD CONSTRAINT "PackagingApproval_actedById_fkey" FOREIGN KEY ("actedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingComment" ADD CONSTRAINT "PackagingComment_packagingJobId_fkey" FOREIGN KEY ("packagingJobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingComment" ADD CONSTRAINT "PackagingComment_artworkVersionId_fkey" FOREIGN KEY ("artworkVersionId") REFERENCES "PackagingArtwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingComment" ADD CONSTRAINT "PackagingComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
