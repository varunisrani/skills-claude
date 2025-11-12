"use client"

import { useState } from "react"
import { TaskSummary, TaskStatus } from "@/types/task"
import { TaskCard } from "./TaskCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface TaskListProps {
  tasks?: TaskSummary[]
  isLoading?: boolean
  onTaskClick?: (taskId: number) => void
}

export function TaskList({ tasks = [], isLoading = false, onTaskClick }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL")

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === "" || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toString().includes(searchQuery)
    
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
