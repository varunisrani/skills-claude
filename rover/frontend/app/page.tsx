"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TaskList } from "@/components/tasks/TaskList"
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Rocket } from "lucide-react"
import type { Task } from "@/types/task"
import { ShortcutBadge } from "@/components/shortcuts/ShortcutBadge"
import { shortcuts } from "@/lib/shortcuts/shortcuts-config"
import { useShortcuts } from "@/lib/shortcuts/ShortcutsProvider"
import { useKeyboardShortcut } from "@/lib/shortcuts/useKeyboardShortcuts"

export default function Home() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { openHelp } = useShortcuts()

  const handleTaskClick = useCallback((taskId: number) => {
    router.push(`/tasks/${taskId}`)
  }, [router])

  const handleTaskCreated = useCallback((task: Task) => {
    setIsDialogOpen(false)
    // TanStack Query will automatically refetch the tasks list
    const taskId = task.id || task.taskId
    if (!taskId) {
      console.error('Task created but no ID returned:', task)
      return
    }
    router.push(`/tasks/${taskId}`)
  }, [router])

  const handleDialogCancel = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  // Register page-specific shortcuts
  useKeyboardShortcut(
    shortcuts.CREATE_TASK.keys,
    () => setIsDialogOpen(true),
    { preventDefault: true }
  )

  useKeyboardShortcut(
    shortcuts.SHOW_SHORTCUTS.keys,
    () => openHelp(),
    { preventDefault: true }
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Rover Tasks
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  AI-powered task automation and management
                </p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  New Task
                  <ShortcutBadge shortcut={shortcuts.CREATE_TASK} size="sm" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Describe the task you want the AI agent to complete. Be as detailed as possible.
                  </DialogDescription>
                </DialogHeader>
                <CreateTaskForm
                  onSuccess={handleTaskCreated}
                  onCancel={handleDialogCancel}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Task List */}
        <TaskList onTaskClick={handleTaskClick} />
      </div>
    </div>
  )
}
