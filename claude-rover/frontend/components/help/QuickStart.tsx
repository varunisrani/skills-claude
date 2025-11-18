/**
 * Quick start guide component
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { Rocket } from 'lucide-react';

export function QuickStart() {
  return (
    <HelpSection
      id="getting-started"
      title="Getting Started"
      description="Learn how to initialize Rover and create your first AI-powered task"
      icon={<Rocket className="h-6 w-6 text-blue-500" />}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Prerequisites</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Before using Rover, make sure you have:
          </p>
          <ul className="list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Git installed and configured</li>
            <li>A Git repository with at least one commit</li>
            <li>Docker installed and running</li>
            <li>API keys for your chosen AI agent (Claude or Gemini)</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">1. Initialize Your Project</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Run the init command in your project directory:
          </p>
          <CodeBlock>rover init</CodeBlock>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            This creates <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover.json</code> and{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">.rover/settings.json</code> files
            in your project.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">2. Create Your First Task</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Use the task command to create a new AI-powered task:
          </p>
          <CodeBlock>rover task "Add user authentication to the app"</CodeBlock>
          <Callout type="info" className="mt-3">
            <p className="text-sm">
              <strong>Tip:</strong> Be specific in your task description. The AI works best with clear, detailed
              instructions.
            </p>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">3. Monitor Task Progress</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            View all tasks and their current status:
          </p>
          <CodeBlock>rover list</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Or watch for live updates:
          </p>
          <CodeBlock>rover list --watch</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">4. View Task Logs</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Check what the AI agent is doing:
          </p>
          <CodeBlock>rover logs &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Follow logs in real-time:
          </p>
          <CodeBlock>rover logs &lt;taskId&gt; --follow</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">5. Review and Merge Changes</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Once the task completes, review the changes:
          </p>
          <CodeBlock>rover diff &lt;taskId&gt;</CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            If you're happy with the changes, merge them:
          </p>
          <CodeBlock>rover merge &lt;taskId&gt;</CodeBlock>
        </div>

        <Callout type="success">
          <p className="text-sm">
            <strong>You're all set!</strong> You've successfully created and completed your first Rover task. Check
            out the other sections to learn about advanced features like iterations, workflows, and git operations.
          </p>
        </Callout>
      </div>
    </HelpSection>
  );
}
