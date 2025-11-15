/**
 * Iteration card component - shows single iteration details
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { IterationSummary } from '@/types/iteration';

interface IterationCardProps {
  taskId: number;
  iteration: IterationSummary;
}

export function IterationCard({ taskId, iteration }: IterationCardProps) {
  const statusVariants = {
    initializing: 'secondary' as const,
    running: 'outline' as const,
    completed: 'default' as const,
    failed: 'destructive' as const,
  };

  return (
    <Link href={`/tasks/${taskId}/iterations/${iteration.iteration}`}>
      <Card className="hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Iteration {iteration.iteration}</CardTitle>
            <Badge variant={statusVariants[iteration.status]}>
              {iteration.status}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-2 text-xs">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(iteration.createdAt), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {iteration.title}
          </p>
          {iteration.hasError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Error occurred during execution
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-sm text-zinc-900 dark:text-zinc-50">
              <FileText className="h-4 w-4" />
              View Details
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
