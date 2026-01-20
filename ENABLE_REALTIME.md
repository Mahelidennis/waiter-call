# Enable Realtime in Supabase

**📖 For comprehensive instructions, see [REALTIME_SETUP.md](./REALTIME_SETUP.md)**

## Quick Setup

### Step 1: Enable Realtime for Call Table

1. In your Supabase dashboard, go to **Database** → **Replication** (in the left sidebar)
2. Find the `Call` table in the list
3. Toggle the switch to **Enable** replication for the `Call` table
4. This allows real-time notifications when customers call waiters

### Step 2: Set Up RLS Policies

1. Go to **SQL Editor** in Supabase
2. Click **New query**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run**

This sets up security policies for all tables.

### Step 3: Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → Already in `.env.local` ✅
   - **anon public** key → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## What's Implemented

✅ Realtime subscriptions in waiter dashboard (`/waiter/[waiterId]`)
✅ Realtime subscriptions in admin dashboard (`/admin/[restaurantId]`)
✅ Real-time call notifications when customers call waiters
✅ Automatic UI updates when calls are created or updated

## Troubleshooting

If realtime is not working:
1. Verify replication is enabled in Supabase Dashboard → Database → Replication
2. Check browser console for WebSocket connection errors
3. Verify environment variables are set (see `VERCEL_ENV_SETUP.md` for production)
4. See [REALTIME_SETUP.md](./REALTIME_SETUP.md) for detailed troubleshooting










