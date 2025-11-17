# Testing Guide

## Prerequisites

Before testing, make sure you've completed:

1. ✅ Tables created in Supabase (done)
2. ⏳ Realtime enabled for `Call` table
3. ⏳ RLS policies set up
4. ⏳ API keys in `.env.local`

## Step 1: Complete Supabase Setup

### Enable Realtime:
1. Go to Supabase Dashboard → Database → Replication
2. Find `Call` table
3. Toggle **Enable** for replication

### Set Up RLS:
1. Go to SQL Editor
2. Copy contents of `supabase-setup.sql`
3. Run the SQL

### Add API Keys:
1. Go to Settings → API
2. Copy `anon public` key
3. Copy `service_role secret` key
4. Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://expnitgukhmiojafrsrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:hYYgDTjgq8wOXRUI@db.expnitgukhmiojafrsrn.supabase.co:5432/postgres
```

## Step 2: Create Test Data

Run `test-data.sql` in Supabase SQL Editor to create:
- Test restaurant
- 3 test tables
- 2 test waiters
- Test promotions

## Step 3: Start Dev Server

```bash
npm run dev
```

Server should start at: http://localhost:3000

## Step 4: Test Each Feature

### 1. Customer QR Page
Visit: http://localhost:3000/table/demo-table-1

**What to test:**
- ✅ Page loads with restaurant name
- ✅ Table number displays
- ✅ Promotions carousel works (if promotions exist)
- ✅ "Call Waiter" button works
- ✅ Button shows "Waiter Called!" after clicking
- ✅ Mobile responsive

### 2. Waiter Dashboard
Visit: http://localhost:3000/waiter/waiter-1

**What to test:**
- ✅ Dashboard loads
- ✅ Shows active calls count
- ✅ Real-time notifications (open customer page in another tab and call waiter)
- ✅ "Handle" button works
- ✅ Calls update in real-time

### 3. Admin Dashboard
Visit: http://localhost:3000/admin/test-rest-1

**What to test:**
- ✅ Analytics display correctly
- ✅ Tables tab shows all tables
- ✅ Waiters tab shows all waiters
- ✅ Calls tab shows call history
- ✅ QR code links work

## Step 5: End-to-End Test

1. **Open 3 browser tabs:**
   - Tab 1: Customer page (`/table/demo-table-1`)
   - Tab 2: Waiter dashboard (`/waiter/waiter-1`)
   - Tab 3: Admin dashboard (`/admin/test-rest-1`)

2. **Test flow:**
   - In Tab 1: Click "Call Waiter"
   - In Tab 2: Should see notification appear immediately
   - In Tab 2: Click "Handle"
   - In Tab 3: Should see call in history with response time

## Troubleshooting

### "Table not found"
- Make sure you ran `test-data.sql`
- Check table QR code matches URL

### "No real-time updates"
- Verify Realtime is enabled for `Call` table
- Check browser console for errors
- Verify API keys are correct

### "API errors"
- Check `.env.local` has all required keys
- Verify Supabase project is active
- Check browser console for specific errors

### Server won't start
- Check if port 3000 is available
- Run `npm install` if needed
- Check for TypeScript errors

## Expected Results

✅ Customer can call waiter instantly
✅ Waiter receives real-time notification
✅ Waiter can mark call as handled
✅ Admin sees all calls and analytics
✅ All pages are mobile-friendly
✅ No app installation needed

