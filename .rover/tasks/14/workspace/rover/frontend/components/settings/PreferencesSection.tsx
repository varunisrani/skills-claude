/**
 * Preferences section component
 *
 * UI preferences including refresh interval, terminal theme, and display options
 */

"use client"

import * as React from "react"
import { RefreshCw, Terminal, Eye } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UIPreferences, RefreshInterval, TerminalTheme } from "@/types/settings"

interface PreferencesSectionProps {
  preferences: UIPreferences
  onChange: (preferences: UIPreferences) => void
}

const REFRESH_INTERVALS: { value: RefreshInterval; label: string }[] = [
  { value: 0, label: "Disabled" },
  { value: 5000, label: "5 seconds" },
  { value: 10000, label: "10 seconds" },
  { value: 30000, label: "30 seconds" },
  { value: 60000, label: "1 minute" },
]

const TERMINAL_THEMES: { value: TerminalTheme; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "dracula", label: "Dracula" },
  { value: "monokai", label: "Monokai" },
]

export function PreferencesSection({ preferences, onChange }: PreferencesSectionProps) {
  const handleRefreshIntervalChange = (value: string) => {
    onChange({ ...preferences, refreshInterval: parseInt(value) as RefreshInterval })
  }

  const handleTerminalThemeChange = (value: string) => {
    onChange({ ...preferences, terminalTheme: value as TerminalTheme })
  }

  const handleDiffLineNumbersChange = (checked: boolean) => {
    onChange({ ...preferences, showDiffLineNumbers: checked })
  }

  const handleCompactTaskListChange = (checked: boolean) => {
    onChange({ ...preferences, compactTaskList: checked })
  }

  return (
    <div className="space-y-6">
      {/* Auto-refresh interval */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="refresh-interval" className="text-base">
              Auto-refresh interval
            </Label>
            <p className="text-sm text-muted-foreground">
              How often to automatically refresh the task list
            </p>
          </div>
        </div>
        <Select
          value={preferences.refreshInterval.toString()}
          onValueChange={handleRefreshIntervalChange}
        >
          <SelectTrigger id="refresh-interval" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REFRESH_INTERVALS.map((interval) => (
              <SelectItem key={interval.value} value={interval.value.toString()}>
                {interval.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Terminal theme */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Terminal className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="terminal-theme" className="text-base">
              Terminal theme
            </Label>
            <p className="text-sm text-muted-foreground">
              Color scheme for the terminal emulator
            </p>
          </div>
        </div>
        <Select value={preferences.terminalTheme} onValueChange={handleTerminalThemeChange}>
          <SelectTrigger id="terminal-theme" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TERMINAL_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Display options */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label className="text-base">Display options</Label>
            <p className="text-sm text-muted-foreground">
              Customize how content is displayed
            </p>
          </div>
        </div>

        <div className="ml-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-diff-line-numbers">Show diff line numbers</Label>
              <p className="text-sm text-muted-foreground">
                Display line numbers in the diff viewer
              </p>
            </div>
            <Switch
              id="show-diff-line-numbers"
              checked={preferences.showDiffLineNumbers}
              onCheckedChange={handleDiffLineNumbersChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-task-list">Compact task list</Label>
              <p className="text-sm text-muted-foreground">
                Use a more compact view for the task list
              </p>
            </div>
            <Switch
              id="compact-task-list"
              checked={preferences.compactTaskList}
              onCheckedChange={handleCompactTaskListChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
