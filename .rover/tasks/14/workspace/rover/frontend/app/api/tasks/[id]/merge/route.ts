/**
 * API Route: /api/tasks/:id/merge
 *
 * Handles git merge operations for tasks:
 * - POST: Merge task changes back to source/target branch
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention
 * - Sanitized error messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema, MergeRequestSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import type { MergeTaskResponse } from '@/types/api';

/**
 * POST /api/tasks/:id/merge
 *
 * Merges task changes back to the source/target branch
 * This integrates the AI agent's work into the main codebase
 *
 * Executes: rover merge <id> [--force]
 *
 * Request body (optional):
 * {
 *   force?: boolean        // Force merge even if conflicts exist (default: false)
 *   targetBranch?: string  // Target branch (not yet supported by CLI)
 * }
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Merge result with conflict information or error
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<MergeTaskResponse>> {
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
      validatedData = MergeRequestSchema.parse(body);
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

    // Execute rover merge command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.mergeTask({
      taskId,
      force: validatedData.force,
    });

    if (!result.success) {
      console.error('[API] Rover merge failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to merge task changes.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('conflict')) {
        // Parse conflicts from stderr if available
        const conflicts: string[] = [];
        const conflictMatches = result.stderr?.matchAll(/CONFLICT.*?:\s*(.*?)(?:\n|$)/g);
        if (conflictMatches) {
          for (const match of conflictMatches) {
            conflicts.push(match[1]);
          }
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Merge conflicts detected. Please resolve conflicts manually or use force merge.',
            data: {
              merged: false,
              conflicts: conflicts.length > 0 ? conflicts : ['Merge conflicts detected'],
            },
          },
          { status: 409 }
        );
      } else if (result.stderr?.includes('nothing to merge') || result.stderr?.includes('up to date')) {
        errorMessage = 'No changes to merge - branch is already up to date.';
        statusCode = 409;
      } else if (result.stderr?.includes('running') || result.stderr?.includes('in progress')) {
        errorMessage = `Cannot merge task ${taskId} while it is still running. Stop or complete the task first.`;
        statusCode = 409;
      } else if (result.stderr?.includes('uncommitted') || result.stderr?.includes('dirty')) {
        errorMessage = 'Cannot merge - there are uncommitted changes in the working directory.';
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

    // Successful merge
    return NextResponse.json(
      {
        success: true,
        data: {
          merged: true,
          conflicts: [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error in POST /api/tasks/:id/merge:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while merging the task.',
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
