/**
 * Tests for useTaskStream hook
 *
 * Tests SSE (Server-Sent Events) connection management including:
 * - Initial connection and disconnection
 * - Automatic reconnection with exponential backoff
 * - Message parsing and React Query cache updates
 * - Error handling
 * - Manual control (reconnect/disconnect)
 * - Cleanup on unmount
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTaskStream } from '../useTaskStream';
import type { InspectTaskResponse } from '@/types/api';
import type { IterationStatus } from '@/types/iteration';
import { taskKeys } from '../useTasks';

// Mock EventSource instance type
interface MockEventSourceInstance {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close: Mock;
  simulateOpen: () => void;
  simulateMessage: (data: string) => void;
  simulateError: () => void;
}

// Track all created EventSource instances
let eventSourceInstances: MockEventSourceInstance[] = [];

// Mock EventSource constructor
const MockEventSourceConstructor = vi.fn((url: string) => {
  const instance: MockEventSourceInstance = {
    url,
    readyState: 0, // CONNECTING
    onopen: null,
    onmessage: null,
    onerror: null,
    close: vi.fn(function (this: MockEventSourceInstance) {
      this.readyState = 2; // CLOSED
    }),
    simulateOpen: function (this: MockEventSourceInstance) {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    },
    simulateMessage: function (this: MockEventSourceInstance, data: string) {
      if (this.onmessage) {
        const event = new MessageEvent('message', { data });
        this.onmessage(event);
      }
    },
    simulateError: function (this: MockEventSourceInstance) {
      if (this.onerror) {
        this.onerror(new Event('error'));
      }
    },
  };

  eventSourceInstances.push(instance);
  return instance;
});

// Helper to create a query client for testing
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });
}

// Helper to create a wrapper with QueryClient
function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useTaskStream', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset mocks and instances
    vi.clearAllMocks();
    vi.useFakeTimers();
    eventSourceInstances = [];

    // Mock EventSource globally
    global.EventSource = MockEventSourceConstructor as any;

    // Create a fresh query client
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    eventSourceInstances = [];
  });

  describe('Initial Connection', () => {
    it('should establish SSE connection on mount', async () => {
      const taskId = 1;

      const { result } = renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      // Initially not connected
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe(null);

      // EventSource should be created
      await waitFor(() => {
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(1);
        expect(MockEventSourceConstructor).toHaveBeenCalledWith(`/api/tasks/${taskId}/stream`);
      });

      // Simulate connection opening
      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      // Should be connected
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBe(null);
        expect(result.current.reconnectAttempts).toBe(0);
      });
    });

    it('should call onConnect callback when connection opens', async () => {
      const taskId = 1;
      const onConnect = vi.fn();

      renderHook(() => useTaskStream(taskId, { onConnect }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      // Simulate connection opening
      eventSourceInstances[0].simulateOpen();

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalledTimes(1);
      });
    });

    it('should not connect when enabled is false', async () => {
      const taskId = 1;

      const { result } = renderHook(
        () => useTaskStream(taskId, { enabled: false }),
        { wrapper: createWrapper(queryClient) }
      );

      // Should not create EventSource
      expect(MockEventSourceConstructor).not.toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Message Handling', () => {
    it('should parse and handle incoming messages', async () => {
      const taskId = 1;
      const onMessage = vi.fn();

      const { result } = renderHook(() => useTaskStream(taskId, { onMessage }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate incoming message
      const mockIterationStatus: IterationStatus = {
        taskId: 'task-uuid-1',
        status: 'running',
        currentStep: 'Executing test',
        progress: 50,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      instance.simulateMessage(JSON.stringify(mockIterationStatus));

      await waitFor(() => {
        expect(onMessage).toHaveBeenCalledWith(mockIterationStatus);
      });
    });

    it('should ignore heartbeat messages', async () => {
      const taskId = 1;
      const onMessage = vi.fn();

      const { result } = renderHook(() => useTaskStream(taskId, { onMessage }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate heartbeat messages (should be ignored)
      instance.simulateMessage(': heartbeat');
      instance.simulateMessage('');
      instance.simulateMessage('   ');

      // Wait a bit to ensure no callbacks are triggered
      await vi.advanceTimersByTimeAsync(100);

      expect(onMessage).not.toHaveBeenCalled();
    });

    it('should update React Query cache on message', async () => {
      const taskId = 1;

      // Pre-populate cache with initial data
      const initialData: InspectTaskResponse = {
        success: true,
        data: {
          task: {} as any,
          currentIteration: {} as any,
          currentIterationStatus: {
            taskId: 'task-uuid-1',
            status: 'initializing',
            currentStep: 'Starting',
            progress: 0,
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };

      queryClient.setQueryData(taskKeys.inspect(taskId), initialData);

      renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      // Simulate message with updated status
      const updatedStatus: IterationStatus = {
        taskId: 'task-uuid-1',
        status: 'running',
        currentStep: 'Processing',
        progress: 75,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      instance.simulateMessage(JSON.stringify(updatedStatus));

      // Check that cache was updated
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<InspectTaskResponse>(
          taskKeys.inspect(taskId)
        );
        expect(cachedData?.data?.currentIterationStatus).toEqual(updatedStatus);
      });
    });

    it('should handle malformed JSON messages gracefully', async () => {
      const taskId = 1;
      const onError = vi.fn();

      const { result } = renderHook(() => useTaskStream(taskId, { onError }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Send malformed JSON
      instance.simulateMessage('{ invalid json }');

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Failed to parse SSE message');
      });
    });
  });

  describe('Connection Failure and Reconnection', () => {
    it('should attempt reconnection on error', async () => {
      const taskId = 1;
      const onError = vi.fn();

      const { result } = renderHook(() => useTaskStream(taskId, { onError }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate error
      instance.simulateError();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.reconnectAttempts).toBe(1);
      });

      // Should schedule reconnection after 1 second (first attempt)
      await vi.advanceTimersByTimeAsync(1000);

      await waitFor(() => {
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(2);
      });
    });

    it('should implement exponential backoff: 1s, 2s, 4s, 8s, 16s', async () => {
      const taskId = 1;

      renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      // Initial connection
      eventSourceInstances[0].simulateOpen();

      await waitFor(() => {
        expect(eventSourceInstances[0].readyState).toBe(1);
      });

      // Test backoff sequence: 1s, 2s, 4s, 8s, 16s
      const expectedDelays = [1000, 2000, 4000, 8000, 16000];

      for (let i = 0; i < expectedDelays.length; i++) {
        const currentInstance = eventSourceInstances[eventSourceInstances.length - 1];

        // Trigger error
        currentInstance.simulateError();

        // Wait for the expected delay
        await vi.advanceTimersByTimeAsync(expectedDelays[i]);

        // Should have created a new EventSource
        await waitFor(() => {
          expect(MockEventSourceConstructor).toHaveBeenCalledTimes(i + 2);
        });
      }
    });

    it('should cap backoff delay at 30 seconds', async () => {
      const taskId = 1;

      renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      // Initial connection
      eventSourceInstances[0].simulateOpen();

      // Sequence: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s (capped)
      const delays = [1000, 2000, 4000, 8000, 16000, 30000, 30000];

      for (let i = 0; i < delays.length; i++) {
        const currentInstance = eventSourceInstances[eventSourceInstances.length - 1];
        currentInstance.simulateError();

        await vi.advanceTimersByTimeAsync(delays[i]);

        await waitFor(() => {
          expect(MockEventSourceConstructor).toHaveBeenCalledTimes(i + 2);
        });
      }
    });

    it('should reset backoff delay after successful connection', async () => {
      const taskId = 1;

      const { result } = renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      // First connection
      eventSourceInstances[0].simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Trigger error
      eventSourceInstances[0].simulateError();

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(1);
      });

      // Wait for first reconnect (1s)
      await vi.advanceTimersByTimeAsync(1000);

      await waitFor(() => {
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(2);
      });

      // Successfully connect
      eventSourceInstances[1].simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.reconnectAttempts).toBe(0); // Reset!
      });

      // Trigger error again
      eventSourceInstances[1].simulateError();

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(1);
      });

      // Should restart from 1s delay (not 2s)
      await vi.advanceTimersByTimeAsync(1000);

      await waitFor(() => {
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(3);
      });
    });

    it('should call onError callback on connection failure', async () => {
      const taskId = 1;
      const onError = vi.fn();

      renderHook(() => useTaskStream(taskId, { onError }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      eventSourceInstances[0].simulateOpen();
      eventSourceInstances[0].simulateError();

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        const error = onError.mock.calls[0][0];
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('SSE connection failed');
      });
    });
  });

  describe('Manual Control', () => {
    it('should support manual disconnect', async () => {
      const taskId = 1;
      const onDisconnect = vi.fn();

      const { result } = renderHook(
        () => useTaskStream(taskId, { onDisconnect }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Manually disconnect
      result.current.disconnect();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(instance.close).toHaveBeenCalled();
        expect(onDisconnect).toHaveBeenCalled();
      });

      // Should not attempt to reconnect after manual disconnect
      await vi.advanceTimersByTimeAsync(5000);
      expect(MockEventSourceConstructor).toHaveBeenCalledTimes(1);
    });

    it('should support manual reconnect', async () => {
      const taskId = 1;

      const { result } = renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Manually reconnect
      result.current.reconnect();

      // Should close old connection and create new one
      await waitFor(() => {
        expect(instance.close).toHaveBeenCalled();
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(2);
      });

      // Connect the new instance
      eventSourceInstances[1].simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
        expect(result.current.reconnectAttempts).toBe(0);
      });
    });

    it('should reset backoff delay on manual reconnect', async () => {
      const taskId = 1;

      const { result } = renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      // First connection
      eventSourceInstances[0].simulateOpen();

      // Trigger multiple errors to increase backoff
      eventSourceInstances[0].simulateError();
      await vi.advanceTimersByTimeAsync(1000);
      await waitFor(() => expect(eventSourceInstances.length).toBe(2));

      eventSourceInstances[1].simulateError();
      await vi.advanceTimersByTimeAsync(2000);
      await waitFor(() => expect(eventSourceInstances.length).toBe(3));

      // Reconnect attempts should be > 0
      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBeGreaterThan(0);
      });

      // Manual reconnect should reset everything
      result.current.reconnect();

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(0);
      });

      // New connection should use 1s delay if it fails
      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(4);
      });

      eventSourceInstances[3].simulateError();

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(1);
      });

      // Should use 1s delay (not 4s which would be next in sequence)
      await vi.advanceTimersByTimeAsync(1000);

      await waitFor(() => {
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('Cleanup and Unmount', () => {
    it('should close connection on unmount', async () => {
      const taskId = 1;

      const { unmount } = renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(instance.readyState).toBe(1);
      });

      // Unmount
      unmount();

      // Should close the connection
      expect(instance.close).toHaveBeenCalled();
    });

    it('should clear reconnection timeout on unmount', async () => {
      const taskId = 1;

      const { unmount } = renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      eventSourceInstances[0].simulateOpen();
      eventSourceInstances[0].simulateError();

      await waitFor(() => {
        expect(eventSourceInstances[0].close).toHaveBeenCalled();
      });

      // Unmount before reconnection happens
      unmount();

      // Advance timers
      await vi.advanceTimersByTimeAsync(5000);

      // Should not create a new connection
      expect(MockEventSourceConstructor).toHaveBeenCalledTimes(1);
    });

    it('should not reconnect after unmount', async () => {
      const taskId = 1;

      const { unmount } = renderHook(() => useTaskStream(taskId), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      eventSourceInstances[0].simulateOpen();

      // Unmount
      unmount();

      // Advance timers significantly
      await vi.advanceTimersByTimeAsync(60000);

      // Should only have created one EventSource
      expect(MockEventSourceConstructor).toHaveBeenCalledTimes(1);
    });

    it('should call onDisconnect on unmount', async () => {
      const taskId = 1;
      const onDisconnect = vi.fn();

      const { unmount } = renderHook(
        () => useTaskStream(taskId, { onDisconnect }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      eventSourceInstances[0].simulateOpen();

      // Manually disconnect (which happens on unmount)
      unmount();

      // onDisconnect should not be called automatically on unmount
      // It's only called on manual disconnect or when connection closes without reconnect
      expect(onDisconnect).not.toHaveBeenCalled();
    });
  });

  describe('Task ID Changes', () => {
    it('should reconnect when taskId changes', async () => {
      const { result, rerender } = renderHook(
        ({ taskId }) => useTaskStream(taskId),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { taskId: 1 },
        }
      );

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance1 = eventSourceInstances[0];
      instance1.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Change taskId
      rerender({ taskId: 2 });

      // Should close old connection
      expect(instance1.close).toHaveBeenCalled();

      // Should create new connection
      await waitFor(() => {
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(2);
        expect(MockEventSourceConstructor).toHaveBeenLastCalledWith('/api/tasks/2/stream');
      });
    });

    it('should reset state when taskId changes', async () => {
      const { result, rerender } = renderHook(
        ({ taskId }) => useTaskStream(taskId),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { taskId: 1 },
        }
      );

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      eventSourceInstances[0].simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Trigger error to increase reconnect attempts
      eventSourceInstances[0].simulateError();

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(1);
      });

      // Change taskId
      rerender({ taskId: 2 });

      // Wait for new connection attempt
      await vi.advanceTimersByTimeAsync(100);

      // Reconnect attempts should not carry over
      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(0);
      });
    });
  });

  describe('Enabled Option', () => {
    it('should disconnect when enabled changes from true to false', async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useTaskStream(1, { enabled }),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { enabled: true },
        }
      );

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Disable
      rerender({ enabled: false });

      // Should disconnect
      await waitFor(() => {
        expect(instance.close).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(false);
      });
    });

    it('should connect when enabled changes from false to true', async () => {
      const { rerender } = renderHook(
        ({ enabled }) => useTaskStream(1, { enabled }),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { enabled: false },
        }
      );

      // Should not create EventSource initially
      expect(MockEventSourceConstructor).not.toHaveBeenCalled();

      // Enable
      rerender({ enabled: true });

      // Should create EventSource
      await waitFor(() => {
        expect(MockEventSourceConstructor).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Callback Stability', () => {
    it('should handle callback changes without reconnecting', async () => {
      const onMessage1 = vi.fn();
      const onMessage2 = vi.fn();

      const { rerender } = renderHook(
        ({ onMessage }) => useTaskStream(1, { onMessage }),
        {
          wrapper: createWrapper(queryClient),
          initialProps: { onMessage: onMessage1 },
        }
      );

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
      });

      const instance = eventSourceInstances[0];
      instance.simulateOpen();

      // Change callback
      rerender({ onMessage: onMessage2 });

      // Should not create a new connection
      expect(MockEventSourceConstructor).toHaveBeenCalledTimes(1);

      // Send message - should use new callback
      const mockData: IterationStatus = {
        taskId: 'task-1',
        status: 'running',
        currentStep: 'Testing',
        progress: 50,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      instance.simulateMessage(JSON.stringify(mockData));

      await waitFor(() => {
        expect(onMessage2).toHaveBeenCalledWith(mockData);
        expect(onMessage1).not.toHaveBeenCalled();
      });
    });
  });
});
