# How to Find DATABASE_URL in Supabase

## Quick Steps:

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database Settings**
   - Click the **⚙️ Settings** icon (bottom left sidebar)
   - Click **Database** in the settings menu

3. **Find Connection String**
   - Scroll down to the **Connection string** section
   - You should see tabs: **URI**, **JDBC**, **Golang**, etc.
   - Click the **URI** tab
   - Copy the connection string

## What it looks like:

```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Important:
- Replace `[YOUR-PASSWORD]` with your actual database password
- This is the password you set when **creating the project** (not your Supabase account password)

## Alternative: Get Connection Info Manually

If you can't find the connection string, look for these fields in **Settings → Database**:

- **Host**: `db.xxxxx.supabase.co` or `aws-0-us-east-1.pooler.supabase.com`
- **Port**: `5432` (direct) or `6543` (pooled)
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: Your project database password

Then construct it as:
```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
```

## For Prisma (Recommended):

Use the **Connection pooling** URL with port **6543**:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Still Stuck?

1. Make sure your project is fully loaded (not still provisioning)
2. Try refreshing the page
3. Check if you're in the correct project
4. Look for "Connection info" or "Connection parameters" section










