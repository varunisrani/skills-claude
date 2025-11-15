/**
 * SkipToContent Component
 *
 * Provides a "Skip to main content" link for keyboard users.
 * The link is visually hidden until focused, allowing keyboard users to bypass
 * repetitive navigation and jump directly to the main content.
 *
 * WCAG 2.1 Success Criterion 2.4.1 - Bypass Blocks (Level A)
 *
 * @example
 * ```tsx
 * function Layout() {
 *   return (
 *     <>
 *       <SkipToContent targetId="main-content" />
 *       <nav>...</nav>
 *       <main id="main-content">...</main>
 *     </>
 *   );
 * }
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SkipToContentProps {
  /** ID of the main content element to skip to */
  targetId?: string;
  /** Custom text for the skip link */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

export function SkipToContent({
  targetId = 'main-content',
  text = 'Skip to main content',
  className,
}: SkipToContentProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);

    if (target) {
      // Focus the target element
      target.focus();

      // If the target is not naturally focusable, make it focusable temporarily
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => {
          target.removeAttribute('tabindex');
        }, { once: true });
      }

      // Scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only',
        // Positioning and styling when visible
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:bg-zinc-900 focus:text-zinc-50',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:text-sm focus:font-medium',
        'focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
        'dark:focus:bg-zinc-50 dark:focus:text-zinc-900',
        'dark:focus:ring-zinc-300',
        // Smooth transition
        'transition-all duration-200',
        className
      )}
    >
      {text}
    </a>
  );
}

/**
 * SkipLink Component
 *
 * Generic skip link component for skipping to any section
 *
 * @example
 * ```tsx
 * <SkipLink targetId="search-results" text="Skip to search results" />
 * ```
 */
export function SkipLink({
  targetId,
  text,
  className,
}: {
  targetId: string;
  text: string;
  className?: string;
}) {
  return (
    <SkipToContent
      targetId={targetId}
      text={text}
      className={className}
    />
  );
}
