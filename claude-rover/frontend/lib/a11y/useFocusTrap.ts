/**
 * useFocusTrap Hook
 *
 * Traps keyboard focus within a container element, typically used for modals/dialogs.
 * Ensures that Tab and Shift+Tab only cycle through focusable elements within the container.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
 *
 *   return (
 *     <div ref={trapRef} role="dialog">
 *       <button>First focusable</button>
 *       <input type="text" />
 *       <button>Last focusable</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])',
];

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    FOCUSABLE_ELEMENTS.join(',')
  );
  return Array.from(elements).filter(
    (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1
  );
}

/**
 * Focus trap hook for modal dialogs and other focus-containing components
 *
 * @param isActive - Whether the focus trap should be active
 * @param options - Configuration options
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean = true,
  options: {
    /** Focus the first element when trap activates */
    autoFocus?: boolean;
    /** Restore focus to the previously focused element when trap deactivates */
    restoreFocus?: boolean;
    /** Initial element to focus (overrides autoFocus) */
    initialFocus?: HTMLElement | null;
  } = {}
) {
  const { autoFocus = true, restoreFocus = true, initialFocus } = options;
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Focus initial element or first focusable element
    if (initialFocus) {
      initialFocus.focus();
    } else if (autoFocus) {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    // Handle Tab key navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(container);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift + Tab: If on first element, move to last
      if (event.shiftKey) {
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab: If on last element, move to first
      else {
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, autoFocus, restoreFocus, initialFocus]);

  return containerRef;
}
