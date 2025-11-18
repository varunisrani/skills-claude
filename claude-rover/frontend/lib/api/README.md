# RoverCLI Executor

Secure, type-safe interface for executing Rover CLI commands from Next.js API routes.

## Overview

The `RoverCLI` class provides a production-ready way to execute Rover CLI commands with:
- **Security**: Uses `spawn()` instead of `exec()` to prevent command injection
- **Validation**: Input validation with Zod schemas
- **Type Safety**: Full TypeScript support with proper types
- **Error Handling**: Comprehensive error handling with sanitized messages
- **Structured Responses**: Consistent `CommandResult<T>` return type

## Installation

The RoverCLI class is already set up in the project. To use it:

```typescript
import { getRoverCLI } from '@/lib/api/rover-cli';
```

## Usage Examples

### Basic Usage

```typescript
import { getRoverCLI } from '@/lib/api/rover-cli';

// Get singleton instance
const cli = getRoverCLI();

// List all tasks
const result = await cli.listTasks();
if (result.success) {
  console.log('Tasks:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Create a Task

```typescript
import { getRoverCLI } from '@/lib/api/rover-cli';

const cli = getRoverCLI();

const result = await cli.createTask({
  description: 'Implement user authentication with JWT',
  workflow: 'swe',
  agent: 'claude',
  yes: true,
});

if (result.success) {
  console.log('Task created:', result.data.id);
  console.log('Branch:', result.data.branchName);
} else {
  console.error('Failed to create task:', result.error);
}
```

### Iterate on a Task

```typescript
const result = await cli.iterateTask({
  taskId: 42,
  instructions: 'Add password reset functionality and email verification',
});

if (result.success) {
  console.log('Iteration started successfully');
} else {
  console.error('Failed to iterate:', result.error);
}
```

### Get Task Logs

```typescript
// Get logs for latest iteration
const result = await cli.getLogs(42);

if (result.success) {
  console.log(result.data); // Raw log output
}

// Get logs for specific iteration
const result2 = await cli.getLogs(42, 2);
```

### Merge and Push

```typescript
// Merge task changes
const mergeResult = await cli.mergeTask({
  taskId: 42,
  force: false,
});

if (mergeResult.success) {
  // Push to GitHub
  const pushResult = await cli.pushTask({
    taskId: 42,
    message: 'Implement authentication system',
  });

  if (pushResult.success && pushResult.data?.prUrl) {
    console.log('PR created:', pushResult.data.prUrl);
  }
}
```

### List Workflows

```typescript
const result = await cli.listWorkflows();

if (result.success) {
  result.data.forEach(workflow => {
    console.log(`${workflow.name}: ${workflow.description}`);
  });
}
```

## Using in Next.js API Routes

### Example: GET /api/tasks

```typescript
// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';

export async function GET() {
  const cli = getRoverCLI();
  const result = await cli.listTasks();

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json(result.data);
}
```

### Example: POST /api/tasks

```typescript
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { CreateTaskInputSchema } from '@/types/rover';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const input = CreateTaskInputSchema.parse(body);

    // Execute command
    const cli = getRoverCLI();
    const result = await cli.createTask(input);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Example: POST /api/tasks/[id]/iterate

```typescript
// app/api/tasks/[id]/iterate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = parseInt(params.id);

  if (isNaN(taskId)) {
    return NextResponse.json(
      { error: 'Invalid task ID' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { instructions } = body;

  if (!instructions || typeof instructions !== 'string') {
    return NextResponse.json(
      { error: 'Instructions required' },
      { status: 400 }
    );
  }

  const cli = getRoverCLI();
  const result = await cli.iterateTask({ taskId, instructions });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
```

## Security Features

### 1. No Command Injection

```typescript
// ❌ BAD - Vulnerable to injection
exec(`rover task "${userInput}"`);

// ✅ GOOD - Safe with spawn
spawn('rover', ['task', userInput]);
```

The `RoverCLI` class uses `spawn()` with `shell: false`, which prevents command injection attacks.

### 2. Shell Metacharacter Detection

```typescript
// Automatically rejects commands with dangerous characters
const result = await cli.execute('list; rm -rf /', []); // Rejected
// Returns: { success: false, error: 'Invalid command: contains shell metacharacters' }
```

### 3. Input Validation

```typescript
// All inputs validated with Zod schemas
const result = await cli.createTask({
  description: 'x', // Too short!
});
// Returns validation error: "Description must be at least 10 characters"
```

### 4. Error Sanitization

```typescript
// Internal errors are sanitized before being sent to client
// File paths replaced with <path>
// UUIDs replaced with <uuid>
// Long errors truncated

// Server log: Error: /home/user/.rover/tasks/abc-123/task.json not found
// Client sees: Error: <path>/<uuid>/task.json not found
```

### 5. Timeout Protection

```typescript
// All commands have configurable timeouts
const cli = new RoverCLI({
  timeout: 5 * 60 * 1000, // 5 minutes default
});

// Long-running commands get extended timeout
await cli.createTask({...}); // 10 minutes timeout
```

## API Reference

### Constructor Options

```typescript
interface RoverCLIOptions {
  roverPath?: string;      // Path to rover binary (default: 'rover')
  cwd?: string;            // Working directory (default: process.cwd())
  timeout?: number;        // Timeout in ms (default: 300000 = 5 min)
  env?: NodeJS.ProcessEnv; // Environment variables
}
```

### Methods

All methods return `Promise<CommandResult<T>>`:

```typescript
interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}
```

| Method | Description | Timeout |
|--------|-------------|---------|
| `init(yes?: boolean)` | Initialize Rover project | 5 min |
| `listTasks()` | List all tasks | 5 min |
| `createTask(input)` | Create new task | 10 min |
| `inspectTask(id)` | Get task details | 5 min |
| `getLogs(id, iteration?)` | Get task logs | 5 min |
| `iterateTask(input)` | Add iteration | 10 min |
| `restartTask(id)` | Restart task | 10 min |
| `stopTask(id, removeAll?)` | Stop task | 5 min |
| `deleteTask(id)` | Delete task | 5 min |
| `getDiff(id, branch?)` | Get git diff | 5 min |
| `mergeTask(input)` | Merge changes | 5 min |
| `pushTask(input)` | Push to GitHub | 5 min |
| `getShellCommand(id, container?)` | Get shell command | 5 min |
| `listWorkflows()` | List workflows | 5 min |
| `inspectWorkflow(name)` | Get workflow details | 5 min |
| `getConfig()` | Get Rover config | 5 min |

## Testing

For testing, you can create a new instance with custom options:

```typescript
import { RoverCLI, resetRoverCLI } from '@/lib/api/rover-cli';

// Reset singleton before test
beforeEach(() => {
  resetRoverCLI();
});

// Create instance with test configuration
const cli = new RoverCLI({
  roverPath: '/path/to/test/rover',
  cwd: '/tmp/test-project',
  timeout: 1000, // Short timeout for tests
});
```

## Best Practices

1. **Always check `result.success`** before accessing `result.data`
2. **Use the singleton** `getRoverCLI()` in API routes for efficiency
3. **Validate inputs** with Zod schemas before calling CLI methods
4. **Handle errors gracefully** and return appropriate HTTP status codes
5. **Log errors server-side** but sanitize before sending to client
6. **Use appropriate timeouts** for long-running operations

## Troubleshooting

### Command not found

```typescript
// Error: spawn rover ENOENT
```

**Solution**: Ensure `rover` is in PATH or provide full path:

```typescript
const cli = new RoverCLI({
  roverPath: '/usr/local/bin/rover',
});
```

### Timeout errors

```typescript
// Error: Command timed out after 300000ms
```

**Solution**: Increase timeout for long operations:

```typescript
const cli = new RoverCLI({
  timeout: 15 * 60 * 1000, // 15 minutes
});
```

### Validation errors

```typescript
// Error: Description must be at least 10 characters
```

**Solution**: Validate input on the client side before sending to API.

## License

Part of the Rover project. See main project LICENSE.
