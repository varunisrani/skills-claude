/**
 * AI Agents help section
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { Bot } from 'lucide-react';

export function AIAgents() {
  return (
    <HelpSection
      id="ai-agents"
      title="AI Agents"
      description="Learn about different AI agents and how to choose the right one for your tasks"
      icon={<Bot className="h-6 w-6 text-violet-500" />}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">What are AI Agents?</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            AI agents are the large language models that execute your tasks. Rover supports multiple AI providers,
            each with different strengths, capabilities, and pricing models.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Available Agents</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded bg-orange-100 px-2 py-1 text-xs font-semibold uppercase text-orange-700 dark:bg-orange-900 dark:text-orange-100">
                  Recommended
                </div>
                <h4 className="text-lg font-semibold">Claude (Anthropic)</h4>
              </div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Claude is Anthropic's advanced AI assistant, known for its strong reasoning capabilities, safety
                features, and excellent code generation.
              </p>
              <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Strengths:</p>
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Excellent at complex reasoning and problem-solving</li>
                <li>Strong code understanding and generation</li>
                <li>Long context window (200K tokens)</li>
                <li>Good at following detailed instructions</li>
                <li>Strong safety and alignment features</li>
              </ul>
              <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Best for:</p>
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Complex refactoring tasks</li>
                <li>Architecture design and implementation</li>
                <li>Large codebases requiring context understanding</li>
                <li>Tasks requiring careful consideration of edge cases</li>
              </ul>
              <CodeBlock>rover task "Refactor authentication system" --agent claude</CodeBlock>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3">
                <h4 className="text-lg font-semibold">Gemini (Google)</h4>
              </div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Gemini is Google's multimodal AI model with strong performance across various tasks and competitive
                pricing.
              </p>
              <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Strengths:</p>
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Fast response times</li>
                <li>Good general-purpose capabilities</li>
                <li>Cost-effective for high-volume tasks</li>
                <li>Strong at data processing and analysis</li>
              </ul>
              <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Best for:</p>
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Straightforward implementation tasks</li>
                <li>Data transformation and processing</li>
                <li>Tasks with tight budgets</li>
                <li>Quick prototyping</li>
              </ul>
              <CodeBlock>rover task "Create data export feature" --agent gemini</CodeBlock>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Configuring API Keys</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            To use an AI agent, you need to configure its API key. This is done during initialization or in your user
            settings file.
          </p>
          <CodeBlock>
{`# Set up during initialization
rover init

# Or manually edit .rover/settings.json
{
  "anthropicApiKey": "sk-ant-...",
  "geminiApiKey": "..."
}`}
          </CodeBlock>
          <Callout type="warning" className="mt-3">
            <p className="text-sm">
              <strong>Security:</strong> API keys are stored in{' '}
              <code className="rounded bg-yellow-100 px-1.5 py-0.5 dark:bg-yellow-950">.rover/settings.json</code> which
              should be git-ignored. Never commit API keys to version control.
            </p>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Choosing the Right Agent</h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="mb-2 font-medium">Use Claude when:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>The task requires deep code understanding</li>
                <li>You need careful consideration of edge cases</li>
                <li>Working with large, complex codebases</li>
                <li>Quality and correctness are top priorities</li>
                <li>The task involves architectural decisions</li>
              </ul>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="mb-2 font-medium">Use Gemini when:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>The task is straightforward and well-defined</li>
                <li>You need faster iteration times</li>
                <li>Cost is a primary concern</li>
                <li>The task involves data processing or transformation</li>
                <li>You're prototyping or experimenting</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Setting a Default Agent</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            You can set a default agent in your Rover configuration. If not specified, Claude is used by default.
          </p>
          <CodeBlock>
{`// In rover.json
{
  "defaultAgent": "claude"
}`}
          </CodeBlock>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">Override the default for a specific task:</p>
          <CodeBlock>rover task "Quick data transformation" --agent gemini</CodeBlock>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Agent Performance Tips</h3>
          <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <p className="font-medium">Be Specific with Instructions</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                All agents perform better with clear, detailed instructions. Specify frameworks, patterns, and
                expectations upfront.
              </p>
            </div>
            <div>
              <p className="font-medium">Provide Context</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Reference relevant files, existing patterns, or similar features in your codebase to guide the agent.
              </p>
            </div>
            <div>
              <p className="font-medium">Break Down Complex Tasks</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                For very complex work, create multiple smaller tasks or use iterations to build incrementally.
              </p>
            </div>
            <div>
              <p className="font-medium">Review and Iterate</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use the iterate command to refine results. This works well with all agents and often produces better
                results than trying to get everything perfect in one pass.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Cost Considerations</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Different agents have different pricing models:
          </p>
          <ul className="mb-3 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>Claude:</strong> Higher per-token cost but exceptional quality. Best for important, complex
              tasks.
            </li>
            <li>
              <strong>Gemini:</strong> Lower per-token cost. Good for straightforward tasks and high-volume usage.
            </li>
          </ul>
          <Callout type="info">
            <p className="text-sm">
              Monitor your API usage through your provider's dashboard. Rover logs API calls but does not track costs
              directly.
            </p>
          </Callout>
        </div>

        <Callout type="success">
          <p className="text-sm">
            <strong>Recommendation:</strong> Start with Claude as your default agent. It provides excellent results for
            most development tasks. Switch to Gemini for straightforward tasks where speed and cost matter more than
            the nuances of code quality.
          </p>
        </Callout>
      </div>
    </HelpSection>
  );
}
