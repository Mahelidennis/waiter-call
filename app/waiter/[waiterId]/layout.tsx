import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { requireWaiter } from '@/lib/auth/server'

export default async function WaiterLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { waiterId: string }
}) {
  const path = `/waiter/${params.waiterId}`
  try {
    await requireWaiter(params.waiterId)
  } catch {
    redirect(`/auth/waiter?redirect=${encodeURIComponent(path)}`)
  }

  return <>{children}</>
}

