# Vercel Deployment Guide

This guide will help you configure your Waiter Call System on Vercel.

## Required Environment Variables

You **MUST** set these environment variables in your Vercel project settings:

### Supabase Configuration
1. Go to your Vercel project → Settings → Environment Variables
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Database Configuration
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Important Notes:**
- Replace `[YOUR-PASSWORD]` with your actual Supabase database password
- Replace `[PROJECT-REF]` with your Supabase project reference ID
- The `DATABASE_URL` should be the **Connection string** → **URI** format from Supabase

### Optional: Stripe (for future subscription features)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## How to Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and open your project
2. **Settings** → **API**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`
3. **Settings** → **Database**:
   - Copy **Connection string** → **URI** format
   - Replace `[YOUR-PASSWORD]` with your database password
   - This becomes your `DATABASE_URL`

## Database Setup

Before deploying, ensure your database schema is set up:

1. Run the Prisma migration:
   ```bash
   npx prisma db push
   ```

2. Or use the SQL file:
   - Go to Supabase → SQL Editor
   - Run the contents of `supabase-setup.sql`

## Enable Supabase Realtime

For real-time waiter notifications to work:

1. Go to Supabase Dashboard → **Database** → **Replication**
2. Enable replication for the `Call` table
3. This allows real-time updates when customers call waiters

## Build Configuration

The project is already configured with:
- `postinstall` script to generate Prisma Client
- Build script includes Prisma generation
- All environment variables are properly referenced

## Deployment Steps

1. **Push your code to GitHub/GitLab/Bitbucket**
2. **Import project in Vercel**
3. **Add environment variables** (see above)
4. **Deploy**

Vercel will automatically:
- Run `npm install` (which triggers `postinstall` → `prisma generate`)
- Run `npm run build` (which includes `prisma generate && next build`)
- Deploy your application

## Testing After Deployment

1. **Home Page**: Should load at `https://your-app.vercel.app`
2. **Admin Signup**: Visit `/auth/admin/signup` to create a restaurant
3. **Admin Login**: Visit `/auth/admin` to sign in
4. **Admin Dashboard**: After login, you'll be redirected to `/admin/[restaurantId]`
5. **Create Tables**: In admin dashboard, create tables with QR codes
6. **Test QR Page**: Visit `/table/[qrCode]` to see customer view
7. **Test Waiter Dashboard**: Visit `/waiter/[waiterId]` (get waiter ID from admin dashboard)

## Common Issues

### Build Fails
- **Error**: "DATABASE_URL is not set"
  - **Solution**: Add `DATABASE_URL` environment variable in Vercel

### Prisma Client Not Generated
- **Error**: "Cannot find module '@prisma/client'"
  - **Solution**: The `postinstall` script should handle this. Check that it's in `package.json`

### Supabase Connection Errors
- **Error**: "Missing Supabase environment variables"
  - **Solution**: Ensure all three Supabase env vars are set in Vercel

### Realtime Not Working
- **Issue**: Waiter dashboard doesn't show new calls in real-time
  - **Solution**: Enable replication for `Call` table in Supabase Dashboard

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Verify all environment variables are set correctly
4. Ensure database schema is migrated

