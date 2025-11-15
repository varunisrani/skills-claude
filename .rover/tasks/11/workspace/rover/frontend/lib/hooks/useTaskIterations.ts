/**
 * React Query hooks for task iteration operations
 *
 * Provides hooks for:
 * - Fetching iteration history for a task
 * - Fetching details for a specific iteration
 *
 * Features:
 * - Automatic cache invalidation
 * - Proper error handling with TypeScript types
 * - Adaptive polling for in-progress iterations
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { APIResponse } from '@/types/api';
import type { IterationSummary, Iteration, IterationStatus } from '@/types/iteration';

/**
 * Query key factory for iterations
 */
export const iterationKeys = {
  all: ['iterations'] as const,
  lists: () => [...iterationKeys.all, 'list'] as const,
  list: (taskId: number) => [...iterationKeys.lists(), taskId] as const,
  details: () => [...iterationKeys.all, 'detail'] as const,
  detail: (taskId: number, iteration: number) => [...iterationKeys.details(), taskId, iteration] as const,
};

/**
 * Hook to fetch iteration history for a task
 *
 * Features:
 * - Automatic refetch on window focus
 * - Proper error handling
 * - Returns list of iteration summaries
 *
 * @param taskId - The task ID to fetch iterations for
 * @param options - Optional query configuration
 * @returns Query result with iteration summaries
 *
 * @example
 * ```tsx
 * const { data: iterations, isLoading } = useTaskIterationsQuery(123);
 * ```
 */
export function useTaskIterationsQuery(
  taskId: number,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: iterationKeys.list(taskId),
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/iterations`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Task ${taskId} not found`);
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch iterations' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: APIResponse<IterationSummary[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch iterations');
      }

      return data.data || [];
    },
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch details for a specific iteration
 *
 * Features:
 * - Automatic refetch on window focus
 * - Adaptive polling for in-progress iterations
 * - Returns full iteration details including status, plan, and summary
 *
 * @param taskId - The task ID
 * @param iteration - The iteration number
 * @param options - Optional query configuration
 * @returns Query result with iteration details
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useIterationDetailQuery(123, 2);
 * if (data) {
 *   console.log(data.iteration.title);
 *   console.log(data.status?.status);
 *   console.log(data.plan);
 * }
 * ```
 */
export function useIterationDetailQuery(
  taskId: number,
  iteration: number,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: iterationKeys.detail(taskId, iteration),
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/iterations/${iteration}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Iteration ${iteration} not found for task ${taskId}`);
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch iteration' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: APIResponse<{
        iteration: Iteration;
        status: IterationStatus | null;
        plan: string | null;
        summary: string | null;
      }> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch iteration');
      }

      return data.data;
    },
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: true,
    // Adaptive polling: poll more frequently if iteration is in progress
    refetchInterval: (query) => {
      const iterationData = query.state.data;
      if (!iterationData?.status) return false;

      const isActive = iterationData.status.status === 'initializing' || iterationData.status.status === 'running';
      return isActive ? 3000 : false; // Poll every 3 seconds for active iterations
    },
    staleTime: 30000,
  });
}

/**
 * Hook to get the latest iteration for a task
 *
 * @param taskId - The task ID
 * @param options - Optional query configuration
 * @returns Query result with the latest iteration summary
 *
 * @example
 * ```tsx
 * const { data: latestIteration } = useLatestIterationQuery(123);
 * ```
 */
export function useLatestIterationQuery(
  taskId: number,
  options?: {
    enabled?: boolean;
  }
) {
  const iterationsQuery = useTaskIterationsQuery(taskId, options);

  return {
    ...iterationsQuery,
    data: iterationsQuery.data?.[0], // Iterations are sorted newest first
  };
}

/**
 * Hook to check if a task has any iterations
 *
 * @param taskId - The task ID
 * @returns Query result with boolean indicating if task has iterations
 *
 * @example
 * ```tsx
 * const { data: hasIterations } = useHasIterationsQuery(123);
 * ```
 */
export function useHasIterationsQuery(taskId: number) {
  const iterationsQuery = useTaskIterationsQuery(taskId);

  return {
    ...iterationsQuery,
    data: (iterationsQuery.data?.length ?? 0) > 0,
  };
}
