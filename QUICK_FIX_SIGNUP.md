# Quick Fix: Get Signup Working

## Step 1: Check Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify these 4 variables are set:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
✅ SUPABASE_SERVICE_ROLE_KEY  ← MOST IMPORTANT!
✅ DATABASE_URL
```

## Step 2: Test Health Check

After deploying, visit:
```
https://your-app.vercel.app/api/health
```

This will show you which environment variables are missing.

## Step 3: Get Supabase Keys

1. Go to **Supabase Dashboard** → Your Project
2. **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️

## Step 4: Get Database URL

1. **Supabase Dashboard** → **Settings** → **Database**
2. Copy **Connection string** → **URI**
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. This becomes your `DATABASE_URL`

## Step 5: Add to Vercel

1. In Vercel, add/update all 4 environment variables
2. **Redeploy** your project (or wait for auto-deploy)

## Step 6: Test Signup

1. Go to `/auth/admin/signup`
2. Fill in the form
3. If it fails, check the error message - it will tell you what's wrong

## Common Issues

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- You're using the **anon key** instead of **service_role key**
- Get the **service_role secret** key from Supabase

### "Database connection error"
- Check `DATABASE_URL` format
- Make sure password is correct
- Database might be paused - check Supabase dashboard

### "An account with this email already exists"
- Use a different email
- Or sign in at `/auth/admin`

## Still Not Working?

1. Check **Vercel Function Logs**:
   - Vercel Dashboard → Deployments → Latest → View Function Logs
   - Look for errors in `/api/auth/admin/signup`

2. Check the **health endpoint**:
   - Visit `/api/health` to see what's missing

3. Verify Supabase project is **active** (not paused)

