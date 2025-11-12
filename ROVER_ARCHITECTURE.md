# Rover Architecture & Data Structures Analysis

## Overview

Rover is a TypeScript-based CLI system that helps developers and AI agents execute workflows in containerized environments. The system is architected around a file-based storage model with JSON metadata files and containerized execution through Docker/Podman.

## 1. Directory Structure

```
project-root/
├── rover.json                           # Project-level configuration
├── .rover/                              # Rover workspace directory
│   ├── settings.json                    # User settings (not committed)
│   └── tasks/
│       └── <task_id>/
│           ├── description.json         # Task metadata
│           ├── workspace/               # Git worktree for task
│           ├── iterations/
│           │   └── <iteration_number>/
│           │       ├── iteration.json   # Iteration configuration
│           │       ├── status.json      # Real-time iteration status
│           │       ├── summary.md       # Agent output summary
│           │       ├── plan.md          # Agent generated plan
│           │       └── [other .md files]
│           └── workflows/
│               └── <workflow_name>.yaml # Workflow definition
```

## 2. Task Data Model

### File Location
`~/.rover/tasks/<task_id>/description.json`

### TaskDescriptionSchema (Complete Structure)

```typescript
{
  // Core Identity
  id: number;                    // Numeric task identifier
  uuid: string;                  // UUID4 unique identifier
  title: string;                 // Human-readable task title
  description: string;           // Full task description

  // Configuration Inputs
  inputs: Record<string, string>; // Key-value pairs for workflow inputs
  workflowName: string;          // Name of workflow to execute (e.g., "swe")
  agent?: string;                // AI agent to use (e.g., "claude", "gemini")
  sourceBranch?: string;         // Original git branch task was created from

  // Status & Lifecycle
  status: TaskStatus;            // Current task status (see below)
  version: string;               // Schema version (e.g., "1.1")

  // Timestamps (ISO 8601 format)
  createdAt: string;             // When task was created
  startedAt?: string;            // When task execution started
  completedAt?: string;          // When task completed successfully
  failedAt?: string;             // When task failed
  lastIterationAt?: string;       // Last iteration timestamp
  lastStatusCheck?: string;       // Last status update timestamp

  // Execution Context
  iterations: number;            // Total iteration count
  worktreePath: string;          // Path to git worktree (relative)
  branchName: string;            // Git branch name for this task

  // Container Execution
  containerId?: string;          // Docker/Podman container ID
  executionStatus?: string;      // Container status (running, completed, failed)
  runningAt?: string;            // When container started
  errorAt?: string;              // When error occurred
  exitCode?: number;             // Container exit code

  // Error Handling
  error?: string;                // Error message if failed
  
  // Restart Tracking
  restartCount?: number;         // Number of restart attempts
  lastRestartAt?: string;        // Timestamp of last restart
}
```

### TaskStatus Values
```
'NEW'           // Not yet started
'IN_PROGRESS'   // Started, awaiting execution
'ITERATING'     // Currently running iterations
'COMPLETED'     // Successfully finished
'FAILED'        // Execution failed
'MERGED'        // Changes merged to main
'PUSHED'        // Changes pushed to remote
```

## 3. Iteration Data Model

### File Location
`.rover/tasks/<task_id>/iterations/<iteration_number>/iteration.json`

### IterationSchema

```typescript
{
  // Metadata
  version: string;               // Schema version (e.g., "1.0")
  id: number;                    // Task ID
  iteration: number;             // Iteration sequence number (1, 2, 3...)
  
  // Configuration
  title: string;                 // Iteration title
  description: string;           // Iteration description
  createdAt: string;             // ISO timestamp of creation
  
  // Previous Context (for iteration #2+)
  previousContext: {
    plan?: string;               // Content from previous plan.md
    summary?: string;            // Content from previous summary.md
    iterationNumber?: number;    // Number of previous iteration
  }
}
```

## 4. Iteration Status Tracking

### File Location
`.rover/tasks/<task_id>/iterations/<iteration_number>/status.json`

### IterationStatusSchema

```typescript
{
  taskId: string;                // Task ID as string
  status: IterationStatusName;   // Current status
  
  // Progress Tracking
  currentStep: string;           // Name of current execution step
  progress: number;              // Progress percentage (0-100)
  
  // Timestamps (ISO 8601)
  startedAt: string;             // When iteration started
  updatedAt: string;             // Last update time
  completedAt?: string;          // When completed
  
  // Error Tracking
  error?: string;                // Error message if failed
}
```

### IterationStatusName Values
```
'initializing'  // Setting up execution environment
'running'       // Currently executing
'completed'     // Successfully finished
'failed'        // Execution failed
```

## 5. Configuration Files

### Project Configuration
**File**: `rover.json` (committed to repo)

```typescript
{
  version: string;               // Schema version (e.g., "1.2")
  
  // Environment Information
  languages: LANGUAGE[];         // Detected languages
  packageManagers: PACKAGE_MANAGER[];  // Detected managers
  taskManagers: TASK_MANAGER[];  // Detected task runners
  mcps: MCP[];                   // Model Context Protocol servers
  
  // Preferences
  attribution: boolean;          // Include attribution in commits
  envs?: string[];               // Custom environment variables
  envsFile?: string;             // Path to .env file
}
```

#### Supported Values

**Languages**:
```typescript
'javascript' | 'typescript' | 'php' | 'rust' | 'go' | 'python' | 'ruby'
```

**Package Managers**:
```typescript
'pnpm' | 'npm' | 'yarn' | 'composer' | 'cargo' | 'gomod' | 'pip' | 'poetry' | 'uv' | 'rubygems'
```

**Task Managers**:
```typescript
'just' | 'make' | 'task'
```

**MCP Configuration**:
```typescript
{
  name: string;                  // MCP server name
  commandOrUrl: string;          // Command or URL to invoke
  transport: string;             // Transport protocol
  envs?: string[];               // Environment variables
  headers?: string[];            // HTTP headers (for URL-based)
}
```

### User Settings
**File**: `.rover/settings.json` (not committed)

```typescript
{
  version: string;               // Schema version (e.g., "1.0")
  aiAgents: AI_AGENT[];          // Available AI agents
  defaults: {
    aiAgent?: AI_AGENT;          // Default agent to use
  }
}
```

**Supported AI Agents**:
```
'claude' | 'gemini' | 'codex' | 'qwen' | 'cursor'
```

## 6. Task Access & Loading

### Loading All Tasks

The system provides a `TaskDescriptionStore` class to retrieve all tasks:

```typescript
import { TaskDescriptionStore } from 'rover-schemas';

// Get all tasks
const tasks = TaskDescriptionStore.getAllDescriptions();
// Returns: TaskDescriptionManager[]

// Filter by status
const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
```

### Loading Individual Task

```typescript
import { TaskDescriptionManager } from 'rover-schemas';

// Load by numeric ID
const task = TaskDescriptionManager.load(taskId);

// Access properties
task.id           // Numeric ID
task.uuid         // UUID
task.title        // Title
task.status       // Current status
task.iterations   // Total iterations
task.error        // Error message if failed
task.startedAt    // Start timestamp
task.completedAt  // Completion timestamp
```

### Accessing Iterations

```typescript
// Get all iterations for a task
const iterations = task.getIterations();
// Returns: IterationManager[] (sorted descending by number)

// Get latest iteration
const latest = task.getLastIteration();
// Returns: IterationManager | undefined

// Get iteration status
const status = iteration.status();
// Returns: IterationStatusManager
```

## 7. Reading Task Status

### Task-Level Status
```typescript
const task = TaskDescriptionManager.load(taskId);

// Direct properties
task.status              // TaskStatus enum value
task.completedAt        // ISO timestamp or undefined
task.failedAt           // ISO timestamp or undefined
task.error              // Error message or undefined
task.iterations         // Number of iterations
task.lastIterationAt    // Timestamp of last iteration

// Helper methods
task.isCompleted()      // Check if COMPLETED
task.isFailed()         // Check if FAILED
task.isInProgress()     // Check if IN_PROGRESS
task.isIterating()      // Check if ITERATING
task.isNew()            // Check if NEW
task.isMerged()         // Check if MERGED
task.isPushed()         // Check if PUSHED

// Duration calculation
task.getDuration()      // Returns milliseconds from start to end
```

### Iteration-Level Status
```typescript
const iteration = task.getLastIteration();
const status = iteration.status();

// Status properties
status.status           // 'initializing' | 'running' | 'completed' | 'failed'
status.currentStep      // String describing current step
status.progress         // 0-100 progress percentage
status.startedAt        // When iteration started
status.updatedAt        // Last update timestamp
status.completedAt      // When completed (if done)
status.error            // Error message (if failed)
```

## 8. Monitoring Running Tasks

### Method 1: List All Tasks with Status
```typescript
import { listCommand } from 'cli/commands/list';

// Get all tasks with current status
await listCommand({ json: true });
// Returns JSON array of all tasks with iterations

// Watch mode (continuous monitoring)
await listCommand({ watch: true });
// Updates every 3 seconds
```

### Method 2: Direct Status Access
```typescript
const tasks = TaskDescriptionStore.getAllDescriptions();

tasks.forEach(task => {
  // Update status from latest iteration
  task.updateStatusFromIteration();
  
  console.log(`Task ${task.id}: ${task.status}`);
});
```

### Method 3: Real-Time Status File Monitoring
Monitor changes to:
- `.rover/tasks/<task_id>/description.json`
- `.rover/tasks/<task_id>/iterations/<iteration>/status.json`

These files are updated in real-time during task execution.

## 9. File Storage & JSON Serialization

All core data structures are JSON serializable:

```typescript
// Export to JSON
const taskJson = task.toJSON();           // TaskDescriptionSchema
const iterationJson = iteration.toJSON(); // Iteration
const statusJson = status.toJSON();       // IterationStatus

// All contain only:
// - Strings (dates in ISO 8601)
// - Numbers
// - Booleans
// - Objects (nested plain objects)
// - Arrays (of above types)
```

### Markdown Files

Additional output files stored as plain text:
- `summary.md` - Agent summary of iteration results
- `plan.md` - Agent's plan for next iteration
- Custom `.md` files generated by agents

These can be read using:
```typescript
const fileMap = iteration.getMarkdownFiles(['summary.md']);
fileMap.get('summary.md'); // Returns file content string
```

## 10. Container Communication

The CLI communicates with containers (Docker/Podman) through:

### Container Lifecycle
1. **Create**: DockerSandbox creates container with:
   - Mounted task workspace (`.rover/tasks/<id>/workspace`)
   - Mounted iteration directory
   - Environment variables for agent configuration
   - Entry point script for workflow execution

2. **Monitor**: 
   - Container writes status.json updates
   - CLI reads status.json for progress
   - Container stdout/stderr available via `rover logs` command

3. **Cleanup**:
   - Container stopped when iteration completes
   - Workspace preserved for future iterations

### Data Exchange
- **Input**: Iteration configuration + workflow definition mounted in container
- **Output**: Generated markdown files + status.json
- **Status**: Real-time updates to status.json (0-100 progress, current step)

### File Mounts
```
Container /rover/task          → .rover/tasks/<id>/
Container /rover/workspace     → .rover/tasks/<id>/workspace
Container /rover/iteration     → .rover/tasks/<id>/iterations/<n>/
Container /rover/workflow      → .rover/tasks/<id>/workflows/
```

## 11. Command Examples for Frontend Integration

### Get All Tasks
```typescript
import { TaskDescriptionStore } from 'rover-schemas';

const tasks = TaskDescriptionStore.getAllDescriptions();
const json = tasks.map(t => t.toJSON());
```

### Get Task Details with Latest Iteration
```typescript
import { TaskDescriptionManager, IterationManager } from 'rover-schemas';
import { join } from 'path';
import { findProjectRoot } from 'rover-common';

const task = TaskDescriptionManager.load(taskId);
const iterationPath = join(
  findProjectRoot(),
  '.rover',
  'tasks',
  taskId.toString(),
  'iterations',
  task.iterations.toString()
);
const iteration = IterationManager.load(iterationPath);
const status = iteration.status();
```

### Watch Task Status Changes
```typescript
import { watch } from 'fs';
import { join } from 'path';
import { findProjectRoot } from 'rover-common';

const taskPath = join(findProjectRoot(), '.rover', 'tasks', taskId.toString());
const statusPath = join(taskPath, 'iterations', iterationNum.toString(), 'status.json');

watch(statusPath, () => {
  // Reload and update UI
  const updated = JSON.parse(readFileSync(statusPath, 'utf8'));
  console.log(`Progress: ${updated.progress}%, Step: ${updated.currentStep}`);
});
```

### Read Iteration Output Files
```typescript
const fileContents = iteration.getMarkdownFiles(['summary.md', 'plan.md']);

fileContents.forEach((content, filename) => {
  console.log(`=== ${filename} ===`);
  console.log(content);
});
```

## 12. API Considerations for Frontend

### No REST API
Rover doesn't expose REST/GraphQL APIs. The frontend must:
1. Read JSON files directly from `.rover/` directory
2. Use Node.js file system APIs
3. Watch for file changes using `fs.watch()` or similar

### Architecture for Frontend Development

**Frontend Data Flow:**
```
Browser UI
    ↓
Node.js Backend (reads from .rover/)
    ↓
[description.json, status.json, *.md files]
```

**Recommended Pattern:**
```typescript
// Backend service
import { TaskDescriptionStore, TaskDescriptionManager } from 'rover-schemas';
import { watch } from 'fs';

export function getTasks() {
  return TaskDescriptionStore.getAllDescriptions().map(t => t.toJSON());
}

export function watchTask(taskId: number, callback: (status) => void) {
  const statusPath = `.rover/tasks/${taskId}/iterations/*/status.json`;
  // Use glob watching or polling for best results
  const interval = setInterval(() => {
    const task = TaskDescriptionManager.load(taskId);
    callback(task.toJSON());
  }, 1000); // Poll every second
  
  return () => clearInterval(interval);
}
```

## 13. Schema Versions & Migration

Current versions:
- **Task Description**: v1.1
- **Iteration**: v1.0
- **Iteration Status**: (no version field)
- **Project Config**: v1.2
- **User Settings**: v1.0

Migrations are handled automatically when loading files:
```typescript
const task = TaskDescriptionManager.load(taskId);
// Automatically migrates to current schema version
// Saves backup as description.json.backup
```

## 14. Summary Table

| Aspect | Details |
|--------|---------|
| **Primary Storage** | File system at `.rover/tasks/<id>/` |
| **Format** | JSON + Markdown |
| **Task Metadata** | description.json (v1.1) |
| **Iteration Config** | iteration.json (v1.0) |
| **Real-time Status** | status.json (iteration-specific) |
| **Output** | Markdown files (.md) |
| **Container ID Storage** | In description.json containerId field |
| **Status Updates** | Real-time to status.json during execution |
| **File Watching** | Monitor status.json for progress |
| **Access Pattern** | Load JSON → Read properties → Update → Save |
| **API Pattern** | File-based, no REST/GraphQL |
| **Serialization** | Full JSON, no circular references |

