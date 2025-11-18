/**
 * API route for task iterations
 * GET /api/tasks/:id/iterations - Get iteration history
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { APIResponse } from '@/types/api';
import type { IterationSummary, Iteration, IterationStatus } from '@/types/iteration';

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
 * Get all iterations for a task
 */
async function getTaskIterations(taskId: number): Promise<IterationSummary[]> {
  try {
    const iterationsDir = getIterationsDir(taskId);

    // Check if iterations directory exists
    try {
      await fs.access(iterationsDir);
    } catch {
      // Directory doesn't exist - no iterations yet
      return [];
    }

    // Read all subdirectories (each represents an iteration)
    const entries = await fs.readdir(iterationsDir, { withFileTypes: true });
    const iterationDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => parseInt(entry.name, 10))
      .filter((num) => !isNaN(num))
      .sort((a, b) => b - a); // Sort descending (newest first)

    // Read iteration data for each
    const iterations: IterationSummary[] = [];
    for (const iterationNum of iterationDirs) {
      const iteration = await readIterationFile(taskId, iterationNum);
      const status = await readStatusFile(taskId, iterationNum);

      if (iteration) {
        iterations.push({
          iteration: iteration.iteration,
          title: iteration.title,
          status: status?.status || 'initializing',
          createdAt: iteration.createdAt,
          completedAt: status?.completedAt,
          hasError: !!status?.error,
        });
      }
    }

    return iterations;
  } catch (error) {
    console.error(`Failed to get iterations for task ${taskId}:`, error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const iterations = await getTaskIterations(taskId);

    return NextResponse.json<APIResponse<IterationSummary[]>>({
      success: true,
      data: iterations,
    });
  } catch (error) {
    console.error('Error fetching iterations:', error);
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
