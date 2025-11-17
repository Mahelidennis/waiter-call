import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type AppRole = 'admin' | 'waiter'

export interface AuthenticatedUser {
  user: User
  role?: AppRole
  restaurantId?: string
  waiterId?: string
}

function extractMetadata(user: User): Omit<AuthenticatedUser, 'user'> {
  const metadata = {
    ...(user.user_metadata || {}),
    ...(user.app_metadata || {}),
  }

  return {
    role: metadata.role as AppRole | undefined,
    restaurantId: metadata.restaurantId as string | undefined,
    waiterId: metadata.waiterId as string | undefined,
  }
}

export async function getServerAuth() {
  const supabase = await createServerClient()
  return supabase.auth.getSession()
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createServerClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    return null
  }

  const meta = extractMetadata(session.user)

  return {
    user: session.user,
    ...meta,
  }
}

type RequireRoleOptions =
  | { restaurantId?: string; waiterId?: string }
  | undefined

export async function requireRole(
  role: AppRole,
  options?: RequireRoleOptions
): Promise<AuthenticatedUser> {
  const authUser = await getAuthenticatedUser()
  if (!authUser) {
    throw new Error('UNAUTHENTICATED')
  }

  if (authUser.role !== role) {
    throw new Error('UNAUTHORIZED')
  }

  if (options?.restaurantId && authUser.restaurantId !== options.restaurantId) {
    throw new Error('FORBIDDEN')
  }

  if (options?.waiterId && authUser.waiterId !== options.waiterId) {
    throw new Error('FORBIDDEN')
  }

  return authUser
}

export async function requireAdmin(restaurantId?: string) {
  return requireRole('admin', { restaurantId })
}

export async function requireWaiter(waiterId?: string) {
  return requireRole('waiter', { waiterId })
}

