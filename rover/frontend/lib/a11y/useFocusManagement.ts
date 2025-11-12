/**
 * useFocusManagement Hook
 *
 * Utilities for managing focus in accessible UI components.
 * Provides helpers for focus restoration, focus detection, and focus announcements.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const { saveFocus, restoreFocus, isFocusWithin } = useFocusManagement();
 *
 *   const handleOpen = () => {
 *     saveFocus();
 *     // Open modal
 *   };
 *
 *   const handleClose = () => {
 *     restoreFocus();
 *     // Close modal
 *   };
 * }
 * ```
 */

import { useRef, useCallback, useState, useEffect } from 'react';

export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isFocusWithin, setIsFocusWithin] = useState(false);

  /**
   * Save the currently focused element for later restoration
   */
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  /**
   * Restore focus to the previously saved element
   */
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  /**
   * Focus the first focusable element within a container
   */
  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex^="-"])'
    );

    const firstElement = Array.from(focusableElements).find(
      (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
    );

    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  /**
   * Focus a specific element by selector within a container
   */
  const focusElement = useCallback((
    container: HTMLElement,
    selector: string
  ) => {
    const element = container.querySelector<HTMLElement>(selector);
    if (element) {
      element.focus();
    }
  }, []);

  /**
   * Create event handlers for focus within detection
   */
  const getFocusWithinHandlers = useCallback(() => {
    return {
      onFocus: () => setIsFocusWithin(true),
      onBlur: (e: React.FocusEvent) => {
        // Only set to false if focus is leaving the component entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocusWithin(false);
        }
      },
    };
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusElement,
    isFocusWithin,
    getFocusWithinHandlers,
  };
}

/**
 * useAriaLive Hook
 *
 * Manages ARIA live regions for announcing dynamic content to screen readers.
 *
 * @example
 * ```tsx
 * function TaskStatus() {
 *   const { announce, LiveRegion } = useAriaLive();
 *
 *   useEffect(() => {
 *     announce('Task completed successfully', 'polite');
 *   }, [task.status]);
 *
 *   return (
 *     <>
 *       <div>Status: {task.status}</div>
 *       <LiveRegion />
 *     </>
 *   );
 * }
 * ```
 */
export function useAriaLive() {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((
    newMessage: string,
    level: 'polite' | 'assertive' = 'polite'
  ) => {
    setMessage('');
    setPoliteness(level);

    // Clear and set message to trigger screen reader announcement
    setTimeout(() => {
      setMessage(newMessage);
    }, 100);
  }, []);

  /**
   * Clear the current announcement
   */
  const clear = useCallback(() => {
    setMessage('');
  }, []);

  /**
   * Live region component to render
   */
  const LiveRegion = useCallback(() => (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  ), [message, politeness]);

  return {
    announce,
    clear,
    LiveRegion,
  };
}

/**
 * useKeyboardNavigation Hook
 *
 * Provides utilities for keyboard navigation patterns (arrow keys, etc.)
 *
 * @example
 * ```tsx
 * function List() {
 *   const { handleKeyDown } = useKeyboardNavigation({
 *     onArrowDown: () => selectNext(),
 *     onArrowUp: () => selectPrevious(),
 *     onEnter: () => activateSelected(),
 *   });
 *
 *   return <div onKeyDown={handleKeyDown}>...</div>;
 * }
 * ```
 */
export function useKeyboardNavigation(handlers: {
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}) {
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const { key } = event;

    const keyMap: Record<string, () => void> = {
      'ArrowDown': handlers.onArrowDown || (() => {}),
      'ArrowUp': handlers.onArrowUp || (() => {}),
      'ArrowLeft': handlers.onArrowLeft || (() => {}),
      'ArrowRight': handlers.onArrowRight || (() => {}),
      'Enter': handlers.onEnter || (() => {}),
      'Escape': handlers.onEscape || (() => {}),
      'Home': handlers.onHome || (() => {}),
      'End': handlers.onEnd || (() => {}),
    };

    const handler = keyMap[key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  }, [handlers]);

  return { handleKeyDown };
}
