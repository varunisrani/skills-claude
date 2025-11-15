/**
 * withLoading Higher-Order Component (HOC)
 *
 * Wraps a component with loading state functionality, automatically handling:
 * - Loading spinners
 * - Error displays
 * - Skeleton states
 * - Loading overlays
 *
 * Features:
 * - Multiple loading strategies (spinner, skeleton, overlay)
 * - Automatic error boundary
 * - Customizable loading and error components
 * - TypeScript type safety
 * - Props passthrough
 *
 * @example
 * ```tsx
 * // Basic usage with spinner
 * const TaskListWithLoading = withLoading(TaskList, {
 *   loadingComponent: <LoadingSpinner text="Loading tasks..." />,
 * });
 *
 * // Usage with skeleton
 * const TaskCardWithLoading = withLoading(TaskCard, {
 *   loadingComponent: <LoadingCard />,
 * });
 *
 * // Usage with custom loading prop
 * <TaskListWithLoading isLoading={isLoading} error={error} {...props} />
 * ```
 */

"use client"

import * as React from "react"
import { LoadingSpinner } from "@/components/loading/LoadingSpinner"
import { LoadingOverlay } from "@/components/loading/LoadingOverlay"

export interface WithLoadingProps {
  /** Whether the component is loading */
  isLoading?: boolean
  /** Error to display if any */
  error?: Error | string
  /** Loading text to display */
  loadingText?: string
  /** Whether to use overlay instead of replacing content */
  useOverlay?: boolean
}

export interface WithLoadingOptions {
  /** Custom loading component to display */
  loadingComponent?: React.ReactNode
  /** Custom error component to display */
  errorComponent?: (error: Error | string) => React.ReactNode
  /** Whether to use overlay by default */
  useOverlay?: boolean
  /** Display name for the wrapped component */
  displayName?: string
  /** Loading spinner size */
  spinnerSize?: "sm" | "md" | "lg" | "xl"
}

/**
 * Default error display component
 */
function DefaultErrorDisplay({ error }: { error: Error | string }) {
  const errorMessage = typeof error === "string" ? error : error.message

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-600 dark:text-red-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
        {errorMessage}
      </p>
    </div>
  )
}

/**
 * HOC that adds loading state handling to a component
 */
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: WithLoadingOptions = {}
) {
  const {
    loadingComponent,
    errorComponent = (error) => <DefaultErrorDisplay error={error} />,
    useOverlay: defaultUseOverlay = false,
    displayName,
    spinnerSize = "lg",
  } = options

  const WrappedComponent = React.forwardRef<any, P & WithLoadingProps>(
    (props, ref) => {
      const {
        isLoading = false,
        error,
        loadingText,
        useOverlay = defaultUseOverlay,
        ...restProps
      } = props as P & WithLoadingProps

      // Show error if present
      if (error) {
        return <>{errorComponent(error)}</>
      }

      // Show loading state
      if (isLoading) {
        // Use overlay mode - render component with overlay on top
        if (useOverlay) {
          return (
            <div className="relative">
              <Component ref={ref} {...(restProps as P)} />
              <LoadingOverlay
                visible={true}
                text={loadingText}
                spinnerSize={spinnerSize}
              />
            </div>
          )
        }

        // Replace mode - show loading component instead
        if (loadingComponent) {
          return <>{loadingComponent}</>
        }

        // Default loading spinner
        return (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size={spinnerSize} text={loadingText} />
          </div>
        )
      }

      // Render the component normally
      return <Component ref={ref} {...(restProps as P)} />
    }
  )

  WrappedComponent.displayName = displayName || `withLoading(${Component.displayName || Component.name || "Component"})`

  return WrappedComponent
}

/**
 * Utility function to create a loading HOC with preset options
 *
 * @example
 * ```tsx
 * // Create a preset HOC
 * const withSpinner = createLoadingHOC({
 *   loadingComponent: <LoadingSpinner size="lg" text="Loading..." />,
 * });
 *
 * // Use it on multiple components
 * const TaskListWithSpinner = withSpinner(TaskList);
 * const TaskCardWithSpinner = withSpinner(TaskCard);
 * ```
 */
export function createLoadingHOC(options: WithLoadingOptions) {
  return <P extends object>(Component: React.ComponentType<P>) =>
    withLoading(Component, options)
}

/**
 * Hook to use with withLoading HOC
 * Provides consistent loading state interface
 *
 * @example
 * ```tsx
 * const TaskList = withLoading(TaskListBase);
 *
 * function TasksPage() {
 *   const { data, isLoading, error } = useQuery(...);
 *   const loadingProps = useWithLoadingProps(isLoading, error, "Loading tasks...");
 *
 *   return <TaskList {...loadingProps} tasks={data} />;
 * }
 * ```
 */
export function useWithLoadingProps(
  isLoading: boolean,
  error?: Error | string,
  loadingText?: string,
  useOverlay?: boolean
): WithLoadingProps {
  return React.useMemo(
    () => ({
      isLoading,
      error,
      loadingText,
      useOverlay,
    }),
    [isLoading, error, loadingText, useOverlay]
  )
}
