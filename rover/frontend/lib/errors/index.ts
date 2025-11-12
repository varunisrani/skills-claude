/**
 * Error utilities exports
 */

// Error handler
export {
  handleError,
  handleFetchError,
  createApiError,
  sanitizeError,
  formatErrorResponse,
  isApiError,
  isApiErrorResponse,
} from "./error-handler"

export type {
  ErrorType,
  ApiError,
  ApiErrorResponse,
} from "./error-handler"

// Error messages
export {
  getUserFriendlyMessage,
  getErrorCategory,
  getErrorSuggestions,
  formatErrorWithSuggestions,
} from "./error-messages"

export type { ErrorCategory } from "./error-messages"

// Error logger
export {
  logError,
  logWarning,
  logInfo,
  logDebug,
  getRecentLogs,
  clearLogs,
  getErrors,
  errorLogger,
} from "./error-logger"

export type { LogLevel, ErrorMetadata, LogEntry } from "./error-logger"
