/**
 * API Route: /api/tasks/:id/restart
 *
 * Handles task restart operations:
 * - POST: Restart a task from the beginning or from a specific iteration
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention
 * - Sanitized error messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import type { RestartTaskResponse } from '@/types/api';

/**
 * POST /api/tasks/:id/restart
 *
 * Restarts a task's execution
 * This will stop the current execution (if running) and start it again
 *
 * Executes: rover restart <id>
 *
 * Request body (optional):
 * {
 *   fromIteration?: number  // Restart from specific iteration (not yet supported by CLI)
 * }
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Success status with updated task data or error
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<RestartTaskResponse>> {
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

    // Note: fromIteration parameter not yet supported by Rover CLI
    // If it becomes available, add validation here

    // Execute rover restart command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.restartTask(taskId);

    if (!result.success) {
      console.error('[API] Rover restart failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to restart task.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('already running')) {
        errorMessage = `Task ${taskId} is already running.`;
        statusCode = 409;
      } else if (result.stderr?.includes('cannot restart') || result.stderr?.includes('invalid state')) {
        errorMessage = `Cannot restart task ${taskId} in its current state.`;
        statusCode = 409;
      } else if (result.stderr?.includes('credentials') || result.stderr?.includes('configuration')) {
        errorMessage = 'AI agent credentials not configured. Please set up your AI agent first.';
        statusCode = 500;
      } else if (result.stderr?.includes('container') || result.stderr?.includes('docker')) {
        errorMessage = 'Docker container error. Ensure Docker is running and configured correctly.';
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

    // Fetch updated task data after restart
    const inspectResult = await roverCLI.inspectTask(taskId);

    if (inspectResult.success && inspectResult.data) {
      return NextResponse.json(
        {
          success: true,
          data: inspectResult.data,
        },
        { status: 200 }
      );
    }

    // If inspect fails, still return success for restart operation
    return NextResponse.json(
      {
        success: true,
        data: {
          id: taskId,
          message: 'Task restarted successfully',
        } as any, // Type assertion
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error in POST /api/tasks/:id/restart:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while restarting the task.',
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
