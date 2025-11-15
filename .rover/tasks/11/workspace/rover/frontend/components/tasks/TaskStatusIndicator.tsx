/**
 * TaskStatusIndicator Component
 *
 * Displays live task status with animated colored dots and optional icons.
 * Provides visual feedback for task progress with:
 * - Pulsing animation for active states (IN_PROGRESS, ITERATING)
 * - Color-coded status dots
 * - Optional text labels
 * - Lucide-react icons for each status
 *
 * Status colors:
 * - NEW: gray
 * - IN_PROGRESS: blue (pulsing)
 * - ITERATING: purple (pulsing)
 * - COMPLETED: green
 * - FAILED: red
 * - MERGED: teal
 * - PUSHED: indigo
 */

"use client"

import * as React from "react"
import {
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  GitMerge,
  GitPullRequest,
  Sparkles,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { TaskStatus } from "@/types/task"

export interface TaskStatusIndicatorProps {
  /** The task status to display */
  status: TaskStatus
  /** Whether to show the status text label */
  showLabel?: boolean
  /** Whether to show the icon instead of just a dot */
  showIcon?: boolean
  /** Size of the indicator */
  size?: "sm" | "md" | "lg"
  /** Additional CSS classes */
  className?: string
}

/**
 * Status configuration defining colors, icons, and animations
 */
interface StatusConfig {
  color: string
  bgColor: string
  icon: LucideIcon
  label: string
  animate: boolean
  pulseColor: string
}

/**
 * Get the status configuration for a given task status
 */
function getStatusConfig(status: TaskStatus): StatusConfig {
  switch (status) {
    case "NEW":
      return {
        color: "text-gray-500",
        bgColor: "bg-gray-500",
        icon: Circle,
        label: "New",
        animate: false,
        pulseColor: "bg-gray-400"
      }
    case "IN_PROGRESS":
      return {
        color: "text-blue-500",
        bgColor: "bg-blue-500",
        icon: Loader2,
        label: "In Progress",
        animate: true,
        pulseColor: "bg-blue-400"
      }
    case "ITERATING":
      return {
        color: "text-purple-500",
        bgColor: "bg-purple-500",
        icon: Sparkles,
        label: "Iterating",
        animate: true,
        pulseColor: "bg-purple-400"
      }
    case "COMPLETED":
      return {
        color: "text-green-500",
        bgColor: "bg-green-500",
        icon: CheckCircle2,
        label: "Completed",
        animate: false,
        pulseColor: "bg-green-400"
      }
    case "FAILED":
      return {
        color: "text-red-500",
        bgColor: "bg-red-500",
        icon: XCircle,
        label: "Failed",
        animate: false,
        pulseColor: "bg-red-400"
      }
    case "MERGED":
      return {
        color: "text-teal-500",
        bgColor: "bg-teal-500",
        icon: GitMerge,
        label: "Merged",
        animate: false,
        pulseColor: "bg-teal-400"
      }
    case "PUSHED":
      return {
        color: "text-indigo-500",
        bgColor: "bg-indigo-500",
        icon: GitPullRequest,
        label: "Pushed",
        animate: false,
        pulseColor: "bg-indigo-400"
      }
    default:
      return {
        color: "text-gray-500",
        bgColor: "bg-gray-500",
        icon: Circle,
        label: status,
        animate: false,
        pulseColor: "bg-gray-400"
      }
  }
}

/**
 * Get size classes for the indicator
 */
function getSizeClasses(size: "sm" | "md" | "lg") {
  switch (size) {
    case "sm":
      return {
        dot: "h-2 w-2",
        icon: "h-3 w-3",
        text: "text-xs",
        gap: "gap-1.5"
      }
    case "md":
      return {
        dot: "h-3 w-3",
        icon: "h-4 w-4",
        text: "text-sm",
        gap: "gap-2"
      }
    case "lg":
      return {
        dot: "h-4 w-4",
        icon: "h-5 w-5",
        text: "text-base",
        gap: "gap-2.5"
      }
  }
}

export function TaskStatusIndicator({
  status,
  showLabel = false,
  showIcon = false,
  size = "md",
  className
}: TaskStatusIndicatorProps) {
  const config = getStatusConfig(status)
  const sizeClasses = getSizeClasses(size)
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex items-center",
        sizeClasses.gap,
        className
      )}
      role="status"
      aria-label={`Task status: ${config.label}`}
    >
      {/* Status indicator - either icon or pulsing dot */}
      <div className="relative flex items-center justify-center">
        {showIcon ? (
          <Icon
            className={cn(
              sizeClasses.icon,
              config.color,
              status === "IN_PROGRESS" && "animate-spin",
              status === "ITERATING" && "animate-pulse"
            )}
            aria-hidden="true"
          />
        ) : (
          <>
            {/* Pulsing ring animation for active states */}
            {config.animate && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                  config.pulseColor
                )}
                aria-hidden="true"
              />
            )}
            {/* Status dot */}
            <span
              className={cn(
                "relative inline-flex rounded-full",
                sizeClasses.dot,
                config.bgColor,
                config.animate && "animate-pulse"
              )}
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {/* Optional text label */}
      {showLabel && (
        <span
          className={cn(
            "font-medium",
            sizeClasses.text,
            config.color
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  )
}
