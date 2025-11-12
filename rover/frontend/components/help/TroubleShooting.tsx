/**
 * Troubleshooting help section
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { AlertCircle } from 'lucide-react';

interface Issue {
  problem: string;
  symptoms: string[];
  solutions: { step: string; command?: string }[];
}

const commonIssues: Issue[] = [
  {
    problem: 'Task stuck in IN_PROGRESS state',
    symptoms: [
      'Task shows as IN_PROGRESS but no logs are appearing',
      'Container is not running when checked with docker ps',
      'Task has been running for an unusually long time',
    ],
    solutions: [
      { step: 'Check if the container is actually running', command: 'docker ps | grep rover-task' },
      { step: 'View task logs to see where it might be stuck', command: 'rover logs <taskId> --follow' },
      { step: 'Check Docker daemon is running', command: 'docker info' },
      { step: 'If stuck, stop and restart the task', command: 'rover stop <taskId>\nrover restart <taskId>' },
    ],
  },
  {
    problem: 'API key not working or authentication errors',
    symptoms: [
      'Error: Invalid API key',
      'Task fails immediately with authentication error',
      '401 or 403 errors in logs',
    ],
    solutions: [
      { step: 'Verify API key is correctly set in settings', command: 'cat .rover/settings.json' },
      { step: 'Ensure API key has the correct format and is not expired' },
      { step: 'Re-run initialization to update API key', command: 'rover init' },
      { step: 'Check you have credits/quota remaining with your AI provider' },
    ],
  },
  {
    problem: 'Git worktree errors',
    symptoms: [
      'Error: worktree already exists',
      'Cannot create worktree',
      'Worktree path conflicts',
    ],
    solutions: [
      { step: 'List all worktrees to check for conflicts', command: 'git worktree list' },
      {
        step: 'Remove stale worktree references',
        command: 'git worktree prune',
      },
      {
        step: 'Manually remove worktree directory if needed',
        command: 'rm -rf .rover/worktrees/task-<id>',
      },
      { step: 'Delete and recreate the task if issues persist', command: 'rover delete <taskId>' },
    ],
  },
  {
    problem: 'Merge conflicts when merging task',
    symptoms: [
      'Merge command fails with conflict errors',
      'Git reports conflicting changes',
      'Cannot complete merge operation',
    ],
    solutions: [
      { step: 'View the diff to understand changes', command: 'rover diff <taskId>' },
      { step: 'Open shell in task worktree', command: 'rover shell <taskId>' },
      { step: 'Manually resolve conflicts in the worktree' },
      { step: 'Commit the resolved changes in the worktree' },
      { step: 'Try merging again', command: 'rover merge <taskId>' },
    ],
  },
  {
    problem: 'Docker container fails to start',
    symptoms: [
      'Task fails immediately after creation',
      'Error: cannot start container',
      'Docker-related errors in logs',
    ],
    solutions: [
      { step: 'Verify Docker is running', command: 'docker info' },
      { step: 'Check Docker has sufficient resources (CPU, memory, disk)' },
      { step: 'View detailed error in task logs', command: 'rover logs <taskId>' },
      { step: 'Try pulling the latest Docker image', command: 'docker pull rover/agent:latest' },
      { step: 'Restart Docker daemon if needed' },
    ],
  },
  {
    problem: 'Cannot find task files or worktree',
    symptoms: [
      'Error: task worktree not found',
      'Files missing from worktree directory',
      'Inspect command shows no files',
    ],
    solutions: [
      { step: 'Verify task exists', command: 'rover list' },
      { step: 'Check worktree path in task details', command: 'rover inspect <taskId> --json' },
      { step: 'List all Git worktrees', command: 'git worktree list' },
      {
        step: 'If worktree is missing, stop and restart task',
        command: 'rover stop <taskId>\nrover restart <taskId>',
      },
    ],
  },
  {
    problem: 'Iteration not applying changes correctly',
    symptoms: [
      'Iteration completes but changes are not what you expected',
      'AI seems to ignore iteration instructions',
      'Changes overwrite previous work',
    ],
    solutions: [
      { step: 'Be more specific in iteration instructions' },
      { step: 'Reference specific files and functions to modify' },
      { step: 'Check logs to see how AI interpreted instructions', command: 'rover logs <taskId>' },
      { step: 'View diff to understand what changed', command: 'rover diff <taskId>' },
      {
        step: 'If the task has diverged too much, consider creating a new task instead of iterating',
      },
    ],
  },
  {
    problem: 'Out of memory or resource errors',
    symptoms: [
      'Task crashes with OOM (Out of Memory) errors',
      'Container killed unexpectedly',
      'System becomes slow during task execution',
    ],
    solutions: [
      { step: 'Check Docker resource limits', command: 'docker stats' },
      { step: 'Increase Docker memory allocation in Docker Desktop settings' },
      { step: 'Close other resource-intensive applications' },
      { step: 'Break down large tasks into smaller, focused tasks' },
      { step: 'Clean up unused Docker resources', command: 'docker system prune' },
    ],
  },
];

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div>
        <h4 className="mb-2 text-lg font-semibold">{issue.problem}</h4>
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">Symptoms:</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {issue.symptoms.map((symptom, idx) => (
              <li key={idx}>{symptom}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">Solutions:</p>
        <ol className="space-y-3">
          {issue.solutions.map((solution, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{solution.step}</p>
                {solution.command && (
                  <CodeBlock className="mt-2">{solution.command}</CodeBlock>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function TroubleShooting() {
  return (
    <HelpSection
      id="troubleshooting"
      title="Troubleshooting"
      description="Common issues and their solutions"
      icon={<AlertCircle className="h-6 w-6 text-red-500" />}
    >
      <div className="space-y-6">
        <Callout type="info">
          <p className="text-sm">
            <strong>Quick debugging tip:</strong> Most issues can be diagnosed by checking the task logs with{' '}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 dark:bg-blue-950">rover logs &lt;taskId&gt; --follow</code>
          </p>
        </Callout>

        <div className="space-y-4">
          {commonIssues.map((issue, idx) => (
            <IssueCard key={idx} issue={issue} />
          ))}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">General Debugging Steps</h3>
          <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <p className="font-medium">1. Check Task Status and Logs</p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Start by understanding what's happening:
              </p>
              <CodeBlock>{`rover list
rover logs <taskId> --follow`}</CodeBlock>
            </div>
            <div>
              <p className="font-medium">2. Verify Prerequisites</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Ensure Git, Docker, and API keys are properly configured
              </p>
            </div>
            <div>
              <p className="font-medium">3. Check System Resources</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Make sure you have sufficient disk space, memory, and CPU available
              </p>
            </div>
            <div>
              <p className="font-medium">4. Inspect Task Details</p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Get detailed information about the task:
              </p>
              <CodeBlock>rover inspect &lt;taskId&gt; --json</CodeBlock>
            </div>
            <div>
              <p className="font-medium">5. Try a Clean Restart</p>
              <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                Stop the task, clean up resources, and start fresh:
              </p>
              <CodeBlock>{`rover stop <taskId> --remove-all
rover restart <taskId>`}</CodeBlock>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Getting Help</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            If you're still experiencing issues after trying these solutions:
          </p>
          <ul className="list-inside list-disc space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>Check the Rover documentation for updated troubleshooting guides</li>
            <li>Search existing GitHub issues for similar problems</li>
            <li>
              Create a new GitHub issue with:
              <ul className="ml-6 mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Detailed description of the problem</li>
                <li>Steps to reproduce</li>
                <li>Relevant logs and error messages</li>
                <li>Your environment (OS, Docker version, Rover version)</li>
              </ul>
            </li>
            <li>Join the Rover community Discord for real-time help</li>
          </ul>
        </div>

        <Callout type="warning">
          <p className="text-sm">
            <strong>Important:</strong> When sharing logs or error messages for debugging, make sure to redact any
            sensitive information like API keys, tokens, or private data from your codebase.
          </p>
        </Callout>
      </div>
    </HelpSection>
  );
}
