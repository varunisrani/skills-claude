/**
 * LoadingCard Component
 *
 * A skeleton card loader that mimics the TaskCard structure.
 * Uses shadcn/ui Skeleton component for animated loading placeholders.
 *
 * Features:
 * - Matches TaskCard layout
 * - Animated pulse effect
 * - Multiple variants (default, compact, detailed)
 * - Accessible with aria-busy
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface LoadingCardProps {
  /** Card variant matching different layouts */
  variant?: "default" | "compact" | "detailed"
  /** Custom className for the card */
  className?: string
  /** Number of cards to render (for arrays) */
  count?: number
}

function SingleLoadingCard({ variant = "default", className }: Omit<LoadingCardProps, "count">) {
  return (
    <Card className={cn("animate-pulse", className)} role="status" aria-busy="true" aria-label="Loading task">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-3">
            {/* Status badge and agent info */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />
          </div>
          {/* Actions menu */}
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        {/* Description (only in default and detailed variants) */}
        {variant !== "compact" && (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress bar (only in detailed variant) */}
        {variant === "detailed" && <Skeleton className="h-2 w-full" />}

        {/* Metadata row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Workflow (only in default and detailed variants) */}
        {variant !== "compact" && (
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LoadingCard({ variant = "default", className, count = 1 }: LoadingCardProps) {
  if (count === 1) {
    return <SingleLoadingCard variant={variant} className={className} />
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleLoadingCard key={i} variant={variant} className={className} />
      ))}
    </>
  )
}
