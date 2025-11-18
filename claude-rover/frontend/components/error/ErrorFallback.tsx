/**
 * ErrorFallback Component
 *
 * A user-friendly error display UI shown when an error boundary catches an error.
 *
 * Features:
 * - User-friendly error message
 * - Optional technical details (hidden by default)
 * - Reset/retry functionality
 * - Responsive design with shadcn/ui components
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import type { ErrorFallbackProps } from "./ErrorBoundary"

export function ErrorFallback({ error, errorInfo, resetError, context }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false)

  const handleReset = () => {
    // Reset the error boundary state
    resetError()

    // Optionally reload the page if reset doesn't work
    // This is commented out to give React a chance to recover first
    // window.location.reload()
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-2xl w-full border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="mt-1.5">
                {context
                  ? `An error occurred in ${context}`
                  : "We encountered an unexpected error"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-background rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              Don't worry, your work is safe. Try refreshing or go back to continue.
            </p>
          </div>

          {error && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between"
              >
                <span className="text-sm font-medium">
                  {showDetails ? "Hide" : "Show"} technical details
                </span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showDetails && (
                <div className="space-y-3">
                  <div className="bg-background rounded-md border p-4 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Error Message:
                      </p>
                      <code className="text-xs text-destructive block bg-destructive/10 p-2 rounded">
                        {error.message || "Unknown error"}
                      </code>
                    </div>

                    {error.stack && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Stack Trace:
                        </p>
                        <pre className="text-xs overflow-auto max-h-[200px] bg-muted p-2 rounded">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Component Stack:
                        </p>
                        <pre className="text-xs overflow-auto max-h-[150px] bg-muted p-2 rounded">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleReset} className="flex-1 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
