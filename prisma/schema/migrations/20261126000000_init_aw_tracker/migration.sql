-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TrackerRole" AS ENUM ('IMPORT', 'MDSG', 'EVP', 'DESIGNER', 'PHOTOGRAPHER', 'MGMT');

-- CreateEnum
CREATE TYPE "OrgLevel" AS ENUM ('DIV', 'DM', 'GM', 'VP', 'EVP', 'TEAM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "nickname" TEXT,
    "jobTitle" TEXT,
    "role" "TrackerRole" NOT NULL,
    "orgLevel" "OrgLevel" NOT NULL DEFAULT 'DM',
    "groupName" TEXT,
    "sdeptCodes" INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingJob" (
    "id" TEXT NOT NULL,
    "jobCode" TEXT NOT NULL,
    "piNumber" TEXT NOT NULL,
    "piDate" TEXT NOT NULL,
    "bu" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "patternId" INTEGER NOT NULL,
    "sdeptCodes" INTEGER[],
    "itemCount" INTEGER NOT NULL,
    "license" TEXT NOT NULL,
    "packages" TEXT[],
    "importerName" TEXT NOT NULL,
    "designerName" TEXT NOT NULL,
    "briefRequired" TEXT NOT NULL,
    "folderUrl" TEXT NOT NULL,
    "hasPhotoShoot" BOOLEAN NOT NULL DEFAULT false,
    "leadtimeDays" INTEGER,
    "poNumber" TEXT,
    "skuFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobHistory" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "subStatus" TEXT NOT NULL,
    "actionDate" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actionTitle" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "mark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEditLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "editedDate" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorUser" TEXT NOT NULL,
    "changes" TEXT[],
    "slaDiff" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobFile" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT,
    "isLink" BOOLEAN NOT NULL DEFAULT false,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedByRole" TEXT NOT NULL,
    "uploadedDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSku" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "skuCode" TEXT NOT NULL,
    "mmsCreatedDate" TEXT NOT NULL,
    "goodsReceivedDate" TEXT,

    CONSTRAINT "JobSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdeptMaster" (
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "vpGroup" TEXT NOT NULL,
    "gmDivision" TEXT NOT NULL,

    CONSTRAINT "SdeptMaster_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "CompanyHoliday" (
    "date" TEXT NOT NULL,
    "nameTh" TEXT,

    CONSTRAINT "CompanyHoliday_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "FormDraft" (
    "draftKey" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "fileNames" TEXT[],
    "savedDate" TEXT NOT NULL,
    "savedTime" TEXT NOT NULL,
    "savedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormDraft_pkey" PRIMARY KEY ("draftKey")
);

-- CreateTable
CREATE TABLE "MetricReview" (
    "reviewKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricReview_pkey" PRIMARY KEY ("reviewKey")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "eventKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("eventKey")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "sentDate" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "jobId" TEXT,
    "piNumber" TEXT NOT NULL,
    "toList" TEXT[],
    "toEmails" TEXT[],
    "ccList" TEXT[],
    "ccEmails" TEXT[],
    "subject" TEXT NOT NULL,
    "headText" TEXT NOT NULL,
    "todoText" TEXT NOT NULL,
    "dueDate" TEXT,
    "infoRows" JSONB NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL,
    "smtpDelivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_displayName_key" ON "User"("displayName");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingJob_jobCode_key" ON "PackagingJob"("jobCode");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingJob_piNumber_key" ON "PackagingJob"("piNumber");

-- CreateIndex
CREATE INDEX "PackagingJob_piDate_idx" ON "PackagingJob"("piDate");

-- CreateIndex
CREATE INDEX "PackagingJob_brand_idx" ON "PackagingJob"("brand");

-- CreateIndex
CREATE INDEX "PackagingJob_importerName_idx" ON "PackagingJob"("importerName");

-- CreateIndex
CREATE INDEX "PackagingJob_designerName_idx" ON "PackagingJob"("designerName");

-- CreateIndex
CREATE INDEX "JobHistory_jobId_seq_idx" ON "JobHistory"("jobId", "seq");

-- CreateIndex
CREATE INDEX "JobEditLog_jobId_createdAt_idx" ON "JobEditLog"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "JobFile_jobId_idx" ON "JobFile"("jobId");

-- CreateIndex
CREATE INDEX "JobSku_jobId_seq_idx" ON "JobSku"("jobId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "JobSku_jobId_skuCode_key" ON "JobSku"("jobId", "skuCode");

-- CreateIndex
CREATE INDEX "EmailOutbox_createdAt_idx" ON "EmailOutbox"("createdAt");

-- AddForeignKey
ALTER TABLE "JobHistory" ADD CONSTRAINT "JobHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEditLog" ADD CONSTRAINT "JobEditLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobFile" ADD CONSTRAINT "JobFile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSku" ADD CONSTRAINT "JobSku_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PackagingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
