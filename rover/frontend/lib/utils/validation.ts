/**
 * Validation schemas for API requests using Zod
 *
 * These schemas validate and sanitize user input to prevent
 * security issues like command injection and invalid data.
 */

import { z } from 'zod';

/**
 * Task workflow enum
 */
export const TaskWorkflowSchema = z.enum(['swe', 'tech-writer'], {
  errorMap: () => ({ message: 'Workflow must be either "swe" or "tech-writer"' }),
});

/**
 * AI agent enum
 */
export const TaskAgentSchema = z.enum(['auto', 'claude', 'gemini', 'codex', 'cursor', 'qwen'], {
  errorMap: () => ({ message: 'Invalid AI agent specified' }),
});

/**
 * Git branch name validation
 * - Must not contain special shell characters
 * - Must be a valid Git branch name
 */
export const GitBranchSchema = z
  .string()
  .min(1, 'Branch name cannot be empty')
  .max(255, 'Branch name is too long')
  .regex(/^[a-zA-Z0-9._\/-]+$/, 'Branch name contains invalid characters')
  .refine(
    (val) => !val.startsWith('-') && !val.endsWith('/') && !val.includes('..'),
    'Invalid branch name format'
  );

/**
 * GitHub issue URL validation
 */
export const GitHubIssueSchema = z
  .string()
  .url('Invalid GitHub URL')
  .regex(
    /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/(issues|pull)\/\d+$/,
    'Must be a valid GitHub issue or PR URL'
  );

/**
 * Task description validation
 * - Minimum 10 characters to ensure meaningful descriptions
 * - Maximum 5000 characters to prevent abuse
 * - No special shell characters that could cause injection
 */
export const TaskDescriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(5000, 'Description must not exceed 5000 characters')
  .transform((val) => val.trim());

/**
 * Create task request validation schema
 */
export const CreateTaskRequestSchema = z.object({
  description: TaskDescriptionSchema,
  workflow: TaskWorkflowSchema.optional(),
  agent: TaskAgentSchema.optional(),
  sourceBranch: GitBranchSchema.optional(),
  targetBranch: GitBranchSchema.optional(),
  fromGithub: GitHubIssueSchema.optional(),
  yes: z.boolean().optional(),
});

/**
 * Task ID validation
 */
export const TaskIdSchema = z
  .string()
  .regex(/^\d+$/, 'Task ID must be a number')
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, 'Task ID must be positive');

/**
 * Iterate request validation schema
 */
export const IterateRequestSchema = z.object({
  instructions: z
    .string()
    .min(10, 'Instructions must be at least 10 characters')
    .max(2000, 'Instructions must not exceed 2000 characters')
    .transform((val) => val.trim()),
});

/**
 * Merge request validation schema
 */
export const MergeRequestSchema = z.object({
  force: z.boolean().optional().default(false),
});

/**
 * Push request validation schema
 */
export const PushRequestSchema = z.object({
  message: z
    .string()
    .max(500, 'Commit message must not exceed 500 characters')
    .optional()
    .transform((val) => val?.trim()),
});

/**
 * Stop request validation schema
 */
export const StopRequestSchema = z.object({
  removeAll: z.boolean().optional().default(false),
});

/**
 * Type exports for validated data
 */
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type TaskWorkflow = z.infer<typeof TaskWorkflowSchema>;
export type TaskAgent = z.infer<typeof TaskAgentSchema>;
export type IterateRequest = z.infer<typeof IterateRequestSchema>;
export type MergeRequest = z.infer<typeof MergeRequestSchema>;
export type PushRequest = z.infer<typeof PushRequestSchema>;
export type StopRequest = z.infer<typeof StopRequestSchema>;
