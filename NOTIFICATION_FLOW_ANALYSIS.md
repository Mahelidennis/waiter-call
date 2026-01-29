# WaiterCall Notification Flow Analysis

## Task 1: Current Flow Analysis

### How a Customer Call is Currently Created

1. **Customer Action**: Customer scans QR code and taps "Call Waiter"
2. **API Call**: `POST /api/calls` is called with `tableId` and `restaurantId`
3. **Database Creation**: Call is created with status `PENDING`
4. **Waiter Assignment**: System checks for assigned waiter via `WaiterTable` relationship
5. **Response**: Returns created call object

**Code Flow**:
```typescript
// app/table/[qrCode]/page.tsx - handleCallWaiter()
async function handleCallWaiter() {
  const response = await fetch('/api/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableId, restaurantId })
  })
}

// app/api/calls/route.ts - POST
const call = await prisma.call.create({
  data: {
    restaurantId,
    tableId,
    waiterId: waiterTable?.waiterId || null,
    status: 'PENDING',
  }
})
```

### How Waiters Are Notified

**Current Method: HTTP Polling**
- **Polling Interval**: 7 seconds
- **Endpoint**: `GET /api/waiter/calls?status={filter}`
- **Real-time Detection**: Compares previous calls with new calls
- **Visual Notification**: Banner appears for new pending calls
- **Haptic Feedback**: Vibration on supported devices
- **Auto-dismiss**: Notification disappears after 5 seconds

**Code Implementation**:
```typescript
// app/waiter/[waiterId]/page.tsx - Polling Effect
useEffect(() => {
  const POLLING_INTERVAL = 7000 // 7 seconds
  intervalId = setInterval(() => {
    fetchCalls(true) // Mark as polling
  }, POLLING_INTERVAL)
}, [filter, waiter])

// New Call Detection
if (isPolling && previousCalls.length > 0) {
  const newPendingCalls = data.filter((call: Call) => 
    call.status === 'PENDING' && 
    !call.waiterId && 
    !previousCallIds.has(call.id)
  )
  // Show notification
}
```

### Real-time Updates Analysis

**❌ NO REAL-TIME TECHNOLOGY USED**
- **No WebSockets**: Not implemented
- **No Supabase Realtime**: Library exists but not used in waiter dashboard
- **No Server-Sent Events**: Not implemented
- **Only HTTP Polling**: 7-second intervals

**Supabase Realtime Available but Unused**:
```typescript
// lib/supabase/realtime.ts - EXISTS BUT NOT USED
export function subscribeToCalls(restaurantId, callback) {
  const channel = supabase.channel(`calls:${restaurantId}`)
    .on('postgres_changes', { event: 'INSERT', table: 'Call' }, callback)
    .subscribe()
}
```

### What Happens When Waiter Closes Browser

**❌ CRITICAL RELIABILITY GAPS IDENTIFIED**

1. **Browser Closed**:
   - ❌ Polling stops immediately
   - ❌ No notifications received
   - ❌ Calls created during absence are NOT shown when reopened
   - ❌ Only calls since browser opened are displayed

2. **Phone Locked**:
   - ❌ Polling may continue (depends on browser/OS)
   - ❌ No guarantee of notification delivery
   - ❌ Background throttling may delay updates

3. **Logs In Later**:
   - ❌ Only recent calls fetched (limited to 50)
   - ❌ Older missed calls may be lost
   - ❌ No "missed calls" concept or persistence

### Database Schema Analysis

**Call States Available**:
```sql
enum CallStatus {
  PENDING    // Initial state
  HANDLED    // After acknowledgment
  CANCELLED  // Not currently used
}
```

**Missing States for Production**:
- ❌ `ACKNOWLEDGED` (waiter accepted the call)
- ❌ `COMPLETED` (service delivered)
- ❌ `MISSED` (waiter never responded)
- ❌ `TIMEOUT` (call expired)

### Current Reliability Gaps

1. **No Persistent Notifications**: Missed calls are lost forever
2. **No Missed Call History**: Waiters can't see what they missed
3. **No Call Escalation**: No backup notification system
4. **No Offline Support**: No service worker or PWA capabilities
5. **Limited History**: Only 50 recent calls fetched
6. **No Priority System**: All calls treated equally
7. **No Analytics**: No tracking of missed/acknowledged rates

---

## Task 2: Production-Ready Notification Flow Design

### Enhanced Database Schema

**New Call States**:
```sql
enum CallStatus {
  PENDING       // Customer called, waiting for waiter
  ACKNOWLEDGED  // Waiter accepted the call
  IN_PROGRESS   // Waiter is at the table
  COMPLETED     // Service completed
  MISSED        // Waiter never responded (timeout)
  CANCELLED     // Customer cancelled
}
```

**Additional Fields**:
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
```

### Production Event Flow

```
Customer → Backend → Waiter (Complete Flow)

1. CUSTOMER CALLS
   ├─ Customer taps "Call Waiter"
   ├─ POST /api/calls
   ├─ Create call with status=PENDING
   ├─ Set timeoutAt = now() + 5 minutes
   ├─ Trigger real-time event
   └─ Send push notification (if available)

2. BACKEND PROCESSING
   ├─ Save to database
   ├─ Emit Supabase Realtime event
   ├─ Check for assigned waiter
   ├─ Start timeout monitoring
   └─ Log analytics event

3. WAITER NOTIFICATION
   ├─ Real-time update via Supabase
   ├─ Fallback to HTTP polling (3 seconds)
   ├─ Visual notification banner
   ├─ Haptic feedback
   ├─ Sound notification
   └─ Browser notification (if granted)

4. WAITER ACKNOWLEDGES
   ├─ Waiter taps "Acknowledge"
   ├─ POST /api/calls/[id]/acknowledge
   ├─ Update status=ACKNOWLEDGED
   ├─ Record acknowledgedAt timestamp
   ├─ Calculate responseTimeMs
   ├─ Emit real-time update
   └─ Stop timeout monitoring

5. SERVICE COMPLETION
   ├─ Waiter taps "Complete"
   ├─ POST /api/calls/[id]/complete
   ├─ Update status=COMPLETED
   ├─ Record completedAt timestamp
   ├─ Calculate total service time
   └─ Emit real-time update

6. TIMEOUT HANDLING
   ├─ Background job checks timeoutAt
   ├─ If timeout exceeded:
   │  ├─ Update status=MISSED
   │  ├─ Record missedAt timestamp
   │  ├─ Set missedReason="timeout"
   │  ├─ Escalate to manager
   │  └─ Send alert notification
   └─ Log missed call analytics

7. WAITER RECONNECTS
   ├─ Waiter opens app/browser
   ├─ GET /api/waiter/calls?include=missed
   ├─ Show missed calls section
   ├─ Display call age and reason
   ├─ Allow manual acknowledgment
   └─ Sync all pending calls
```

### Enhanced Notification System

**Multi-Layer Notification Approach**:

1. **Primary: Supabase Realtime**
   ```typescript
   // Real-time subscription
   const channel = supabase.channel(`waiter-calls:${waiterId}`)
     .on('postgres_changes', 
       { event: '*', table: 'Call', filter: `waiterId=eq.${waiterId}` },
       handleRealtimeUpdate
     )
     .subscribe()
   ```

2. **Secondary: HTTP Polling (3 seconds)**
   ```typescript
   // Fallback polling
   const POLLING_INTERVAL = 3000 // Reduced from 7 seconds
   ```

3. **Tertiary: Browser Notifications**
   ```typescript
   // Request permission and send notifications
   if ('Notification' in window && Notification.permission === 'granted') {
     new Notification('New Table Call', {
       body: `Table ${call.table.number} needs assistance`,
       icon: '/icon-192x192.png',
       tag: call.id
     })
   }
   ```

4. **Quaternary: Push Notifications (Future)**
   - Service Worker implementation
   - VAPID keys setup
   - Background sync

### Missed Call System

**Missed Call Detection**:
```typescript
// Background job to check for timeouts
async function checkCallTimeouts() {
  const expiredCalls = await prisma.call.findMany({
    where: {
      status: 'PENDING',
      timeoutAt: { lt: new Date() }
    }
  })
  
  for (const call of expiredCalls) {
    await prisma.call.update({
      where: { id: call.id },
      data: {
        status: 'MISSED',
        missedAt: new Date(),
        missedReason: 'timeout'
      }
    })
    
    // Escalate to manager
    await escalateMissedCall(call)
  }
}
```

**Missed Call Display**:
```typescript
// Show missed calls prominently
const missedCalls = calls.filter(call => call.status === 'MISSED')
const urgentMissed = missedCalls.filter(call => 
  call.missedReason === 'timeout' && 
  new Date() - new Date(call.missedAt) < 300000 // 5 minutes
)
```

### Enhanced API Endpoints

**New Endpoints**:
```typescript
// GET /api/waiter/calls?include=missed&status=all
// Returns all calls including missed ones

// POST /api/calls/[id]/acknowledge
// Updates status to ACKNOWLEDGED

// POST /api/calls/[id]/complete  
// Updates status to COMPLETED

// GET /api/waiter/calls/missed
// Returns only missed calls

// POST /api/calls/[id]/escalate
// Escalates missed call to manager
```

### Reliability Guarantees

**✅ Production Guarantees**:

1. **No Lost Calls**: Every call is persisted permanently
2. **Missed Call History**: Complete visibility of all missed calls
3. **Reconnection Sync**: Full sync when waiter reconnects
4. **Timeout Protection**: Automatic missed call detection
5. **Escalation System**: Manager alerts for critical missed calls
6. **Analytics Tracking**: Complete metrics on response times
7. **Offline Support**: Service worker for background notifications
8. **Redundant Notifications**: Multiple notification channels

### Implementation Priority

**Phase 1: Critical Reliability**
1. Update database schema with new states
2. Implement missed call detection
3. Add missed calls to waiter dashboard
4. Reduce polling to 3 seconds

**Phase 2: Enhanced Experience**
1. Implement Supabase Realtime
2. Add browser notifications
3. Improve timeout handling
4. Add call analytics

**Phase 3: Advanced Features**
1. Push notifications
2. Service worker/PWA
3. Manager escalation
4. Advanced analytics

This design ensures no customer calls are ever lost and provides complete visibility for restaurant management.
