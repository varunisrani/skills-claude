"""
CodeActAgent using Claude Agent SDK

This is the Claude SDK-based version of CodeActAgent. It maintains the same
external interface as the legacy CodeActAgent but delegates execution to
Claude Agent SDK instead of using LiteLLM.

Key differences from legacy CodeActAgent:
- Uses ClaudeSDKAdapter instead of self.llm.completion()
- Delegates agent loop to Claude SDK
- Simpler implementation (~200 LOC vs ~1500 LOC)
- Better tool handling via Claude Code
- Built-in prompt caching and optimization

The agent maintains backward compatibility with the Agent base class, so it can
be used as a drop-in replacement in existing OpenHands workflows.
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
from openhands.utils.prompt import PromptManager

# Import MCP servers
try:
    from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server
    from openhands.mcp_servers.browser_mcp import create_browser_mcp_server
    MCP_AVAILABLE = True
except ImportError:
    logger.warning("MCP servers not available, some features will be disabled")
    MCP_AVAILABLE = False


class CodeActAgentSDK(Agent):
    """
    CodeActAgent implementation using Claude Agent SDK.

    This agent implements the CodeAct paradigm (arxiv.org/abs/2402.01030) using
    Claude Agent SDK for execution. It consolidates agent actions into a unified
    code action space for simplicity and performance.

    The agent can:
    1. Converse: Communicate with humans in natural language
    2. CodeAct: Execute code
       - Execute any valid Linux bash command
       - Execute any valid Python code with an interactive Python interpreter

    This implementation delegates the agent loop to Claude SDK, resulting in:
    - Simpler codebase (~200 LOC vs ~1500 LOC)
    - Better performance (built-in optimizations)
    - Native tool integration
    - Automatic prompt caching
    """

    VERSION = '3.0-SDK'

    sandbox_plugins: list[PluginRequirement] = [
        AgentSkillsRequirement(),
        JupyterRequirement(),
    ]

    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry) -> None:
        """
        Initialize CodeActAgent with Claude SDK.

        Args:
            config: Agent configuration
            llm_registry: LLM registry (kept for compatibility but not used)
        """
        super().__init__(config, llm_registry)

        logger.info("Initializing CodeActAgentSDK")

        # Create adapter configuration
        self.adapter_config = self._create_adapter_config()

        # Create Claude SDK adapter
        self.adapter = ClaudeSDKAdapter(self.adapter_config)

        # Initialize adapter asynchronously
        self._initialize_adapter()

        logger.info("CodeActAgentSDK initialized")

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

        Returns:
            ClaudeSDKAdapterConfig for the adapter
        """
        # Define allowed tools based on config
        allowed_tools = ["Read", "Grep", "Glob"]

        if self.config.enable_cmd:
            allowed_tools.append("Bash")

        if self.config.enable_editor or self.config.enable_llm_editor:
            allowed_tools.extend(["Write", "Edit"])

        # Prepare MCP servers
        mcp_servers = {}

        if MCP_AVAILABLE:
            if self.config.enable_jupyter:
                mcp_servers["jupyter"] = create_jupyter_mcp_server()
                # Add Jupyter MCP tools
                allowed_tools.extend([
                    "mcp__jupyter__execute_python",
                    "mcp__jupyter__kernel_info",
                    "mcp__jupyter__reset_kernel"
                ])

            if self.config.enable_browsing:
                mcp_servers["browser"] = create_browser_mcp_server()
                # Add Browser MCP tools
                allowed_tools.extend([
                    "mcp__browser__navigate",
                    "mcp__browser__interact",
                    "mcp__browser__extract_content",
                    "mcp__browser__screenshot",
                    "mcp__browser__get_page_info"
                ])

        # Load system prompt
        system_prompt = self._load_system_prompt()

        # Create adapter config
        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="codeact",
            allowed_tools=allowed_tools,
            system_prompt=system_prompt,
            mcp_servers=mcp_servers,
            permission_mode="acceptEdits",  # Auto-accept edits for code agent
            max_turns=50,
            model=self.llm.config.model if self.llm else "claude-sonnet-4-5-20250929",
            workspace_base=self.config.workspace_base
        )

        logger.info(f"Created adapter config with {len(allowed_tools)} tools")
        logger.debug(f"Allowed tools: {allowed_tools}")

        return adapter_config

    def _load_system_prompt(self) -> str:
        """
        Load system prompt for the agent.

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

        # Fallback to a default prompt
        default_prompt = """You are a highly skilled software engineer with expertise in code analysis, implementation, debugging, and testing.

Your capabilities:
- Read and analyze code using Read, Grep, Glob tools
- Write and edit files using Write and Edit tools
- Execute bash commands using Bash tool
- Run Python code using Jupyter MCP tools
- Browse web pages using Browser MCP tools

Your approach:
1. Understand the task thoroughly
2. Analyze the codebase to understand context
3. Plan your implementation
4. Execute changes carefully
5. Test your changes
6. Verify everything works

Always think step-by-step and explain your reasoning.
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
        logger.debug("CodeActAgentSDK reset")

    def step(self, state: State) -> 'Action':
        """
        Execute one step using Claude SDK.

        This method maintains the same interface as the legacy CodeActAgent but
        delegates execution to Claude SDK via the adapter.

        Args:
            state: Current OpenHands state

        Returns:
            Action to execute

        The method:
        1. Checks for exit command
        2. Converts state to prompt
        3. Queries Claude SDK via adapter
        4. Converts response to action
        5. Returns action
        """
        logger.debug("CodeActAgentSDK step() called")

        # Check for exit command
        latest_user_message = state.get_last_user_message()
        if latest_user_message and latest_user_message.content.strip() == '/exit':
            logger.info("Exit command detected")
            return AgentFinishAction()

        # Check if we have a task to work on
        if not state.history:
            logger.warning("No history in state")
            return MessageAction(
                content="No task provided. Please provide a task to work on.",
                wait_for_response=True
            )

        try:
            # Execute step via adapter
            # The adapter handles:
            # - Converting state to prompt
            # - Querying Claude SDK
            # - Converting response to action
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
        except Exception as e:
            logger.error(f"Error cleaning up adapter: {e}")
