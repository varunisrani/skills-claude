# Rover CLI Commands - Comprehensive Analysis

**Document Version**: 1.0  
**Generated**: 2025-11-12  
**Source**: rover/packages/cli/src/commands/ and rover/packages/cli/src/program.ts

---

## Table of Contents

1. [Project Configuration](#project-configuration)
2. [Task Management](#task-management)
3. [Debugging](#debugging)
4. [Merge & Push](#merge--push)
5. [Workflows](#workflows)
6. [Global Options](#global-options)

---

## Global Options

All commands (except `init` and `mcp`) require:
- Git to be installed
- Current directory to be in a git repository
- At least one commit in the git repository
- Project config file: `rover.json`
- User settings file: `.rover/settings.json`

### Global Flags

- `-v, --verbose`: Log verbose information like running commands

---

## Project Configuration

### `init` Command

**Description**: Initialize your project with Rover

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/init.ts`

**Syntax**:
```
rover init [path]
```

**Arguments**:
- `[path]`: Project path (defaults to current directory)

**Options**:
- `-y, --yes`: Skip all confirmations and run non-interactively

**What it does**:
1. Checks prerequisites (Git, Docker, at least one AI agent)
2. Detects project environment (languages, package managers, task managers)
3. Shows available AI agents and allows selection (if multiple available)
4. Asks about commit attribution preferences
5. Creates/updates `rover.json` with detected project settings
6. Creates/updates `.rover/settings.json` with user preferences
7. Adds `.rover/` to `.gitignore` automatically

**Files Created/Modified**:
- `rover.json`: Project configuration
- `.rover/settings.json`: User preferences
- `.gitignore`: Adds `.rover/` entry

**JSON Output Support**: No

**Prerequisites Check**:
- Git (required)
- Docker (required)
- At least one AI agent: Claude, Codex, Cursor, Gemini, or Qwen (required)

**Detected Environment Information**:
- Programming languages (JavaScript, Python, Go, Rust, etc.)
- Package managers (npm, pip, cargo, etc.)
- Task managers (npm scripts, Makefile, etc.)

---

## Task Management

### `task` Command

**Description**: Start a new task for an AI Agent. It will spawn a new environment to complete it.

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/task.ts`

**Syntax**:
```
rover task [description] [options]
```

**Arguments**:
- `[description]`: The task description (optional, will prompt if not provided)

**Options**:
- `--from-github <issue>`: Fetch task description from a GitHub issue number
- `-w, --workflow <name>`: Use a specific workflow (choices: 'swe', 'tech-writer') (default: 'swe')
- `-y, --yes`: Skip all confirmations and run non-interactively
- `-s, --source-branch <branch>`: Base branch for git worktree creation (defaults to current branch)
- `-t, --target-branch <branch>`: Custom name for the worktree branch
- `-a, --agent <agent>`: AI agent to use (claude, codex, cursor, gemini, qwen)
- `--json`: Output result in JSON format
- `--debug`: Show debug information like running commands

**What it does**:
1. Validates rover initialization (requires rover.json and .rover/settings.json)
2. Loads selected workflow (or defaults to 'swe')
3. Collects task inputs (description + any workflow-specific inputs)
4. Expands task using AI (generates title and description)
5. Creates task ID and directory structure in `.rover/tasks/<id>/`
6. Sets up git worktree at `.rover/tasks/<id>/workspace`
7. Creates initial iteration directory: `.rover/tasks/<id>/iterations/1/`
8. Copies environment files (.env, .env.local, etc.)
9. Starts Docker container (sandbox) to execute the task
10. Returns task ID and initial status

**JSON Output Format**:
```json
{
  "success": true,
  "taskId": <number>,
  "title": "<task title>",
  "description": "<expanded description>",
  "status": "IN_PROGRESS",
  "createdAt": "<ISO timestamp>",
  "startedAt": "<ISO timestamp>",
  "workspace": "/path/to/.rover/tasks/<id>/workspace",
  "branch": "<branch-name>",
  "savedTo": ".rover/tasks/<id>/description.json"
}
```

**Files Created**:
- `.rover/tasks/<id>/description.json`: Task metadata
- `.rover/tasks/<id>/workspace/`: Git worktree
- `.rover/tasks/<id>/iterations/1/iteration.json`: Initial iteration

**Workflow Inputs Processing**:
- Can accept workflow inputs via stdin (JSON format)
- Can fetch inputs from GitHub issue with `--from-github`
- Prompts user for missing required inputs
- Validates all required inputs are provided

**Dependencies**:
- `rover-schemas`: TaskDescriptionManager, IterationManager
- `rover-common`: Git, ProcessManager, findProjectRoot
- Docker (via sandbox)
- AI Agent tools (Claude, Codex, etc.)

---

### `restart` Command

**Description**: Restart a new or failed task

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/restart.ts`

**Syntax**:
```
rover restart <taskId> [options]
```

**Arguments**:
- `<taskId>`: Task ID to restart (required)

**Options**:
- `--json`: Output result in JSON format

**What it does**:
1. Loads task from `.rover/tasks/<id>/description.json`
2. Validates task is in NEW or FAILED status
3. Resets task to NEW status with restart timestamp
4. Sets up workspace if missing (creates git worktree)
5. Creates new iteration directory structure
6. Marks task as IN_PROGRESS
7. Starts Docker container to re-execute task

**JSON Output Format**:
```json
{
  "success": true,
  "taskId": <number>,
  "title": "<task title>",
  "description": "<description>",
  "status": "IN_PROGRESS",
  "restartedAt": "<ISO timestamp>"
}
```

**Valid Task States**:
- NEW: Task just created but not started
- FAILED: Task execution failed

**Invalid States** (cannot restart):
- IN_PROGRESS, COMPLETED, MERGED, PUSHED, ITERATING

**Files Modified**:
- `.rover/tasks/<id>/description.json`: Updated status and restart time
- `.rover/tasks/<id>/iterations/<n>/`: New iteration directory created

---

### `stop` Command

**Description**: Stop a running task and clean up its resources

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/stop.ts`

**Syntax**:
```
rover stop <taskId> [options]
```

**Arguments**:
- `<taskId>`: Task ID to stop (required)

**Options**:
- `-a, --remove-all`: Remove container, git worktree and branch if they exist
- `-c, --remove-container`: Remove container if it exists
- `-g, --remove-git-worktree-and-branch`: Remove git worktree and branch
- `--json`: Output result in JSON format

**What it does**:
1. Loads task
2. Stops Docker container (if running)
3. Removes container from Docker
4. Updates task status to CANCELLED
5. Optionally removes git worktree and/or branch
6. Deletes iteration directories
7. Clears workspace information from task metadata

**JSON Output Format**:
```json
{
  "success": true,
  "taskId": <number>,
  "title": "<task title>",
  "status": "CANCELLED",
  "stoppedAt": "<ISO timestamp>"
}
```

**Cleanup Levels**:
- Default: Stops container, deletes iterations
- `--remove-container`: Also removes container
- `--remove-git-worktree-and-branch`: Removes git worktree and branch
- `--remove-all`: Removes all above

**Files Deleted**:
- `.rover/tasks/<id>/iterations/`: All iteration data removed
- Git worktree (if `--remove-git-worktree-and-branch`)
- Git branch (if `--remove-git-worktree-and-branch`)

---

### `list` (alias: `ls`) Command

**Description**: Show tasks and their status

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/list.ts`

**Syntax**:
```
rover list [options]
rover ls [options]
```

**Arguments**: None

**Options**:
- `-w, --watch`: Watch for changes and refresh every 3 seconds
- `--json`: Output in JSON format

**What it does**:
1. Loads all task descriptions from `.rover/tasks/`
2. Updates task status from latest iteration data
3. Displays table with task information
4. In watch mode, refreshes every 3 seconds until Ctrl+C
5. Handles watch mode with screen clearing

**Display Columns** (Table Mode):
- ID: Task identifier (colored cyan)
- Title: Task title (truncated to 30 chars)
- Agent: AI agent name (gray)
- Workflow: Workflow name (gray)
- Status: Task status (color-coded)
- Progress: Progress bar with percentage
- Current Step: What the agent is currently doing
- Duration: Time elapsed since task start

**JSON Output Format**:
```json
[
  {
    "id": <number>,
    "uuid": "<uuid>",
    "title": "<title>",
    "description": "<description>",
    "status": "IN_PROGRESS",
    "agent": "claude",
    "workflowName": "swe",
    "worktreePath": "<path>",
    "branchName": "<branch>",
    "createdAt": "<ISO timestamp>",
    "startedAt": "<ISO timestamp>",
    "iterationsData": [<iteration_objects>]
  }
]
```

**Task Status Values**:
- NEW: Just created
- IN_PROGRESS: Running
- ITERATING: In iteration refinement
- COMPLETED: Task completed
- FAILED: Task failed
- MERGED: Changes merged to main branch
- PUSHED: Changes pushed to remote
- CANCELLED: Task stopped

**Color Coding**:
- Green: COMPLETED, MERGED, PUSHED
- Red: FAILED
- Yellow: IN_PROGRESS, ITERATING
- Gray: Other statuses

---

### `inspect` Command

**Description**: Inspect a task

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/inspect.ts`

**Syntax**:
```
rover inspect <taskId> [iterationNumber] [options]
```

**Arguments**:
- `<taskId>`: Task ID to inspect (required)
- `[iterationNumber]`: Specific iteration number (defaults to latest)

**Options**:
- `--file <files...>`: Output iteration file contents (mutually exclusive with --raw-file)
- `--raw-file <files...>`: Output raw file contents without formatting
- `--json`: Output in JSON format

**What it does**:
1. Loads task metadata
2. Loads iteration data (defaults to latest)
3. Displays task details (ID, title, status, timestamps)
4. Shows generated files from iteration
5. Displays file content if `--file` or `--raw-file` specified
6. Shows helpful tips based on task status

**JSON Output Format**:
```json
{
  "id": <number>,
  "uuid": "<uuid>",
  "title": "<title>",
  "description": "<description>",
  "status": "IN_PROGRESS",
  "formattedStatus": "In Progress",
  "createdAt": "<ISO timestamp>",
  "startedAt": "<ISO timestamp>",
  "completedAt": "<ISO timestamp or null>",
  "failedAt": "<ISO timestamp or null>",
  "worktreePath": "<path>",
  "branchName": "<branch>",
  "workflowName": "swe",
  "taskDirectory": ".rover/tasks/<id>/",
  "iterations": <total_iterations>,
  "lastIterationAt": "<ISO timestamp>",
  "files": ["file1.md", "file2.md"],
  "iterationFiles": ["summary.md", "plan.md"],
  "statusUpdated": false,
  "error": "<error message if failed>"
}
```

**Raw File Output Format**:
```json
{
  "success": true,
  "files": [
    {
      "filename": "summary.md",
      "content": "<raw file content>"
    }
  ]
}
```

**Default File Display**:
- Shows `summary.md` if available
- Falls back to latest generated file
- Can specify custom files with `--file`

**Available Files** (generated by iterations):
- `summary.md`: Execution summary
- `plan.md`: Agent's execution plan
- `changes.md`: Code changes made
- `logs.md`: Execution logs (if available)
- Other workflow-specific output files

---

### `delete` (alias: `del`) Command

**Description**: Delete a task

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/delete.ts`

**Syntax**:
```
rover delete <taskId...> [options]
rover del <taskId...> [options]
```

**Arguments**:
- `<taskId...>`: Task IDs to delete (one or more, required)

**Options**:
- `-y, --yes`: Skip all confirmations and run non-interactively
- `--json`: Output in JSON format

**What it does**:
1. Validates all provided task IDs exist
2. Shows task information (ID, title, status)
3. Asks for confirmation (unless `--yes` provided)
4. For each task:
   - Calls `task.delete()` to update metadata
   - Removes task directory: `.rover/tasks/<id>/`
   - Prunes git worktree
5. Returns success/warning/error status

**JSON Output Format**:
```json
{
  "success": true,
  "errors": []
}
```

**Error Handling**:
- Collects all errors and reports them
- Partial success possible (some tasks deleted, others failed)
- Reports which tasks succeeded and which failed
- Shows warnings for worktree prune failures

**Cleanup**:
- Deletes entire task directory
- Removes git worktree
- Updates git worktree tracking
- Metadata removed from rover storage

---

## Iteration & Debugging

### `iterate` (alias: `iter`) Command

**Description**: Add instructions to a task and start new iteration

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/iterate.ts`

**Syntax**:
```
rover iterate <taskId> [instructions] [options]
rover iter <taskId> [instructions] [options]
```

**Arguments**:
- `<taskId>`: Task ID to iterate on (required)
- `[instructions]`: New requirements or refinement instructions (optional, will prompt if not provided)

**Options**:
- `--json`: Output JSON and skip confirmation prompts

**What it does**:
1. Loads task
2. Collects iteration instructions:
   - From stdin if available
   - From command argument
   - From user prompt
3. Retrieves previous iteration context (plan.md, changes.md)
4. Expands instructions using AI
5. Increments iteration counter
6. Creates new iteration directory
7. Creates iteration.json with expanded context
8. Updates task status to ITERATING
9. Starts Docker container for new iteration

**JSON Output Format**:
```json
{
  "success": true,
  "taskId": <number>,
  "taskTitle": "<title>",
  "iterationNumber": <n>,
  "instructions": "<user instructions>",
  "expandedTitle": "<ai expanded title>",
  "expandedDescription": "<ai expanded description>",
  "worktreePath": "<path>",
  "iterationPath": ".rover/tasks/<id>/iterations/<n>/"
}
```

**Previous Iteration Context**:
Reads from latest iteration:
- `plan.md`: Agent's execution plan
- `changes.md`: Changes made in previous iteration

**Files Created**:
- `.rover/tasks/<id>/iterations/<n+1>/`: New iteration directory
- `.rover/tasks/<id>/iterations/<n+1>/iteration.json`: Iteration metadata

**Input Methods** (priority order):
1. Command line argument
2. Stdin (if available)
3. User prompt (interactive)
4. Error in JSON mode if none provided

---

### `logs` Command

**Description**: Show execution logs for a task iteration

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/logs.ts`

**Syntax**:
```
rover logs <taskId> [iterationNumber] [options]
```

**Arguments**:
- `<taskId>`: Task ID to show logs for (required)
- `[iterationNumber]`: Specific iteration number (defaults to latest)

**Options**:
- `-f, --follow`: Follow log output in real-time
- `--json`: Output result in JSON format

**What it does**:
1. Loads task
2. Gets available iterations for the task
3. Determines which iteration to show (specified or latest)
4. Retrieves container ID from task metadata
5. Runs Docker logs command
6. In follow mode: streams logs in real-time (Ctrl+C to exit)
7. Displays formatted logs with syntax highlighting (if not following)

**JSON Output Format**:
```json
{
  "success": true,
  "logs": "<full docker logs output>"
}
```

**Follow Mode**:
- Uses `docker logs -f` for real-time streaming
- Blocks until container completes or user presses Ctrl+C
- Cannot be used with `--json` flag
- Shows "Following logs... (Press Ctrl+C to exit)" message

**Log Limitations**:
- Logs only available for containers that still exist
- Logs only available for recent tasks
- Cannot view logs for completed containers (after cleanup)

**Available Iterations**:
- Lists all available iterations for the task
- Allows viewing logs from any iteration
- Shows iteration numbers available

---

### `shell` Command

**Description**: Open interactive shell for testing task changes

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/shell.ts`

**Syntax**:
```
rover shell <taskId> [options]
```

**Arguments**:
- `<taskId>`: Task ID to open shell for (required)

**Options**:
- `-c, --container`: Start the interactive shell within a container

**What it does**:
1. Loads task
2. Validates worktree exists
3. Determines shell based on platform
4. Optionally checks for Docker/Podman availability
5. Launches shell in task worktree directory
6. Returns shell exit code

**Shell Detection**:

**Windows**:
- Tries WSL first
- Falls back to PowerShell Core (pwsh.exe)
- Falls back to Windows PowerShell
- Falls back to cmd.exe

**Unix/Linux/macOS**:
- Uses `$SHELL` environment variable
- Falls back to `/bin/sh`

**Container Mode**:
- Requires Docker or Podman to be installed
- Runs shell inside the task's container
- Uses sandbox implementation for container interaction

**Output**:
- Returns shell exit code
- Shows "Shell started" message
- Shows shell type used
- Shows "Shell session ended" message

---

## Merge & Push

### `diff` Command

**Description**: Show git diff between task worktree and main branch

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/diff.ts`

**Syntax**:
```
rover diff <taskId> [filePath] [options]
```

**Arguments**:
- `<taskId>`: Task ID to show diff for (required)
- `[filePath]`: Optional file path to show diff for specific file

**Options**:
- `-b, --branch <name>`: Compare changes with a specific branch
- `--only-files`: Show only changed filenames

**What it does**:
1. Loads task
2. Validates worktree exists
3. Validates git repository
4. Runs git diff command
5. Displays formatted diff output

**Diff Output Modes**:

**Full Diff** (default):
- Shows all changes with context
- Colors: green for additions, red for deletions, magenta for hunks
- Shows file headers in bold
- Shows diff metadata in gray

**Files Only** (`--only-files`):
- Lists only changed filenames
- One per line with cyan coloring
- Useful for quick overview

**Specific File**:
- Shows diff for single file
- Same coloring as full diff

**Branch Comparison** (`--branch`):
- Compares task branch with specified branch instead of main
- Useful for comparing with other feature branches
- Does not include untracked files

**JSON Output Support**: No (CLI only)

**Exit Codes**:
- 0: Changes found and displayed
- Non-zero: No changes or error

---

### `merge` Command

**Description**: Merge the task changes into your current branch

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/merge.ts`

**Syntax**:
```
rover merge <taskId> [options]
```

**Arguments**:
- `<taskId>`: Task ID to merge (required)

**Options**:
- `-f, --force`: Force merge without confirmation
- `--json`: Output in JSON format

**What it does**:
1. Loads task and validates it's in COMPLETED status
2. Checks for uncommitted changes in current branch
3. Checks for changes/unmerged commits in task worktree
4. If changes exist:
   - Gathers recent commit context
   - Gets task iteration summaries (plan.md, changes.md)
   - Uses AI to generate commit message
   - Commits changes in worktree with optional co-author
5. Merges task branch into current branch
6. Handles merge conflicts (uses AI to resolve if possible)
7. Updates task status to MERGED
8. Optionally cleans up worktree

**JSON Output Format**:
```json
{
  "success": true,
  "taskId": <number>,
  "taskTitle": "<title>",
  "branchName": "<branch>",
  "currentBranch": "<current>",
  "hasWorktreeChanges": true,
  "hasUnmergedCommits": true,
  "committed": true,
  "commitMessage": "<first line of commit>",
  "merged": true,
  "conflictsResolved": true,
  "cleanedUp": false
}
```

**Commit Message Generation**:
- Uses AI (Claude, Codex, etc.)
- Based on task title, description, recent commits, iteration summaries
- Falls back to task title if AI fails
- Adds co-author line if attribution enabled in project config

**Merge Conflict Resolution**:
1. Attempts merge
2. If conflicts detected:
   - Reads conflicted files
   - Uses AI to resolve conflicts
   - Writes resolved content back
   - Stages resolved files
3. Continues merge with resolved content
4. Asks user for confirmation before applying

**Task Status Requirements**:
- Must be COMPLETED to merge
- Cannot merge MERGED or PUSHED tasks
- Validates before attempting merge

**Files Modified**:
- `.rover/tasks/<id>/description.json`: Status updated to MERGED
- Git merge commit created
- Task branch merged into current branch

---

### `push` Command

**Description**: Commit and push task changes to remote, with GitHub PR support

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/push.ts`

**Syntax**:
```
rover push <taskId> [options]
```

**Arguments**:
- `<taskId>`: Task ID to push (required)

**Options**:
- `-m, --message <message>`: Commit message (optional, defaults to task title)
- `--json`: Output in JSON format

**What it does**:
1. Loads task
2. Validates worktree exists
3. Checks for uncommitted changes
4. If changes exist:
   - Prompts for commit message (or uses provided/default)
   - Adds co-author if attribution enabled
   - Commits changes in worktree
5. Pushes branch to remote
6. Handles case where branch doesn't exist in remote
7. Sets upstream branch if needed
8. Updates task status to PUSHED
9. Shows GitHub PR URL template (if applicable)

**JSON Output Format**:
```json
{
  "success": true,
  "taskId": <number>,
  "taskTitle": "<title>",
  "branchName": "<branch>",
  "hasChanges": true,
  "committed": true,
  "commitMessage": "<message>",
  "pushed": true
}
```

**Commit Message**:
- Uses provided `-m` option if given
- Prompts user if not provided
- Default format: "Task <id>: <title>"
- Appends co-author line if attribution enabled

**Push Process**:
1. Checks for upstream branch
2. If not exist: Sets upstream with `-u` flag
3. If exists: Pushes normally
4. Retries with upstream setup if initial push fails

**GitHub Integration**:
- Detects GitHub remote URL
- Extracts owner and repo from URL
- Provides PR creation URL template
- Note: PR creation feature is commented out (TODO)

**Files Modified**:
- `.rover/tasks/<id>/description.json`: Status updated to PUSHED

---

## Workflows

### `workflows list` (alias: `workflows ls`) Command

**Description**: List all available workflows

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/workflows/list.ts`

**Syntax**:
```
rover workflows list [options]
rover workflows ls [options]
```

**Arguments**: None

**Options**:
- `--json`: Output the list in JSON format

**What it does**:
1. Loads all available workflows from workflow store
2. Displays table with workflow information
3. Shows name, description, number of steps, and input parameters

**Display Columns** (Table Mode):
- Name: Workflow name (max 30 chars, truncated with ellipsis)
- Description: Workflow description (max 50 chars, gray color)
- Steps: Number of steps in workflow
- Inputs: Comma-separated list of input parameter names

**JSON Output Format**:
```json
{
  "success": true,
  "workflows": [
    {
      "name": "swe",
      "description": "Software engineering workflow",
      "version": "1.0.0",
      "inputs": [
        {
          "name": "description",
          "type": "string",
          "description": "Task description",
          "required": true
        }
      ],
      "outputs": [
        {
          "name": "result",
          "type": "string",
          "description": "Workflow result"
        }
      ],
      "steps": [
        {
          "name": "analyze",
          "description": "Analyze the task"
        }
      ]
    }
  ]
}
```

**Workflow Information Provided**:
- Name: Unique workflow identifier
- Description: Human-readable description
- Steps: Number of executable steps
- Inputs: Required and optional input parameters
- Outputs: Produced outputs from workflow

---

### `workflows inspect` Command

**Description**: Display detailed information about a specific workflow

**Location**: `/home/user/skills-claude/rover/packages/cli/src/commands/workflows/inspect.ts`

**Syntax**:
```
rover workflows inspect <workflow-name> [options]
```

**Arguments**:
- `<workflow-name>`: Name of the workflow to inspect (required)

**Options**:
- `--json`: Output workflow details in JSON format
- `--raw`: Output workflow as raw YAML

**What it does**:
1. Loads specified workflow
2. Displays workflow metadata (name, description, version)
3. Shows defaults (tool, model)
4. Shows configuration (timeout, continueOnError)
5. Lists all inputs with details (required, default values)
6. Lists all outputs
7. Shows workflow steps as visual diagram

**JSON Output Format**:
```json
{
  "success": true,
  "workflow": {
    "name": "swe",
    "description": "Software engineering workflow",
    "version": "1.0.0",
    "defaults": {
      "tool": "claude",
      "model": "claude-opus"
    },
    "config": {
      "timeout": 3600,
      "continueOnError": false
    },
    "inputs": [
      {
        "name": "description",
        "type": "string",
        "description": "Task description",
        "required": true,
        "default": null
      }
    ],
    "outputs": [
      {
        "name": "result",
        "type": "string",
        "description": "Execution result"
      }
    ],
    "steps": [
      {
        "name": "plan",
        "description": "Create execution plan",
        "outputs": [
          {
            "name": "plan",
            "description": "Execution plan"
          }
        ]
      }
    ]
  }
}
```

**Raw Output** (`--raw`):
- Outputs entire workflow definition as YAML
- Preserves original file formatting
- Useful for configuration review or backup

**Regular Output**:
Displays formatted information:
- **Workflow Details**: Name, description, version
- **Defaults**: Default tool and model to use
- **Config**: Timeout and error handling settings
- **Inputs**: Parameters with type, description, required status
- **Outputs**: Produced values with descriptions
- **Steps**: Visual diagram of workflow execution steps

**Input Details Shown**:
- Parameter name
- Type (string, number, boolean, etc.)
- Description
- Required indicator (red if required)
- Default value (gray if present)

**Step Diagram**:
- Shows step name
- Lists outputs produced by each step
- Visual representation with arrows

---

## Task Structure

### File Organization

Each task creates the following directory structure:

```
.rover/
├── tasks/
│   └── <taskId>/
│       ├── description.json          # Task metadata
│       ├── workspace/                # Git worktree
│       │   └── <project files>
│       └── iterations/
│           ├── 1/
│           │   ├── iteration.json    # Iteration metadata
│           │   ├── summary.md        # Execution summary
│           │   ├── plan.md           # Agent's plan
│           │   └── changes.md        # Code changes
│           └── 2/
│               └── ...
└── settings.json                     # User preferences
```

### Task Status Values

- **NEW**: Just created, not started
- **IN_PROGRESS**: Currently executing
- **ITERATING**: In iteration refinement phase
- **COMPLETED**: Task execution completed successfully
- **FAILED**: Task execution failed
- **MERGED**: Changes merged to main branch
- **PUSHED**: Changes pushed to remote
- **CANCELLED**: Task stopped by user

### Task Metadata (description.json)

```json
{
  "id": <number>,
  "uuid": "<uuid>",
  "title": "<task title>",
  "description": "<full description>",
  "status": "IN_PROGRESS",
  "createdAt": "<ISO timestamp>",
  "startedAt": "<ISO timestamp>",
  "completedAt": "<ISO timestamp or null>",
  "failedAt": "<ISO timestamp or null>",
  "agent": "claude",
  "workflowName": "swe",
  "iterations": <current_iteration>,
  "worktreePath": "/path/to/.rover/tasks/<id>/workspace",
  "branchName": "<branch-name>",
  "containerId": "<docker container id>",
  "error": "<error message if failed>"
}
```

---

## Dependencies & External Systems

### Core Dependencies

**From rover-common**:
- `Git`: Git operations (worktree, diff, merge, push)
- `ProcessManager`: Progress tracking display
- `findProjectRoot()`: Locate project root
- `launch()` / `launchSync()`: Run external commands
- `showFile()`, `showList()`, `showProperties()`: Display utilities
- `Table`, `TableColumn`: Table rendering

**From rover-schemas**:
- `TaskDescriptionManager`: Load/save task metadata
- `IterationManager`: Manage iterations
- `TaskDescriptionStore`: Query all tasks
- `Workflow`, `WorkflowManager`: Workflow handling

**From rover-telemetry**:
- `getTelemetry()`: Analytics and event tracking
- Event methods: `eventNewTask()`, `eventIterateTask()`, etc.

### External Systems

**Docker/Container**:
- Sandbox container execution (via `createSandbox()`)
- Log retrieval
- Container lifecycle management

**Git**:
- Repository validation
- Worktree creation and management
- Branch operations
- Commit and push operations
- Merge conflict detection

**AI Agents**:
- Claude, Codex, Cursor, Gemini, Qwen
- Used for:
  - Task expansion
  - Iteration refinement
  - Merge conflict resolution
  - Commit message generation
  - GitHub input extraction

**GitHub**:
- Issue fetching (via `GitHub` class)
- PR URL templates
- Remote URL parsing

---

## JSON Output Support Summary

| Command | JSON Support | Notes |
|---------|-------------|-------|
| init | No | Interactive only |
| task | Yes | Full JSON output with task details |
| restart | Yes | Returns updated task status |
| stop | Yes | Returns cancellation status |
| list | Yes | Returns array of all tasks with iterations |
| inspect | Yes | Returns task details and file contents |
| logs | Yes | Returns raw Docker logs |
| delete | Yes | Returns success/errors array |
| iterate | Yes | Returns iteration details |
| shell | No | Interactive only |
| diff | No | CLI only |
| merge | Yes | Returns merge status and conflicts |
| push | Yes | Returns push operation status |
| workflows list | Yes | Returns workflow array |
| workflows inspect | Yes | Returns workflow details |

---

## Error Handling

### Common Validation Errors

- **Invalid Task ID**: Must be a valid integer
- **Task Not Found**: Specified task ID doesn't exist
- **No Worktree**: Task workspace missing or deleted
- **Invalid Status**: Operation not allowed for current task status
- **Not in Git Repo**: Current directory not a git repository
- **Uncommitted Changes**: Cannot merge/push with uncommitted changes
- **Merge Conflicts**: Cannot auto-merge due to conflicts

### Error Output Formats

**Standard Error** (non-JSON):
```
✗ Error message here
└── Tips: suggestion for resolution
```

**JSON Error**:
```json
{
  "success": false,
  "error": "Error message",
  "tips": ["suggestion 1", "suggestion 2"]
}
```

---

## Configuration Files

### rover.json (Project Configuration)

Location: Project root

```json
{
  "attribution": true,
  "languages": ["javascript", "python"],
  "packageManagers": ["npm"],
  "taskManagers": ["npm"]
}
```

### .rover/settings.json (User Preferences)

Location: `.rover/settings.json`

```json
{
  "defaultAiAgent": "claude",
  "availableAiAgents": ["claude", "gemini"],
  "version": "1.0.0"
}
```

---

## Tips & Best Practices

1. **Use `--json` flag** when integrating with external tools
2. **Use `--watch` with list** to monitor task progress
3. **Use `--follow` with logs** for real-time debugging
4. **Use `--yes` flag** for CI/CD pipelines
5. **Use `--source-branch`** when creating tasks from specific branches
6. **Use `rover inspect <id> --file`** to view specific output files
7. **Use `rover shell <id>`** to manually test changes before merge
8. **Use `rover diff <id>`** to review all changes before merging
9. **Always run `rover init`** in new projects before creating tasks
10. **Check agent credentials** if task creation fails (for non-Claude agents)

---

## File Paths Reference

All relative paths are from project root:

| File/Directory | Purpose |
|---|---|
| `rover.json` | Project configuration |
| `.rover/settings.json` | User preferences |
| `.rover/tasks/` | All task data |
| `.rover/tasks/<id>/description.json` | Task metadata |
| `.rover/tasks/<id>/workspace/` | Git worktree |
| `.rover/tasks/<id>/iterations/<n>/` | Iteration data |
| `.rover/tasks/<id>/iterations/<n>/iteration.json` | Iteration metadata |
| `.rover/tasks/<id>/iterations/<n>/summary.md` | Execution summary |
| `.rover/tasks/<id>/iterations/<n>/plan.md` | Agent's execution plan |
| `.rover/tasks/<id>/iterations/<n>/changes.md` | Code changes summary |

---

## Source Code Structure

All commands located in:
- `/home/user/skills-claude/rover/packages/cli/src/commands/`

Command files:
- `init.ts` - Project initialization
- `task.ts` - Create new task
- `restart.ts` - Restart task
- `stop.ts` - Stop task
- `list.ts` - List tasks
- `inspect.ts` - Inspect task details
- `logs.ts` - View task logs
- `delete.ts` - Delete task
- `iterate.ts` - Add iteration
- `shell.ts` - Interactive shell
- `diff.ts` - Show code changes
- `merge.ts` - Merge changes
- `push.ts` - Push to remote
- `workflows/index.ts` - Workflow command setup
- `workflows/list.ts` - List workflows
- `workflows/inspect.ts` - Inspect workflow

Program setup:
- `program.ts` - Command registration and setup

---

**End of Document**
