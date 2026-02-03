/**
 * Test Data Helpers
 * 
 * Provides utilities for creating test data for integration tests
 */

import { prisma } from '@/lib/db'
import { CallStatus } from '@prisma/client'

export interface TestRestaurant {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  address: string | null
  logoUrl: string | null
  menuUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TestWaiter {
  id: string
  name: string
  email: string | null
  phone: string | null
  accessCodeHash: string | null
  isActive: boolean
  restaurantId: string
  createdAt: Date
  updatedAt: Date
}

export interface TestTable {
  id: string
  number: string
  qrCode: string
  isActive: boolean
  restaurantId: string
}

export interface TestCall {
  id: string
  restaurantId: string
  tableId: string
  waiterId?: string
  status: string
  requestedAt: Date
}

/**
 * Create a test restaurant
 */
export async function createTestRestaurant(overrides: Partial<TestRestaurant> = {}): Promise<TestRestaurant> {
  const restaurant = await prisma.restaurant.create({
    data: {
      name: `Test Restaurant ${Date.now()}`,
      slug: `test-restaurant-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      ...overrides
    }
  })
  
  return restaurant
}

/**
 * Create a test waiter
 */
export async function createTestWaiter(restaurantId: string, overrides: Partial<TestWaiter> = {}): Promise<TestWaiter> {
  const waiter = await prisma.waiter.create({
    data: {
      name: `Test Waiter ${Date.now()}`,
      email: `waiter${Date.now()}@test.com`,
      phone: `+1234567890${Date.now()}`,
      isActive: true,
      restaurantId,
      ...overrides
    }
  })
  
  return waiter
}

/**
 * Create a test table
 */
export async function createTestTable(restaurantId: string, overrides: Partial<TestTable> = {}): Promise<TestTable> {
  const table = await prisma.table.create({
    data: {
      number: `T${Date.now()}`,
      qrCode: `QR-${Date.now()}`,
      isActive: true,
      restaurantId,
      ...overrides
    }
  })
  
  return table as TestTable
}

/**
 * Create a test call
 */
export async function createTestCall(
  restaurantId: string,
  tableId: string,
  waiterId?: string,
  status: CallStatus = CallStatus.PENDING,
  overrides: Partial<TestCall> = {}
): Promise<TestCall> {
  const call = await prisma.call.create({
    data: {
      restaurantId,
      tableId,
      waiterId,
      status: status.valueOf(),
      requestedAt: new Date(),
      timeoutAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
      ...overrides
    }
  })
  
  return call as TestCall
}

/**
 * Create multiple test calls with different statuses
 */
export async function createTestCallsWithStatuses(
  restaurantId: string,
  tableId: string,
  waiterId: string,
  count: number = 5
): Promise<TestCall[]> {
  const calls: TestCall[] = []
  const statuses = [CallStatus.PENDING, CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS, CallStatus.COMPLETED, CallStatus.MISSED]
  
  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length]
    const call = await createTestCall(restaurantId, tableId, waiterId, status)
    calls.push(call)
  }
  
  return calls
}

/**
 * Create a complete test scenario with restaurant, waiter, table, and calls
 */
export async function createTestScenario(
  callCount: number = 3
): Promise<{
  restaurant: TestRestaurant
  waiter: TestWaiter
  table: TestTable
  calls: TestCall[]
}> {
  const restaurant = await createTestRestaurant()
  const waiter = await createTestWaiter(restaurant.id)
  const table = await createTestTable(restaurant.id)
  
  // Assign waiter to table
  await prisma.waiterTable.create({
    data: {
      waiterId: waiter.id,
      tableId: table.id
    }
  })
  
  // Create calls
  const calls = await createTestCallsWithStatuses(restaurant.id, table.id, waiter.id, callCount)
  
  return {
    restaurant,
    waiter,
    table,
    calls
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData(restaurantId: string): Promise<void> {
  // Delete in correct order to respect foreign key constraints
  await prisma.call.deleteMany({
    where: { restaurantId }
  })
  
  await prisma.waiterTable.deleteMany({
    where: {
      waiter: { restaurantId }
    }
  })
  
  await prisma.waiter.deleteMany({
    where: { restaurantId }
  })
  
  await prisma.table.deleteMany({
    where: { restaurantId }
  })
  
  await prisma.restaurant.delete({
    where: { id: restaurantId }
  })
}

/**
 * Generate random test data
 */
export function generateRandomTestData() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  return {
    restaurantName: `Test Restaurant ${timestamp}`,
    restaurantCode: `TEST${random}`,
    waiterName: `Test Waiter ${timestamp}`,
    waiterEmail: `waiter${random}@test.com`,
    waiterPhone: `+123456789${timestamp}`,
    tableNumber: `T${random}`,
    qrCode: `QR-${timestamp}-${random}`
  }
}

/**
 * Create test data with realistic values
 */
export async function createRealisticTestScenario(): Promise<{
  restaurant: TestRestaurant
  waiters: TestWaiter[]
  tables: TestTable[]
  calls: TestCall[]
}> {
  const data = generateRandomTestData()
  
  // Create restaurant
  const restaurant = await createTestRestaurant({
    name: data.restaurantName
  })
  
  // Create waiters
  const waiters: TestWaiter[] = []
  for (let i = 0; i < 3; i++) {
    const waiter = await createTestWaiter(restaurant.id, {
      name: `${data.waiterName} ${i + 1}`,
      email: `waiter${i + 1}${Math.random().toString(36).substr(2, 9)}@test.com`,
      phone: `${data.waiterPhone}${i + 1}`
    })
    waiters.push(waiter)
  }
  
  // Create tables
  const tables: TestTable[] = []
  for (let i = 0; i < 5; i++) {
    const table = await createTestTable(restaurant.id, {
      number: `Table ${i + 1}`,
      qrCode: `${data.qrCode}-${i + 1}`
    })
    tables.push(table)
    
    // Assign waiters to tables (round-robin)
    const waiterIndex = i % waiters.length
    await prisma.waiterTable.create({
      data: {
        waiterId: waiters[waiterIndex].id,
        tableId: table.id
      }
    })
  }
  
  // Create calls with various statuses
  const calls: TestCall[] = []
  const statuses = [CallStatus.PENDING, CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS, CallStatus.COMPLETED, CallStatus.MISSED]
  
  for (let i = 0; i < 10; i++) {
    const tableIndex = i % tables.length
    const status = statuses[i % statuses.length]
    const waiterId = status !== CallStatus.PENDING ? waiters[tableIndex % waiters.length].id : undefined
    
    const call = await createTestCall(
      restaurant.id,
      tables[tableIndex].id,
      waiterId,
      status,
      {
        requestedAt: new Date(Date.now() - (i * 5 * 60 * 1000)) // 5 minutes apart
      }
    )
    calls.push(call)
  }
  
  return {
    restaurant,
    waiters,
    tables,
    calls
  }
}

/**
 * Create test data for performance testing
 */
export async function createPerformanceTestData(
  restaurantCount: number = 1,
  waitersPerRestaurant: number = 3,
  tablesPerRestaurant: number = 10,
  callsPerTable: number = 5
): Promise<{
  restaurants: TestRestaurant[]
  waiters: TestWaiter[]
  tables: TestTable[]
  calls: TestCall[]
}> {
  const restaurants: TestRestaurant[] = []
  const waiters: TestWaiter[] = []
  const tables: TestTable[] = []
  const calls: TestCall[] = []
  
  // Create restaurants
  for (let r = 0; r < restaurantCount; r++) {
    const restaurant = await createTestRestaurant({
      name: `Performance Test Restaurant ${r + 1}`
    })
    restaurants.push(restaurant)
    
    // Create waiters for this restaurant
    for (let w = 0; w < waitersPerRestaurant; w++) {
      const waiter = await createTestWaiter(restaurant.id, {
        name: `Perf Waiter ${r + 1}-${w + 1}`,
        email: `perf${r + 1}-${w + 1}@test.com`
      })
      waiters.push(waiter)
    }
    
    // Create tables for this restaurant
    for (let t = 0; t < tablesPerRestaurant; t++) {
      const table = await createTestTable(restaurant.id, {
        number: `PERF-T${r + 1}-${t + 1}`,
        qrCode: `PERF-QR-${r + 1}-${t + 1}`
      })
      tables.push(table)
      
      // Assign waiter to table
      const waiterIndex = t % waitersPerRestaurant
      await prisma.waiterTable.create({
        data: {
          waiterId: waiters[waiters.length - waitersPerRestaurant + waiterIndex].id,
          tableId: table.id
        }
      })
      
      // Create calls for this table
      for (let c = 0; c < callsPerTable; c++) {
        const status = c === 0 ? CallStatus.PENDING : 
                      c === 1 ? CallStatus.ACKNOWLEDGED :
                      c === 2 ? CallStatus.IN_PROGRESS :
                      c === 3 ? CallStatus.COMPLETED :
                      CallStatus.MISSED
        
        const waiterId = status !== CallStatus.PENDING ? 
          waiters[waiters.length - waitersPerRestaurant + waiterIndex].id : undefined
        
        const call = await createTestCall(
          restaurant.id,
          table.id,
          waiterId,
          status,
          {
            requestedAt: new Date(Date.now() - (c * 2 * 60 * 1000)) // 2 minutes apart
          }
        )
        calls.push(call)
      }
    }
  }
  
  return {
    restaurants,
    waiters,
    tables,
    calls
  }
}
