import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    })

    return NextResponse.json(tables)
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}

// Create a new table
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const body = await request.json()
    const { number } = body

    if (!number) {
      return NextResponse.json(
        { error: 'Table number is required' },
        { status: 400 }
      )
    }

    // Generate unique QR code
    const qrCode = `table-${restaurantId}-${randomBytes(8).toString('hex')}`

    // Check if table number already exists
    const existing = await prisma.table.findFirst({
      where: {
        restaurantId,
        number,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Table number already exists' },
        { status: 400 }
      )
    }

    const table = await prisma.table.create({
      data: {
        restaurantId,
        number,
        qrCode,
        isActive: true,
      },
    })

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    )
  }
}
