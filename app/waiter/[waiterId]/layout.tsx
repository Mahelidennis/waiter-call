import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { requireWaiterSession } from '@/lib/auth/waiterSession'

export default async function WaiterLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ waiterId: string }>
}) {
  const { waiterId } = await params
  const path = `/waiter/${waiterId}`
  
  try {
    await requireWaiterSession(waiterId)
  } catch (error) {
    // Handle different auth errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    
    // Redirect to login with appropriate context
    const loginUrl = `/waiter/login?redirect=${encodeURIComponent(path)}`
    
    // For session expiration or invalid session, we could add a flag
    if (errorMessage === 'UNAUTHENTICATED' || errorMessage === 'INACTIVE_WAITER') {
      redirect(loginUrl)
    }
    
    // For forbidden access (wrong waiter ID), still redirect to login
    if (errorMessage === 'FORBIDDEN') {
      redirect('/waiter/login')
    }
    
    // Default fallback
    redirect(loginUrl)
  }

  return <>{children}</>
}

