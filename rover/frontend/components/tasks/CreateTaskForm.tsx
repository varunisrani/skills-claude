"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateTaskRequestSchema, TaskWorkflow, TaskAgent } from "@/lib/utils/validation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import type { Task } from "@/types/task"
import { ApiErrorDisplay } from "@/components/error/ApiErrorDisplay"
import { handleFetchError, handleError, type ApiError } from "@/lib/errors/error-handler"

interface CreateTaskFormProps {
  onSuccess?: (task: Task) => void
  onCancel?: () => void
}

export function CreateTaskForm({ onSuccess, onCancel }: CreateTaskFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<ApiError | null>(null)

  const [formData, setFormData] = useState({
    description: "",
    workflow: "" as TaskWorkflow | "",
    agent: "" as TaskAgent | "",
    sourceBranch: "",
    targetBranch: "",
    fromGithub: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setApiError(null)
    setIsSubmitting(true)

    try {
      // Validate form data
      const validatedData = CreateTaskRequestSchema.parse({
        description: formData.description,
        workflow: formData.workflow || undefined,
        agent: formData.agent || undefined,
        sourceBranch: formData.sourceBranch || undefined,
        targetBranch: formData.targetBranch || undefined,
        fromGithub: formData.fromGithub || undefined,
      })

      // Submit to API
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await handleFetchError(response)
        setApiError(error)

        toast({
          variant: "destructive",
          title: "Error creating task",
          description: error.userMessage,
        })
        return
      }

      const result = await response.json()

      toast({
        title: "Task created successfully",
        description: "Your task has been created and is now processing.",
      })

      if (result.data && onSuccess) {
        onSuccess(result.data)
      }

      // Reset form
      setFormData({
        description: "",
        workflow: "",
        agent: "",
        sourceBranch: "",
        targetBranch: "",
        fromGithub: "",
      })
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        const handledError = handleError(error, "CreateTaskForm")
        setApiError(handledError)

        toast({
          variant: "destructive",
          title: "Error creating task",
          description: handledError.userMessage,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Create new task form">
      {/* API Error Display */}
      {apiError && (
        <ApiErrorDisplay
          error={apiError}
          onRetry={() => {}}
          isRetrying={isSubmitting}
          showRetry={false}
        />
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Task Description <span className="text-red-500" aria-label="required">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the task you want the AI agent to complete... (10-5000 characters)"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className={errors.description ? "border-red-500" : ""}
          rows={6}
          required
          aria-required="true"
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={errors.description ? "description-error description-hint" : "description-hint"}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-red-500" role="alert">
            {errors.description}
          </p>
        )}
        <p id="description-hint" className="text-xs text-zinc-500">
          {formData.description.length} / 5000 characters
        </p>
      </div>

      {/* Workflow */}
      <div className="space-y-2">
        <Label htmlFor="workflow">Workflow</Label>
        <Select
          value={formData.workflow}
          onValueChange={(value) => handleChange("workflow", value)}
        >
          <SelectTrigger
            id="workflow"
            aria-invalid={errors.workflow ? "true" : "false"}
            aria-describedby={errors.workflow ? "workflow-error" : undefined}
          >
            <SelectValue placeholder="Select a workflow (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="swe">SWE (Software Engineering)</SelectItem>
            <SelectItem value="tech-writer">Tech Writer</SelectItem>
          </SelectContent>
        </Select>
        {errors.workflow && (
          <p id="workflow-error" className="text-sm text-red-500" role="alert">
            {errors.workflow}
          </p>
        )}
      </div>

      {/* AI Agent */}
      <div className="space-y-2">
        <Label htmlFor="agent">AI Agent</Label>
        <Select
          value={formData.agent}
          onValueChange={(value) => handleChange("agent", value)}
        >
          <SelectTrigger
            id="agent"
            aria-invalid={errors.agent ? "true" : "false"}
            aria-describedby={errors.agent ? "agent-error" : undefined}
          >
            <SelectValue placeholder="Select an AI agent (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (Recommended)</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="codex">Codex</SelectItem>
            <SelectItem value="qwen">Qwen</SelectItem>
            <SelectItem value="cursor">Cursor</SelectItem>
          </SelectContent>
        </Select>
        {errors.agent && (
          <p id="agent-error" className="text-sm text-red-500" role="alert">
            {errors.agent}
          </p>
        )}
      </div>

      {/* Source Branch */}
      <div className="space-y-2">
        <Label htmlFor="sourceBranch">Source Branch</Label>
        <Input
          id="sourceBranch"
          placeholder="e.g., main, develop (optional)"
          value={formData.sourceBranch}
          onChange={(e) => handleChange("sourceBranch", e.target.value)}
          className={errors.sourceBranch ? "border-red-500" : ""}
          aria-invalid={errors.sourceBranch ? "true" : "false"}
          aria-describedby={errors.sourceBranch ? "sourceBranch-error" : undefined}
        />
        {errors.sourceBranch && (
          <p id="sourceBranch-error" className="text-sm text-red-500" role="alert">
            {errors.sourceBranch}
          </p>
        )}
      </div>

      {/* Target Branch */}
      <div className="space-y-2">
        <Label htmlFor="targetBranch">Target Branch</Label>
        <Input
          id="targetBranch"
          placeholder="e.g., main, develop (optional)"
          value={formData.targetBranch}
          onChange={(e) => handleChange("targetBranch", e.target.value)}
          className={errors.targetBranch ? "border-red-500" : ""}
          aria-invalid={errors.targetBranch ? "true" : "false"}
          aria-describedby={errors.targetBranch ? "targetBranch-error" : undefined}
        />
        {errors.targetBranch && (
          <p id="targetBranch-error" className="text-sm text-red-500" role="alert">
            {errors.targetBranch}
          </p>
        )}
      </div>

      {/* GitHub Issue */}
      <div className="space-y-2">
        <Label htmlFor="fromGithub">GitHub Issue/PR URL</Label>
        <Input
          id="fromGithub"
          placeholder="https://github.com/owner/repo/issues/123 (optional)"
          value={formData.fromGithub}
          onChange={(e) => handleChange("fromGithub", e.target.value)}
          className={errors.fromGithub ? "border-red-500" : ""}
          aria-invalid={errors.fromGithub ? "true" : "false"}
          aria-describedby={errors.fromGithub ? "fromGithub-error" : undefined}
        />
        {errors.fromGithub && (
          <p id="fromGithub-error" className="text-sm text-red-500" role="alert">
            {errors.fromGithub}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </form>
  )
}
