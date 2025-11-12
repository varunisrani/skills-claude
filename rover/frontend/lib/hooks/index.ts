/**
 * React Query Hooks for Rover Frontend
 *
 * This module exports all TanStack Query hooks for task management.
 * Import hooks from this file for easier usage across the application.
 *
 * @example
 * ```tsx
 * import { useTasksQuery, useCreateTaskMutation } from '@/lib/hooks';
 * ```
 */

// Task list operations
export {
  useTasksQuery,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  taskKeys,
  type TaskListFilters,
} from './useTasks';

// Single task operations
export {
  useTaskQuery,
  useInspectTaskQuery,
  useStopTaskMutation,
  useRestartTaskMutation,
  useIterateTaskMutation,
} from './useTask';

// Task logs
export {
  useTaskLogsQuery,
  useHasMoreLogs,
  useTaskLogsPaginated,
  useTaskLogsStream,
  type TaskLogsOptions,
} from './useTaskLogs';

// Task diffs
export {
  useTaskDiffQuery,
  useTaskChangedFiles,
  useTaskDiffStats,
  useTaskHasChanges,
  useTaskFileDiffs,
  parseDiff,
  type TaskDiffOptions,
  type ParsedDiff,
  type DiffHunk,
} from './useTaskDiff';
