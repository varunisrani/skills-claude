/**
 * Iterate form component - dialog for adding new iteration
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RotateCw } from 'lucide-react';
import { useIterateTaskMutation } from '@/lib/hooks';
import { useToast } from '@/lib/hooks/use-toast';

interface IterateFormProps {
  taskId: number;
}

export function IterateForm({ taskId }: IterateFormProps) {
  const [open, setOpen] = React.useState(false);
  const [instructions, setInstructions] = React.useState('');
  const iterateTask = useIterateTaskMutation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (instructions.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Instructions must be at least 10 characters',
      });
      return;
    }

    iterateTask.mutate(
      { taskId, instructions },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Iteration started successfully',
          });
          setOpen(false);
          setInstructions('');
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
        <Button variant="outline">
          <RotateCw className="mr-2 h-4 w-4" />
          Iterate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Iteration</DialogTitle>
            <DialogDescription>
              Provide refinement instructions to improve the task output.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="instructions">Refinement Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Describe what changes or improvements you want..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={5}
                required
                minLength={10}
                maxLength={2000}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Minimum 10 characters, maximum 2000
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={iterateTask.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={iterateTask.isPending}>
              {iterateTask.isPending ? 'Starting...' : 'Start Iteration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
