# Rover Frontend - TanStack Query Hooks

This directory contains React Query hooks for managing Rover task operations.

## Overview

The hooks are organized into four main categories:

1. **Task List Operations** (`useTasks.ts`)
2. **Single Task Operations** (`useTask.ts`)
3. **Task Logs** (`useTaskLogs.ts`)
4. **Task Diffs** (`useTaskDiff.ts`)

## Installation

The required dependencies are already in `package.json`:

```bash
cd rover/frontend
npm install
```

## Setup

The `QueryProvider` is already configured in `app/layout.tsx` and wraps the entire application.

## Usage Examples

### Task List Operations

#### Fetch all tasks

```tsx
import { useTasksQuery } from '@/lib/hooks';

function TaskList() {
  const { data, isLoading, error } = useTasksQuery();

  if (isLoading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

#### Filter tasks by status

```tsx
import { useTasksQuery } from '@/lib/hooks';

function ActiveTasks() {
  const { data } = useTasksQuery({
    status: ['IN_PROGRESS', 'ITERATING']
  });

  return <div>{data?.data.length} active tasks</div>;
}
```

#### Create a new task

```tsx
import { useCreateTaskMutation } from '@/lib/hooks';

function CreateTaskForm() {
  const createTask = useCreateTaskMutation();

  const handleSubmit = (e) => {
    e.preventDefault();
    createTask.mutate({
      description: 'Implement user authentication',
      workflow: 'swe',
      agent: 'claude',
    }, {
      onSuccess: (task) => {
        console.log('Task created:', task);
      },
      onError: (error) => {
        console.error('Failed to create task:', error);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={createTask.isPending}
      >
        {createTask.isPending ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
```

#### Delete a task with optimistic updates

```tsx
import { useDeleteTaskMutation } from '@/lib/hooks';

function DeleteTaskButton({ taskId }) {
  const deleteTask = useDeleteTaskMutation();

  const handleDelete = () => {
    if (confirm('Are you sure?')) {
      deleteTask.mutate(taskId);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteTask.isPending}
    >
      Delete
    </button>
  );
}
```

### Single Task Operations

#### Fetch task details

```tsx
import { useTaskQuery } from '@/lib/hooks';

function TaskDetails({ taskId }) {
  const { data: task, isLoading } = useTaskQuery(taskId, {
    includeIterations: true,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{task.title}</h1>
      <p>Status: {task.status}</p>
      <p>Iterations: {task.iterations}</p>
    </div>
  );
}
```

#### Inspect task with detailed information

```tsx
import { useInspectTaskQuery } from '@/lib/hooks';

function TaskInspection({ taskId }) {
  const { data } = useInspectTaskQuery(taskId, {
    includeContainer: true,
  });

  return (
    <div>
      <h2>Task: {data?.task.title}</h2>
      {data?.container && (
        <p>Container: {data.container.id}</p>
      )}
      {data?.currentIteration && (
        <p>Current Iteration: {data.currentIteration.iteration}</p>
      )}
    </div>
  );
}
```

#### Stop a running task

```tsx
import { useStopTaskMutation } from '@/lib/hooks';

function StopTaskButton({ taskId }) {
  const stopTask = useStopTaskMutation();

  return (
    <button
      onClick={() => stopTask.mutate({ taskId, removeAll: false })}
      disabled={stopTask.isPending}
    >
      Stop Task
    </button>
  );
}
```

#### Restart a task

```tsx
import { useRestartTaskMutation } from '@/lib/hooks';

function RestartTaskButton({ taskId }) {
  const restartTask = useRestartTaskMutation();

  return (
    <button
      onClick={() => restartTask.mutate({ taskId })}
      disabled={restartTask.isPending}
    >
      Restart
    </button>
  );
}
```

#### Add an iteration

```tsx
import { useIterateTaskMutation } from '@/lib/hooks';

function AddIterationForm({ taskId }) {
  const iterateTask = useIterateTaskMutation();
  const [instructions, setInstructions] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    iterateTask.mutate({
      taskId,
      instructions,
      title: 'Additional refinements',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Enter iteration instructions..."
      />
      <button type="submit">Add Iteration</button>
    </form>
  );
}
```

### Task Logs

#### Fetch logs for a task

```tsx
import { useTaskLogsQuery } from '@/lib/hooks';

function TaskLogs({ taskId }) {
  const { data: logs } = useTaskLogsQuery(taskId);

  return (
    <pre className="bg-black text-white p-4">
      {logs?.logs}
    </pre>
  );
}
```

#### Follow logs in real-time

```tsx
import { useTaskLogsQuery } from '@/lib/hooks';

function LiveTaskLogs({ taskId }) {
  const { data } = useTaskLogsQuery(taskId, {
    follow: true, // Enables auto-refresh every 2 seconds
  });

  return (
    <div>
      <h3>Live Logs</h3>
      <pre>{data?.logs}</pre>
    </div>
  );
}
```

#### Fetch logs for specific iteration

```tsx
import { useTaskLogsQuery } from '@/lib/hooks';

function IterationLogs({ taskId, iteration }) {
  const { data } = useTaskLogsQuery(taskId, {
    iteration,
    tail: 100, // Get last 100 lines
  });

  return <pre>{data?.logs}</pre>;
}
```

#### Stream logs with SSE

```tsx
import { useTaskLogsStream } from '@/lib/hooks';

function StreamingLogs({ taskId }) {
  const { logs, isConnected, error } = useTaskLogsStream(taskId);

  return (
    <div>
      <div>
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      {error && <div>Error: {error.message}</div>}
      <pre>{logs}</pre>
    </div>
  );
}
```

### Task Diffs

#### Fetch git diff

```tsx
import { useTaskDiffQuery } from '@/lib/hooks';

function TaskDiff({ taskId }) {
  const { data: diff, isLoading } = useTaskDiffQuery(taskId);

  if (isLoading) return <div>Loading diff...</div>;

  return (
    <div>
      <h3>Changes</h3>
      <p>Files: {diff?.stats.filesChanged}</p>
      <p>+{diff?.stats.insertions} -{diff?.stats.deletions}</p>
      <pre>{diff?.diff}</pre>
    </div>
  );
}
```

#### Compare against a specific branch

```tsx
import { useTaskDiffQuery } from '@/lib/hooks';

function BranchComparison({ taskId }) {
  const { data } = useTaskDiffQuery(taskId, {
    branch: 'main',
  });

  return <pre>{data?.diff}</pre>;
}
```

#### Show changed files

```tsx
import { useTaskChangedFiles } from '@/lib/hooks';

function ChangedFilesList({ taskId }) {
  const { data: files } = useTaskChangedFiles(taskId);

  return (
    <ul>
      {files.map(file => (
        <li key={file}>{file}</li>
      ))}
    </ul>
  );
}
```

#### Display diff statistics

```tsx
import { useTaskDiffStats } from '@/lib/hooks';

function DiffStats({ taskId }) {
  const { data: stats } = useTaskDiffStats(taskId);

  if (!stats) return null;

  return (
    <div className="stats">
      <span>{stats.filesChanged} files</span>
      <span className="text-green-600">+{stats.insertions}</span>
      <span className="text-red-600">-{stats.deletions}</span>
    </div>
  );
}
```

#### Check if task has changes

```tsx
import { useTaskHasChanges } from '@/lib/hooks';

function TaskCard({ taskId }) {
  const hasChanges = useTaskHasChanges(taskId);

  return (
    <div>
      <h3>Task #{taskId}</h3>
      {hasChanges && <span className="badge">Has Changes</span>}
    </div>
  );
}
```

## Features

### Automatic Refetching

- **Window Focus**: Queries automatically refetch when the window regains focus
- **Adaptive Polling**: In-progress tasks are polled every 3-5 seconds
- **Manual Refetch**: All hooks expose a `refetch` function for manual updates

### Optimistic Updates

- **Delete Task**: Immediately removes task from cache, rolls back on error
- **Cache Invalidation**: Mutations automatically invalidate related queries

### Error Handling

```tsx
import { useTasksQuery } from '@/lib/hooks';

function TaskList() {
  const { data, error, isLoading, isError } = useTasksQuery();

  if (isError) {
    return (
      <div className="error">
        <h3>Error loading tasks</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  // ... rest of component
}
```

### Loading States

```tsx
import { useCreateTaskMutation } from '@/lib/hooks';

function CreateTask() {
  const createTask = useCreateTaskMutation();

  return (
    <button
      onClick={() => createTask.mutate({ description: '...' })}
      disabled={createTask.isPending}
    >
      {createTask.isPending ? 'Creating...' : 'Create Task'}
    </button>
  );
}
```

## Query Keys

All query keys are exported from `useTasks.ts` and follow a consistent pattern:

```typescript
import { taskKeys } from '@/lib/hooks';

// Access query keys
taskKeys.all              // ['tasks']
taskKeys.lists()          // ['tasks', 'list']
taskKeys.list(filters)    // ['tasks', 'list', filters]
taskKeys.detail(id)       // ['tasks', 'detail', id]
taskKeys.inspect(id)      // ['tasks', 'inspect', id]
taskKeys.logs(id, iter)   // ['tasks', 'logs', id, iteration]
taskKeys.diff(id, branch) // ['tasks', 'diff', id, branch, file]
```

## Advanced Usage

### Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/lib/hooks';

function TaskListItem({ taskId }) {
  const queryClient = useQueryClient();

  const prefetchTask = () => {
    queryClient.prefetchQuery({
      queryKey: taskKeys.detail(taskId),
      queryFn: () => fetch(`/api/tasks/${taskId}`).then(r => r.json()),
    });
  };

  return (
    <div onMouseEnter={prefetchTask}>
      Task #{taskId}
    </div>
  );
}
```

### Manual Cache Updates

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/lib/hooks';

function updateTaskInCache(taskId: number, updates: Partial<Task>) {
  const queryClient = useQueryClient();

  queryClient.setQueryData(
    taskKeys.detail(taskId),
    (old: Task) => ({ ...old, ...updates })
  );
}
```

## React Query Devtools

The devtools are automatically included in development mode. Access them via the floating icon in the bottom-right corner of your app.

Features:
- View all queries and their states
- Inspect query data
- Manually trigger refetches
- See query dependencies
- Monitor cache status

## API Endpoints Required

These hooks expect the following API endpoints to be implemented:

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create a task
- `GET /api/tasks/:id` - Get task details
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/:id/inspect` - Inspect task
- `POST /api/tasks/:id/stop` - Stop a task
- `POST /api/tasks/:id/restart` - Restart a task
- `POST /api/tasks/:id/iterate` - Add iteration
- `GET /api/tasks/:id/logs` - Get task logs
- `GET /api/tasks/:id/diff` - Get task diff

## TypeScript Support

All hooks are fully typed with TypeScript:

```typescript
import type { Task, TaskStatus, TaskSummary } from '@/types/task';
import type {
  CreateTaskRequest,
  ListTasksResponse
} from '@/types/api';
```

## Best Practices

1. **Use query keys consistently** - Import `taskKeys` for cache invalidation
2. **Handle loading and error states** - Always check `isLoading` and `error`
3. **Leverage optimistic updates** - For better UX on mutations
4. **Disable queries when needed** - Use `enabled: false` option
5. **Cleanup on unmount** - React Query handles this automatically

## Troubleshooting

### Query not refetching

Check the `staleTime` and `refetchOnWindowFocus` options:

```tsx
const { data } = useTaskQuery(id, {
  // Override default stale time
  staleTime: 0, // Always consider data stale
});
```

### Mutation not updating cache

Ensure query invalidation is working:

```tsx
const createTask = useCreateTaskMutation();

createTask.mutate(data, {
  onSuccess: () => {
    // Manual invalidation if needed
    queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
  },
});
```

### TypeScript errors

Make sure all types are imported from the correct locations:

```tsx
import type { Task } from '@/types/task';
import type { CreateTaskRequest } from '@/types/api';
```
