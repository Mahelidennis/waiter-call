-- Supabase Setup SQL
-- Run this in Supabase SQL Editor after running Prisma migrations

-- Enable Row Level Security on all tables
ALTER TABLE "Restaurant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Table" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Waiter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WaiterTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Call" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Promotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Restaurant
-- Restaurants can only see their own data
DROP POLICY IF EXISTS "Restaurants can view own data" ON "Restaurant";
CREATE POLICY "Restaurants can view own data"
  ON "Restaurant" FOR SELECT
  USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Restaurants can update own data" ON "Restaurant";
CREATE POLICY "Restaurants can update own data"
  ON "Restaurant" FOR UPDATE
  USING (auth.uid()::text = id);

-- RLS Policies for Table
-- Restaurants can manage their own tables
DROP POLICY IF EXISTS "Restaurants can view own tables" ON "Table";
CREATE POLICY "Restaurants can view own tables"
  ON "Table" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Restaurant" 
      WHERE "Restaurant".id = "Table"."restaurantId"
      AND "Restaurant".id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Restaurants can manage own tables" ON "Table";
CREATE POLICY "Restaurants can manage own tables"
  ON "Table" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Restaurant" 
      WHERE "Restaurant".id = "Table"."restaurantId"
      AND "Restaurant".id = auth.uid()::text
    )
  );

-- RLS Policies for Waiter
-- Restaurants can manage their own waiters
DROP POLICY IF EXISTS "Restaurants can view own waiters" ON "Waiter";
CREATE POLICY "Restaurants can view own waiters"
  ON "Waiter" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Restaurant" 
      WHERE "Restaurant".id = "Waiter"."restaurantId"
      AND "Restaurant".id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Restaurants can manage own waiters" ON "Waiter";
CREATE POLICY "Restaurants can manage own waiters"
  ON "Waiter" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Restaurant" 
      WHERE "Restaurant".id = "Waiter"."restaurantId"
      AND "Restaurant".id = auth.uid()::text
    )
  );

-- RLS Policies for Call
-- Public read access for QR code pages (customers)
-- Restaurants can view/manage their calls
-- Waiters can view calls assigned to them
DROP POLICY IF EXISTS "Public can view calls via QR" ON "Call";
CREATE POLICY "Public can view calls via QR"
  ON "Call" FOR SELECT
  USING (true); -- Allow public read for QR code pages

DROP POLICY IF EXISTS "Restaurants can manage own calls" ON "Call";
CREATE POLICY "Restaurants can manage own calls"
  ON "Call" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Restaurant" 
      WHERE "Restaurant".id = "Call"."restaurantId"
      AND "Restaurant".id = auth.uid()::text
    )
  );

-- RLS Policies for Promotion
-- Public read access for customer-facing pages
-- Restaurants can manage their promotions
DROP POLICY IF EXISTS "Public can view active promotions" ON "Promotion";
CREATE POLICY "Public can view active promotions"
  ON "Promotion" FOR SELECT
  USING ("isActive" = true);

DROP POLICY IF EXISTS "Restaurants can manage own promotions" ON "Promotion";
CREATE POLICY "Restaurants can manage own promotions"
  ON "Promotion" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Restaurant" 
      WHERE "Restaurant".id = "Promotion"."restaurantId"
      AND "Restaurant".id = auth.uid()::text
    )
  );

-- RLS Policies for Subscription
-- Restaurants can only view their own subscription
DROP POLICY IF EXISTS "Restaurants can view own subscription" ON "Subscription";
CREATE POLICY "Restaurants can view own subscription"
  ON "Subscription" FOR SELECT
  USING (auth.uid()::text = "restaurantId");

-- Note: For production, you'll want to:
-- 1. Set up proper authentication with Supabase Auth
-- 2. Create user accounts linked to restaurants
-- 3. Adjust RLS policies based on your auth strategy
-- 4. For now, we'll use service role key for admin operations

