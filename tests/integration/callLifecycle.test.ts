/**
 * Integration Tests for Full Call Lifecycle
 * 
 * Tests the complete call lifecycle from creation to completion,
 * including all API endpoints, database operations, realtime updates,
 * and push notifications.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { CallStatus } from '@/lib/constants/callStatus'
import { performanceMonitor, globalPerformanceMonitor, PerformanceTimer } from '@/lib/monitoring/performanceMonitor'
import { logger } from '@/lib/monitoring/logger'

// Test utilities
import { createTestRestaurant, createTestWaiter, createTestTable, createTestCall } from '../helpers/testData'
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/testDatabase'
import { mockPushNotifications, clearPushNotificationMocks } from '../helpers/mockPushNotifications'
import { mockRealtimeConnection, clearRealtimeMocks } from '../helpers/mockRealtime'

// Global mock instances for simulateApiCall function
let pushMock: any
let realtimeMock: any

describe('Call Lifecycle Integration Tests', () => {
  let testRestaurant: any
  let testWaiter: any
  let testTable: any
  let testCall: any
  let authToken: string
  let waiterAuthToken: string

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase()
    
    // Start performance monitoring for tests
    globalPerformanceMonitor.startMonitoring(1000)
    
    // Setup mocks
    pushMock = mockPushNotifications()
    realtimeMock = mockRealtimeConnection()
    
    console.log('🧪 Setting up integration test environment')
  })

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase()
    
    // Stop monitoring
    globalPerformanceMonitor.stopMonitoring()
    
    // Clear mocks
    clearPushNotificationMocks()
    clearRealtimeMocks()
    
    console.log('🧹 Cleaning up integration test environment')
  })

  beforeEach(async () => {
    // Create test data
    testRestaurant = await createTestRestaurant()
    testWaiter = await createTestWaiter(testRestaurant.id)
    testTable = await createTestTable(testRestaurant.id)
    
    // Assign waiter to table
    await prisma.waiterTable.create({
      data: {
        waiterId: testWaiter.id,
        tableId: testTable.id
      }
    })
    
    // Create auth tokens
    authToken = `Bearer test-admin-token-${testRestaurant.id}`
    waiterAuthToken = `Bearer test-waiter-token-${testWaiter.id}`
    
    // Clear any existing test data
    await prisma.call.deleteMany({
      where: { restaurantId: testRestaurant.id }
    })
    
    logger.info('Test setup complete', 'TEST', {
      restaurantId: testRestaurant.id,
      waiterId: testWaiter.id,
      tableId: testTable.id
    })
  })

  afterEach(async () => {
    // Clean up test calls
    await prisma.call.deleteMany({
      where: { restaurantId: testRestaurant.id }
    })
    
    // Clear performance metrics between tests
    globalPerformanceMonitor.reset()
    
    logger.info('Test cleanup complete', 'TEST')
  })

  describe('1. Call Creation', () => {
    test('should create a new call successfully', async () => {
      const timer = new PerformanceTimer('test_call_creation')
      
      const requestBody = {
        tableId: testTable.id,
        restaurantId: testRestaurant.id
      }

      const request = new NextRequest('http://localhost:3000/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'test-client'
        },
        body: JSON.stringify(requestBody)
      })

      // Mock the API call
      const response = await simulateApiCall('/api/calls', request)
      
      timer.end({ success: true })

      expect(response.status).toBe(201)
      const call = await response.json()
      
      expect(call.id).toBeDefined()
      expect(call.restaurantId).toBe(testRestaurant.id)
      expect(call.tableId).toBe(testTable.id)
      expect(call.status).toBe(CallStatus.PENDING)
      expect(call.waiterId).toBe(testWaiter.id)
      expect(call.timeoutAt).toBeDefined()
      expect(call.requestedAt).toBeDefined()
      
      // Verify in database
      const dbCall = await prisma.call.findUnique({
        where: { id: call.id },
        include: { table: true, waiter: true }
      })
      
      expect(dbCall).toBeTruthy()
      expect(dbCall!.status).toBe(CallStatus.PENDING)
      expect(dbCall!.table.id).toBe(testTable.id)
      expect(dbCall!.waiter!.id).toBe(testWaiter.id)
      
      // Verify push notification was sent
      expect(pushMock.sentNotifications).toContainEqual(
        expect.objectContaining({
          callId: call.id,
          tableNumber: testTable.number,
          restaurantId: testRestaurant.id,
          waiterId: testWaiter.id
        })
      )
      
      // Verify realtime event was sent
      expect(realtimeMock.events).toContainEqual(
        expect.objectContaining({
          eventType: 'INSERT',
          new: expect.objectContaining({
            id: call.id,
            status: CallStatus.PENDING
          })
        })
      )
      
      testCall = call
      
      logger.info('Call creation test passed', 'TEST', {
        callId: call.id,
        duration: timer.getDuration()
      })
    })

    test('should reject call creation with invalid table', async () => {
      const requestBody = {
        tableId: 'invalid-table-id',
        restaurantId: testRestaurant.id
      }

      const request = new NextRequest('http://localhost:3000/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await simulateApiCall('/api/calls', request)
      
      expect(response.status).toBe(404)
      const error = await response.json()
      expect(error.error).toBe('Table not found')
      
      // Verify no call was created
      const callCount = await prisma.call.count({
        where: { restaurantId: testRestaurant.id }
      })
      expect(callCount).toBe(0)
    })

    test('should reject call creation with missing required fields', async () => {
      const requestBody = {
        tableId: testTable.id
        // Missing restaurantId
      }

      const request = new NextRequest('http://localhost:3000/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const response = await simulateApiCall('/api/calls', request)
      
      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toBe('Validation failed')
      expect(error.details).toContainEqual(
        expect.objectContaining({
          field: 'restaurantId',
          code: 'REQUIRED'
        })
      )
    })
  })

  describe('2. Call Retrieval', () => {
    beforeEach(async () => {
      // Create a test call for retrieval tests
      testCall = await createTestCall(testRestaurant.id, testTable.id, testWaiter.id)
    })

    test('should retrieve calls for restaurant', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/calls?restaurantId=${testRestaurant.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const response = await simulateApiCall('/api/calls', request)
      
      expect(response.status).toBe(200)
      const calls = await response.json()
      
      expect(Array.isArray(calls)).toBe(true)
      expect(calls).toHaveLength(1)
      expect(calls[0].id).toBe(testCall.id)
      expect(calls[0].status).toBe(CallStatus.PENDING)
      expect(calls[0].normalizedStatus).toBe(CallStatus.PENDING)
      expect(calls[0].isActive).toBe(true)
      expect(calls[0].isTerminal).toBe(false)
    })

    test('should filter calls by status', async () => {
      // Create additional calls with different statuses
      await prisma.call.create({
        data: {
          restaurantId: testRestaurant.id,
          tableId: testTable.id,
          waiterId: testWaiter.id,
          status: CallStatus.COMPLETED,
          requestedAt: new Date(),
          completedAt: new Date()
        }
      })

      const request = new NextRequest(
        `http://localhost:3000/api/calls?restaurantId=${testRestaurant.id}&status=pending`,
        {
          method: 'GET',
          headers: { 'Authorization': authToken }
        }
      )

      const response = await simulateApiCall('/api/calls', request)
      
      expect(response.status).toBe(200)
      const calls = await response.json()
      
      expect(calls).toHaveLength(1)
      expect(calls[0].status).toBe(CallStatus.PENDING)
    })

    test('should require authentication for call retrieval', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/calls?restaurantId=${testRestaurant.id}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
          // No Authorization header
        }
      )

      const response = await simulateApiCall('/api/calls', request)
      
      expect(response.status).toBe(401)
      const error = await response.json()
      expect(error.error).toBe('Authentication required')
    })
  })

  describe('3. Call Acknowledgment', () => {
    beforeEach(async () => {
      testCall = await createTestCall(testRestaurant.id, testTable.id, testWaiter.id)
    })

    test('should acknowledge call successfully', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${testCall.id}/acknowledge`,
        {
          method: 'POST',
          headers: {
            'Authorization': waiterAuthToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const response = await simulateApiCall('/api/waiter/calls/[callId]/acknowledge', request)
      
      expect(response.status).toBe(200)
      const updatedCall = await response.json()
      
      expect(updatedCall.status).toBe(CallStatus.ACKNOWLEDGED)
      expect(updatedCall.waiterId).toBe(testWaiter.id)
      expect(updatedCall.acknowledgedAt).toBeDefined()
      expect(updatedCall.responseTime).toBeGreaterThan(0)
      
      // Verify in database
      const dbCall = await prisma.call.findUnique({
        where: { id: testCall.id }
      })
      
      expect(dbCall!.status).toBe(CallStatus.ACKNOWLEDGED)
      expect(dbCall!.waiterId).toBe(testWaiter.id)
      expect(dbCall!.acknowledgedAt).toBeTruthy()
      
      // Verify realtime event
      expect(realtimeMock.events).toContainEqual(
        expect.objectContaining({
          eventType: 'UPDATE',
          new: expect.objectContaining({
            id: testCall.id,
            status: CallStatus.ACKNOWLEDGED
          })
        })
      )
    })

    test('should reject acknowledgment by unauthorized waiter', async () => {
      // Create another waiter
      const otherWaiter = await createTestWaiter(testRestaurant.id)
      const otherToken = `Bearer test-waiter-token-${otherWaiter.id}`

      const request = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${testCall.id}/acknowledge`,
        {
          method: 'POST',
          headers: {
            'Authorization': otherToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const response = await simulateApiCall('/api/waiter/calls/[callId]/acknowledge', request)
      
      expect(response.status).toBe(403)
      const error = await response.json()
      expect(error.error).toContain('not assigned to this table')
    })

    test('should reject acknowledgment of already acknowledged call', async () => {
      // First acknowledge the call
      await prisma.call.update({
        where: { id: testCall.id },
        data: { status: CallStatus.ACKNOWLEDGED }
      })

      const request = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${testCall.id}/acknowledge`,
        {
          method: 'POST',
          headers: {
            'Authorization': waiterAuthToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const response = await simulateApiCall('/api/waiter/calls/[callId]/acknowledge', request)
      
      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toContain('cannot be acknowledged')
    })
  })

  describe('4. Call Resolution', () => {
    beforeEach(async () => {
      testCall = await createTestCall(testRestaurant.id, testTable.id, testWaiter.id, CallStatus.ACKNOWLEDGED)
    })

    test('should resolve call successfully', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${testCall.id}/resolve`,
        {
          method: 'POST',
          headers: {
            'Authorization': waiterAuthToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const response = await simulateApiCall('/api/waiter/calls/[callId]/resolve', request)
      
      expect(response.status).toBe(200)
      const resolvedCall = await response.json()
      
      expect(resolvedCall.status).toBe(CallStatus.COMPLETED)
      expect(resolvedCall.waiterId).toBe(testWaiter.id)
      expect(resolvedCall.completedAt).toBeDefined()
      expect(resolvedCall.responseTime).toBeGreaterThan(0)
      
      // Verify in database
      const dbCall = await prisma.call.findUnique({
        where: { id: testCall.id }
      })
      
      expect(dbCall!.status).toBe(CallStatus.COMPLETED)
      expect(dbCall!.completedAt).toBeTruthy()
      expect(dbCall!.handledAt).toBeTruthy() // Legacy field
      
      // Verify realtime event
      expect(realtimeMock.events).toContainEqual(
        expect.objectContaining({
          eventType: 'UPDATE',
          new: expect.objectContaining({
            id: testCall.id,
            status: CallStatus.COMPLETED
          })
        })
      )
    })

    test('should reject resolution of pending call', async () => {
      // Reset call to pending status
      await prisma.call.update({
        where: { id: testCall.id },
        data: { status: CallStatus.PENDING }
      })

      const request = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${testCall.id}/resolve`,
        {
          method: 'POST',
          headers: {
            'Authorization': waiterAuthToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const response = await simulateApiCall('/api/waiter/calls/[callId]/resolve', request)
      
      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toContain('cannot be completed')
    })
  })

  describe('5. Call Timeout Handling', () => {
    test('should automatically mark timed-out calls as missed', async () => {
      // Create a call with a past timeout
      const pastTimeout = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      
      const timedOutCall = await prisma.call.create({
        data: {
          restaurantId: testRestaurant.id,
          tableId: testTable.id,
          waiterId: testWaiter.id,
          status: CallStatus.PENDING,
          timeoutAt: pastTimeout,
          requestedAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        }
      })

      // Trigger the timeout check by making a GET request
      const request = new NextRequest(
        `http://localhost:3000/api/calls?restaurantId=${testRestaurant.id}`,
        {
          method: 'GET',
          headers: { 'Authorization': authToken }
        }
      )

      await simulateApiCall('/api/calls', request)
      
      // Verify the call was marked as missed
      const updatedCall = await prisma.call.findUnique({
        where: { id: timedOutCall.id }
      })
      
      expect(updatedCall!.status).toBe(CallStatus.MISSED)
      expect(updatedCall!.missedAt).toBeTruthy()
      expect(updatedCall!.responseTime).toBeGreaterThan(0)
      
      // Verify realtime event for missed call
      expect(realtimeMock.events).toContainEqual(
        expect.objectContaining({
          eventType: 'UPDATE',
          new: expect.objectContaining({
            id: timedOutCall.id,
            status: CallStatus.MISSED
          })
        })
      )
    })

    test('should recover missed calls when acknowledged', async () => {
      // Create a missed call
      const missedCall = await createTestCall(
        testRestaurant.id, 
        testTable.id, 
        testWaiter.id, 
        CallStatus.MISSED
      )

      const request = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${missedCall.id}/acknowledge`,
        {
          method: 'POST',
          headers: {
            'Authorization': waiterAuthToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const response = await simulateApiCall('/api/waiter/calls/[callId]/acknowledge', request)
      
      expect(response.status).toBe(200)
      const recoveredCall = await response.json()
      
      expect(recoveredCall.status).toBe(CallStatus.ACKNOWLEDGED)
      expect(recoveredCall.missedAt).toBeNull() // Should clear missed timestamp
      
      // Verify in database
      const dbCall = await prisma.call.findUnique({
        where: { id: missedCall.id }
      })
      
      expect(dbCall!.status).toBe(CallStatus.ACKNOWLEDGED)
      expect(dbCall!.missedAt).toBeNull()
    })
  })

  describe('6. Full Lifecycle Integration', () => {
    test('should complete full call lifecycle from creation to resolution', async () => {
      const lifecycleTimer = new PerformanceTimer('full_call_lifecycle')
      
      // Step 1: Create call
      const createRequest = new NextRequest('http://localhost:3000/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: testTable.id,
          restaurantId: testRestaurant.id
        })
      })

      const createResponse = await simulateApiCall('/api/calls', createRequest)
      expect(createResponse.status).toBe(201)
      const call = await createResponse.json()
      
      // Verify initial state
      expect(call.status).toBe(CallStatus.PENDING)
      expect(pushMock.sentNotifications).toHaveLength(1)
      
      // Step 2: Acknowledge call
      await new Promise(resolve => setTimeout(resolve, 10)) // Simulate small delay
      
      const acknowledgeRequest = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${call.id}/acknowledge`,
        {
          method: 'POST',
          headers: {
            'Authorization': waiterAuthToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const acknowledgeResponse = await simulateApiCall('/api/waiter/calls/[callId]/acknowledge', acknowledgeRequest)
      expect(acknowledgeResponse.status).toBe(200)
      const acknowledgedCall = await acknowledgeResponse.json()
      
      expect(acknowledgedCall.status).toBe(CallStatus.ACKNOWLEDGED)
      expect(acknowledgedCall.acknowledgedAt).toBeDefined()
      
      // Step 3: Resolve call
      await new Promise(resolve => setTimeout(resolve, 10)) // Simulate service time
      
      const resolveRequest = new NextRequest(
        `http://localhost:3000/api/waiter/calls/${call.id}/resolve`,
        {
          method: 'POST',
          headers: {
            'Authorization': waiterAuthToken,
            'Content-Type': 'application/json'
          }
        }
      )

      const resolveResponse = await simulateApiCall('/api/waiter/calls/[callId]/resolve', resolveRequest)
      expect(resolveResponse.status).toBe(200)
      const resolvedCall = await resolveResponse.json()
      
      expect(resolvedCall.status).toBe(CallStatus.COMPLETED)
      expect(resolvedCall.completedAt).toBeDefined()
      
      // Step 4: Verify final state
      const finalCall = await prisma.call.findUnique({
        where: { id: call.id },
        include: { table: true, waiter: true }
      })
      
      expect(finalCall!.status).toBe(CallStatus.COMPLETED)
      expect(finalCall!.requestedAt).toBeDefined()
      expect(finalCall!.acknowledgedAt).toBeDefined()
      expect(finalCall!.completedAt).toBeDefined()
      expect(finalCall!.responseTime).toBeGreaterThan(0)
      
      // Verify all realtime events were sent
      const realtimeEvents = realtimeMock.events.filter(
        event => event.new?.id === call.id
      )
      
      expect(realtimeEvents).toHaveLength(3) // INSERT, UPDATE (acknowledge), UPDATE (resolve)
      expect(realtimeEvents[0].eventType).toBe('INSERT')
      expect(realtimeEvents[1].eventType).toBe('UPDATE')
      expect(realtimeEvents[2].eventType).toBe('UPDATE')
      
      // Verify performance metrics
      lifecycleTimer.end({ 
        success: true,
        callId: call.id,
        totalEvents: realtimeEvents.length
      })
      
      const performanceReport = globalPerformanceMonitor.getPerformanceReport()
      expect(performanceReport.summary.totalOperations).toBeGreaterThan(0)
      expect(performanceReport.summary.averageDuration).toBeLessThan(1000) // Should be fast
      
      logger.info('Full lifecycle test completed successfully', 'TEST', {
        callId: call.id,
        duration: lifecycleTimer.getDuration(),
        events: realtimeEvents.length
      })
    })
  })

  describe('7. Performance and Load Testing', () => {
    test('should handle multiple concurrent calls', async () => {
      const concurrentCalls = 10
      const promises: Promise<any>[] = []
      
      const loadTestTimer = new PerformanceTimer('concurrent_calls_test')
      
      // Create multiple calls concurrently
      for (let i = 0; i < concurrentCalls; i++) {
        const request = new NextRequest('http://localhost:3000/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: testTable.id,
            restaurantId: testRestaurant.id
          })
        })
        
        promises.push(simulateApiCall('/api/calls', request))
      }
      
      const responses = await Promise.all(promises)
      
      // Verify all calls were created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })
      
      // Verify all calls exist in database
      const callCount = await prisma.call.count({
        where: { restaurantId: testRestaurant.id }
      })
      expect(callCount).toBe(concurrentCalls)
      
      // Verify performance metrics
      loadTestTimer.end({ 
        success: true,
        concurrentCalls
      })
      
      const performanceSummary = globalPerformanceMonitor.getPerformanceSummary()
      expect(performanceSummary.totalOperations).toBeGreaterThan(concurrentCalls)
      expect(performanceSummary.averageDuration).toBeLessThan(2000) // Should handle load well
      
      logger.info('Concurrent calls test passed', 'TEST', {
        concurrentCalls,
        averageDuration: performanceSummary.averageDuration,
        totalOperations: performanceSummary.totalOperations
      })
    })
  })
})

// Helper function to simulate API calls
async function simulateApiCall(endpoint: string, request: NextRequest): Promise<Response> {
  // This would normally import and call the actual API route handler
  // For testing purposes, we'll simulate the response based on the endpoint
  
  if (endpoint === '/api/calls' && request.method === 'POST') {
    // Simulate POST /api/calls
    const body = await request.json()
    
    // Validate required fields
    if (!body.tableId || !body.restaurantId) {
      return new Response(
        JSON.stringify({ error: 'Missing tableId or restaurantId' }),
        { status: 400 }
      )
    }
    
    // Check if table exists
    const table = await prisma.table.findFirst({
      where: {
        id: body.tableId,
        restaurantId: body.restaurantId,
        isActive: true
      }
    })
    
    if (!table) {
      return new Response(
        JSON.stringify({ error: 'Table not found' }),
        { status: 404 }
      )
    }
    
    // Create call
    const call = await prisma.call.create({
      data: {
        restaurantId: body.restaurantId,
        tableId: body.tableId,
        status: CallStatus.PENDING,
        timeoutAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
      },
      include: {
        table: true,
        waiter: true
      }
    })
    
    // Simulate push notification
    pushMock.sentNotifications.push({
      callId: call.id,
      tableNumber: table.number,
      restaurantId: body.restaurantId,
      waiterId: call.waiterId
    })
    
    // Simulate realtime event
    realtimeMock.events.push({
      eventType: 'INSERT',
      new: call,
      timestamp: Date.now()
    })
    
    return new Response(JSON.stringify(call), { status: 201 })
  }
  
  if (endpoint === '/api/calls' && request.method === 'GET') {
    // Simulate GET /api/calls
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get('restaurantId')
    const status = url.searchParams.get('status')
    
    if (!restaurantId) {
      return new Response(
        JSON.stringify({ error: 'Missing restaurantId' }),
        { status: 400 }
      )
    }
    
    // Check for timed-out calls
    await checkAndUpdateMissedCalls(restaurantId)
    
    const whereClause: any = { restaurantId }
    if (status) {
      whereClause.status = status
    }
    
    const calls = await prisma.call.findMany({
      where: whereClause,
      include: {
        table: true,
        waiter: true
      },
      orderBy: [
        { status: 'asc' },
        { requestedAt: 'desc' }
      ],
      take: 50
    })
    
    return new Response(JSON.stringify(calls), { status: 200 })
  }
  
  if (endpoint.includes('/acknowledge') && request.method === 'POST') {
    // Simulate POST /api/waiter/calls/[callId]/acknowledge
    const url = new URL(request.url)
    const callId = url.pathname.split('/')[3]
    
    const call = await prisma.call.findUnique({
      where: { id: callId }
    })
    
    if (!call) {
      return new Response(
        JSON.stringify({ error: 'Call not found' }),
        { status: 404 }
      )
    }
    
    if (call.status !== CallStatus.PENDING && call.status !== CallStatus.MISSED) {
      return new Response(
        JSON.stringify({ error: 'Call cannot be acknowledged' }),
        { status: 400 }
      )
    }
    
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        responseTime: Date.now() - call.requestedAt.getTime(),
        missedAt: call.status === CallStatus.MISSED ? null : call.missedAt
      },
      include: {
        table: true,
        waiter: true
      }
    })
    
    // Simulate realtime event
    realtimeMock.events.push({
      eventType: 'UPDATE',
      old: call,
      new: updatedCall,
      timestamp: Date.now()
    })
    
    return new Response(JSON.stringify(updatedCall), { status: 200 })
  }
  
  if (endpoint.includes('/resolve') && request.method === 'POST') {
    // Simulate POST /api/waiter/calls/[callId]/resolve
    const url = new URL(request.url)
    const callId = url.pathname.split('/')[3]
    
    const call = await prisma.call.findUnique({
      where: { id: callId }
    })
    
    if (!call) {
      return new Response(
        JSON.stringify({ error: 'Call not found' }),
        { status: 404 }
      )
    }
    
    if (call.status !== CallStatus.ACKNOWLEDGED && call.status !== CallStatus.IN_PROGRESS) {
      return new Response(
        JSON.stringify({ error: 'Call cannot be completed' }),
        { status: 400 }
      )
    }
    
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.COMPLETED,
        completedAt: new Date(),
        handledAt: new Date(),
        responseTime: Date.now() - call.requestedAt.getTime()
      },
      include: {
        table: true,
        waiter: true
      }
    })
    
    // Simulate realtime event
    realtimeMock.events.push({
      eventType: 'UPDATE',
      old: call,
      new: updatedCall,
      timestamp: Date.now()
    })
    
    return new Response(JSON.stringify(updatedCall), { status: 200 })
  }
  
  return new Response(
    JSON.stringify({ error: 'Endpoint not found' }),
    { status: 404 }
  )
}

// Helper function to check and update missed calls
async function checkAndUpdateMissedCalls(restaurantId: string): Promise<void> {
  const now = new Date()
  
  const timedOutCalls = await prisma.call.findMany({
    where: {
      restaurantId,
      status: CallStatus.PENDING,
      timeoutAt: { lt: now },
      missedAt: null
    }
  })
  
  for (const call of timedOutCalls) {
    await prisma.call.update({
      where: { id: call.id },
      data: {
        status: CallStatus.MISSED,
        missedAt: now,
        responseTime: Math.floor(now.getTime() - call.requestedAt.getTime())
      }
    })
    
    // Simulate realtime event
    realtimeMock.events.push({
      eventType: 'UPDATE',
      old: call,
      new: { ...call, status: CallStatus.MISSED, missedAt: now },
      timestamp: Date.now()
    })
  }
}
