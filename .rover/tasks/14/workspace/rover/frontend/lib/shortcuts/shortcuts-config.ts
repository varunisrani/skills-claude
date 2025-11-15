/**
 * Keyboard shortcuts configuration
 *
 * Defines all keyboard shortcuts available in the application
 * with their handlers and metadata for display in help modal
 */

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Display name shown in help modal */
  name: string;
  /** Description of what the shortcut does */
  description: string;
  /** Keys that trigger this shortcut */
  keys: string[];
  /** Category for grouping in help modal */
  category: 'navigation' | 'actions' | 'task-management' | 'ui' | 'general';
  /** Whether this shortcut is enabled */
  enabled?: boolean;
  /** Whether to show in help modal */
  showInHelp?: boolean;
}

/**
 * All keyboard shortcuts available in the application
 */
export const shortcuts: Record<string, KeyboardShortcut> = {
  // Navigation shortcuts
  COMMAND_PALETTE: {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open command palette / Quick search',
    keys: ['mod+k'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_1: {
    id: 'go-to-task-1',
    name: 'Go to Task 1',
    description: 'Navigate to first task in list',
    keys: ['1'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_2: {
    id: 'go-to-task-2',
    name: 'Go to Task 2',
    description: 'Navigate to second task in list',
    keys: ['2'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_3: {
    id: 'go-to-task-3',
    name: 'Go to Task 3',
    description: 'Navigate to third task in list',
    keys: ['3'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_4: {
    id: 'go-to-task-4',
    name: 'Go to Task 4',
    description: 'Navigate to fourth task in list',
    keys: ['4'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_5: {
    id: 'go-to-task-5',
    name: 'Go to Task 5',
    description: 'Navigate to fifth task in list',
    keys: ['5'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_6: {
    id: 'go-to-task-6',
    name: 'Go to Task 6',
    description: 'Navigate to sixth task in list',
    keys: ['6'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_7: {
    id: 'go-to-task-7',
    name: 'Go to Task 7',
    description: 'Navigate to seventh task in list',
    keys: ['7'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_8: {
    id: 'go-to-task-8',
    name: 'Go to Task 8',
    description: 'Navigate to eighth task in list',
    keys: ['8'],
    category: 'navigation',
    showInHelp: true,
  },
  GO_TO_TASK_9: {
    id: 'go-to-task-9',
    name: 'Go to Task 9',
    description: 'Navigate to ninth task in list',
    keys: ['9'],
    category: 'navigation',
    showInHelp: true,
  },
  NAVIGATE_UP: {
    id: 'navigate-up',
    name: 'Navigate Up',
    description: 'Move selection up in task list (vim-style)',
    keys: ['k'],
    category: 'navigation',
    showInHelp: true,
  },
  NAVIGATE_DOWN: {
    id: 'navigate-down',
    name: 'Navigate Down',
    description: 'Move selection down in task list (vim-style)',
    keys: ['j'],
    category: 'navigation',
    showInHelp: true,
  },
  OPEN_TASK: {
    id: 'open-task',
    name: 'Open Task',
    description: 'Open selected task details',
    keys: ['enter'],
    category: 'navigation',
    showInHelp: true,
  },

  // Actions shortcuts
  CREATE_TASK: {
    id: 'create-task',
    name: 'Create Task',
    description: 'Open new task creation dialog',
    keys: ['mod+n'],
    category: 'actions',
    showInHelp: true,
  },
  REFRESH_TASKS: {
    id: 'refresh-tasks',
    name: 'Refresh Tasks',
    description: 'Refresh task list',
    keys: ['mod+r'],
    category: 'actions',
    showInHelp: true,
  },
  SEARCH: {
    id: 'search',
    name: 'Search',
    description: 'Focus search input',
    keys: ['/'],
    category: 'actions',
    showInHelp: true,
  },

  // UI shortcuts
  TOGGLE_DARK_MODE: {
    id: 'toggle-dark-mode',
    name: 'Toggle Dark Mode',
    description: 'Switch between light and dark theme',
    keys: ['d'],
    category: 'ui',
    showInHelp: true,
  },
  OPEN_SETTINGS: {
    id: 'open-settings',
    name: 'Open Settings',
    description: 'Open settings dialog',
    keys: ['s'],
    category: 'ui',
    showInHelp: true,
  },
  SHOW_SHORTCUTS: {
    id: 'show-shortcuts',
    name: 'Show Shortcuts',
    description: 'Show keyboard shortcuts help',
    keys: ['mod+/'],
    category: 'general',
    showInHelp: true,
  },
  CLOSE_MODAL: {
    id: 'close-modal',
    name: 'Close Modal',
    description: 'Close current modal or dialog',
    keys: ['escape'],
    category: 'general',
    showInHelp: true,
  },
};

/**
 * Get shortcuts grouped by category
 */
export function getShortcutsByCategory() {
  const grouped: Record<string, KeyboardShortcut[]> = {
    navigation: [],
    actions: [],
    'task-management': [],
    ui: [],
    general: [],
  };

  Object.values(shortcuts).forEach((shortcut) => {
    if (shortcut.showInHelp !== false) {
      grouped[shortcut.category].push(shortcut);
    }
  });

  return grouped;
}

/**
 * Get display-friendly key name
 */
export function getKeyDisplay(key: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const keyMap: Record<string, string> = {
    mod: isMac ? '⌘' : 'Ctrl',
    shift: isMac ? '⇧' : 'Shift',
    alt: isMac ? '⌥' : 'Alt',
    enter: '↵',
    escape: 'Esc',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
  };

  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

/**
 * Parse shortcut keys into display format
 */
export function parseShortcutKeys(keys: string[]): string[][] {
  return keys.map((combo) => combo.split('+'));
}

/**
 * Get all keys for a shortcut as display strings
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  return shortcut.keys
    .map((combo) =>
      combo
        .split('+')
        .map((key) => getKeyDisplay(key))
        .join(' + ')
    )
    .join(' or ');
}

/**
 * Category display names
 */
export const categoryNames: Record<KeyboardShortcut['category'], string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  'task-management': 'Task Management',
  ui: 'UI Controls',
  general: 'General',
};
