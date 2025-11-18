/**
 * API Route: /api/tasks/:id
 *
 * Handles operations on individual tasks:
 * - GET: Get single task details
 * - DELETE: Delete a task
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention via spawn without shell
 * - Sanitized error messages
 * - Centralized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import {
  handleValidationError,
  handleRoverError,
  handleGenericError,
  handleInvalidTaskId,
  createSuccessResponse,
} from '@/lib/api/api-error-handler';
import type { GetTaskResponse, DeleteTaskResponse } from '@/types/api';

/**
 * GET /api/tasks/:id
 *
 * Retrieves detailed information about a specific task
 * Executes: rover inspect <id> --json
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Task details or error
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetTaskResponse>> {
  try {
    const { id } = await context.params;

    // Validate task ID
    let taskId: number;
    try {
      taskId = TaskIdSchema.parse(id);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleInvalidTaskId() as any;
      }
      throw error;
    }

    // Execute rover inspect command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.inspectTask(taskId);

    if (!result.success) {
      return handleRoverError(result as any, `GET /api/tasks/${taskId}`) as any;
    }

    // Return task data (already parsed and validated)
    const taskData = result.data;

    if (!taskData) {
      return handleGenericError(
        new Error('Task data not available'),
        `GET /api/tasks/${taskId}`
      ) as any;
    }

    return createSuccessResponse(taskData) as any;
  } catch (error) {
    return handleGenericError(error, 'GET /api/tasks/:id') as any;
  }
}

/**
 * DELETE /api/tasks/:id
 *
 * Deletes a task and optionally its worktree
 * Executes: rover delete <id>
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Success status or error
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteTaskResponse>> {
  try {
    const { id } = await context.params;

    // Validate task ID
    let taskId: number;
    try {
      taskId = TaskIdSchema.parse(id);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleInvalidTaskId() as any;
      }
      throw error;
    }

    // Execute rover delete command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.deleteTask(taskId);

    if (!result.success) {
      return handleRoverError(result as any, `DELETE /api/tasks/${taskId}`) as any;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleGenericError(error, 'DELETE /api/tasks/:id') as any;
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
