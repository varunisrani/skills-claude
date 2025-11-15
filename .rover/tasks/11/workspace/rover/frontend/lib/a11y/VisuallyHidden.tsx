/**
 * VisuallyHidden Component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Uses the .sr-only class pattern (screen reader only).
 *
 * Use this for:
 * - Descriptive text for icon-only buttons
 * - Additional context for screen reader users
 * - Form labels when visual labels aren't desired
 * - Skip links (use SkipToContent instead)
 *
 * @example
 * ```tsx
 * <button>
 *   <TrashIcon />
 *   <VisuallyHidden>Delete task</VisuallyHidden>
 * </button>
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The content to hide visually */
  children: React.ReactNode;
  /** The HTML element to render */
  as?: 'span' | 'div' | 'p';
  /** Whether to make the element focusable (for skip links) */
  focusable?: boolean;
}

/**
 * Hides content visually while keeping it accessible to screen readers
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
  focusable = false,
  className,
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        // Standard sr-only pattern
        'sr-only',
        // Make focusable if needed (for skip links)
        focusable && 'focus:not-sr-only',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Utility component for screen reader only text
 * Alias for VisuallyHidden with more semantic naming
 */
export const ScreenReaderOnly = VisuallyHidden;

/**
 * Hook to determine if content should be visually hidden
 * Useful for responsive designs where content visibility changes
 */
export function useVisuallyHidden(condition: boolean) {
  return condition ? 'sr-only' : '';
}
