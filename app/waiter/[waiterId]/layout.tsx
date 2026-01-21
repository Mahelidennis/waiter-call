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
  } catch {
    redirect(`/waiter/login?redirect=${encodeURIComponent(path)}`)
  }

  return <>{children}</>
}

