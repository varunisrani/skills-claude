/**
 * RoverCLI - Secure executor for Rover CLI commands
 *
 * This class provides a secure interface to execute Rover CLI commands from the Next.js frontend.
 * Key security features:
 * - Uses spawn() instead of exec() to prevent command injection
 * - No shell interpolation
 * - Input validation with Zod schemas
 * - Proper argument escaping
 * - Structured error handling
 * - Error message sanitization
 *
 * @example
 * const cli = new RoverCLI();
 * const result = await cli.listTasks();
 * if (result.success) {
 *   console.log(result.data);
 * }
 */

import { spawn, type ChildProcess } from 'child_process';
import { z } from 'zod';
import type {
  CommandResult,
  TaskDescription,
  CreateTaskInput,
  IterateTaskInput,
  MergeTaskInput,
  PushTaskInput,
  Workflow,
} from '@/types/rover';
import {
  CreateTaskInputSchema,
  IterateTaskInputSchema,
  MergeTaskInputSchema,
  PushTaskInputSchema,
  TaskDescriptionSchema,
} from '@/types/rover';

/**
 * Configuration options for RoverCLI
 */
export interface RoverCLIOptions {
  /** Path to the rover CLI executable (defaults to 'rover') */
  roverPath?: string;
  /** Working directory for command execution */
  cwd?: string;
  /** Timeout in milliseconds (defaults to 5 minutes) */
  timeout?: number;
  /** Environment variables to pass to the CLI */
  env?: NodeJS.ProcessEnv;
}

/**
 * Options for executing a command
 */
interface ExecuteOptions {
  /** Command timeout in milliseconds */
  timeout?: number;
  /** Parse stdout as JSON */
  parseJson?: boolean;
  /** Validation schema for JSON output */
  schema?: z.ZodSchema;
}

/**
 * RoverCLI executor class
 * Provides secure, type-safe access to Rover CLI commands
 */
export class RoverCLI {
  private readonly roverPath: string;
  private readonly cwd: string;
  private readonly timeout: number;
  private readonly env: NodeJS.ProcessEnv;

  constructor(options: RoverCLIOptions = {}) {
    this.roverPath = options.roverPath || 'rover';
    this.cwd = options.cwd || process.cwd();
    this.timeout = options.timeout || 5 * 60 * 1000; // 5 minutes default
    this.env = { ...process.env, ...options.env };
  }

  /**
   * Execute a rover CLI command with security measures
   *
   * Security features:
   * - Uses spawn() to prevent shell injection
   * - No shell interpolation or string concatenation
   * - Proper timeout handling
   * - Captures and sanitizes errors
   *
   * @param command - The rover subcommand (e.g., 'list', 'task', 'inspect')
   * @param args - Array of arguments to pass to the command
   * @param options - Execution options
   * @returns Promise with structured command result
   */
  async execute<T = unknown>(
    command: string,
    args: string[] = [],
    options: ExecuteOptions = {}
  ): Promise<CommandResult<T>> {
    // Validate command is not empty
    if (!command || command.trim() === '') {
      return {
        success: false,
        error: 'Command cannot be empty',
      };
    }

    // Validate no shell metacharacters in command
    if (this.containsShellMetacharacters(command)) {
      return {
        success: false,
        error: 'Invalid command: contains shell metacharacters',
      };
    }

    // Build full command arguments
    const fullArgs = [command, ...args];

    return new Promise((resolve) => {
      const timeoutMs = options.timeout || this.timeout;
      let stdout = '';
      let stderr = '';
      let timeoutHandle: NodeJS.Timeout | null = null;
      let killed = false;

      // Spawn the process (NOT exec - this prevents command injection)
      const child: ChildProcess = spawn(this.roverPath, fullArgs, {
        cwd: this.cwd,
        env: this.env,
        // IMPORTANT: shell: false prevents command injection
        shell: false,
        // Capture output
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');

        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeoutMs);

      // Capture stdout
      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
      }

      // Capture stderr
      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      // Handle process completion
      child.on('close', (exitCode: number | null) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        // Handle timeout
        if (killed) {
          resolve({
            success: false,
            error: `Command timed out after ${timeoutMs}ms`,
            exitCode: exitCode || -1,
            stdout,
            stderr,
          });
          return;
        }

        // Handle non-zero exit code
        if (exitCode !== 0) {
          resolve({
            success: false,
            error: this.sanitizeError(stderr || stdout || 'Command failed'),
            exitCode: exitCode || -1,
            stdout,
            stderr,
          });
          return;
        }

        // Parse JSON output if requested
        if (options.parseJson) {
          try {
            const data = JSON.parse(stdout);

            // Validate with schema if provided
            if (options.schema) {
              const validated = options.schema.parse(data);
              resolve({
                success: true,
                data: validated as T,
                stdout,
                stderr,
                exitCode: 0,
              });
            } else {
              resolve({
                success: true,
                data: data as T,
                stdout,
                stderr,
                exitCode: 0,
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: `Failed to parse JSON output: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
              stdout,
              stderr,
              exitCode: exitCode || 0,
            });
          }
          return;
        }

        // Return raw output
        resolve({
          success: true,
          data: stdout as T,
          stdout,
          stderr,
          exitCode: 0,
        });
      });

      // Handle process errors
      child.on('error', (error: Error) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        resolve({
          success: false,
          error: this.sanitizeError(error.message),
          stdout,
          stderr,
        });
      });
    });
  }

  /**
   * Check if a string contains shell metacharacters
   * This helps prevent command injection attempts
   */
  private containsShellMetacharacters(str: string): boolean {
    // Check for common shell metacharacters that could be used for injection
    const dangerousChars = /[;&|`$()<>]/;
    return dangerousChars.test(str);
  }

  /**
   * Sanitize error messages before exposing to client
   * Removes potentially sensitive information like file paths
   */
  private sanitizeError(error: string): string {
    // Log full error server-side for debugging
    console.error('[RoverCLI] Error:', error);

    // Remove absolute file paths
    let sanitized = error.replace(/\/[\w\-./]+/g, '<path>');

    // Remove UUIDs
    sanitized = sanitized.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '<uuid>'
    );

    // Truncate if too long
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 497) + '...';
    }

    return sanitized;
  }

  // ============================================================================
  // High-level Command Methods
  // ============================================================================

  /**
   * Initialize a Rover project
   * Executes: rover init [--yes]
   */
  async init(yes = false): Promise<CommandResult<void>> {
    const args = yes ? ['--yes'] : [];
    return this.execute('init', args);
  }

  /**
   * List all tasks
   * Executes: rover list --json
   */
  async listTasks(): Promise<CommandResult<TaskDescription[]>> {
    const result = await this.execute<TaskDescription[]>('list', ['--json'], {
      parseJson: true,
      schema: z.array(TaskDescriptionSchema),
    });

    return result;
  }

  /**
   * Create a new task
   * Executes: rover task [options] "description"
   *
   * @param input - Task creation parameters (validated with Zod)
   */
  async createTask(input: CreateTaskInput): Promise<CommandResult<TaskDescription>> {
    // Validate input
    try {
      CreateTaskInputSchema.parse(input);
    } catch (validationError) {
      return {
        success: false,
        error: validationError instanceof z.ZodError
          ? validationError.errors.map(e => e.message).join(', ')
          : 'Validation failed',
      };
    }

    const args: string[] = [];

    // Add workflow option
    if (input.workflow) {
      args.push('--workflow', input.workflow);
    }

    // Add agent option
    if (input.agent) {
      args.push('--agent', input.agent);
    }

    // Add source branch option
    if (input.sourceBranch) {
      args.push('--source-branch', input.sourceBranch);
    }

    // Add target branch option
    if (input.targetBranch) {
      args.push('--target-branch', input.targetBranch);
    }

    // Add GitHub issue option
    if (input.fromGithub) {
      args.push('--from-github', input.fromGithub);
    }

    // Add yes flag
    if (input.yes) {
      args.push('--yes');
    }

    // Add JSON output flag
    args.push('--json');

    // Add description as the last argument
    args.push(input.description);

    return this.execute<TaskDescription>('task', args, {
      parseJson: true,
      schema: TaskDescriptionSchema,
      timeout: 10 * 60 * 1000, // 10 minutes for task creation
    });
  }

  /**
   * Get detailed information about a task
   * Executes: rover inspect <id> --json
   */
  async inspectTask(taskId: number): Promise<CommandResult<TaskDescription>> {
    return this.execute<TaskDescription>('inspect', [taskId.toString(), '--json'], {
      parseJson: true,
      schema: TaskDescriptionSchema,
    });
  }

  /**
   * Get logs for a task
   * Executes: rover logs <id> [--iteration <n>]
   */
  async getLogs(taskId: number, iteration?: number): Promise<CommandResult<string>> {
    const args = [taskId.toString()];

    if (iteration !== undefined) {
      args.push('--iteration', iteration.toString());
    }

    return this.execute<string>('logs', args);
  }

  /**
   * Add iteration instructions to a task
   * Executes: rover iterate <id> "instructions"
   *
   * @param input - Iteration parameters (validated with Zod)
   */
  async iterateTask(input: IterateTaskInput): Promise<CommandResult<void>> {
    // Validate input
    try {
      IterateTaskInputSchema.parse(input);
    } catch (validationError) {
      return {
        success: false,
        error: validationError instanceof z.ZodError
          ? validationError.errors.map(e => e.message).join(', ')
          : 'Validation failed',
      };
    }

    const args = [input.taskId.toString(), input.instructions];

    return this.execute('iterate', args, {
      timeout: 10 * 60 * 1000, // 10 minutes for iteration
    });
  }

  /**
   * Restart a task
   * Executes: rover restart <id>
   */
  async restartTask(taskId: number): Promise<CommandResult<void>> {
    return this.execute('restart', [taskId.toString()], {
      timeout: 10 * 60 * 1000, // 10 minutes for restart
    });
  }

  /**
   * Stop a task
   * Executes: rover stop <id> [--remove-all]
   */
  async stopTask(taskId: number, removeAll = false): Promise<CommandResult<void>> {
    const args = [taskId.toString()];

    if (removeAll) {
      args.push('--remove-all');
    }

    return this.execute('stop', args);
  }

  /**
   * Delete a task
   * Executes: rover delete <id>
   */
  async deleteTask(taskId: number): Promise<CommandResult<void>> {
    return this.execute('delete', [taskId.toString()]);
  }

  /**
   * Get git diff for a task
   * Executes: rover diff <id> [--branch <branch>]
   */
  async getDiff(taskId: number, branch?: string): Promise<CommandResult<string>> {
    const args = [taskId.toString()];

    if (branch) {
      args.push('--branch', branch);
    }

    return this.execute<string>('diff', args);
  }

  /**
   * Merge task changes
   * Executes: rover merge <id> [--force]
   *
   * @param input - Merge parameters (validated with Zod)
   */
  async mergeTask(input: MergeTaskInput): Promise<CommandResult<void>> {
    // Validate input
    try {
      MergeTaskInputSchema.parse(input);
    } catch (validationError) {
      return {
        success: false,
        error: validationError instanceof z.ZodError
          ? validationError.errors.map(e => e.message).join(', ')
          : 'Validation failed',
      };
    }

    const args = [input.taskId.toString()];

    if (input.force) {
      args.push('--force');
    }

    return this.execute('merge', args);
  }

  /**
   * Push task changes to GitHub
   * Executes: rover push <id> [--message "msg"]
   *
   * @param input - Push parameters (validated with Zod)
   */
  async pushTask(input: PushTaskInput): Promise<CommandResult<{ prUrl?: string }>> {
    // Validate input
    try {
      PushTaskInputSchema.parse(input);
    } catch (validationError) {
      return {
        success: false,
        error: validationError instanceof z.ZodError
          ? validationError.errors.map(e => e.message).join(', ')
          : 'Validation failed',
      };
    }

    const args = [input.taskId.toString()];

    if (input.message) {
      args.push('--message', input.message);
    }

    // Add JSON flag to get PR URL
    args.push('--json');

    return this.execute<{ prUrl?: string }>('push', args, {
      parseJson: true,
    });
  }

  /**
   * Get shell access command for a task
   * Executes: rover shell <id> [--container]
   */
  async getShellCommand(taskId: number, container = false): Promise<CommandResult<string>> {
    const args = [taskId.toString()];

    if (container) {
      args.push('--container');
    }

    return this.execute<string>('shell', args);
  }

  /**
   * List available workflows
   * Executes: rover workflows list --json
   */
  async listWorkflows(): Promise<CommandResult<Workflow[]>> {
    return this.execute<Workflow[]>('workflows', ['list', '--json'], {
      parseJson: true,
    });
  }

  /**
   * Get details about a specific workflow
   * Executes: rover workflows inspect <name> --json
   */
  async inspectWorkflow(name: string): Promise<CommandResult<Workflow>> {
    return this.execute<Workflow>('workflows', ['inspect', name, '--json'], {
      parseJson: true,
    });
  }

  /**
   * Get Rover configuration
   * Executes: rover config --json
   */
  async getConfig(): Promise<CommandResult<{
    version: string;
    languages: string[];
    packageManagers: string[];
    mcps: Array<{ name: string; enabled: boolean }>;
  }>> {
    return this.execute('config', ['--json'], {
      parseJson: true,
    });
  }
}

/**
 * Singleton instance for convenience
 * Can be used across API routes
 */
let roverCLIInstance: RoverCLI | null = null;

/**
 * Get or create a singleton RoverCLI instance
 *
 * @param options - Optional configuration for the CLI instance
 * @returns The singleton RoverCLI instance
 */
export function getRoverCLI(options?: RoverCLIOptions): RoverCLI {
  if (!roverCLIInstance) {
    roverCLIInstance = new RoverCLI(options);
  }
  return roverCLIInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetRoverCLI(): void {
  roverCLIInstance = null;
}
