import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TaskDescriptionManager, TaskStatus } from '../index.js';

describe('TaskDescriptionManager', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create temp directory
    testDir = mkdtempSync(join(tmpdir(), 'rover-description-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    // Clean up temp directory
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('agent and sourceBranch fields', () => {
    it('should store agent and sourceBranch when creating task', () => {
      const task = TaskDescriptionManager.create({
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        agent: 'claude',
        sourceBranch: 'main',
        inputs: new Map(),
        workflowName: 'swe',
      });

      expect(task.agent).toBe('claude');
      expect(task.sourceBranch).toBe('main');

      // Verify persistence
      const reloaded = TaskDescriptionManager.load(1);
      expect(reloaded.agent).toBe('claude');
      expect(reloaded.sourceBranch).toBe('main');
    });

    it('should handle tasks without agent and sourceBranch fields', () => {
      const task = TaskDescriptionManager.create({
        id: 2,
        title: 'Test Task',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      expect(task.agent).toBeUndefined();
      expect(task.sourceBranch).toBeUndefined();
    });
  });

  describe('new status types', () => {
    it('should support MERGED status', () => {
      const task = TaskDescriptionManager.create({
        id: 1,
        title: 'Test Task',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      task.markMerged();

      expect(task.status).toBe('MERGED');
      expect(task.isMerged()).toBe(true);
      expect(task.completedAt).toBeDefined();
    });

    it('should support PUSHED status', () => {
      const task = TaskDescriptionManager.create({
        id: 2,
        title: 'Test Task',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      task.markPushed();

      expect(task.status).toBe('PUSHED');
      expect(task.isPushed()).toBe(true);
      expect(task.completedAt).toBeDefined();
    });

    it('should support resetting to NEW status', () => {
      const task = TaskDescriptionManager.create({
        id: 3,
        title: 'Test Task',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      // Mark as in progress first
      task.markInProgress();
      expect(task.status).toBe('IN_PROGRESS');

      // Reset to NEW
      task.resetToNew();
      expect(task.status).toBe('NEW');
      expect(task.isNew()).toBe(true);
    });

    it('should handle MERGED and PUSHED in status validation', () => {
      const task = TaskDescriptionManager.create({
        id: 4,
        title: 'Test Task',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      // Test all new status types
      const newStatuses: TaskStatus[] = ['MERGED', 'PUSHED'];

      for (const status of newStatuses) {
        task.setStatus(status);
        expect(task.status).toBe(status);

        // Should not throw validation errors
        expect(() => task.save()).not.toThrow();
      }
    });

    it('should not set completedAt when marking as MERGED', () => {
      const task = TaskDescriptionManager.create({
        id: 5,
        title: 'Test Task',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      task.markCompleted();
      const beforeTime = task.completedAt;

      // Marking as merged should not change `completedAt` timestamp; the task was already complete
      task.markMerged();
      expect(task.completedAt!).toEqual(beforeTime);
    });
  });

  it('should not set completedAt when marking as PUSHED', () => {
    const task = TaskDescriptionManager.create({
      id: 5,
      title: 'Test Task',
      description: 'Test description',
      inputs: new Map(),
      workflowName: 'swe',
    });

    task.markCompleted();
    task.markMerged();
    const beforeTime = task.completedAt;

    // Marking as pushed should not change `completedAt` timestamp; the task was already complete
    task.markPushed();
    expect(task.completedAt!).toEqual(beforeTime);
  });

  describe('status migration', () => {
    it('should migrate old status values to new enum including MERGED and PUSHED', () => {
      // Test the static migration method indirectly by loading tasks with old data
      const task = TaskDescriptionManager.create({
        id: 6,
        title: 'Migration Test',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      // Test MERGED migration
      task.setStatus('MERGED' as TaskStatus);
      task.save();

      const reloadedTask = TaskDescriptionManager.load(6);
      expect(reloadedTask.status).toBe('MERGED');
      expect(reloadedTask.isMerged()).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should provide correct utility methods for new statuses', () => {
      const task = TaskDescriptionManager.create({
        id: 7,
        title: 'Utility Test',
        description: 'Test description',
        inputs: new Map(),
        workflowName: 'swe',
      });

      // Test NEW status
      expect(task.isNew()).toBe(true);
      expect(task.isMerged()).toBe(false);
      expect(task.isPushed()).toBe(false);

      // Test MERGED status
      task.markMerged();
      expect(task.isNew()).toBe(false);
      expect(task.isMerged()).toBe(true);
      expect(task.isPushed()).toBe(false);
      expect(task.isCompleted()).toBe(false); // MERGED is different from COMPLETED

      // Reset and test PUSHED status
      task.resetToNew();
      task.markPushed();
      expect(task.isNew()).toBe(false);
      expect(task.isMerged()).toBe(false);
      expect(task.isPushed()).toBe(true);
      expect(task.isCompleted()).toBe(false); // PUSHED is different from COMPLETED
    });
  });

  describe('task creation validation', () => {
    it('should create task with all required fields initialized correctly', () => {
      const inputsMap = new Map([['key1', 'value1'], ['key2', 'value2']]);
      const task = TaskDescriptionManager.create({
        id: 10,
        title: 'Validation Test Task',
        description: 'Task for testing validation',
        inputs: inputsMap,
        workflowName: 'swe',
        agent: 'test-agent',
        sourceBranch: 'feature/test',
      });

      // Verify core identity fields
      expect(task.id).toBe(10);
      expect(task.title).toBe('Validation Test Task');
      expect(task.description).toBe('Task for testing validation');
      expect(task.uuid).toBeDefined();
      expect(typeof task.uuid).toBe('string');

      // Verify status and timestamps
      expect(task.status).toBe('NEW');
      expect(task.createdAt).toBeDefined();
      expect(task.startedAt).toBeDefined();
      expect(task.completedAt).toBeUndefined();

      // Verify execution context
      expect(task.iterations).toBe(1);
      expect(task.workflowName).toBe('swe');
      expect(task.agent).toBe('test-agent');
      expect(task.sourceBranch).toBe('feature/test');

      // Verify inputs are stored
      expect(task.inputs).toEqual(Object.fromEntries(inputsMap));
    });
  });

  describe('task loading from disk', () => {
    it('should load task from disk and retrieve stored data accurately', () => {
      // Create and save a task
      const task = TaskDescriptionManager.create({
        id: 11,
        title: 'Load Test Task',
        description: 'Task for testing load functionality',
        inputs: new Map([['input1', 'data1']]),
        workflowName: 'swe',
        agent: 'load-test-agent',
      });

      // Mark task with various statuses and modifications
      task.markInProgress();
      task.updateTitle('Updated Title');
      task.updateDescription('Updated description');

      // Load the task from disk
      const loadedTask = TaskDescriptionManager.load(11);

      // Verify all data persists correctly
      expect(loadedTask.id).toBe(11);
      expect(loadedTask.title).toBe('Updated Title');
      expect(loadedTask.description).toBe('Updated description');
      expect(loadedTask.status).toBe('IN_PROGRESS');
      expect(loadedTask.agent).toBe('load-test-agent');
      expect(loadedTask.inputs).toEqual({ input1: 'data1' });
      expect(loadedTask.uuid).toBe(task.uuid);
      expect(loadedTask.createdAt).toBe(task.createdAt);
    });
  });

  describe('task display properties', () => {
    it('should return correct values for all core display attributes', () => {
      const task = TaskDescriptionManager.create({
        id: 12,
        title: 'Display Test Task',
        description: 'Task for testing display properties',
        inputs: new Map([['key', 'value']]),
        workflowName: 'swe',
      });

      // Test core display properties
      expect(task.id).toBe(12);
      expect(task.title).toBe('Display Test Task');
      expect(task.description).toBe('Task for testing display properties');
      expect(task.status).toBe('NEW');

      // Test timestamp properties
      expect(task.createdAt).toBeDefined();
      expect(typeof task.createdAt).toBe('string');

      // Test optional properties before setting them
      expect(task.completedAt).toBeUndefined();
      expect(task.failedAt).toBeUndefined();

      // Update status and verify timestamp is set
      task.markCompleted();
      expect(task.status).toBe('COMPLETED');
      expect(task.completedAt).toBeDefined();
      expect(typeof task.completedAt).toBe('string');

      // Verify other properties remain accessible
      expect(task.workflowName).toBe('swe');
      expect(task.iterations).toBe(1);
      expect(task.version).toBeDefined();
    });
  });

  describe('task validation', () => {
    it('should pass validation for valid task data', () => {
      const task = TaskDescriptionManager.create({
        id: 13,
        title: 'Valid Task',
        description: 'A valid task for validation',
        inputs: new Map(),
        workflowName: 'swe',
      });

      // Should not throw any validation errors
      expect(() => task.save()).not.toThrow();

      // Reload and verify it still validates
      const reloaded = TaskDescriptionManager.load(13);
      expect(reloaded.status).toBe('NEW');
    });

    it('should fail validation for invalid status value', () => {
      const task = TaskDescriptionManager.create({
        id: 14,
        title: 'Test Task',
        description: 'Task for testing invalid status',
        inputs: new Map(),
        workflowName: 'swe',
      });

      // Manually corrupt the status field to test validation
      const invalidData = task.toJSON();
      (invalidData as any).status = 'INVALID_STATUS';

      // Creating a new instance with invalid data should throw
      expect(() => {
        new TaskDescriptionManager(
          invalidData as any,
          14
        );
      }).toThrow();
    });
  });
});
