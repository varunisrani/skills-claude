/**
 * API route for task iterations
 * GET /api/tasks/:id/iterations - Get iteration history
 */

import { NextRequest, NextResponse } from 'next/server';
import type { APIResponse } from '@/types/api';
import type { IterationSummary } from '@/types/iteration';

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

    // TODO: Implement reading iterations from .rover/tasks/:id/iterations/
    // For now, return empty array as placeholder
    const iterations: IterationSummary[] = [];

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
