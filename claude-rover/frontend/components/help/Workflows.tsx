/**
 * Workflows help section
 */

import * as React from 'react';
import { HelpSection, CodeBlock, Callout } from './HelpSection';
import { Workflow } from 'lucide-react';

export function Workflows() {
  return (
    <HelpSection
      id="workflows"
      title="Workflows"
      description="Understand different workflows and when to use them"
      icon={<Workflow className="h-6 w-6 text-cyan-500" />}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">What are Workflows?</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Workflows are predefined templates that configure how AI agents approach different types of tasks. Each
            workflow provides specific instructions, tools, and context optimized for particular development
            activities.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Available Workflows</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold uppercase text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                  Default
                </div>
                <h4 className="text-lg font-semibold">SWE (Software Engineer)</h4>
              </div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                The general-purpose workflow for software development tasks. This is the default workflow used when
                none is specified.
              </p>
              <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Best for:</p>
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Feature implementation</li>
                <li>Bug fixes</li>
                <li>Code refactoring</li>
                <li>API development</li>
                <li>Database schema changes</li>
                <li>Testing and test coverage</li>
              </ul>
              <CodeBlock>rover task "Add user authentication" --workflow swe</CodeBlock>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-lg font-semibold">Tech Writer</h4>
              </div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Specialized workflow for documentation, technical writing, and content creation tasks.
              </p>
              <p className="mb-2 text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">Best for:</p>
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Writing README files</li>
                <li>Creating API documentation</li>
                <li>Generating code comments</li>
                <li>Writing user guides</li>
                <li>Creating changelog entries</li>
                <li>Documentation site content</li>
              </ul>
              <CodeBlock>rover task "Create API documentation for auth endpoints" --workflow tech-writer</CodeBlock>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Choosing the Right Workflow</h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="mb-2 font-medium">Use SWE when:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Writing or modifying application code</li>
                <li>Making infrastructure or configuration changes</li>
                <li>Working with databases or APIs</li>
                <li>Creating or updating tests</li>
                <li>General software development tasks</li>
              </ul>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="mb-2 font-medium">Use Tech Writer when:</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Creating or updating documentation</li>
                <li>Writing tutorials or guides</li>
                <li>Documenting API endpoints</li>
                <li>Creating README or contributing guides</li>
                <li>The primary output is written content, not code</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Workflow Customization</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            Each workflow can be customized by providing specific instructions in your task description. The AI agent
            will adapt its approach based on your requirements while staying within the workflow's guidelines.
          </p>
          <Callout type="info">
            <p className="text-sm">
              <strong>Example:</strong> Even when using the SWE workflow, you can ask the agent to include
              comprehensive documentation with the code, or to follow specific coding standards.
            </p>
          </Callout>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Workflow Examples</h3>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-2 font-medium">SWE Workflow Example</p>
              <CodeBlock>
                rover task "Implement user registration endpoint with email validation,
password hashing, and input sanitization. Include unit tests." --workflow swe
              </CodeBlock>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-2 font-medium">Tech Writer Workflow Example</p>
              <CodeBlock>
                rover task "Document the authentication API including all endpoints,
request/response formats, error codes, and usage examples" --workflow tech-writer
              </CodeBlock>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Creating Custom Workflows</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            You can create custom workflows for your specific needs by adding workflow configuration files to your
            project. Custom workflows allow you to:
          </p>
          <ul className="mb-3 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Define project-specific development patterns</li>
            <li>Enforce coding standards automatically</li>
            <li>Integrate with custom tools or frameworks</li>
            <li>Create specialized workflows for your team</li>
          </ul>
          <Callout type="info">
            <p className="text-sm">
              Custom workflow creation is an advanced feature. Check the Rover documentation for details on creating
              custom workflow definitions.
            </p>
          </Callout>
        </div>

        <Callout type="success">
          <p className="text-sm">
            <strong>Pro tip:</strong> Start with the default SWE workflow for most tasks. Switch to Tech Writer when
            documentation quality is the primary concern, or when the task doesn't involve code changes.
          </p>
        </Callout>
      </div>
    </HelpSection>
  );
}
