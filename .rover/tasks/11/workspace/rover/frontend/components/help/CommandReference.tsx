/**
 * CLI commands reference component
 */

import * as React from 'react';
import { HelpSection, CodeBlock } from './HelpSection';
import { BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Command {
  name: string;
  description: string;
  usage: string;
  options?: { flag: string; description: string }[];
  examples?: { command: string; description: string }[];
}

const commands: { category: string; items: Command[] }[] = [
  {
    category: 'Project Setup',
    items: [
      {
        name: 'init',
        description: 'Initialize Rover in your project',
        usage: 'rover init [path]',
        options: [{ flag: '-y, --yes', description: 'Skip all confirmations' }],
        examples: [
          { command: 'rover init', description: 'Initialize in current directory' },
          { command: 'rover init /path/to/project', description: 'Initialize in specific directory' },
        ],
      },
    ],
  },
  {
    category: 'Task Management',
    items: [
      {
        name: 'task',
        description: 'Create a new AI-powered task',
        usage: 'rover task [description]',
        options: [
          { flag: '-w, --workflow <name>', description: 'Workflow to use (swe, tech-writer)' },
          { flag: '-a, --agent <agent>', description: 'AI agent (claude, gemini)' },
          { flag: '-s, --source-branch <branch>', description: 'Base branch for worktree' },
          { flag: '-t, --target-branch <branch>', description: 'Custom worktree branch name' },
          { flag: '--from-github <issue>', description: 'Fetch description from GitHub issue' },
          { flag: '-y, --yes', description: 'Skip confirmations' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover task "Add login feature"', description: 'Create task with description' },
          {
            command: 'rover task "Fix bug" --workflow tech-writer',
            description: 'Create task with specific workflow',
          },
          { command: 'rover task --from-github 123', description: 'Create task from GitHub issue #123' },
        ],
      },
      {
        name: 'list',
        description: 'List all tasks and their status',
        usage: 'rover list',
        options: [
          { flag: '-w, --watch', description: 'Watch and refresh every 5 seconds' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover list', description: 'Show all tasks' },
          { command: 'rover list --watch', description: 'Watch tasks in real-time' },
        ],
      },
      {
        name: 'inspect',
        description: 'Inspect task details and iterations',
        usage: 'rover inspect <taskId> [iterationNumber]',
        options: [
          { flag: '--file <files...>', description: 'Show formatted file contents' },
          { flag: '--raw-file <files...>', description: 'Show raw file contents' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover inspect 1', description: 'Inspect task #1' },
          { command: 'rover inspect 1 2', description: 'Inspect task #1, iteration #2' },
          { command: 'rover inspect 1 --file src/index.ts', description: 'View specific file from task' },
        ],
      },
      {
        name: 'logs',
        description: 'View task execution logs',
        usage: 'rover logs <taskId> [iterationNumber]',
        options: [
          { flag: '-f, --follow', description: 'Follow logs in real-time' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover logs 1', description: 'Show logs for task #1' },
          { command: 'rover logs 1 --follow', description: 'Follow logs in real-time' },
          { command: 'rover logs 1 2', description: 'Show logs for iteration #2' },
        ],
      },
      {
        name: 'stop',
        description: 'Stop a running task',
        usage: 'rover stop <taskId>',
        options: [
          { flag: '-a, --remove-all', description: 'Remove container, worktree, and branch' },
          { flag: '-c, --remove-container', description: 'Remove container only' },
          { flag: '-g, --remove-git-worktree-and-branch', description: 'Remove worktree and branch' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover stop 1', description: 'Stop task #1' },
          { command: 'rover stop 1 --remove-all', description: 'Stop and clean up all resources' },
        ],
      },
      {
        name: 'restart',
        description: 'Restart a failed or new task',
        usage: 'rover restart <taskId>',
        options: [{ flag: '--json', description: 'Output in JSON format' }],
        examples: [{ command: 'rover restart 1', description: 'Restart task #1' }],
      },
      {
        name: 'delete',
        description: 'Delete one or more tasks',
        usage: 'rover delete <taskId...>',
        options: [
          { flag: '-y, --yes', description: 'Skip confirmation' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover delete 1', description: 'Delete task #1' },
          { command: 'rover delete 1 2 3', description: 'Delete multiple tasks' },
        ],
      },
    ],
  },
  {
    category: 'Iterations',
    items: [
      {
        name: 'iterate',
        description: 'Add refinement instructions to a task',
        usage: 'rover iterate <taskId> [instructions]',
        options: [{ flag: '--json', description: 'Output in JSON format' }],
        examples: [
          { command: 'rover iterate 1 "Add error handling"', description: 'Add new instructions' },
          { command: 'rover iterate 1', description: 'Prompt for instructions interactively' },
        ],
      },
    ],
  },
  {
    category: 'Git Operations',
    items: [
      {
        name: 'diff',
        description: 'Show git diff for task changes',
        usage: 'rover diff <taskId> [filePath]',
        options: [
          { flag: '-b, --branch <name>', description: 'Compare with specific branch' },
          { flag: '--only-files', description: 'Show only changed filenames' },
        ],
        examples: [
          { command: 'rover diff 1', description: 'Show all changes' },
          { command: 'rover diff 1 src/index.ts', description: 'Show changes for specific file' },
          { command: 'rover diff 1 --only-files', description: 'List changed files only' },
        ],
      },
      {
        name: 'merge',
        description: 'Merge task changes into current branch',
        usage: 'rover merge <taskId>',
        options: [
          { flag: '-f, --force', description: 'Force merge without confirmation' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover merge 1', description: 'Merge task #1 changes' },
          { command: 'rover merge 1 --force', description: 'Force merge without confirmation' },
        ],
      },
      {
        name: 'push',
        description: 'Commit and push task changes, optionally create PR',
        usage: 'rover push <taskId>',
        options: [
          { flag: '-m, --message <message>', description: 'Custom commit message' },
          { flag: '--json', description: 'Output in JSON format' },
        ],
        examples: [
          { command: 'rover push 1', description: 'Push task changes to remote' },
          { command: 'rover push 1 -m "feat: add login"', description: 'Push with custom commit message' },
        ],
      },
    ],
  },
  {
    category: 'Debugging',
    items: [
      {
        name: 'shell',
        description: 'Open interactive shell in task environment',
        usage: 'rover shell <taskId>',
        options: [{ flag: '-c, --container', description: 'Start shell within container' }],
        examples: [
          { command: 'rover shell 1', description: 'Open shell in task worktree' },
          { command: 'rover shell 1 --container', description: 'Open shell in Docker container' },
        ],
      },
    ],
  },
];

function CommandItem({ command }: { command: Command }) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div>
        <h4 className="mb-1 text-lg font-semibold">{command.name}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{command.description}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Usage</p>
        <CodeBlock>{command.usage}</CodeBlock>
      </div>

      {command.options && command.options.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Options</p>
          <div className="space-y-2">
            {command.options.map((option, idx) => (
              <div key={idx} className="flex gap-3">
                <code className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                  {option.flag}
                </code>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{option.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {command.examples && command.examples.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Examples</p>
          <div className="space-y-3">
            {command.examples.map((example, idx) => (
              <div key={idx}>
                <CodeBlock>{example.command}</CodeBlock>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{example.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CommandReference() {
  return (
    <HelpSection
      id="command-reference"
      title="Command Reference"
      description="Complete reference of all Rover CLI commands"
      icon={<BookOpen className="h-6 w-6 text-purple-500" />}
    >
      <Tabs defaultValue="project-setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="project-setup">Setup</TabsTrigger>
          <TabsTrigger value="task-management">Tasks</TabsTrigger>
          <TabsTrigger value="iterations">Iterations</TabsTrigger>
          <TabsTrigger value="git-operations">Git</TabsTrigger>
          <TabsTrigger value="debugging">Debug</TabsTrigger>
        </TabsList>

        {commands.map((category) => (
          <TabsContent
            key={category.category.toLowerCase().replace(/\s+/g, '-')}
            value={category.category.toLowerCase().replace(/\s+/g, '-')}
            className="space-y-4"
          >
            {category.items.map((command) => (
              <CommandItem key={command.name} command={command} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </HelpSection>
  );
}
