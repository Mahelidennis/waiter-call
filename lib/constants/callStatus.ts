/**
 * Standardized Call Status Constants
 * 
 * This file provides a single source of truth for all call status values
 * and their relationships throughout the application.
 */

export enum CallStatus {
  PENDING = 'PENDING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  CANCELLED = 'CANCELLED',
  // Legacy status - deprecated but kept for backward compatibility
  HANDLED = 'HANDLED'
}

export const CALL_STATUS_DISPLAY = {
  [CallStatus.PENDING]: 'New',
  [CallStatus.ACKNOWLEDGED]: 'Acknowledged',
  [CallStatus.IN_PROGRESS]: 'In Progress',
  [CallStatus.COMPLETED]: 'Completed',
  [CallStatus.MISSED]: 'Missed',
  [CallStatus.CANCELLED]: 'Cancelled',
  [CallStatus.HANDLED]: 'Handled (Legacy)'
} as const

export const CALL_STATUS_DESCRIPTIONS = {
  [CallStatus.PENDING]: 'Customer called, waiting for waiter',
  [CallStatus.ACKNOWLEDGED]: 'Waiter accepted the call',
  [CallStatus.IN_PROGRESS]: 'Waiter is on the way to table',
  [CallStatus.COMPLETED]: 'Service delivered successfully',
  [CallStatus.MISSED]: 'Timeout elapsed with no acknowledgment',
  [CallStatus.CANCELLED]: 'Customer cancelled the call',
  [CallStatus.HANDLED]: 'Service completed (legacy status)'
} as const

export const CALL_STATUS_COLORS = {
  [CallStatus.PENDING]: 'text-yellow-600',
  [CallStatus.ACKNOWLEDGED]: 'text-blue-600',
  [CallStatus.IN_PROGRESS]: 'text-purple-600',
  [CallStatus.COMPLETED]: 'text-green-600',
  [CallStatus.MISSED]: 'text-red-600',
  [CallStatus.CANCELLED]: 'text-gray-600',
  [CallStatus.HANDLED]: 'text-green-600'
} as const

export const CALL_STATUS_BORDER_COLORS = {
  [CallStatus.PENDING]: 'border-yellow-500',
  [CallStatus.ACKNOWLEDGED]: 'border-blue-500',
  [CallStatus.IN_PROGRESS]: 'border-purple-500',
  [CallStatus.COMPLETED]: 'border-green-500',
  [CallStatus.MISSED]: 'border-red-500',
  [CallStatus.CANCELLED]: 'border-gray-500',
  [CallStatus.HANDLED]: 'border-green-500'
} as const

/**
 * Valid status transitions for each role
 */
export const VALID_STATUS_TRANSITIONS: Record<string, Record<string, CallStatus[]>> = {
  waiter: {
    [CallStatus.PENDING]: [CallStatus.ACKNOWLEDGED],
    [CallStatus.ACKNOWLEDGED]: [CallStatus.IN_PROGRESS, CallStatus.COMPLETED],
    [CallStatus.IN_PROGRESS]: [CallStatus.COMPLETED],
    [CallStatus.MISSED]: [CallStatus.ACKNOWLEDGED], // Recovery from missed
    [CallStatus.COMPLETED]: [], // Terminal state
    [CallStatus.CANCELLED]: [], // Terminal state
    [CallStatus.HANDLED]: [] // Legacy terminal state
  },
  admin: {
    [CallStatus.PENDING]: [CallStatus.ACKNOWLEDGED, CallStatus.MISSED, CallStatus.CANCELLED, CallStatus.COMPLETED],
    [CallStatus.ACKNOWLEDGED]: [CallStatus.IN_PROGRESS, CallStatus.COMPLETED, CallStatus.MISSED, CallStatus.CANCELLED],
    [CallStatus.IN_PROGRESS]: [CallStatus.COMPLETED, CallStatus.MISSED, CallStatus.CANCELLED],
    [CallStatus.MISSED]: [CallStatus.ACKNOWLEDGED, CallStatus.COMPLETED, CallStatus.CANCELLED],
    [CallStatus.COMPLETED]: [], // Terminal state
    [CallStatus.CANCELLED]: [], // Terminal state
    [CallStatus.HANDLED]: [] // Legacy terminal state
  }
}

/**
 * Status groups for filtering and UI
 */
export const ACTIVE_STATUSES: CallStatus[] = [CallStatus.PENDING, CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS]
export const TERMINAL_STATUSES: CallStatus[] = [CallStatus.COMPLETED, CallStatus.MISSED, CallStatus.CANCELLED, CallStatus.HANDLED]
export const WAITER_ACTIVE_STATUSES: CallStatus[] = [CallStatus.ACKNOWLEDGED, CallStatus.IN_PROGRESS]

/**
 * Status priority for sorting (lower number = higher priority)
 */
export const STATUS_PRIORITY = {
  [CallStatus.PENDING]: 1,
  [CallStatus.ACKNOWLEDGED]: 2,
  [CallStatus.IN_PROGRESS]: 2,
  [CallStatus.MISSED]: 3,
  [CallStatus.COMPLETED]: 4,
  [CallStatus.CANCELLED]: 4,
  [CallStatus.HANDLED]: 4
} as const

/**
 * Legacy status mapping for backward compatibility
 */
export const LEGACY_STATUS_MAPPING: Record<string, CallStatus> = {
  [CallStatus.HANDLED]: CallStatus.COMPLETED
}

/**
 * Reverse mapping for backward compatibility
 */
export const REVERSE_LEGACY_MAPPING: Record<string, CallStatus[]> = {
  [CallStatus.COMPLETED]: [CallStatus.COMPLETED, CallStatus.HANDLED]
}

/**
 * Utility functions for status handling
 */
export function isActiveStatus(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as CallStatus)
}

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.includes(status as CallStatus)
}

export function isValidStatusTransition(
  fromStatus: string,
  toStatus: string,
  role: 'waiter' | 'admin'
): boolean {
  const validTransitions = VALID_STATUS_TRANSITIONS[role]
  const allowedStatuses = validTransitions[fromStatus as CallStatus] || []
  return allowedStatuses.includes(toStatus as CallStatus)
}

export function normalizeStatus(status: string): CallStatus {
  // Convert legacy HANDLED to COMPLETED
  return LEGACY_STATUS_MAPPING[status] || status as CallStatus
}

export function getStatusForFilter(status: string | null): CallStatus[] {
  if (!status) return ACTIVE_STATUSES
  
  switch (status.toLowerCase()) {
    case 'pending':
      return [CallStatus.PENDING]
    case 'acknowledged':
      return [CallStatus.ACKNOWLEDGED]
    case 'in_progress':
    case 'inprogress':
      return [CallStatus.IN_PROGRESS]
    case 'completed':
      return REVERSE_LEGACY_MAPPING[CallStatus.COMPLETED] || [CallStatus.COMPLETED]
    case 'missed':
      return [CallStatus.MISSED]
    case 'cancelled':
      return [CallStatus.CANCELLED]
    case 'handled':
      return [CallStatus.HANDLED]
    case 'active':
      return ACTIVE_STATUSES
    case 'my':
      return WAITER_ACTIVE_STATUSES
    case 'all':
      return Object.values(CallStatus)
    default:
      return ACTIVE_STATUSES
  }
}

export function getStatusDisplay(status: string): string {
  const normalizedStatus = normalizeStatus(status)
  return CALL_STATUS_DISPLAY[normalizedStatus] || status
}

export function getStatusColor(status: string): string {
  const normalizedStatus = normalizeStatus(status)
  return CALL_STATUS_COLORS[normalizedStatus] || 'text-gray-600'
}

export function getStatusBorderColor(status: string): string {
  const normalizedStatus = normalizeStatus(status)
  return CALL_STATUS_BORDER_COLORS[normalizedStatus] || 'border-gray-500'
}

/**
 * API response standardization
 */
export interface StandardCallResponse {
  id: string
  status: CallStatus
  normalizedStatus: CallStatus
  displayStatus: string
  color: string
  borderColor: string
  priority: number
  isActive: boolean
  isTerminal: boolean
  // ... other call fields
}

export function standardizeCallResponse(call: any): StandardCallResponse {
  const normalizedStatus = normalizeStatus(call.status)
  
  return {
    ...call,
    status: call.status as CallStatus,
    normalizedStatus,
    displayStatus: getStatusDisplay(call.status),
    color: getStatusColor(call.status),
    borderColor: getStatusBorderColor(call.status),
    priority: STATUS_PRIORITY[normalizedStatus] || 999,
    isActive: isActiveStatus(normalizedStatus),
    isTerminal: isTerminalStatus(normalizedStatus)
  }
}
