/**
 * Main help page
 */

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { HelpSidebar } from '@/components/help/HelpSidebar';
import { QuickStart } from '@/components/help/QuickStart';
import { TaskManagement } from '@/components/help/TaskManagement';
import { Iterations } from '@/components/help/Iterations';
import { GitOperations } from '@/components/help/GitOperations';
import { Workflows } from '@/components/help/Workflows';
import { AIAgents } from '@/components/help/AIAgents';
import { KeyboardShortcuts } from '@/components/help/KeyboardShortcuts';
import { CommandReference } from '@/components/help/CommandReference';
import { TroubleShooting } from '@/components/help/TroubleShooting';
import { FAQSection } from '@/components/help/FAQSection';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle scroll to section
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'getting-started',
        'task-management',
        'iterations',
        'git-operations',
        'workflows',
        'ai-agents',
        'keyboard-shortcuts',
        'command-reference',
        'troubleshooting',
        'faq',
      ];

      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search (basic filtering - could be enhanced)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real implementation, this could highlight matching content
    // or filter sections based on the search query
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <HelpSidebar activeSection={activeSection} onSectionClick={handleSectionClick} />

      {/* Main content */}
      <main className="flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
          <div className="mx-auto max-w-4xl px-8 py-6">
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Rover Help & Documentation
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-8 py-8">
          <div className="space-y-8">
            <QuickStart />
            <TaskManagement />
            <Iterations />
            <GitOperations />
            <Workflows />
            <AIAgents />
            <KeyboardShortcuts />
            <CommandReference />
            <TroubleShooting />
            <FAQSection />
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-zinc-200 pt-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Need more help?{' '}
              <a
                href="https://github.com/rover-ai/rover"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Visit our GitHub repository
              </a>{' '}
              or{' '}
              <a
                href="https://discord.gg/rover"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                join our Discord community
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
