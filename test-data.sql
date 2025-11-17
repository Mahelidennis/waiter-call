-- Test Data for Waiter Call System
-- Run this in Supabase SQL Editor after setting up RLS

-- Create a test restaurant
INSERT INTO "Restaurant" (id, name, slug, email, phone, address, "createdAt", "updatedAt")
VALUES (
  'test-rest-1',
  'Demo Restaurant',
  'demo-restaurant',
  'demo@restaurant.com',
  '+1234567890',
  '123 Main St, City, State',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Create test tables
INSERT INTO "Table" (id, "restaurantId", number, "qrCode", "isActive", "createdAt", "updatedAt")
VALUES
  ('table-1', 'test-rest-1', 'T1', 'demo-table-1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('table-2', 'test-rest-1', 'T2', 'demo-table-2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('table-3', 'test-rest-1', 'T3', 'demo-table-3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Create test waiters
INSERT INTO "Waiter" (id, "restaurantId", name, email, "isActive", "createdAt", "updatedAt")
VALUES
  ('waiter-1', 'test-rest-1', 'John Doe', 'john@restaurant.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waiter-2', 'test-rest-1', 'Jane Smith', 'jane@restaurant.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Assign waiters to tables
INSERT INTO "WaiterTable" (id, "waiterId", "tableId", "createdAt")
VALUES
  ('wt-1', 'waiter-1', 'table-1', CURRENT_TIMESTAMP),
  ('wt-2', 'waiter-1', 'table-2', CURRENT_TIMESTAMP),
  ('wt-3', 'waiter-2', 'table-3', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Create test promotions
INSERT INTO "Promotion" (id, "restaurantId", title, description, "isActive", "displayOrder", "createdAt", "updatedAt")
VALUES
  (
    'promo-1',
    'test-rest-1',
    'Happy Hour Special',
    '50% off all drinks from 5-7 PM',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'promo-2',
    'test-rest-1',
    'Weekend Brunch',
    'Join us every weekend for our special brunch menu',
    true,
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO NOTHING;

-- Create test subscription
INSERT INTO "Subscription" (id, "restaurantId", status, plan, "createdAt", "updatedAt")
VALUES ('sub-1', 'test-rest-1', 'TRIAL', 'basic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Test URLs:
-- Customer QR Page: http://localhost:3000/table/demo-table-1
-- Waiter Dashboard: http://localhost:3000/waiter/waiter-1
-- Admin Dashboard: http://localhost:3000/admin/test-rest-1

