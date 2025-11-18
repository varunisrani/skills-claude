/**
 * Notifications section component
 *
 * Notification preferences for browser notifications
 */

"use client"

import * as React from "react"
import { Bell, BellOff } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { NotificationPreferences } from "@/types/settings"

interface NotificationsSectionProps {
  preferences: NotificationPreferences
  onChange: (preferences: NotificationPreferences) => void
}

export function NotificationsSection({ preferences, onChange }: NotificationsSectionProps) {
  const handleEnabledChange = (checked: boolean) => {
    onChange({ ...preferences, enabled: checked })
  }

  const handleTaskCompleteChange = (checked: boolean) => {
    onChange({ ...preferences, onTaskComplete: checked })
  }

  const handleTaskFailureChange = (checked: boolean) => {
    onChange({ ...preferences, onTaskFailure: checked })
  }

  const handleTaskStatusChange = (checked: boolean) => {
    onChange({ ...preferences, onTaskStatusChange: checked })
  }

  return (
    <div className="space-y-6">
      {/* Enable notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          {preferences.enabled ? (
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />
          )}
          <div className="space-y-1">
            <Label htmlFor="notifications-enabled" className="text-base">
              Enable notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive browser notifications for important events
            </p>
          </div>
        </div>
        <Switch
          id="notifications-enabled"
          checked={preferences.enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {/* Notification options */}
      {preferences.enabled && (
        <div className="ml-8 space-y-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-task-complete">Task completion</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a task completes successfully
              </p>
            </div>
            <Switch
              id="notify-task-complete"
              checked={preferences.onTaskComplete}
              onCheckedChange={handleTaskCompleteChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-task-failure">Task failure</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a task fails or encounters an error
              </p>
            </div>
            <Switch
              id="notify-task-failure"
              checked={preferences.onTaskFailure}
              onCheckedChange={handleTaskFailureChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-task-status">Status changes</Label>
              <p className="text-sm text-muted-foreground">
                Notify on any task status change
              </p>
            </div>
            <Switch
              id="notify-task-status"
              checked={preferences.onTaskStatusChange}
              onCheckedChange={handleTaskStatusChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
