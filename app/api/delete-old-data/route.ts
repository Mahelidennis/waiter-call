import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('=== DELETING OLD PROBLEMATIC DATA ===')
    
    // Just delete the old string-based data that's causing validation issues
    const deletedWaiters = await prisma.waiter.deleteMany({
      where: {
        id: { in: ['waiter-1', 'waiter-2'] }
      }
    })
    
    const deletedTables = await prisma.table.deleteMany({
      where: {
        id: { in: ['table-1', 'table-2', 'table-3'] }
      }
    })
    
    const deletedRestaurant = await prisma.restaurant.deleteMany({
      where: {
        id: 'test-rest-1'
      }
    })
    
    console.log('Deleted:', {
      waiters: deletedWaiters.count,
      tables: deletedTables.count,
      restaurants: deletedRestaurant.count
    })
    
    return NextResponse.json({
      success: true,
      message: 'Old problematic data deleted',
      deleted: {
        waiters: deletedWaiters.count,
        tables: deletedTables.count,
        restaurants: deletedRestaurant.count
      }
    })
  } catch (error) {
    console.error('Error deleting old data:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
