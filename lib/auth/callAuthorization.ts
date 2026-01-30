import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWaiterSession } from '@/lib/auth/waiterSession'
import { getAuthenticatedUser } from '@/lib/auth/server'

export interface AuthContext {
  user: {
    id: string
    role: 'admin' | 'waiter'
    restaurantId: string
    waiterId?: string
    name?: string
  }
  type: 'session' | 'jwt'
}

export interface CallAuthorizationOptions {
  requireRestaurant?: boolean
  requireAssignment?: boolean
  allowedStatuses?: string[]
}

/**
 * Comprehensive authorization for call endpoints
 * Supports both session-based (waiter) and JWT-based (admin/waiter) authentication
 */
export async function authorizeCallAccess(
  request: NextRequest,
  options: CallAuthorizationOptions = {}
): Promise<AuthContext> {
  const { requireRestaurant = true, requireAssignment = false, allowedStatuses } = options

  // Try session-based authentication first (for waiters)
  let authContext: AuthContext | null = null
  
  try {
    const waiter = await requireWaiterSession()
    authContext = {
      user: {
        id: waiter.id,
        role: 'waiter',
        restaurantId: waiter.restaurantId,
        waiterId: waiter.id,
        name: waiter.name,
      },
      type: 'session'
    }
    console.log('Session authentication successful for waiter:', waiter.id)
  } catch (sessionError: any) {
    console.log('Session auth failed, trying JWT auth:', sessionError?.message || 'Unknown error')
  }

  // If session auth failed, try JWT authentication
  if (!authContext) {
    const authUser = await getAuthenticatedUser()
    if (!authUser) {
      throw new Error('UNAUTHENTICATED')
    }
    
    authContext = {
      user: {
        id: authUser.user.id,
        role: authUser.role!,
        restaurantId: authUser.restaurantId!,
        waiterId: authUser.waiterId,
        name: authUser.user.user_metadata?.name || authUser.user.email,
      },
      type: 'jwt'
    }
    console.log('JWT authentication successful for:', authContext.user.role, authContext.user.id)
  }

  return authContext
}

/**
 * Authorize access to a specific call
 */
export async function authorizeCallAccessById(
  callId: string,
  authContext: AuthContext,
  options: CallAuthorizationOptions = {}
): Promise<{ call: any; authorized: boolean }> {
  const { requireAssignment = false, allowedStatuses } = options

  // Get the call with full details
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      table: true,
      waiter: true,
      restaurant: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  })

  if (!call) {
    throw new Error('Call not found')
  }

  // Verify restaurant access
  if (authContext.user.restaurantId !== call.restaurantId) {
    console.error('Access denied - wrong restaurant:', {
      userRestaurantId: authContext.user.restaurantId,
      callRestaurantId: call.restaurantId,
      userId: authContext.user.id,
      role: authContext.user.role,
      callId
    })
    throw new Error('FORBIDDEN')
  }

  // Role-based permissions
  if (authContext.user.role === 'admin') {
    // Admin can access any call in their restaurant
    console.log('Admin accessing call:', { adminId: authContext.user.id, callId })
    return { call, authorized: true }
  }

  if (authContext.user.role === 'waiter') {
    // Waiter can only access calls assigned to them or unassigned calls in their restaurant
    if (requireAssignment && call.waiterId && call.waiterId !== authContext.user.waiterId) {
      console.error('Waiter access denied - not assigned to call:', {
        waiterId: authContext.user.waiterId,
        assignedWaiterId: call.waiterId,
        callId
      })
      throw new Error('FORBIDDEN')
    }

    // Check if waiter is assigned to this table
    if (call.waiterId && call.waiterId !== authContext.user.waiterId) {
      console.error('Waiter access denied - call assigned to different waiter:', {
        waiterId: authContext.user.waiterId,
        assignedWaiterId: call.waiterId,
        callId
      })
      throw new Error('FORBIDDEN')
    }

    // Verify table assignment if required
    if (requireAssignment) {
      const waiterTable = await prisma.waiterTable.findFirst({
        where: {
          waiterId: authContext.user.waiterId!,
          tableId: call.tableId
        }
      })

      if (!waiterTable) {
        console.error('Waiter access denied - not assigned to table:', {
          waiterId: authContext.user.waiterId,
          tableId: call.tableId,
          callId
        })
        throw new Error('FORBIDDEN')
      }
    }

    console.log('Waiter accessing call:', { waiterId: authContext.user.waiterId, callId })
    return { call, authorized: true }
  }

  throw new Error('UNAUTHORIZED')
}

/**
 * Validate status updates based on user role
 */
export function validateStatusUpdate(
  newStatus: string,
  authContext: AuthContext,
  currentStatus?: string
): boolean {
  if (authContext.user.role === 'admin') {
    // Admin can update to any status
    return true
  }

  if (authContext.user.role === 'waiter') {
    // Waiters can only update to certain statuses
    const allowedStatuses = ['ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED']
    
    if (!allowedStatuses.includes(newStatus)) {
      console.error('Waiter status update denied - invalid status:', {
        status: newStatus,
        allowedStatuses,
        waiterId: authContext.user.waiterId,
        currentStatus
      })
      return false
    }

    // Additional validation for status transitions
    if (currentStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
      console.error('Waiter status update denied - cannot change completed status:', {
        currentStatus,
        newStatus,
        waiterId: authContext.user.waiterId
      })
      return false
    }

    return true
  }

  return false
}

/**
 * Create standardized error responses
 */
export function createAuthErrorResponse(error: any) {
  if (error.message === 'UNAUTHENTICATED') {
    return { error: 'Authentication required', status: 401 }
  }
  
  if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
    return { error: 'Access denied', status: 403 }
  }
  
  if (error.message === 'Call not found') {
    return { error: 'Call not found', status: 404 }
  }
  
  return { error: 'Authorization failed', status: 500 }
}
