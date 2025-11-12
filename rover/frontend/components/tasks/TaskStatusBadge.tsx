/**
 * TaskStatusBadge Component
 *
 * Displays task status with color-coded badges and optional icons.
 * Status colors match the Rover implementation plan:
 * - NEW: gray
 * - IN_PROGRESS: blue (pulsing animation)
 * - ITERATING: purple (pulsing animation)
 * - COMPLETED: green
 * - FAILED: red
 * - MERGED: teal
 * - PUSHED: indigo
 */

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  GitMerge,
  GitPullRequest,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TaskStatus } from "@/types/task"

export interface TaskStatusBadgeProps {
  /** The task status to display */
  status: TaskStatus
  /** Whether to show an icon alongside the status text */
  showIcon?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Get the appropriate icon component for a task status
 */
function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case "NEW":
      return Circle
    case "IN_PROGRESS":
      return Loader2
    case "ITERATING":
      return Sparkles
    case "COMPLETED":
      return CheckCircle2
    case "FAILED":
      return XCircle
    case "MERGED":
      return GitMerge
    case "PUSHED":
      return GitPullRequest
    default:
      return Circle
  }
}

/**
 * Get color classes and animation for a task status
 */
function getStatusStyles(status: TaskStatus) {
  switch (status) {
    case "NEW":
      return {
        className: "bg-gray-500 text-white border-gray-500 dark:bg-gray-600 dark:border-gray-600",
        animate: false
      }
    case "IN_PROGRESS":
      return {
        className: "bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600",
        animate: true
      }
    case "ITERATING":
      return {
        className: "bg-purple-500 text-white border-purple-500 dark:bg-purple-600 dark:border-purple-600",
        animate: true
      }
    case "COMPLETED":
      return {
        className: "bg-green-500 text-white border-green-500 dark:bg-green-600 dark:border-green-600",
        animate: false
      }
    case "FAILED":
      return {
        className: "bg-red-500 text-white border-red-500 dark:bg-red-600 dark:border-red-600",
        animate: false
      }
    case "MERGED":
      return {
        className: "bg-teal-500 text-white border-teal-500 dark:bg-teal-600 dark:border-teal-600",
        animate: false
      }
    case "PUSHED":
      return {
        className: "bg-indigo-500 text-white border-indigo-500 dark:bg-indigo-600 dark:border-indigo-600",
        animate: false
      }
    default:
      return {
        className: "bg-gray-500 text-white border-gray-500",
        animate: false
      }
  }
}

/**
 * Format status text for display
 */
function formatStatus(status: TaskStatus): string {
  return status.replace(/_/g, " ")
}

export function TaskStatusBadge({
  status,
  showIcon = false,
  className
}: TaskStatusBadgeProps) {
  const { className: statusClassName, animate } = getStatusStyles(status)
  const Icon = getStatusIcon(status)

  return (
    <Badge
      className={cn(
        statusClassName,
        animate && "animate-pulse",
        "font-medium",
        className
      )}
      variant="outline"
    >
      {showIcon && (
        <Icon
          className={cn(
            "mr-1 h-3 w-3",
            status === "IN_PROGRESS" && "animate-spin"
          )}
          aria-hidden="true"
        />
      )}
      <span>{formatStatus(status)}</span>
    </Badge>
  )
}
