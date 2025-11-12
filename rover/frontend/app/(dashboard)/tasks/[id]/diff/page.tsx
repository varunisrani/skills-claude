/**
 * Task diff page
 * Displays git diff for a task with interactive diff viewer
 */

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading/LoadingSpinner';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { useTaskDiffQuery } from '@/lib/hooks/useTaskDiff';
import { useTaskQuery } from '@/lib/hooks/useTask';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function TaskDiffPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = parseInt(params.id as string, 10);

  // Fetch task details
  const { data: task, isLoading: taskLoading, error: taskError } = useTaskQuery(taskId);

  // Fetch diff data
  const { data: diffData, isLoading: diffLoading, error: diffError } = useTaskDiffQuery(taskId);

  // Combined loading state
  const isLoading = taskLoading || diffLoading;

  // Combined error state
  const error = taskError || diffError;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text="Loading diff..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Error Loading Diff</CardTitle>
            </div>
            <CardDescription>
              {error.message || 'Failed to load diff. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href={`/tasks/${taskId}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Task
              </Button>
            </Link>
            <Button onClick={() => router.refresh()} className="flex-1">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task || !diffData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Task not found</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            The task you're looking for doesn't exist.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/tasks/${taskId}`}
                className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
              <div>
                <h1 className="text-lg font-semibold">Task #{taskId} - Diff</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-xl">
                  {task.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diff Viewer */}
      <div className="flex-1 overflow-hidden">
        {diffData.diff ? (
          <DiffViewer
            diff={diffData.diff}
            files={diffData.files}
            stats={diffData.stats}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 mx-auto text-zinc-400" />
              <p className="text-sm text-zinc-500">No changes detected</p>
              <p className="text-xs text-zinc-400">
                This task hasn't made any changes yet
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
