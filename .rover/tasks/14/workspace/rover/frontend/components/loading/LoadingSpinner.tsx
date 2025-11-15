/**
 * LoadingSpinner Component
 *
 * A reusable spinner component with customizable size and styling.
 * Uses lucide-react's Loader2 icon with animation.
 *
 * Features:
 * - Multiple sizes (sm, md, lg, xl)
 * - Optional text label
 * - Accessible with aria-label
 * - Customizable styling via className
 */

"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl"
  /** Optional text to display below spinner */
  text?: string
  /** Custom className for the spinner icon */
  className?: string
  /** Custom className for the container */
  containerClassName?: string
  /** Whether to show spinner inline or as a block */
  inline?: boolean
  /** Accessible label for screen readers */
  label?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
}

export function LoadingSpinner({
  size = "md",
  text,
  className,
  containerClassName,
  inline = false,
  label = "Loading",
}: LoadingSpinnerProps) {
  const spinnerElement = (
    <Loader2
      className={cn(
        "animate-spin text-zinc-500 dark:text-zinc-400",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  )

  if (inline && !text) {
    return (
      <span className={cn("inline-flex items-center", containerClassName)} role="status" aria-label={label}>
        {spinnerElement}
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        inline ? "inline-flex flex-row" : "w-full",
        containerClassName
      )}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      {spinnerElement}
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
      <span className="sr-only">{label}</span>
    </div>
  )
}
