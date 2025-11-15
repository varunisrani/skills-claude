/**
 * Push task dialog component - dialog for pushing task changes to GitHub
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ExternalLink, Loader2 } from 'lucide-react';
import { usePushTaskMutation } from '@/lib/hooks';
import { useToast } from '@/lib/hooks/use-toast';

interface PushTaskDialogProps {
  taskId: number;
  disabled?: boolean;
}

export function PushTaskDialog({ taskId, disabled }: PushTaskDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const pushTask = usePushTaskMutation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    pushTask.mutate(
      { taskId, message: message.trim() || undefined },
      {
        onSuccess: (data) => {
          if (data?.pushed) {
            const description = data.prUrl
              ? 'Changes pushed successfully and PR created'
              : 'Changes pushed successfully';

            toast({
              title: 'Success',
              description,
              action: data.prUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(data.prUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View PR
                </Button>
              ) : undefined,
            });
            setOpen(false);
            setMessage('');
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
          <Upload className="mr-2 h-4 w-4" />
          Push
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Push to GitHub</DialogTitle>
            <DialogDescription>
              Push task changes to the remote repository and create a pull request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Commit Message (Optional)</Label>
              <Input
                id="message"
                placeholder="Enter custom commit message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Leave empty to use the default commit message. Maximum 500 characters.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                What happens next?
              </h4>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
                <li>Changes will be pushed to the remote repository</li>
                <li>A pull request will be created automatically</li>
                <li>You&apos;ll receive a link to the PR</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setMessage('');
              }}
              disabled={pushTask.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pushTask.isPending}>
              {pushTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pushTask.isPending ? 'Pushing...' : 'Push Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
