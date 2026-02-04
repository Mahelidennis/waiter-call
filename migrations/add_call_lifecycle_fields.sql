-- Add missing lifecycle fields to Call table
-- These fields were defined in Prisma schema but missing from database

-- Add acknowledgedAt field (when waiter acknowledges the call)
ALTER TABLE "Call" ADD COLUMN "acknowledgedAt" TIMESTAMP(3) NULL;

-- Add completedAt field (when service is completed)  
ALTER TABLE "Call" ADD COLUMN "completedAt" TIMESTAMP(3) NULL;

-- Add missedAt field (when call is marked as missed)
ALTER TABLE "Call" ADD COLUMN "missedAt" TIMESTAMP(3) NULL;

-- Add timeoutAt field (when call will timeout - SLA)
ALTER TABLE "Call" ADD COLUMN "timeoutAt" TIMESTAMP(3) NULL;

-- Add indexes for performance
CREATE INDEX "Call_timeoutAt_idx" ON "Call"("timeoutAt");
CREATE INDEX "Call_missedAt_idx" ON "Call"("missedAt");

-- Update existing HANDLED calls to use new COMPLETED status and set completedAt
UPDATE "Call" 
SET "status" = 'COMPLETED', "completedAt" = "handledAt" 
WHERE "status" = 'HANDLED' AND "handledAt" IS NOT NULL;
