# Waiter Call System

A fully web-based system for restaurants to streamline service by allowing customers to instantly call waiters via QR code scanning.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Supabase** - Backend (PostgreSQL + Realtime + Auth)
- **Prisma** - ORM for database management
- **Tailwind CSS** - Styling
- **Stripe** - Subscription billing

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned (2-3 minutes)
3. Go to **Settings** → **API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Settings** → **Database** and copy the connection string:
   - Use the **Connection string** → **URI** format
   - Replace `[YOUR-PASSWORD]` with your database password
   - This goes in `DATABASE_URL`

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Stripe (for later)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 3. Database Migration

After setting up Supabase and environment variables:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Enable Realtime in Supabase

1. Go to **Database** → **Replication** in Supabase dashboard
2. Enable replication for the `Call` table
3. This allows real-time notifications for waiter calls

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
waiter-call/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase clients
│   └── db.ts             # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## Next Steps

1. ✅ Project scaffolded
2. ✅ Database schema designed
3. ⏳ Supabase setup (in progress)
4. ⏳ Customer QR page
5. ⏳ Waiter dashboard
6. ⏳ Admin dashboard
7. ⏳ Stripe integration

## Database Schema

- **Restaurant** - Restaurant accounts
- **Table** - Physical tables with QR codes
- **Waiter** - Staff members
- **WaiterTable** - Many-to-many assignment
- **Call** - Customer waiter calls
- **Promotion** - Ads/promotions
- **Subscription** - Billing information




