import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params
    
    // Get the base URL from the request or environment
    const baseUrl = request.headers.get('host') 
      ? `https://${request.headers.get('host')}` 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Construct the table URL
    const tableUrl = `${baseUrl}/table/${tableId}`
    
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(tableUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
    
    // Return as PNG image
    return new NextResponse(qrBuffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
