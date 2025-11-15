/**
 * App-level Shortcuts Provider
 *
 * Wraps the app with shortcuts provider and includes global UI components
 * like the shortcuts help modal and command palette
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ShortcutsProvider } from './ShortcutsProvider';
import { ShortcutsHelp } from '@/components/shortcuts/ShortcutsHelp';
import { CommandPalette } from '@/components/shortcuts/CommandPalette';
import { useShortcuts } from './ShortcutsProvider';
import { useTasksQuery } from '@/lib/hooks/useTasks';

interface AppShortcutsProviderProps {
  children: React.ReactNode;
}

/**
 * Inner component that uses the shortcuts context
 */
function ShortcutsUI() {
  const {
    isHelpOpen,
    closeHelp,
    isCommandPaletteOpen,
    closeCommandPalette,
  } = useShortcuts();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const { data } = useTasksQuery({ autoRefresh: false });
  const tasks = data?.data || [];

  // Check if dark mode is enabled
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleToggleDarkMode = useCallback(() => {
    // Try to use the theme provider's toggle if available
    const themeButton = document.querySelector('[data-theme-toggle]') as HTMLButtonElement;
    if (themeButton) {
      themeButton.click();
      return;
    }

    // Fallback to manual toggle
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');

    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('rover-ui-theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('rover-ui-theme', 'dark');
    }
  }, []);

  return (
    <>
      <ShortcutsHelp open={isHelpOpen} onClose={closeHelp} />
      <CommandPalette
        open={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        tasks={tasks}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />
    </>
  );
}

/**
 * App-level shortcuts provider with global UI components
 *
 * Provides keyboard shortcuts functionality throughout the app
 * and includes the help modal and command palette
 */
export function AppShortcutsProvider({ children }: AppShortcutsProviderProps) {
  return (
    <ShortcutsProvider>
      {children}
      <ShortcutsUI />
    </ShortcutsProvider>
  );
}
