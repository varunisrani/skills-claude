/**
 * Settings form component
 *
 * Main settings form that combines all settings sections
 */

"use client"

import * as React from "react"
import { Save, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "./ThemeToggle"
import { PreferencesSection } from "./PreferencesSection"
import { ApiConfigSection } from "./ApiConfigSection"
import { NotificationsSection } from "./NotificationsSection"
import {
  type UserSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "@/types/settings"

export function SettingsForm() {
  const [settings, setSettings] = React.useState<UserSettings>(DEFAULT_SETTINGS)
  const [hasChanges, setHasChanges] = React.useState(false)
  const { toast } = useToast()

  // Load settings on mount
  React.useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
  }, [])

  const handleUIPreferencesChange = (ui: UserSettings["ui"]) => {
    setSettings({ ...settings, ui })
    setHasChanges(true)
  }

  const handleRoverPreferencesChange = (rover: UserSettings["rover"]) => {
    setSettings({ ...settings, rover })
    setHasChanges(true)
  }

  const handleNotificationsChange = (notifications: UserSettings["notifications"]) => {
    setSettings({ ...settings, notifications })
    setHasChanges(true)
  }

  const handleSave = () => {
    saveSettings(settings)
    setHasChanges(false)
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully.",
    })
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    saveSettings(DEFAULT_SETTINGS)
    setHasChanges(false)
    toast({
      title: "Settings reset",
      description: "Your preferences have been reset to defaults.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how Rover looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* UI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>User Interface</CardTitle>
          <CardDescription>
            Configure display options and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesSection
            preferences={settings.ui}
            onChange={handleUIPreferencesChange}
          />
        </CardContent>
      </Card>

      {/* Rover Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Rover Configuration</CardTitle>
          <CardDescription>
            Default settings for tasks and workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiConfigSection
            preferences={settings.rover}
            onChange={handleRoverPreferencesChange}
          />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage browser notifications for task events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationsSection
            preferences={settings.notifications}
            onChange={handleNotificationsChange}
          />
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-muted-foreground">
              You have unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save settings
          </Button>
        </div>
      </div>
    </div>
  )
}
