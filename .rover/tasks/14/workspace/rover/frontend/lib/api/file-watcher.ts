/**
 * FileWatcher - Real-time file system monitoring for Rover tasks
 *
 * This service uses chokidar to watch .rover/tasks directory for changes
 * and emits events when task status files are updated.
 *
 * Key features:
 * - Singleton pattern for single watcher instance
 * - Event-driven architecture with EventEmitter
 * - Watches status.json files for task updates
 * - Detects file creation, modification, and deletion
 * - Debouncing to prevent excessive event firing
 * - Automatic cleanup and resource management
 * - Type-safe event handling
 *
 * @example
 * const watcher = getFileWatcher();
 * watcher.on('change', (event) => {
 *   console.log('Task updated:', event.taskId, event.type, event.data);
 * });
 */

import chokidar, { type FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { readFileSync } from 'fs';
import { join, basename, dirname } from 'path';
import type { IterationStatus } from '@/types/iteration';

/**
 * Event types emitted by the FileWatcher
 */
export type WatchEventType = 'change' | 'add' | 'unlink' | 'error';

/**
 * Event emitted when a task status file changes
 */
export interface WatchEvent {
  /** Type of file system event (change, add, unlink, error) */
  type: WatchEventType;

  /** Task ID (parsed from file path) */
  taskId: number;

  /** Iteration number (parsed from file path) */
  iteration: number;

  /** Parsed status.json content (only for 'add' and 'change' events) */
  data?: IterationStatus;

  /** File path that changed */
  filePath: string;

  /** Timestamp of the change */
  timestamp: string;

  /** Error message (only for 'error' events) */
  error?: string;
}

/**
 * FileWatcher service for monitoring Rover task files
 * Extends EventEmitter to provide event-driven architecture
 */
export class FileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private watchPath: string;
  private isWatching = false;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private debounceMs = 300; // 300ms debounce delay

  constructor(watchPath?: string) {
    super();
    // Default to .rover/tasks directory in current working directory
    this.watchPath = watchPath || join(process.cwd(), '.rover', 'tasks');
  }

  /**
   * Start watching for file changes
   * Initializes chokidar watcher and sets up event handlers
   */
  start(): void {
    if (this.isWatching) {
      console.warn('[FileWatcher] Already watching');
      return;
    }

    console.log('[FileWatcher] Starting file watcher:', this.watchPath);

    // Watch for status.json files in all task iterations
    // Pattern: .rover/tasks/*/iterations/*/status.json
    const pattern = join(this.watchPath, '*/iterations/*/status.json');

    this.watcher = chokidar.watch(pattern, {
      persistent: true,
      ignoreInitial: true, // Don't emit events for existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms for file writes to finish
        pollInterval: 50,
      },
    });

    // Handle file changes
    this.watcher.on('change', (filePath: string) => {
      this.handleFileChange('change', filePath);
    });

    // Handle file additions (new status.json files)
    this.watcher.on('add', (filePath: string) => {
      this.handleFileChange('add', filePath);
    });

    // Handle file deletions
    this.watcher.on('unlink', (filePath: string) => {
      this.handleFileChange('unlink', filePath);
    });

    // Handle watcher errors
    this.watcher.on('error', (error: Error) => {
      console.error('[FileWatcher] Watcher error:', error);
      this.emit('error', error);
    });

    // Handle watcher ready
    this.watcher.on('ready', () => {
      console.log('[FileWatcher] Watcher ready');
      this.isWatching = true;
      this.emit('ready');
    });
  }

  /**
   * Handle file change events with debouncing
   * Prevents excessive event firing when files are written multiple times in quick succession
   */
  private handleFileChange(type: WatchEventType, filePath: string): void {
    // Clear existing debounce timer for this path
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.processFileChange(type, filePath);
    }, this.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Process file change events
   * Parses the status.json file and emits a change event
   */
  private processFileChange(type: WatchEventType, filePath: string): void {
    try {
      // Parse task ID and iteration number from file path
      // Path format: .rover/tasks/:id/iterations/:n/status.json
      const pathParts = filePath.split('/');
      const tasksIndex = pathParts.findIndex((part) => part === 'tasks');

      if (tasksIndex === -1 || tasksIndex + 3 >= pathParts.length) {
        console.warn('[FileWatcher] Invalid file path format:', filePath);
        return;
      }

      const taskId = parseInt(pathParts[tasksIndex + 1], 10);
      const iteration = parseInt(pathParts[tasksIndex + 3], 10);

      if (isNaN(taskId) || isNaN(iteration)) {
        console.warn('[FileWatcher] Could not parse task ID or iteration from path:', filePath);
        return;
      }

      // Create base event
      const event: WatchEvent = {
        type,
        taskId,
        iteration,
        filePath,
        timestamp: new Date().toISOString(),
      };

      // For 'add' and 'change' events, read and parse the status.json file
      // For 'unlink' events, we can't read the file as it's been deleted
      if (type === 'add' || type === 'change') {
        try {
          const fileContent = readFileSync(filePath, 'utf-8');
          const data: IterationStatus = JSON.parse(fileContent);
          event.data = data;

          console.log('[FileWatcher] File changed:', {
            type,
            taskId,
            iteration,
            status: data.status,
            progress: data.progress,
          });
        } catch (readError) {
          console.error('[FileWatcher] Error reading status file:', readError);
          event.error = readError instanceof Error ? readError.message : 'Failed to read status file';
        }
      } else if (type === 'unlink') {
        console.log('[FileWatcher] File deleted:', {
          type,
          taskId,
          iteration,
        });
      }

      // Emit the watch event
      this.emit('change', event);

      // Also emit task-specific event for easier filtering
      // This allows listeners to subscribe to specific tasks: watcher.on('task:123', handler)
      this.emit(`task:${taskId}`, event);
    } catch (error) {
      console.error('[FileWatcher] Error processing file change:', error);
      this.emit('error', error);
    }
  }

  /**
   * Stop watching for file changes
   * Cleans up resources and closes the watcher
   */
  async stop(): Promise<void> {
    if (!this.isWatching) {
      console.warn('[FileWatcher] Not currently watching');
      return;
    }

    console.log('[FileWatcher] Stopping file watcher');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.isWatching = false;
    this.removeAllListeners();
  }

  /**
   * Check if the watcher is currently active
   */
  isActive(): boolean {
    return this.isWatching;
  }

  /**
   * Get the current watch path
   */
  getWatchPath(): string {
    return this.watchPath;
  }
}

/**
 * Singleton instance of FileWatcher
 * Ensures only one watcher is active across the application
 */
let fileWatcherInstance: FileWatcher | null = null;

/**
 * Get or create the FileWatcher singleton instance
 * Automatically starts the watcher if it's not already running
 *
 * @param watchPath - Optional custom path to watch (defaults to .rover/tasks)
 * @returns The FileWatcher singleton instance
 */
export function getFileWatcher(watchPath?: string): FileWatcher {
  if (!fileWatcherInstance) {
    fileWatcherInstance = new FileWatcher(watchPath);
    fileWatcherInstance.start();
  }

  return fileWatcherInstance;
}

/**
 * Reset the FileWatcher singleton (useful for testing)
 * Stops the existing watcher and creates a new one
 */
export async function resetFileWatcher(): Promise<void> {
  if (fileWatcherInstance) {
    await fileWatcherInstance.stop();
    fileWatcherInstance = null;
  }
}

/**
 * Type-safe event listener for FileWatcher
 * Ensures proper typing for event handlers
 */
export interface FileWatcherEventMap {
  change: (event: WatchEvent) => void;
  error: (error: Error) => void;
  ready: () => void;
}

// Extend the FileWatcher class to provide type-safe event methods
declare interface FileWatcher {
  on<K extends keyof FileWatcherEventMap>(
    event: K,
    listener: FileWatcherEventMap[K]
  ): this;

  off<K extends keyof FileWatcherEventMap>(
    event: K,
    listener: FileWatcherEventMap[K]
  ): this;

  emit<K extends keyof FileWatcherEventMap>(
    event: K,
    ...args: Parameters<FileWatcherEventMap[K]>
  ): boolean;
}
