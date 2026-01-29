-- Migration: Add Push Subscriptions for Waiter Push Notifications
-- This migration adds support for storing push subscription data for waiters

-- Create PushSubscription table
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "waiterId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints with proper cascading
    CONSTRAINT "PushSubscription_waiterId_fkey" 
        FOREIGN KEY ("waiterId") REFERENCES "Waiter"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PushSubscription_restaurantId_fkey" 
        FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE,

    -- Primary key
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to prevent duplicate subscriptions for same waiter+endpoint
CREATE UNIQUE INDEX "PushSubscription_waiterId_endpoint_key" ON "PushSubscription"("waiterId", "endpoint");

-- Create performance indexes
CREATE INDEX "PushSubscription_waiterId_idx" ON "PushSubscription"("waiterId");
CREATE INDEX "PushSubscription_restaurantId_idx" ON "PushSubscription"("restaurantId");
CREATE INDEX "PushSubscription_createdAt_idx" ON "PushSubscription"("createdAt");
CREATE INDEX "PushSubscription_lastUsedAt_idx" ON "PushSubscription"("lastUsedAt");

-- Add comments for documentation
COMMENT ON TABLE "PushSubscription" IS 'Stores push subscription data for waiter devices to receive push notifications';
COMMENT ON COLUMN "PushSubscription"."endpoint" IS 'Push service endpoint URL from subscription';
COMMENT ON COLUMN "PushSubscription"."p256dh" IS 'VAPID public key for encryption';
COMMENT ON COLUMN "PushSubscription"."auth" IS 'VAPID authentication secret';
COMMENT ON COLUMN "PushSubscription"."userAgent" IS 'Device/user agent for debugging and analytics';
COMMENT ON COLUMN "PushSubscription"."lastUsedAt" IS 'Last time this subscription was successfully used for push';
