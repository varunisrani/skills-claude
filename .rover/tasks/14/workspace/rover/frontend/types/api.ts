/**
 * API request/response TypeScript type definitions for Rover Frontend
 *
 * These types define the contract between the Next.js frontend API routes
 * and the Rover CLI commands they execute.
 */

import type { Task, TaskStatus, TaskSummary } from './task';
import type { Iteration, IterationStatus, IterationSummary } from './iteration';
import type { ProjectConfig, UserSettings, AIAgent } from './config';

/**
 * Base API response structure
 */
export interface APIResponse<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Response data (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Additional error details */
  errors?: string[];
}

/**
 * Paginated API response
 */
export interface PaginatedAPIResponse<T> extends APIResponse<T[]> {
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;

    /** Number of items per page */
    limit: number;

    /** Total number of items */
    total: number;

    /** Total number of pages */
    pages: number;
  };
}

// ===========================
// Project Initialization
// ===========================

/**
 * Request to initialize a Rover project
 * POST /api/init
 */
export interface InitProjectRequest {
  /** Optional project path (defaults to current directory) */
  path?: string;

  /** Skip interactive prompts and use defaults */
  yes?: boolean;
}

/**
 * Response from project initialization
 */
export type InitProjectResponse = APIResponse<{
  /** Path to the initialized project */
  projectPath: string;

  /** Generated project configuration */
  config: ProjectConfig;
}>;

// ===========================
// Task Operations
// ===========================

/**
 * Request to create a new task
 * POST /api/tasks
 */
export interface CreateTaskRequest {
  /** Task description or brief summary */
  description: string;

  /** Workflow to execute (e.g., 'swe', 'tech-writer') */
  workflow?: string;

  /** AI agent to use */
  agent?: AIAgent;

  /** Source branch to create task from */
  sourceBranch?: string;

  /** Target branch for merging */
  targetBranch?: string;

  /** Import from GitHub issue URL */
  fromGithub?: string;

  /** Workflow input parameters */
  inputs?: Record<string, string>;
}

/**
 * Response from creating a task
 */
export type CreateTaskResponse = APIResponse<Task>;

/**
 * Request to list tasks
 * GET /api/tasks
 */
export interface ListTasksRequest {
  /** Filter by status */
  status?: TaskStatus | TaskStatus[];

  /** Filter by workflow */
  workflow?: string;

  /** Search query */
  search?: string;

  /** Page number (1-indexed) */
  page?: number;

  /** Items per page */
  limit?: number;
}

/**
 * Response from listing tasks
 */
export type ListTasksResponse = PaginatedAPIResponse<TaskSummary>;

/**
 * Request to get task details
 * GET /api/tasks/:id
 */
export interface GetTaskRequest {
  /** Include full iteration history */
  includeIterations?: boolean;
}

/**
 * Response from getting task details
 */
export type GetTaskResponse = APIResponse<Task & {
  /** Iteration history (if requested) */
  iterationHistory?: IterationSummary[];
}>;

/**
 * Request to delete a task
 * DELETE /api/tasks/:id
 */
export interface DeleteTaskRequest {
  /** Also delete the git worktree */
  deleteWorktree?: boolean;
}

/**
 * Response from deleting a task
 */
export type DeleteTaskResponse = APIResponse<void>;

// ===========================
// Task Actions
// ===========================

/**
 * Request to restart a task
 * POST /api/tasks/:id/restart
 */
export interface RestartTaskRequest {
  /** Restart from specific iteration */
  fromIteration?: number;
}

/**
 * Response from restarting a task
 */
export type RestartTaskResponse = APIResponse<Task>;

/**
 * Request to stop a task
 * POST /api/tasks/:id/stop
 */
export interface StopTaskRequest {
  /** Stop and remove all containers */
  removeAll?: boolean;
}

/**
 * Response from stopping a task
 */
export type StopTaskResponse = APIResponse<void>;

/**
 * Request to add an iteration
 * POST /api/tasks/:id/iterate
 */
export interface IterateTaskRequest {
  /** Iteration instructions/refinements */
  instructions: string;

  /** Optional iteration title */
  title?: string;
}

/**
 * Response from adding an iteration
 */
export type IterateTaskResponse = APIResponse<Iteration>;

/**
 * Request to merge task changes
 * POST /api/tasks/:id/merge
 */
export interface MergeTaskRequest {
  /** Force merge even if conflicts exist */
  force?: boolean;

  /** Target branch (defaults to source branch) */
  targetBranch?: string;
}

/**
 * Response from merging a task
 */
export type MergeTaskResponse = APIResponse<{
  /** Whether merge was successful */
  merged: boolean;

  /** Conflicts encountered (if any) */
  conflicts?: string[];
}>;

/**
 * Request to push task changes
 * POST /api/tasks/:id/push
 */
export interface PushTaskRequest {
  /** Commit message */
  message?: string;

  /** Create a pull request */
  createPR?: boolean;

  /** PR title (if createPR is true) */
  prTitle?: string;

  /** PR description (if createPR is true) */
  prDescription?: string;
}

/**
 * Response from pushing a task
 */
export type PushTaskResponse = APIResponse<{
  /** Whether push was successful */
  pushed: boolean;

  /** Pull request URL (if created) */
  prUrl?: string;
}>;

/**
 * Request to execute shell command in task container
 * POST /api/tasks/:id/shell
 */
export interface ShellCommandRequest {
  /** Command to execute */
  command: string;

  /** Execute in container (vs worktree) */
  inContainer?: boolean;
}

/**
 * Response from shell command execution
 */
export type ShellCommandResponse = APIResponse<{
  /** Command output */
  output: string;

  /** Exit code */
  exitCode: number;
}>;

// ===========================
// Task Data
// ===========================

/**
 * Request to get task logs
 * GET /api/tasks/:id/logs
 */
export interface GetLogsRequest {
  /** Iteration number (defaults to latest) */
  iteration?: number;

  /** Follow logs in real-time */
  follow?: boolean;

  /** Number of lines from the end */
  tail?: number;
}

/**
 * Response from getting task logs
 */
export type GetLogsResponse = APIResponse<{
  /** Log content */
  logs: string;

  /** Whether there are more logs available */
  hasMore: boolean;
}>;

/**
 * Request to get task diff
 * GET /api/tasks/:id/diff
 */
export interface GetDiffRequest {
  /** Branch to compare against (defaults to source branch) */
  branch?: string;

  /** Specific file to diff (optional) */
  file?: string;

  /** Include binary files */
  includeBinary?: boolean;
}

/**
 * Response from getting task diff
 */
export type GetDiffResponse = APIResponse<{
  /** Diff content in unified format */
  diff: string;

  /** List of changed files */
  files: string[];

  /** Statistics */
  stats: {
    /** Files changed */
    filesChanged: number;

    /** Lines added */
    insertions: number;

    /** Lines deleted */
    deletions: number;
  };
}>;

/**
 * Request to inspect task details
 * GET /api/tasks/:id/inspect
 */
export interface InspectTaskRequest {
  /** Include container details */
  includeContainer?: boolean;
}

/**
 * Response from inspecting a task
 */
export type InspectTaskResponse = APIResponse<{
  /** Task data */
  task: Task;

  /** Current iteration details */
  currentIteration?: Iteration;

  /** Current iteration status */
  currentIterationStatus?: IterationStatus;

  /** Container details (if requested) */
  container?: {
    id: string;
    status: string;
    image: string;
    created: string;
  };
}>;

// ===========================
// Real-Time Updates (SSE)
// ===========================

/**
 * Server-Sent Event data structure
 */
export interface SSEEvent<T = unknown> {
  /** Event type */
  type: string;

  /** Event data */
  data: T;

  /** Event timestamp */
  timestamp: string;
}

/**
 * Task status update event
 * Event: task-status
 */
export interface TaskStatusUpdateEvent {
  /** Task ID */
  taskId: number;

  /** New status */
  status: TaskStatus;

  /** Current iteration number */
  iteration: number;

  /** Iteration status */
  iterationStatus: IterationStatus;
}

/**
 * Task progress update event
 * Event: task-progress
 */
export interface TaskProgressEvent {
  /** Task ID */
  taskId: number;

  /** Progress percentage (0-100) */
  progress: number;

  /** Current step description */
  currentStep: string;
}

/**
 * Task log entry event
 * Event: task-log
 */
export interface TaskLogEvent {
  /** Task ID */
  taskId: number;

  /** Log line */
  log: string;

  /** Log timestamp */
  timestamp: string;
}

// ===========================
// Workflows
// ===========================

/**
 * Request to list workflows
 * GET /api/workflows
 */
export interface ListWorkflowsRequest {
  /** Filter by workflow name */
  search?: string;
}

/**
 * Workflow summary
 */
export interface WorkflowSummary {
  /** Workflow name */
  name: string;

  /** Workflow description */
  description: string;

  /** Default AI agent tool */
  defaultTool?: string;

  /** Number of steps */
  stepCount: number;
}

/**
 * Response from listing workflows
 */
export type ListWorkflowsResponse = APIResponse<WorkflowSummary[]>;

/**
 * Request to get workflow details
 * GET /api/workflows/:name
 */
export interface GetWorkflowRequest {
  /** Include step details */
  includeSteps?: boolean;
}

/**
 * Response from getting workflow details
 */
export type GetWorkflowResponse = APIResponse<{
  /** Workflow name */
  name: string;

  /** Workflow description */
  description: string;

  /** Workflow inputs */
  inputs?: Array<{
    name: string;
    description: string;
    type: string;
    required: boolean;
    default?: unknown;
  }>;

  /** Workflow outputs */
  outputs?: Array<{
    name: string;
    description: string;
    type: string;
  }>;

  /** Workflow steps (if requested) */
  steps?: unknown[];
}>;

// ===========================
// Configuration
// ===========================

/**
 * Request to get configuration
 * GET /api/config
 */
export interface GetConfigRequest {
  /** Include MCP status */
  includeMCPStatus?: boolean;
}

/**
 * Response from getting configuration
 */
export type GetConfigResponse = APIResponse<{
  /** Project configuration */
  project: ProjectConfig;

  /** User settings */
  user: UserSettings;

  /** MCP server statuses (if requested) */
  mcpStatus?: Array<{
    name: string;
    running: boolean;
    error?: string;
  }>;
}>;

/**
 * Request to update configuration
 * PUT /api/config
 */
export interface UpdateConfigRequest {
  /** Project configuration updates */
  project?: Partial<ProjectConfig>;

  /** User settings updates */
  user?: Partial<UserSettings>;
}

/**
 * Response from updating configuration
 */
export type UpdateConfigResponse = APIResponse<{
  /** Updated project configuration */
  project: ProjectConfig;

  /** Updated user settings */
  user: UserSettings;
}>;
