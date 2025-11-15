/**
 * TanStack Query Provider Configuration
 *
 * Provides React Query context to the application with optimized defaults:
 * - Retry logic for failed requests
 * - Stale time and cache time configuration
 * - Error handling defaults
 * - Refetch on window focus
 * - Development tools integration
 *
 * This provider should wrap the entire application to enable React Query hooks.
 */

'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Default query options for all queries
 *
 * These settings provide a good balance between:
 * - Fresh data (short stale time)
 * - Performance (caching)
 * - Reliability (retry logic)
 * - User experience (error handling)
 */
const defaultOptions = {
  queries: {
    // How long data is considered fresh (no refetch needed)
    // 30 seconds is a good balance for task management
    staleTime: 30 * 1000,

    // How long unused data stays in cache before garbage collection
    // 5 minutes allows quick navigation without refetching
    gcTime: 5 * 60 * 1000, // Previously called cacheTime in v4

    // Refetch when window regains focus
    // Useful for keeping task status up-to-date
    refetchOnWindowFocus: true,

    // Don't refetch on component mount if data is fresh
    refetchOnMount: false,

    // Retry failed requests
    // 3 retries with exponential backoff for network resilience
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      if (error instanceof Error && error.message.includes('400')) {
        return false;
      }
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      if (error instanceof Error && error.message.includes('403')) {
        return false;
      }

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Exponential backoff for retries
    // First retry after 1s, second after 2s, third after 4s
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  mutations: {
    // Retry mutations once for transient network errors
    retry: 1,

    // Shorter retry delay for mutations
    retryDelay: 1000,
  },
};

/**
 * Create a singleton QueryClient instance
 *
 * This ensures we only have one QueryClient instance per app lifecycle,
 * which is important for cache consistency.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions,
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get or create the QueryClient instance
 *
 * In the browser, we reuse the same client instance.
 * On the server (SSR), we create a new instance for each request.
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse the same query client
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * Query Provider Component
 *
 * Wraps the application with React Query context and dev tools.
 *
 * @param props - Component props with children
 * @returns Provider component
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <QueryProvider>
 *           {children}
 *         </QueryProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Get or create the query client
  // This pattern ensures the client is stable across renders
  const [queryClient] = React.useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - only shown in development */}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
        position="bottom"
      />
    </QueryClientProvider>
  );
}

/**
 * Hook to access the QueryClient instance
 *
 * This is useful for advanced use cases like prefetching or
 * manual cache manipulation.
 *
 * @returns The QueryClient instance
 *
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query';
 *
 * function MyComponent() {
 *   const queryClient = useQueryClient();
 *
 *   const prefetchTask = (id: number) => {
 *     queryClient.prefetchQuery({
 *       queryKey: ['tasks', 'detail', id],
 *       queryFn: () => fetchTask(id),
 *     });
 *   };
 * }
 * ```
 */
// Note: useQueryClient is already exported by @tanstack/react-query
// This comment is just for documentation

/**
 * Error boundary for Query errors
 *
 * This component can be used to catch and display errors from queries
 * at a higher level in the component tree.
 *
 * @example
 * ```tsx
 * <QueryErrorBoundary>
 *   <TaskList />
 * </QueryErrorBoundary>
 * ```
 */
export class QueryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Query Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Export the QueryClient type for use in other files
 */
export type { QueryClient };
