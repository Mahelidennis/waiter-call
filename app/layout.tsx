import type { Metadata, Viewport } from 'next'
import { Work_Sans } from 'next/font/google'
import './globals.css'
import InstallPrompt from '@/components/InstallPrompt'
import OfflineBanner from '@/components/OfflineBanner'
import PWAInitializer from '@/components/PWAInitializer'

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#16a34a',
}

export const metadata: Metadata = {
  title: 'Waiter Call - Restaurant Service System',
  description: 'Production-grade waiter notification system for restaurants',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Waiter Call',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Waiter Call',
    title: 'Waiter Call - Restaurant Service System',
    description: 'Production-grade waiter notification system for restaurants',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={workSans.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="application-name" content="Waiter Call" />
        <meta name="apple-mobile-web-app-title" content="Waiter Call" />
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="font-sans bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
        <PWAInitializer />
        <OfflineBanner />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
