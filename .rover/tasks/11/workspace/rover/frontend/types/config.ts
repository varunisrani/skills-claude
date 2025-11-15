/**
 * Configuration-related TypeScript type definitions for Rover Frontend
 *
 * These types match the Rover CLI data structures defined in:
 * - rover/packages/cli/src/lib/config.ts
 * - rover/packages/common/src/agent.ts
 */

/**
 * Supported programming languages
 */
export type Language =
  | 'javascript'
  | 'typescript'
  | 'php'
  | 'rust'
  | 'go'
  | 'python'
  | 'ruby';

/**
 * Supported package managers
 */
export type PackageManager =
  | 'pnpm'
  | 'npm'
  | 'yarn'
  | 'composer'  // PHP
  | 'cargo'     // Rust
  | 'gomod'     // Go
  | 'pip'       // Python
  | 'poetry'    // Python
  | 'uv'        // Python (modern)
  | 'rubygems'; // Ruby

/**
 * Supported task runners
 */
export type TaskManager =
  | 'just'
  | 'make'
  | 'task';

/**
 * Supported AI agents/providers
 */
export type AIAgent =
  | 'claude'
  | 'codex'
  | 'cursor'
  | 'gemini'
  | 'qwen';

/**
 * Model Context Protocol (MCP) configuration
 * Defines external tools/services available to AI agents
 */
export interface MCP {
  /** MCP server name */
  name: string;

  /** Command to start the MCP server or URL to connect to */
  commandOrUrl: string;

  /** Transport protocol (stdio, sse, etc.) */
  transport: string;

  /** Environment variables to pass to the MCP server */
  envs?: string[];

  /** HTTP headers for remote MCP servers */
  headers?: string[];
}

/**
 * Project configuration schema
 * Stored in rover.json at the project root
 */
export interface ProjectConfig {
  /** Schema version for migrations */
  version: string;

  /** Programming languages detected/used in the project */
  languages: Language[];

  /** Package managers available in the project */
  packageManagers: PackageManager[];

  /** Task managers available in the project */
  taskManagers: TaskManager[];

  /** Whether to show Rover attribution in generated content */
  attribution: boolean;

  /** MCP servers configured for this project */
  mcps: MCP[];

  /** Custom environment variables to set for all tasks */
  envs?: string[];

  /** Path to .env file for environment variables */
  envsFile?: string;
}

/**
 * User settings schema
 * Stored in .rover/settings.json (not committed to git)
 */
export interface UserSettings {
  /** Schema version for migrations */
  version: string;

  /** AI agents configured for this user */
  aiAgents: AIAgent[];

  /** User preferences and defaults */
  defaults: {
    /** Default AI agent to use for new tasks */
    aiAgent?: AIAgent;
  };
}

/**
 * Environment detection result
 * Contains auto-detected project configuration
 */
export interface EnvironmentDetection {
  /** Detected programming languages */
  languages: Language[];

  /** Detected package managers */
  packageManagers: PackageManager[];

  /** Detected task managers */
  taskManagers: TaskManager[];
}

/**
 * Project instructions for AI agents
 * Provides context about how to interact with the project
 */
export interface ProjectInstructions {
  /** How to run the development server */
  runDev: string;

  /** How to interact with the application */
  interaction: string;
}

/**
 * Rover configuration
 * Combined project and user settings
 */
export interface RoverConfig {
  /** Project-wide configuration */
  project: ProjectConfig;

  /** User-specific settings */
  user: UserSettings;
}

/**
 * Configuration validation result
 */
export interface ConfigValidation {
  /** Whether the configuration is valid */
  valid: boolean;

  /** Validation errors (if any) */
  errors: string[];

  /** Validation warnings (if any) */
  warnings: string[];
}

/**
 * MCP server status
 */
export interface MCPStatus {
  /** MCP server name */
  name: string;

  /** Whether the server is running */
  running: boolean;

  /** Error message if server failed to start */
  error?: string;

  /** List of available tools from this server */
  tools?: string[];
}
