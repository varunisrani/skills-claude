/**
 * Settings Type Definitions
 *
 * Types for the Rover frontend settings and preferences
 */

/**
 * Theme mode options
 */
export type ThemeMode = "light" | "dark" | "system"

/**
 * Terminal theme options for xterm.js
 */
export type TerminalTheme = "default" | "dark" | "light" | "dracula" | "monokai"

/**
 * Auto-refresh interval in milliseconds
 */
export type RefreshInterval = 0 | 5000 | 10000 | 30000 | 60000

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  /** Enable browser notifications */
  enabled: boolean
  /** Notify on task completion */
  onTaskComplete: boolean
  /** Notify on task failure */
  onTaskFailure: boolean
  /** Notify on task status change */
  onTaskStatusChange: boolean
}

/**
 * User interface preferences
 */
export interface UIPreferences {
  /** Theme mode (light, dark, or system) */
  theme: ThemeMode
  /** Auto-refresh interval for task list (0 = disabled) */
  refreshInterval: RefreshInterval
  /** Terminal theme for xterm.js */
  terminalTheme: TerminalTheme
  /** Show line numbers in diff viewer */
  showDiffLineNumbers: boolean
  /** Compact task list view */
  compactTaskList: boolean
}

/**
 * Rover API and workflow preferences
 */
export interface RoverPreferences {
  /** Default workflow to use for new tasks */
  defaultWorkflow: string
  /** Default AI agent to use for new tasks */
  defaultAgent: "claude" | "gemini"
  /** Enable auto-merge for completed tasks */
  autoMerge: boolean
  /** Enable auto-push after merge */
  autoPush: boolean
}

/**
 * Complete user settings
 */
export interface UserSettings {
  /** UI preferences */
  ui: UIPreferences
  /** Rover-specific preferences */
  rover: RoverPreferences
  /** Notification preferences */
  notifications: NotificationPreferences
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: UserSettings = {
  ui: {
    theme: "system",
    refreshInterval: 10000,
    terminalTheme: "default",
    showDiffLineNumbers: true,
    compactTaskList: false,
  },
  rover: {
    defaultWorkflow: "swe",
    defaultAgent: "claude",
    autoMerge: false,
    autoPush: false,
  },
  notifications: {
    enabled: false,
    onTaskComplete: true,
    onTaskFailure: true,
    onTaskStatusChange: false,
  },
}

/**
 * Settings storage key
 */
export const SETTINGS_STORAGE_KEY = "rover-user-settings"

/**
 * Helper to load settings from localStorage
 */
export function loadSettings(): UserSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS
  }

  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) {
      return DEFAULT_SETTINGS
    }

    const parsed = JSON.parse(stored)
    // Merge with defaults to handle missing keys
    return {
      ui: { ...DEFAULT_SETTINGS.ui, ...parsed.ui },
      rover: { ...DEFAULT_SETTINGS.rover, ...parsed.rover },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
    }
  } catch (error) {
    console.error("Failed to load settings:", error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Helper to save settings to localStorage
 */
export function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error("Failed to save settings:", error)
  }
}
