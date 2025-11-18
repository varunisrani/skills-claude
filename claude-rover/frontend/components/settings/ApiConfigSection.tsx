/**
 * API Configuration section component
 *
 * Rover-specific settings including default workflow, AI agent, and automation options
 */

"use client"

import * as React from "react"
import { Bot, Workflow, GitMerge, GitPullRequest } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RoverPreferences } from "@/types/settings"

interface ApiConfigSectionProps {
  preferences: RoverPreferences
  onChange: (preferences: RoverPreferences) => void
}

const WORKFLOWS = [
  { value: "swe", label: "SWE (Software Engineer)", description: "Full-featured workflow" },
  { value: "code-review", label: "Code Review", description: "Review and suggest improvements" },
  { value: "debug", label: "Debug", description: "Debug and fix issues" },
  { value: "test", label: "Test", description: "Write and run tests" },
]

const AI_AGENTS = [
  { value: "claude", label: "Claude", description: "Anthropic's Claude AI" },
  { value: "gemini", label: "Gemini", description: "Google's Gemini AI" },
]

export function ApiConfigSection({ preferences, onChange }: ApiConfigSectionProps) {
  const handleWorkflowChange = (value: string) => {
    onChange({ ...preferences, defaultWorkflow: value })
  }

  const handleAgentChange = (value: string) => {
    onChange({ ...preferences, defaultAgent: value as "claude" | "gemini" })
  }

  const handleAutoMergeChange = (checked: boolean) => {
    onChange({ ...preferences, autoMerge: checked })
  }

  const handleAutoPushChange = (checked: boolean) => {
    onChange({ ...preferences, autoPush: checked })
  }

  return (
    <div className="space-y-6">
      {/* Default workflow */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Workflow className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="default-workflow" className="text-base">
              Default workflow
            </Label>
            <p className="text-sm text-muted-foreground">
              The workflow to use when creating new tasks
            </p>
          </div>
        </div>
        <Select value={preferences.defaultWorkflow} onValueChange={handleWorkflowChange}>
          <SelectTrigger id="default-workflow" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORKFLOWS.map((workflow) => (
              <SelectItem key={workflow.value} value={workflow.value}>
                <div className="flex flex-col items-start">
                  <span>{workflow.label}</span>
                  <span className="text-xs text-muted-foreground">{workflow.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Default AI agent */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="default-agent" className="text-base">
              Default AI agent
            </Label>
            <p className="text-sm text-muted-foreground">
              The AI agent to use for task execution
            </p>
          </div>
        </div>
        <Select value={preferences.defaultAgent} onValueChange={handleAgentChange}>
          <SelectTrigger id="default-agent" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_AGENTS.map((agent) => (
              <SelectItem key={agent.value} value={agent.value}>
                <div className="flex flex-col items-start">
                  <span>{agent.label}</span>
                  <span className="text-xs text-muted-foreground">{agent.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Automation options */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <GitMerge className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label className="text-base">Automation</Label>
            <p className="text-sm text-muted-foreground">
              Automatically perform actions when tasks complete
            </p>
          </div>
        </div>

        <div className="ml-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-merge">Auto-merge on completion</Label>
              <p className="text-sm text-muted-foreground">
                Automatically merge task changes to the main branch
              </p>
            </div>
            <Switch
              id="auto-merge"
              checked={preferences.autoMerge}
              onCheckedChange={handleAutoMergeChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              <div>
                <Label htmlFor="auto-push">Auto-push after merge</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically push changes to remote after merging
                </p>
              </div>
            </div>
            <Switch
              id="auto-push"
              checked={preferences.autoPush}
              onCheckedChange={handleAutoPushChange}
              disabled={!preferences.autoMerge}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
