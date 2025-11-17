# Enable Realtime in Supabase

## Step 1: Enable Realtime for Call Table

1. In your Supabase dashboard, go to **Database** → **Replication** (in the left sidebar)
2. Find the `Call` table in the list
3. Toggle the switch to **Enable** replication for the `Call` table
4. This allows real-time notifications when customers call waiters

## Step 2: Set Up RLS Policies

1. Go to **SQL Editor** in Supabase
2. Click **New query**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run**

This sets up security policies for all tables.

## Step 3: Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → Already in `.env.local` ✅
   - **anon public** key → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

After these steps, we'll continue building the app!

