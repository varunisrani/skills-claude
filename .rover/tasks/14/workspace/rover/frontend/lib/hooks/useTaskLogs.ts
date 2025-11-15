/**
 * React Query hooks for task logs
 *
 * Provides hooks for:
 * - Fetching task logs
 * - Auto-refreshing logs for in-progress tasks
 * - Pagination support
 *
 * Features:
 * - Automatic refetch for in-progress tasks
 * - Pagination support with tail option
 * - Proper error handling
 * - TypeScript type safety
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetLogsResponse } from '@/types/api';
import { taskKeys } from './useTasks';

/**
 * Options for fetching task logs
 */
export interface TaskLogsOptions {
  /** Specific iteration to fetch logs for (defaults to latest) */
  iteration?: number;

  /** Follow logs in real-time (enables auto-refresh) */
  follow?: boolean;

  /** Number of lines from the end to fetch */
  tail?: number;

  /** Whether the query is enabled */
  enabled?: boolean;
}

/**
 * Hook to fetch task logs
 *
 * Features:
 * - Auto-refresh for in-progress tasks when follow is true
 * - Support for fetching specific iteration logs
 * - Tail support for getting last N lines
 * - Proper error handling
 *
 * @param taskId - The task ID to fetch logs for
 * @param options - Optional configuration for log fetching
 * @returns Query result with logs data
 *
 * @example
 * ```tsx
 * // Fetch latest logs
 * const { data: logs } = useTaskLogsQuery(123);
 *
 * // Follow logs in real-time
 * const { data: liveLogs } = useTaskLogsQuery(123, { follow: true });
 *
 * // Fetch logs for specific iteration
 * const { data: iterLogs } = useTaskLogsQuery(123, { iteration: 2 });
 *
 * // Get last 100 lines
 * const { data: tailLogs } = useTaskLogsQuery(123, { tail: 100 });
 * ```
 */
export function useTaskLogsQuery(taskId: number, options?: TaskLogsOptions) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: taskKeys.logs(taskId, options?.iteration),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (options?.iteration !== undefined) {
        params.append('iteration', options.iteration.toString());
      }

      if (options?.follow !== undefined) {
        params.append('follow', options.follow.toString());
      }

      if (options?.tail !== undefined) {
        params.append('tail', options.tail.toString());
      }

      const url = `/api/tasks/${taskId}/logs${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Task ${taskId} not found`);
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch logs' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: GetLogsResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      return data.data;
    },
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: false, // Don't refetch on window focus for logs
    // Auto-refresh if follow is enabled
    refetchInterval: options?.follow ? 2000 : false, // Poll every 2 seconds when following
    // Keep previous logs visible while fetching new ones
    placeholderData: (previousData) => previousData,
    staleTime: options?.follow ? 0 : 60000, // Fresh data when following, otherwise 1 minute
  });
}

/**
 * Hook to check if a task has more logs available
 *
 * This can be used for pagination or to show a "load more" button.
 *
 * @param taskId - The task ID to check
 * @returns Boolean indicating if more logs are available
 *
 * @example
 * ```tsx
 * const hasMore = useHasMoreLogs(123);
 * if (hasMore) {
 *   return <button>Load more logs</button>;
 * }
 * ```
 */
export function useHasMoreLogs(taskId: number, iteration?: number): boolean {
  const queryClient = useQueryClient();
  const queryKey = taskKeys.logs(taskId, iteration);
  const data = queryClient.getQueryData<{ logs: string; hasMore: boolean }>(queryKey);

  return data?.hasMore ?? false;
}

/**
 * Hook to fetch logs with pagination support
 *
 * This extends useTaskLogsQuery with built-in pagination logic.
 *
 * @param taskId - The task ID to fetch logs for
 * @param options - Configuration including pagination settings
 * @returns Query result with logs and pagination helpers
 *
 * @example
 * ```tsx
 * const { data, hasMore, loadMore } = useTaskLogsPaginated(123, {
 *   pageSize: 100,
 * });
 *
 * return (
 *   <div>
 *     <pre>{data?.logs}</pre>
 *     {hasMore && <button onClick={loadMore}>Load More</button>}
 *   </div>
 * );
 * ```
 */
export function useTaskLogsPaginated(
  taskId: number,
  options?: TaskLogsOptions & {
    pageSize?: number;
  }
) {
  const pageSize = options?.pageSize ?? 100;
  const { data, ...queryResult } = useTaskLogsQuery(taskId, {
    ...options,
    tail: pageSize,
  });

  const hasMore = data?.hasMore ?? false;

  const loadMore = () => {
    // This would require implementation of pagination offset in the API
    // For now, we can refetch with a larger tail value
    queryResult.refetch();
  };

  return {
    ...queryResult,
    data,
    hasMore,
    loadMore,
  };
}

/**
 * Hook to stream task logs in real-time using Server-Sent Events (SSE)
 *
 * This is an advanced hook that connects to an SSE endpoint for
 * real-time log streaming, which is more efficient than polling.
 *
 * Note: This requires an SSE endpoint to be implemented at /api/tasks/:id/logs/stream
 *
 * @param taskId - The task ID to stream logs for
 * @param options - Configuration for log streaming
 * @returns Object with logs and streaming state
 *
 * @example
 * ```tsx
 * const { logs, isConnected, error } = useTaskLogsStream(123);
 *
 * return (
 *   <div>
 *     <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
 *     <pre>{logs}</pre>
 *   </div>
 * );
 * ```
 */
export function useTaskLogsStream(
  taskId: number,
  options?: {
    iteration?: number;
    enabled?: boolean;
  }
) {
  const [logs, setLogs] = React.useState<string>('');
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  React.useEffect(() => {
    if (options?.enabled === false) return;

    const params = new URLSearchParams();
    if (options?.iteration !== undefined) {
      params.append('iteration', options.iteration.toString());
    }

    const url = `/api/tasks/${taskId}/logs/stream${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        const logLine = event.data;
        setLogs((prev) => prev + logLine + '\n');
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        setError(new Error('Connection to log stream failed'));
        eventSource.close();
      };

      return () => {
        eventSource.close();
        setIsConnected(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect to log stream'));
    }
  }, [taskId, options?.iteration, options?.enabled]);

  return {
    logs,
    isConnected,
    error,
    clearLogs: () => setLogs(''),
  };
}

// React import for useTaskLogsStream
import React from 'react';
