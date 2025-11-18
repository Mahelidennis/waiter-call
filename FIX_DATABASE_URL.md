# Fix DATABASE_URL Error

## The Problem

You're seeing this error:
```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`
```

This means your `DATABASE_URL` environment variable in Vercel is either:
1. **Not set** (missing)
2. **Wrong format** (doesn't start with `postgresql://` or `postgres://`)

## Quick Fix

### Step 1: Get Your Database URL from Supabase

1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** → **Database**
3. Scroll down to **Connection string**
4. Select **URI** tab (not Session mode or Transaction mode)
5. Copy the connection string

It should look like this:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Step 2: Replace [YOUR-PASSWORD]

1. In the connection string, find `[YOUR-PASSWORD]`
2. Replace it with your **actual database password**
   - If you forgot it, go to Supabase → Settings → Database → Reset database password
3. The final URL should look like:
```
postgresql://postgres:your-actual-password@db.xxxxx.supabase.co:5432/postgres
```

### Step 3: Add to Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Find `DATABASE_URL` (or add it if missing)
4. Paste your complete connection string (with password replaced)
5. Make sure it starts with `postgresql://` or `postgres://`
6. Click **Save**
7. **Redeploy** your project (or wait for auto-deploy)

### Step 4: Verify

1. After deployment, visit: `https://your-app.vercel.app/api/health`
2. Check the response - it should show:
   ```json
   {
     "status": "healthy",
     "checks": {
       "database": {
         "url": true,
         "urlFormatValid": true
       }
     }
   }
   ```

## Common Mistakes

### ❌ Wrong: Missing password
```
postgresql://postgres:@db.xxxxx.supabase.co:5432/postgres
```

### ❌ Wrong: Using Session mode connection string
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### ✅ Correct: URI format with password
```
postgresql://postgres:your-actual-password@db.xxxxx.supabase.co:5432/postgres
```

## Still Having Issues?

1. **Check the health endpoint**: Visit `/api/health` to see what's wrong
2. **Verify password**: Make sure you're using the correct database password
3. **Check for typos**: The URL must be exactly correct
4. **Redeploy**: After changing environment variables, you must redeploy

## Example of Correct Format

```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Important**: 
- Must start with `postgresql://` or `postgres://`
- Must include the password (replace `[YOUR-PASSWORD]`)
- Must use the **URI** format, not Session or Transaction mode
- No spaces or extra characters

