/**
 * Comprehensive Input Validation System
 * 
 * Provides centralized validation for all API endpoints with detailed error messages
 * and security measures to prevent injection attacks.
 */

import { NextRequest } from 'next/server'

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  data?: any
}

export class ValidationException extends Error {
  public errors: ValidationError[]
  public statusCode: number

  constructor(errors: ValidationError[], statusCode: number = 400) {
    super('Validation failed')
    this.errors = errors
    this.statusCode = statusCode
    this.name = 'ValidationException'
  }
}

/**
 * Validation schema type
 */
export type ValidationRule = (value: any, fieldName: string) => ValidationError | null
export type ValidationSchema = Record<string, ValidationRule[]>

/**
 * Common validation patterns
 */
export const PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  ACCESS_CODE: /^\d{4,8}$/,
  TABLE_NUMBER: /^[a-zA-Z0-9\-#\/\s]{1,20}$/,
  RESTAURANT_NAME: /^.{1,100}$/,
  WAITER_NAME: /^.{1,50}$/,
  CALL_STATUS: /^(PENDING|ACKNOWLEDGED|IN_PROGRESS|COMPLETED|MISSED|CANCELLED|HANDLED)$/
} as const

/**
 * Sanitization functions
 */
export const sanitize = {
  string: (input: any, maxLength?: number): string => {
    if (typeof input !== 'string') return ''
    const sanitized = input.trim().replace(/[<>]/g, '') // Remove potential HTML
    return maxLength ? sanitized.substring(0, maxLength) : sanitized
  },

  uuid: (input: any): string => {
    const sanitized = sanitize.string(input).toLowerCase()
    return PATTERNS.UUID.test(sanitized) ? sanitized : ''
  },

  email: (input: any): string => {
    const sanitized = sanitize.string(input).toLowerCase()
    return PATTERNS.EMAIL.test(sanitized) ? sanitized : ''
  },

  phone: (input: any): string => {
    const sanitized = sanitize.string(input).replace(/[^\d+]/g, '')
    return PATTERNS.PHONE.test(sanitized) ? sanitized : ''
  },

  slug: (input: any): string => {
    const sanitized = sanitize.string(input).toLowerCase()
    return PATTERNS.SLUG.test(sanitized) ? sanitized : ''
  },

  number: (input: any, min?: number, max?: number): number => {
    const num = Number(input)
    if (isNaN(num)) return 0
    if (min !== undefined && num < min) return min
    if (max !== undefined && num > max) return max
    return num
  },

  boolean: (input: any): boolean => {
    if (typeof input === 'boolean') return input
    if (typeof input === 'string') {
      const lower = input.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    if (typeof input === 'number') return input !== 0
    return Boolean(input)
  }
}

/**
 * Validation rules
 */
export const validate = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      }
    }
    return null
  },

  uuid: (value: any, fieldName: string): ValidationError | null => {
    const sanitized = sanitize.uuid(value)
    if (!sanitized) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid UUID`,
        code: 'INVALID_UUID'
      }
    }
    return null
  },

  email: (value: any, fieldName: string): ValidationError | null => {
    const sanitized = sanitize.email(value)
    if (!sanitized) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        code: 'INVALID_EMAIL'
      }
    }
    return null
  },

  phone: (value: any, fieldName: string, required: boolean = false): ValidationError | null => {
    if (!value && !required) return null
    
    const sanitized = sanitize.phone(value)
    if (!sanitized) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid phone number`,
        code: 'INVALID_PHONE'
      }
    }
    return null
  },

  string: (value: any, fieldName: string, minLength: number = 1, maxLength: number = 255): ValidationError | null => {
    if (value === null || value === undefined) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      }
    }
    
    const sanitized = sanitize.string(value)
    if (sanitized.length < minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters long`,
        code: 'MIN_LENGTH'
      }
    }
    
    if (sanitized.length > maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must not exceed ${maxLength} characters`,
        code: 'MAX_LENGTH'
      }
    }
    
    return null
  },

  accessCode: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      }
    }
    
    const sanitized = sanitize.string(value)
    if (!PATTERNS.ACCESS_CODE.test(sanitized)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a 4-8 digit number`,
        code: 'INVALID_ACCESS_CODE'
      }
    }
    
    return null
  },

  status: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      }
    }
    
    const sanitized = sanitize.string(value).toUpperCase()
    if (!PATTERNS.CALL_STATUS.test(sanitized)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid call status`,
        code: 'INVALID_STATUS'
      }
    }
    
    return null
  },

  numeric: (value: any, fieldName: string, min?: number, max?: number): ValidationError | null => {
    const num = Number(value)
    if (isNaN(num)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        code: 'INVALID_NUMBER'
      }
    }
    
    if (min !== undefined && num < min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        code: 'MIN_VALUE'
      }
    }
    
    if (max !== undefined && num > max) {
      return {
        field: fieldName,
        message: `${fieldName} must not exceed ${max}`,
        code: 'MAX_VALUE'
      }
    }
    
    return null
  },

  boolean: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      }
    }
    
    if (typeof value !== 'boolean' && typeof value !== 'string' && typeof value !== 'number') {
      return {
        field: fieldName,
        message: `${fieldName} must be a boolean value`,
        code: 'INVALID_BOOLEAN'
      }
    }
    
    return null
  },

  enum: (value: any, fieldName: string, allowedValues: string[]): ValidationError | null => {
    if (value === null || value === undefined) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        code: 'REQUIRED'
      }
    }
    
    const sanitized = sanitize.string(value)
    if (!allowedValues.includes(sanitized)) {
      return {
        field: fieldName,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        code: 'INVALID_ENUM'
      }
    }
    
    return null
  }
}

/**
 * Request body validation
 */
export function validateRequestBody(request: NextRequest, schema: ValidationSchema): ValidationResult {
  try {
    const body = request.headers.get('content-type')?.includes('application/json') 
      ? request.json() 
      : {}
    
    return validateObject(body, schema)
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'body',
        message: 'Invalid JSON format',
        code: 'INVALID_JSON'
      }]
    }
  }
}

/**
 * Object validation
 */
export function validateObject(obj: any, schema: ValidationSchema): ValidationResult {
  const errors: ValidationError[] = []
  const sanitizedData: any = {}

  // Check for unexpected fields
  const allowedFields = Object.keys(schema)
  const unexpectedFields = Object.keys(obj).filter(field => !allowedFields.includes(field))
  
  if (unexpectedFields.length > 0) {
    errors.push({
      field: 'unexpected_fields',
      message: `Unexpected fields: ${unexpectedFields.join(', ')}`,
      code: 'UNEXPECTED_FIELDS'
    })
  }

  // Validate each field
  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = obj[fieldName]
    
    // Apply all validation rules
    for (const rule of rules) {
      const error = rule(value, fieldName)
      if (error) {
        errors.push(error)
        break // Stop at first error for this field
      }
    }
    
    // Sanitize and store valid value
    if (errors.length === 0 || !errors.some(e => e.field === fieldName)) {
      if (fieldName.includes('id') && fieldName !== 'waiterId' && fieldName !== 'tableId' && fieldName !== 'restaurantId') {
        sanitizedData[fieldName] = sanitize.uuid(value)
      } else if (fieldName.includes('email')) {
        sanitizedData[fieldName] = sanitize.email(value)
      } else if (fieldName.includes('phone')) {
        sanitizedData[fieldName] = sanitize.phone(value)
      } else if (fieldName.includes('status')) {
        sanitizedData[fieldName] = sanitize.string(value).toUpperCase()
      } else if (typeof value === 'string') {
        sanitizedData[fieldName] = sanitize.string(value)
      } else if (typeof value === 'number') {
        sanitizedData[fieldName] = value
      } else if (typeof value === 'boolean') {
        sanitizedData[fieldName] = sanitize.boolean(value)
      } else {
        sanitizedData[fieldName] = value
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: sanitizedData
  }
}

/**
 * Common validation schemas
 */
export const SCHEMAS: Record<string, ValidationSchema> = {
  createCall: {
    tableId: [
      (value: any) => validate.required(value, 'tableId'),
      (value: any) => {
        const sanitized = sanitize.string(value)
        if (!sanitized) {
          return {
            field: 'tableId',
            message: 'tableId is required',
            code: 'REQUIRED'
          }
        }
        return null // Accept any non-empty string for production
      }
    ],
    restaurantId: [
      (value: any) => validate.required(value, 'restaurantId'),
      (value: any) => {
        const sanitized = sanitize.string(value)
        if (!sanitized) {
          return {
            field: 'restaurantId',
            message: 'restaurantId is required',
            code: 'REQUIRED'
          }
        }
        return null // Accept any non-empty string for production
      }
    ]
  },

  updateCall: {
    status: [
      (value: any) => validate.status(value, 'status')
    ],
    waiterId: [
      (value: any) => validate.uuid(value, 'waiterId')
    ]
  },

  waiterLogin: {
    restaurantCode: [
      (value: any) => validate.string(value, 'restaurantCode', 1, 50)
    ],
    restaurantId: [
      (value: any) => validate.uuid(value, 'restaurantId')
    ],
    accessCode: [
      (value: any) => validate.accessCode(value, 'accessCode')
    ]
  },

  resetAccessCode: {
    restaurantCode: [
      (value: any) => validate.string(value, 'restaurantCode', 1, 50)
    ],
    restaurantId: [
      (value: any) => validate.uuid(value, 'restaurantId')
    ],
    email: [
      (value: any) => validate.email(value, 'email')
    ],
    phone: [
      (value: any) => validate.phone(value, 'phone', false)
    ],
    name: [
      (value: any) => validate.string(value, 'name', 1, 50)
    ]
  },

  createWaiter: {
    restaurantId: [
      (value: any) => validate.required(value, 'restaurantId'),
      (value: any) => validate.uuid(value, 'restaurantId')
    ],
    name: [
      (value: any) => validate.required(value, 'name'),
      (value: any) => validate.string(value, 'name', 1, 50)
    ],
    email: [
      (value: any) => validate.email(value, 'email')
    ],
    phone: [
      (value: any) => validate.phone(value, 'phone', false)
    ],
    accessCode: [
      (value: any) => validate.accessCode(value, 'accessCode')
    ],
    isActive: [
      (value: any) => validate.boolean(value, 'isActive')
    ]
  },

  createTable: {
    restaurantId: [
      (value: any) => validate.required(value, 'restaurantId'),
      (value: any) => validate.uuid(value, 'restaurantId')
    ],
    number: [
      (value: any) => validate.required(value, 'number'),
      (value: any) => validate.string(value, 'number', 1, 20)
    ],
    qrCode: [
      (value: any) => validate.required(value, 'qrCode'),
      (value: any) => validate.string(value, 'qrCode', 1, 255)
    ],
    isActive: [
      (value: any) => validate.boolean(value, 'isActive')
    ]
  }
}

/**
 * Middleware function for validation
 */
export function validateRequest(schema: ValidationSchema) {
  return (request: NextRequest) => {
    const result = validateRequestBody(request, schema)
    
    if (!result.isValid) {
      throw new ValidationException(result.errors)
    }
    
    return result.data
  }
}

/**
 * Rate limiting validation
 */
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }
    
    if (record.count >= this.maxAttempts) {
      return false
    }
    
    record.count++
    return true
  }

  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key)
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - record.count)
  }

  getResetTime(key: string): number | null {
    const record = this.attempts.get(key)
    if (!record || Date.now() > record.resetTime) {
      return null
    }
    return record.resetTime
  }
}

/**
 * Common rate limiters
 */
export const RATE_LIMITERS = {
  login: new RateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  callCreation: new RateLimiter(10, 60 * 1000), // 10 attempts per minute
  resetCode: new RateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  statusUpdate: new RateLimiter(20, 60 * 1000) // 20 attempts per minute
} as const

/**
 * Security validation
 */
export const security = {
  preventInjection: (input: string): string => {
    // Remove potential SQL injection patterns
    return input.replace(/['"\\;]/g, '').replace(/--|\/\*|\*\//g, '')
  },

  preventXSS: (input: string): string => {
    // Remove potential XSS patterns
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<[^>]*>/g, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '')
  },

  sanitizeAll: (input: any): any => {
    if (typeof input === 'string') {
      return security.preventXSS(security.preventInjection(input))
    }
    if (Array.isArray(input)) {
      return input.map(security.sanitizeAll)
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = security.sanitizeAll(value)
      }
      return sanitized
    }
    return input
  }
}

/**
 * Client key extraction for rate limiting
 */
export function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(',')
      .map((value) => value.trim())
      .find(Boolean)
    if (firstIp) return firstIp
  }

  const realIp = request.headers.get('x-real-ip')
  return realIp ?? 'unknown'
}
