import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Simple database connection test
export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const tableCount = await prisma.table.count()
    console.log('Table count:', tableCount)
    
    const restaurantCount = await prisma.restaurant.count()
    console.log('Restaurant count:', restaurantCount)
    
    const callCount = await prisma.call.count()
    console.log('Call count:', callCount)
    
    // Test a simple query
    const firstTable = await prisma.table.findFirst()
    console.log('First table:', firstTable)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      data: {
        tableCount,
        restaurantCount,
        callCount,
        firstTable: firstTable ? {
          id: firstTable.id,
          number: firstTable.number,
          qrCode: firstTable.qrCode,
          restaurantId: firstTable.restaurantId
        } : null
      }
    })
    
  } catch (error) {
    console.error('Database connection test failed:', error)
    
    // Log Prisma-specific error details
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma Error Code:', (error as any).code)
      console.error('Prisma Error Meta:', (error as any).meta)
      console.error('Prisma Error Message:', (error as any).message)
    }
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
