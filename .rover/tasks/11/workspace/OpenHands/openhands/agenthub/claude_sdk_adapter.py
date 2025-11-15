"""
Claude SDK Adapter for OpenHands Legacy Agents

This module provides the adapter/bridge layer between OpenHands' State/Action system
and Claude Agent SDK. It enables legacy agents to use Claude SDK while maintaining
backward compatibility with the Agent base class interface.

Key responsibilities:
- Convert OpenHands State to Claude SDK prompts
- Convert Claude SDK messages to OpenHands Actions
- Map tool calls between systems
- Handle async/sync bridges
- Maintain conversation context

Usage:
    from openhands.agenthub.claude_sdk_adapter import ClaudeSDKAdapter

    adapter = ClaudeSDKAdapter(config=agent_config)
    await adapter.initialize()

    # In agent.step():
    action = await adapter.execute_step(state)
"""

import asyncio
import logging
from typing import List, Dict, Optional, Any
from pathlib import Path
from dataclasses import dataclass

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

from openhands.controller.state.state import State
from openhands.core.config import AgentConfig
from openhands.core.message import Message, TextContent
from openhands.events.action import (
    Action,
    AgentFinishAction,
    MessageAction,
    CmdRunAction,
    IPythonRunCellAction,
    FileReadAction,
    FileWriteAction,
    FileEditAction,
    AgentThinkAction,
    BrowseInteractiveAction,
)
from openhands.events.observation import (
    Observation,
    CmdOutputObservation,
    IPythonRunCellObservation,
    FileReadObservation,
    ErrorObservation,
    BrowserOutputObservation,
)
from openhands.events.event import Event, EventSource

logger = logging.getLogger(__name__)


@dataclass
class ClaudeSDKAdapterConfig:
    """Configuration for Claude SDK Adapter."""

    agent_type: str  # code, browsing, readonly, etc.
    allowed_tools: List[str]
    system_prompt: str
    mcp_servers: Optional[Dict] = None
    permission_mode: str = "acceptEdits"
    max_turns: int = 50
    model: str = "claude-sonnet-4-5-20250929"
    workspace_base: Optional[str] = None


class ClaudeSDKAdapter:
    """
    Adapter between OpenHands legacy agents and Claude Agent SDK.

    This class bridges the gap between:
    - OpenHands State/Action/Observation system
    - Claude SDK query/response message system

    It maintains conversation context and handles translation between the two systems.
    """

    def __init__(self, config: ClaudeSDKAdapterConfig):
        """
        Initialize the Claude SDK adapter.

        Args:
            config: Adapter configuration
        """
        self.config = config
        self.claude_client: Optional[ClaudeSDKClient] = None
        self._initialized = False
        self._loop = None

        logger.info(f"ClaudeSDKAdapter created for {config.agent_type} agent")

    async def initialize(self) -> None:
        """
        Initialize the Claude SDK client asynchronously.

        This must be called before using the adapter for the first time.
        """
        if self._initialized:
            logger.debug("Adapter already initialized")
            return

        logger.info(f"Initializing Claude SDK client for {self.config.agent_type}")

        # Create Claude SDK client options
        options = ClaudeAgentOptions(
            allowed_tools=self.config.allowed_tools,
            system_prompt=self.config.system_prompt,
            mcp_servers=self.config.mcp_servers or {},
            permission_mode=self.config.permission_mode,
            cwd=self.config.workspace_base or str(Path.cwd()),
            max_turns=self.config.max_turns,
            model=self.config.model
        )

        # Create and connect client
        self.claude_client = ClaudeSDKClient(options=options)
        await self.claude_client.connect()

        self._initialized = True
        logger.info(f"Claude SDK client initialized for {self.config.agent_type}")

    def _ensure_initialized(self) -> None:
        """Ensure the adapter is initialized."""
        if not self._initialized or self.claude_client is None:
            raise RuntimeError(
                "ClaudeSDKAdapter not initialized. Call initialize() first."
            )

    def state_to_prompt(self, state: State) -> str:
        """
        Convert OpenHands State to a Claude SDK prompt.

        This extracts the relevant information from the state history and formats
        it into a prompt that Claude SDK can understand.

        Args:
            state: The current OpenHands state

        Returns:
            A formatted prompt string for Claude SDK
        """
        # Get the latest user message
        latest_user_message = state.get_last_user_message()
        if latest_user_message:
            base_prompt = latest_user_message.content
        else:
            # Fallback to task from inputs
            base_prompt = state.inputs.get('task', 'Complete the current task.')

        # Build context from recent history
        context_parts = []

        # Look at recent events for context
        recent_events = list(state.history)[-10:]  # Last 10 events

        for event in recent_events:
            if isinstance(event, Observation):
                # Add observation context
                if isinstance(event, CmdOutputObservation):
                    if event.command:
                        context_parts.append(f"Previous command: {event.command}")
                    if event.content:
                        # Truncate long outputs
                        output = event.content[:500]
                        context_parts.append(f"Command output: {output}")

                elif isinstance(event, FileReadObservation):
                    if event.path:
                        context_parts.append(f"Previously read file: {event.path}")

                elif isinstance(event, ErrorObservation):
                    if event.content:
                        context_parts.append(f"Previous error: {event.content[:200]}")

        # Combine into final prompt
        if context_parts:
            context_str = "\n\n".join(context_parts)
            full_prompt = f"{base_prompt}\n\nRecent context:\n{context_str}"
        else:
            full_prompt = base_prompt

        logger.debug(f"Generated prompt (length: {len(full_prompt)})")

        return full_prompt

    def messages_to_action(self, messages: List[Any]) -> Action:
        """
        Convert Claude SDK response messages to an OpenHands Action.

        Claude SDK returns a list of messages which can include:
        - Text responses
        - Tool calls
        - Thinking messages

        This method translates those into appropriate OpenHands Actions.

        Args:
            messages: List of messages from Claude SDK

        Returns:
            An OpenHands Action
        """
        if not messages:
            logger.warning("No messages received from Claude SDK")
            return MessageAction(content="No response from agent", wait_for_response=False)

        # Collect all text content and tool calls
        text_parts = []
        tool_calls = []

        for msg in messages:
            # Handle different message types
            if hasattr(msg, 'content'):
                if isinstance(msg.content, str):
                    text_parts.append(msg.content)
                elif isinstance(msg.content, list):
                    for item in msg.content:
                        if isinstance(item, dict):
                            if item.get('type') == 'text':
                                text_parts.append(item.get('text', ''))
                            elif item.get('type') == 'tool_use':
                                tool_calls.append(item)

            # Check for tool_calls attribute (function calling)
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                tool_calls.extend(msg.tool_calls)

        # Priority 1: Convert tool calls to actions
        if tool_calls:
            # Take the first tool call (agents typically do one action at a time)
            tool_call = tool_calls[0]

            # Extract tool name and arguments
            if isinstance(tool_call, dict):
                tool_name = tool_call.get('name', '')
                arguments = tool_call.get('input', {})
            else:
                tool_name = getattr(tool_call, 'name', '')
                arguments = getattr(tool_call, 'arguments', {})

            # Map tool calls to OpenHands actions
            action = self._map_tool_to_action(tool_name, arguments)

            # Add thinking/text as thought if available
            if text_parts and hasattr(action, 'thought'):
                action.thought = "\n".join(text_parts)

            return action

        # Priority 2: Check if message indicates completion
        combined_text = "\n".join(text_parts)

        # Look for finish indicators
        finish_indicators = [
            "task complete",
            "task is complete",
            "finished",
            "done with the task",
            "successfully completed"
        ]

        if any(indicator in combined_text.lower() for indicator in finish_indicators):
            return AgentFinishAction(outputs={"content": combined_text})

        # Priority 3: Return as a message action
        return MessageAction(content=combined_text, wait_for_response=False)

    def _map_tool_to_action(self, tool_name: str, arguments: Dict[str, Any]) -> Action:
        """
        Map a Claude SDK tool call to an OpenHands Action.

        Args:
            tool_name: Name of the tool called
            arguments: Tool arguments

        Returns:
            Corresponding OpenHands Action
        """
        logger.debug(f"Mapping tool: {tool_name} with args: {arguments}")

        # Map Bash tool
        if tool_name == "Bash" or tool_name == "bash":
            command = arguments.get('command', '')
            return CmdRunAction(command=command)

        # Map Read tool
        if tool_name == "Read" or tool_name == "read":
            file_path = arguments.get('file_path', '')
            return FileReadAction(path=file_path)

        # Map Write tool
        if tool_name == "Write" or tool_name == "write":
            file_path = arguments.get('file_path', '')
            content = arguments.get('content', '')
            return FileWriteAction(path=file_path, content=content)

        # Map Edit tool
        if tool_name == "Edit" or tool_name == "edit":
            file_path = arguments.get('file_path', '')
            old_string = arguments.get('old_string', '')
            new_string = arguments.get('new_string', '')
            # OpenHands uses FileEditAction for edits
            return FileEditAction(
                path=file_path,
                content=f"Replace: {old_string}\nWith: {new_string}"
            )

        # Map MCP Jupyter tools
        if tool_name.startswith("mcp__jupyter__"):
            code = arguments.get('code', '')
            return IPythonRunCellAction(code=code)

        # Map MCP Browser tools
        if tool_name.startswith("mcp__browser__"):
            # Convert to BrowseInteractiveAction
            browser_actions = self._convert_browser_tool(tool_name, arguments)
            return BrowseInteractiveAction(browser_actions=browser_actions)

        # Default: Return as MessageAction with tool info
        tool_info = f"Tool: {tool_name}\nArguments: {arguments}"
        return MessageAction(content=tool_info, wait_for_response=False)

    def _convert_browser_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """
        Convert MCP browser tool to BrowserGym action string.

        Args:
            tool_name: MCP browser tool name
            arguments: Tool arguments

        Returns:
            BrowserGym action string
        """
        # Extract action type from tool name
        # mcp__browser__navigate -> navigate
        action_type = tool_name.replace("mcp__browser__", "")

        if action_type == "navigate":
            url = arguments.get('url', '')
            return f'goto("{url}")'

        elif action_type == "interact":
            element = arguments.get('element', '')
            action = arguments.get('action', 'click')
            return f'{action}("{element}")'

        elif action_type == "extract_content":
            return 'get_page_content()'

        else:
            # Generic action
            return f'{action_type}()'

    async def execute_step(self, state: State) -> Action:
        """
        Execute one step using Claude SDK.

        This is the main method called by legacy agents in their step() method.
        It handles the full cycle:
        1. Convert state to prompt
        2. Query Claude SDK
        3. Receive response
        4. Convert to action

        Args:
            state: Current OpenHands state

        Returns:
            An OpenHands Action to execute
        """
        self._ensure_initialized()

        logger.info(f"Executing step for {self.config.agent_type} agent")

        # Convert state to prompt
        prompt = self.state_to_prompt(state)
        logger.debug(f"Prompt: {prompt[:200]}...")

        # Query Claude SDK
        await self.claude_client.query(prompt)

        # Receive response messages
        messages = []
        async for msg in self.claude_client.receive_response():
            messages.append(msg)
            logger.debug(f"Received message: {type(msg)}")

        logger.info(f"Received {len(messages)} messages from Claude SDK")

        # Convert messages to action
        action = self.messages_to_action(messages)
        logger.info(f"Converted to action: {type(action).__name__}")

        return action

    async def cleanup(self) -> None:
        """Cleanup resources."""
        if self.claude_client:
            try:
                await self.claude_client.disconnect()
                logger.info(f"Disconnected Claude SDK client for {self.config.agent_type}")
            except Exception as e:
                logger.error(f"Error disconnecting client: {e}")

        self._initialized = False
        self.claude_client = None


def run_async(coro):
    """
    Helper to run async coroutine in sync context.

    This is useful for legacy agents that have synchronous step() methods
    but need to call async Claude SDK methods.

    Args:
        coro: Async coroutine to run

    Returns:
        Result of the coroutine
    """
    try:
        # Try to get existing event loop
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is already running, we need to use a different approach
            # This can happen in nested async contexts
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(coro)
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        # No event loop exists, create new one
        return asyncio.run(coro)
