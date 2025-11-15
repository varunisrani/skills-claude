/**
 * Keyboard shortcuts help section
 */

import * as React from 'react';
import { HelpSection, Callout } from './HelpSection';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  context?: string;
}

const shortcuts: { category: string; items: Shortcut[] }[] = [
  {
    category: 'Global Navigation',
    items: [
      { keys: ['g', 'h'], description: 'Go to Home page' },
      { keys: ['g', 't'], description: 'Go to Tasks list' },
      { keys: ['g', 's'], description: 'Go to Settings' },
      { keys: ['g', '?'], description: 'Go to Help page' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    category: 'Task Management',
    items: [
      { keys: ['n'], description: 'Create new task', context: 'Tasks page' },
      { keys: ['r'], description: 'Refresh task list', context: 'Tasks page' },
      { keys: ['Enter'], description: 'Open selected task', context: 'Tasks page' },
      { keys: ['Esc'], description: 'Close dialog or modal' },
    ],
  },
  {
    category: 'Task Details',
    items: [
      { keys: ['i'], description: 'Start new iteration', context: 'Task page' },
      { keys: ['d'], description: 'View diff', context: 'Task page' },
      { keys: ['l'], description: 'View logs', context: 'Task page' },
      { keys: ['m'], description: 'Merge task', context: 'Completed tasks' },
      { keys: ['p'], description: 'Push to remote', context: 'Completed tasks' },
      { keys: ['s'], description: 'Stop task', context: 'Running tasks' },
    ],
  },
  {
    category: 'Search and Filter',
    items: [
      { keys: ['/'], description: 'Focus search input' },
      { keys: ['Ctrl', 'k'], description: 'Open command palette' },
      { keys: ['Esc'], description: 'Clear search or close search' },
    ],
  },
  {
    category: 'General',
    items: [
      { keys: ['Ctrl', 's'], description: 'Save current form' },
      { keys: ['Ctrl', 'Enter'], description: 'Submit current form' },
      { keys: ['Tab'], description: 'Navigate to next focusable element' },
      { keys: ['Shift', 'Tab'], description: 'Navigate to previous focusable element' },
    ],
  },
];

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-zinc-300 bg-zinc-100 px-2 text-xs font-semibold text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
      {children}
    </kbd>
  );
}

function ShortcutItem({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex-1">
        <p className="font-medium">{shortcut.description}</p>
        {shortcut.context && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Context: {shortcut.context}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {shortcut.keys.map((key, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="px-1 text-zinc-400">+</span>}
            <ShortcutKey>{key}</ShortcutKey>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcuts() {
  return (
    <HelpSection
      id="keyboard-shortcuts"
      title="Keyboard Shortcuts"
      description="Speed up your workflow with keyboard shortcuts"
      icon={<Keyboard className="h-6 w-6 text-pink-500" />}
    >
      <div className="space-y-6">
        <Callout type="info">
          <p className="text-sm">
            Press <ShortcutKey>?</ShortcutKey> anywhere in the application to view available keyboard shortcuts for the
            current page.
          </p>
        </Callout>

        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className="mb-3 text-lg font-semibold">{section.category}</h3>
            <div className="space-y-2">
              {section.items.map((shortcut, idx) => (
                <ShortcutItem key={idx} shortcut={shortcut} />
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="mb-3 text-lg font-semibold">Customizing Shortcuts</h3>
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            You can customize keyboard shortcuts in the Settings page. Navigate to Settings &gt; Keyboard to view and
            modify shortcuts.
          </p>
          <Callout type="warning">
            <p className="text-sm">
              <strong>Note:</strong> Some shortcuts may conflict with browser or operating system shortcuts. If a
              shortcut doesn't work, check for conflicts and consider customizing it.
            </p>
          </Callout>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold">Tips for Efficient Usage</h3>
          <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <p className="font-medium">Learn Incrementally</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Start with the most common shortcuts (navigation and task creation) and gradually learn others as
                needed.
              </p>
            </div>
            <div>
              <p className="font-medium">Use Context-Aware Shortcuts</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Many shortcuts are context-aware, meaning they change behavior based on which page you're on. Press{' '}
                <ShortcutKey>?</ShortcutKey> to see available shortcuts for your current page.
              </p>
            </div>
            <div>
              <p className="font-medium">Combine with Mouse</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You don't have to use keyboard shortcuts exclusively. They're designed to complement mouse/touch
                interactions, not replace them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </HelpSection>
  );
}
