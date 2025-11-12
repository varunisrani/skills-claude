/**
 * Iteration list component - displays iteration history as a timeline
 */

'use client';

import * as React from 'react';
import { IterationCard } from './IterationCard';
import type { IterationSummary } from '@/types/iteration';

interface IterationListProps {
  taskId: number;
  iterations: IterationSummary[];
}

export function IterationList({ taskId, iterations }: IterationListProps) {
  if (iterations.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No iterations yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Iteration History</h2>
      <div className="space-y-3">
        {iterations.map((iteration) => (
          <IterationCard
            key={iteration.iteration}
            taskId={taskId}
            iteration={iteration}
          />
        ))}
      </div>
    </div>
  );
}
