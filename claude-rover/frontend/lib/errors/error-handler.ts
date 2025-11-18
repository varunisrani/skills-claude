/**
 * Centralized Error Handler
 *
 * Provides utilities for handling and transforming errors throughout the application.
 * Categorizes errors, sanitizes sensitive information, and provides user-friendly messages.
 */

import { getUserFriendlyMessage, getErrorCategory } from "./error-messages"
import { logError } from "./error-logger"

/**
 * Error types for categorization
 */
export type ErrorType =
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND_ERROR"
  | "SERVER_ERROR"
  | "TIMEOUT_ERROR"
  | "UNKNOWN_ERROR"

/**
 * Standard API error structure
 */
export interface ApiError {
  /** Error type for categorization */
  type: ErrorType
  /** User-friendly error message */
  userMessage: string
  /** Technical error message (for logging) */
  message: string
  /** HTTP status code if applicable */
  statusCode?: number
  /** Additional error details */
  details?: unknown
  /** Original error object */
  originalError?: Error | unknown
}

/**
 * API response error structure
 */
export interface ApiErrorResponse {
  success: false
  error: string
  details?: unknown
  statusCode?: number
}

/**
 * Type guard for API error response
 */
export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false &&
    "error" in response
  )
}

/**
 * Determine error type from HTTP status code
 */
function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 400) return "VALIDATION_ERROR"
  if (status === 401) return "AUTHENTICATION_ERROR"
  if (status === 403) return "AUTHORIZATION_ERROR"
  if (status === 404) return "NOT_FOUND_ERROR"
  if (status === 408) return "TIMEOUT_ERROR"
  if (status >= 500) return "SERVER_ERROR"
  return "UNKNOWN_ERROR"
}

/**
 * Determine error type from error object
 */
function getErrorType(error: unknown): ErrorType {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "NETWORK_ERROR"
  }

  // Timeout errors
  if (error instanceof Error && (
    error.message.includes("timeout") ||
    error.message.includes("timed out")
  )) {
    return "TIMEOUT_ERROR"
  }

  // Check if it's already an ApiError
  if (isApiError(error)) {
    return error.type
  }

  return "UNKNOWN_ERROR"
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    "userMessage" in error &&
    "message" in error
  )
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof error.message === "string") {
      return error.message
    }
    if ("error" in error && typeof error.error === "string") {
      return error.error
    }
  }

  return "An unknown error occurred"
}

/**
 * Handle fetch response errors
 */
export async function handleFetchError(response: Response): Promise<ApiError> {
  let errorData: ApiErrorResponse | undefined

  try {
    const text = await response.text()
    if (text) {
      errorData = JSON.parse(text) as ApiErrorResponse
    }
  } catch (parseError) {
    // If we can't parse the error, that's okay
    console.warn("Failed to parse error response:", parseError)
  }

  const errorType = getErrorTypeFromStatus(response.status)
  const message = errorData?.error || response.statusText || "Request failed"
  const userMessage = getUserFriendlyMessage(errorType, message)

  const apiError: ApiError = {
    type: errorType,
    userMessage,
    message,
    statusCode: response.status,
    details: errorData?.details,
  }

  // Log the error
  logError(new Error(message), {
    type: errorType,
    statusCode: response.status,
    url: response.url,
    details: errorData?.details,
  })

  return apiError
}

/**
 * Handle generic errors (non-fetch)
 */
export function handleError(error: unknown, context?: string): ApiError {
  // If it's already an ApiError, return it
  if (isApiError(error)) {
    return error
  }

  const errorType = getErrorType(error)
  const message = extractErrorMessage(error)
  const userMessage = getUserFriendlyMessage(errorType, message)

  const apiError: ApiError = {
    type: errorType,
    userMessage,
    message,
    originalError: error instanceof Error ? error : undefined,
  }

  // Log the error
  logError(error, {
    type: errorType,
    context,
  })

  return apiError
}

/**
 * Create a standardized API error
 */
export function createApiError(
  type: ErrorType,
  message: string,
  options?: {
    statusCode?: number
    details?: unknown
    originalError?: Error | unknown
  }
): ApiError {
  return {
    type,
    userMessage: getUserFriendlyMessage(type, message),
    message,
    ...options,
  }
}

/**
 * Sanitize error for client-side display
 * Removes sensitive information like stack traces in production
 */
export function sanitizeError(error: ApiError): ApiError {
  const sanitized: ApiError = {
    type: error.type,
    userMessage: error.userMessage,
    message: error.message,
    statusCode: error.statusCode,
  }

  // In development, include more details
  if (process.env.NODE_ENV === "development") {
    sanitized.details = error.details
  }

  return sanitized
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: ApiError): ApiErrorResponse {
  return {
    success: false,
    error: error.userMessage,
    details: process.env.NODE_ENV === "development" ? error.details : undefined,
    statusCode: error.statusCode,
  }
}
