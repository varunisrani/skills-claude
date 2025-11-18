/**
 * API route for specific iteration details
 * GET /api/tasks/:id/iterations/:n - Get details for a specific iteration
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { APIResponse } from '@/types/api';
import type { Iteration, IterationStatus } from '@/types/iteration';

/**
 * Get iterations directory path for a task
 */
function getIterationsDir(taskId: number): string {
  const cwd = process.cwd();
  return path.join(cwd, '.rover', 'tasks', taskId.toString(), 'iterations');
}

/**
 * Read iteration.json file for a specific iteration
 */
async function readIterationFile(taskId: number, iterationNum: number): Promise<Iteration | null> {
  try {
    const iterationPath = path.join(
      getIterationsDir(taskId),
      iterationNum.toString(),
      'iteration.json'
    );
    const content = await fs.readFile(iterationPath, 'utf-8');
    return JSON.parse(content) as Iteration;
  } catch (error) {
    console.error(`Failed to read iteration ${iterationNum} for task ${taskId}:`, error);
    return null;
  }
}

/**
 * Read status.json file for a specific iteration
 */
async function readStatusFile(taskId: number, iterationNum: number): Promise<IterationStatus | null> {
  try {
    const statusPath = path.join(
      getIterationsDir(taskId),
      iterationNum.toString(),
      'status.json'
    );
    const content = await fs.readFile(statusPath, 'utf-8');
    return JSON.parse(content) as IterationStatus;
  } catch (error) {
    // Status file might not exist yet for new iterations
    return null;
  }
}

/**
 * Read plan.md file for a specific iteration
 */
async function readPlanFile(taskId: number, iterationNum: number): Promise<string | null> {
  try {
    const planPath = path.join(
      getIterationsDir(taskId),
      iterationNum.toString(),
      'plan.md'
    );
    return await fs.readFile(planPath, 'utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * Read summary.md file for a specific iteration
 */
async function readSummaryFile(taskId: number, iterationNum: number): Promise<string | null> {
  try {
    const summaryPath = path.join(
      getIterationsDir(taskId),
      iterationNum.toString(),
      'summary.md'
    );
    return await fs.readFile(summaryPath, 'utf-8');
  } catch (error) {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> }
) {
  try {
    const { id, n } = await params;
    const taskId = parseInt(id, 10);
    const iterationNum = parseInt(n, 10);

    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    if (isNaN(iterationNum) || iterationNum <= 0) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Invalid iteration number' },
        { status: 400 }
      );
    }

    const iteration = await readIterationFile(taskId, iterationNum);
    if (!iteration) {
      return NextResponse.json<APIResponse>(
        { success: false, error: `Iteration ${iterationNum} not found for task ${taskId}` },
        { status: 404 }
      );
    }

    const status = await readStatusFile(taskId, iterationNum);
    const plan = await readPlanFile(taskId, iterationNum);
    const summary = await readSummaryFile(taskId, iterationNum);

    return NextResponse.json<APIResponse<{
      iteration: Iteration;
      status: IterationStatus | null;
      plan: string | null;
      summary: string | null;
    }>>({
      success: true,
      data: {
        iteration,
        status,
        plan,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching iteration details:', error);
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
