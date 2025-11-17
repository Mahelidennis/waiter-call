# Supabase Setup Guide

Follow these steps to set up your Supabase project for the Waiter Call System.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `waiter-call` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 3: Get Database Connection String

### Method 1: From Supabase Dashboard

1. In your Supabase project dashboard, go to **Settings** (gear icon in left sidebar)
2. Click on **Database** in the settings menu
3. Scroll down to find **Connection string** section
4. You'll see multiple tabs: **URI**, **JDBC**, **Golang**, etc.
5. Click on the **URI** tab
6. You'll see a connection string like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. Click the **copy** button (or manually copy it)
8. **Important**: Replace `[YOUR-PASSWORD]` with the actual database password you created when setting up the project
9. This is your `DATABASE_URL`

### Method 2: If you can't find it, construct it manually

If the connection string section isn't visible, you can construct it:

1. Go to **Settings** → **Database**
2. Look for **Connection info** or **Host** section
3. You'll find:
   - **Host**: Something like `aws-0-us-east-1.pooler.supabase.com`
   - **Port**: Usually `6543` (for connection pooling) or `5432` (direct)
   - **Database name**: Usually `postgres`
   - **User**: Usually `postgres`
   - **Password**: The one you set when creating the project

4. Construct the URL in this format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres
   ```

   Example:
   ```
   postgresql://postgres:yourpassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Method 3: Use Connection Pooling (Recommended for Prisma)

1. In **Settings** → **Database**
2. Look for **Connection pooling** section
3. Use the **Session mode** connection string
4. It should look like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Still can't find it?

Try this:
1. Go to **Project Settings** (click on your project name at the top)
2. Look for **Database** or **Connection** section
3. Or check the **API** settings page - sometimes connection info is there

**Note**: Make sure you're looking at the correct project and that it's fully provisioned (not still loading).

## Step 4: Set Environment Variables

Create a `.env.local` file in the `waiter-call` directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Step 5: Run Database Migrations

In your terminal, from the `waiter-call` directory:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase database
npx prisma db push

# Verify it worked (optional - opens Prisma Studio)
npx prisma studio
```

## Step 6: Enable Realtime

1. In Supabase dashboard, go to **Database** → **Replication**
2. Find the `Call` table
3. Toggle **Enable** for replication
4. This allows real-time notifications when customers call waiters

## Step 7: Set Up Row Level Security (RLS)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **"Run"** to execute
5. This sets up security policies for your tables

## Step 8: Verify Setup

Test your connection:

```bash
# Start the dev server
npm run dev
```

If everything is set up correctly, the app should start without errors.

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the `waiter-call` directory
- Check that all variables are set correctly
- Restart your dev server after adding env variables

### "Database connection failed"
- Verify your `DATABASE_URL` has the correct password
- Check that your Supabase project is fully provisioned
- Try using the **Connection pooling** URL instead of direct connection

### "Prisma schema push failed"
- Make sure your database password is correct
- Check that Supabase project is active
- Try running `npx prisma db push --force-reset` (⚠️ deletes all data)

### Realtime not working
- Verify Realtime is enabled for the `Call` table
- Check that you're using the correct Supabase project URL
- Make sure WebSocket connections aren't blocked by firewall

## Next Steps

Once Supabase is set up:
1. ✅ Database schema is ready
2. ⏳ Build customer QR code page
3. ⏳ Build waiter dashboard
4. ⏳ Build admin dashboard
5. ⏳ Integrate Stripe for billing

