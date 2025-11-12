/**
 * Task-related TypeScript type definitions for Rover Frontend
 *
 * These types match the Rover CLI data structures defined in:
 * - rover/packages/schemas/src/task-description/schema.ts
 * - rover/packages/cli/src/types.ts
 */

/**
 * Task status enumeration
 * Represents the lifecycle state of a task
 */
export type TaskStatus =
  | 'NEW'           // Task created but not yet started
  | 'IN_PROGRESS'   // Task is currently being executed
  | 'ITERATING'     // Task is being refined with additional instructions
  | 'COMPLETED'     // Task execution completed successfully
  | 'FAILED'        // Task execution failed
  | 'MERGED'        // Task changes merged to target branch
  | 'PUSHED';       // Task changes pushed to remote repository

/**
 * Legacy task status format (used by older CLI versions)
 * Maps to lowercase with underscores
 */
export type LegacyTaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Detailed task execution status
 * Tracks the progress of task execution through different phases
 */
export type TaskExecutionStatus =
  | 'new'           // Task initialized
  | 'initializing'  // Setting up environment
  | 'installing'    // Installing dependencies
  | 'running'       // Agent is working on the task
  | 'completed'     // Execution completed
  | 'merged'        // Changes merged
  | 'pushed'        // Changes pushed to remote
  | 'failed';       // Execution failed

/**
 * Complete task description and metadata
 * This is the primary task data structure stored in .rover/tasks/:id/task.json
 *
 * Note: Different Rover commands return different field names:
 * - `rover inspect <id>` returns `id`
 * - `rover task` (create) returns `taskId`
 * We support both for compatibility.
 */
export interface Task {
  // Core Identity
  /** Numeric task identifier (sequential) - set by 'rover inspect' */
  id?: number;

  /** Numeric task identifier (sequential) - set by 'rover task' command */
  taskId?: number;

  /** Unique UUID for the task */
  uuid?: string;

  /** Task title/summary */
  title?: string;

  /** Detailed task description */
  description?: string;

  /** Input parameters provided to the workflow */
  inputs?: Record<string, string>;

  // Status & Lifecycle
  /** Current task status */
  status?: TaskStatus;

  /** ISO 8601 datetime when task was created */
  createdAt?: string;

  /** ISO 8601 datetime when task execution started */
  startedAt?: string;

  /** ISO 8601 datetime when task was completed */
  completedAt?: string;

  /** ISO 8601 datetime when task failed */
  failedAt?: string;

  /** ISO 8601 datetime of the last iteration */
  lastIterationAt?: string;

  /** ISO 8601 datetime of the last status check */
  lastStatusCheck?: string;

  // Execution Context
  /** Current iteration number (starts at 1) */
  iterations?: number;

  /** Workflow name (e.g., 'swe', 'tech-writer') */
  workflowName?: string;

  /** Path to the git worktree for this task */
  worktreePath?: string;

  /** Git branch name for this task */
  branchName?: string;

  /** AI agent being used (e.g., 'claude', 'gemini', 'codex') */
  agent?: string;

  /** Source branch the task was created from */
  sourceBranch?: string;

  // Docker Execution
  /** Docker container ID where the task is running */
  containerId?: string;

  /** Current execution status within the container */
  executionStatus?: string;

  /** ISO 8601 datetime when the container started running */
  runningAt?: string;

  /** ISO 8601 datetime when an error occurred */
  errorAt?: string;

  /** Container exit code */
  exitCode?: number;

  // Error Handling
  /** Error message if task failed */
  error?: string;

  // Restart Tracking
  /** Number of times this task has been restarted */
  restartCount?: number;

  /** ISO 8601 datetime of the last restart */
  lastRestartAt?: string;

  // Metadata
  /** Schema version for data migration */
  version?: string;

  // Additional fields from rover task command
  /** Workspace directory path (from rover task command) */
  workspace?: string;

  /** Where the task was saved (from rover task command) */
  savedTo?: string;

  /** Whether task creation was successful (from rover task command) */
  success?: boolean;
}

/**
 * Detailed task status tracking
 * Used for real-time progress monitoring
 */
export interface TaskStatusDetail {
  /** Task identifier */
  taskId: string;

  /** Current execution status */
  status: TaskExecutionStatus;

  /** Description of the current step */
  currentStep: string;

  /** Progress percentage (0-100) */
  progress?: number;

  /** ISO 8601 datetime when execution started */
  startedAt: string;

  /** ISO 8601 datetime of last update */
  updatedAt: string;

  /** ISO 8601 datetime when completed */
  completedAt?: string;

  /** ISO 8601 datetime when merged */
  mergedAt?: string;

  /** ISO 8601 datetime when pushed */
  pushedAt?: string;

  /** Error message if failed */
  error?: string;
}

/**
 * Task expansion result from AI
 * Used when AI expands a brief description into a full task
 */
export interface TaskExpansion {
  /** Expanded task title */
  title: string;

  /** Expanded task description */
  description: string;
}

/**
 * Data required to create a new task
 */
export interface CreateTaskData {
  /** Task ID number */
  id: number;

  /** Task title */
  title: string;

  /** Task description */
  description: string;

  /** Input parameters for the workflow */
  inputs: Map<string, string>;

  /** Workflow name to execute */
  workflowName: string;

  /** Optional UUID (will be generated if not provided) */
  uuid?: string;

  /** AI agent to use for execution */
  agent?: string;

  /** Source branch task was created from */
  sourceBranch?: string;
}

/**
 * Metadata for task status updates
 */
export interface StatusMetadata {
  /** ISO 8601 timestamp of the status change */
  timestamp?: string;

  /** Error message if status change represents a failure */
  error?: string;
}

/**
 * Metadata for iteration updates
 */
export interface IterationMetadata {
  /** Iteration title */
  title?: string;

  /** Iteration description */
  description?: string;

  /** ISO 8601 timestamp when iteration was created */
  timestamp?: string;
}

/**
 * Task summary for list views
 * A lightweight version of Task for displaying in tables/cards
 */
export interface TaskSummary {
  id?: number;
  taskId?: number;
  uuid?: string;
  title?: string;
  status?: TaskStatus;
  workflowName?: string;
  agent?: string;
  createdAt?: string;
  updatedAt?: string;
  iterations?: number;
  branchName?: string;
}

/**
 * Task filtering options
 */
export interface TaskFilters {
  /** Filter by status */
  status?: TaskStatus | TaskStatus[];

  /** Filter by workflow name */
  workflow?: string;

  /** Filter by agent */
  agent?: string;

  /** Search in title and description */
  search?: string;
}

/**
 * Task sorting options
 */
export type TaskSortField = 'id' | 'createdAt' | 'updatedAt' | 'status' | 'title';
export type TaskSortDirection = 'asc' | 'desc';

export interface TaskSort {
  field: TaskSortField;
  direction: TaskSortDirection;
}
