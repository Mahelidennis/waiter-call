-- CreateTable
CREATE TABLE "WaiterPushSubscription" (
    "id" TEXT NOT NULL,
    "waiterId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaiterPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaiterPushSubscription_waiterId_idx" ON "WaiterPushSubscription"("waiterId");

-- CreateIndex
CREATE INDEX "WaiterPushSubscription_restaurantId_idx" ON "WaiterPushSubscription"("restaurantId");

-- CreateIndex
CREATE INDEX "WaiterPushSubscription_createdAt_idx" ON "WaiterPushSubscription"("createdAt");

-- CreateIndex
CREATE INDEX "WaiterPushSubscription_lastUsedAt_idx" ON "WaiterPushSubscription"("lastUsedAt");

-- Create unique constraint for one subscription per waiter
CREATE UNIQUE INDEX "WaiterPushSubscription_waiterId_key" ON "WaiterPushSubscription"("waiterId");

-- Add foreign key constraints
ALTER TABLE "WaiterPushSubscription" ADD CONSTRAINT "WaiterPushSubscription_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "Waiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WaiterPushSubscription" ADD CONSTRAINT "WaiterPushSubscription_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
