/**
 * API Route: /api/tasks/:id/stop
 *
 * Handles task stopping operations:
 * - POST: Stop a running task
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention
 * - Sanitized error messages
 * - Centralized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema, StopRequestSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import {
  handleValidationError,
  handleRoverError,
  handleGenericError,
  handleInvalidTaskId,
  handleInvalidJSON,
} from '@/lib/api/api-error-handler';
import type { StopTaskResponse } from '@/types/api';

/**
 * POST /api/tasks/:id/stop
 *
 * Stops a running task's execution
 * Optionally removes all containers associated with the task
 *
 * Executes: rover stop <id> [--remove-all]
 *
 * Request body (optional):
 * {
 *   removeAll?: boolean  // Stop and remove all containers (default: false)
 * }
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Success status or error
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<StopTaskResponse>> {
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

    // Parse request body (optional)
    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      return handleInvalidJSON() as any;
    }

    // Validate request body with Zod schema
    let validatedData;
    try {
      validatedData = StopRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error) as any;
      }
      throw error;
    }

    // Execute rover stop command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.stopTask(taskId, validatedData.removeAll);

    if (!result.success) {
      return handleRoverError(result as any, `POST /api/tasks/${taskId}/stop`) as any;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleGenericError(error, 'POST /api/tasks/:id/stop') as any;
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
