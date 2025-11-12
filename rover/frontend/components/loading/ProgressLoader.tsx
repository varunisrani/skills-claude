/**
 * ProgressLoader Component
 *
 * A progress bar loader with percentage display and status text.
 * Uses shadcn/ui Progress component.
 *
 * Features:
 * - Animated progress bar
 * - Percentage display
 * - Status text (e.g., "Creating task...", "Merging...")
 * - Indeterminate mode for unknown progress
 * - Customizable colors based on status
 * - Accessible with ARIA attributes
 */

"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface ProgressLoaderProps {
  /** Current progress value (0-100) */
  value?: number
  /** Status text to display */
  text?: string
  /** Whether to show percentage */
  showPercentage?: boolean
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Color variant based on status */
  variant?: "default" | "success" | "warning" | "error"
  /** Custom className */
  className?: string
  /** Whether progress is indeterminate (animated) */
  indeterminate?: boolean
  /** Accessible label */
  label?: string
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

const variantClasses = {
  default: "bg-zinc-900 dark:bg-zinc-50",
  success: "bg-green-600 dark:bg-green-500",
  warning: "bg-amber-600 dark:bg-amber-500",
  error: "bg-red-600 dark:bg-red-500",
}

export function ProgressLoader({
  value = 0,
  text,
  showPercentage = false,
  size = "md",
  variant = "default",
  className,
  indeterminate = false,
  label = "Loading progress",
}: ProgressLoaderProps) {
  // For indeterminate mode, animate between 0 and 100
  const [indeterminateValue, setIndeterminateValue] = React.useState(0)

  React.useEffect(() => {
    if (!indeterminate) return

    const interval = setInterval(() => {
      setIndeterminateValue((prev) => {
        if (prev >= 100) return 0
        return prev + 2
      })
    }, 50)

    return () => clearInterval(interval)
  }, [indeterminate])

  const displayValue = indeterminate ? indeterminateValue : value
  const clampedValue = Math.min(Math.max(displayValue, 0), 100)

  return (
    <div
      className={cn("w-full space-y-2", className)}
      role="status"
      aria-label={label}
      aria-busy="true"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Text and percentage */}
      {(text || showPercentage) && (
        <div className="flex items-center justify-between">
          {text && (
            <p
              className={cn(
                "text-zinc-600 dark:text-zinc-400 font-medium",
                textSizeClasses[size]
              )}
            >
              {text}
            </p>
          )}
          {showPercentage && !indeterminate && (
            <span
              className={cn(
                "text-zinc-600 dark:text-zinc-400 font-mono font-medium tabular-nums",
                textSizeClasses[size]
              )}
            >
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className={cn("relative overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800", sizeClasses[size])}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            variantClasses[variant],
            indeterminate && "animate-pulse"
          )}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

/**
 * Hook to manage progress state with automatic updates
 *
 * @example
 * ```tsx
 * const { progress, updateProgress, resetProgress, setStatus } = useProgress();
 *
 * async function handleTask() {
 *   resetProgress();
 *   setStatus("Starting...");
 *
 *   for (let i = 0; i <= 100; i += 10) {
 *     await delay(100);
 *     updateProgress(i);
 *     if (i === 50) setStatus("Halfway there...");
 *   }
 *
 *   setStatus("Complete!");
 * }
 *
 * return <ProgressLoader value={progress} text={status} showPercentage />;
 * ```
 */
export function useProgress(initialValue = 0) {
  const [progress, setProgress] = React.useState(initialValue)
  const [status, setStatus] = React.useState<string>()

  const updateProgress = React.useCallback((value: number) => {
    setProgress(Math.min(Math.max(value, 0), 100))
  }, [])

  const incrementProgress = React.useCallback((increment: number = 1) => {
    setProgress((prev) => Math.min(prev + increment, 100))
  }, [])

  const resetProgress = React.useCallback(() => {
    setProgress(0)
    setStatus(undefined)
  }, [])

  return {
    progress,
    status,
    updateProgress,
    incrementProgress,
    resetProgress,
    setStatus,
  }
}
