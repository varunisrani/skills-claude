/**
 * Shortcut Badge Component
 *
 * Displays keyboard shortcut keys in a styled badge format
 * Automatically detects OS and shows appropriate modifier keys
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getKeyDisplay, parseShortcutKeys, type KeyboardShortcut } from '@/lib/shortcuts/shortcuts-config';

interface ShortcutBadgeProps {
  /** Shortcut configuration object */
  shortcut?: KeyboardShortcut;
  /** Or provide keys directly */
  keys?: string[];
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Component to display keyboard shortcut keys in a badge format
 *
 * @example
 * ```tsx
 * <ShortcutBadge keys={['mod+k']} />
 * <ShortcutBadge shortcut={shortcuts.COMMAND_PALETTE} />
 * ```
 */
export function ShortcutBadge({ shortcut, keys, className, size = 'md' }: ShortcutBadgeProps) {
  const shortcutKeys = shortcut?.keys || keys;

  if (!shortcutKeys || shortcutKeys.length === 0) {
    return null;
  }

  const parsedKeys = parseShortcutKeys(shortcutKeys);

  const sizeClasses = {
    sm: 'text-[10px] px-1 py-0.5 min-w-[18px]',
    md: 'text-xs px-1.5 py-0.5 min-w-[20px]',
    lg: 'text-sm px-2 py-1 min-w-[24px]',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {parsedKeys.map((combo, comboIndex) => (
        <React.Fragment key={comboIndex}>
          {comboIndex > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">or</span>
          )}
          <div className="flex items-center gap-0.5">
            {combo.map((key, keyIndex) => (
              <kbd
                key={keyIndex}
                className={cn(
                  'inline-flex items-center justify-center rounded border font-mono font-medium',
                  'bg-zinc-100 text-zinc-900 border-zinc-300',
                  'dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600',
                  sizeClasses[size]
                )}
              >
                {getKeyDisplay(key)}
              </kbd>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

interface ShortcutHintProps {
  /** Shortcut to display */
  shortcut: KeyboardShortcut;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Display shortcut with its name
 *
 * @example
 * ```tsx
 * <ShortcutHint shortcut={shortcuts.COMMAND_PALETTE} />
 * ```
 */
export function ShortcutHint({ shortcut, className }: ShortcutHintProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{shortcut.name}</span>
      <ShortcutBadge shortcut={shortcut} />
    </div>
  );
}
