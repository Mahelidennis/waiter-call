import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Update a promotion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ promotionId: string }> }
) {
  try {
    const { promotionId } = await params
    const body = await request.json()
    const { title, description, imageUrl, linkUrl, isActive, displayOrder, startDate, endDate } = body

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    })

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating promotion:', error)
    return NextResponse.json(
      { error: 'Failed to update promotion' },
      { status: 500 }
    )
  }
}

// Delete a promotion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ promotionId: string }> }
) {
  try {
    const { promotionId } = await params

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    })

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      )
    }

    await prisma.promotion.delete({
      where: { id: promotionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting promotion:', error)
    return NextResponse.json(
      { error: 'Failed to delete promotion' },
      { status: 500 }
    )
  }
}




