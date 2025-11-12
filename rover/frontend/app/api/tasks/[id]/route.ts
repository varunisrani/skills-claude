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
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
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

    // Execute rover inspect command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.inspectTask(taskId);

    if (!result.success) {
      console.error('[API] Rover inspect failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to retrieve task details.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: statusCode }
      );
    }

    // Return task data (already parsed and validated)
    const taskData = result.data;

    if (!taskData) {
      console.error('[API] Task inspect succeeded but no data returned');
      return NextResponse.json(
        {
          success: false,
          error: 'Task data not available.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: taskData,
    });
  } catch (error) {
    console.error('[API] Error in GET /api/tasks/:id:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while retrieving the task.',
      },
      { status: 500 }
    );
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

    // Execute rover delete command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.deleteTask(taskId);

    if (!result.success) {
      console.error('[API] Rover delete failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to delete task.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('running') || result.stderr?.includes('in progress')) {
        errorMessage = `Cannot delete task ${taskId} while it is running. Stop the task first.`;
        statusCode = 409;
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
    console.error('[API] Error in DELETE /api/tasks/:id:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while deleting the task.',
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
