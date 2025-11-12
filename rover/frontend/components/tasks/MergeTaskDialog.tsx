/**
 * Merge task dialog component - confirmation dialog for merging task changes
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { GitMerge, AlertTriangle } from 'lucide-react';
import { useMergeTaskMutation } from '@/lib/hooks';
import { useToast } from '@/lib/hooks/use-toast';

interface MergeTaskDialogProps {
  taskId: number;
  disabled?: boolean;
}

export function MergeTaskDialog({ taskId, disabled }: MergeTaskDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [force, setForce] = React.useState(false);
  const mergeTask = useMergeTaskMutation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mergeTask.mutate(
      { taskId, force },
      {
        onSuccess: (data) => {
          if (data?.merged) {
            toast({
              title: 'Success',
              description: 'Task changes merged successfully',
            });
            setOpen(false);
            setForce(false);
          } else if (data?.conflicts && data.conflicts.length > 0) {
            toast({
              variant: 'destructive',
              title: 'Merge Conflicts',
              description: 'Please resolve conflicts manually or use force merge',
            });
          }
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message,
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <GitMerge className="mr-2 h-4 w-4" />
          Merge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Merge Task Changes</DialogTitle>
            <DialogDescription>
              This will merge the task&apos;s changes back to the source branch.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  This action cannot be undone
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  The task&apos;s changes will be merged into the source branch. Make sure you&apos;ve
                  reviewed the changes before proceeding.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="force"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <Label
                htmlFor="force"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Force merge (override conflicts)
              </Label>
            </div>
            {force && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Warning: Force merge will override any conflicts automatically. Use with caution.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setForce(false);
              }}
              disabled={mergeTask.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mergeTask.isPending}>
              {mergeTask.isPending ? 'Merging...' : 'Merge Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
