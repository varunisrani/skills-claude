/**
 * Error Logger
 *
 * Provides centralized error logging with different log levels and metadata.
 * Logs to console in development and can be extended to send to external services in production.
 */

/**
 * Log level for errors
 */
export type LogLevel = "error" | "warn" | "info" | "debug"

/**
 * Error metadata for additional context
 */
export interface ErrorMetadata {
  /** Error type or category */
  type?: string
  /** HTTP status code if applicable */
  statusCode?: number
  /** Request URL if applicable */
  url?: string
  /** User ID if available */
  userId?: string
  /** Component or module where error occurred */
  context?: string
  /** Component stack trace */
  componentStack?: string
  /** Whether error was caught by error boundary */
  errorBoundary?: boolean
  /** Additional custom details */
  details?: unknown
  /** Timestamp of the error */
  timestamp?: string
}

/**
 * Log entry structure
 */
interface LogEntry {
  level: LogLevel
  message: string
  error?: Error | unknown
  metadata?: ErrorMetadata
  timestamp: string
}

/**
 * Error logger class
 */
class ErrorLogger {
  private logs: LogEntry[] = []
  private maxLogs = 100

  /**
   * Log an error with metadata
   */
  log(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    metadata?: ErrorMetadata
  ): void {
    const entry: LogEntry = {
      level,
      message,
      error,
      metadata: {
        ...metadata,
        timestamp: metadata?.timestamp || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }

    // Add to in-memory log
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Remove oldest log
    }

    // Console logging
    this.logToConsole(entry)

    // In production, you could send to external logging service
    if (process.env.NODE_ENV === "production" && level === "error") {
      this.sendToExternalService(entry)
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, error, metadata } = entry

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`
    const context = metadata?.context ? ` [${metadata.context}]` : ""
    const fullMessage = `${prefix}${context} ${message}`

    switch (level) {
      case "error":
        if (error) {
          console.error(fullMessage, error, metadata)
        } else {
          console.error(fullMessage, metadata)
        }
        break
      case "warn":
        console.warn(fullMessage, metadata)
        break
      case "info":
        console.info(fullMessage, metadata)
        break
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(fullMessage, metadata)
        }
        break
    }
  }

  /**
   * Send error to external logging service (placeholder)
   * In production, implement sending to services like Sentry, LogRocket, etc.
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // Example services:
    // - Sentry: Sentry.captureException(entry.error, { extra: entry.metadata })
    // - LogRocket: LogRocket.captureException(entry.error, { extra: entry.metadata })
    // - Custom API: fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })

    // For now, just console.error in production with a flag
    if (process.env.NODE_ENV === "production") {
      console.error("[PRODUCTION ERROR]", entry)
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level)
  }
}

// Singleton instance
const logger = new ErrorLogger()

/**
 * Log an error
 */
export function logError(error: unknown, metadata?: ErrorMetadata): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Unknown error"

  logger.log("error", message, error, metadata)
}

/**
 * Log a warning
 */
export function logWarning(message: string, metadata?: ErrorMetadata): void {
  logger.log("warn", message, undefined, metadata)
}

/**
 * Log info
 */
export function logInfo(message: string, metadata?: ErrorMetadata): void {
  logger.log("info", message, undefined, metadata)
}

/**
 * Log debug information
 */
export function logDebug(message: string, metadata?: ErrorMetadata): void {
  logger.log("debug", message, undefined, metadata)
}

/**
 * Get recent logs
 */
export function getRecentLogs(count?: number): LogEntry[] {
  return logger.getRecentLogs(count)
}

/**
 * Clear logs
 */
export function clearLogs(): void {
  logger.clearLogs()
}

/**
 * Get errors only
 */
export function getErrors(): LogEntry[] {
  return logger.getLogsByLevel("error")
}

// Export logger instance for advanced usage
export { logger as errorLogger }
export type { LogEntry }
