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
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema, StopRequestSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
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
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid task ID. Must be a positive integer.',
          },
          { status: 400 }
        );
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
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body.',
        },
        { status: 400 }
      );
    }

    // Validate request body with Zod schema
    let validatedData;
    try {
      validatedData = StopRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        return NextResponse.json(
          {
            success: false,
            error: `Validation failed: ${errorMessages.join(', ')}`,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Execute rover stop command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.stopTask(taskId, validatedData.removeAll);

    if (!result.success) {
      console.error('[API] Rover stop failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to stop task.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('not running') || result.stderr?.includes('already stopped')) {
        errorMessage = `Task ${taskId} is not currently running.`;
        statusCode = 409;
      } else if (result.stderr?.includes('container') || result.stderr?.includes('docker')) {
        errorMessage = 'Docker container error. The task may already be stopped.';
        statusCode = 500;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error in POST /api/tasks/:id/stop:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while stopping the task.',
      },
      { status: 500 }
    );
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
