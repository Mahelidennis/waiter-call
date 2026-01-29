-- Migration: Enhance Call Lifecycle for Stage 1
-- This migration adds enhanced lifecycle tracking to the Call model

-- Add new timestamp fields for enhanced lifecycle
ALTER TABLE "Call" 
ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "missedAt" TIMESTAMP(3),
ADD COLUMN "timeoutAt" TIMESTAMP(3);

-- Update existing HANDLED calls to use new COMPLETED status
UPDATE "Call" 
SET "status" = 'COMPLETED', "completedAt" = "handledAt" 
WHERE "status" = 'HANDLED' AND "handledAt" IS NOT NULL;

-- Add indexes for performance
CREATE INDEX "Call_timeoutAt_idx" ON "Call"("timeoutAt");
CREATE INDEX "Call_missedAt_idx" ON "Call"("missedAt");

-- Update the enum type (PostgreSQL specific)
-- First, add new values to the enum
ALTER TYPE "CallStatus" ADD VALUE 'ACKNOWLEDGED';
ALTER TYPE "CallStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "CallStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "CallStatus" ADD VALUE 'MISSED';

-- Note: HANDLED is kept for backward compatibility but marked as deprecated

-- Set timeout for existing PENDING calls (2 minutes from now)
UPDATE "Call" 
SET "timeoutAt" = "requestedAt" + INTERVAL '2 minutes'
WHERE "status" = 'PENDING' AND "timeoutAt" IS NULL;

-- Update responseTime to be in milliseconds (convert from seconds)
UPDATE "Call" 
SET "responseTime" = "responseTime" * 1000 
WHERE "responseTime" IS NOT NULL AND "responseTime" < 1000000; -- Only update if it looks like seconds

-- Add comments for documentation
COMMENT ON COLUMN "Call"."acknowledgedAt" IS 'When the waiter acknowledged the call';
COMMENT ON COLUMN "Call"."completedAt" IS 'When the service was completed';
COMMENT ON COLUMN "Call"."missedAt" IS 'When the call was marked as missed due to timeout';
COMMENT ON COLUMN "Call"."timeoutAt" IS 'SLA timeout - when the call should be marked as missed';
COMMENT ON COLUMN "Call"."handledAt" IS '@deprecated Use completedAt instead';
