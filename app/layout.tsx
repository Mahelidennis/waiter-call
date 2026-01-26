import type { Metadata } from 'next'
import './globals.css'
import { Work_Sans } from 'next/font/google'

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Waiter Call System',
  description: 'Streamline restaurant service with instant waiter calls',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        />
      </head>
      <body
        className={`${workSans.variable} font-display bg-background-light dark:bg-background-dark text-[#111813] dark:text-white`}
      >
        {children}
      </body>
    </html>
  )
}

