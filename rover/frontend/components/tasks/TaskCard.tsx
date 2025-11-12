/**
 * TaskCard Component
 *
 * Displays a task in a card format with:
 * - Task title and description (truncated)
 * - TaskStatusBadge
 * - Progress bar for in-progress tasks
 * - Timestamps (created, updated) using date-fns
 * - Actions menu (view, stop, delete)
 * - Agent icon
 * - Click handler to view details
 *
 * Uses shadcn/ui Card component and Tailwind CSS for responsive design.
 */

"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { TaskStatusBadge } from "./TaskStatusBadge"
import {
  MoreVertical,
  Eye,
  StopCircle,
  Trash2,
  Bot,
  Clock,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task, TaskSummary } from "@/types/task"

export interface TaskCardProps {
  /** The task to display */
  task: Task | TaskSummary
  /** Callback when the card is clicked */
  onClick?: (task: Task | TaskSummary) => void
  /** Callback when delete action is triggered */
  onDelete?: (taskId: number) => void
  /** Callback when stop action is triggered */
  onStop?: (taskId: number) => void
  /** Callback when view action is triggered */
  onView?: (taskId: number) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Get the agent display name and icon color
 */
function getAgentInfo(agent?: string) {
  if (!agent) {
    return { name: "Auto", color: "text-gray-500" }
  }

  const agentLower = agent.toLowerCase()
  
  if (agentLower.includes("claude")) {
    return { name: "Claude", color: "text-orange-500" }
  } else if (agentLower.includes("gemini")) {
    return { name: "Gemini", color: "text-blue-500" }
  } else if (agentLower.includes("codex") || agentLower.includes("gpt")) {
    return { name: "GPT", color: "text-green-500" }
  } else if (agentLower.includes("qwen")) {
    return { name: "Qwen", color: "text-purple-500" }
  } else if (agentLower.includes("cursor")) {
    return { name: "Cursor", color: "text-indigo-500" }
  }

  return { name: agent, color: "text-gray-500" }
}

/**
 * Calculate progress percentage for in-progress tasks
 * Based on iterations and status
 */
function calculateProgress(task: Task | TaskSummary): number | undefined {
  const { status, iterations } = task

  if (status === "IN_PROGRESS" || status === "ITERATING") {
    // Simple progress calculation: each iteration is worth some progress
    // This is a heuristic since we don't have actual progress data
    const baseProgress = 20
    const iterationProgress = Math.min(iterations * 15, 60)
    return Math.min(baseProgress + iterationProgress, 90)
  }

  if (status === "COMPLETED" || status === "MERGED" || status === "PUSHED") {
    return 100
  }

  return undefined
}

/**
 * Truncate text to a maximum length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + "..."
}

export function TaskCard({
  task,
  onClick,
  onDelete,
  onStop,
  onView,
  className
}: TaskCardProps) {
  const agentInfo = getAgentInfo(task.agent)
  const progress = calculateProgress(task)
  const showProgress = progress !== undefined && progress < 100

  // Determine the timestamp to display (handle both Task and TaskSummary)
  const displayTimestamp = ('completedAt' in task && task.completedAt)
    || ('startedAt' in task && task.startedAt)
    || ('updatedAt' in task && task.updatedAt)
    || task.createdAt
  const timestampLabel = ('completedAt' in task && task.completedAt)
    ? "Completed"
    : ('startedAt' in task && task.startedAt)
    ? "Started"
    : ('updatedAt' in task && task.updatedAt)
    ? "Updated"
    : "Created"

  const handleCardClick = () => {
    if (onClick) {
      onClick(task)
    } else if (onView) {
      onView(task.id)
    }
  }

  const handleAction = (
    e: React.MouseEvent,
    action: () => void
  ) => {
    e.stopPropagation()
    action()
  }

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer",
        className
      )}
      onClick={handleCardClick}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TaskStatusBadge status={task.status} showIcon />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Bot className={cn("h-3 w-3", agentInfo.color)} aria-hidden="true" />
                <span>{agentInfo.name}</span>
              </div>
            </div>
            <CardTitle className="text-lg leading-tight truncate">
              {task.title}
            </CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Task actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem
                  onClick={(e) => handleAction(e, () => onView(task.id))}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View Details</span>
                </DropdownMenuItem>
              )}
              {onStop && (task.status === "IN_PROGRESS" || task.status === "ITERATING") && (
                <DropdownMenuItem
                  onClick={(e) => handleAction(e, () => onStop(task.id))}
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  <span>Stop Task</span>
                </DropdownMenuItem>
              )}
              {(onView || onStop) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => handleAction(e, () => onDelete(task.id))}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Task</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {'description' in task && task.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {truncateText(task.description, 150)}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress bar for in-progress tasks */}
        {showProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" aria-label="Task progress" />
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1" title={timestampLabel}>
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>
                {formatDistanceToNow(new Date(displayTimestamp), { addSuffix: true })}
              </span>
            </div>
            {task.iterations > 1 && (
              <div className="flex items-center gap-1" title="Iterations">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>{task.iterations} iterations</span>
              </div>
            )}
          </div>
          <span className="font-mono text-xs">#{task.id}</span>
        </div>

        {/* Workflow name */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Workflow:</span>
          <span className="font-medium capitalize">{task.workflowName}</span>
        </div>
      </CardContent>
    </Card>
  )
}
