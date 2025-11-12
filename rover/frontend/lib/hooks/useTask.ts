/**
 * React Query hooks for single task operations
 *
 * Provides hooks for:
 * - Fetching single task details
 * - Inspecting task with detailed information
 * - Stopping a task
 * - Restarting a task
 * - Adding iterations to a task
 *
 * Features:
 * - Automatic cache invalidation
 * - Optimistic updates where appropriate
 * - Proper error handling with TypeScript types
 * - Adaptive polling for in-progress tasks
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  GetTaskResponse,
  InspectTaskResponse,
  StopTaskResponse,
  RestartTaskResponse,
  IterateTaskResponse,
  StopTaskRequest,
  RestartTaskRequest,
  IterateTaskRequest,
} from '@/types/api';
import type { TaskStatus } from '@/types/task';
import { taskKeys } from './useTasks';

/**
 * Hook to fetch a single task's details
 *
 * Features:
 * - Automatic refetch on window focus
 * - Adaptive polling for in-progress tasks
 * - Proper error handling
 *
 * @param taskId - The task ID to fetch
 * @param options - Optional query configuration
 * @returns Query result with task data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTaskQuery(123);
 * ```
 */
export function useTaskQuery(
  taskId: number,
  options?: {
    enabled?: boolean;
    includeIterations?: boolean;
  }
) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (options?.includeIterations) {
        params.append('includeIterations', 'true');
      }

      const url = `/api/tasks/${taskId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Task ${taskId} not found`);
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch task' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: GetTaskResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch task');
      }

      return data.data;
    },
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: true,
    // Adaptive polling: poll more frequently if task is in progress
    refetchInterval: (query) => {
      const task = query.state.data;
      if (!task) return false;

      const isActive = task.status === 'IN_PROGRESS' || task.status === 'ITERATING';
      return isActive ? 3000 : false; // Poll every 3 seconds for active tasks
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to inspect a task with detailed information
 *
 * This provides more comprehensive information than useTaskQuery,
 * including container details and current iteration status.
 *
 * @param taskId - The task ID to inspect
 * @param options - Optional query configuration
 * @returns Query result with detailed task inspection data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useInspectTaskQuery(123);
 * if (data) {
 *   console.log('Container ID:', data.container?.id);
 *   console.log('Current iteration:', data.currentIteration);
 * }
 * ```
 */
export function useInspectTaskQuery(
  taskId: number,
  options?: {
    enabled?: boolean;
    includeContainer?: boolean;
  }
) {
  return useQuery({
    queryKey: taskKeys.inspect(taskId),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (options?.includeContainer) {
        params.append('includeContainer', 'true');
      }

      const url = `/api/tasks/${taskId}/inspect${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Task ${taskId} not found`);
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to inspect task' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: InspectTaskResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to inspect task');
      }

      return data.data;
    },
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: true,
    // Adaptive polling for active tasks
    refetchInterval: (query) => {
      const inspection = query.state.data;
      if (!inspection?.task) return false;

      const isActive = inspection.task.status === 'IN_PROGRESS' || inspection.task.status === 'ITERATING';
      return isActive ? 3000 : false;
    },
    staleTime: 30000,
  });
}

/**
 * Hook to stop a running task
 *
 * Features:
 * - Automatic cache invalidation
 * - Optimistic status update
 * - Proper error handling
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const stopTask = useStopTaskMutation();
 *
 * const handleStop = (taskId: number) => {
 *   stopTask.mutate({ taskId, removeAll: false });
 * };
 * ```
 */
export function useStopTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, removeAll = false }: { taskId: number; removeAll?: boolean }) => {
      const response = await fetch(`/api/tasks/${taskId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ removeAll } as StopTaskRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to stop task' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: StopTaskResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to stop task');
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.inspect(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Hook to restart a task
 *
 * Features:
 * - Automatic cache invalidation
 * - Proper error handling
 * - Optional restart from specific iteration
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const restartTask = useRestartTaskMutation();
 *
 * const handleRestart = (taskId: number) => {
 *   restartTask.mutate({ taskId, fromIteration: 1 });
 * };
 * ```
 */
export function useRestartTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, fromIteration }: { taskId: number; fromIteration?: number }) => {
      const response = await fetch(`/api/tasks/${taskId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromIteration } as RestartTaskRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to restart task' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: RestartTaskResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to restart task');
      }

      return data.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.inspect(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.logs(variables.taskId) });
    },
  });
}

/**
 * Hook to add an iteration to a task
 *
 * An iteration allows you to refine or add additional instructions
 * to a task without starting from scratch.
 *
 * Features:
 * - Automatic cache invalidation
 * - Proper error handling
 * - Returns the created iteration
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const iterateTask = useIterateTaskMutation();
 *
 * const handleIterate = (taskId: number) => {
 *   iterateTask.mutate({
 *     taskId,
 *     instructions: 'Please also add error handling',
 *     title: 'Add error handling',
 *   });
 * };
 * ```
 */
export function useIterateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      instructions,
      title,
    }: {
      taskId: number;
      instructions: string;
      title?: string;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/iterate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instructions, title } as IterateTaskRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add iteration' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: IterateTaskResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to add iteration');
      }

      return data.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.inspect(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.logs(variables.taskId) });
    },
  });
}
