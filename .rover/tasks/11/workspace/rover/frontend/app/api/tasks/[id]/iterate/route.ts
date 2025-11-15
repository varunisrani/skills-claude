/**
 * API Route: /api/tasks/:id/iterate
 *
 * Handles task iteration - adding refinement instructions:
 * - POST: Add iteration with new instructions
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention
 * - Sanitized error messages
 * - Instruction length validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema, IterateRequestSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import type { IterateTaskResponse } from '@/types/api';

/**
 * POST /api/tasks/:id/iterate
 *
 * Adds an iteration to a task with new instructions
 * This allows refining the AI agent's work with additional guidance
 *
 * Executes: rover iterate <id> "instructions"
 *
 * Request body:
 * {
 *   instructions: string (required, 10-2000 chars)
 * }
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Success status or error
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<IterateTaskResponse>> {
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

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
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
      validatedData = IterateRequestSchema.parse(body);
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

    // Execute rover iterate command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.iterateTask({
      taskId,
      instructions: validatedData.instructions,
    });

    if (!result.success) {
      console.error('[API] Rover iterate failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to add iteration to task.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('running') || result.stderr?.includes('in progress')) {
        errorMessage = `Cannot iterate task ${taskId} while it is currently running.`;
        statusCode = 409;
      } else if (result.stderr?.includes('completed') || result.stderr?.includes('merged')) {
        errorMessage = `Cannot iterate task ${taskId} - task is already completed or merged.`;
        statusCode = 409;
      } else if (result.stderr?.includes('credentials') || result.stderr?.includes('configuration')) {
        errorMessage = 'AI agent credentials not configured. Please set up your AI agent first.';
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
        data: {
          taskId,
          instructions: validatedData.instructions,
        } as any, // Type assertion since API types expect full Iteration object
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error in POST /api/tasks/:id/iterate:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while adding the iteration.',
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
