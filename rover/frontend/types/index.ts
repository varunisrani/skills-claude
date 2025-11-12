/**
 * Rover Frontend Type Definitions
 *
 * Central export point for all TypeScript types used in the Rover frontend.
 * These types are derived from the Rover CLI data structures to ensure
 * consistency between the backend and frontend.
 */

// ===========================
// Task Types
// ===========================
export type {
  // Core task types
  Task,
  TaskStatus,
  LegacyTaskStatus,
  TaskExecutionStatus,
  TaskStatusDetail,
  TaskSummary,

  // Task creation and metadata
  CreateTaskData,
  TaskExpansion,
  StatusMetadata,
  IterationMetadata,

  // Task filtering and sorting
  TaskFilters,
  TaskSort,
  TaskSortField,
  TaskSortDirection,
} from './task';

// ===========================
// Iteration Types
// ===========================
export type {
  // Core iteration types
  Iteration,
  IterationStatus,
  IterationStatusName,
  IterationPreviousContext,
  IterationSummary,

  // Iteration creation and tracking
  CreateIterationData,
  IterationFiles,
  IterationLogEntry,
  IterationProgressUpdate,
} from './iteration';

// ===========================
// Configuration Types
// ===========================
export type {
  // Environment types
  Language,
  PackageManager,
  TaskManager,
  AIAgent,

  // Configuration schemas
  MCP,
  ProjectConfig,
  UserSettings,
  RoverConfig,

  // Environment detection
  EnvironmentDetection,
  ProjectInstructions,
  ConfigValidation,
  MCPStatus,
} from './config';

// ===========================
// API Types
// ===========================
export type {
  // Base API types
  APIResponse,
  PaginatedAPIResponse,

  // Project initialization
  InitProjectRequest,
  InitProjectResponse,

  // Task operations
  CreateTaskRequest,
  CreateTaskResponse,
  ListTasksRequest,
  ListTasksResponse,
  GetTaskRequest,
  GetTaskResponse,
  DeleteTaskRequest,
  DeleteTaskResponse,

  // Task actions
  RestartTaskRequest,
  RestartTaskResponse,
  StopTaskRequest,
  StopTaskResponse,
  IterateTaskRequest,
  IterateTaskResponse,
  MergeTaskRequest,
  MergeTaskResponse,
  PushTaskRequest,
  PushTaskResponse,
  ShellCommandRequest,
  ShellCommandResponse,

  // Task data
  GetLogsRequest,
  GetLogsResponse,
  GetDiffRequest,
  GetDiffResponse,
  InspectTaskRequest,
  InspectTaskResponse,

  // Real-time updates (SSE)
  SSEEvent,
  TaskStatusUpdateEvent,
  TaskProgressEvent,
  TaskLogEvent,

  // Workflows
  ListWorkflowsRequest,
  ListWorkflowsResponse,
  WorkflowSummary,
  GetWorkflowRequest,
  GetWorkflowResponse,

  // Configuration API
  GetConfigRequest,
  GetConfigResponse,
  UpdateConfigRequest,
  UpdateConfigResponse,
} from './api';

// ===========================
// Re-export common constants
// ===========================

/**
 * Current schema versions
 * These should match the Rover CLI schema versions
 */
export const SCHEMA_VERSIONS = {
  TASK: '1.1',
  ITERATION: '1.0',
  WORKFLOW: '1.0',
  PROJECT_CONFIG: '1.2',
  USER_SETTINGS: '1.0',
} as const;

/**
 * File name constants
 * Standard file names used in the .rover directory structure
 */
export const ROVER_FILES = {
  TASK: 'task.json',
  ITERATION: 'iteration.json',
  STATUS: 'status.json',
  PROJECT_CONFIG: 'rover.json',
  USER_SETTINGS: 'settings.json',
  PLAN: 'plan.md',
  SUMMARY: 'summary.md',
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  WORKFLOW: 'swe',
  AGENT: 'claude' as const,
  PAGE_SIZE: 20,
  MAX_LOG_LINES: 1000,
} as const;
