/**
 * API Route: /api/tasks
 *
 * Handles task management operations:
 * - GET: List all tasks
 * - POST: Create a new task
 *
 * Security features:
 * - Input validation with Zod schemas
 * - Command injection prevention via spawn without shell
 * - Sanitized error messages
 * - Request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRoverCLI } from '@/lib/api/rover-cli';
import { CreateTaskRequestSchema } from '@/lib/utils/validation';
import { ZodError } from 'zod';
import type { ListTasksResponse, CreateTaskResponse } from '@/types/api';
import type { TaskSummary } from '@/types/task';

/**
 * GET /api/tasks
 *
 * Lists all tasks by executing `rover list --json`
 *
 * @returns JSON array of tasks or error
 */
export async function GET(request: NextRequest): Promise<NextResponse<ListTasksResponse>> {
  try {
    const roverCLI = getRoverCLI();

    // Execute rover list command
    const result = await roverCLI.listTasks();

    if (!result.success) {
      console.error('[API] Rover list failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve tasks. Please ensure Rover is properly configured.',
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            pages: 0,
          },
        } as ListTasksResponse,
        { status: 500 }
      );
    }

    // Return tasks array with pagination (result.data is already parsed and validated)
    const tasks = result.data || [];
    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page: 1,
        limit: 50,
        total: tasks.length,
        pages: 1,
      },
    });
  } catch (error) {
    // Log full error server-side
    console.error('[API] Error in GET /api/tasks:', error);

    // Return sanitized error to client
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while retrieving tasks.',
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },
      } as ListTasksResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 *
 * Creates a new task by executing `rover task`
 *
 * Request body:
 * {
 *   description: string (required, 10-5000 chars)
 *   workflow?: 'swe' | 'tech-writer'
 *   agent?: 'auto' | 'claude' | 'gemini' | 'codex' | 'cursor' | 'qwen'
 *   sourceBranch?: string
 *   targetBranch?: string
 *   fromGithub?: string (GitHub issue/PR URL)
 *   yes?: boolean (skip confirmations)
 * }
 *
 * @returns Created task data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateTaskResponse>> {
  try {
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
      validatedData = CreateTaskRequestSchema.parse(body);
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

    // Execute rover task command
    const roverCLI = getRoverCLI();
    const result = await roverCLI.createTask({
      description: validatedData.description,
      workflow: validatedData.workflow,
      agent: validatedData.agent,
      sourceBranch: validatedData.sourceBranch,
      targetBranch: validatedData.targetBranch,
      fromGithub: validatedData.fromGithub,
      yes: validatedData.yes ?? true, // Default to yes for API calls
    });

    if (!result.success) {
      console.error('[API] Rover task creation failed:', result.error);

      // Check for specific error messages to provide better feedback
      let errorMessage = 'Failed to create task.';

      if (result.stderr?.includes('not found') || result.stderr?.includes('not initialized')) {
        errorMessage = 'Rover project not found or not initialized. Please run `rover init` first.';
      } else if (result.stderr?.includes('credentials') || result.stderr?.includes('configuration')) {
        errorMessage = 'AI agent credentials not configured. Please set up your AI agent first.';
      } else if (result.stderr?.includes('branch')) {
        errorMessage = 'Invalid branch specified or Git repository issue.';
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: result.exitCode === 1 ? 400 : 500 }
      );
    }

    // result.data contains the parsed and validated TaskDescription
    const taskData = result.data;

    if (!taskData) {
      console.error('[API] Task creation succeeded but no data returned');
      return NextResponse.json(
        {
          success: false,
          error: 'Task created but no data returned.',
        },
        { status: 500 }
      );
    }

    // Return created task data (full Task object)
    return NextResponse.json(
      {
        success: true,
        data: taskData,
      },
      { status: 201 }
    );
  } catch (error) {
    // Log full error server-side
    console.error('[API] Error in POST /api/tasks:', error);

    // Return sanitized error to client
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while creating the task.',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
