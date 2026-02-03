import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('=== DEBUG: Checking current database data ===')
    
    // Check restaurant data
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true }
    })
    console.log('Restaurants:', restaurants)
    
    // Check table data
    const tables = await prisma.table.findMany({
      select: { id: true, number: true, restaurantId: true, qrCode: true }
    })
    console.log('Tables:', tables)
    
    // Check waiter data
    const waiters = await prisma.waiter.findMany({
      select: { id: true, name: true, restaurantId: true }
    })
    console.log('Waiters:', waiters)
    
    return NextResponse.json({
      success: true,
      data: {
        restaurants,
        tables,
        waiters
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
