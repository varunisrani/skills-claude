/**
 * Task management help section
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { CheckSquare } from 'lucide-react';

export function TaskManagement() {
  return (
    <HelpSection
      id="task-management"
      title="Task Management"
      description="Learn how to create, monitor, and manage AI-powered development tasks"
      icon={<CheckSquare className="h-6 w-6 text-green-500" />}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Creating Tasks</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Tasks are the core of Rover. Each task represents a development goal that an AI agent will work on in an
            isolated environment.
          </p>
          <CodeBlock>rover task "Your task description here"</CodeBlock>
          <Callout type="info" className="mt-3">
            <p className="text-sm">
              <strong>Best practices:</strong>
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>Be specific and detailed in your task description</li>
              <li>Include acceptance criteria when possible</li>
              <li>Mention relevant files or components</li>
              <li>Specify the technology stack if not obvious</li>
            </ul>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Task Lifecycle</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">Tasks progress through several states:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                1
              </div>
              <div>
                <p className="font-medium">NEW</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Task created but not started</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-semibold text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100">
                2
              </div>
              <div>
                <p className="font-medium">IN_PROGRESS</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">AI agent is actively working on the task</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-100">
                3
              </div>
              <div>
                <p className="font-medium">ITERATING</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Task is being refined with new instructions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-100">
                4
              </div>
              <div>
                <p className="font-medium">COMPLETED</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Task execution finished successfully</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900 dark:text-red-100">
                X
              </div>
              <div>
                <p className="font-medium">FAILED</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Task execution encountered an error</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-100">
                5
              </div>
              <div>
                <p className="font-medium">MERGED / PUSHED</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Changes merged to target branch or pushed to remote
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Viewing Task Status</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Monitor all your tasks in the web interface or via CLI:
          </p>
          <CodeBlock>rover list</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">For continuous monitoring:</p>
          <CodeBlock>rover list --watch</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Inspecting Task Details</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">Get detailed information about a specific task:</p>
          <CodeBlock>rover inspect &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">View files from a specific iteration:</p>
          <CodeBlock>rover inspect &lt;taskId&gt; --file src/index.ts</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Stopping and Restarting Tasks</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">Stop a running task:</p>
          <CodeBlock>rover stop &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">Restart a failed or stopped task:</p>
          <CodeBlock>rover restart &lt;taskId&gt;</CodeBlock>
          <Callout type="warning" className="mt-3">
            <p className="text-sm">
              <strong>Note:</strong> Stopping a task preserves its worktree and changes. Use the{' '}
              <code className="rounded bg-yellow-100 px-1.5 py-0.5 dark:bg-yellow-950">--remove-all</code> flag to
              clean up all resources.
            </p>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Deleting Tasks</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Remove tasks you no longer need:
          </p>
          <CodeBlock>rover delete &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">Delete multiple tasks:</p>
          <CodeBlock>rover delete 1 2 3</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Creating Tasks from GitHub Issues</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            You can create tasks directly from GitHub issues:
          </p>
          <CodeBlock>rover task --from-github 123</CodeBlock>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This fetches the issue title and description from GitHub issue #123 and creates a task with that
            information.
          </p>
        </div>
      </div>
    </HelpSection>
  );
}
