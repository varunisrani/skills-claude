/**
 * FAQ section component
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { HelpCircle } from 'lucide-react';

interface FAQ {
  question: string;
  answer: React.ReactNode;
}

const faqs: FAQ[] = [
  {
    question: 'What is Rover and how does it work?',
    answer: (
      <>
        <p className="mb-3">
          Rover is an AI-powered development assistant that helps you complete coding tasks. It creates isolated Git
          worktrees for each task, runs AI agents in Docker containers to make changes, and integrates the results
          back into your codebase.
        </p>
        <p>
          Think of it as having an AI pair programmer that works in its own workspace, so you can continue developing
          while tasks run in the background.
        </p>
      </>
    ),
  },
  {
    question: 'Do I need to know Docker to use Rover?',
    answer: (
      <>
        <p className="mb-3">
          No, you don't need to be a Docker expert. Rover handles all Docker operations automatically. You just need
          to have Docker installed and running on your system.
        </p>
        <p>
          Rover uses Docker to create isolated, reproducible environments for task execution, but all the complexity
          is hidden behind simple CLI commands.
        </p>
      </>
    ),
  },
  {
    question: 'How much does it cost to use Rover?',
    answer: (
      <>
        <p className="mb-3">
          Rover itself is free and open source. However, you'll need API keys for AI providers (Claude or Gemini),
          which charge based on usage:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>
            <strong>Claude (Anthropic):</strong> Pay-per-token pricing, typically $3-15 per million tokens
          </li>
          <li>
            <strong>Gemini (Google):</strong> Lower pricing, typically $0.50-7 per million tokens
          </li>
        </ul>
        <p className="mt-3">
          Most development tasks cost between $0.10 and $2.00, depending on complexity and the AI agent used.
        </p>
      </>
    ),
  },
  {
    question: 'Can I use Rover without an internet connection?',
    answer: (
      <p>
        No, Rover requires an internet connection because it communicates with cloud-based AI providers (Claude or
        Gemini). The AI models that power Rover are too large to run locally and require API access.
      </p>
    ),
  },
  {
    question: 'Is my code sent to AI providers?',
    answer: (
      <>
        <p className="mb-3">
          Yes, relevant parts of your code are sent to AI providers (Anthropic or Google) to give the AI context about
          your project. This is necessary for the AI to understand your codebase and make appropriate changes.
        </p>
        <Callout type="warning">
          <p className="text-sm">
            <strong>Important:</strong> Only use Rover with code you're comfortable sharing with third-party AI
            providers. Check your organization's policies before using Rover on proprietary or sensitive codebases.
          </p>
        </Callout>
      </>
    ),
  },
  {
    question: 'Can I run multiple tasks at the same time?',
    answer: (
      <>
        <p className="mb-3">
          Yes! Rover uses Git worktrees to create isolated environments for each task. You can run multiple tasks
          simultaneously without them interfering with each other or your main working directory.
        </p>
        <CodeBlock>{`rover task "Add authentication"
rover task "Update documentation"
rover task "Fix navigation bug"`}</CodeBlock>
        <p className="mt-3">
          All three tasks will run in parallel, each in its own worktree and Docker container.
        </p>
      </>
    ),
  },
  {
    question: 'What happens if a task fails?',
    answer: (
      <>
        <p className="mb-3">
          When a task fails, Rover preserves all the work and logs so you can diagnose the issue:
        </p>
        <ol className="mb-3 list-inside list-decimal space-y-2 text-sm">
          <li>Check the logs to see what went wrong: <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover logs &lt;taskId&gt;</code></li>
          <li>Inspect the partial work: <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover diff &lt;taskId&gt;</code></li>
          <li>
            Either restart the task: <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover restart &lt;taskId&gt;</code> or iterate with refined
            instructions
          </li>
        </ol>
        <p>The task's worktree and any changes made are preserved, so you never lose work.</p>
      </>
    ),
  },
  {
    question: 'How do I review changes before merging them?',
    answer: (
      <>
        <p className="mb-3">Use the diff command to see all changes a task has made:</p>
        <CodeBlock>rover diff &lt;taskId&gt;</CodeBlock>
        <p className="mt-3">You can also:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
          <li>
            View specific files: <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover diff &lt;taskId&gt; src/app.ts</code>
          </li>
          <li>
            Open a shell in the task worktree: <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover shell &lt;taskId&gt;</code>
          </li>
          <li>
            Inspect iteration files: <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover inspect &lt;taskId&gt; --file src/app.ts</code>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Can I modify files while a task is running?',
    answer: (
      <>
        <p className="mb-3">
          Yes, you can continue working in your main workspace while tasks run. Each task works in its own Git
          worktree (in <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">.rover/worktrees/</code>), completely isolated from your working directory.
        </p>
        <p>
          However, avoid modifying files in the task's specific worktree while it's running, as this could interfere
          with the AI agent's work.
        </p>
      </>
    ),
  },
  {
    question: 'What programming languages does Rover support?',
    answer: (
      <p>
        Rover is language-agnostic and works with any programming language or framework. The AI agents (Claude and
        Gemini) have been trained on a wide variety of languages including JavaScript, TypeScript, Python, Go, Rust,
        Java, C++, and many others. If you can write code in it, Rover can help with tasks in it.
      </p>
    ),
  },
  {
    question: 'How do I choose between Claude and Gemini?',
    answer: (
      <>
        <p className="mb-3">Choose based on your task requirements:</p>
        <ul className="mb-3 list-inside list-disc space-y-2 text-sm">
          <li>
            <strong>Claude:</strong> Best for complex tasks requiring deep code understanding, architectural decisions,
            or careful consideration of edge cases. Higher quality but more expensive.
          </li>
          <li>
            <strong>Gemini:</strong> Best for straightforward implementation tasks, data processing, or when you need
            faster/cheaper iterations. Good quality at lower cost.
          </li>
        </ul>
        <p>
          When in doubt, start with Claude. You can always switch to Gemini for simpler follow-up tasks or iterations.
        </p>
      </>
    ),
  },
  {
    question: 'Can I use Rover with GitHub/GitLab/Bitbucket?',
    answer: (
      <>
        <p className="mb-3">
          Yes! Rover works with any Git repository, regardless of where it's hosted. It uses standard Git operations
          that are compatible with all Git hosting platforms.
        </p>
        <p className="mb-3">
          Rover has special GitHub integration features like creating tasks from issues and automatically creating pull
          requests:
        </p>
        <CodeBlock>{`rover task --from-github 123
rover push <taskId>`}</CodeBlock>
      </>
    ),
  },
  {
    question: 'What if the AI makes mistakes?',
    answer: (
      <>
        <p className="mb-3">
          AI agents are powerful but not perfect. If the results aren't quite right:
        </p>
        <ol className="list-inside list-decimal space-y-2 text-sm">
          <li>
            <strong>Iterate:</strong> Use <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover iterate &lt;taskId&gt;</code> to refine the work
            with more specific instructions
          </li>
          <li>
            <strong>Be more specific:</strong> Provide clearer requirements, reference specific files, or include
            examples
          </li>
          <li>
            <strong>Manual fixes:</strong> Use <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover shell &lt;taskId&gt;</code> to make small
            manual corrections
          </li>
          <li>
            <strong>Start fresh:</strong> If the task has gone off track, delete it and create a new one with improved
            instructions
          </li>
        </ol>
        <p className="mt-3">
          Remember: Review all changes with <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">rover diff</code> before merging!
        </p>
      </>
    ),
  },
  {
    question: 'How do I update Rover to the latest version?',
    answer: (
      <>
        <p className="mb-3">Update Rover using your package manager:</p>
        <CodeBlock>{`# If installed via npm
npm update -g rover-cli

# If installed via yarn
yarn global upgrade rover-cli

# Check your version
rover --version`}</CodeBlock>
      </>
    ),
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h4 className="text-lg font-semibold">{faq.question}</h4>
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{faq.answer}</div>
    </div>
  );
}

export function FAQSection() {
  return (
    <HelpSection
      id="faq"
      title="Frequently Asked Questions"
      description="Common questions about Rover and how to use it"
      icon={<HelpCircle className="h-6 w-6 text-teal-500" />}
    >
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <FAQItem key={idx} faq={faq} />
        ))}

        <Callout type="info">
          <p className="text-sm">
            <strong>Can't find what you're looking for?</strong> Check the other help sections for detailed guides on
            specific topics, or visit the Rover documentation website for comprehensive information.
          </p>
        </Callout>
      </div>
    </HelpSection>
  );
}
