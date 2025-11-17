import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ restaurantId: string }>
}) {
  const { restaurantId } = await params
  const path = `/admin/${restaurantId}`
  try {
    await requireAdmin(restaurantId)
  } catch {
    redirect(`/auth/admin?redirect=${encodeURIComponent(path)}`)
  }

  return <>{children}</>
}

