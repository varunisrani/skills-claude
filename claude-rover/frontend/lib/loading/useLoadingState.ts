/**
 * useLoadingState Hook
 *
 * A comprehensive hook for managing loading states with support for:
 * - Multiple concurrent loading operations
 * - Error tracking
 * - Success tracking
 * - Loading text/messages
 * - Automatic cleanup
 *
 * Features:
 * - Track multiple loading operations by key
 * - Automatic error handling
 * - Success state management
 * - Cleanup on unmount
 * - TypeScript type safety
 *
 * @example
 * ```tsx
 * const { isLoading, error, execute, reset } = useLoadingState();
 *
 * async function handleSubmit() {
 *   const result = await execute(async () => {
 *     const response = await fetch('/api/tasks', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *     return response.json();
 *   }, { loadingText: 'Creating task...' });
 *
 *   if (result.success) {
 *     console.log('Task created:', result.data);
 *   }
 * }
 *
 * return (
 *   <button onClick={handleSubmit} disabled={isLoading}>
 *     {isLoading ? loadingText : 'Create Task'}
 *   </button>
 * );
 * ```
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface LoadingStateOptions {
  /** Text to display while loading */
  loadingText?: string
  /** Text to display on success */
  successText?: string
  /** Key to identify this loading operation (for multiple concurrent operations) */
  key?: string
  /** Callback on success */
  onSuccess?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Auto-reset success state after this many milliseconds */
  successTimeout?: number
  /** Auto-reset error state after this many milliseconds */
  errorTimeout?: number
}

export interface LoadingState {
  /** Whether any operation is loading */
  isLoading: boolean
  /** Current loading text */
  loadingText?: string
  /** Current error if any */
  error?: Error
  /** Error message string */
  errorMessage?: string
  /** Whether the last operation succeeded */
  isSuccess: boolean
  /** Success text if any */
  successText?: string
  /** Map of loading states by key (for multiple operations) */
  loadingStates: Map<string, boolean>
}

export interface LoadingActions {
  /** Execute an async operation with loading state management */
  execute: <T>(
    operation: () => Promise<T>,
    options?: LoadingStateOptions
  ) => Promise<{ success: boolean; data?: T; error?: Error }>
  /** Start loading manually */
  startLoading: (options?: LoadingStateOptions) => void
  /** Stop loading manually */
  stopLoading: (key?: string) => void
  /** Set error state */
  setError: (error: Error | string) => void
  /** Clear error state */
  clearError: () => void
  /** Set success state */
  setSuccess: (text?: string) => void
  /** Clear success state */
  clearSuccess: () => void
  /** Reset all states */
  reset: () => void
  /** Check if a specific key is loading */
  isKeyLoading: (key: string) => boolean
}

const DEFAULT_KEY = "default"

export function useLoadingState(): LoadingState & LoadingActions {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map())
  const [loadingText, setLoadingText] = useState<string>()
  const [error, setErrorState] = useState<Error>()
  const [isSuccess, setIsSuccess] = useState(false)
  const [successText, setSuccessText] = useState<string>()

  const successTimeoutRef = useRef<NodeJS.Timeout>()
  const errorTimeoutRef = useRef<NodeJS.Timeout>()
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [])

  const startLoading = useCallback((options?: LoadingStateOptions) => {
    const key = options?.key || DEFAULT_KEY
    setLoadingStates((prev) => new Map(prev).set(key, true))
    if (options?.loadingText) {
      setLoadingText(options.loadingText)
    }
    setErrorState(undefined)
    setIsSuccess(false)
    setSuccessText(undefined)
  }, [])

  const stopLoading = useCallback((key: string = DEFAULT_KEY) => {
    setLoadingStates((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
    if (key === DEFAULT_KEY) {
      setLoadingText(undefined)
    }
  }, [])

  const setError = useCallback((err: Error | string) => {
    const error = typeof err === "string" ? new Error(err) : err
    setErrorState(error)
    setIsSuccess(false)
    setSuccessText(undefined)
  }, [])

  const clearError = useCallback(() => {
    setErrorState(undefined)
  }, [])

  const setSuccess = useCallback((text?: string) => {
    setIsSuccess(true)
    setSuccessText(text)
    setErrorState(undefined)
  }, [])

  const clearSuccess = useCallback(() => {
    setIsSuccess(false)
    setSuccessText(undefined)
  }, [])

  const reset = useCallback(() => {
    setLoadingStates(new Map())
    setLoadingText(undefined)
    setErrorState(undefined)
    setIsSuccess(false)
    setSuccessText(undefined)
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  const isKeyLoading = useCallback(
    (key: string) => {
      return loadingStates.get(key) === true
    },
    [loadingStates]
  )

  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options?: LoadingStateOptions
    ): Promise<{ success: boolean; data?: T; error?: Error }> => {
      const key = options?.key || DEFAULT_KEY

      try {
        startLoading(options)

        const data = await operation()

        if (!mountedRef.current) {
          return { success: true, data }
        }

        stopLoading(key)
        setSuccess(options?.successText)
        options?.onSuccess?.()

        // Auto-reset success state if timeout is set
        if (options?.successTimeout) {
          successTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              clearSuccess()
            }
          }, options.successTimeout)
        }

        return { success: true, data }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))

        if (!mountedRef.current) {
          return { success: false, error }
        }

        stopLoading(key)
        setError(error)
        options?.onError?.(error)

        // Auto-reset error state if timeout is set
        if (options?.errorTimeout) {
          errorTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              clearError()
            }
          }, options.errorTimeout)
        }

        return { success: false, error }
      }
    },
    [startLoading, stopLoading, setError, setSuccess, clearError, clearSuccess]
  )

  const isLoading = loadingStates.size > 0

  return {
    // State
    isLoading,
    loadingText,
    error,
    errorMessage: error?.message,
    isSuccess,
    successText,
    loadingStates,

    // Actions
    execute,
    startLoading,
    stopLoading,
    setError,
    clearError,
    setSuccess,
    clearSuccess,
    reset,
    isKeyLoading,
  }
}

/**
 * Simpler version of useLoadingState for single operations
 *
 * @example
 * ```tsx
 * const { isLoading, error, execute } = useSimpleLoadingState();
 *
 * async function handleClick() {
 *   await execute(async () => {
 *     await api.doSomething();
 *   });
 * }
 * ```
 */
export function useSimpleLoadingState() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async <T,>(operation: () => Promise<T>) => {
    try {
      setIsLoading(true)
      setError(undefined)
      const result = await operation()
      if (mountedRef.current) {
        setIsLoading(false)
      }
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      if (mountedRef.current) {
        setIsLoading(false)
        setError(error)
      }
      return { success: false, error }
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(undefined)
  }, [])

  return {
    isLoading,
    error,
    errorMessage: error?.message,
    execute,
    reset,
  }
}
