import { NextResponse } from 'next/server'

// Minimal 16x16 ICO file (1x1 transparent pixel)
// This is a valid ICO file header with minimal data
const faviconData = Buffer.from(
  'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAA',
  'base64'
)

export async function GET() {
  return new NextResponse(faviconData, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
