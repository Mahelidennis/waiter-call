-- Add unique constraint to enforce one subscription per waiter
-- This will replace the existing compound unique constraint

-- First, drop the existing compound unique constraint
ALTER TABLE "PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_waiterId_endpoint_key";

-- Then add the new unique constraint for one subscription per waiter
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_waiterId_key" UNIQUE ("waiterId");
