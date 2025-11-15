/**
 * Shortcuts Provider
 *
 * Provides global keyboard shortcut handlers and state management
 * for the entire application
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { shortcuts } from './shortcuts-config';

interface ShortcutsContextValue {
  /** Whether shortcuts help modal is open */
  isHelpOpen: boolean;
  /** Open shortcuts help modal */
  openHelp: () => void;
  /** Close shortcuts help modal */
  closeHelp: () => void;
  /** Toggle shortcuts help modal */
  toggleHelp: () => void;
  /** Whether command palette is open */
  isCommandPaletteOpen: boolean;
  /** Open command palette */
  openCommandPalette: () => void;
  /** Close command palette */
  closeCommandPalette: () => void;
  /** Toggle command palette */
  toggleCommandPalette: () => void;
  /** Currently selected task index (for keyboard navigation) */
  selectedTaskIndex: number;
  /** Set selected task index */
  setSelectedTaskIndex: (index: number) => void;
  /** Navigate to next task */
  selectNextTask: () => void;
  /** Navigate to previous task */
  selectPreviousTask: () => void;
  /** Open selected task */
  openSelectedTask: () => void;
  /** Total number of tasks (for navigation bounds) */
  totalTasks: number;
  /** Set total number of tasks */
  setTotalTasks: (count: number) => void;
  /** Currently visible task IDs (for direct navigation) */
  visibleTaskIds: number[];
  /** Set visible task IDs */
  setVisibleTaskIds: (ids: number[]) => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | undefined>(undefined);

interface ShortcutsProviderProps {
  children: React.ReactNode;
  /** Callback for creating a new task */
  onCreateTask?: () => void;
  /** Callback for refreshing tasks */
  onRefreshTasks?: () => void;
  /** Callback for toggling dark mode */
  onToggleDarkMode?: () => void;
  /** Callback for opening settings */
  onOpenSettings?: () => void;
  /** Callback for focusing search */
  onFocusSearch?: () => void;
}

export function ShortcutsProvider({
  children,
  onCreateTask,
  onRefreshTasks,
  onToggleDarkMode,
  onOpenSettings,
  onFocusSearch,
}: ShortcutsProviderProps) {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [visibleTaskIds, setVisibleTaskIds] = useState<number[]>([]);

  // Help modal handlers
  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);

  // Command palette handlers
  const openCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsCommandPaletteOpen(false), []);
  const toggleCommandPalette = useCallback(() => setIsCommandPaletteOpen((prev) => !prev), []);

  // Task navigation handlers
  const selectNextTask = useCallback(() => {
    setSelectedTaskIndex((prev) => Math.min(prev + 1, totalTasks - 1));
  }, [totalTasks]);

  const selectPreviousTask = useCallback(() => {
    setSelectedTaskIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const openSelectedTask = useCallback(() => {
    if (visibleTaskIds[selectedTaskIndex]) {
      router.push(`/tasks/${visibleTaskIds[selectedTaskIndex]}`);
    }
  }, [selectedTaskIndex, visibleTaskIds, router]);

  // Register global keyboard shortcuts
  useKeyboardShortcuts([
    // Command palette
    {
      keys: shortcuts.COMMAND_PALETTE.keys,
      callback: toggleCommandPalette,
      preventDefault: true,
    },
    // Show shortcuts help
    {
      keys: shortcuts.SHOW_SHORTCUTS.keys,
      callback: toggleHelp,
      preventDefault: true,
    },
    // Close modals
    {
      keys: shortcuts.CLOSE_MODAL.keys,
      callback: () => {
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else if (isHelpOpen) {
          closeHelp();
        }
      },
      preventDefault: true,
      enabled: isCommandPaletteOpen || isHelpOpen,
    },
    // Create task
    {
      keys: shortcuts.CREATE_TASK.keys,
      callback: () => onCreateTask?.(),
      preventDefault: true,
      enabled: !!onCreateTask,
    },
    // Refresh tasks
    {
      keys: shortcuts.REFRESH_TASKS.keys,
      callback: () => onRefreshTasks?.(),
      preventDefault: true,
      enabled: !!onRefreshTasks,
    },
    // Search
    {
      keys: shortcuts.SEARCH.keys,
      callback: () => onFocusSearch?.(),
      preventDefault: true,
      enabled: !!onFocusSearch,
    },
    // Toggle dark mode
    {
      keys: shortcuts.TOGGLE_DARK_MODE.keys,
      callback: () => onToggleDarkMode?.(),
      preventDefault: true,
      enabled: !!onToggleDarkMode,
    },
    // Open settings
    {
      keys: shortcuts.OPEN_SETTINGS.keys,
      callback: () => onOpenSettings?.(),
      preventDefault: true,
      enabled: !!onOpenSettings,
    },
    // Navigate up (vim-style)
    {
      keys: shortcuts.NAVIGATE_UP.keys,
      callback: selectPreviousTask,
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    // Navigate down (vim-style)
    {
      keys: shortcuts.NAVIGATE_DOWN.keys,
      callback: selectNextTask,
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    // Open task
    {
      keys: shortcuts.OPEN_TASK.keys,
      callback: openSelectedTask,
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    // Direct task navigation (1-9)
    {
      keys: shortcuts.GO_TO_TASK_1.keys,
      callback: () => {
        if (visibleTaskIds[0]) {
          router.push(`/tasks/${visibleTaskIds[0]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_2.keys,
      callback: () => {
        if (visibleTaskIds[1]) {
          router.push(`/tasks/${visibleTaskIds[1]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_3.keys,
      callback: () => {
        if (visibleTaskIds[2]) {
          router.push(`/tasks/${visibleTaskIds[2]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_4.keys,
      callback: () => {
        if (visibleTaskIds[3]) {
          router.push(`/tasks/${visibleTaskIds[3]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_5.keys,
      callback: () => {
        if (visibleTaskIds[4]) {
          router.push(`/tasks/${visibleTaskIds[4]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_6.keys,
      callback: () => {
        if (visibleTaskIds[5]) {
          router.push(`/tasks/${visibleTaskIds[5]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_7.keys,
      callback: () => {
        if (visibleTaskIds[6]) {
          router.push(`/tasks/${visibleTaskIds[6]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_8.keys,
      callback: () => {
        if (visibleTaskIds[7]) {
          router.push(`/tasks/${visibleTaskIds[7]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
    {
      keys: shortcuts.GO_TO_TASK_9.keys,
      callback: () => {
        if (visibleTaskIds[8]) {
          router.push(`/tasks/${visibleTaskIds[8]}`);
        }
      },
      preventDefault: true,
      enabled: !isCommandPaletteOpen && !isHelpOpen,
    },
  ]);

  const value: ShortcutsContextValue = {
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
    selectedTaskIndex,
    setSelectedTaskIndex,
    selectNextTask,
    selectPreviousTask,
    openSelectedTask,
    totalTasks,
    setTotalTasks,
    visibleTaskIds,
    setVisibleTaskIds,
  };

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
}

/**
 * Hook to access shortcuts context
 */
export function useShortcuts() {
  const context = useContext(ShortcutsContext);

  if (context === undefined) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }

  return context;
}
