"""
LocAgent using Claude Agent SDK

This is the Claude SDK-based version of LocAgent. It maintains the same
external interface as the legacy LocAgent but delegates execution to
Claude Agent SDK instead of using LiteLLM.

Key differences from legacy LocAgent:
- Uses ClaudeSDKAdapter instead of self.llm.completion()
- Delegates agent loop to Claude SDK
- Simpler implementation (~200 LOC vs extending CodeActAgent)
- Better tool handling via Claude Code
- Built-in prompt caching and optimization
- Native integration with LOC-specific tools

The agent maintains backward compatibility with the Agent base class, so it can
be used as a drop-in replacement in existing OpenHands workflows.

LocAgent Framework:
Based on https://arxiv.org/abs/2503.09089, LocAgent addresses code localization
through graph-based representation. By parsing codebases into directed heterogeneous
graphs, LocAgent creates a lightweight representation that captures code structures
and their dependencies, enabling LLM agents to effectively search and locate relevant
entities through powerful multi-hop reasoning.

Built-in Tools:
1. search_code_snippets - Search codebase for relevant code snippets
2. get_entity_contents - Retrieve complete implementations of entities
3. explore_tree_structure - Traverse dependency graph around entities
"""

import os
import asyncio
from typing import TYPE_CHECKING

from openhands.llm.llm_registry import LLMRegistry

if TYPE_CHECKING:
    from openhands.events.action import Action

from openhands.agenthub.claude_sdk_adapter import (
    ClaudeSDKAdapter,
    ClaudeSDKAdapterConfig,
    run_async,
)
from openhands.controller.agent import Agent
from openhands.controller.state.state import State
from openhands.core.config import AgentConfig
from openhands.core.logger import openhands_logger as logger
from openhands.events.action import AgentFinishAction, MessageAction
from openhands.runtime.plugins import (
    AgentSkillsRequirement,
    JupyterRequirement,
    PluginRequirement,
)

# Import MCP servers
try:
    from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server
    MCP_AVAILABLE = True
except ImportError:
    logger.warning("Jupyter MCP server not available, LOC tools will be limited")
    MCP_AVAILABLE = False


class LocAgentSDK(Agent):
    """
    LocAgent implementation using Claude Agent SDK.

    This agent implements the LocAgent paradigm (arxiv.org/abs/2503.09089) using
    Claude Agent SDK for execution. It uses graph-based code representation to
    enable powerful code localization and multi-hop reasoning.

    The agent provides three specialized tools:
    1. search_code_snippets: Search for relevant code snippets by terms or line numbers
    2. get_entity_contents: Retrieve complete implementations of classes/functions/files
    3. explore_tree_structure: Traverse dependency graphs (upstream/downstream/both)

    This implementation delegates the agent loop to Claude SDK, resulting in:
    - Simpler codebase (~200 LOC vs extending CodeActAgent)
    - Better performance (built-in optimizations)
    - Native tool integration with LOC-specific capabilities
    - Automatic prompt caching
    """

    VERSION = '2.0-SDK'

    sandbox_plugins: list[PluginRequirement] = [
        AgentSkillsRequirement(),
        JupyterRequirement(),  # Required for LOC tools
    ]

    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry) -> None:
        """
        Initialize LocAgent with Claude SDK.

        Args:
            config: Agent configuration
            llm_registry: LLM registry (kept for compatibility but not used)
        """
        super().__init__(config, llm_registry)

        logger.info("Initializing LocAgentSDK")

        # Create adapter configuration
        self.adapter_config = self._create_adapter_config()

        # Create Claude SDK adapter
        self.adapter = ClaudeSDKAdapter(self.adapter_config)

        # Initialize adapter asynchronously
        self._initialize_adapter()

        logger.info("LocAgentSDK initialized with LOC-specific tools")

    def _initialize_adapter(self) -> None:
        """Initialize the Claude SDK adapter asynchronously."""
        try:
            run_async(self.adapter.initialize())
            logger.info("Claude SDK adapter initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Claude SDK adapter: {e}")
            raise

    def _create_adapter_config(self) -> ClaudeSDKAdapterConfig:
        """
        Create adapter configuration from agent config.

        This configures the Claude SDK adapter with:
        - Basic file operations (Read, Grep, Glob)
        - LOC-specific tools via Jupyter MCP
        - Proper system prompt for code localization

        Returns:
            ClaudeSDKAdapterConfig for the adapter
        """
        # Define allowed tools based on config
        # LocAgent primarily uses file reading and Jupyter for LOC tools
        allowed_tools = ["Read", "Grep", "Glob"]

        # Add optional command execution
        if self.config.enable_cmd:
            allowed_tools.append("Bash")

        # Add optional file editing
        if self.config.enable_editor or self.config.enable_llm_editor:
            allowed_tools.extend(["Write", "Edit"])

        # Prepare MCP servers
        mcp_servers = {}

        # Jupyter is REQUIRED for LOC tools (explore_tree_structure, search_code_snippets, get_entity_contents)
        if MCP_AVAILABLE:
            mcp_servers["jupyter"] = create_jupyter_mcp_server()
            # Add Jupyter MCP tools - these will be used to call LOC functions
            allowed_tools.extend([
                "mcp__jupyter__execute_python",
                "mcp__jupyter__kernel_info",
                "mcp__jupyter__reset_kernel"
            ])
            logger.info("Jupyter MCP server configured for LOC tools")
        else:
            logger.warning("Jupyter MCP not available - LOC tools will not function properly")

        # Load system prompt
        system_prompt = self._load_system_prompt()

        # Create adapter config
        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="loc",
            allowed_tools=allowed_tools,
            system_prompt=system_prompt,
            mcp_servers=mcp_servers,
            permission_mode="acceptEdits",  # Auto-accept edits
            max_turns=50,
            model=self.llm.config.model if self.llm else "claude-sonnet-4-5-20250929",
            workspace_base=self.config.workspace_base
        )

        logger.info(f"Created adapter config with {len(allowed_tools)} tools")
        logger.debug(f"Allowed tools: {allowed_tools}")

        return adapter_config

    def _load_system_prompt(self) -> str:
        """
        Load system prompt for the LocAgent.

        This creates a specialized prompt that explains:
        - The graph-based code representation
        - The three LOC-specific tools
        - Best practices for code localization
        - How to use multi-hop reasoning

        Returns:
            System prompt string optimized for code localization tasks
        """
        # LocAgent-specific system prompt
        loc_prompt = """You are a highly skilled software engineer specialized in code localization and analysis using graph-based representations.

## Your Capabilities

You have access to a powerful set of tools for navigating and understanding codebases through a pre-built code graph:

### 1. explore_tree_structure
Traverse the dependency graph to understand code structure and relationships.

**Usage:**
```python
# Explore downstream dependencies (what depends on this entity)
print(explore_tree_structure(
    start_entities=['src/module.py:ClassName'],
    direction='downstream',
    traversal_depth=2,
    dependency_type_filter=['invokes', 'imports']
))

# Explore upstream dependencies (what this entity depends on)
print(explore_tree_structure(
    start_entities=['src/module.py:ClassName'],
    direction='upstream',
    traversal_depth=2
))

# Explore repository structure from root
print(explore_tree_structure(
    start_entities=['/'],
    traversal_depth=2,
    dependency_type_filter=['contains']
))
```

**Entity ID Format:**
- Functions/Classes: `"file_path:QualifiedName"` (e.g., `"src/utils.py:Calculator.add"`)
- Files: `"src/module.py"`
- Directories: `"src/"`

**Direction Options:**
- `upstream`: Find what the entity depends on
- `downstream`: Find what depends on the entity
- `both`: Explore both directions

**Dependency Types:**
- `contains`: Directory/file containment
- `imports`: Import relationships
- `invokes`: Function/method calls
- `inherits`: Class inheritance

### 2. search_code_snippets
Search the codebase for relevant code snippets.

**Usage:**
```python
# Search by keywords
print(search_code_snippets(search_terms=["ClassName", "function_name"]))

# Search by line numbers in a specific file
print(search_code_snippets(
    line_nums=[10, 25, 50],
    file_path_or_pattern='src/example.py'
))

# Search with file pattern
print(search_code_snippets(
    search_terms=["keyword"],
    file_path_or_pattern='src/**/*.py'
))
```

### 3. get_entity_contents
Retrieve complete implementations of specific entities.

**Usage:**
```python
# Get function/class implementation
print(get_entity_contents(['src/utils.py:Calculator.add']))

# Get entire file contents
print(get_entity_contents(['src/utils.py']))

# Get multiple entities
print(get_entity_contents([
    'src/module_a.py:ClassA',
    'src/module_b.py:ClassB.method'
]))
```

## Code Graph Structure

The codebase is represented as a directed heterogeneous graph:

**Entity Types:**
- `directory`: Directory nodes
- `file`: Python/other source files
- `class`: Class definitions
- `function`: Function/method definitions

**Relationships:**
- `contains`: Hierarchical structure (dir → file → class → method)
- `imports`: Import dependencies
- `invokes`: Function/method invocations
- `inherits`: Class inheritance

## Your Approach

1. **Understand the Task**: Carefully read the user's request to determine what code needs to be located
2. **Start Broad**: Use `search_code_snippets` to find relevant areas of the codebase
3. **Explore Structure**: Use `explore_tree_structure` to understand dependencies and relationships
4. **Get Details**: Use `get_entity_contents` to retrieve specific implementations
5. **Multi-hop Reasoning**: Follow dependency chains to understand impact and relationships
6. **Verify**: Double-check your findings before presenting results

## Best Practices

- Use `explore_tree_structure` with `direction='both'` to get complete context
- Start with shallow `traversal_depth` (1-2) and go deeper if needed
- Use `dependency_type_filter` to focus on relevant relationships
- Combine multiple tools for comprehensive understanding
- Always provide entity IDs in the correct format: `"file_path:QualifiedName"`

## Standard Tools

You also have access to standard development tools:
- **Read**: Read file contents
- **Grep**: Search for patterns in files
- **Glob**: Find files matching patterns
- **Bash**: Execute shell commands (if enabled)
- **Write/Edit**: Modify files (if enabled)

Always think step-by-step and explain your reasoning as you navigate the codebase.
"""
        return loc_prompt

    def reset(self) -> None:
        """Reset the agent's internal state."""
        super().reset()
        logger.debug("LocAgentSDK reset")

    def step(self, state: State) -> 'Action':
        """
        Execute one step using Claude SDK.

        This method maintains the same interface as the legacy LocAgent but
        delegates execution to Claude SDK via the adapter.

        Args:
            state: Current OpenHands state

        Returns:
            Action to execute

        The method:
        1. Checks for exit command
        2. Converts state to prompt
        3. Queries Claude SDK via adapter
        4. Converts response to action (including LOC tool calls)
        5. Returns action
        """
        logger.debug("LocAgentSDK step() called")

        # Check for exit command
        latest_user_message = state.get_last_user_message()
        if latest_user_message and latest_user_message.content.strip() == '/exit':
            logger.info("Exit command detected")
            return AgentFinishAction()

        # Check if we have a task to work on
        if not state.history:
            logger.warning("No history in state")
            return MessageAction(
                content="No task provided. Please provide a code localization task to work on.",
                wait_for_response=True
            )

        try:
            # Execute step via adapter
            # The adapter handles:
            # - Converting state to prompt
            # - Querying Claude SDK
            # - Converting response to action
            # - Mapping LOC tool calls (explore_tree_structure, etc.) to IPythonRunCellAction
            action = run_async(self.adapter.execute_step(state))

            logger.info(f"Step executed, returning: {type(action).__name__}")
            return action

        except Exception as e:
            logger.error(f"Error in step execution: {e}", exc_info=True)
            return MessageAction(
                content=f"Error executing step: {str(e)}",
                wait_for_response=False
            )

    def __del__(self):
        """Cleanup when agent is destroyed."""
        try:
            if hasattr(self, 'adapter') and self.adapter:
                run_async(self.adapter.cleanup())
                logger.info("LocAgentSDK adapter cleaned up")
        except Exception as e:
            logger.error(f"Error cleaning up adapter: {e}")
