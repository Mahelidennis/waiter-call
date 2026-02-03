import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Simple test to debug the database issue
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debugging database...')

    // Check existing data
    const restaurant = await prisma.restaurant.findFirst()
    console.log('Restaurant:', restaurant?.name || 'None found')

    const tables = await prisma.table.findMany()
    console.log('Tables count:', tables.length)

    const waiters = await prisma.waiter.findMany()
    console.log('Waiters count:', waiters.length)

    const assignments = await prisma.waiterTable.findMany({
      include: {
        waiter: true,
        table: true
      }
    })
    console.log('Assignments count:', assignments.length)
    assignments.forEach(a => {
      console.log(`  - ${a.waiter.name} assigned to ${a.table.number}`)
    })

    const calls = await prisma.call.findMany()
    console.log('Existing calls count:', calls.length)

    return NextResponse.json({
      success: true,
      data: {
        restaurant: restaurant?.name,
        tablesCount: tables.length,
        waitersCount: waiters.length,
        assignmentsCount: assignments.length,
        callsCount: calls.length,
        assignments: assignments.map(a => ({
          waiter: a.waiter.name,
          table: a.table.number
        }))
      }
    })

  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
