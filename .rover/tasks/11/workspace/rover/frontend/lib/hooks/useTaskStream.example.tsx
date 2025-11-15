/**
 * Example usage of the useTaskStream hook
 *
 * This file demonstrates how to integrate real-time task updates
 * into your React components using Server-Sent Events.
 */

import { useTaskStream } from './useTaskStream';
import { useTaskQuery } from './useTask';

/**
 * Example 1: Basic usage - Monitor task status
 */
export function TaskStatusMonitor({ taskId }: { taskId: number }) {
  const { isConnected, error, reconnectAttempts } = useTaskStream(taskId);

  return (
    <div className="task-monitor">
      <div className="status">
        {isConnected ? (
          <span className="text-green-600">🟢 Live Updates Active</span>
        ) : (
          <span className="text-red-600">🔴 Disconnected</span>
        )}
      </div>

      {reconnectAttempts > 0 && (
        <div className="text-yellow-600">
          Reconnecting... (attempt {reconnectAttempts})
        </div>
      )}

      {error && (
        <div className="text-red-600">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Display real-time task progress
 */
export function TaskProgressDisplay({ taskId }: { taskId: number }) {
  const { data: task } = useTaskQuery(taskId);
  const { isConnected } = useTaskStream(taskId, {
    onMessage: (data) => {
      console.log('Progress update:', data.progress, data.currentStep);
    },
  });

  return (
    <div className="task-progress">
      <h3>{task?.title}</h3>

      <div className="flex items-center gap-2">
        <div className="progress-bar">
          {/* Progress will be automatically updated via React Query cache */}
        </div>

        {isConnected && (
          <span className="text-xs text-gray-500">Live</span>
        )}
      </div>
    </div>
  );
}

/**
 * Example 3: Conditional streaming (only for active tasks)
 */
export function ConditionalTaskStream({ taskId }: { taskId: number }) {
  const { data: task } = useTaskQuery(taskId);

  const isActive = task?.status === 'IN_PROGRESS' || task?.status === 'ITERATING';

  const { isConnected, error } = useTaskStream(taskId, {
    enabled: isActive, // Only stream when task is active
    onConnect: () => {
      console.log(`Started streaming task ${taskId}`);
    },
    onDisconnect: () => {
      console.log(`Stopped streaming task ${taskId}`);
    },
    onError: (err) => {
      console.error(`Stream error for task ${taskId}:`, err);
    },
  });

  if (!isActive) {
    return <div>Task is not active</div>;
  }

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}

/**
 * Example 4: Manual reconnection control
 */
export function ManualStreamControl({ taskId }: { taskId: number }) {
  const { isConnected, reconnect, disconnect } = useTaskStream(taskId);

  return (
    <div className="stream-controls">
      <button
        onClick={reconnect}
        disabled={isConnected}
        className="btn-primary"
      >
        {isConnected ? 'Connected' : 'Reconnect'}
      </button>

      <button
        onClick={disconnect}
        disabled={!isConnected}
        className="btn-secondary"
      >
        Disconnect
      </button>
    </div>
  );
}

/**
 * Example 5: Toast notifications on status changes
 */
export function TaskWithNotifications({ taskId }: { taskId: number }) {
  const { isConnected } = useTaskStream(taskId, {
    onMessage: (data) => {
      // Show toast notification when status changes
      if (data.status === 'completed') {
        // toast.success('Task completed successfully!');
        console.log('Task completed!');
      } else if (data.status === 'failed') {
        // toast.error(`Task failed: ${data.error || 'Unknown error'}`);
        console.error('Task failed:', data.error);
      } else {
        // toast.info(`Task update: ${data.currentStep}`);
        console.log('Task update:', data.currentStep);
      }
    },
    onError: (err) => {
      // toast.error(`Connection error: ${err.message}`);
      console.error('Connection error:', err.message);
    },
  });

  return (
    <div>
      {isConnected && <div>Monitoring task {taskId}...</div>}
    </div>
  );
}

/**
 * Example 6: Integration with task detail page
 */
export function TaskDetailPage({ taskId }: { taskId: number }) {
  const { data: task, isLoading } = useTaskQuery(taskId);

  // Automatically stream updates when viewing the task
  const { isConnected, error } = useTaskStream(taskId, {
    onMessage: (update) => {
      // The hook automatically updates the React Query cache,
      // so task data will be updated automatically
      console.log('Received update:', update);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="task-detail">
      <header>
        <h1>{task.title}</h1>
        {isConnected && (
          <span className="badge badge-success">Live</span>
        )}
      </header>

      <section>
        <p>Status: {task.status}</p>
        <p>Iterations: {task.iterations}</p>
        {/* Other task details... */}
      </section>

      {error && (
        <div className="alert alert-error">
          Stream connection error: {error.message}
        </div>
      )}
    </div>
  );
}
