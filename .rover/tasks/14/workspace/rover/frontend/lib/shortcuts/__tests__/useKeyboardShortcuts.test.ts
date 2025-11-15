/**
 * Tests for keyboard shortcuts hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, useKeyboardShortcut } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Mock navigator.platform for OS detection
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should register and trigger keyboard shortcuts', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          keys: ['mod+k'],
          callback,
          preventDefault: true,
        },
      ])
    );

    // Simulate Cmd+K on Mac
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcuts when typing in input', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          keys: ['k'],
          callback,
        },
      ])
    );

    // Create an input element and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Simulate 'k' key press in input
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      bubbles: true,
    });

    input.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should allow shortcuts in input when allowInInput is true', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          keys: ['escape'],
          callback,
          allowInInput: true,
        },
      ])
    );

    // Create an input element and focus it
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    // Simulate Escape key press in input
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    input.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('should handle multiple key combinations', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          keys: ['mod+k'],
          callback: callback1,
        },
        {
          keys: ['mod+n'],
          callback: callback2,
        },
      ])
    );

    // Simulate Cmd+K
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
    );

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    // Simulate Cmd+N
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true,
      })
    );

    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should respect enabled flag', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcuts([
        {
          keys: ['mod+k'],
          callback,
          enabled: false,
        },
      ])
    );

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
    );

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useKeyboardShortcut', () => {
  it('should register a single shortcut', () => {
    const callback = vi.fn();

    renderHook(() =>
      useKeyboardShortcut(['mod+k'], callback, { preventDefault: true })
    );

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
    );

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
