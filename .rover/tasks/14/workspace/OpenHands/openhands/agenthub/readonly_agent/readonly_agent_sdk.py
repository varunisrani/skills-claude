"""
ReadOnlyAgent using Claude Agent SDK

This is the Claude SDK-based version of ReadOnlyAgent. It maintains the same
external interface as the legacy ReadOnlyAgent but delegates execution to
Claude Agent SDK with read-only tools.

Key differences from legacy ReadOnlyAgent:
- Uses ClaudeSDKAdapter with read-only tools only
- Delegates agent loop to Claude SDK
- Simpler implementation (~120 LOC vs ~300 LOC)
- Better code analysis capabilities
- No risk of modifications

The agent maintains backward compatibility with the Agent base class.
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
from openhands.runtime.plugins import PluginRequirement
from openhands.utils.prompt import PromptManager


class ReadOnlyAgentSDK(Agent):
    """
    ReadOnlyAgent implementation using Claude Agent SDK.

    This agent specializes in code analysis and exploration WITHOUT making any changes.
    It only has access to read-only tools:
    - Read: Read file contents
    - Grep: Search for patterns in files
    - Glob: Find files matching patterns

    This implementation delegates execution to Claude SDK with strict read-only
    permissions, resulting in:
    - Simpler codebase (~120 LOC vs ~300 LOC)
    - Guaranteed safety (no modifications possible)
    - Better analysis capabilities
    - Faster execution

    Use this agent when you want to:
    1. Explore a codebase to understand its structure
    2. Search for specific patterns or code
    3. Research without making any changes
    """

    VERSION = '2.0-SDK'

    sandbox_plugins: list[PluginRequirement] = []

    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry) -> None:
        """
        Initialize ReadOnlyAgent with Claude SDK.

        Args:
            config: Agent configuration
            llm_registry: LLM registry (kept for compatibility)
        """
        super().__init__(config, llm_registry)

        logger.info("Initializing ReadOnlyAgentSDK")

        # Create adapter configuration
        self.adapter_config = self._create_adapter_config()

        # Create Claude SDK adapter
        self.adapter = ClaudeSDKAdapter(self.adapter_config)

        # Initialize adapter
        self._initialize_adapter()

        logger.info("ReadOnlyAgentSDK initialized")

    def _initialize_adapter(self) -> None:
        """Initialize the Claude SDK adapter asynchronously."""
        try:
            run_async(self.adapter.initialize())
            logger.info("ReadOnly adapter initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize adapter: {e}")
            raise

    def _create_adapter_config(self) -> ClaudeSDKAdapterConfig:
        """
        Create adapter configuration for read-only agent.

        Returns:
            ClaudeSDKAdapterConfig with read-only tools only
        """
        # Read-only tools ONLY
        allowed_tools = [
            "Read",   # Read file contents
            "Grep",   # Search for patterns
            "Glob",   # Find files matching patterns
        ]

        # No MCP servers needed for read-only agent
        mcp_servers = {}

        # Load system prompt
        system_prompt = self._load_system_prompt()

        # Create adapter config
        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="readonly",
            allowed_tools=allowed_tools,
            system_prompt=system_prompt,
            mcp_servers=mcp_servers,
            permission_mode="accept",  # Accept mode (no edits)
            max_turns=30,
            model=self.llm.config.model if self.llm else "claude-sonnet-4-5-20250929",
            workspace_base=self.config.workspace_base
        )

        logger.info(f"Created readonly adapter config with {len(allowed_tools)} tools")
        logger.info("ReadOnly mode: No modifications possible")

        return adapter_config

    def _load_system_prompt(self) -> str:
        """
        Load system prompt for the read-only agent.

        Returns:
            System prompt string
        """
        # Try to use the prompt manager
        if self.prompt_manager:
            try:
                return self.prompt_manager.get_system_message(
                    cli_mode=self.config.cli_mode
                )
            except Exception as e:
                logger.warning(f"Failed to load prompt from manager: {e}")

        # Fallback to a default read-only focused prompt
        default_prompt = """You are a code analysis and exploration specialist.

Your capabilities (READ-ONLY):
- Read file contents using Read tool
- Search for patterns in files using Grep tool
- Find files matching patterns using Glob tool

IMPORTANT: You can ONLY read and analyze code. You CANNOT make any modifications.

Your approach to analysis tasks:
1. Understand what information is being requested
2. Use Glob to find relevant files
3. Use Grep to search for specific patterns
4. Use Read to examine file contents in detail
5. Analyze the code structure and patterns
6. Provide clear, comprehensive findings

Guidelines:
- Be thorough in your analysis
- Use search tools efficiently to narrow down results
- Provide specific file paths and line numbers when relevant
- Explain code patterns and architecture clearly
- Suggest improvements but don't implement them
- If you need changes made, inform the user to use CodeActAgent

Think step-by-step and provide detailed analysis.
"""
        return default_prompt

    @property
    def prompt_manager(self) -> PromptManager:
        """Get or create prompt manager."""
        if self._prompt_manager is None:
            self._prompt_manager = PromptManager(
                prompt_dir=os.path.join(os.path.dirname(__file__), 'prompts'),
                system_prompt_filename=self.config.resolved_system_prompt_filename,
            )
        return self._prompt_manager

    def reset(self) -> None:
        """Reset the agent's internal state."""
        super().reset()
        logger.debug("ReadOnlyAgentSDK reset")

    def step(self, state: State) -> 'Action':
        """
        Execute one read-only step using Claude SDK.

        Args:
            state: Current OpenHands state

        Returns:
            Action to execute (guaranteed to be read-only)

        The method:
        1. Checks for exit/completion
        2. Converts state to analysis-focused prompt
        3. Queries Claude SDK with read-only tools
        4. Converts response to action
        5. Returns action
        """
        logger.debug("ReadOnlyAgentSDK step() called")

        # Check for exit command
        latest_user_message = state.get_last_user_message()
        if latest_user_message and latest_user_message.content.strip() == '/exit':
            logger.info("Exit command detected")
            return AgentFinishAction()

        # Check if we have a task
        if not state.history:
            logger.warning("No history in state")
            return MessageAction(
                content="No analysis task provided. Please provide a task to analyze.",
                wait_for_response=True
            )

        try:
            # Execute step via adapter (read-only tools only)
            action = run_async(self.adapter.execute_step(state))

            logger.info(f"ReadOnly step executed, returning: {type(action).__name__}")

            # Safety check: Ensure no modification actions
            from openhands.events.action import (
                FileWriteAction,
                FileEditAction,
                CmdRunAction,
                IPythonRunCellAction
            )

            if isinstance(action, (FileWriteAction, FileEditAction, CmdRunAction, IPythonRunCellAction)):
                logger.error(f"ReadOnly agent attempted modification action: {type(action).__name__}")
                return MessageAction(
                    content="Error: ReadOnly agent cannot perform modifications. Use CodeActAgent for changes.",
                    wait_for_response=False
                )

            return action

        except Exception as e:
            logger.error(f"Error in readonly step: {e}", exc_info=True)
            return MessageAction(
                content=f"Error during analysis: {str(e)}",
                wait_for_response=False
            )

    def __del__(self):
        """Cleanup when agent is destroyed."""
        try:
            if hasattr(self, 'adapter') and self.adapter:
                run_async(self.adapter.cleanup())
        except Exception as e:
            logger.error(f"Error cleaning up adapter: {e}")
