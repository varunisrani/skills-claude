/**
 * API Route: /api/tasks/:id/push
 *
 * Handles git push operations for tasks:
 * - POST: Push task changes to GitHub and optionally create a PR
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention
 * - Sanitized error messages
 * - Commit message validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema, PushRequestSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import type { PushTaskResponse } from '@/types/api';

/**
 * POST /api/tasks/:id/push
 *
 * Pushes task changes to GitHub remote repository
 * Optionally creates a pull request
 *
 * Executes: rover push <id> [--message "msg"]
 *
 * Request body (optional):
 * {
 *   message?: string       // Commit message (max 500 chars)
 *   createPR?: boolean     // Create pull request (not yet supported by CLI)
 *   prTitle?: string       // PR title (not yet supported by CLI)
 *   prDescription?: string // PR description (not yet supported by CLI)
 * }
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Push result with PR URL (if created) or error
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<PushTaskResponse>> {
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
      validatedData = PushRequestSchema.parse(body);
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

    // Execute rover push command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.pushTask({
      taskId,
      message: validatedData.message,
    });

    if (!result.success) {
      console.error('[API] Rover push failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to push task changes.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('nothing to push') || result.stderr?.includes('up-to-date')) {
        errorMessage = 'No changes to push - branch is already up to date.';
        statusCode = 409;
      } else if (result.stderr?.includes('authentication') || result.stderr?.includes('permission denied')) {
        errorMessage = 'GitHub authentication failed. Please check your credentials and permissions.';
        statusCode = 401;
      } else if (result.stderr?.includes('remote') && result.stderr?.includes('rejected')) {
        errorMessage = 'Push rejected by remote. You may need to pull changes first.';
        statusCode = 409;
      } else if (result.stderr?.includes('uncommitted') || result.stderr?.includes('dirty')) {
        errorMessage = 'Cannot push - there are uncommitted changes. Please commit or stash them first.';
        statusCode = 409;
      } else if (result.stderr?.includes('no upstream') || result.stderr?.includes('no tracking')) {
        errorMessage = 'No upstream branch configured. Configure a remote branch first.';
        statusCode = 409;
      } else if (result.stderr?.includes('running') || result.stderr?.includes('in progress')) {
        errorMessage = `Cannot push task ${taskId} while it is still running. Stop or complete the task first.`;
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

    // Extract PR URL from result data if available
    const prUrl = result.data?.prUrl;

    // Successful push
    return NextResponse.json(
      {
        success: true,
        data: {
          pushed: true,
          prUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error in POST /api/tasks/:id/push:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while pushing the task.',
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
