/**
 * User-Friendly Error Messages
 *
 * Maps technical error types and messages to user-friendly, actionable messages.
 */

import type { ErrorType } from "./error-handler"

/**
 * Error category for grouping similar errors
 */
export type ErrorCategory =
  | "network"
  | "validation"
  | "authentication"
  | "server"
  | "unknown"

/**
 * Get error category from error type
 */
export function getErrorCategory(type: ErrorType): ErrorCategory {
  switch (type) {
    case "NETWORK_ERROR":
    case "TIMEOUT_ERROR":
      return "network"
    case "VALIDATION_ERROR":
      return "validation"
    case "AUTHENTICATION_ERROR":
    case "AUTHORIZATION_ERROR":
      return "authentication"
    case "SERVER_ERROR":
    case "NOT_FOUND_ERROR":
      return "server"
    default:
      return "unknown"
  }
}

/**
 * Default user-friendly messages for each error type
 */
const DEFAULT_MESSAGES: Record<ErrorType, string> = {
  NETWORK_ERROR:
    "Unable to connect to the server. Please check your internet connection and try again.",
  VALIDATION_ERROR:
    "The information you provided is invalid. Please check your input and try again.",
  AUTHENTICATION_ERROR:
    "You need to be logged in to perform this action. Please sign in and try again.",
  AUTHORIZATION_ERROR:
    "You don't have permission to perform this action. Please contact support if you believe this is an error.",
  NOT_FOUND_ERROR:
    "The requested resource could not be found. It may have been deleted or moved.",
  SERVER_ERROR:
    "Our servers are having trouble processing your request. Please try again in a few moments.",
  TIMEOUT_ERROR:
    "The request took too long to complete. Please try again.",
  UNKNOWN_ERROR:
    "An unexpected error occurred. Please try again or contact support if the problem persists.",
}

/**
 * Specific error message patterns and their user-friendly equivalents
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string
  message: string
  category?: ErrorCategory
}> = [
  // Network & Connection
  {
    pattern: /fetch.*failed/i,
    message: "Unable to connect to the server. Please check your internet connection.",
    category: "network",
  },
  {
    pattern: /network.*error/i,
    message: "A network error occurred. Please check your connection and try again.",
    category: "network",
  },
  {
    pattern: /timeout|timed out/i,
    message: "The request took too long. Please try again.",
    category: "network",
  },

  // Rover-specific errors
  {
    pattern: /rover.*not found/i,
    message: "Rover CLI not found. Please ensure Rover is properly installed and in your PATH.",
  },
  {
    pattern: /not initialized/i,
    message: "Rover project not initialized. Please run 'rover init' first.",
  },
  {
    pattern: /credentials.*not configured/i,
    message: "AI agent credentials not set up. Please configure your API keys.",
  },
  {
    pattern: /invalid branch/i,
    message: "The specified Git branch is invalid or doesn't exist.",
  },
  {
    pattern: /git.*error/i,
    message: "A Git error occurred. Please check your repository status.",
  },

  // Task errors
  {
    pattern: /task.*not found/i,
    message: "Task not found. It may have been deleted.",
  },
  {
    pattern: /task.*failed/i,
    message: "Task execution failed. Please check the logs for details.",
  },
  {
    pattern: /container.*not found/i,
    message: "Task container not found. The task may have been stopped or removed.",
  },

  // Validation errors
  {
    pattern: /validation.*failed/i,
    message: "Please check your input. Some fields contain invalid data.",
    category: "validation",
  },
  {
    pattern: /description.*required|description.*too short/i,
    message: "Please provide a task description between 10 and 5000 characters.",
    category: "validation",
  },
  {
    pattern: /invalid.*json/i,
    message: "The data format is invalid. Please try again.",
    category: "validation",
  },

  // Authentication & Authorization
  {
    pattern: /unauthorized|401/i,
    message: "Authentication required. Please sign in to continue.",
    category: "authentication",
  },
  {
    pattern: /forbidden|403/i,
    message: "You don't have permission to perform this action.",
    category: "authentication",
  },

  // Server errors
  {
    pattern: /500|internal server error/i,
    message: "Our servers are experiencing issues. Please try again in a few moments.",
    category: "server",
  },
  {
    pattern: /503|service unavailable/i,
    message: "The service is temporarily unavailable. Please try again later.",
    category: "server",
  },
  {
    pattern: /404|not found/i,
    message: "The requested resource was not found.",
    category: "server",
  },
]

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(
  type: ErrorType,
  technicalMessage?: string
): string {
  // If we have a technical message, try to match it against patterns
  if (technicalMessage) {
    for (const { pattern, message } of ERROR_PATTERNS) {
      if (typeof pattern === "string") {
        if (technicalMessage.toLowerCase().includes(pattern.toLowerCase())) {
          return message
        }
      } else if (pattern.test(technicalMessage)) {
        return message
      }
    }
  }

  // Fall back to default message for the error type
  return DEFAULT_MESSAGES[type]
}

/**
 * Get actionable suggestions for error resolution
 */
export function getErrorSuggestions(type: ErrorType, message?: string): string[] {
  const suggestions: string[] = []

  switch (type) {
    case "NETWORK_ERROR":
      suggestions.push("Check your internet connection")
      suggestions.push("Try refreshing the page")
      suggestions.push("Check if the server is accessible")
      break

    case "VALIDATION_ERROR":
      suggestions.push("Review your input for errors")
      suggestions.push("Ensure all required fields are filled")
      suggestions.push("Check for any character limits")
      break

    case "AUTHENTICATION_ERROR":
      suggestions.push("Sign in to your account")
      suggestions.push("Check if your session has expired")
      suggestions.push("Verify your credentials")
      break

    case "AUTHORIZATION_ERROR":
      suggestions.push("Contact your administrator for access")
      suggestions.push("Verify you have the necessary permissions")
      break

    case "NOT_FOUND_ERROR":
      suggestions.push("Check the URL or resource ID")
      suggestions.push("The resource may have been deleted")
      suggestions.push("Try searching for it instead")
      break

    case "SERVER_ERROR":
      suggestions.push("Wait a few moments and try again")
      suggestions.push("Contact support if the issue persists")
      suggestions.push("Check the status page for known issues")
      break

    case "TIMEOUT_ERROR":
      suggestions.push("Try again with a smaller request")
      suggestions.push("Check your internet speed")
      suggestions.push("The server might be under heavy load")
      break

    case "UNKNOWN_ERROR":
      suggestions.push("Try refreshing the page")
      suggestions.push("Clear your browser cache")
      suggestions.push("Contact support with error details")
      break
  }

  // Add specific suggestions based on message content
  if (message?.toLowerCase().includes("rover")) {
    suggestions.push("Ensure Rover CLI is properly installed")
    suggestions.push("Run 'rover --version' to verify installation")
  }

  if (message?.toLowerCase().includes("git")) {
    suggestions.push("Check your Git repository status")
    suggestions.push("Ensure you have committed all changes")
  }

  if (message?.toLowerCase().includes("credentials")) {
    suggestions.push("Configure your AI agent API keys")
    suggestions.push("Check your environment variables")
  }

  return suggestions
}

/**
 * Format error message with suggestions
 */
export function formatErrorWithSuggestions(
  type: ErrorType,
  message?: string
): {
  message: string
  suggestions: string[]
} {
  return {
    message: getUserFriendlyMessage(type, message),
    suggestions: getErrorSuggestions(type, message),
  }
}
