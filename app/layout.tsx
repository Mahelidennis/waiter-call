import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Waiter Call System',
  description: 'Streamline restaurant service with instant waiter calls',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

