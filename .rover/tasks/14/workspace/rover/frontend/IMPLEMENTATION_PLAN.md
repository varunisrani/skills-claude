# Rover Frontend Implementation Plan

## Overview

This document provides a complete plan for building a Next.js frontend that manages Rover AI agent tasks through a web UI. The frontend executes Rover CLI commands in the background and provides real-time status updates.

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Complete Command Coverage](#complete-command-coverage)
4. [Technology Stack](#technology-stack)
5. [File Structure](#file-structure)
6. [Implementation Phases](#implementation-phases)
7. [Key Features](#key-features)
8. [API Endpoints](#api-endpoints)
9. [UI Components](#ui-components)
10. [Real-Time Updates](#real-time-updates)
11. [Security & Best Practices](#security--best-practices)

---

## 🎯 Executive Summary

### What We're Building

A production-ready Next.js 16 web application that:
- ✅ Manages Rover projects through a modern UI
- ✅ Executes all 15 Rover CLI commands via API routes
- ✅ Provides real-time task status updates using Server-Sent Events
- ✅ Displays logs, diffs, and iteration history
- ✅ Handles project initialization, task creation, iteration, and merging
- ✅ Shows live progress of AI agents working on tasks

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Task Management** | Create, monitor, stop, restart, and delete tasks |
| **Real-Time Monitoring** | Live status updates via SSE and file watching |
| **Iteration Support** | Add refinement instructions and track iterations |
| **Git Integration** | View diffs, merge changes, push to GitHub |
| **Log Viewing** | Terminal-style log viewer with syntax highlighting |
| **Multi-Agent Support** | Claude, Gemini, Codex, Qwen, Cursor |
| **Workflow Management** | SWE and Tech Writer workflows |

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Task View   │  │  Settings    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                  │                                 │
│  ┌──────▼──────────────────▼────────────────────────┐      │
│  │    TanStack Query (State Management)             │      │
│  └──────┬───────────────────────────────────────────┘      │
│         │                                                    │
│  ┌──────▼────────────────────────────────────────────┐     │
│  │         Server-Sent Events (SSE)                  │     │
│  │  Real-time updates from file system changes      │     │
│  └──────┬────────────────────────────────────────────┘     │
└─────────┼──────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────┐
│              Next.js API Routes (Node.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  RoverCLI    │  │ FileWatcher  │  │  Validators  │     │
│  │  Executor    │  │  (chokidar)  │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
└─────────┼──────────────────┼────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Rover CLI (Subprocess)                     │
│     rover task | list | inspect | iterate | merge ...       │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│               File System (.rover/ directory)                │
│  • tasks/<id>/task.json                                     │
│  • tasks/<id>/iterations/<n>/status.json                    │
│  • tasks/<id>/iterations/<n>/logs/                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → UI Component
2. **Component** → API Route (HTTP POST/GET)
3. **API Route** → RoverCLI.execute() → Spawns `rover` subprocess
4. **CLI** → Writes to `.rover/` files
5. **FileWatcher** → Detects changes → Emits events
6. **SSE** → Pushes updates to browser
7. **Browser** → TanStack Query updates → React re-renders

---

## 📝 Complete Command Coverage

### All 15 Rover Commands Mapped to UI

| # | CLI Command | UI Component | API Endpoint | Description |
|---|-------------|--------------|--------------|-------------|
| 1 | `rover init` | InitWizard | `POST /api/init` | Initialize project |
| 2 | `rover task` | CreateTaskForm | `POST /api/tasks` | Create new task |
| 3 | `rover list` | TaskList | `GET /api/tasks` | List all tasks |
| 4 | `rover inspect <id>` | TaskDetailView | `GET /api/tasks/:id/inspect` | View task details |
| 5 | `rover logs <id>` | LogViewer | `GET /api/tasks/:id/logs` | View execution logs |
| 6 | `rover iterate <id>` | IterationForm | `POST /api/tasks/:id/iterate` | Add iteration |
| 7 | `rover restart <id>` | RestartButton | `POST /api/tasks/:id/restart` | Restart task |
| 8 | `rover stop <id>` | StopButton | `POST /api/tasks/:id/stop` | Stop task |
| 9 | `rover delete <id>` | DeleteButton | `DELETE /api/tasks/:id` | Delete task |
| 10 | `rover diff <id>` | DiffViewer | `GET /api/tasks/:id/diff` | View git diff |
| 11 | `rover merge <id>` | MergeButton | `POST /api/tasks/:id/merge` | Merge changes |
| 12 | `rover push <id>` | PushButton | `POST /api/tasks/:id/push` | Push to GitHub |
| 13 | `rover shell <id>` | ShellAccessCard | `POST /api/tasks/:id/shell` | Shell command |
| 14 | `rover workflows list` | WorkflowSelector | `GET /api/workflows` | List workflows |
| 15 | `rover workflows inspect` | WorkflowViewer | `GET /api/workflows/:name` | View workflow |

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js 16** - App Router with Server Components
- **React 19** - UI library
- **TypeScript 5+** - Type safety
- **Tailwind CSS 4** - Styling

### State Management
- **TanStack Query v5** - Server state, caching, refetching
- **Zustand** - Client UI state (modals, filters)
- **Server-Sent Events** - Real-time updates

### UI Components
- **shadcn/ui** - Component library
- **Radix UI** - Headless components
- **Lucide React** - Icons
- **xterm.js** - Terminal emulator
- **react-diff-view** - Diff visualization

### Backend (API Routes)
- **Node.js child_process** - Execute CLI commands
- **chokidar** - File system watching
- **zod** - Validation

---

## 📁 File Structure

```
rover/frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout
│   │   ├── page.tsx                # Task list page
│   │   └── tasks/
│   │       ├── [id]/
│   │       │   ├── page.tsx        # Task detail
│   │       │   ├── logs/
│   │       │   │   └── page.tsx    # Logs page
│   │       │   └── iterations/
│   │       │       └── [n]/
│   │       │           └── page.tsx # Iteration detail
│   │       └── new/
│   │           └── page.tsx        # Create task
│   │
│   ├── settings/
│   │   └── page.tsx                # Settings
│   │
│   ├── api/
│   │   ├── init/route.ts           # POST initialize
│   │   ├── tasks/
│   │   │   ├── route.ts            # GET/POST tasks
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET/DELETE task
│   │   │       ├── stream/route.ts # SSE endpoint
│   │   │       ├── logs/route.ts   # GET logs
│   │   │       ├── diff/route.ts   # GET diff
│   │   │       ├── iterate/route.ts # POST iterate
│   │   │       ├── restart/route.ts # POST restart
│   │   │       ├── stop/route.ts   # POST stop
│   │   │       ├── merge/route.ts  # POST merge
│   │   │       └── push/route.ts   # POST push
│   │   └── config/route.ts         # GET config
│   │
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
│
├── components/
│   ├── ui/                         # shadcn components
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   ├── CreateTaskForm.tsx
│   │   ├── TaskStatusBadge.tsx
│   │   └── TaskTimeline.tsx
│   ├── iterations/
│   │   ├── IterationList.tsx
│   │   ├── IterationCard.tsx
│   │   └── IterateForm.tsx
│   ├── logs/
│   │   ├── LogViewer.tsx           # xterm.js
│   │   └── LogControls.tsx
│   ├── diff/
│   │   ├── DiffViewer.tsx
│   │   └── FileTree.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── api/
│   │   ├── rover-cli.ts            # CLI executor
│   │   └── file-watcher.ts         # File watcher
│   ├── hooks/
│   │   ├── useTasks.ts             # React Query
│   │   ├── useTaskStream.ts        # SSE
│   │   └── useLogs.ts
│   ├── stores/
│   │   └── ui-store.ts             # Zustand
│   └── utils/
│       ├── format.ts
│       └── validation.ts
│
├── types/
│   ├── api.ts
│   ├── task.ts
│   └── iteration.ts
│
└── package.json
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Set up project structure and basic infrastructure

- [ ] Initialize Next.js project with TypeScript
- [ ] Install dependencies (TanStack Query, Zustand, shadcn/ui)
- [ ] Create file structure
- [ ] Set up Tailwind CSS
- [ ] Create TypeScript types from Rover schemas
- [ ] Implement `RoverCLI` executor class
- [ ] Create basic API route: `GET /api/tasks`
- [ ] Create basic API route: `POST /api/tasks`

**Deliverables**:
- Working Next.js app
- CLI executor service
- Basic types

### Phase 2: Core Task Management (Week 2)

**Goal**: Implement task creation, listing, and viewing

- [ ] Build `CreateTaskForm` component
- [ ] Implement `TaskList` component
- [ ] Create `TaskCard` component
- [ ] Build task detail page
- [ ] Add TanStack Query hooks
- [ ] Implement API routes for all task operations
- [ ] Add status badges and icons

**Deliverables**:
- Task creation form
- Task list view
- Task detail view
- Working API integration

### Phase 3: Real-Time Updates (Week 3)

**Goal**: Implement live status monitoring

- [ ] Create `FileWatcher` service with chokidar
- [ ] Implement SSE endpoint `/api/tasks/:id/stream`
- [ ] Build `useTaskStream` hook
- [ ] Add status indicator components
- [ ] Implement progress bars
- [ ] Add auto-refresh for task list
- [ ] Test reconnection logic

**Deliverables**:
- Real-time status updates
- Live progress tracking
- SSE implementation

### Phase 4: Advanced Features (Week 4)

**Goal**: Add iterations, logs, diffs, merge/push

- [ ] Build `LogViewer` with xterm.js
- [ ] Create `DiffViewer` component
- [ ] Implement `IterateForm`
- [ ] Add merge functionality
- [ ] Add push to GitHub
- [ ] Create iteration history view
- [ ] Build file tree for diffs

**Deliverables**:
- Log viewer
- Diff viewer
- Iteration support
- Git operations

### Phase 5: Polish & UX (Week 5)

**Goal**: Improve UX, add settings, error handling

- [ ] Implement comprehensive error handling
- [ ] Add loading states
- [ ] Create settings page
- [ ] Add notifications/toasts
- [ ] Implement keyboard shortcuts
- [ ] Add dark mode toggle
- [ ] Create help/documentation
- [ ] Add accessibility improvements

**Deliverables**:
- Polished UI
- Settings page
- Error handling
- Accessibility

### Phase 6: Testing & Deployment (Week 6)

**Goal**: Test and prepare for production

- [ ] Write unit tests for API routes
- [ ] Add component tests
- [ ] Test SSE connection recovery
- [ ] Performance optimization
- [ ] Add monitoring/analytics
- [ ] Create deployment guide
- [ ] Production build

**Deliverables**:
- Test coverage
- Optimized build
- Deployment ready

---

## ✨ Key Features

### 1. Project Initialization
```typescript
// User Flow:
// 1. Visit /settings
// 2. Click "Initialize Project"
// 3. Select project directory
// 4. Auto-detect languages, package managers
// 5. Rover creates rover.json and .rover/settings.json
```

### 2. Task Creation
```typescript
// User Flow:
// 1. Click "New Task" button
// 2. Fill form:
//    - Description (required)
//    - Workflow (SWE/Tech Writer)
//    - AI Agent (auto/claude/gemini/etc)
//    - Source branch
// 3. Submit → API executes: rover task -w swe -y "description"
// 4. Redirect to task detail page
// 5. Watch real-time progress via SSE
```

### 3. Real-Time Task Monitoring
```typescript
// Implementation:
// 1. SSE connection to /api/tasks/:id/stream
// 2. FileWatcher monitors .rover/tasks/:id/iterations/*/status.json
// 3. On file change → emit event → push to SSE
// 4. Browser receives update → TanStack Query updates cache
// 5. React re-renders with new status
```

### 4. Iteration Management
```typescript
// User Flow:
// 1. View completed task
// 2. Click "Iterate"
// 3. Add refinement instructions
// 4. Submit → rover iterate :id "instructions"
// 5. New iteration starts
// 6. Watch progress in real-time
```

### 5. Git Operations
```typescript
// Merge:
// 1. View diff in DiffViewer
// 2. Click "Merge" → rover merge :id
// 3. AI resolves conflicts if any
// 4. Show merge result

// Push:
// 1. Review changes
// 2. Click "Push to GitHub"
// 3. Enter commit message
// 4. rover push :id -m "message"
// 5. Creates GitHub PR automatically
```

---

## 🔌 API Endpoints

### Complete API Reference

#### Project Management
```typescript
POST /api/init
Request: { path?: string, yes?: boolean }
Response: { success: boolean, error?: string }
```

#### Task Operations
```typescript
// List all tasks
GET /api/tasks
Response: Task[]

// Create task
POST /api/tasks
Request: {
  description: string
  workflow?: 'swe' | 'tech-writer'
  agent?: string
  sourceBranch?: string
  targetBranch?: string
  fromGithub?: string
}
Response: { success: boolean, task?: Task }

// Get task
GET /api/tasks/:id
Response: Task

// Delete task
DELETE /api/tasks/:id
Response: { success: boolean }

// Real-time updates (SSE)
GET /api/tasks/:id/stream
Response: text/event-stream

// Logs
GET /api/tasks/:id/logs?iteration=1
Response: { logs: string, hasMore: boolean }

// Diff
GET /api/tasks/:id/diff?branch=main&file=path/to/file
Response: { diff: string, files: string[] }

// Iterate
POST /api/tasks/:id/iterate
Request: { instructions: string }
Response: { success: boolean }

// Restart
POST /api/tasks/:id/restart
Response: { success: boolean }

// Stop
POST /api/tasks/:id/stop
Request: { removeAll?: boolean }
Response: { success: boolean }

// Merge
POST /api/tasks/:id/merge
Request: { force?: boolean }
Response: { success: boolean }

// Push
POST /api/tasks/:id/push
Request: { message?: string }
Response: { success: boolean, prUrl?: string }

// Shell
POST /api/tasks/:id/shell
Request: { container?: boolean }
Response: { command: string }
```

#### Configuration
```typescript
GET /api/config
Response: {
  version: string
  languages: string[]
  packageManagers: string[]
  mcps: MCP[]
}

GET /api/workflows
Response: Workflow[]

GET /api/workflows/:name
Response: Workflow
```

---

## 🎨 UI Components

### Core Components

#### 1. CreateTaskForm
```typescript
// Features:
- Multi-line description textarea
- Workflow selector (dropdown)
- AI agent selector
- Source/target branch inputs
- GitHub issue import
- Validation
- Loading state
- Error display

// Props:
interface CreateTaskFormProps {
  onSuccess?: (task: Task) => void
}
```

#### 2. TaskCard
```typescript
// Features:
- Task title and description
- Status badge (color-coded)
- Progress bar (for in-progress tasks)
- Timestamp (created, updated)
- Actions menu (stop, delete, view)
- Agent icon
- Click to view details

// Props:
interface TaskCardProps {
  task: Task
  onDelete?: (id: number) => void
  onStop?: (id: number) => void
}
```

#### 3. LogViewer (xterm.js)
```typescript
// Features:
- Terminal-style display
- ANSI color support
- Auto-scroll toggle
- Search functionality
- Copy to clipboard
- Download logs
- Follow mode (tail -f)

// Props:
interface LogViewerProps {
  taskId: number
  iteration?: number
  follow?: boolean
}
```

#### 4. DiffViewer
```typescript
// Features:
- Split/unified view toggle
- Syntax highlighting
- File tree navigation
- Expand/collapse hunks
- Search in diff
- Line numbers
- Copy to clipboard

// Props:
interface DiffViewerProps {
  taskId: number
  branch?: string
  file?: string
}
```

#### 5. TaskStatusBadge
```typescript
// Status colors:
- NEW: gray
- IN_PROGRESS: blue (pulsing)
- ITERATING: purple (pulsing)
- COMPLETED: green
- FAILED: red
- MERGED: teal
- PUSHED: indigo

// Props:
interface TaskStatusBadgeProps {
  status: TaskStatus
  showIcon?: boolean
}
```

---

## 🔄 Real-Time Updates

### SSE Implementation

#### Server Side
```typescript
// app/api/tasks/[id]/stream/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = parseInt(params.id);
  const watcher = getFileWatcher();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send heartbeat every 30s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      // Listen for file changes
      const handler = (event: WatchEvent) => {
        if (event.taskId === taskId) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      };

      watcher.on('change', handler);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        watcher.off('change', handler);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### Client Side
```typescript
// lib/hooks/useTaskStream.ts
export function useTaskStream(taskId: number) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/tasks/${taskId}/stream`);

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      if (event.data === ': heartbeat') return;

      const data = JSON.parse(event.data);

      // Update React Query cache
      queryClient.setQueryData(['task', taskId], (old: any) => ({
        ...old,
        currentIterationStatus: data.data,
      }));
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // Automatic reconnection handled by EventSource
    };

    return () => eventSource.close();
  }, [taskId]);

  return { isConnected };
}
```

---

## 🔒 Security & Best Practices

### Security Measures

1. **Input Validation**
```typescript
// Validate all inputs before passing to CLI
import { z } from 'zod';

const CreateTaskSchema = z.object({
  description: z.string().min(10).max(5000),
  workflow: z.enum(['swe', 'tech-writer']).optional(),
  agent: z.string().optional(),
});
```

2. **Command Injection Prevention**
```typescript
// Never use shell interpolation
// BAD: exec(`rover task "${description}"`)
// GOOD: spawn('rover', ['task', description])

// Escape special characters
function escapeShellArg(arg: string): string {
  return arg.replace(/(["\s'$`\\])/g, '\\$1');
}
```

3. **Rate Limiting**
```typescript
// Implement rate limiting on API routes
import rateLimit from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  // ... handle request
}
```

4. **Error Sanitization**
```typescript
// Don't expose internal errors to client
function sanitizeError(error: any): string {
  // Log full error server-side
  console.error('Internal error:', error);

  // Return generic message to client
  return 'An error occurred. Please try again.';
}
```

### Best Practices

1. **Polling Strategy**
```typescript
// Adaptive polling based on task status
refetchInterval: (data) => {
  if (!data) return false; // Don't poll if no data

  switch (data.status) {
    case 'IN_PROGRESS':
    case 'ITERATING':
      return 3000; // 3s for active tasks
    case 'COMPLETED':
    case 'FAILED':
      return 30000; // 30s for completed
    case 'MERGED':
    case 'PUSHED':
      return false; // Stop polling
    default:
      return 10000; // 10s default
  }
}
```

2. **Optimistic Updates**
```typescript
// Optimistic delete
const deleteTask = useMutation({
  mutationFn: (id: number) => fetch(`/api/tasks/${id}`, { method: 'DELETE' }),
  onMutate: async (id) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: ['tasks'] });

    // Snapshot current state
    const previous = queryClient.getQueryData(['tasks']);

    // Optimistically update
    queryClient.setQueryData(['tasks'], (old: Task[]) =>
      old.filter(t => t.id !== id)
    );

    return { previous };
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context?.previous);
  },
});
```

3. **Connection Recovery**
```typescript
// Retry failed SSE connections
useEffect(() => {
  let reconnectTimer: NodeJS.Timeout;

  const connect = () => {
    const es = new EventSource(`/api/tasks/${taskId}/stream`);

    es.onerror = () => {
      es.close();
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return () => clearTimeout(reconnectTimer);
}, [taskId]);
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "next": "^16.0.1",
    "@tanstack/react-query": "^5.62.8",
    "zustand": "^5.0.2",
    "zod": "^3.23.8",
    "xterm": "^5.5.0",
    "xterm-addon-fit": "^0.10.0",
    "chokidar": "^4.0.3",
    "react-diff-view": "^3.3.1",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "lucide-react": "^0.468.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0"
  }
}
```

---

## 🎓 Next Steps

1. **Start with Phase 1** - Set up the foundation
2. **Review the architecture docs** - Read ROVER_CLI_COMMANDS.md and ROVER_ARCHITECTURE.md
3. **Create the file structure** - Follow the structure outlined above
4. **Implement incrementally** - One phase at a time
5. **Test continuously** - Test each feature as you build it

---

## 📚 Related Documentation

- [Rover CLI Commands Reference](./ROVER_CLI_COMMANDS.md) - Complete CLI command documentation
- [Rover Architecture Guide](./ROVER_ARCHITECTURE.md) - Internal architecture and data structures
- [Next.js Documentation](https://nextjs.org/docs) - Next.js App Router
- [TanStack Query](https://tanstack.com/query/latest) - Data fetching and caching
- [shadcn/ui](https://ui.shadcn.com/) - Component library

---

## ✅ Success Criteria

The frontend is complete when:

- [ ] All 15 Rover commands accessible via UI
- [ ] Real-time status updates working
- [ ] Task creation and management functional
- [ ] Logs displayed in terminal viewer
- [ ] Git diffs shown with syntax highlighting
- [ ] Iterations can be added and viewed
- [ ] Merge and push operations work
- [ ] Error handling comprehensive
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Test coverage > 80%
- [ ] Production build optimized

---

**Version**: 1.0
**Last Updated**: 2025-01-12
**Author**: Claude (Anthropic)
