# Quick Setup Summary - Realtime & Environment Variables

This is a quick reference guide for setting up Supabase Realtime and Vercel environment variables.

## ✅ What's Been Implemented

1. **Realtime subscriptions added to admin dashboard** - Admin page now updates in real-time when calls are created/updated
2. **Realtime subscriptions already working in waiter dashboard** - Waiter page already had realtime implemented
3. **Comprehensive setup guides created** - Detailed instructions for both tasks

## 🚀 What You Need to Do

### Part 1: Enable Supabase Realtime (5 minutes)

**Location:** Supabase Dashboard

1. Go to **Database** → **Replication**
2. Find the `Call` table
3. Toggle the switch to **Enable** replication

**Alternative (if UI doesn't work):**
- Go to **SQL Editor** → **New query**
- Run: `ALTER PUBLICATION supabase_realtime ADD TABLE "Call";`

**📖 Full guide:** See [REALTIME_SETUP.md](./REALTIME_SETUP.md)

### Part 2: Set Environment Variables in Vercel (5 minutes)

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

Add these 4 variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Get from: Supabase → Settings → API → Project URL
   - Value: `https://xxxxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Get from: Supabase → Settings → API → anon public key
   - Value: JWT token starting with `eyJ...`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Get from: Supabase → Settings → API → service_role secret key
   - Value: JWT token starting with `eyJ...`
   - ⚠️ Keep this secret!

4. **DATABASE_URL**
   - Get from: Supabase → Settings → Database → Connection string → URI tab
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - Value: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

**After adding variables:**
- Redeploy your application in Vercel
- Test the health check: `https://your-app.vercel.app/api/health`

**📖 Full guide:** See [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)

## 🧪 Testing

After completing both parts:

1. **Test Realtime Locally:**
   - Open waiter dashboard: `/waiter/[waiterId]`
   - Open admin dashboard: `/admin/[restaurantId]`
   - Create a test call (scan QR code)
   - Both dashboards should update automatically without refresh

2. **Test in Production:**
   - Deploy to Vercel
   - Verify environment variables are set
   - Test realtime notifications work in production

## 📚 Documentation Files

- **[REALTIME_SETUP.md](./REALTIME_SETUP.md)** - Complete guide for enabling Supabase Realtime
- **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** - Complete guide for Vercel environment variables
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - General Vercel deployment guide
- **[ENABLE_REALTIME.md](./ENABLE_REALTIME.md)** - Quick realtime reference

## ⚠️ Common Issues

### Realtime not working?
- ✅ Check Supabase Dashboard → Database → Replication → Call table is enabled
- ✅ Check browser console for WebSocket errors
- ✅ Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Environment variables not working in production?
- ✅ Verify all 4 variables are set in Vercel
- ✅ Make sure `DATABASE_URL` has the actual password (not `[YOUR-PASSWORD]`)
- ✅ Redeploy after adding variables
- ✅ Check Vercel deployment logs for errors

## 🎯 Next Steps

Once both parts are complete:
1. ✅ Realtime notifications will work in both waiter and admin dashboards
2. ✅ Production deployment will have all required environment variables
3. ✅ Your application will be fully functional in production

## Need Help?

- Check the detailed guides: `REALTIME_SETUP.md` and `VERCEL_ENV_SETUP.md`
- Review troubleshooting sections in each guide
- Check Supabase logs: Dashboard → Logs → Realtime
- Check Vercel logs: Dashboard → Deployments → Latest → View Function Logs
