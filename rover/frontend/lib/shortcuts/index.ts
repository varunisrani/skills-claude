/**
 * Keyboard shortcuts module exports
 */

export { useKeyboardShortcuts, useKeyboardShortcut } from './useKeyboardShortcuts';
export { ShortcutsProvider, useShortcuts } from './ShortcutsProvider';
export { AppShortcutsProvider } from './AppShortcutsProvider';
export {
  shortcuts,
  getShortcutsByCategory,
  getKeyDisplay,
  parseShortcutKeys,
  getShortcutDisplay,
  categoryNames,
  type KeyboardShortcut,
} from './shortcuts-config';
