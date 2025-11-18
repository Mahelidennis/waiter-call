# Signup Troubleshooting Guide

If you're unable to sign up a new restaurant admin account, follow these steps:

## Common Issues and Solutions

### 1. **"Server configuration error" or "Missing Supabase service role key"**

**Problem:** Environment variables are not set correctly in Vercel.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **This is critical for signup**
   - `DATABASE_URL`

3. Make sure `SUPABASE_SERVICE_ROLE_KEY` is the **service_role secret** key (not the anon key)
4. Redeploy after adding/updating environment variables

### 2. **"An account with this email already exists"**

**Problem:** The email is already registered in Supabase.

**Solution:**
- Use a different email address
- Or sign in at `/auth/admin` if you already have an account
- To delete an existing account, go to Supabase Dashboard → Authentication → Users

### 3. **"Request timed out" or "Connection timed out"**

**Problem:** Network issues or Supabase API is slow/unreachable.

**Solution:**
- Check your internet connection
- Verify Supabase project is active (not paused)
- Check Supabase status page: https://status.supabase.com
- Try again after a few moments

### 4. **"Database connection error"**

**Problem:** Cannot connect to the database.

**Solution:**
1. Verify `DATABASE_URL` is correct in Vercel
2. Check database connection string format:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Ensure database is not paused in Supabase
4. Check if database schema is migrated (run `npx prisma db push`)

### 5. **"Invalid email format" or "Password must be at least 6 characters"**

**Problem:** Input validation failed.

**Solution:**
- Use a valid email format (e.g., `user@example.com`)
- Password must be at least 6 characters long
- Check all required fields are filled

### 6. **"A restaurant with this name already exists"**

**Problem:** Restaurant slug already exists in database.

**Solution:**
- Use a different restaurant name
- The system automatically creates a slug from the restaurant name

## How to Check Logs

### Vercel Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Click "View Function Logs"
4. Look for errors related to `/api/auth/admin/signup`

### Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Check "API Logs" and "Auth Logs"
3. Look for errors related to user creation

### Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try signing up and check for error messages
4. Go to Network tab to see the API request/response

## Testing the Signup Endpoint

You can test the signup API directly using curl:

```bash
curl -X POST https://your-app.vercel.app/api/auth/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Test Restaurant",
    "adminEmail": "test@example.com",
    "adminPassword": "test123456",
    "phone": "+1234567890",
    "address": "123 Test St"
  }'
```

## Environment Variables Checklist

Before deploying, ensure these are set in Vercel:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service_role secret key ⚠️
- [ ] `DATABASE_URL` - PostgreSQL connection string

## Still Having Issues?

1. **Check Vercel Function Logs** for detailed error messages
2. **Verify Supabase Project Status** - ensure it's not paused
3. **Test Database Connection** - try connecting with a database client
4. **Check Supabase Auth Settings** - ensure email signup is enabled
5. **Review Recent Changes** - check if any recent updates broke the signup flow

## Quick Fixes

### Reset Environment Variables
1. Remove all environment variables in Vercel
2. Add them back one by one
3. Redeploy

### Test Locally
1. Create `.env.local` with all environment variables
2. Run `npm run dev`
3. Test signup at `http://localhost:3000/auth/admin/signup`
4. Check console for errors

### Verify Supabase Setup
1. Go to Supabase Dashboard → Settings → API
2. Copy all keys again
3. Update in Vercel
4. Redeploy

