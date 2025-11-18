/**
 * Theme toggle component
 *
 * Allows users to switch between light, dark, and system themes
 */

"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="theme-select" className="text-base">
            Theme
          </Label>
          <p className="text-sm text-muted-foreground">
            Choose how Rover looks to you
          </p>
        </div>
        <div className="flex items-center gap-2">
          {theme === "light" && <Sun className="h-4 w-4 text-muted-foreground" />}
          {theme === "dark" && <Moon className="h-4 w-4 text-muted-foreground" />}
          {theme === "system" && <Monitor className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
        <SelectTrigger id="theme-select" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
