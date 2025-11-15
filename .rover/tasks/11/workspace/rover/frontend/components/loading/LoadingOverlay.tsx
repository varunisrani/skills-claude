/**
 * LoadingOverlay Component
 *
 * A full-page or container overlay that displays a loading spinner.
 * Can be used for blocking operations or full-page loads.
 *
 * Features:
 * - Full-page or container-relative positioning
 * - Semi-transparent backdrop
 * - Customizable spinner and text
 * - Accessible with proper ARIA attributes
 * - Prevents interaction with underlying content
 * - Portal support for full-page overlays
 */

"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { LoadingSpinner } from "./LoadingSpinner"
import { cn } from "@/lib/utils"

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean
  /** Loading text to display */
  text?: string
  /** Whether to render as full-page overlay (uses portal) */
  fullPage?: boolean
  /** Custom className for the overlay */
  className?: string
  /** Custom className for the backdrop */
  backdropClassName?: string
  /** Spinner size */
  spinnerSize?: "sm" | "md" | "lg" | "xl"
  /** Whether to blur the background */
  blur?: boolean
  /** Accessible label */
  label?: string
}

function OverlayContent({
  text,
  className,
  backdropClassName,
  spinnerSize = "lg",
  blur = true,
  label = "Loading",
}: Omit<LoadingOverlayProps, "visible" | "fullPage">) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center",
        blur && "backdrop-blur-sm",
        backdropClassName
      )}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-busy="true"
    >
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-zinc-900/20 dark:bg-zinc-950/40" />

      {/* Loading content */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center justify-center gap-4 p-8",
          "bg-white dark:bg-zinc-900 rounded-lg shadow-lg",
          "border border-zinc-200 dark:border-zinc-800",
          className
        )}
      >
        <LoadingSpinner size={spinnerSize} text={text} label={label} />
      </div>
    </div>
  )
}

export function LoadingOverlay({
  visible,
  text,
  fullPage = false,
  className,
  backdropClassName,
  spinnerSize = "lg",
  blur = true,
  label = "Loading",
}: LoadingOverlayProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!visible) {
    return null
  }

  const overlay = (
    <OverlayContent
      text={text}
      className={className}
      backdropClassName={cn(
        fullPage && "fixed",
        backdropClassName
      )}
      spinnerSize={spinnerSize}
      blur={blur}
      label={label}
    />
  )

  // Use portal for full-page overlays
  if (fullPage && mounted && typeof document !== "undefined") {
    return createPortal(overlay, document.body)
  }

  // Otherwise render relative to container
  return overlay
}

/**
 * Hook to manage loading overlay state
 *
 * @example
 * ```tsx
 * const { showLoading, hideLoading, isLoading } = useLoadingOverlay();
 *
 * async function handleAction() {
 *   showLoading("Processing...");
 *   try {
 *     await doSomething();
 *   } finally {
 *     hideLoading();
 *   }
 * }
 *
 * return (
 *   <div>
 *     <LoadingOverlay visible={isLoading} text={loadingText} />
 *     <button onClick={handleAction}>Do Something</button>
 *   </div>
 * );
 * ```
 */
export function useLoadingOverlay() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState<string>()

  const showLoading = React.useCallback((text?: string) => {
    setLoadingText(text)
    setIsLoading(true)
  }, [])

  const hideLoading = React.useCallback(() => {
    setIsLoading(false)
    setLoadingText(undefined)
  }, [])

  return {
    isLoading,
    loadingText,
    showLoading,
    hideLoading,
  }
}
