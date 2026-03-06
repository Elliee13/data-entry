-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportTriggerType" AS ENUM ('CRON', 'MANUAL', 'RETRY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILURE', 'AUTH_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'ENTRY_CREATED', 'ENTRY_UPDATED', 'ENTRY_DELETED', 'REPORT_GENERATION_STARTED', 'REPORT_GENERATION_SUCCEEDED', 'REPORT_GENERATION_FAILED', 'REPORT_RETRY_REQUESTED', 'WEEK_ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEntry" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "weather" TEXT NOT NULL,
    "coordinator" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "shirtColor" TEXT NOT NULL,
    "totalTeams" INTEGER NOT NULL,
    "totalShirts" INTEGER NOT NULL,
    "shirtsSold" INTEGER NOT NULL,
    "totalSales" DECIMAL(10,2) NOT NULL,
    "costOfProduct" DECIMAL(10,2) NOT NULL,
    "laborCost" DECIMAL(10,2) NOT NULL,
    "travelCost" DECIMAL(10,2) NOT NULL,
    "age5u" INTEGER NOT NULL,
    "age6u" INTEGER NOT NULL,
    "age7u" INTEGER NOT NULL,
    "age8u" INTEGER NOT NULL,
    "age9u" INTEGER NOT NULL,
    "age10u" INTEGER NOT NULL,
    "age11u" INTEGER NOT NULL,
    "age12u" INTEGER NOT NULL,
    "age13u" INTEGER NOT NULL,
    "age14u" INTEGER NOT NULL,
    "age15u" INTEGER NOT NULL,
    "age16u" INTEGER NOT NULL,
    "weekKey" TEXT NOT NULL,
    "weekStartsAt" TIMESTAMP(3) NOT NULL,
    "weekEndsAt" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedByReportId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "weekStartsAt" TIMESTAMP(3) NOT NULL,
    "weekEndsAt" TIMESTAMP(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "triggerType" "ReportTriggerType" NOT NULL,
    "triggeredById" TEXT,
    "emailTo" TEXT NOT NULL,
    "emailFrom" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "csvFilename" TEXT NOT NULL,
    "xlsxFilename" TEXT NOT NULL,
    "emailMessageId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EventEntry_weekKey_isArchived_deletedAt_idx" ON "EventEntry"("weekKey", "isArchived", "deletedAt");

-- CreateIndex
CREATE INDEX "EventEntry_eventDate_idx" ON "EventEntry"("eventDate");

-- CreateIndex
CREATE INDEX "EventEntry_createdById_idx" ON "EventEntry"("createdById");

-- CreateIndex
CREATE INDEX "EventEntry_archivedByReportId_idx" ON "EventEntry"("archivedByReportId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_weekKey_key" ON "WeeklyReport"("weekKey");

-- CreateIndex
CREATE INDEX "WeeklyReport_status_weekStartsAt_idx" ON "WeeklyReport"("status", "weekStartsAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "EventEntry" ADD CONSTRAINT "EventEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntry" ADD CONSTRAINT "EventEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntry" ADD CONSTRAINT "EventEntry_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntry" ADD CONSTRAINT "EventEntry_archivedByReportId_fkey" FOREIGN KEY ("archivedByReportId") REFERENCES "WeeklyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
