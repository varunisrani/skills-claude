/**
 * Keyboard shortcuts hook
 *
 * Main hook for registering and handling keyboard shortcuts
 * Features:
 * - Cross-platform support (Mac Cmd, Windows/Linux Ctrl)
 * - Ignores shortcuts when typing in inputs
 * - Handles modifier keys (Ctrl/Cmd, Shift, Alt)
 * - Prevents default browser shortcuts where needed
 */

'use client';

import { useEffect, useCallback } from 'react';

export interface ShortcutHandler {
  /** Keys that trigger this shortcut (e.g., ['mod+k', 'ctrl+k']) */
  keys: string[];
  /** Callback function when shortcut is triggered */
  callback: (event: KeyboardEvent) => void;
  /** Whether this shortcut is enabled */
  enabled?: boolean;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether to stop event propagation */
  stopPropagation?: boolean;
  /** Allow shortcut to work in input fields */
  allowInInput?: boolean;
}

/**
 * Check if user is currently typing in an input field
 */
function isTypingInInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  const isEditable = target.isContentEditable;
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';

  return isInput || isEditable;
}

/**
 * Normalize key for comparison
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    command: 'meta',
    cmd: 'meta',
    option: 'alt',
    return: 'enter',
    esc: 'escape',
    space: ' ',
    left: 'arrowleft',
    right: 'arrowright',
    up: 'arrowup',
    down: 'arrowdown',
  };

  const normalized = key.toLowerCase().trim();
  return keyMap[normalized] || normalized;
}

/**
 * Check if keyboard event matches a shortcut key combo
 */
function matchesShortcut(event: KeyboardEvent, shortcutKeys: string): boolean {
  const keys = shortcutKeys.toLowerCase().split('+').map((k) => k.trim());
  const eventKey = normalizeKey(event.key);

  // Check modifiers
  const needsMod = keys.includes('mod');
  const needsCtrl = keys.includes('ctrl');
  const needsShift = keys.includes('shift');
  const needsAlt = keys.includes('alt');
  const needsMeta = keys.includes('meta') || keys.includes('command');

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Handle 'mod' key (Cmd on Mac, Ctrl elsewhere)
  const hasRequiredMod = needsMod ? (isMac ? event.metaKey : event.ctrlKey) : true;
  const hasRequiredCtrl = needsCtrl ? event.ctrlKey : !event.ctrlKey;
  const hasRequiredShift = needsShift ? event.shiftKey : !event.shiftKey;
  const hasRequiredAlt = needsAlt ? event.altKey : !event.altKey;
  const hasRequiredMeta = needsMeta ? event.metaKey : !event.metaKey;

  // Get the actual key (not modifier)
  const mainKey = keys.find(
    (k) => !['mod', 'ctrl', 'shift', 'alt', 'meta', 'command', 'option'].includes(k)
  );

  if (!mainKey) {
    return false;
  }

  const normalizedMainKey = normalizeKey(mainKey);

  // Special handling for single character keys
  if (normalizedMainKey.length === 1 && eventKey.length === 1) {
    // For letter keys, compare case-insensitively
    if (normalizedMainKey.toLowerCase() !== eventKey.toLowerCase()) {
      return false;
    }
  } else if (normalizedMainKey !== eventKey) {
    return false;
  }

  // Check all modifiers match
  if (needsMod && !hasRequiredMod) return false;
  if (!needsMod && needsCtrl && !hasRequiredCtrl) return false;
  if (!needsMod && !needsCtrl && event.ctrlKey) return false;
  if (needsShift && !hasRequiredShift) return false;
  if (!needsShift && event.shiftKey && normalizedMainKey.length > 1) return false;
  if (needsAlt && !hasRequiredAlt) return false;
  if (!needsAlt && event.altKey) return false;
  if (needsMeta && !hasRequiredMeta) return false;
  if (!needsMeta && event.metaKey && !needsMod) return false;

  return true;
}

/**
 * Hook to register keyboard shortcuts
 *
 * @param handlers - Array of shortcut handlers to register
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     keys: ['mod+k'],
 *     callback: () => openCommandPalette(),
 *     preventDefault: true,
 *   },
 *   {
 *     keys: ['escape'],
 *     callback: () => closeModal(),
 *     enabled: isModalOpen,
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(handlers: ShortcutHandler[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if user is typing in an input
      const isTyping = isTypingInInput(event.target);

      for (const handler of handlers) {
        // Skip if handler is disabled
        if (handler.enabled === false) {
          continue;
        }

        // Skip if typing in input and shortcut doesn't allow it
        if (isTyping && !handler.allowInInput) {
          continue;
        }

        // Check if any of the keys match
        const matches = handler.keys.some((key) => matchesShortcut(event, key));

        if (matches) {
          if (handler.preventDefault) {
            event.preventDefault();
          }

          if (handler.stopPropagation) {
            event.stopPropagation();
          }

          handler.callback(event);
          break; // Only trigger first matching handler
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Hook to register a single keyboard shortcut
 *
 * @param keys - Shortcut keys
 * @param callback - Callback function
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * useKeyboardShortcut(['mod+k'], () => {
 *   openCommandPalette();
 * }, { preventDefault: true });
 * ```
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  options?: {
    enabled?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
    allowInInput?: boolean;
  }
) {
  useKeyboardShortcuts([
    {
      keys,
      callback,
      ...options,
    },
  ]);
}
