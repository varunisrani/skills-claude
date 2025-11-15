# Rover Frontend Testing Setup

This document describes the testing infrastructure for the Rover frontend application and provides instructions for running tests.

## Overview

The Rover frontend uses the following testing stack:

- **Vitest**: Fast unit test framework (modern alternative to Jest)
- **React Testing Library**: Testing utilities for React components and hooks
- **jsdom**: Browser environment simulation for Node.js
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

## Installation

To install testing dependencies, run:

```bash
cd rover/frontend
npm install
```

This will install all dependencies listed in `package.json`, including:

- `vitest` - Test runner
- `@vitest/ui` - Web UI for test results
- `@vitest/coverage-v8` - Code coverage reporting
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment

## Running Tests

### Run All Tests Once

```bash
npm test
```

This runs all tests in the project once and displays results in the terminal.

### Watch Mode

```bash
npm run test:watch
```

Runs tests in watch mode - tests automatically re-run when files change. This is ideal for development.

### UI Mode

```bash
npm run test:ui
```

Opens an interactive web UI for viewing and debugging tests. The UI provides:
- Visual test results
- File tree navigation
- Test filtering
- Detailed error messages
- Console output

Access the UI at `http://localhost:51204` (or the port shown in terminal).

### Coverage Report

```bash
npm run test:coverage
```

Generates a code coverage report showing which lines/branches are tested. Reports are generated in:
- Terminal: Text summary
- `coverage/index.html`: Interactive HTML report

## Test Files

Tests are located alongside the code they test, in `__tests__` directories:

```
rover/frontend/
├── lib/
│   └── hooks/
│       ├── useTaskStream.ts          # Hook implementation
│       └── __tests__/
│           └── useTaskStream.test.ts  # Hook tests
├── test/
│   ├── setup.ts                       # Global test setup
│   └── test-utils.tsx                 # Testing utilities
└── vitest.config.ts                   # Vitest configuration
```

## Test Structure

### Test Organization

Tests follow the Arrange-Act-Assert pattern and are organized by feature:

```typescript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Arrange: Set up test data and state
      const testData = createTestData();

      // Act: Perform the action being tested
      const result = performAction(testData);

      // Assert: Verify the outcome
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Testing React Hooks

For testing React hooks, use `renderHook` from React Testing Library:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/test-utils';

it('should test a hook', async () => {
  const queryClient = createTestQueryClient();

  const { result } = renderHook(
    () => useCustomHook(params),
    { wrapper: createWrapper(queryClient) }
  );

  // Access hook return value
  expect(result.current.value).toBe(expected);

  // Wait for async updates
  await waitFor(() => {
    expect(result.current.isLoaded).toBe(true);
  });
});
```

## useTaskStream Test Coverage

The `useTaskStream.test.ts` file provides comprehensive coverage of SSE reconnection logic:

### Test Suites

1. **Initial Connection** (3 tests)
   - ✅ Establishes SSE connection on mount
   - ✅ Calls onConnect callback when connection opens
   - ✅ Does not connect when enabled is false

2. **Message Handling** (4 tests)
   - ✅ Parses and handles incoming messages
   - ✅ Ignores heartbeat messages
   - ✅ Updates React Query cache on message
   - ✅ Handles malformed JSON messages gracefully

3. **Connection Failure and Reconnection** (5 tests)
   - ✅ Attempts reconnection on error
   - ✅ Implements exponential backoff: 1s, 2s, 4s, 8s, 16s
   - ✅ Caps backoff delay at 30 seconds
   - ✅ Resets backoff delay after successful connection
   - ✅ Calls onError callback on connection failure

4. **Manual Control** (3 tests)
   - ✅ Supports manual disconnect
   - ✅ Supports manual reconnect
   - ✅ Resets backoff delay on manual reconnect

5. **Cleanup and Unmount** (4 tests)
   - ✅ Closes connection on unmount
   - ✅ Clears reconnection timeout on unmount
   - ✅ Does not reconnect after unmount
   - ✅ Calls onDisconnect on unmount

6. **Task ID Changes** (2 tests)
   - ✅ Reconnects when taskId changes
   - ✅ Resets state when taskId changes

7. **Enabled Option** (2 tests)
   - ✅ Disconnects when enabled changes from true to false
   - ✅ Connects when enabled changes from false to true

8. **Callback Stability** (1 test)
   - ✅ Handles callback changes without reconnecting

**Total: 24 comprehensive tests covering all SSE reconnection scenarios**

## Key Testing Patterns

### Mocking EventSource

The test setup includes a sophisticated EventSource mock that simulates:
- Connection states (CONNECTING, OPEN, CLOSED)
- Opening connections
- Receiving messages
- Error conditions
- Multiple instances

Example:
```typescript
const instance = eventSourceInstances[0];
instance.simulateOpen();    // Simulate successful connection
instance.simulateMessage(data); // Simulate incoming message
instance.simulateError();   // Simulate connection error
```

### Testing Timing with Fake Timers

Tests use Vitest's fake timers to control time-based behavior:

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// In tests:
await vi.advanceTimersByTimeAsync(1000); // Advance time by 1 second
```

This allows testing exponential backoff timing without waiting for real delays.

### Testing React Query Cache Updates

Tests verify that the hook properly updates React Query cache:

```typescript
// Pre-populate cache
queryClient.setQueryData(taskKeys.inspect(taskId), initialData);

// Trigger hook action
instance.simulateMessage(JSON.stringify(newData));

// Verify cache update
await waitFor(() => {
  const cachedData = queryClient.getQueryData(taskKeys.inspect(taskId));
  expect(cachedData?.currentIterationStatus).toEqual(newData);
});
```

## Configuration

### vitest.config.ts

The Vitest configuration includes:

```typescript
{
  environment: 'jsdom',        // Browser-like environment
  globals: true,               // Global test functions (describe, it, etc.)
  setupFiles: ['./test/setup.ts'], // Setup file
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [/* build artifacts, config files */]
  }
}
```

### test/setup.ts

Global setup includes:
- `@testing-library/jest-dom` matchers
- Automatic cleanup after each test
- EventSource mock for SSE testing

### test/test-utils.tsx

Provides reusable testing utilities:
- `createTestQueryClient()` - Creates a QueryClient configured for testing
- `createWrapper()` - Wraps components with QueryClientProvider
- `renderWithProviders()` - Renders components with all necessary providers

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on other tests
2. **Use Fake Timers**: For testing time-based behavior (delays, timeouts)
3. **Mock External Dependencies**: Mock APIs, EventSource, etc.
4. **Test Real Logic**: Don't mock the code you're testing, only its dependencies
5. **Wait for Async Updates**: Use `waitFor` for async state changes
6. **Clean Up**: Ensure proper cleanup in afterEach hooks
7. **Descriptive Names**: Test names should clearly describe what they test
8. **Test Edge Cases**: Include error conditions and boundary cases

## Troubleshooting

### Tests Hanging

If tests hang indefinitely:
- Check for missing `await` on async operations
- Ensure fake timers are advanced when testing delays
- Verify cleanup functions are called

### Timing Issues

If tests fail intermittently:
- Use `waitFor` instead of fixed delays
- Increase timeout for `waitFor` if needed: `waitFor(() => {...}, { timeout: 5000 })`
- Check if fake timers are properly configured

### Memory Leaks

If you see warnings about memory leaks:
- Ensure cleanup functions close all connections
- Clear all timers in afterEach
- Unmount components properly

## Next Steps

To add more tests:

1. Create a `__tests__` directory next to the code you want to test
2. Create a `.test.ts` or `.test.tsx` file
3. Import testing utilities from `@/test/test-utils`
4. Write tests following the patterns in `useTaskStream.test.ts`
5. Run tests with `npm test` or `npm run test:watch`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest UI](https://vitest.dev/guide/ui.html)
