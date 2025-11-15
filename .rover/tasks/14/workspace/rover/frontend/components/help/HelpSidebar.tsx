/**
 * Navigation sidebar for help topics
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  CheckSquare,
  RefreshCw,
  GitBranch,
  Workflow,
  Bot,
  Keyboard,
  AlertCircle,
  HelpCircle,
  Rocket,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpTopic {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const helpTopics: HelpTopic[] = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'task-management', label: 'Task Management', icon: CheckSquare },
  { id: 'iterations', label: 'Iterations', icon: RefreshCw },
  { id: 'git-operations', label: 'Git Operations', icon: GitBranch },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'ai-agents', label: 'AI Agents', icon: Bot },
  { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
  { id: 'command-reference', label: 'Command Reference', icon: BookOpen },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

interface HelpSidebarProps {
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function HelpSidebar({ activeSection, onSectionClick }: HelpSidebarProps) {
  return (
    <div className="sticky top-0 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Help Topics</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <nav className="space-y-1 p-4">
          {helpTopics.map((topic) => {
            const isActive = activeSection === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => onSectionClick(topic.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                )}
              >
                <topic.icon className="h-4 w-4" />
                {topic.label}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
