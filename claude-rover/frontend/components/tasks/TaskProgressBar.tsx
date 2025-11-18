/**
 * TaskProgressBar Component
 *
 * Displays task progress with color-coded status and animations.
 * Features:
 * - Determinate progress bar when percentage is known
 * - Indeterminate animation for active tasks with unknown progress
 * - Color-coded based on task status
 * - Optional percentage display
 * - Uses shadcn/ui Progress component
 *
 * Status colors:
 * - IN_PROGRESS: blue
 * - ITERATING: purple
 * - COMPLETED/MERGED/PUSHED: green
 * - FAILED: red
 * - NEW: gray
 */

"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils/cn"
import type { TaskStatus } from "@/types/task"

export interface TaskProgressBarProps {
  /** The task status (determines color) */
  status: TaskStatus
  /** Progress percentage (0-100). If undefined, shows indeterminate animation */
  value?: number
  /** Whether to show the percentage text */
  showPercentage?: boolean
  /** Whether to show the status label */
  showLabel?: boolean
  /** Custom label text (overrides default status-based label) */
  label?: string
  /** Size of the progress bar */
  size?: "sm" | "md" | "lg"
  /** Additional CSS classes */
  className?: string
}

/**
 * Get color classes for the progress bar based on status
 */
function getProgressColor(status: TaskStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-blue-500 dark:bg-blue-600"
    case "ITERATING":
      return "bg-purple-500 dark:bg-purple-600"
    case "COMPLETED":
    case "MERGED":
    case "PUSHED":
      return "bg-green-500 dark:bg-green-600"
    case "FAILED":
      return "bg-red-500 dark:bg-red-600"
    case "NEW":
    default:
      return "bg-gray-500 dark:bg-gray-600"
  }
}

/**
 * Get background color for the progress track
 */
function getTrackColor(status: TaskStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "bg-blue-100 dark:bg-blue-950"
    case "ITERATING":
      return "bg-purple-100 dark:bg-purple-950"
    case "COMPLETED":
    case "MERGED":
    case "PUSHED":
      return "bg-green-100 dark:bg-green-950"
    case "FAILED":
      return "bg-red-100 dark:bg-red-950"
    case "NEW":
    default:
      return "bg-gray-100 dark:bg-gray-900"
  }
}

/**
 * Get height classes based on size
 */
function getHeightClass(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return "h-1"
    case "md":
      return "h-2"
    case "lg":
      return "h-3"
  }
}

/**
 * Get default label for status
 */
function getDefaultLabel(status: TaskStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress"
    case "ITERATING":
      return "Iterating"
    case "COMPLETED":
      return "Completed"
    case "FAILED":
      return "Failed"
    case "MERGED":
      return "Merged"
    case "PUSHED":
      return "Pushed"
    case "NEW":
      return "Pending"
    default:
      return status
  }
}

export function TaskProgressBar({
  status,
  value,
  showPercentage = false,
  showLabel = false,
  label,
  size = "md",
  className
}: TaskProgressBarProps) {
  const progressColor = getProgressColor(status)
  const trackColor = getTrackColor(status)
  const heightClass = getHeightClass(size)
  const displayLabel = label || getDefaultLabel(status)
  const isIndeterminate = value === undefined
  const isActive = status === "IN_PROGRESS" || status === "ITERATING"

  // For indeterminate state, we'll use a custom animated div
  // For determinate state, we'll use the Progress component

  return (
    <div className={cn("space-y-1", className)}>
      {/* Label and percentage row */}
      {(showLabel || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {showLabel && <span id={`progress-label-${displayLabel}`}>{displayLabel}</span>}
          {showPercentage && !isIndeterminate && <span aria-live="polite">{value}%</span>}
        </div>
      )}

      {/* Progress bar */}
      <div className="relative w-full overflow-hidden rounded-full">
        {isIndeterminate && isActive ? (
          /* Indeterminate animation for active tasks without known progress */
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-full",
              heightClass,
              trackColor
            )}
            role="progressbar"
            aria-label={displayLabel}
            aria-busy="true"
            aria-valuetext="In progress"
          >
            <div
              className={cn(
                "absolute h-full w-1/3 rounded-full animate-indeterminate",
                progressColor
              )}
              style={{
                animation: "indeterminate 1.5s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite"
              }}
            />
            <style jsx>{`
              @keyframes indeterminate {
                0% {
                  left: -35%;
                }
                100% {
                  left: 100%;
                }
              }
              .animate-indeterminate {
                animation: indeterminate 1.5s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
              }
            `}</style>
          </div>
        ) : (
          /* Determinate progress bar */
          <Progress
            value={value || 0}
            className={cn(
              heightClass,
              trackColor,
              "transition-all duration-300"
            )}
            indicatorClassName={cn(progressColor, "transition-all duration-300")}
            aria-label={displayLabel}
            aria-valuetext={`${value || 0}% complete`}
          />
        )}
      </div>
    </div>
  )
}
