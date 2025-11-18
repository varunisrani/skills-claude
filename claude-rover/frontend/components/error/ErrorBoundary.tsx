/**
 * ErrorBoundary Component
 *
 * A React error boundary that catches JavaScript errors anywhere in the component tree,
 * logs them, and displays a fallback UI instead of crashing the whole app.
 *
 * Features:
 * - Catches rendering errors in child components
 * - Logs errors server-side for debugging
 * - Shows user-friendly fallback UI
 * - Allows user to reset error state
 * - Integrates with error logging utility
 */

"use client"

import React from "react"
import { ErrorFallback } from "./ErrorFallback"
import { logError } from "@/lib/errors/error-logger"

interface ErrorBoundaryProps {
  /** Child components to protect with error boundary */
  children: React.ReactNode
  /** Optional custom fallback component */
  fallback?: React.ComponentType<ErrorFallbackProps>
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Optional context identifier for error tracking */
  context?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export interface ErrorFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetError: () => void
  context?: string
}

/**
 * Error Boundary class component
 * Note: Error boundaries must be class components as of React 18
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to our error logging service
    const { context } = this.props

    logError(error, {
      context: context || "ErrorBoundary",
      componentStack: errorInfo.componentStack || undefined,
      errorBoundary: true,
    })

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          context={this.props.context}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Hook-like wrapper for functional component usage
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`

  return WrappedComponent
}
