/**
 * Task detail page
 * Displays full task information, actions, and iteration history
 */

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { IterationList } from '@/components/iterations/IterationList';
import { IterateForm } from '@/components/iterations/IterateForm';
import { MergeTaskDialog } from '@/components/tasks/MergeTaskDialog';
import { PushTaskDialog } from '@/components/tasks/PushTaskDialog';
import { useTaskQuery, useDeleteTaskMutation, useStopTaskMutation, useRestartTaskMutation, useTaskIterationsQuery } from '@/lib/hooks';
import { useToast } from '@/lib/hooks/use-toast';
import {
  FileText,
  GitCompare,
  Play,
  Square,
  Trash2,
  ArrowLeft,
  Clock,
  GitBranch,
  Workflow,
  Bot,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = parseInt(params.id as string, 10);
  const { data: taskData, isLoading: taskLoading } = useTaskQuery(taskId);
  const task = taskData;
  const deleteTaskMutation = useDeleteTaskMutation();
  const stopTaskMutation = useStopTaskMutation();
  const restartTaskMutation = useRestartTaskMutation();
  const { toast } = useToast();

  // Fetch iterations
  const { data: iterations = [], isLoading: iterationsLoading } = useTaskIterationsQuery(taskId);

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showStopConfirm, setShowStopConfirm] = React.useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = React.useState(false);

  const handleDelete = () => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        toast({ title: 'Task deleted successfully' });
        router.push('/');
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      },
    });
  };

  const handleStop = () => {
    stopTaskMutation.mutate({ taskId }, {
      onSuccess: () => {
        toast({ title: 'Task stopped successfully' });
        setShowStopConfirm(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      },
    });
  };

  const handleRestart = () => {
    restartTaskMutation.mutate({ taskId }, {
      onSuccess: () => {
        toast({ title: 'Task restarted successfully' });
        setShowRestartConfirm(false);
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      },
    });
  };

  if (taskLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
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

  const canIterate = task.status === 'COMPLETED' || task.status === 'FAILED';
  const canRestart = task.status === 'FAILED';
  const canStop = task.status === 'IN_PROGRESS' || task.status === 'ITERATING';
  const canMerge = task.status === 'COMPLETED';
  const canPush = task.status === 'MERGED';

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tasks
        </Link>
      </div>

      {/* Task Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">Task #{task.id}</CardTitle>
                <TaskStatusBadge status={task.status} />
              </div>
              <CardDescription className="text-base">{task.title}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Description</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{task.description}</p>
          </div>

          <Separator />

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Workflow</p>
                <p className="text-sm font-medium">{task.workflowName}</p>
              </div>
            </div>
            {task.agent && (
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Agent</p>
                  <p className="text-sm font-medium">{task.agent}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Branch</p>
                <p className="text-sm font-medium">{task.branchName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Created</p>
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/tasks/${taskId}/logs`}>
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
            {canIterate && <IterateForm taskId={taskId} />}
            {canRestart && (
              <Button
                variant="outline"
                onClick={() => setShowRestartConfirm(true)}
                disabled={restartTaskMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Restart
              </Button>
            )}
            {canStop && (
              <Button
                variant="outline"
                onClick={() => setShowStopConfirm(true)}
                disabled={stopTaskMutation.isPending}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
            {canMerge && <MergeTaskDialog taskId={taskId} disabled={false} />}
            {canPush && <PushTaskDialog taskId={taskId} disabled={false} />}
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteTaskMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>

          {/* Error Display */}
          {task.error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{task.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Iteration History */}
      {iterationsLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
        </div>
      ) : (
        <IterationList taskId={taskId} iterations={iterations} />
      )}

      {/* Confirmation Dialogs */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Task</CardTitle>
              <CardDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteTaskMutation.isPending}>
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Stop Task</CardTitle>
              <CardDescription>
                Are you sure you want to stop this task?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStopConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={handleStop} disabled={stopTaskMutation.isPending}>
                {stopTaskMutation.isPending ? 'Stopping...' : 'Stop'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Restart Task</CardTitle>
              <CardDescription>
                Are you sure you want to restart this task?
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRestartConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={handleRestart} disabled={restartTaskMutation.isPending}>
                {restartTaskMutation.isPending ? 'Restarting...' : 'Restart'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
