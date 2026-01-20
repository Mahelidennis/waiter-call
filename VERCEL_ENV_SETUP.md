# Vercel Environment Variables Setup Guide

This guide will help you configure all required environment variables in Vercel for production deployment.

## Required Environment Variables

You need to set **4 environment variables** in Vercel:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `DATABASE_URL`

## Step-by-Step Setup

### Step 1: Get Supabase Credentials

1. **Go to Supabase Dashboard**
   - Navigate to [supabase.com](https://supabase.com)
   - Open your project

2. **Get API Keys**
   - Click **Settings** (gear icon) → **API**
   - Copy these values:
     - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role secret** key → This is your `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

3. **Get Database URL**
   - Click **Settings** → **Database**
   - Scroll down to **Connection string**
   - Select the **URI** tab (not Session mode or Transaction mode)
   - Copy the connection string
   - **Important:** Replace `[YOUR-PASSWORD]` with your actual database password
   - This becomes your `DATABASE_URL`

   Example format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 2: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to [vercel.com](https://vercel.com)
   - Open your project

2. **Navigate to Settings**
   - Click on your project
   - Click **Settings** in the top navigation
   - Click **Environment Variables** in the left sidebar

3. **Add Each Variable**

   For each variable below, click **Add New** and enter:

   #### Variable 1: `NEXT_PUBLIC_SUPABASE_URL`
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** Your Supabase project URL (from Step 1.2)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   #### Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon public key (from Step 1.2)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   #### Variable 3: `SUPABASE_SERVICE_ROLE_KEY`
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Your Supabase service_role secret key (from Step 1.2)
   - **Environment:** Select all (Production, Preview, Development)
   - ⚠️ **Warning:** This key has admin access. Keep it secret!
   - Click **Save**

   #### Variable 4: `DATABASE_URL`
   - **Key:** `DATABASE_URL`
   - **Value:** Your database connection string with password replaced (from Step 1.3)
   - **Environment:** Select all (Production, Preview, Development)
   - **Format:** Must start with `postgresql://` or `postgres://`
   - Click **Save**

### Step 3: Verify Environment Variables

1. **Check Your Variables**
   - In Vercel → Settings → Environment Variables
   - You should see all 4 variables listed
   - Make sure they're enabled for the environments you need

2. **Test with Health Check**
   - After deploying, visit: `https://your-app.vercel.app/api/health`
   - The response should show all environment variables are set correctly

### Step 4: Redeploy Your Application

1. **Trigger a New Deployment**
   - Go to **Deployments** tab in Vercel
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger auto-deploy

2. **Wait for Deployment**
   - Wait for the deployment to complete
   - Check the deployment logs for any errors

3. **Test Your Application**
   - Visit your deployed app
   - Test signup/login functionality
   - Test realtime notifications
   - Check browser console for errors

## Environment Variable Details

### `NEXT_PUBLIC_SUPABASE_URL`
- **Purpose:** Supabase project URL for client-side connections
- **Format:** `https://xxxxx.supabase.co`
- **Public:** Yes (exposed to browser)
- **Required:** Yes

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Purpose:** Supabase anonymous key for client-side API calls
- **Format:** JWT token (starts with `eyJ...`)
- **Public:** Yes (exposed to browser)
- **Required:** Yes

### `SUPABASE_SERVICE_ROLE_KEY`
- **Purpose:** Supabase service role key for server-side admin operations
- **Format:** JWT token (starts with `eyJ...`)
- **Public:** No (server-side only)
- **Required:** Yes (for signup and admin operations)
- **Security:** ⚠️ Never expose this in client-side code!

### `DATABASE_URL`
- **Purpose:** PostgreSQL connection string for Prisma/database operations
- **Format:** `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
- **Public:** No (server-side only)
- **Required:** Yes (for database migrations and queries)
- **Note:** Must include your actual database password

## Troubleshooting

### Issue: "Missing environment variable" error

**Solution:**
1. Check Vercel → Settings → Environment Variables
2. Verify the variable name is spelled correctly
3. Make sure it's enabled for the correct environment (Production/Preview/Development)
4. Redeploy after adding variables

### Issue: "Invalid DATABASE_URL format"

**Solution:**
1. Make sure `DATABASE_URL` starts with `postgresql://` or `postgres://`
2. Verify you replaced `[YOUR-PASSWORD]` with your actual password
3. Check for any extra spaces or special characters
4. Use the **URI** format from Supabase, not Session mode

### Issue: "Database connection failed"

**Solution:**
1. Verify your database password is correct
2. Check if your Supabase project is active (not paused)
3. Make sure you're using the correct connection string format
4. Try resetting your database password in Supabase if needed

### Issue: "Realtime not working in production"

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
2. Check browser console for WebSocket connection errors
3. Verify replication is enabled in Supabase (see `REALTIME_SETUP.md`)
4. Check Supabase dashboard → Logs → Realtime for errors

## Quick Checklist

Before deploying to production, verify:

- [ ] All 4 environment variables are set in Vercel
- [ ] `DATABASE_URL` has the correct password (not `[YOUR-PASSWORD]`)
- [ ] Variables are enabled for Production environment
- [ ] Application has been redeployed after adding variables
- [ ] Health check endpoint (`/api/health`) shows all variables are set
- [ ] Realtime replication is enabled in Supabase (see `REALTIME_SETUP.md`)

## Security Best Practices

1. **Never commit `.env.local` to git** - It's already in `.gitignore`
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** - Only use server-side
3. **Rotate keys if exposed** - If a key is leaked, regenerate it in Supabase
4. **Use different keys for dev/prod** - Consider using separate Supabase projects
5. **Review RLS policies** - Ensure proper security on database tables

## Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Keys Guide](https://supabase.com/docs/guides/api/api-keys)
- [Database Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
