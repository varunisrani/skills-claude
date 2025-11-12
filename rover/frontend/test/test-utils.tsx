/**
 * Test utilities for React Testing Library
 * Provides wrappers and helpers for testing components with React Query
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a new QueryClient for testing
 * Uses different default options to avoid retries and improve test speed
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides all necessary context providers for testing
 */
export function createWrapper(queryClient: QueryClient = createTestQueryClient()) {
  return function AllTheProviders({ children }: AllTheProvidersProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient;
  }
) {
  const { queryClient, ...renderOptions } = options || {};
  const testQueryClient = queryClient || createTestQueryClient();

  return {
    ...render(ui, {
      wrapper: createWrapper(testQueryClient),
      ...renderOptions,
    }),
    queryClient: testQueryClient,
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
