/**
 * API Route: /api/tasks/:id/diff
 *
 * Handles git diff retrieval for tasks:
 * - GET: Get git diff for task changes
 *
 * Query parameters:
 * - branch: Optional branch to compare against (defaults to source branch)
 * - file: Optional specific file to diff
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention
 * - Sanitized error messages
 * - Branch name validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { TaskIdSchema, GitBranchSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import { z } from 'zod';
import type { GetDiffResponse } from '@/types/api';

/**
 * Schema for diff query parameters
 */
const DiffQuerySchema = z.object({
  branch: GitBranchSchema.optional(),
  file: z
    .string()
    .optional()
    .transform((val) => val?.trim())
    .refine((val) => !val || !val.includes('..'), {
      message: 'File path cannot contain directory traversal',
    }),
});

/**
 * GET /api/tasks/:id/diff
 *
 * Retrieves git diff for a specific task
 * Optionally compare against a specific branch or file
 *
 * Executes: rover diff <id> [--branch <branch>]
 *
 * @param request - Next.js request object with query params
 * @param context - Route context with params
 * @returns Git diff output or error
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<GetDiffResponse>> {
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    let queryParams;
    try {
      queryParams = DiffQuerySchema.parse({
        branch: searchParams.get('branch'),
        file: searchParams.get('file'),
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => err.message);
        return NextResponse.json(
          {
            success: false,
            error: `Invalid query parameters: ${errorMessages.join(', ')}`,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Execute rover diff command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.getDiff(taskId, queryParams.branch);

    if (!result.success) {
      console.error('[API] Rover diff failed:', result.error);

      // Check for specific error messages
      let errorMessage = 'Failed to retrieve diff.';
      let statusCode = 500;

      if (result.stderr?.includes('not found') || result.stderr?.includes('does not exist')) {
        errorMessage = `Task ${taskId} not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('branch') && result.stderr?.includes('not found')) {
        errorMessage = `Branch '${queryParams.branch}' not found.`;
        statusCode = 404;
      } else if (result.stderr?.includes('No changes')) {
        // This is not necessarily an error - return empty diff
        return NextResponse.json({
          success: true,
          data: {
            diff: '',
            files: [],
            stats: {
              filesChanged: 0,
              insertions: 0,
              deletions: 0,
            },
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: statusCode }
      );
    }

    // Parse diff output (result.data is a string)
    const diffOutput = result.data || '';

    // Extract basic statistics from diff output
    // Git diff stats are typically at the end in format: "X files changed, Y insertions(+), Z deletions(-)"
    const statsMatch = diffOutput.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
    const filesChanged = statsMatch ? parseInt(statsMatch[1], 10) : 0;
    const insertions = statsMatch && statsMatch[2] ? parseInt(statsMatch[2], 10) : 0;
    const deletions = statsMatch && statsMatch[3] ? parseInt(statsMatch[3], 10) : 0;

    // Extract file list from diff
    // Files are indicated by "diff --git a/file b/file" or "+++ b/file"
    const fileMatches = diffOutput.matchAll(/\+\+\+ b\/(.*?)(?:\n|$)/g);
    const files = Array.from(fileMatches, (m) => m[1]);

    return NextResponse.json({
      success: true,
      data: {
        diff: diffOutput,
        files: [...new Set(files)], // Remove duplicates
        stats: {
          filesChanged,
          insertions,
          deletions,
        },
      },
    });
  } catch (error) {
    console.error('[API] Error in GET /api/tasks/:id/diff:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while retrieving the diff.',
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
