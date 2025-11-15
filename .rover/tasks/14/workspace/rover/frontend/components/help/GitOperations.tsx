/**
 * Git operations help section
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { GitBranch } from 'lucide-react';

export function GitOperations() {
  return (
    <HelpSection
      id="git-operations"
      title="Git Operations"
      description="Learn how Rover uses Git worktrees and how to manage task changes"
      icon={<GitBranch className="h-6 w-6 text-indigo-500" />}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">How Rover Uses Git</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Rover creates isolated environments for each task using Git worktrees. This allows multiple tasks to run
            simultaneously without interfering with each other or your main working directory.
          </p>
          <Callout type="info">
            <p className="text-sm">
              <strong>Git Worktrees:</strong> A worktree is a separate working directory linked to the same Git
              repository. Each task gets its own branch and worktree in the{' '}
              <code className="rounded bg-blue-100 px-1.5 py-0.5 dark:bg-blue-950">.rover/worktrees/</code> directory.
            </p>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Viewing Changes</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            See what changes a task has made:
          </p>
          <CodeBlock>rover diff &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">View changes for a specific file:</p>
          <CodeBlock>rover diff &lt;taskId&gt; src/index.ts</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">List only changed files:</p>
          <CodeBlock>rover diff &lt;taskId&gt; --only-files</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">Compare with a specific branch:</p>
          <CodeBlock>rover diff &lt;taskId&gt; --branch develop</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Merging Task Changes</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Once you're satisfied with a task's changes, merge them into your current branch:
          </p>
          <CodeBlock>rover merge &lt;taskId&gt;</CodeBlock>
          <Callout type="warning" className="mt-3">
            <p className="text-sm">
              <strong>Important:</strong> Merging brings changes from the task's branch into your current working
              branch. Make sure you're on the correct branch before merging.
            </p>
          </Callout>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">Force merge without confirmation:</p>
          <CodeBlock>rover merge &lt;taskId&gt; --force</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Pushing to Remote</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Commit and push task changes to the remote repository:
          </p>
          <CodeBlock>rover push &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">With a custom commit message:</p>
          <CodeBlock>rover push &lt;taskId&gt; -m "feat: add user authentication"</CodeBlock>
          <Callout type="success" className="mt-3">
            <p className="text-sm">
              <strong>GitHub Integration:</strong> If your repository is connected to GitHub, the push command can
              automatically create a pull request with the task changes.
            </p>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Branch Naming</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            By default, Rover creates branches named <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover/task-&lt;id&gt;-&lt;title-slug&gt;</code>. You can customize this:
          </p>
          <CodeBlock>rover task "Add login" --target-branch feature/auth-system</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">Specify a different source branch:</p>
          <CodeBlock>rover task "Fix bug" --source-branch develop</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Working with Worktrees</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Open a shell in the task's worktree to manually inspect or modify files:
          </p>
          <CodeBlock>rover shell &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This opens a shell in the <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">.rover/worktrees/task-&lt;id&gt;</code> directory where you can use
            standard Git commands and file operations.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Cleaning Up</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            When you stop or delete a task, you can choose to clean up the worktree and branch:
          </p>
          <CodeBlock>rover stop &lt;taskId&gt; --remove-all</CodeBlock>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">This removes:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>The Docker container (if running)</li>
            <li>The Git worktree directory</li>
            <li>The task branch (if not merged or pushed)</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Git Workflow Best Practices</h3>
          <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <p className="font-medium">1. Review Before Merging</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Always use <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover diff</code> to
                review changes before merging.
              </p>
            </div>
            <div>
              <p className="font-medium">2. Keep Your Base Branch Updated</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Make sure your main/develop branch is up to date before creating tasks.
              </p>
            </div>
            <div>
              <p className="font-medium">3. Use Meaningful Commit Messages</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                When pushing, provide clear commit messages that explain what the task accomplished.
              </p>
            </div>
            <div>
              <p className="font-medium">4. Handle Merge Conflicts</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If conflicts arise during merge, resolve them in the task's worktree using{' '}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover shell</code>.
              </p>
            </div>
          </div>
        </div>

        <Callout type="info">
          <p className="text-sm">
            <strong>Pro tip:</strong> You can work on multiple tasks simultaneously since each has its own isolated
            worktree. This is perfect for experimenting with different approaches or working on features in parallel.
          </p>
        </Callout>
      </div>
    </HelpSection>
  );
}
