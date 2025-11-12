/**
 * React Query hooks for task git diffs
 *
 * Provides hooks for:
 * - Fetching git diffs for tasks
 * - Comparing against different branches
 * - Viewing diffs for specific files
 *
 * Features:
 * - Caching of diff results
 * - Support for different comparison branches
 * - File-specific diffs
 * - Statistics about changes
 * - TypeScript type safety
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { GetDiffResponse } from '@/types/api';
import { taskKeys } from './useTasks';

/**
 * Options for fetching task diffs
 */
export interface TaskDiffOptions {
  /** Branch to compare against (defaults to source branch) */
  branch?: string;

  /** Specific file to diff (optional) */
  file?: string;

  /** Include binary files in diff */
  includeBinary?: boolean;

  /** Whether the query is enabled */
  enabled?: boolean;
}

/**
 * Hook to fetch git diff for a task
 *
 * Features:
 * - Cached diff results for better performance
 * - Support for comparing against different branches
 * - File-specific diffs
 * - Statistics about changes (insertions, deletions, files changed)
 * - Proper error handling
 *
 * @param taskId - The task ID to fetch diff for
 * @param options - Optional configuration for diff fetching
 * @returns Query result with diff data
 *
 * @example
 * ```tsx
 * // Fetch full task diff
 * const { data: diff } = useTaskDiffQuery(123);
 *
 * // Compare against main branch
 * const { data: mainDiff } = useTaskDiffQuery(123, { branch: 'main' });
 *
 * // Diff for specific file
 * const { data: fileDiff } = useTaskDiffQuery(123, {
 *   file: 'src/components/Header.tsx'
 * });
 *
 * // Access diff data
 * if (diff) {
 *   console.log('Diff:', diff.diff);
 *   console.log('Files changed:', diff.files);
 *   console.log('Stats:', diff.stats);
 * }
 * ```
 */
export function useTaskDiffQuery(taskId: number, options?: TaskDiffOptions) {
  return useQuery({
    queryKey: taskKeys.diff(taskId, options?.branch, options?.file),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (options?.branch) {
        params.append('branch', options.branch);
      }

      if (options?.file) {
        params.append('file', options.file);
      }

      if (options?.includeBinary !== undefined) {
        params.append('includeBinary', options.includeBinary.toString());
      }

      const url = `/api/tasks/${taskId}/diff${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Task ${taskId} not found`);
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch diff' }));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: GetDiffResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch diff');
      }

      return data.data;
    },
    enabled: options?.enabled !== false,
    refetchOnWindowFocus: false, // Diffs don't change often, no need to refetch on focus
    // Cache diffs for longer since they're less likely to change
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Hook to get the list of changed files in a task
 *
 * This is a convenience hook that extracts just the file list from the diff.
 *
 * @param taskId - The task ID to get changed files for
 * @param options - Optional configuration
 * @returns Query result with array of changed file paths
 *
 * @example
 * ```tsx
 * const { data: changedFiles } = useTaskChangedFiles(123);
 *
 * return (
 *   <ul>
 *     {changedFiles?.map(file => (
 *       <li key={file}>{file}</li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export function useTaskChangedFiles(
  taskId: number,
  options?: Omit<TaskDiffOptions, 'file' | 'includeBinary'>
) {
  const { data, ...rest } = useTaskDiffQuery(taskId, {
    ...options,
    includeBinary: false,
  });

  return {
    ...rest,
    data: data?.files ?? [],
  };
}

/**
 * Hook to get diff statistics for a task
 *
 * This is a convenience hook that extracts just the statistics from the diff.
 *
 * @param taskId - The task ID to get statistics for
 * @param options - Optional configuration
 * @returns Query result with diff statistics
 *
 * @example
 * ```tsx
 * const { data: stats } = useTaskDiffStats(123);
 *
 * return (
 *   <div>
 *     <p>Files changed: {stats?.filesChanged}</p>
 *     <p>Insertions: +{stats?.insertions}</p>
 *     <p>Deletions: -{stats?.deletions}</p>
 *   </div>
 * );
 * ```
 */
export function useTaskDiffStats(
  taskId: number,
  options?: Omit<TaskDiffOptions, 'file' | 'includeBinary'>
) {
  const { data, ...rest } = useTaskDiffQuery(taskId, {
    ...options,
    includeBinary: false,
  });

  return {
    ...rest,
    data: data?.stats,
  };
}

/**
 * Hook to check if a task has any changes
 *
 * This is useful for showing/hiding diff-related UI elements.
 *
 * @param taskId - The task ID to check
 * @param options - Optional configuration
 * @returns Boolean indicating if the task has changes
 *
 * @example
 * ```tsx
 * const hasChanges = useTaskHasChanges(123);
 *
 * if (!hasChanges) {
 *   return <p>No changes yet</p>;
 * }
 * ```
 */
export function useTaskHasChanges(
  taskId: number,
  options?: Omit<TaskDiffOptions, 'file' | 'includeBinary'>
): boolean {
  const { data } = useTaskDiffQuery(taskId, {
    ...options,
    includeBinary: false,
  });

  return (data?.stats?.filesChanged ?? 0) > 0;
}

/**
 * Hook to fetch diffs for multiple files in a task
 *
 * This allows fetching diffs for specific files in parallel.
 *
 * @param taskId - The task ID to fetch diffs for
 * @param files - Array of file paths to get diffs for
 * @param options - Optional configuration (applied to all files)
 * @returns Array of query results, one per file
 *
 * @example
 * ```tsx
 * const fileDiffs = useTaskFileDiffs(123, [
 *   'src/App.tsx',
 *   'src/index.tsx',
 * ]);
 *
 * return (
 *   <div>
 *     {fileDiffs.map((result, i) => (
 *       <div key={i}>
 *         {result.isLoading ? 'Loading...' : result.data?.diff}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useTaskFileDiffs(
  taskId: number,
  files: string[],
  options?: Omit<TaskDiffOptions, 'file'>
) {
  return files.map((file) =>
    useTaskDiffQuery(taskId, {
      ...options,
      file,
    })
  );
}

/**
 * Parse unified diff format into structured data
 *
 * This is a utility function that can be used with the diff string
 * returned from useTaskDiffQuery.
 *
 * @param diffString - The unified diff string
 * @returns Parsed diff data
 *
 * @example
 * ```tsx
 * const { data } = useTaskDiffQuery(123);
 * const parsed = parseDiff(data?.diff ?? '');
 * ```
 */
export function parseDiff(diffString: string): ParsedDiff[] {
  const files: ParsedDiff[] = [];
  const fileRegex = /^diff --git a\/(.*) b\/(.*)$/gm;
  const hunkRegex = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)$/gm;

  let currentFile: ParsedDiff | null = null;
  let currentHunk: DiffHunk | null = null;

  const lines = diffString.split('\n');

  for (const line of lines) {
    const fileMatch = fileRegex.exec(line);
    if (fileMatch) {
      if (currentFile) {
        files.push(currentFile);
      }
      currentFile = {
        from: fileMatch[1],
        to: fileMatch[2],
        hunks: [],
      };
      currentHunk = null;
      continue;
    }

    const hunkMatch = hunkRegex.exec(line);
    if (hunkMatch && currentFile) {
      if (currentHunk) {
        currentFile.hunks.push(currentHunk);
      }
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldLines: hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1,
        newStart: parseInt(hunkMatch[3], 10),
        newLines: hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1,
        lines: [],
      };
      continue;
    }

    if (currentHunk && currentFile) {
      currentHunk.lines.push(line);
    }
  }

  if (currentHunk && currentFile) {
    currentFile.hunks.push(currentHunk);
  }
  if (currentFile) {
    files.push(currentFile);
  }

  return files;
}

/**
 * Types for parsed diff data
 */
export interface ParsedDiff {
  from: string;
  to: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}
