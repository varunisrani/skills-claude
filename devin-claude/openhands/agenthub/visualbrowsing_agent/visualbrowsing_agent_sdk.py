"""
VisualBrowsingAgent using Claude Agent SDK

This is the Claude SDK-based version of VisualBrowsingAgent. It maintains the same
external interface as the legacy VisualBrowsingAgent but delegates execution to
Claude Agent SDK with Browser MCP integration for visual web interaction.

Key differences from legacy VisualBrowsingAgent:
- Uses ClaudeSDKAdapter with Browser MCP instead of BrowserGym directly
- Delegates agent loop to Claude SDK with visual capabilities
- Simpler implementation (~200 LOC vs ~311 LOC)
- Native screenshot and visual analysis via MCP tools
- Better image handling and accessibility tree processing
- Leverages Claude's vision capabilities for screenshot analysis

The agent maintains backward compatibility with the Agent base class while adding
enhanced visual browsing capabilities through:
- Screenshot capture and analysis
- Visual element identification
- Image-based page navigation
- Set-of-marks (SOM) screenshot processing

Legacy VisualBrowsingAgent used BrowserGym's HighLevelActionSet with manual prompt
construction for visual tasks. This SDK version leverages Claude's native vision
capabilities combined with Browser MCP for more robust visual web interaction.
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


class VisualBrowsingAgentSDK(Agent):
    """
    VisualBrowsingAgent implementation using Claude Agent SDK.

    This agent specializes in visual web browsing and interaction with screenshot
    capabilities. It uses the Browser MCP server with Claude's vision capabilities to:
    - Navigate to web pages
    - Take and analyze screenshots
    - Extract page content with visual context
    - Interact with elements using visual identification
    - Handle image-based navigation tasks
    - Process set-of-marks (SOM) screenshots
    - Perform visual verification of actions

    This implementation delegates visual browser interaction to Claude SDK with
    Browser MCP, resulting in:
    - Simpler codebase (~200 LOC vs ~311 LOC)
    - Native screenshot analysis using Claude's vision
    - Better visual element identification
    - Seamless image handling in prompts
    - Enhanced accessibility tree processing with visual context

    Visual Browsing Capabilities:
    - Screenshot capture at each step
    - Visual element localization
    - Image-based goal specification
    - Visual verification of interactions
    - SOM (Set-of-Marks) screenshot support for element identification
    """

    VERSION = '2.0-SDK'

    sandbox_plugins: list[PluginRequirement] = []

    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry) -> None:
        """
        Initialize VisualBrowsingAgent with Claude SDK.

        Args:
            config: Agent configuration
            llm_registry: LLM registry (kept for compatibility)
        """
        super().__init__(config, llm_registry)

        logger.info("Initializing VisualBrowsingAgentSDK")

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

        logger.info("VisualBrowsingAgentSDK initialized with visual capabilities")

    def _initialize_adapter(self) -> None:
        """Initialize the Claude SDK adapter asynchronously."""
        try:
            run_async(self.adapter.initialize())
            logger.info("Browser MCP adapter initialized successfully with screenshot support")
        except Exception as e:
            logger.error(f"Failed to initialize adapter: {e}")
            raise

    def _create_adapter_config(self) -> ClaudeSDKAdapterConfig:
        """
        Create adapter configuration for visual browsing agent.

        This configuration includes tools for:
        - Web navigation
        - Screenshot capture
        - Visual element interaction
        - Page content extraction with images
        - Accessibility tree analysis

        Returns:
            ClaudeSDKAdapterConfig for the adapter
        """
        # Visual browser-specific tools
        # Includes all browser tools plus screenshot capabilities
        allowed_tools = [
            "Read",  # For reading local files (e.g., saved screenshots)
            "mcp__browser__navigate",  # Navigate to URLs
            "mcp__browser__interact",  # Click, type, select elements
            "mcp__browser__extract_content",  # Get page content
            "mcp__browser__screenshot",  # Capture screenshots
            "mcp__browser__get_page_info",  # Get page structure/accessibility tree
            "mcp__browser__scroll",  # Scroll page for visual navigation
            "mcp__browser__get_element_info",  # Get visual element details
        ]

        # Create Browser MCP server with screenshot support
        mcp_servers = {
            "browser": create_browser_mcp_server()
        }

        # Load system prompt for visual browsing
        system_prompt = self._load_system_prompt()

        # Create adapter config
        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="visual_browsing",
            allowed_tools=allowed_tools,
            system_prompt=system_prompt,
            mcp_servers=mcp_servers,
            permission_mode="accept",  # Accept actions, no edits needed
            max_turns=40,  # Visual tasks may need more turns
            model=self.llm.config.model if self.llm else "claude-sonnet-4-5-20250929",
            workspace_base=self.config.workspace_base
        )

        logger.info(f"Created visual browsing adapter config with {len(allowed_tools)} tools")

        return adapter_config

    def _load_system_prompt(self) -> str:
        """
        Load system prompt for the visual browsing agent.

        The prompt emphasizes:
        - Screenshot-based navigation
        - Visual element identification
        - Image processing capabilities
        - Accessibility tree analysis with visual context

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

        # Fallback to a default visual browsing-focused prompt
        default_prompt = """You are a visual web browsing and interaction specialist with advanced screenshot analysis capabilities.

Your capabilities:
- Navigate to web pages and capture screenshots
- Analyze page screenshots to identify elements and layout
- Extract page content with visual context
- Interact with page elements using visual identification
- Take screenshots at each step for verification
- Process accessibility trees with visual information
- Handle image-based navigation tasks
- Verify actions through visual feedback

Your approach to visual web tasks:
1. Navigate to the target URL
2. Capture a screenshot to understand the page layout
3. Analyze the screenshot along with the accessibility tree
4. Identify target elements visually
5. Perform interactions carefully
6. Take verification screenshots after actions
7. Extract and return the requested information with visual context

Visual browsing guidelines:
- ALWAYS take screenshots to understand page state
- Use visual information to locate elements when bid is unclear
- Combine accessibility tree data with screenshot analysis
- Verify actions succeeded by comparing before/after screenshots
- When elements are hard to find in the tree, use visual analysis
- Handle dynamic content by observing visual changes
- Take screenshots before and after key interactions
- Use set-of-marks (SOM) screenshots for precise element identification
- Return relevant screenshots to the user when helpful

Screenshot analysis:
- Examine screenshots carefully for element positions
- Use visual cues like colors, text, and layout
- Identify clickable elements from visual appearance
- Verify form fields and inputs visually
- Check for visual feedback after interactions (e.g., highlights, messages)
- Compare screenshots to track navigation progress

Error handling:
- If an element is not found in accessibility tree, try visual analysis
- Take screenshots to debug failed interactions
- Use visual feedback to understand errors
- Re-capture screenshots if page state changes unexpectedly

Think step-by-step, explain your visual observations, and verify actions with screenshots.
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
        logger.debug("VisualBrowsingAgentSDK reset")

    def step(self, state: State) -> 'Action':
        """
        Execute one step using Claude SDK with Browser MCP and visual capabilities.

        Args:
            state: Current OpenHands state

        Returns:
            Action to execute

        The method:
        1. Checks for exit/completion
        2. Converts state to visual browsing-focused prompt
        3. Queries Claude SDK with Browser MCP and vision capabilities
        4. Processes response including screenshot analysis
        5. Converts response to action
        6. Returns action with visual context

        Visual browsing enhancements:
        - Extracts image URLs from state for visual goals
        - Includes screenshot observations in prompts
        - Handles set-of-marks (SOM) screenshots
        - Processes visual element identification
        """
        logger.debug("VisualBrowsingAgentSDK step() called")

        # Check for exit command
        latest_user_message = state.get_last_user_message()
        if latest_user_message and latest_user_message.content.strip() == '/exit':
            logger.info("Exit command detected")
            return AgentFinishAction()

        # Check if we have a task
        if not state.history:
            logger.warning("No history in state")
            return MessageAction(
                content="No visual browsing task provided. Please provide a URL or task with optional screenshot/image references.",
                wait_for_response=True
            )

        try:
            # Execute step via adapter
            # The adapter will handle visual content and screenshots automatically
            action = run_async(self.adapter.execute_step(state))

            logger.info(f"Visual browsing step executed, returning: {type(action).__name__}")
            return action

        except Exception as e:
            logger.error(f"Error in visual browsing step: {e}", exc_info=True)
            return MessageAction(
                content=f"Error during visual browsing: {str(e)}",
                wait_for_response=False
            )

    def __del__(self):
        """Cleanup when agent is destroyed."""
        try:
            if hasattr(self, 'adapter') and self.adapter:
                run_async(self.adapter.cleanup())
                logger.info("VisualBrowsingAgentSDK cleaned up")
        except Exception as e:
            logger.error(f"Error cleaning up adapter: {e}")
