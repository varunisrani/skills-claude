/**
 * React hook for streaming task updates via Server-Sent Events (SSE)
 *
 * Provides real-time updates for task execution status by connecting to
 * the SSE endpoint and updating the React Query cache automatically.
 *
 * Features:
 * - Automatic connection management
 * - Exponential backoff reconnection (1s, 2s, 4s, up to 30s max)
 * - React Query cache updates
 * - Heartbeat handling
 * - Proper cleanup on unmount
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InspectTaskResponse } from '@/types/api';
import type { IterationStatus } from '@/types/iteration';
import { taskKeys } from './useTasks';

/**
 * Options for task streaming
 */
export interface TaskStreamOptions {
  /** Whether the stream is enabled (default: true) */
  enabled?: boolean;

  /** Callback when connection opens */
  onConnect?: () => void;

  /** Callback when connection closes */
  onDisconnect?: () => void;

  /** Callback when an error occurs */
  onError?: (error: Error) => void;

  /** Callback when a message is received */
  onMessage?: (data: IterationStatus) => void;
}

/**
 * Task stream return value
 */
export interface TaskStreamResult {
  /** Whether the stream is currently connected */
  isConnected: boolean;

  /** Connection error if any */
  error: Error | null;

  /** Number of reconnection attempts */
  reconnectAttempts: number;

  /** Manually reconnect to the stream */
  reconnect: () => void;

  /** Manually disconnect from the stream */
  disconnect: () => void;
}

// Exponential backoff configuration
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const BACKOFF_MULTIPLIER = 2;

/**
 * Hook to stream task updates via Server-Sent Events (SSE)
 *
 * This hook establishes an SSE connection to receive real-time task status updates
 * and automatically updates the React Query cache. It includes automatic reconnection
 * with exponential backoff and proper cleanup.
 *
 * @param taskId - The task ID to stream updates for
 * @param options - Optional configuration for the stream
 * @returns Stream state and control functions
 *
 * @example
 * ```tsx
 * function TaskMonitor({ taskId }: { taskId: number }) {
 *   const { isConnected, error, reconnectAttempts } = useTaskStream(taskId, {
 *     onMessage: (data) => {
 *       console.log('Received update:', data);
 *     },
 *     onError: (err) => {
 *       console.error('Stream error:', err);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
 *       {error && <div>Error: {error.message}</div>}
 *       {reconnectAttempts > 0 && <div>Reconnecting... (attempt {reconnectAttempts})</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTaskStream(
  taskId: number,
  options: TaskStreamOptions = {}
): TaskStreamResult {
  const { enabled = true, onConnect, onDisconnect, onError, onMessage } = options;

  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RETRY_DELAY);
  const shouldReconnectRef = useRef(true);

  /**
   * Calculate the next reconnection delay using exponential backoff
   */
  const getNextReconnectDelay = (): number => {
    const currentDelay = reconnectDelayRef.current;
    reconnectDelayRef.current = Math.min(
      currentDelay * BACKOFF_MULTIPLIER,
      MAX_RETRY_DELAY
    );
    return currentDelay;
  };

  /**
   * Reset reconnection state when connection is successful
   */
  const resetReconnectState = () => {
    reconnectDelayRef.current = INITIAL_RETRY_DELAY;
    setReconnectAttempts(0);
  };

  /**
   * Clear any pending reconnection timeout
   */
  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  /**
   * Establish SSE connection
   */
  const connect = () => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const url = `/api/tasks/${taskId}/stream`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        resetReconnectState();
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          // Ignore heartbeat messages
          if (event.data === ': heartbeat' || event.data.trim() === '') {
            return;
          }

          // Parse the SSE message
          const data = JSON.parse(event.data) as IterationStatus;

          // Update React Query cache for the inspect endpoint
          queryClient.setQueryData<InspectTaskResponse>(
            taskKeys.inspect(taskId),
            (old) => {
              if (!old) return old;

              return {
                ...old,
                currentIterationStatus: data,
              };
            }
          );

          // Also invalidate the task detail query to ensure consistency
          queryClient.invalidateQueries({
            queryKey: taskKeys.detail(taskId),
          });

          // Trigger callback
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
          const parseError =
            err instanceof Error ? err : new Error('Failed to parse SSE message');
          setError(parseError);
          onError?.(parseError);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();

        // Only attempt to reconnect if we should and the component is still mounted
        if (shouldReconnectRef.current && enabled) {
          const delay = getNextReconnectDelay();
          setReconnectAttempts((prev) => prev + 1);

          const connectionError = new Error(
            `SSE connection failed. Reconnecting in ${delay / 1000}s...`
          );
          setError(connectionError);
          onError?.(connectionError);

          // Schedule reconnection
          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          const finalError = new Error('SSE connection closed');
          setError(finalError);
          onDisconnect?.();
        }
      };
    } catch (err) {
      const connectionError =
        err instanceof Error
          ? err
          : new Error('Failed to establish SSE connection');
      setError(connectionError);
      onError?.(connectionError);
    }
  };

  /**
   * Manually disconnect from the stream
   */
  const disconnect = () => {
    shouldReconnectRef.current = false;
    clearReconnectTimeout();

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    onDisconnect?.();
  };

  /**
   * Manually reconnect to the stream
   */
  const reconnect = () => {
    shouldReconnectRef.current = true;
    resetReconnectState();
    disconnect();
    connect();
  };

  // Effect to manage connection lifecycle
  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    // Enable reconnection and establish connection
    shouldReconnectRef.current = true;
    connect();

    // Cleanup on unmount or when taskId changes
    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, enabled]);

  return {
    isConnected,
    error,
    reconnectAttempts,
    reconnect,
    disconnect,
  };
}
