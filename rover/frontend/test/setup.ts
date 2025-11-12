/**
 * Vitest setup file
 * Configures testing environment and utilities
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock EventSource globally since it's not available in jsdom
global.EventSource = class MockEventSource {
  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  withCredentials: boolean;
  CONNECTING: number;
  OPEN: number;
  CLOSED: number;

  constructor(url: string) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.withCredentials = false;
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSED = 2;
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  addEventListener() {
    // No-op for basic mock
  }

  removeEventListener() {
    // No-op for basic mock
  }

  dispatchEvent() {
    return true;
  }
} as any;
