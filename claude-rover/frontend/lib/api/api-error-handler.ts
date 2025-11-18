/**
 * API Error Handler
 *
 * Utilities for handling errors in Next.js API routes.
 * Integrates with the centralized error handling system.
 */

import { NextResponse } from "next/server"
import { ZodError } from "zod"
import {
  createApiError,
  formatErrorResponse,
  type ErrorType,
  type ApiError,
} from "@/lib/errors/error-handler"
import { logError } from "@/lib/errors/error-logger"

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse {
  const errorMessages = error.errors.map(
    (err) => `${err.path.join(".")}: ${err.message}`
  )

  const apiError = createApiError(
    "VALIDATION_ERROR",
    `Validation failed: ${errorMessages.join(", ")}`,
    {
      statusCode: 400,
      details: error.errors,
    }
  )

  logError(error, {
    type: "VALIDATION_ERROR",
    statusCode: 400,
    details: error.errors,
  })

  return NextResponse.json(formatErrorResponse(apiError), { status: 400 })
}

/**
 * Handle Rover CLI errors with pattern matching
 */
export function handleRoverError(
  result: { success: false; error?: string; stderr?: string },
  context: string
): NextResponse {
  const stderr = result.stderr || ""
  const error = result.error || "Unknown error"

  logError(new Error(error), {
    context,
    details: { stderr },
  })

  let errorType: ErrorType = "SERVER_ERROR"
  let statusCode = 500

  // Pattern match common Rover errors
  if (stderr.includes("not found") || stderr.includes("does not exist")) {
    errorType = "NOT_FOUND_ERROR"
    statusCode = 404
  } else if (stderr.includes("not initialized")) {
    errorType = "VALIDATION_ERROR"
    statusCode = 400
  } else if (stderr.includes("credentials") || stderr.includes("configuration")) {
    errorType = "VALIDATION_ERROR"
    statusCode = 400
  } else if (stderr.includes("running") || stderr.includes("in progress")) {
    errorType = "VALIDATION_ERROR"
    statusCode = 409
  } else if (stderr.includes("not running") || stderr.includes("already stopped")) {
    errorType = "VALIDATION_ERROR"
    statusCode = 409
  }

  const apiError = createApiError(errorType, error, {
    statusCode,
    details: process.env.NODE_ENV === "development" ? { stderr } : undefined,
  })

  return NextResponse.json(formatErrorResponse(apiError), { status: statusCode })
}

/**
 * Handle generic API errors
 */
export function handleGenericError(
  error: unknown,
  context: string
): NextResponse {
  logError(error, { context })

  const apiError = createApiError(
    "UNKNOWN_ERROR",
    error instanceof Error ? error.message : "An unexpected error occurred",
    {
      statusCode: 500,
      originalError: error instanceof Error ? error : undefined,
    }
  )

  return NextResponse.json(formatErrorResponse(apiError), { status: 500 })
}

/**
 * Handle invalid JSON in request body
 */
export function handleInvalidJSON(): NextResponse {
  const apiError = createApiError(
    "VALIDATION_ERROR",
    "Invalid JSON in request body.",
    { statusCode: 400 }
  )

  return NextResponse.json(formatErrorResponse(apiError), { status: 400 })
}

/**
 * Handle invalid task ID
 */
export function handleInvalidTaskId(): NextResponse {
  const apiError = createApiError(
    "VALIDATION_ERROR",
    "Invalid task ID. Must be a positive integer.",
    { statusCode: 400 }
  )

  return NextResponse.json(formatErrorResponse(apiError), { status: 400 })
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  )
}

/**
 * Create an error response from ApiError
 */
export function createErrorResponse(
  apiError: ApiError,
  statusCode?: number
): NextResponse {
  return NextResponse.json(
    formatErrorResponse(apiError),
    { status: statusCode || apiError.statusCode || 500 }
  )
}
