# Supabase Realtime Setup Guide

This guide will help you enable real-time notifications for the Call table in Supabase.

## Step 1: Enable Replication for Call Table

1. **Go to Supabase Dashboard**
   - Navigate to [supabase.com](https://supabase.com)
   - Open your project

2. **Enable Replication**
   - In the left sidebar, click **Database** → **Replication**
   - Find the `Call` table in the list
   - Toggle the switch to **Enable** replication for the `Call` table
   - Wait a few seconds for the change to take effect

3. **Verify Replication is Enabled**
   - The `Call` table should show a green checkmark or "Enabled" status
   - You should see it listed under "Replicated Tables"

## Step 2: Enable Realtime via SQL (Alternative Method)

If the UI method doesn't work, you can enable replication using SQL:

1. **Go to SQL Editor**
   - In Supabase dashboard, click **SQL Editor** in the left sidebar
   - Click **New query**

2. **Run this SQL command:**
```sql
-- Enable replication for Call table
ALTER PUBLICATION supabase_realtime ADD TABLE "Call";
```

3. **Verify it worked:**
```sql
-- Check if Call table is in the replication publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'Call';
```

You should see one row returned if replication is enabled.

## Step 3: Verify RLS Policies

Make sure Row Level Security (RLS) policies allow realtime subscriptions:

1. **Go to SQL Editor** → **New query**
2. **Run this to check RLS:**
```sql
-- Check if RLS is enabled on Call table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Call';
```

3. **If RLS is enabled, ensure policies allow reads:**
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'Call';
```

If you don't have policies set up, you can use the `supabase-setup.sql` file in the project root.

## Step 4: Test Realtime Connection

After enabling replication, test that realtime works:

1. **Open your waiter dashboard** at `/waiter/[waiterId]`
2. **Open your admin dashboard** at `/admin/[restaurantId]`
3. **Create a test call** by scanning a QR code
4. **Verify** that both dashboards update in real-time without page refresh

## Troubleshooting

### Realtime not working?

1. **Check Supabase Dashboard:**
   - Go to **Database** → **Replication**
   - Verify `Call` table shows as "Enabled"

2. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for errors in the Console tab
   - Check Network tab for WebSocket connections

3. **Verify Environment Variables:**
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Check both local `.env.local` and Vercel environment variables

4. **Check Supabase Logs:**
   - Go to **Logs** → **Realtime** in Supabase dashboard
   - Look for connection errors or issues

### Common Issues

**Issue:** "Replication not enabled" error
- **Solution:** Make sure you enabled replication in the Supabase dashboard (Step 1)

**Issue:** "Permission denied" error
- **Solution:** Check RLS policies and ensure the anon key has read access to the Call table

**Issue:** Realtime works locally but not in production
- **Solution:** Verify environment variables are set in Vercel (see `VERCEL_ENV_SETUP.md`)

## Next Steps

After enabling realtime:
1. ✅ Test realtime notifications in waiter dashboard
2. ✅ Test realtime updates in admin dashboard
3. ✅ Set up environment variables in Vercel (see `VERCEL_ENV_SETUP.md`)

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Replication Guide](https://supabase.com/docs/guides/database/extensions/replication)
