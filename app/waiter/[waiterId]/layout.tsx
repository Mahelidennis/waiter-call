import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { requireWaiter } from '@/lib/auth/server'

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
    await requireWaiter(waiterId)
  } catch {
    redirect(`/auth/waiter?redirect=${encodeURIComponent(path)}`)
  }

  return <>{children}</>
}

