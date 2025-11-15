/**
 * ApiErrorDisplay Component
 *
 * Displays API errors in a user-friendly format with actionable messages.
 *
 * Features:
 * - Categorizes errors by type (network, validation, server, etc.)
 * - Shows user-friendly messages with technical details option
 * - Provides retry functionality
 * - Responsive design with icons
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  AlertTriangle,
  WifiOff,
  ServerCrash,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { ApiError } from "@/lib/errors/error-handler"

interface ApiErrorDisplayProps {
  /** The API error to display */
  error: ApiError | Error | unknown
  /** Optional retry callback */
  onRetry?: () => void
  /** Whether the retry button should show loading state */
  isRetrying?: boolean
  /** Optional custom title */
  title?: string
  /** Whether to show the retry button */
  showRetry?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Determine the error icon and variant based on error type
 */
function getErrorDisplay(error: ApiError | Error | unknown) {
  if (isApiError(error)) {
    switch (error.type) {
      case "NETWORK_ERROR":
        return {
          icon: WifiOff,
          variant: "destructive" as const,
          title: "Network Error",
          color: "text-orange-500",
        }
      case "VALIDATION_ERROR":
        return {
          icon: AlertTriangle,
          variant: "default" as const,
          title: "Validation Error",
          color: "text-yellow-500",
        }
      case "AUTHENTICATION_ERROR":
        return {
          icon: ShieldAlert,
          variant: "destructive" as const,
          title: "Authentication Error",
          color: "text-red-500",
        }
      case "SERVER_ERROR":
        return {
          icon: ServerCrash,
          variant: "destructive" as const,
          title: "Server Error",
          color: "text-red-500",
        }
      default:
        return {
          icon: AlertCircle,
          variant: "destructive" as const,
          title: "Error",
          color: "text-red-500",
        }
    }
  }

  return {
    icon: AlertCircle,
    variant: "destructive" as const,
    title: "Error",
    color: "text-red-500",
  }
}

/**
 * Type guard for ApiError
 */
function isApiError(error: any): error is ApiError {
  return error && typeof error === "object" && "type" in error && "message" in error
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: ApiError | Error | unknown): string {
  if (isApiError(error)) {
    return error.userMessage || error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "An unexpected error occurred"
}

/**
 * Get technical details from error
 */
function getTechnicalDetails(error: ApiError | Error | unknown): string | null {
  if (isApiError(error)) {
    const details: string[] = []

    if (error.statusCode) {
      details.push(`Status Code: ${error.statusCode}`)
    }

    if (error.type) {
      details.push(`Type: ${error.type}`)
    }

    if (error.details) {
      details.push(`Details: ${JSON.stringify(error.details, null, 2)}`)
    }

    return details.length > 0 ? details.join("\n") : null
  }

  if (error instanceof Error && error.stack) {
    return error.stack
  }

  return null
}

export function ApiErrorDisplay({
  error,
  onRetry,
  isRetrying = false,
  title,
  showRetry = true,
  className,
}: ApiErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)

  const display = getErrorDisplay(error)
  const message = getErrorMessage(error)
  const technicalDetails = getTechnicalDetails(error)
  const Icon = display.icon

  return (
    <Alert variant={display.variant} className={className}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${display.color} mt-0.5`} />
        <div className="flex-1 space-y-2">
          <AlertTitle>{title || display.title}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{message}</p>

            {technicalDetails && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  <span className="text-xs flex items-center gap-1">
                    {showDetails ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show technical details
                      </>
                    )}
                  </span>
                </Button>

                {showDetails && (
                  <pre className="text-xs bg-background/50 p-3 rounded overflow-auto max-h-[200px] border">
                    {technicalDetails}
                  </pre>
                )}
              </div>
            )}

            {showRetry && onRetry && (
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="gap-2"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Try Again
                    </>
                  )}
                </Button>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}
