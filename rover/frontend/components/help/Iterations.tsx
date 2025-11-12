/**
 * Iterations help section
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { RefreshCw } from 'lucide-react';

export function Iterations() {
  return (
    <HelpSection
      id="iterations"
      title="Iterations"
      description="Learn how to refine and improve task results with iterative refinements"
      icon={<RefreshCw className="h-6 w-6 text-orange-500" />}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">What are Iterations?</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Iterations allow you to refine a task by providing additional instructions to the AI agent. Instead of
            starting from scratch, the agent builds upon its previous work, making the requested changes or
            improvements.
          </p>
          <Callout type="info">
            <p className="text-sm">
              <strong>Use iterations when:</strong>
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>The initial result needs minor adjustments</li>
              <li>You want to add new features to existing work</li>
              <li>You need to fix issues found during review</li>
              <li>Requirements change or evolve</li>
            </ul>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Creating an Iteration</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Add refinement instructions to an existing task:
          </p>
          <CodeBlock>rover iterate &lt;taskId&gt; "Add error handling to the login form"</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">Or start interactive mode:</p>
          <CodeBlock>rover iterate &lt;taskId&gt;</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Iteration Workflow</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Initial Task Completion</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  The AI completes the initial task and you review the results
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Provide Refinement Instructions</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Use the iterate command to specify what changes you want
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">AI Applies Changes</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  The agent reads the previous work and applies your new instructions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium">Review and Repeat</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Review the changes and iterate again if needed
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Viewing Iteration History</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Each task tracks all its iterations. View a specific iteration:
          </p>
          <CodeBlock>rover inspect &lt;taskId&gt; &lt;iterationNumber&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">View logs for a specific iteration:</p>
          <CodeBlock>rover logs &lt;taskId&gt; &lt;iterationNumber&gt;</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Best Practices</h3>
          <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <p className="font-medium">Be Specific</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Clearly describe what changes you want. Reference specific files, functions, or components.
              </p>
            </div>
            <div>
              <p className="font-medium">Build Incrementally</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Make one or two related changes per iteration rather than many unrelated changes.
              </p>
            </div>
            <div>
              <p className="font-medium">Review Between Iterations</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Always check the diff and logs before creating another iteration.
              </p>
            </div>
            <div>
              <p className="font-medium">Know When to Start Fresh</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If the task has diverged too far, it might be better to create a new task rather than continuing to
                iterate.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Example Iteration Scenarios</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-2 font-medium">Scenario: Adding Tests</p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Initial task: "Create a user registration API endpoint"
              </p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">Iteration: "Add unit tests for the registration endpoint"</p>
              <CodeBlock>rover iterate 1 "Add comprehensive unit tests for the registration endpoint"</CodeBlock>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-2 font-medium">Scenario: Fixing Issues</p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Initial task: "Add dark mode toggle to settings page"
              </p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Iteration: "The toggle doesn't persist. Save preference to localStorage"
              </p>
              <CodeBlock>rover iterate 2 "Store dark mode preference in localStorage and restore on page load"</CodeBlock>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-2 font-medium">Scenario: Expanding Features</p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">Initial task: "Create a simple todo list component"</p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">Iteration: "Add ability to mark todos as complete and filter by status"</p>
              <CodeBlock>rover iterate 3 "Add checkboxes to mark todos complete and filters for all/active/completed"</CodeBlock>
            </div>
          </div>
        </div>

        <Callout type="warning">
          <p className="text-sm">
            <strong>Remember:</strong> Each iteration builds on the previous work. The AI agent has access to all
            previous iterations and the original task description. You don't need to repeat the original requirements.
          </p>
        </Callout>
      </div>
    </HelpSection>
  );
}
