# useTaskStream Hook Documentation

## Overview

The `useTaskStream` hook provides real-time task status updates via Server-Sent Events (SSE) with automatic React Query cache synchronization. It includes intelligent reconnection logic with exponential backoff and comprehensive error handling.

## Location

`/home/user/skills-claude/rover/frontend/lib/hooks/useTaskStream.ts`

## Features

### Core Functionality
- ✅ **EventSource Management**: Automatic connection lifecycle management
- ✅ **React Query Integration**: Updates cache for `['task', taskId]` query key
- ✅ **Connection State**: Tracks `isConnected` state in real-time
- ✅ **Heartbeat Handling**: Automatically ignores SSE heartbeat messages
- ✅ **Automatic Cleanup**: Properly closes connections on unmount

### Advanced Features
- ✅ **Exponential Backoff**: Reconnects with delays: 1s → 2s → 4s → 8s → 16s → 30s (max)
- ✅ **Reconnection Tracking**: Exposes current reconnection attempt count
- ✅ **Manual Control**: Provides `reconnect()` and `disconnect()` functions
- ✅ **Conditional Streaming**: Can be enabled/disabled via `enabled` option
- ✅ **Event Callbacks**: Hooks for connect, disconnect, error, and message events

## API Reference

### Hook Signature

```typescript
function useTaskStream(
  taskId: number,
  options?: TaskStreamOptions
): TaskStreamResult
```

### Parameters

#### `taskId: number` (required)
The ID of the task to stream updates for.

#### `options: TaskStreamOptions` (optional)
Configuration object with the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Whether to enable the stream |
| `onConnect` | `() => void` | `undefined` | Callback when connection opens |
| `onDisconnect` | `() => void` | `undefined` | Callback when connection closes |
| `onError` | `(error: Error) => void` | `undefined` | Callback when error occurs |
| `onMessage` | `(data: IterationStatus) => void` | `undefined` | Callback when message received |

### Return Value

Returns a `TaskStreamResult` object:

| Property | Type | Description |
|----------|------|-------------|
| `isConnected` | `boolean` | Current connection status |
| `error` | `Error \| null` | Current error (if any) |
| `reconnectAttempts` | `number` | Number of reconnection attempts |
| `reconnect` | `() => void` | Manually reconnect to stream |
| `disconnect` | `() => void` | Manually disconnect from stream |

## Implementation Details

### SSE Endpoint

The hook connects to: `/api/tasks/${taskId}/stream`

### Message Format

Expected SSE message format:
```json
{
  "taskId": "uuid-string",
  "status": "running",
  "currentStep": "Installing dependencies",
  "progress": 45,
  "startedAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:35:00Z"
}
```

### Cache Updates

When a message is received, the hook updates the React Query cache:

```typescript
queryClient.setQueryData<InspectTaskResponse>(
  taskKeys.inspect(taskId),
  (old) => ({
    ...old,
    currentIterationStatus: messageData,
  })
);
```

It also invalidates the task detail query to ensure consistency across all queries.

### Reconnection Logic

**Exponential Backoff Schedule:**
- Attempt 1: 1 second delay
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay
- Attempt 4: 8 seconds delay
- Attempt 5: 16 seconds delay
- Attempt 6+: 30 seconds delay (max)

**Reset Conditions:**
- Successful connection resets the backoff timer
- Manual `reconnect()` call resets the backoff timer
- Successful message reception indicates healthy connection

### Error Handling

The hook handles several error scenarios:

1. **Connection Errors**: Automatic reconnection with exponential backoff
2. **Parse Errors**: Logged to console, triggers `onError` callback
3. **Server Disconnects**: Triggers reconnection logic
4. **Network Issues**: Handles via EventSource's built-in error handling

## Usage Examples

### Basic Usage

```typescript
import { useTaskStream } from '@/lib/hooks';

function TaskMonitor({ taskId }: { taskId: number }) {
  const { isConnected, error } = useTaskStream(taskId);

  return (
    <div>
      Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### With React Query Integration

```typescript
import { useTaskStream, useTaskQuery } from '@/lib/hooks';

function TaskDetail({ taskId }: { taskId: number }) {
  const { data: task } = useTaskQuery(taskId);
  const { isConnected } = useTaskStream(taskId);

  // The task data will automatically update when SSE messages arrive
  return (
    <div>
      <h1>{task?.title}</h1>
      <p>Status: {task?.status}</p>
      {isConnected && <span className="badge">Live</span>}
    </div>
  );
}
```

### Conditional Streaming (Active Tasks Only)

```typescript
function SmartTaskMonitor({ taskId }: { taskId: number }) {
  const { data: task } = useTaskQuery(taskId);
  const isActive = task?.status === 'IN_PROGRESS' || task?.status === 'ITERATING';

  const { isConnected } = useTaskStream(taskId, {
    enabled: isActive, // Only stream for active tasks
  });

  return (
    <div>
      {isActive ? 'Task is running' : 'Task is idle'}
      {isConnected && ' (streaming updates)'}
    </div>
  );
}
```

### With Event Callbacks

```typescript
function TaskWithNotifications({ taskId }: { taskId: number }) {
  const { isConnected } = useTaskStream(taskId, {
    onConnect: () => {
      console.log('Started streaming');
    },
    onMessage: (data) => {
      if (data.status === 'completed') {
        toast.success('Task completed!');
      }
    },
    onError: (err) => {
      toast.error(`Connection error: ${err.message}`);
    },
  });

  return <div>{/* Your component UI */}</div>;
}
```

### Manual Connection Control

```typescript
function ManualControl({ taskId }: { taskId: number }) {
  const { isConnected, reconnect, disconnect, reconnectAttempts } = useTaskStream(taskId);

  return (
    <div>
      <button onClick={reconnect} disabled={isConnected}>
        Reconnect
      </button>
      <button onClick={disconnect} disabled={!isConnected}>
        Disconnect
      </button>
      {reconnectAttempts > 0 && (
        <p>Reconnecting... (attempt {reconnectAttempts})</p>
      )}
    </div>
  );
}
```

## Type Definitions

```typescript
export interface TaskStreamOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (data: IterationStatus) => void;
}

export interface TaskStreamResult {
  isConnected: boolean;
  error: Error | null;
  reconnectAttempts: number;
  reconnect: () => void;
  disconnect: () => void;
}
```

## Dependencies

- `react` - Core React hooks (useState, useEffect, useRef)
- `@tanstack/react-query` - For cache management
- `@/types/api` - Type definitions for API responses
- `@/types/iteration` - Type definitions for iteration status
- `./useTasks` - For taskKeys query key factory

## Testing Considerations

When testing components that use `useTaskStream`:

1. **Mock EventSource**: Create a mock EventSource class
2. **Test Reconnection**: Verify exponential backoff behavior
3. **Test Cache Updates**: Verify React Query cache is updated correctly
4. **Test Cleanup**: Ensure connections are closed on unmount
5. **Test Error Handling**: Verify error callbacks and state updates

Example mock:
```typescript
global.EventSource = jest.fn().mockImplementation((url) => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
}));
```

## Performance Considerations

- **Memory Efficient**: Automatically cleans up connections
- **Network Efficient**: Heartbeats are ignored without processing
- **Cache Efficient**: Updates specific query keys, not entire cache
- **CPU Efficient**: JSON parsing only when needed

## Browser Compatibility

EventSource is supported in all modern browsers:
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Opera: ✅ Full support

**Note**: EventSource is not supported in IE11. Consider polyfills if needed.

## Troubleshooting

### Connection Keeps Dropping

1. Check server-side SSE implementation
2. Verify `/api/tasks/${taskId}/stream` endpoint exists
3. Check for CORS issues
4. Verify server sends proper SSE format

### Cache Not Updating

1. Ensure `taskKeys.inspect(taskId)` matches your query keys
2. Verify message format matches `IterationStatus` type
3. Check React Query DevTools for cache updates

### High Reconnection Attempts

1. Verify server stability
2. Check network connectivity
3. Consider increasing max retry delay
4. Implement server-side health checks

## Related Hooks

- `useTaskQuery` - Fetch single task details
- `useInspectTaskQuery` - Inspect task with detailed info
- `useTaskLogsStream` - Stream task logs via SSE
- `useTasks` - Manage task list

## References

- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [React Query Cache Updates](https://tanstack.com/query/latest/docs/react/guides/updates-from-mutation-responses)
- [Exponential Backoff Pattern](https://en.wikipedia.org/wiki/Exponential_backoff)
