/**
 * Command Palette Component
 *
 * Quick access command palette for searching and executing actions
 * Opened with Cmd/Ctrl + K
 */

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ShortcutBadge } from './ShortcutBadge';
import {
  Search,
  Plus,
  RefreshCw,
  Settings,
  Moon,
  Sun,
  Keyboard,
  FileText,
  Play,
  GitMerge,
  GitPullRequest,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskSummary } from '@/types/task';

export interface Command {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Keyboard shortcut */
  shortcut?: string[];
  /** Callback when command is executed */
  onExecute: () => void;
  /** Category for grouping */
  category: 'actions' | 'navigation' | 'tasks' | 'settings';
  /** Search keywords */
  keywords?: string[];
}

interface CommandPaletteProps {
  /** Whether the palette is open */
  open: boolean;
  /** Callback when palette is closed */
  onClose: () => void;
  /** Available tasks for quick navigation */
  tasks?: TaskSummary[];
  /** Callback handlers */
  onCreateTask?: () => void;
  onRefreshTasks?: () => void;
  onToggleDarkMode?: () => void;
  onOpenSettings?: () => void;
  onShowShortcuts?: () => void;
  /** Current theme */
  isDarkMode?: boolean;
}

/**
 * Command palette for quick actions and navigation
 *
 * Features:
 * - Fuzzy search for commands and tasks
 * - Keyboard navigation (up/down arrows, enter)
 * - Quick task navigation
 * - Action shortcuts
 *
 * @example
 * ```tsx
 * <CommandPalette
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   tasks={tasks}
 *   onCreateTask={() => {}}
 * />
 * ```
 */
export function CommandPalette({
  open,
  onClose,
  tasks = [],
  onCreateTask,
  onRefreshTasks,
  onToggleDarkMode,
  onOpenSettings,
  onShowShortcuts,
  isDarkMode = false,
}: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands list
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    // Actions
    if (onCreateTask) {
      cmds.push({
        id: 'create-task',
        name: 'Create New Task',
        description: 'Create a new AI-powered development task',
        icon: Plus,
        shortcut: ['mod+n'],
        onExecute: () => {
          onClose();
          onCreateTask();
        },
        category: 'actions',
        keywords: ['new', 'add', 'create', 'task'],
      });
    }

    if (onRefreshTasks) {
      cmds.push({
        id: 'refresh-tasks',
        name: 'Refresh Tasks',
        description: 'Reload the task list',
        icon: RefreshCw,
        shortcut: ['mod+r'],
        onExecute: () => {
          onClose();
          onRefreshTasks();
        },
        category: 'actions',
        keywords: ['refresh', 'reload', 'update'],
      });
    }

    if (onToggleDarkMode) {
      cmds.push({
        id: 'toggle-theme',
        name: 'Toggle Theme',
        description: `Switch to ${isDarkMode ? 'light' : 'dark'} mode`,
        icon: isDarkMode ? Sun : Moon,
        shortcut: ['d'],
        onExecute: () => {
          onClose();
          onToggleDarkMode();
        },
        category: 'settings',
        keywords: ['theme', 'dark', 'light', 'mode'],
      });
    }

    if (onOpenSettings) {
      cmds.push({
        id: 'open-settings',
        name: 'Open Settings',
        description: 'Configure application settings',
        icon: Settings,
        shortcut: ['s'],
        onExecute: () => {
          onClose();
          onOpenSettings();
        },
        category: 'settings',
        keywords: ['settings', 'preferences', 'config'],
      });
    }

    if (onShowShortcuts) {
      cmds.push({
        id: 'show-shortcuts',
        name: 'Show Keyboard Shortcuts',
        description: 'View all available keyboard shortcuts',
        icon: Keyboard,
        shortcut: ['mod+/'],
        onExecute: () => {
          onClose();
          onShowShortcuts();
        },
        category: 'settings',
        keywords: ['shortcuts', 'keyboard', 'keys', 'help'],
      });
    }

    // Navigation
    cmds.push({
      id: 'go-to-tasks',
      name: 'Go to Tasks',
      description: 'View all tasks',
      icon: FileText,
      onExecute: () => {
        onClose();
        router.push('/tasks');
      },
      category: 'navigation',
      keywords: ['tasks', 'list', 'view'],
    });

    // Task commands
    tasks.slice(0, 10).forEach((task) => {
      const statusIcon = task.status === 'IN_PROGRESS' ? Play :
                        task.status === 'MERGED' ? GitMerge :
                        task.status === 'PUSHED' ? GitPullRequest : FileText;

      cmds.push({
        id: `task-${task.id}`,
        name: task.title || `Task #${task.id}`,
        description: `${task.status}`,
        icon: statusIcon,
        onExecute: () => {
          onClose();
          router.push(`/tasks/${task.id}`);
        },
        category: 'tasks',
        keywords: [
          'task',
          task.id.toString(),
          task.title?.toLowerCase() || '',
          task.status.toLowerCase(),
        ],
      });
    });

    return cmds;
  }, [tasks, onCreateTask, onRefreshTasks, onToggleDarkMode, onOpenSettings, onShowShortcuts, isDarkMode, onClose, router]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      return commands;
    }

    const searchLower = search.toLowerCase();
    return commands.filter((cmd) => {
      const nameMatch = cmd.name.toLowerCase().includes(searchLower);
      const descMatch = cmd.description?.toLowerCase().includes(searchLower);
      const keywordMatch = cmd.keywords?.some((kw) => kw.includes(searchLower));

      return nameMatch || descMatch || keywordMatch;
    });
  }, [commands, search]);

  // Group filtered commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      actions: [],
      navigation: [],
      tasks: [],
      settings: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = filteredCommands[selectedIndex];
      if (command) {
        command.onExecute();
      }
    }
  };

  // Execute command
  const executeCommand = (command: Command) => {
    command.onExecute();
  };

  const categoryTitles = {
    actions: 'Actions',
    navigation: 'Navigation',
    tasks: 'Recent Tasks',
    settings: 'Settings',
  };

  let currentIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands and tasks..."
              className="pl-10 border-0 focus-visible:ring-0 text-base"
            />
          </div>
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto p-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No commands found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCommands).map(([category, cmds]) => {
                if (cmds.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {categoryTitles[category as keyof typeof categoryTitles]}
                    </div>
                    <div className="space-y-1">
                      {cmds.map((command) => {
                        currentIndex++;
                        const isSelected = currentIndex === selectedIndex;
                        const Icon = command.icon;

                        return (
                          <button
                            key={command.id}
                            onClick={() => executeCommand(command)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                              isSelected && 'bg-zinc-100 dark:bg-zinc-800'
                            )}
                          >
                            {Icon && (
                              <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {command.name}
                              </div>
                              {command.description && (
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {command.description}
                                </div>
                              )}
                            </div>
                            {command.shortcut && (
                              <ShortcutBadge keys={command.shortcut} size="sm" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
