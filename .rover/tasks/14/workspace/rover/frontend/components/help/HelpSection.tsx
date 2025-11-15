/**
 * Reusable section component for help topics
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HelpSectionProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function HelpSection({
  id,
  title,
  description,
  icon,
  children,
  className,
}: HelpSectionProps) {
  return (
    <Card id={id} className={cn('scroll-mt-20', className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {icon && <div className="mt-1">{icon}</div>}
          <div className="flex-1">
            <CardTitle className="text-2xl">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-2 text-base">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  return (
    <pre
      className={cn(
        'overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-50 dark:bg-zinc-950',
        className
      )}
    >
      <code>{children}</code>
    </pre>
  );
}

interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function Callout({ type = 'info', children, className }: CalloutProps) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100',
    warning:
      'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-100',
    success:
      'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100',
    error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100',
  };

  return (
    <div className={cn('rounded-lg border-l-4 p-4', styles[type], className)}>
      {children}
    </div>
  );
}
