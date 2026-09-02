-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'MEETING_BOOKED';
ALTER TYPE "LeadStatus" ADD VALUE 'PROPOSAL_SENT';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "contactAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "qualificationScore" INTEGER,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIEmployee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "capabilities" JSONB NOT NULL,
    "configuration" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITask" (
    "id" TEXT NOT NULL,
    "aiEmployeeId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "input" JSONB,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "output" JSONB,
    "result" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AITask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIActivityLog" (
    "id" TEXT NOT NULL,
    "aiEmployeeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIApproval" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "aiEmployeeId" TEXT NOT NULL,
    "requiredApprovers" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- CreateIndex
CREATE INDEX "AIEmployee_type_idx" ON "AIEmployee"("type");

-- CreateIndex
CREATE INDEX "AIEmployee_isActive_idx" ON "AIEmployee"("isActive");

-- CreateIndex
CREATE INDEX "AIEmployee_status_idx" ON "AIEmployee"("status");

-- CreateIndex
CREATE INDEX "AITask_aiEmployeeId_idx" ON "AITask"("aiEmployeeId");

-- CreateIndex
CREATE INDEX "AITask_status_idx" ON "AITask"("status");

-- CreateIndex
CREATE INDEX "AITask_scheduledFor_idx" ON "AITask"("scheduledFor");

-- CreateIndex
CREATE INDEX "AITask_resourceType_resourceId_idx" ON "AITask"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AIActivityLog_aiEmployeeId_idx" ON "AIActivityLog"("aiEmployeeId");

-- CreateIndex
CREATE INDEX "AIActivityLog_createdAt_idx" ON "AIActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIApproval_taskId_key" ON "AIApproval"("taskId");

-- CreateIndex
CREATE INDEX "AIApproval_aiEmployeeId_idx" ON "AIApproval"("aiEmployeeId");

-- CreateIndex
CREATE INDEX "AIApproval_status_idx" ON "AIApproval"("status");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITask" ADD CONSTRAINT "AITask_aiEmployeeId_fkey" FOREIGN KEY ("aiEmployeeId") REFERENCES "AIEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIActivityLog" ADD CONSTRAINT "AIActivityLog_aiEmployeeId_fkey" FOREIGN KEY ("aiEmployeeId") REFERENCES "AIEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIApproval" ADD CONSTRAINT "AIApproval_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AITask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIApproval" ADD CONSTRAINT "AIApproval_aiEmployeeId_fkey" FOREIGN KEY ("aiEmployeeId") REFERENCES "AIEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
