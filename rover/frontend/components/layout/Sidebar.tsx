/**
 * Sidebar navigation component
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, Settings, FileCode, Keyboard, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useShortcuts } from '@/lib/shortcuts/ShortcutsProvider';
import { ShortcutBadge } from '@/components/shortcuts/ShortcutBadge';
import { shortcuts } from '@/lib/shortcuts/shortcuts-config';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Tasks', href: '/tasks', icon: List },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openHelp } = useShortcuts();

  return (
    <aside
      className="flex h-full w-64 flex-col bg-zinc-50 dark:bg-zinc-900"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
        <FileCode className="h-6 w-6" aria-hidden="true" />
        <h1 className="text-xl font-bold">Rover</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4" aria-label="Primary navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-zinc-300',
                isActive
                  ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Keyboard shortcuts button at bottom */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={openHelp}
        >
          <Keyboard className="h-5 w-5" aria-hidden="true" />
          <span className="flex-1 text-left">Keyboard Shortcuts</span>
          <ShortcutBadge shortcut={shortcuts.SHOW_SHORTCUTS} size="sm" />
        </Button>
      </div>
    </aside>
  );
}
