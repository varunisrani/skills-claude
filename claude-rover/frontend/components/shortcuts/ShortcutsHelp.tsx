/**
 * Shortcuts Help Modal
 *
 * Displays all available keyboard shortcuts grouped by category
 * Opened with Cmd/Ctrl + /
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ShortcutBadge } from './ShortcutBadge';
import { getShortcutsByCategory, categoryNames, type KeyboardShortcut } from '@/lib/shortcuts/shortcuts-config';
import { Keyboard } from 'lucide-react';

interface ShortcutsHelpProps {
  /** Whether the help modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Modal that displays all keyboard shortcuts grouped by category
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * <ShortcutsHelp open={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 */
export function ShortcutsHelp({ open, onClose }: ShortcutsHelpProps) {
  const shortcutsByCategory = getShortcutsByCategory();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Keyboard className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Quick access to common actions and navigation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => {
            if (shortcuts.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 uppercase tracking-wide">
                  {categoryNames[category as KeyboardShortcut['category']]}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {shortcut.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {shortcut.description}
                        </div>
                      </div>
                      <ShortcutBadge shortcut={shortcut} size="md" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">Esc</kbd> or{' '}
            <ShortcutBadge keys={['mod+/']} size="sm" className="inline-flex" /> to close this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
