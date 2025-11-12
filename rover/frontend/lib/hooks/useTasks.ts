/**
 * React Query hooks for task list operations
 *
 * Provides hooks for:
 * - Fetching all tasks
 * - Creating new tasks
 * - Deleting tasks
 *
 * Features:
 * - Optimistic updates for delete operations
 * - Automatic refetch on window focus
 * - Adaptive polling based on task status
 * - Proper error handling with TypeScript types
 */

'use client';

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type {
  ListTasksResponse,
  CreateTaskResponse,
  DeleteTaskResponse,
  CreateTaskRequest,
} from '@/types/api';
import type { TaskSummary, TaskStatus } from '@/types/task';

/**
 * Query key factory for task-related queries
 * Helps with cache invalidation and management
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskListFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  inspect: (id: number) => [...taskKeys.all, 'inspect', id] as const,
  logs: (id: number, iteration?: number) => ['tasks', 'logs', id, iteration] as const,
  diff: (id: number, branch?: string, file?: string) => ['tasks', 'diff', id, branch, file] as const,
};

/**
 * Filters for task list queries
 */
export interface TaskListFilters {
  status?: TaskStatus | TaskStatus[];
  workflow?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch all tasks with optional filtering
 *
 * Features:
 * - Automatic refetch on window focus
 * - Adaptive polling (polls more frequently when tasks are in progress)
 * - Proper error handling
 *
 * @param filters - Optional filters for task list
 * @returns Query result with tasks data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTasksQuery({ status: 'IN_PROGRESS' });
 * ```
 */
export function useTasksQuery(filters?: TaskListFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        statuses.forEach(s => params.append('status', s));
      }

      if (filters?.workflow) {
        params.append('workflow', filters.workflow);
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      if (filters?.page) {
        params.append('page', filters.page.toString());
      }

      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch tasks' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: ListTasksResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      return data;
    },
    // Refetch on window focus to keep data fresh
    refetchOnWindowFocus: true,
    // Adaptive polling: poll more frequently if there are in-progress tasks
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data?.data) return false;

      // Check if any tasks are in progress
      const hasActiveTasks = data.data.some((task: TaskSummary) =>
        task.status === 'IN_PROGRESS' || task.status === 'ITERATING'
      );

      // Poll every 5 seconds if there are active tasks, otherwise don't poll
      return hasActiveTasks ? 5000 : false;
    },
    // Keep data fresh
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to create a new task
 *
 * Features:
 * - Automatic cache invalidation on success
 * - Optimistic updates for better UX
 * - Proper error handling
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const createTask = useCreateTaskMutation();
 *
 * const handleCreate = () => {
 *   createTask.mutate({
 *     description: 'Implement user authentication',
 *     workflow: 'swe',
 *     agent: 'claude',
 *   });
 * };
 * ```
 */
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskRequest) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create task' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: CreateTaskResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create task');
      }

      return data.data;
    },
    // Invalidate and refetch task list on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Hook to delete a task
 *
 * Features:
 * - Optimistic updates (removes task from cache immediately)
 * - Automatic rollback on error
 * - Cache invalidation on success
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const deleteTask = useDeleteTaskMutation();
 *
 * const handleDelete = (taskId: number) => {
 *   deleteTask.mutate(taskId, {
 *     onSuccess: () => {
 *       console.log('Task deleted successfully');
 *     },
 *   });
 * };
 * ```
 */
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: number) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete task' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: DeleteTaskResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete task');
      }

      return data;
    },
    // Optimistic update: remove task from cache immediately
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update all task list queries
      queryClient.setQueriesData<ListTasksResponse>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.filter((task: TaskSummary) => task.id !== taskId),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          };
        }
      );

      // Return context with snapshot for rollback
      return { previousTasks };
    },
    // If the mutation fails, rollback to the previous value
    onError: (_error, _taskId, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.details() });
    },
  });
}
