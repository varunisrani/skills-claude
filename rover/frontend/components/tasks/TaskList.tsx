"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { TaskStatus } from "@/types/task"
import { TaskCard } from "./TaskCard"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingCard } from "@/components/loading/LoadingCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, RefreshCw, Power, PowerOff } from "lucide-react"
import { useTasksQuery } from "@/lib/hooks/useTasks"
import { useShortcuts } from "@/lib/shortcuts/ShortcutsProvider"
import { ShortcutBadge } from "@/components/shortcuts/ShortcutBadge"
import { shortcuts } from "@/lib/shortcuts/shortcuts-config"
import { ApiErrorDisplay } from "@/components/error/ApiErrorDisplay"
import { handleError } from "@/lib/errors/error-handler"

interface TaskListProps {
  onTaskClick?: (taskId: number) => void
}

export function TaskList({ onTaskClick }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Use the useTasks hook with auto-refresh
  const { data, isLoading, isFetching, error, refetch } = useTasksQuery({
    autoRefresh,
  })

  const tasks = data?.data || []

  // Transform error to ApiError for better display
  const apiError = error ? handleError(error, "TaskList") : null

  // Get shortcuts context for keyboard navigation
  const { setTotalTasks, setVisibleTaskIds, selectedTaskIndex } = useShortcuts()

  // Memoize filtered tasks to prevent unnecessary re-renders
  // Only recalculate when tasks, searchQuery, or statusFilter actually change
  const filteredTasks = useMemo(() => tasks.filter(task => {
    const taskId = task.id || task.taskId
    const matchesSearch = searchQuery === "" ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (taskId && taskId.toString().includes(searchQuery))

    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter

    return matchesSearch && matchesStatus
  }), [tasks, searchQuery, statusFilter])

  // Memoize visible task IDs to avoid creating new array on every render
  const visibleTaskIds = useMemo(() => filteredTasks.map((task) => task.id || task.taskId).filter((id) => id !== undefined) as number[], [filteredTasks])

  // Update shortcuts context when filtered tasks change
  // Only depend on the actual data, not the callbacks
  useEffect(() => {
    setTotalTasks(filteredTasks.length)
    setVisibleTaskIds(visibleTaskIds)
  }, [filteredTasks.length, visibleTaskIds])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingCard count={6} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search tasks by title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 sm:w-[200px]">
            <Filter className="h-4 w-4 text-zinc-500" />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "ALL")}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ITERATING">Iterating</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="MERGED">Merged</SelectItem>
                <SelectItem value="PUSHED">Pushed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Refresh Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
            <ShortcutBadge shortcut={shortcuts.REFRESH_TASKS} size="sm" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            {autoRefresh ? (
              <>
                <Power className="h-4 w-4 text-green-600" />
                Auto-refresh ON
              </>
            ) : (
              <>
                <PowerOff className="h-4 w-4 text-zinc-500" />
                Auto-refresh OFF
              </>
            )}
          </Button>

          {isFetching && !isLoading && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Updating...
            </span>
          )}
        </div>

        {/* Error Display */}
        {apiError && (
          <ApiErrorDisplay
            error={apiError}
            onRetry={() => refetch()}
            isRetrying={isFetching}
            showRetry={true}
          />
        )}
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
            <Search className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-zinc-500 dark:text-zinc-400">
            {tasks.length === 0
              ? "Create your first task to get started"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => (
            <div key={task.id} className="relative">
              {/* Task number badge for keyboard navigation (1-9) */}
              {index < 9 && (
                <div className="absolute -top-2 -left-2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-lg">
                  {index + 1}
                </div>
              )}
              <TaskCard
                task={task}
                onClick={() => onTaskClick?.(task.id)}
                className={
                  index === selectedTaskIndex
                    ? "ring-2 ring-blue-500 dark:ring-blue-400"
                    : ""
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
