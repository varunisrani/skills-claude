"""
BrowsingAgent using Claude Agent SDK

This is the Claude SDK-based version of BrowsingAgent. It maintains the same
external interface as the legacy BrowsingAgent but delegates execution to
Claude Agent SDK with Browser MCP integration.

Key differences from legacy BrowsingAgent:
- Uses ClaudeSDKAdapter with Browser MCP instead of BrowserGym directly
- Delegates agent loop to Claude SDK
- Simpler implementation (~150 LOC vs ~600 LOC)
- Better browser interaction via MCP tools
- Native accessibility tree handling

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

# Import Browser MCP
try:
    from openhands.mcp_servers.browser_mcp import create_browser_mcp_server
    BROWSER_MCP_AVAILABLE = True
except ImportError:
    logger.warning("Browser MCP not available")
    BROWSER_MCP_AVAILABLE = False


class BrowsingAgentSDK(Agent):
    """
    BrowsingAgent implementation using Claude Agent SDK.

    This agent specializes in web browsing and interaction. It uses the Browser MCP
    server to:
    - Navigate to web pages
    - Extract page content
    - Interact with elements (click, type, select)
    - Take screenshots
    - Handle multiple browser pages

    This implementation delegates browser interaction to Claude SDK with Browser MCP,
    resulting in:
    - Simpler codebase (~150 LOC vs ~600 LOC)
    - Better accessibility tree handling
    - Native browser automation
    - Cleaner action space
    """

    VERSION = '2.0-SDK'

    sandbox_plugins: list[PluginRequirement] = []

    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry) -> None:
        """
        Initialize BrowsingAgent with Claude SDK.

        Args:
            config: Agent configuration
            llm_registry: LLM registry (kept for compatibility)
        """
        super().__init__(config, llm_registry)

        logger.info("Initializing BrowsingAgentSDK")

        if not BROWSER_MCP_AVAILABLE:
            raise RuntimeError(
                "Browser MCP not available. Please install: pip install playwright && playwright install chromium"
            )

        # Create adapter configuration
        self.adapter_config = self._create_adapter_config()

        # Create Claude SDK adapter
        self.adapter = ClaudeSDKAdapter(self.adapter_config)

        # Initialize adapter
        self._initialize_adapter()

        logger.info("BrowsingAgentSDK initialized")

    def _initialize_adapter(self) -> None:
        """Initialize the Claude SDK adapter asynchronously."""
        try:
            run_async(self.adapter.initialize())
            logger.info("Browser MCP adapter initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize adapter: {e}")
            raise

    def _create_adapter_config(self) -> ClaudeSDKAdapterConfig:
        """
        Create adapter configuration for browsing agent.

        Returns:
            ClaudeSDKAdapterConfig for the adapter
        """
        # Browser-specific tools
        allowed_tools = [
            "Read",  # For reading local files
            "mcp__browser__navigate",
            "mcp__browser__interact",
            "mcp__browser__extract_content",
            "mcp__browser__screenshot",
            "mcp__browser__get_page_info"
        ]

        # Create Browser MCP server
        mcp_servers = {
            "browser": create_browser_mcp_server()
        }

        # Load system prompt
        system_prompt = self._load_system_prompt()

        # Create adapter config
        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="browsing",
            allowed_tools=allowed_tools,
            system_prompt=system_prompt,
            mcp_servers=mcp_servers,
            permission_mode="accept",  # Just accept, no edits needed
            max_turns=40,
            model=self.llm.config.model if self.llm else "claude-sonnet-4-5-20250929",
            workspace_base=self.config.workspace_base
        )

        logger.info(f"Created browsing adapter config with {len(allowed_tools)} tools")

        return adapter_config

    def _load_system_prompt(self) -> str:
        """
        Load system prompt for the browsing agent.

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

        # Fallback to a default browsing-focused prompt
        default_prompt = """You are a web browsing and interaction specialist.

Your capabilities:
- Navigate to web pages using navigate tool
- Extract page content and structure
- Interact with page elements (click, type, select)
- Take screenshots of pages
- Get detailed page information

Your approach to web tasks:
1. Navigate to the target URL
2. Analyze the page structure and content
3. Identify the relevant elements to interact with
4. Perform interactions carefully
5. Extract and return the requested information
6. Take screenshots when needed for verification

Guidelines:
- Always start by navigating to the URL
- Use accessibility tree information to find elements
- Verify your actions succeeded before proceeding
- Return concise, relevant information to the user
- Handle errors gracefully

Think step-by-step and explain your actions.
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
        logger.debug("BrowsingAgentSDK reset")

    def step(self, state: State) -> 'Action':
        """
        Execute one step using Claude SDK with Browser MCP.

        Args:
            state: Current OpenHands state

        Returns:
            Action to execute

        The method:
        1. Checks for exit/completion
        2. Converts state to browsing-focused prompt
        3. Queries Claude SDK with Browser MCP
        4. Converts response to action
        5. Returns action
        """
        logger.debug("BrowsingAgentSDK step() called")

        # Check for exit command
        latest_user_message = state.get_last_user_message()
        if latest_user_message and latest_user_message.content.strip() == '/exit':
            logger.info("Exit command detected")
            return AgentFinishAction()

        # Check if we have a task
        if not state.history:
            logger.warning("No history in state")
            return MessageAction(
                content="No browsing task provided. Please provide a URL or task.",
                wait_for_response=True
            )

        try:
            # Execute step via adapter
            action = run_async(self.adapter.execute_step(state))

            logger.info(f"Browsing step executed, returning: {type(action).__name__}")
            return action

        except Exception as e:
            logger.error(f"Error in browsing step: {e}", exc_info=True)
            return MessageAction(
                content=f"Error during browsing: {str(e)}",
                wait_for_response=False
            )

    def __del__(self):
        """Cleanup when agent is destroyed."""
        try:
            if hasattr(self, 'adapter') and self.adapter:
                run_async(self.adapter.cleanup())
        except Exception as e:
            logger.error(f"Error cleaning up adapter: {e}")
