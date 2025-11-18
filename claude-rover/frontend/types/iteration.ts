/**
 * Iteration-related TypeScript type definitions for Rover Frontend
 *
 * These types match the Rover CLI data structures defined in:
 * - rover/packages/schemas/src/iteration/schema.ts
 * - rover/packages/schemas/src/iteration-status/schema.ts
 */

/**
 * Iteration status enumeration
 * Represents the current state of an iteration
 */
export type IterationStatusName =
  | 'initializing'  // Setting up iteration environment
  | 'running'       // Iteration is actively being executed
  | 'completed'     // Iteration finished successfully
  | 'failed';       // Iteration execution failed

/**
 * Previous iteration context
 * Contains information from the previous iteration to inform the next one
 */
export interface IterationPreviousContext {
  /** Previous iteration's plan.md content */
  plan?: string;

  /** Previous iteration's summary.md content */
  summary?: string;

  /** Previous iteration number */
  iterationNumber?: number;
}

/**
 * Complete iteration configuration
 * Stored in .rover/tasks/:id/iterations/:n/iteration.json
 */
export interface Iteration {
  /** Schema version for data migration */
  version: string;

  /** Parent task ID */
  id: number;

  /** Iteration number (starts at 1) */
  iteration: number;

  /** Iteration title/summary */
  title: string;

  /** Detailed iteration description/instructions */
  description: string;

  /** ISO 8601 datetime when iteration was created */
  createdAt: string;

  /** Context from previous iteration */
  previousContext: IterationPreviousContext;
}

/**
 * Iteration status tracking
 * Stored in .rover/tasks/:id/iterations/:n/status.json
 * Used for real-time progress monitoring
 */
export interface IterationStatus {
  /** Original Task ID (UUID format) */
  taskId: string;

  /** Current iteration status */
  status: IterationStatusName;

  /** Current step name and description */
  currentStep: string;

  /** Progress percentage (0-100) */
  progress: number;

  /** ISO 8601 datetime when iteration started */
  startedAt: string;

  /** ISO 8601 datetime of last status update */
  updatedAt: string;

  /** ISO 8601 datetime when iteration completed */
  completedAt?: string;

  /** Error message if iteration failed */
  error?: string;
}

/**
 * Iteration summary for list views
 * A lightweight version for displaying iteration history
 */
export interface IterationSummary {
  /** Iteration number */
  iteration: number;

  /** Iteration title */
  title: string;

  /** Current status */
  status: IterationStatusName;

  /** ISO 8601 datetime when created */
  createdAt: string;

  /** ISO 8601 datetime when completed */
  completedAt?: string;

  /** Whether this iteration has an error */
  hasError: boolean;
}

/**
 * Data required to create a new iteration
 */
export interface CreateIterationData {
  /** Task ID to iterate on */
  taskId: number;

  /** Iteration instructions/description */
  instructions: string;

  /** Optional iteration title */
  title?: string;
}

/**
 * Iteration file structure
 * Represents the files associated with an iteration
 */
export interface IterationFiles {
  /** Path to iteration.json */
  iterationFile: string;

  /** Path to status.json */
  statusFile: string;

  /** Path to logs directory */
  logsDir: string;

  /** Path to plan.md (if exists) */
  planFile?: string;

  /** Path to summary.md (if exists) */
  summaryFile?: string;
}

/**
 * Iteration log entry
 * Represents a single log line from the iteration execution
 */
export interface IterationLogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Log level (info, warn, error, debug) */
  level: 'info' | 'warn' | 'error' | 'debug';

  /** Log message */
  message: string;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Iteration progress update
 * Used for real-time progress tracking via SSE
 */
export interface IterationProgressUpdate {
  /** Task ID */
  taskId: number;

  /** Iteration number */
  iteration: number;

  /** Current status */
  status: IterationStatusName;

  /** Current step description */
  currentStep: string;

  /** Progress percentage (0-100) */
  progress: number;

  /** Timestamp of this update */
  timestamp: string;

  /** Optional error message */
  error?: string;
}
