# 🚀 Start Testing - Quick Guide

## ✅ What's Ready
- Environment variables configured
- API keys set
- Dev server should be running

## 📋 Before Testing - Complete These 3 Steps:

### Step 1: Create Test Data (2 minutes)
1. Open Supabase Dashboard → SQL Editor
2. Copy ALL content from `test-data.sql`
3. Paste and click "Run"
4. ✅ You should see "Success" message

### Step 2: Enable Realtime (1 minute)
1. Go to Database → Replication
2. Find `Call` table
3. Toggle **Enable** switch ON
4. ✅ Green checkmark should appear

### Step 3: Set Up RLS (1 minute)
1. Go to SQL Editor
2. Copy ALL content from `supabase-setup.sql`
3. Paste and click "Run"
4. ✅ Should see "Success" message

## 🧪 Test the System

### Option A: If Dev Server is Running
Open these URLs in your browser:

1. **Customer Page**: http://localhost:3000/table/demo-table-1
2. **Waiter Dashboard**: http://localhost:3000/waiter/waiter-1
3. **Admin Dashboard**: http://localhost:3000/admin/test-rest-1

### Option B: Start Dev Server
If server isn't running:
```bash
npm run dev
```
Then visit the URLs above.

## 🎯 Quick Test Flow

1. **Open 2 browser tabs:**
   - Tab 1: Customer page (`/table/demo-table-1`)
   - Tab 2: Waiter dashboard (`/waiter/waiter-1`)

2. **Test real-time:**
   - In Tab 1: Click "Call Waiter"
   - In Tab 2: Watch the call appear instantly! 🎉

3. **Handle the call:**
   - In Tab 2: Click "Handle" button
   - Call should disappear from pending list

## ❓ Troubleshooting

**"Table not found"**
→ Make sure you ran `test-data.sql`

**"No real-time updates"**
→ Check Realtime is enabled for `Call` table

**"Server not running"**
→ Run `npm run dev` in terminal

**"API errors"**
→ Check browser console (F12) for specific errors

## 🎉 Expected Results

✅ Customer page loads with restaurant name
✅ "Call Waiter" button works
✅ Waiter dashboard shows calls in real-time
✅ Admin dashboard shows analytics
✅ All pages are mobile-friendly

---

**Ready?** Complete the 3 setup steps above, then test! 🚀


