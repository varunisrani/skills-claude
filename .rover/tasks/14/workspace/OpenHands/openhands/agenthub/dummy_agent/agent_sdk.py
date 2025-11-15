"""
DummyAgent using Claude Agent SDK

This is the Claude SDK-based version of DummyAgent. It replaces the hardcoded
deterministic steps with actual Claude SDK execution while maintaining the same
external interface for e2e testing.

Key differences from legacy DummyAgent:
- Uses ClaudeSDKAdapter instead of hardcoded action sequences
- Actually executes via Claude SDK (real LLM calls)
- Simpler implementation (~150 LOC vs ~177 LOC legacy)
- Better suited for testing SDK integration end-to-end
- Maintains backward compatibility with Agent base class

This agent is primarily used for:
- End-to-end testing of SDK integration
- Validating Claude SDK adapter functionality
- Testing basic tool usage (Read, Write, Bash)
- Demonstrating the SDK conversion pattern

Unlike CodeActAgent, this agent is intentionally minimal:
- No MCP servers needed
- Basic tool set only
- Simple system prompt
- Focused on testing rather than production use
"""

import os
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


class DummyAgentSDK(Agent):
    """
    DummyAgent implementation using Claude Agent SDK.

    This is a minimal test agent that uses Claude SDK for execution instead of
    hardcoded action sequences. It's designed for:

    1. Testing the Claude SDK integration
    2. Validating the adapter layer
    3. E2E testing with minimal complexity
    4. Demonstrating SDK conversion patterns

    The agent has access to basic tools (Read, Write, Bash) and executes
    simple tasks via Claude SDK. Unlike the legacy DummyAgent which had
    predetermined steps, this version actually queries Claude and executes
    based on the model's responses.

    This results in:
    - Real SDK integration testing
    - Non-deterministic but more realistic behavior
    - Simpler codebase (~150 LOC)
    - Better coverage of SDK functionality
    """

    VERSION = '2.0-SDK'

    def __init__(self, config: AgentConfig, llm_registry: LLMRegistry) -> None:
        """
        Initialize DummyAgent with Claude SDK.

        Args:
            config: Agent configuration
            llm_registry: LLM registry (kept for compatibility but not used directly)
        """
        super().__init__(config, llm_registry)

        logger.info("Initializing DummyAgentSDK")

        # Create adapter configuration
        self.adapter_config = self._create_adapter_config()

        # Create Claude SDK adapter
        self.adapter = ClaudeSDKAdapter(self.adapter_config)

        # Initialize adapter asynchronously
        self._initialize_adapter()

        logger.info("DummyAgentSDK initialized")

    def _initialize_adapter(self) -> None:
        """Initialize the Claude SDK adapter asynchronously."""
        try:
            run_async(self.adapter.initialize())
            logger.info("Claude SDK adapter initialized successfully for DummyAgent")
        except Exception as e:
            logger.error(f"Failed to initialize Claude SDK adapter: {e}")
            raise

    def _create_adapter_config(self) -> ClaudeSDKAdapterConfig:
        """
        Create adapter configuration for DummyAgent.

        This agent uses minimal tools for testing:
        - Read: For reading files
        - Write: For writing files
        - Bash: For executing commands

        No MCP servers are needed since this is a simple test agent.

        Returns:
            ClaudeSDKAdapterConfig for the adapter
        """
        # Minimal tool set for testing
        allowed_tools = ["Read", "Write", "Bash"]

        # Load system prompt
        system_prompt = self._load_system_prompt()

        # Create adapter config
        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="dummy",
            allowed_tools=allowed_tools,
            system_prompt=system_prompt,
            mcp_servers={},  # No MCP servers for test agent
            permission_mode="acceptEdits",  # Auto-accept for testing
            max_turns=10,  # Limited turns for test agent
            model=self.llm.config.model if self.llm else "claude-sonnet-4-5-20250929",
            workspace_base=self.config.workspace_base
        )

        logger.info(f"Created DummyAgent adapter config with {len(allowed_tools)} tools")
        logger.debug(f"Allowed tools: {allowed_tools}")

        return adapter_config

    def _load_system_prompt(self) -> str:
        """
        Load system prompt for DummyAgent.

        This is a simple prompt designed for testing basic SDK functionality.
        It guides the agent to perform simple file and command operations.

        Returns:
            System prompt string
        """
        prompt = """You are DummyAgent, a test agent for validating Claude SDK integration.

Your purpose is to test basic SDK functionality including:
- Reading files using the Read tool
- Writing files using the Write tool
- Executing bash commands using the Bash tool

You should perform simple, deterministic operations to validate the SDK works correctly.

Example test sequence:
1. Write a simple shell script file
2. Read the file back to verify contents
3. Execute the script with bash
4. Report completion

Keep operations simple and focused on testing tool integration.
Always explain what you're doing for test validation purposes.
"""
        return prompt

    def reset(self) -> None:
        """Reset the agent's internal state."""
        super().reset()
        logger.debug("DummyAgentSDK reset")

    def step(self, state: State) -> 'Action':
        """
        Execute one step using Claude SDK.

        This method maintains the same interface as the legacy DummyAgent but
        delegates execution to Claude SDK via the adapter instead of using
        hardcoded action sequences.

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
        logger.debug("DummyAgentSDK step() called")

        # Check for exit command
        latest_user_message = state.get_last_user_message()
        if latest_user_message and latest_user_message.content.strip() == '/exit':
            logger.info("Exit command detected")
            return AgentFinishAction()

        # Check if we have a task to work on
        if not state.history:
            logger.warning("No history in state, providing default test task")
            return MessageAction(
                content="DummyAgent ready for testing. Provide a test task or I'll execute a default test sequence.",
                wait_for_response=True
            )

        try:
            # Execute step via adapter
            # The adapter handles:
            # - Converting state to prompt
            # - Querying Claude SDK
            # - Converting response to action
            action = run_async(self.adapter.execute_step(state))

            logger.info(f"DummyAgent step executed, returning: {type(action).__name__}")
            return action

        except Exception as e:
            logger.error(f"Error in DummyAgent step execution: {e}", exc_info=True)
            return MessageAction(
                content=f"DummyAgent error executing step: {str(e)}",
                wait_for_response=False
            )

    def __del__(self):
        """Cleanup when agent is destroyed."""
        try:
            if hasattr(self, 'adapter') and self.adapter:
                run_async(self.adapter.cleanup())
                logger.debug("DummyAgentSDK cleaned up")
        except Exception as e:
            logger.error(f"Error cleaning up DummyAgent adapter: {e}")
