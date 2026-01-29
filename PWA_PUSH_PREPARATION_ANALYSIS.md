# Production-Grade Waiter Notifications: Preparation & Read-Only Analysis

## 1. System Readiness Audit

### Service Call Creation & Storage

**Current Call Creation Flow:**
```
Customer taps "Call Waiter" 
→ POST /api/calls (tableId, restaurantId)
→ Verify table exists and is active
→ Get assigned waiter via WaiterTable relationship
→ Create Call record with status=PENDING
→ Return call object
```

**Database Storage:**
```sql
model Call {
  id            String       @id @default(uuid())
  restaurantId  String
  tableId       String
  waiterId      String?      // Assigned waiter (null initially)
  status        CallStatus   @default(PENDING) // LIMITED STATES
  requestedAt   DateTime     @default(now())
  handledAt     DateTime?    // When resolved
  responseTime  Int?         // Response time in seconds
}
```

**Current Call States:**
```sql
enum CallStatus {
  PENDING    // Customer called, waiting for waiter
  HANDLED    // Waiter completed service
  CANCELLED  // Not currently used
}
```

**❌ Critical Gaps Identified:**
- No `ACKNOWLEDGED` state (waiter accepted call)
- No `COMPLETED` state (service delivered)
- No `MISSED` state (waiter never responded)
- No timeout tracking (`timeoutAt` field missing)
- No missed call analytics
- No escalation mechanism

### Waiter Assignment System

**Current Assignment Logic:**
```typescript
// From /api/calls/route.ts
const waiterTable = await prisma.waiterTable.findFirst({
  where: { tableId },
  include: { waiter: true }
})

// Call created with assigned waiter or null
waiterId: waiterTable?.waiterId || null
```

**Assignment Model:**
```sql
model WaiterTable {
  id        String   @id @default(uuid())
  waiterId  String
  tableId   String
  createdAt DateTime @default(now())
  
  // Many-to-many relationship
  @@unique([waiterId, tableId])
}
```

**✅ Assignment System Strengths:**
- Proper many-to-many relationship
- Table-waiter assignments persisted
- Atomic operations with transactions

### Waiter Authentication & Sessions

**Current Session System:**
```typescript
// lib/auth/waiterSession.ts
type WaiterSession = {
  waiterId: string
  restaurantId: string
  exp: number
}

// Cookie-based authentication
SESSION_COOKIE_NAME = 'waiter_session'
SESSION_MAX_AGE_SECONDS = 60 * 60 * 12 // 12 hours
```

**Authentication Flow:**
```
Waiter login → Create session token → Set cookie → API calls validate token
```

**✅ Session System Strengths:**
- Secure HMAC-based tokens
- Proper expiration handling
- Restaurant-scoped sessions
- Inactive waiter validation

**❌ Session Gaps:**
- No device identification
- No multi-device support
- No push notification subscription tracking

### Current Notification Mechanisms

**Primary Method: HTTP Polling**
```typescript
// app/waiter/[waiterId]/page.tsx
const POLLING_INTERVAL = 7000 // 7 seconds
useEffect(() => {
  intervalId = setInterval(() => {
    fetchCalls(true) // Poll for updates
  }, POLLING_INTERVAL)
}, [filter, waiter])
```

**Notification Types:**
- Visual banner (appears for 5 seconds)
- Haptic feedback (vibration)
- Live status indicator (pulsing dot)

**❌ Critical Notification Gaps:**
- No real-time updates (WebSockets/Supabase Realtime unused)
- No browser notifications
- No push notifications
- No offline support
- Polling interval too long (7 seconds)
- No missed call persistence

---

## 2. Architecture Mapping

### Current Flow Diagram

```
CUSTOMER → CALL CREATION
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Customer scans  │ →  │ POST /api/calls  │ →  │ Create Call     │
│ QR code         │    │                  │    │ status=PENDING  │
│ Taps "Call"     │    │ Verify table     │    │ Assign waiter   │
└─────────────────┘    │ Get waiterTable  │    │ Return call     │
                       └──────────────────┘    └─────────────────┘

BACKEND → PERSISTENCE
┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Call created     │ →  │ PostgreSQL       │ →  │ Call record     │
│ status=PENDING   │    │ Atomic write     │    │ waiterId set    │
│ waiterId assigned│    │ Transaction      │    │ requestedAt      │
└──────────────────┘    └──────────────────┘    └─────────────────┘

WAITER → VISIBILITY
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Waiter opens    │ →  │ GET /waiter/calls│ →  │ Filter by       │
│ dashboard       │    │ every 7 seconds  │    │ assigned tables │
│ Polling starts  │    │ status=pending   │    │ Return calls    │
└─────────────────┘    └──────────────────┘    └─────────────────┘

NOTIFICATION DELIVERY
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ New call detected│ →  │ Show banner      │ →  │ Vibrate device  │
│ Compare arrays   │    │ Auto-dismiss 5s  │    │ Visual alert    │
│ Polling result   │    │ No persistence   │    │ No history      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Current Failure Points

**Browser Closed:**
```
❌ Polling stops immediately
❌ No notifications during absence
❌ Calls created during absence NOT shown on reopen
❌ Only calls since browser opened are displayed
❌ No missed call history or recovery
```

**Phone Locked:**
```
❌ Polling may continue (browser/OS dependent)
❌ Background throttling delays updates
❌ No guaranteed notification delivery
❌ Screen must be on for notifications
❌ No wake-lock or background processing
```

**Reconnect After Absence:**
```
❌ Only fetches 50 recent calls
❌ Older missed calls permanently lost
❌ No "missed calls" section
❌ No indication of what was missed
❌ No escalation for critical missed calls
```

---

## 3. PWA & Push Prerequisites Checklist

### PWA Eligibility Assessment

**✅ Current PWA Readiness:**
- Next.js 16.1.4 (supports PWA)
- HTTPS-ready deployment
- Responsive design implemented
- Service worker capability available

**❌ Missing PWA Files:**
- No `manifest.json` (PWA manifest)
- No service worker (`sw.js`)
- No offline fallback pages
- No app icons (multiple sizes)
- No splash screens
- No PWA metadata in layout

**Required PWA Files to Create:**
```
public/
├── manifest.json          # PWA manifest
├── sw.js                   # Service worker
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── splash/
    ├── splash-640x1136.png
    ├── splash-750x1334.png
    ├── splash-828x1792.png
    └── splash-1125x2436.png
```

### Database Schema Requirements

**New Call Fields Needed:**
```sql
model Call {
  // ... existing fields ...
  acknowledgedAt    DateTime?    // When waiter acknowledged
  completedAt       DateTime?    // When service completed
  missedAt          DateTime?    // When call was marked missed
  timeoutAt         DateTime?    // When call will timeout
  priority          Int          @default(0) // Priority level
  missedReason      String?      // Why call was missed
  responseTimeMs    Int?         // Response time in milliseconds
}

// New enum values
enum CallStatus {
  PENDING
  ACKNOWLEDGED  // NEW
  IN_PROGRESS   // NEW
  COMPLETED     // NEW
  MISSED        // NEW
  CANCELLED
}
```

**New Tables Required:**
```sql
// Push notification subscriptions
model PushSubscription {
  id            String   @id @default(uuid())
  waiterId      String
  endpoint      String   // Push service endpoint
  p256dhKey     String   // Encryption key
  authKey       String   // Authentication key
  userAgent     String?  // Device/browser info
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  waiter        Waiter   @relation(fields: [waiterId], references: [id], onDelete: Cascade)
  
  @@unique([waiterId, endpoint])
}

// Missed call analytics
model MissedCallAnalytics {
  id            String   @id @default(uuid())
  restaurantId  String
  waiterId      String?
  callId        String
  missedReason  String   // 'timeout', 'offline', 'browser_closed'
  missedDuration Int?    // How long it was missed
  recoveredAt   DateTime? // When waiter finally saw it
  createdAt     DateTime @default(now())
}
```

### Environment Variables Required

**Push Notification Variables:**
```env
# VAPID Keys for Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@domain.com

# Service Worker
NEXT_PUBLIC_SW_URL=/sw.js
NEXT_PUBLIC_SW_SCOPE=/

# Push Service (optional)
PUSH_SERVICE_URL=https://your-push-service.com
```

**Database/Realtime Variables:**
```env
# Supabase Realtime
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Enable Realtime
SUPABASE_REALTIME_ENABLED=true
```

### Browser APIs to Be Used

**Push Notification APIs:**
```javascript
// Push API
navigator.serviceWorker.ready.then(registration => {
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey
  })
})

// Notification API
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    new Notification('New Table Call', {
      body: 'Table 5 needs assistance',
      icon: '/icon-192x192.png',
      tag: 'call-123',
      requireInteraction: true
    })
  }
})
```

**Service Worker APIs:**
```javascript
// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-calls') {
    event.waitUntil(syncCalls())
  }
})

// Push events
self.addEventListener('push', event => {
  event.waitUntil(showNotification(event.data.json()))
})
```

**Real-time APIs:**
```javascript
// Supabase Realtime
const channel = supabase.channel(`waiter-calls:${waiterId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'Call',
    filter: `waiterId=eq.${waiterId}`
  }, handleRealtimeUpdate)
  .subscribe()
```

---

## 4. Staged Implementation Plan

### Stage 1: Database & Lifecycle Reliability

**Goal:** Establish robust call state management and missed call tracking

**Files That Will Change:**
```
prisma/schema.prisma                    # Add new fields and enum values
app/api/calls/route.ts                   # Enhanced call creation
app/api/waiter/calls/route.ts            # Include missed calls
app/waiter/[waiterId]/page.tsx           # Show missed calls section
migrations/                             # Database migration
```

**Implementation Steps:**
1. Update Call model with new fields (acknowledgedAt, completedAt, missedAt, timeoutAt)
2. Add new CallStatus enum values (ACKNOWLEDGED, IN_PROGRESS, COMPLETED, MISSED)
3. Create PushSubscription and MissedCallAnalytics tables
4. Modify call creation to set timeoutAt = now() + 5 minutes
5. Update waiter calls API to include missed calls
6. Add missed calls section to waiter dashboard
7. Create background job for timeout detection

**Testing Before Next Stage:**
- ✅ Call creation with timeout tracking
- ✅ Missed call detection and marking
- ✅ Missed calls visible in dashboard
- ✅ Database migration successful
- ✅ No breaking changes to existing functionality

### Stage 2: Real-time Sync

**Goal:** Replace polling with real-time updates

**Files That Will Change:**
```
app/waiter/[waiterId]/page.tsx           # Add Supabase Realtime
lib/supabase/realtime.ts                 # Implement real-time subscriptions
app/api/waiter/calls/[callId]/acknowledge/route.ts  # Emit real-time events
app/api/waiter/calls/[callId]/resolve/route.ts     # Emit real-time events
```

**Implementation Steps:**
1. Implement Supabase Realtime subscription in waiter dashboard
2. Add real-time event emission in acknowledge/resolve endpoints
3. Reduce polling to 3 seconds as fallback
4. Add connection status indicator
5. Implement reconnection logic
6. Add real-time error handling

**Testing Before Next Stage:**
- ✅ Real-time updates working
- ✅ Fallback polling functional
- ✅ Connection reconnection works
- ✅ No duplicate notifications
- ✅ Performance impact acceptable

### Stage 3: PWA Foundation

**Goal:** Transform app into installable PWA

**Files That Will Change:**
```
public/manifest.json                     # PWA manifest
public/sw.js                            # Service worker
public/icons/                           # App icons (multiple sizes)
public/splash/                          # Splash screens
app/layout.tsx                          # PWA metadata
app/waiter/[waiterId]/page.tsx          # PWA install prompt
```

**Implementation Steps:**
1. Create PWA manifest with app metadata
2. Generate app icons and splash screens
3. Implement service worker with caching strategy
4. Add PWA metadata to layout
5. Install prompt for waiters
6. Offline fallback page
7. Cache critical assets

**Testing Before Next Stage:**
- ✅ App installs as PWA
- ✅ Works offline with cached data
- ✅ Service worker registered
- ✅ App launches from home screen
- ✅ Proper splash screens shown

### Stage 4: Push Notifications

**Goal:** Implement reliable push notifications

**Files That Will Change:**
```
public/sw.js                            # Push event handling
app/waiter/[waiterId]/page.tsx          # Push subscription management
lib/push/vapid.ts                       # VAPID key generation
lib/push/subscription.ts                # Subscription management
app/api/push/subscribe/route.ts         # Subscription endpoint
app/api/waiter/calls/route.ts           # Push notification sending
```

**Implementation Steps:**
1. Generate VAPID keys
2. Implement push subscription management
3. Add push event handling in service worker
4. Create subscription API endpoint
5. Integrate push sending in call creation
6. Add notification permission request
7. Implement notification click handling

**Testing Before Production:**
- ✅ Push notifications received when app closed
- ✅ Notifications work when phone locked
- ✅ Subscription persistence across sessions
- ✅ Notification actions work (acknowledge/resolve)
- ✅ Battery impact acceptable
- ✅ Privacy compliance met

---

## 5. Safety Rules

### What Must NOT Be Implemented Yet

**Stage 1 Restrictions:**
- ❌ No real-time features (wait for Stage 2)
- ❌ No PWA files (wait for Stage 3)
- ❌ No push notifications (wait for Stage 4)
- ❌ No service worker implementation
- ❌ No VAPID key generation

**Stage 2 Restrictions:**
- ❌ No PWA manifest creation
- ❌ No service worker files
- ❌ No push notification setup
- ❌ No offline functionality

**Stage 3 Restrictions:**
- ❌ No push notification implementation
- ❌ No VAPID configuration
- ❌ No subscription management

**Stage 4 Restrictions:**
- ❌ No database schema changes
- ❌ No real-time logic modifications
- ❌ No PWA manifest changes

### Required Dependencies Before Push Notifications

**Database Dependencies (Stage 1):**
- ✅ Enhanced Call schema with timeout tracking
- ✅ PushSubscription table created
- ✅ MissedCallAnalytics table created
- ✅ Background job for timeout detection

**Real-time Dependencies (Stage 2):**
- ✅ Supabase Realtime implementation
- ✅ Fallback polling mechanism
- ✅ Connection management system

**PWA Dependencies (Stage 3):**
- ✅ PWA manifest created
- ✅ Service worker implemented
- ✅ App icons generated
- ✅ Offline caching strategy

**Security Dependencies:**
- ✅ VAPID keys generated
- ✅ HTTPS deployment
- ✅ Push permission handling
- ✅ Subscription encryption

### Critical Success Criteria

**Before Moving to Next Stage:**
1. **All tests pass** - No breaking changes
2. **Performance maintained** - No significant slowdowns
3. **Backward compatibility** - Existing features work
4. **Error handling** - Graceful degradation
5. **Documentation updated** - Clear implementation notes

**Production Readiness:**
1. **Zero call loss** - All calls captured and tracked
2. **Reliable notifications** - Multiple notification channels
3. **Offline support** - Basic functionality without internet
4. **Analytics ready** - Complete metrics collection
5. **Scalable architecture** - Handles restaurant growth

---

## Conclusion

The current system has fundamental reliability gaps that result in lost customer calls. The staged implementation plan ensures safe, incremental progression to a production-ready notification system with PWA capabilities and push notifications.

Each stage builds upon the previous one, ensuring no single point of failure and maintaining system stability throughout the enhancement process.
