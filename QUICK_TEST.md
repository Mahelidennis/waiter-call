# Quick Test Steps

## 1. Create Test Data in Supabase

1. Go to your Supabase SQL Editor
2. Copy and paste the contents of `test-data.sql`
3. Click "Run"
4. Verify tables were created (check "Tables" in sidebar)

## 2. Test URLs

After creating test data, visit these URLs:

### Customer Page (QR Code)
http://localhost:3000/table/demo-table-1

**Test:**
- Click "Call Waiter" button
- Should see "Waiter Called!" confirmation

### Waiter Dashboard
http://localhost:3000/waiter/waiter-1

**Test:**
- Should see the call appear in real-time
- Click "Handle" to mark as handled

### Admin Dashboard
http://localhost:3000/admin/test-rest-1

**Test:**
- View analytics
- Check tables, waiters, and calls tabs

## 3. End-to-End Test

1. Open customer page in one tab
2. Open waiter dashboard in another tab
3. Click "Call Waiter" on customer page
4. Watch it appear instantly on waiter dashboard!

## Current Status

✅ Environment variables configured
✅ API keys set
⏳ Need to create test data in Supabase
⏳ Need to enable Realtime for `Call` table
⏳ Need to set up RLS policies

