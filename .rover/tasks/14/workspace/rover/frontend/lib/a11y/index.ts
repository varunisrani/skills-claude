/**
 * Accessibility utilities and hooks
 *
 * This module provides comprehensive accessibility tools following WCAG 2.1 guidelines:
 * - Focus management and trapping
 * - Screen reader announcements
 * - Skip links and navigation aids
 * - Visually hidden content
 * - Keyboard navigation patterns
 */

export { useFocusTrap } from './useFocusTrap';
export {
  useFocusManagement,
  useAriaLive,
  useKeyboardNavigation,
} from './useFocusManagement';
export { SkipToContent, SkipLink } from './SkipToContent';
export {
  VisuallyHidden,
  ScreenReaderOnly,
  useVisuallyHidden,
} from './VisuallyHidden';
