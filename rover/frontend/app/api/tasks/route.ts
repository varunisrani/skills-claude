/**
 * API Route: /api/tasks
 *
 * Handles task management operations:
 * - GET: List all tasks
 * - POST: Create a new task
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention via spawn without shell
 * - Sanitized error messages
 * - Request validation
 * - Centralized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { CreateTaskRequestSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import {
  handleValidationError,
  handleRoverError,
  handleGenericError,
  handleInvalidJSON,
  createSuccessResponse,
} from '@/lib/api/api-error-handler';
import type { ListTasksResponse, CreateTaskResponse } from '@/types/api';
import type { TaskSummary } from '@/types/task';

/**
 * GET /api/tasks
 *
 * Lists all tasks by executing `rover list --json`
 *
 * @returns JSON array of tasks or error
 */
export async function GET(request: NextRequest): Promise<NextResponse<ListTasksResponse>> {
  try {
    const roverCLI = getRoverCLI();

    // Execute rover list command
    const result = await roverCLI.listTasks();

    if (!result.success) {
      return handleRoverError(result as any, 'GET /api/tasks') as any;
    }

    // Return tasks array with pagination (result.data is already parsed and validated)
    const tasks = result.data || [];
    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page: 1,
        limit: 50,
        total: tasks.length,
        pages: 1,
      },
    });
  } catch (error) {
    return handleGenericError(error, 'GET /api/tasks') as any;
  }
}

/**
 * POST /api/tasks
 *
 * Creates a new task by executing `rover task`
 *
 * Request body:
 * {
 *   description: string (required, 10-5000 chars)
 *   workflow?: 'swe' | 'tech-writer'
 *   agent?: 'auto' | 'claude' | 'gemini' | 'codex' | 'cursor' | 'qwen'
 *   sourceBranch?: string
 *   targetBranch?: string
 *   fromGithub?: string (GitHub issue/PR URL)
 *   yes?: boolean (skip confirmations)
 * }
 *
 * @returns Created task data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateTaskResponse>> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return handleInvalidJSON() as any;
    }

    // Validate request body with Zod schema
    let validatedData;
    try {
      validatedData = CreateTaskRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error) as any;
      }
      throw error;
    }

    // Execute rover task command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.createTask({
      description: validatedData.description,
      workflow: validatedData.workflow,
      agent: validatedData.agent,
      sourceBranch: validatedData.sourceBranch,
      targetBranch: validatedData.targetBranch,
      fromGithub: validatedData.fromGithub,
      yes: validatedData.yes ?? true, // Default to yes for API calls
    });

    if (!result.success) {
      return handleRoverError(result as any, 'POST /api/tasks') as any;
    }

    // result.data contains the parsed and validated TaskDescription
    const taskData = result.data;

    if (!taskData) {
      return handleGenericError(
        new Error('Task created but no data returned'),
        'POST /api/tasks'
      ) as any;
    }

    // Return created task data (full Task object)
    return createSuccessResponse(taskData, 201) as any;
  } catch (error) {
    return handleGenericError(error, 'POST /api/tasks') as any;
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
