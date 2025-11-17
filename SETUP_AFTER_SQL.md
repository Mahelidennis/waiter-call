# Setup Steps After Running SQL

## ✅ Step 1: Run the SQL Migration
- Go to SQL Editor in Supabase
- Run `prisma/migrations/0001_init.sql`
- Verify tables are created (check Tables in left sidebar)

## ⏳ Step 2: Enable Realtime
1. Go to **Database** → **Replication** in Supabase dashboard
2. Find the `Call` table
3. Toggle **Enable** for replication
4. This allows real-time notifications for waiter calls

## ⏳ Step 3: Set Up Row Level Security (RLS)
1. Go to **SQL Editor** again
2. Run the SQL from `supabase-setup.sql` file
3. This sets up security policies

## ⏳ Step 4: Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - `anon` `public` key → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## ⏳ Step 5: Verify Prisma Client
```bash
npx prisma generate
```

This will generate the Prisma Client to use in your app.

## Next: Build the App!
Once all setup is complete, we'll build:
- Customer QR code page
- Waiter dashboard
- Admin dashboard

