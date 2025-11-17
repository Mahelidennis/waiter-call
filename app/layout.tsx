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
    <html lang="en" className="light">
      <body className="font-display bg-background-light dark:bg-background-dark text-[#111813] dark:text-white">
        {children}
      </body>
    </html>
  )
}

