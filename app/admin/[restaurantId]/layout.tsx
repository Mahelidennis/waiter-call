import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/server'

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { restaurantId: string }
}) {
  const path = `/admin/${params.restaurantId}`
  try {
    await requireAdmin(params.restaurantId)
  } catch {
    redirect(`/auth/admin?redirect=${encodeURIComponent(path)}`)
  }

  return <>{children}</>
}

