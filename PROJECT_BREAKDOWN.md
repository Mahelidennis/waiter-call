# Waiter Call System - Complete Project Breakdown

## 📋 Project Overview

**Waiter Call** is a web-based restaurant service management system that allows customers to call waiters instantly by scanning a QR code at their table. The system provides real-time notifications, analytics, and management tools for restaurants.

---

## 🎯 Core Purpose

**Problem Solved:** 
- Customers struggle to get waiter attention in restaurants
- Waiters miss customer requests
- No way to track service response times
- Manual service management is inefficient

**Solution:**
- QR code-based instant waiter calling
- Real-time notifications for waiters
- Analytics dashboard for restaurant owners
- Automated table-waiter assignments

---

## 🏗️ Architecture

### Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework with App Router | 16.0.1 |
| **TypeScript** | Type safety | 5.9.3 |
| **Supabase** | Backend (PostgreSQL + Auth + Realtime) | 2.81.1 |
| **Prisma** | ORM for database | 6.19.0 |
| **Tailwind CSS** | Styling | 4.1.17 |
| **Stripe** | Payment processing | 19.3.0 |

### Architecture Pattern
- **Frontend:** Next.js App Router (Server & Client Components)
- **Backend:** Next.js API Routes (Serverless Functions)
- **Database:** PostgreSQL via Supabase
- **Real-time:** Supabase Realtime subscriptions
- **Authentication:** Supabase Auth
- **Deployment:** Vercel (Serverless)

---

## 📁 Project Structure

```
waiter-call/
├── app/                          # Next.js App Router
│   ├── admin/[restaurantId]/     # Admin Dashboard
│   │   ├── components/           # Modal components
│   │   ├── layout.tsx            # Auth-protected layout
│   │   └── page.tsx              # Main admin dashboard
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/admin/signup/   # Restaurant signup
│   │   ├── calls/                # Waiter call endpoints
│   │   ├── restaurants/         # Restaurant CRUD
│   │   ├── tables/              # Table management
│   │   ├── waiters/             # Waiter management
│   │   ├── promotions/          # Promotion management
│   │   └── health/              # Health check endpoint
│   ├── auth/                    # Authentication pages
│   │   ├── admin/               # Admin login/signup
│   │   └── waiter/              # Waiter login
│   ├── table/[qrCode]/          # Customer QR scan page
│   ├── waiter/[waiterId]/       # Waiter dashboard
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── lib/                         # Utility libraries
│   ├── auth/                    # Authentication helpers
│   ├── supabase/                # Supabase clients
│   ├── db.ts                    # Prisma client
│   └── utils/                   # Utility functions
├── prisma/
│   └── schema.prisma            # Database schema
└── public/                      # Static assets
```

---

## 🗄️ Database Schema

### Models

#### 1. **Restaurant**
- Represents a restaurant account
- Fields: `id`, `name`, `slug`, `email`, `phone`, `address`, `logoUrl`
- Relations: Has many Tables, Waiters, Promotions, Calls, Subscriptions

#### 2. **Table**
- Physical restaurant tables with QR codes
- Fields: `id`, `restaurantId`, `number`, `qrCode` (unique), `isActive`
- Relations: Belongs to Restaurant, Has many Calls, Many-to-many with Waiters

#### 3. **Waiter**
- Staff members who serve tables
- Fields: `id`, `restaurantId`, `name`, `email`, `phone`, `isActive`
- Relations: Belongs to Restaurant, Has many Calls, Many-to-many with Tables

#### 4. **WaiterTable**
- Junction table for waiter-table assignments
- Fields: `id`, `waiterId`, `tableId`
- Allows multiple waiters per table, multiple tables per waiter

#### 5. **Call**
- Customer requests for waiter assistance
- Fields: `id`, `restaurantId`, `tableId`, `waiterId`, `status`, `requestedAt`, `handledAt`, `responseTime`
- Status: `PENDING`, `HANDLED`, `CANCELLED`
- Tracks response time for analytics

#### 6. **Promotion**
- Ads/promotions shown to customers on QR page
- Fields: `id`, `restaurantId`, `title`, `description`, `imageUrl`, `linkUrl`, `isActive`, `startDate`, `endDate`, `displayOrder`

#### 7. **Subscription**
- Restaurant billing/subscription info
- Fields: `id`, `restaurantId`, `stripeCustomerId`, `stripeSubscriptionId`, `status`, `plan`, `currentPeriodEnd`
- Status: `TRIAL`, `ACTIVE`, `CANCELLED`, `PAST_DUE`

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/admin/signup` - Create restaurant admin account

### Restaurants
- `GET /api/restaurants/[restaurantId]` - Get restaurant details
- `GET /api/restaurants/[restaurantId]/tables` - Get all tables
- `POST /api/restaurants/[restaurantId]/tables` - Create table
- `GET /api/restaurants/[restaurantId]/waiters` - Get all waiters
- `POST /api/restaurants/[restaurantId]/waiters` - Create waiter
- `GET /api/restaurants/[restaurantId]/promotions` - Get promotions
- `POST /api/restaurants/[restaurantId]/promotions` - Create promotion

### Tables
- `GET /api/tables/[qrCode]` - Get table by QR code (public)
- `PATCH /api/tables/[tableId]` - Update table
- `DELETE /api/tables/[tableId]` - Delete table

### Waiters
- `GET /api/waiters/[waiterId]` - Get waiter details
- `PATCH /api/waiters/[waiterId]` - Update waiter
- `DELETE /api/waiters/[waiterId]` - Delete waiter
- `POST /api/waiters/[waiterId]/tables` - Assign tables to waiter

### Calls
- `POST /api/calls` - Create new waiter call
- `GET /api/calls?restaurantId=xxx&status=xxx` - Get calls
- `PATCH /api/calls/[callId]` - Update call status

### Promotions
- `PATCH /api/promotions/[promotionId]` - Update promotion
- `DELETE /api/promotions/[promotionId]` - Delete promotion

### Health
- `GET /api/health` - Check environment variables and system health

---

## 👥 User Roles & Flows

### 1. **Restaurant Admin**
**Flow:**
1. Sign up at `/auth/admin/signup`
2. Create restaurant account
3. Login at `/auth/admin`
4. Access dashboard at `/admin/[restaurantId]`

**Features:**
- Create/manage tables (with QR codes)
- Create/manage waiters
- Assign waiters to tables
- Create/manage promotions
- View analytics (total calls, response times, etc.)
- View all calls history

### 2. **Waiter**
**Flow:**
1. Admin creates waiter account
2. Waiter logs in at `/auth/waiter`
3. Access dashboard at `/waiter/[waiterId]`

**Features:**
- Real-time call notifications
- View pending calls
- Filter: All / My Tables / Handled
- Mark calls as handled
- See wait time indicators (color-coded by urgency)

### 3. **Customer**
**Flow:**
1. Scan QR code at table
2. Land on `/table/[qrCode]`
3. See restaurant info and promotions
4. Click "Call Waiter" button
5. Get confirmation message

**Features:**
- View table number
- See restaurant promotions
- One-click waiter calling
- No app download required

---

## 🔄 Real-time Features

### Supabase Realtime
- **Channel:** `waiter-calls-{waiterId}`
- **Table:** `Call`
- **Events:** 
  - `INSERT` - New call created (PENDING status)
  - `UPDATE` - Call status changed
- **Features:**
  - Instant notifications to waiters
  - Browser vibration on new calls
  - Auto-refresh call list

---

## 🎨 Key Features

### Admin Dashboard
- ✅ **Analytics Overview**
  - Total calls, pending calls, handled calls
  - Average response time
  - Recent calls list

- ✅ **Table Management**
  - Create/edit/delete tables
  - Generate unique QR codes
  - View QR code links
  - Activate/deactivate tables

- ✅ **Waiter Management**
  - Create/edit/delete waiters
  - Assign waiters to specific tables
  - View waiter assignments
  - Activate/deactivate waiters

- ✅ **Promotion Management**
  - Create/edit/delete promotions
  - Add images and links
  - Set start/end dates
  - Control display order

- ✅ **Call Analytics**
  - View all calls
  - Filter by status
  - See response times
  - Track performance

### Waiter Dashboard
- ✅ **Real-time Call Notifications**
  - Instant alerts for new calls
  - Browser vibration
  - Visual indicators

- ✅ **Call Management**
  - View all pending calls
  - Filter by assigned tables
  - Mark calls as handled
  - See wait time (color-coded)

- ✅ **Status Indicators**
  - Green: New request (< 2 min)
  - Yellow: Waiting (2-5 min)
  - Red: Urgent (> 5 min)

### Customer Experience
- ✅ **QR Code Scanning**
  - No app required
  - Instant page load
  - Mobile-optimized

- ✅ **Promotional Content**
  - Carousel of promotions
  - Images and descriptions
  - Clickable links

- ✅ **Simple Interface**
  - One-button calling
  - Clear confirmation
  - Restaurant branding

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Admin Signup:**
   - Creates restaurant in database
   - Creates Supabase user with `admin` role
   - Stores `restaurantId` in user metadata

2. **Admin Login:**
   - Supabase email/password auth
   - Extracts `restaurantId` from metadata
   - Redirects to admin dashboard

3. **Waiter Access:**
   - Admin creates waiter (no auth account)
   - Waiter accesses via `/waiter/[waiterId]`
   - Layout checks waiter exists

### Security Features
- Environment variable validation
- Database URL format validation
- Role-based access control
- Protected API routes
- Input validation
- Error handling with cleanup

---

## 🚀 Deployment

### Vercel Configuration
- **Runtime:** Node.js
- **Function Timeout:** 10 seconds (Hobby plan)
- **Build Command:** `prisma generate && next build`
- **Postinstall:** `prisma generate`

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Build Process
1. Install dependencies
2. Run `postinstall` → `prisma generate`
3. Run `build` → `prisma generate && next build`
4. Deploy serverless functions

---

## 📊 Data Flow

### Call Creation Flow
```
Customer scans QR
  ↓
GET /api/tables/[qrCode]
  ↓
Customer clicks "Call Waiter"
  ↓
POST /api/calls
  ↓
Create Call record (status: PENDING)
  ↓
Supabase Realtime triggers
  ↓
Waiter dashboard receives notification
  ↓
Waiter clicks "Mark as Handled"
  ↓
PATCH /api/calls/[callId]
  ↓
Update Call (status: HANDLED, responseTime calculated)
```

### Real-time Notification Flow
```
New Call Created
  ↓
Supabase Realtime INSERT event
  ↓
Waiter Dashboard subscribes to channel
  ↓
Event received → Update UI
  ↓
Browser vibration (if supported)
  ↓
Show notification badge
```

---

## 🛠️ Development

### Local Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

### Key Scripts
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## 📈 Future Enhancements

### Planned Features
- [ ] Stripe subscription integration
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Customer feedback system
- [ ] Menu integration
- [ ] Order management
- [ ] Payment processing

---

## 🐛 Known Issues & Solutions

### Common Issues
1. **Database Connection Error**
   - Check `DATABASE_URL` format
   - Verify password is correct
   - Ensure database is not paused

2. **Signup Timeout**
   - Reduced timeouts for Vercel limits
   - Added better error messages
   - Health check endpoint for diagnostics

3. **Real-time Not Working**
   - Enable replication for `Call` table in Supabase
   - Check Supabase Realtime status

---

## 📝 Code Quality

### Best Practices
- ✅ TypeScript for type safety
- ✅ Server components by default
- ✅ Client components only when needed
- ✅ Proper error handling
- ✅ Input validation
- ✅ Environment variable validation
- ✅ Timeout handling for serverless
- ✅ Cleanup on errors

### Project Rules
- All layouts must have valid HTML structure
- CSS imports at top of globals.css
- No multiple root elements in React
- Proper TypeScript types
- Automatic Prisma client generation

---

## 🎯 Success Metrics

### System Goals
- ✅ Instant waiter notifications (< 1 second)
- ✅ Simple customer experience (1 click)
- ✅ Comprehensive admin tools
- ✅ Real-time updates
- ✅ Analytics tracking
- ✅ Scalable architecture

---

## 📞 Support & Documentation

### Documentation Files
- `README.md` - Setup instructions
- `VERCEL_DEPLOYMENT.md` - Deployment guide
- `SIGNUP_TROUBLESHOOTING.md` - Signup issues
- `FIX_DATABASE_URL.md` - Database setup
- `QUICK_FIX_SIGNUP.md` - Quick fixes

### Health Check
Visit `/api/health` to verify:
- Environment variables are set
- Database URL format is valid
- All services are configured

---

## 🏆 Project Status

### Completed ✅
- Database schema design
- Admin dashboard
- Waiter dashboard
- Customer QR page
- Real-time notifications
- API endpoints
- Authentication system
- Error handling
- Deployment configuration

### In Progress ⏳
- Stripe integration
- Advanced analytics
- Email notifications

---

This is a **production-ready** restaurant service management system with real-time capabilities, comprehensive admin tools, and a simple customer experience.

