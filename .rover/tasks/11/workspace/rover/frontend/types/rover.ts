/**
 * Type definitions for Rover CLI integration
 * Mirrors the schemas from rover-schemas package
 */

import { z } from 'zod';

// Task Status
export const TaskStatusSchema = z.enum([
  'NEW',
  'IN_PROGRESS',
  'ITERATING',
  'COMPLETED',
  'FAILED',
  'MERGED',
  'PUSHED',
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// Iteration Status
export const IterationStatusNameSchema = z.enum([
  'initializing',
  'running',
  'completed',
  'failed',
]);

export type IterationStatusName = z.infer<typeof IterationStatusNameSchema>;

// Task Description Schema
export const TaskDescriptionSchema = z.object({
  id: z.number().int().positive(),
  uuid: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  inputs: z.record(z.string(), z.string()),
  status: TaskStatusSchema,
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  failedAt: z.string().datetime().optional(),
  lastIterationAt: z.string().datetime().optional(),
  lastStatusCheck: z.string().datetime().optional(),
  iterations: z.number().int().min(1),
  workflowName: z.string().min(1),
  worktreePath: z.string(),
  branchName: z.string(),
  agent: z.string().optional(),
  sourceBranch: z.string().optional(),
  containerId: z.string().optional(),
  executionStatus: z.string().optional(),
  runningAt: z.string().datetime().optional(),
  errorAt: z.string().datetime().optional(),
  exitCode: z.number().int().optional(),
  error: z.string().optional(),
  restartCount: z.number().int().min(0).optional(),
  lastRestartAt: z.string().datetime().optional(),
  version: z.string(),
});

export type TaskDescription = z.infer<typeof TaskDescriptionSchema>;

// Iteration Status Schema
export const IterationStatusSchema = z.object({
  taskId: z.string(),
  status: IterationStatusNameSchema,
  currentStep: z.string(),
  progress: z.number(),
  startedAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  error: z.string().optional(),
});

export type IterationStatus = z.infer<typeof IterationStatusSchema>;

// Command Input Schemas for validation
export const CreateTaskInputSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  workflow: z.string().optional(),
  agent: z.string().optional(),
  sourceBranch: z.string().optional(),
  targetBranch: z.string().optional(),
  fromGithub: z.string().optional(),
  yes: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;

export const IterateTaskInputSchema = z.object({
  taskId: z.number().int().positive(),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters').max(5000, 'Instructions too long'),
});

export type IterateTaskInput = z.infer<typeof IterateTaskInputSchema>;

export const MergeTaskInputSchema = z.object({
  taskId: z.number().int().positive(),
  force: z.boolean().optional(),
});

export type MergeTaskInput = z.infer<typeof MergeTaskInputSchema>;

export const PushTaskInputSchema = z.object({
  taskId: z.number().int().positive(),
  message: z.string().optional(),
});

export type PushTaskInput = z.infer<typeof PushTaskInputSchema>;

// Command Result
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

// Workflow Types
export interface Workflow {
  name: string;
  description: string;
  inputs: Record<string, WorkflowInput>;
  outputs: Record<string, WorkflowOutput>;
  steps: WorkflowStep[];
}

export interface WorkflowInput {
  type: 'string' | 'boolean' | 'number';
  description: string;
  required?: boolean;
  default?: string | boolean | number;
}

export interface WorkflowOutput {
  type: 'string' | 'boolean' | 'number';
  description: string;
}

export interface WorkflowStep {
  name: string;
  type: 'agent' | 'command' | 'conditional' | 'parallel' | 'sequential';
  [key: string]: unknown;
}
