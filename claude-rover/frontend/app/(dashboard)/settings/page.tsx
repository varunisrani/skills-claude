/**
 * Settings page
 *
 * User settings and preferences configuration
 */

import * as React from "react"
import { SettingsForm } from "@/components/settings"

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and configure Rover to work the way you want
        </p>
      </div>
      <SettingsForm />
    </div>
  )
}
