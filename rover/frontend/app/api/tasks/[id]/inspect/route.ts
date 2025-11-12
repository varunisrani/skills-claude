/**
 * API Route: /api/tasks/:id/inspect
 *
 * Handles task inspection with detailed information:
 * - GET: Get detailed task inspection including current iteration status
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
import type { InspectTaskResponse } from '@/types/api';

/**
 * GET /api/tasks/:id/inspect
 *
 * Retrieves comprehensive task inspection including:
 * - Complete task details
 * - Current iteration information
 * - Container details (if available)
 *
 * Executes: rover inspect <id> --json
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Comprehensive task inspection data or error
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<InspectTaskResponse>> {
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
      let errorMessage = 'Failed to inspect task.';
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

    // Return task inspection data (already parsed and validated by RoverCLI)
    const taskData = result.data;

    if (!taskData) {
      console.error('[API] Task inspect succeeded but no data returned');
      return NextResponse.json(
        {
          success: false,
          error: 'Task inspection data not available.',
        },
        { status: 500 }
      );
    }

    // Build comprehensive inspection response
    const inspectionData = {
      task: taskData,
      // Note: The Rover CLI inspect command returns the full task description
      // Additional iteration status and container details would need to be
      // retrieved from the file system if needed in future enhancements
    };

    return NextResponse.json({
      success: true,
      data: inspectionData,
    });
  } catch (error) {
    console.error('[API] Error in GET /api/tasks/:id/inspect:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while inspecting the task.',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
