/**
 * Iteration detail page
 * Displays full iteration information including status, plan, summary, and logs
 */

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useIterationDetailQuery, useTaskQuery } from '@/lib/hooks';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  GitCompare,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function IterationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = parseInt(params.id as string, 10);
  const iterationNum = parseInt(params.n as string, 10);

  const { data: taskData, isLoading: taskLoading } = useTaskQuery(taskId);
  const { data: iterationData, isLoading: iterationLoading } = useIterationDetailQuery(taskId, iterationNum);

  const task = taskData;
  const iteration = iterationData?.iteration;
  const status = iterationData?.status;
  const plan = iterationData?.plan;
  const summary = iterationData?.summary;

  if (taskLoading || iterationLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Loading iteration...</p>
        </div>
      </div>
    );
  }

  if (!task || !iteration) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Iteration not found</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            The iteration you're looking for doesn't exist.
          </p>
          <Link href={`/tasks/${taskId}`} className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Task
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusVariants = {
    initializing: { variant: 'secondary' as const, icon: Loader2, color: 'text-blue-600' },
    running: { variant: 'outline' as const, icon: Loader2, color: 'text-blue-600' },
    completed: { variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
    failed: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
  };

  const currentStatus = status?.status || 'initializing';
  const StatusIcon = statusVariants[currentStatus].icon;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/tasks/${taskId}`}
          className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Task #{taskId}
        </Link>
      </div>

      {/* Iteration Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">Iteration {iteration.iteration}</CardTitle>
                <Badge variant={statusVariants[currentStatus].variant}>
                  <StatusIcon className={`mr-1 h-3 w-3 ${currentStatus === 'running' || currentStatus === 'initializing' ? 'animate-spin' : ''}`} />
                  {currentStatus}
                </Badge>
              </div>
              <CardDescription className="text-base">{iteration.title}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Description</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
              {iteration.description}
            </p>
          </div>

          <Separator />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Created</p>
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(iteration.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            {status?.startedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Started</p>
                  <p className="text-sm font-medium">
                    {format(new Date(status.startedAt), 'PPp')}
                  </p>
                </div>
              </div>
            )}
            {status?.completedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Completed</p>
                  <p className="text-sm font-medium">
                    {format(new Date(status.completedAt), 'PPp')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {status && (currentStatus === 'running' || currentStatus === 'initializing') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">Progress</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{status.progress}%</p>
              </div>
              <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              {status.currentStep && (
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Current step: {status.currentStep}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/tasks/${taskId}/logs?iteration=${iterationNum}`}>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View Logs
              </Button>
            </Link>
            <Link href={`/tasks/${taskId}/diff`}>
              <Button variant="outline">
                <GitCompare className="mr-2 h-4 w-4" />
                View Diff
              </Button>
            </Link>
          </div>

          {/* Error Display */}
          {status?.error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Error</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                    {status.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Section */}
      {plan && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Iteration execution plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                {plan}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      {summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Iteration execution summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                {summary}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context from Previous Iteration */}
      {iteration.previousContext && (iteration.previousContext.plan || iteration.previousContext.summary) && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Iteration Context</CardTitle>
            <CardDescription>
              Context from iteration {iteration.previousContext.iterationNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {iteration.previousContext.plan && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Previous Plan</h4>
                <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-xs dark:bg-zinc-900">
                  {iteration.previousContext.plan}
                </pre>
              </div>
            )}
            {iteration.previousContext.summary && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Previous Summary</h4>
                <pre className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-xs dark:bg-zinc-900">
                  {iteration.previousContext.summary}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
