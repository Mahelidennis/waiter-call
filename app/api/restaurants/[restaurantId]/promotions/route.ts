import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params

    const promotions = await prisma.promotion.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(promotions)
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    )
  }
}

// Create a new promotion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const body = await request.json()
    const { title, description, imageUrl, linkUrl, isActive, displayOrder, startDate, endDate } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Promotion title is required' },
        { status: 400 }
      )
    }

    const promotion = await prisma.promotion.create({
      data: {
        restaurantId,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    console.error('Error creating promotion:', error)
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    )
  }
}

