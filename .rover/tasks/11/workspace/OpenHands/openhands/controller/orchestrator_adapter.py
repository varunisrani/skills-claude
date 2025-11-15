"""
AgentController Adapter for TaskOrchestrator

This module provides backward compatibility between the new TaskOrchestrator
(Claude Agent SDK-based) and the existing AgentController interface.

It allows existing code to gradually migrate to TaskOrchestrator while
maintaining compatibility with the AgentController API.

Usage:
    # Option 1: Use as drop-in replacement
    from openhands.controller.orchestrator_adapter import OrchestratorAdapter

    controller = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=workspace
    )

    # Use like AgentController
    await controller.run(task="Fix the bug...")

    # Option 2: Wrap existing TaskOrchestrator
    from openhands.orchestrator import TaskOrchestrator

    orchestrator = TaskOrchestrator(workspace=workspace, api_key=api_key)
    adapter = OrchestratorAdapter.from_orchestrator(orchestrator, event_stream)
"""

from typing import Optional, Callable, Any, Dict, Union
import asyncio
import logging
from pathlib import Path
from enum import Enum

from openhands.controller.state.state import State
from openhands.core.config import OpenHandsConfig, AgentConfig
from openhands.core.schema import AgentState
from openhands.events import EventStream, EventSource
from openhands.events.action import Action, MessageAction, AgentFinishAction, NullAction
from openhands.events.observation import Observation, AgentStateChangedObservation, ErrorObservation
from openhands.orchestrator import TaskOrchestrator, TaskStatus
from openhands.server.services.conversation_stats import ConversationStats
from openhands.llm.metrics import Metrics

# Import for agent type detection and execution
from openhands.controller.agent import Agent
from openhands.controller.agent_controller import AgentController
from openhands.agenthub.claude_sdk_adapter import ClaudeSDKAdapter

logger = logging.getLogger(__name__)


class AgentType(Enum):
    """Agent execution type."""
    SDK = "sdk"
    LEGACY = "legacy"


def detect_agent_type(agent: Agent) -> AgentType:
    """
    Detect if agent is SDK or legacy type.

    SDK agents are identified by:
    - Having an 'adapter' attribute of type ClaudeSDKAdapter
    - Class name containing 'SDK'
    - Being instance of SDK agent classes

    Args:
        agent: Agent instance to check

    Returns:
        AgentType.SDK or AgentType.LEGACY
    """
    # Check for ClaudeSDKAdapter attribute
    if hasattr(agent, 'adapter') and isinstance(agent.adapter, ClaudeSDKAdapter):
        logger.debug(f"Detected SDK agent (has ClaudeSDKAdapter): {agent.name}")
        return AgentType.SDK

    # Check class name
    if 'SDK' in agent.__class__.__name__:
        logger.debug(f"Detected SDK agent (class name): {agent.name}")
        return AgentType.SDK

    # Check for legacy LLM attribute
    if hasattr(agent, 'llm') and agent.llm is not None:
        # Legacy agents have self.llm for LiteLLM
        # SDK agents may have self.llm for compatibility but use adapter instead
        if not hasattr(agent, 'adapter'):
            logger.debug(f"Detected legacy agent (has LLM, no adapter): {agent.name}")
            return AgentType.LEGACY

    # Default to legacy for backward compatibility
    logger.debug(f"Defaulting to legacy agent: {agent.name}")
    return AgentType.LEGACY


class OrchestratorAdapter:
    """
    Unified control plane for SDK and legacy agents.

    This adapter provides a unified interface for both SDK-based agents
    (using Claude Agent SDK) and legacy agents (using LiteLLM + AgentController).

    Phase 6A enhancements:
    - Agent type detection (SDK vs legacy)
    - Dual execution paths (SDKExecutor for SDK, AgentController for legacy)
    - Unified step execution interface
    - Error handling delegation
    - Metrics aggregation

    Key differences from AgentController:
    - Simplified state management (no complex event loop)
    - Delegated execution to Claude Code agents
    - Cleaner error handling
    - Better separation of concerns
    - Support for both agent types

    Attributes:
        orchestrator: The underlying TaskOrchestrator (for SDK agents)
        controller: AgentController (for legacy agents)
        agent: The agent being executed
        agent_type: Type of agent (SDK or LEGACY)
        event_stream: OpenHands event stream for compatibility
        state: Current execution state
        config: OpenHands configuration
    """

    def __init__(
        self,
        config: OpenHandsConfig,
        event_stream: EventStream,
        workspace: str,
        agent: Optional[Agent] = None,
        api_key: Optional[str] = None,
        conversation_stats: Optional[ConversationStats] = None,
        max_retries: int = 3,
        progress_callback: Optional[Callable] = None,
    ):
        """
        Initialize the adapter with agent type detection.

        Args:
            config: OpenHands configuration
            event_stream: Event stream for publishing events
            workspace: Working directory
            agent: Optional agent instance (for type detection)
            api_key: Anthropic API key (will use config if not provided)
            conversation_stats: Conversation statistics tracker
            max_retries: Maximum retry attempts
            progress_callback: Optional progress callback
        """
        self.config = config
        self.event_stream = event_stream
        self.workspace = Path(workspace).resolve()
        self.conversation_stats = conversation_stats
        self.agent = agent
        self.controller: Optional[AgentController] = None
        self.orchestrator: Optional[TaskOrchestrator] = None

        # Detect agent type if agent provided
        if agent is not None:
            self.agent_type = detect_agent_type(agent)
            logger.info(f"Detected agent type: {self.agent_type.value} for {agent.name}")
        else:
            # Default to SDK for backward compatibility with TaskOrchestrator
            self.agent_type = AgentType.SDK
            logger.info("No agent provided, defaulting to SDK type")

        # Get API key from config if not provided
        if api_key is None:
            api_key = getattr(config.llm, 'api_key', None)
            if api_key is None and self.agent_type == AgentType.SDK:
                raise ValueError("API key must be provided or set in config for SDK agents")

        # Initialize appropriate executor based on agent type
        if self.agent_type == AgentType.SDK:
            logger.info("Initializing SDK execution path (TaskOrchestrator)")
            self.orchestrator = TaskOrchestrator(
                workspace=str(self.workspace),
                api_key=api_key or "",
                max_retries=max_retries,
                progress_callback=self._handle_progress
            )
        else:
            logger.info("Initializing legacy execution path (AgentController)")
            if agent is None:
                raise ValueError("Agent must be provided for legacy execution path")
            # Import here to avoid circular dependency
            from openhands.storage.memory import InMemoryFileStore
            file_store = InMemoryFileStore({})

            self.controller = AgentController(
                agent=agent,
                event_stream=event_stream,
                max_iterations=config.max_iterations,
                max_budget_per_task=getattr(config, 'max_budget_per_task', None),
                agent_to_llm_config={},
                agent_configs={},
                sid=f"adapter_{id(self)}",
                confirmation_mode=False,
                headless_mode=True,
                file_store=file_store,
                is_delegate=False,
            )

        # Initialize state
        self.state = State(
            inputs={},
            iteration=0,
            max_iterations=config.max_iterations,
        )
        self.state.agent_state = AgentState.INIT

        # Store agent type in state for tracking
        if hasattr(self.state, 'agent_type'):
            self.state.agent_type = self.agent_type.value

        # Store callback
        self._user_progress_callback = progress_callback

        logger.info(
            f"OrchestratorAdapter initialized for workspace: {self.workspace}, "
            f"agent_type: {self.agent_type.value}"
        )

    @classmethod
    def from_orchestrator(
        cls,
        orchestrator: TaskOrchestrator,
        event_stream: EventStream,
        config: OpenHandsConfig,
    ) -> 'OrchestratorAdapter':
        """
        Create adapter from existing TaskOrchestrator.

        Args:
            orchestrator: Existing TaskOrchestrator instance
            event_stream: Event stream for compatibility
            config: OpenHands configuration

        Returns:
            OrchestratorAdapter instance
        """
        adapter = cls.__new__(cls)
        adapter.orchestrator = orchestrator
        adapter.event_stream = event_stream
        adapter.config = config
        adapter.workspace = orchestrator.workspace
        adapter.state = State(
            inputs={},
            iteration=0,
            max_iterations=config.max_iterations,
        )
        adapter.state.agent_state = AgentState.INIT
        adapter._user_progress_callback = None

        logger.info("OrchestratorAdapter created from existing TaskOrchestrator")
        return adapter

    async def _handle_progress(self, message: str, metadata: Dict[str, Any]):
        """
        Internal progress handler that bridges to OpenHands event system.

        Args:
            message: Progress message
            metadata: Progress metadata
        """
        # Update state
        self.state.iteration = metadata.get('iteration', self.state.iteration)

        # Publish to event stream
        if self.event_stream:
            # Create a MessageAction for progress updates
            progress_action = MessageAction(
                content=message,
                source=EventSource.AGENT
            )
            self.event_stream.add_event(progress_action, EventSource.AGENT)

        # Call user callback if provided
        if self._user_progress_callback:
            try:
                if asyncio.iscoroutinefunction(self._user_progress_callback):
                    await self._user_progress_callback(message, metadata)
                else:
                    self._user_progress_callback(message, metadata)
            except Exception as e:
                logger.error(f"User progress callback error: {e}")

    async def run(
        self,
        task: str,
        agent_type: str = "code",
        fake_user_response_fn: Optional[Callable] = None,
    ) -> State:
        """
        Run a task using TaskOrchestrator.

        This is compatible with AgentController's run method but delegates
        to TaskOrchestrator instead.

        Args:
            task: Task description
            agent_type: Type of agent to use (default: code)
            fake_user_response_fn: Optional fake user response function (for compatibility)

        Returns:
            Final state after execution
        """
        logger.info(f"Running task with {agent_type} agent: {task[:100]}...")

        # Update state
        self.state.agent_state = AgentState.RUNNING
        self.state.iteration = 0

        # Publish initial message
        initial_action = MessageAction(content=task, source=EventSource.USER)
        self.event_stream.add_event(initial_action, EventSource.USER)

        try:
            # Execute task through orchestrator
            result = await self.orchestrator.execute_simple_task(
                agent_type=agent_type,
                task_description=task
            )

            # Update state based on result
            if result.status == TaskStatus.COMPLETED:
                self.state.agent_state = AgentState.FINISHED

                # Add finish action
                finish_action = AgentFinishAction(
                    outputs={"result": "Task completed successfully"}
                )
                self.event_stream.add_event(finish_action, EventSource.AGENT)

            elif result.status == TaskStatus.FAILED:
                self.state.agent_state = AgentState.ERROR
                self.state.last_error = result.error

                # Add error observation
                from openhands.events.observation import ErrorObservation
                error_obs = ErrorObservation(content=result.error or "Unknown error")
                self.event_stream.add_event(error_obs, EventSource.AGENT)

            # Update metrics
            self.state.iteration = result.metadata.get('iterations', 1)

        except Exception as e:
            logger.error(f"Task execution failed: {e}")
            self.state.agent_state = AgentState.ERROR
            self.state.last_error = str(e)

            # Add error observation
            from openhands.events.observation import ErrorObservation
            error_obs = ErrorObservation(content=str(e))
            self.event_stream.add_event(error_obs, EventSource.AGENT)

        # Add state changed observation
        state_obs = AgentStateChangedObservation(
            content="",
            agent_state=self.state.agent_state
        )
        self.event_stream.add_event(state_obs, EventSource.AGENT)

        return self.state

    async def run_github_issue(
        self,
        issue_title: str,
        issue_body: str,
        repo_path: Optional[str] = None,
    ) -> State:
        """
        Run GitHub issue resolution workflow.

        This uses TaskOrchestrator's execute_github_issue_workflow method,
        which is similar to SWE-bench evaluation.

        Args:
            issue_title: Issue title
            issue_body: Issue description
            repo_path: Repository path (defaults to workspace)

        Returns:
            Final state after execution
        """
        logger.info(f"Running GitHub issue workflow: {issue_title}")

        # Update state
        self.state.agent_state = AgentState.RUNNING
        self.state.iteration = 0

        # Use workspace as repo_path if not provided
        if repo_path is None:
            repo_path = str(self.workspace)

        try:
            # Execute GitHub issue workflow
            result = await self.orchestrator.execute_github_issue_workflow(
                issue_title=issue_title,
                issue_body=issue_body,
                repo_path=repo_path
            )

            # Update state based on result
            if result.status == TaskStatus.COMPLETED:
                self.state.agent_state = AgentState.FINISHED
                finish_action = AgentFinishAction(
                    outputs={"result": "Issue resolved successfully"}
                )
                self.event_stream.add_event(finish_action, EventSource.AGENT)

            elif result.status == TaskStatus.FAILED:
                self.state.agent_state = AgentState.ERROR
                self.state.last_error = result.error

                from openhands.events.observation import ErrorObservation
                error_obs = ErrorObservation(content=result.error or "Unknown error")
                self.event_stream.add_event(error_obs, EventSource.AGENT)

        except Exception as e:
            logger.error(f"GitHub issue workflow failed: {e}")
            self.state.agent_state = AgentState.ERROR
            self.state.last_error = str(e)

        return self.state

    async def __aenter__(self):
        """Async context manager entry."""
        await self.orchestrator.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.orchestrator:
            await self.orchestrator.__aexit__(exc_type, exc_val, exc_tb)

    def close(self):
        """Close the adapter and cleanup resources."""
        if self.controller:
            self.controller.close()
        # TaskOrchestrator cleanup is handled by context manager
        logger.info("OrchestratorAdapter closed")

    # =========================================================================
    # Phase 6A: Unified Control Plane Methods
    # =========================================================================

    def execute_step(self, state: State) -> Action:
        """
        Unified step execution interface.

        This method routes to the appropriate execution path based on agent type:
        - SDK agents: Use TaskOrchestrator/SDKExecutor
        - Legacy agents: Use AgentController

        Args:
            state: Current execution state

        Returns:
            Action to execute

        Raises:
            RuntimeError: If execution fails
        """
        logger.debug(f"execute_step() called for {self.agent_type.value} agent")

        try:
            if self.agent_type == AgentType.SDK:
                return self._execute_sdk_step(state)
            else:
                return self._execute_legacy_step(state)
        except Exception as e:
            logger.error(f"Step execution failed: {e}", exc_info=True)
            return self._handle_step_error(e, state)

    def _execute_sdk_step(self, state: State) -> Action:
        """
        Execute SDK agent step.

        For SDK agents, we delegate to the agent's step() method which uses
        ClaudeSDKAdapter internally. The adapter handles:
        - State to prompt conversion
        - Claude SDK query/response
        - Response to action conversion

        Args:
            state: Current state

        Returns:
            Action from SDK agent

        Raises:
            RuntimeError: If agent not available or step fails
        """
        logger.debug("Executing SDK agent step")

        if self.agent is None:
            raise RuntimeError("No agent available for SDK execution")

        # Update state
        if state.agent_state == AgentState.INIT:
            state.agent_state = AgentState.RUNNING

        try:
            # Call agent.step() which delegates to ClaudeSDKAdapter
            action = self.agent.step(state)

            # Update iteration
            state.iteration += 1

            logger.info(f"SDK step completed: {type(action).__name__}")
            return action

        except Exception as e:
            logger.error(f"SDK step execution failed: {e}")
            raise

    def _execute_legacy_step(self, state: State) -> Action:
        """
        Execute legacy agent step.

        For legacy agents, we delegate to AgentController which handles:
        - Agent.step() call with LiteLLM
        - Stuck detection
        - Control flags
        - Error handling

        Args:
            state: Current state

        Returns:
            Action from legacy agent

        Raises:
            RuntimeError: If controller not available
        """
        logger.debug("Executing legacy agent step")

        if self.controller is None:
            raise RuntimeError("AgentController not initialized for legacy execution")

        try:
            # Use AgentController's _step method
            # This handles the full legacy execution path
            import asyncio
            action = asyncio.run(self.controller._step())

            # Sync state from controller
            self.state = self.controller.get_state()

            logger.info(f"Legacy step completed: {type(action).__name__}")
            return action

        except Exception as e:
            logger.error(f"Legacy step execution failed: {e}")
            raise

    def _handle_step_error(self, error: Exception, state: State) -> Action:
        """
        Handle errors during step execution.

        This provides unified error handling for both SDK and legacy agents.
        Errors are logged, state is updated, and an appropriate action is returned.

        Args:
            error: The exception that occurred
            state: Current state

        Returns:
            ErrorObservation wrapped as action or NullAction
        """
        logger.error(f"Handling step error: {error}")

        # Update state to error
        state.agent_state = AgentState.ERROR
        state.last_error = str(error)

        # Create error observation
        error_obs = ErrorObservation(content=str(error))

        # Publish to event stream
        if self.event_stream:
            self.event_stream.add_event(error_obs, EventSource.AGENT)

        # Return null action to stop execution
        return NullAction()

    def get_state(self) -> State:
        """
        Get current execution state.

        Returns state from the appropriate executor:
        - SDK: Returns adapter's state
        - Legacy: Returns controller's state

        Returns:
            Current State object
        """
        if self.agent_type == AgentType.LEGACY and self.controller:
            return self.controller.get_state()
        return self.state

    def get_metrics(self) -> Metrics:
        """
        Get aggregated metrics from execution.

        Collects metrics from:
        - SDK agents: ClaudeSDKAdapter metrics
        - Legacy agents: AgentController/LLM metrics
        - ConversationStats if available

        Returns:
            Aggregated Metrics object
        """
        metrics = Metrics()

        try:
            if self.agent_type == AgentType.SDK:
                # Get SDK metrics from agent adapter
                if self.agent and hasattr(self.agent, 'adapter'):
                    adapter = self.agent.adapter
                    if hasattr(adapter, 'claude_client') and adapter.claude_client:
                        # Extract metrics from Claude SDK client if available
                        # This would need to be implemented in ClaudeSDKAdapter
                        logger.debug("Extracting SDK metrics")
                        # metrics.add_sdk_metrics(...)

            elif self.agent_type == AgentType.LEGACY:
                # Get legacy metrics from controller
                if self.controller:
                    state = self.controller.get_state()
                    if hasattr(state, 'metrics'):
                        metrics = state.metrics

            # Add conversation stats if available
            if self.conversation_stats:
                combined = self.conversation_stats.get_combined_metrics()
                if combined:
                    # Merge metrics
                    for key, value in vars(combined).items():
                        if not key.startswith('_'):
                            setattr(metrics, key, value)

        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")

        return metrics

    def is_complete(self) -> bool:
        """
        Check if execution is complete.

        Returns:
            True if agent is in terminal state (FINISHED, ERROR, STOPPED)
        """
        state = self.get_state()
        terminal_states = {AgentState.FINISHED, AgentState.ERROR, AgentState.STOPPED}
        return state.agent_state in terminal_states

    async def step_until_complete(self, max_steps: Optional[int] = None) -> State:
        """
        Execute steps until completion or max_steps reached.

        This is a convenience method for running the agent to completion.

        Args:
            max_steps: Maximum number of steps (None for unlimited)

        Returns:
            Final state
        """
        logger.info(f"Running agent until complete (max_steps: {max_steps})")

        step_count = 0
        state = self.get_state()

        while not self.is_complete():
            if max_steps and step_count >= max_steps:
                logger.warning(f"Reached max_steps ({max_steps})")
                break

            try:
                action = self.execute_step(state)

                # Handle agent finish
                if isinstance(action, AgentFinishAction):
                    state.agent_state = AgentState.FINISHED
                    break

                # Handle null action (error or no-op)
                if isinstance(action, NullAction):
                    logger.warning("Received NullAction, stopping")
                    break

                step_count += 1

                # Small delay to prevent tight loop
                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Step {step_count} failed: {e}")
                state.agent_state = AgentState.ERROR
                state.last_error = str(e)
                break

        logger.info(
            f"Agent completed: {state.agent_state.value}, "
            f"steps: {step_count}, iterations: {state.iteration}"
        )

        return state

    def get_agent_info(self) -> Dict[str, Any]:
        """
        Get information about the current agent.

        Returns:
            Dictionary with agent information including type, name, capabilities
        """
        info = {
            "agent_type": self.agent_type.value,
            "agent_name": self.agent.name if self.agent else None,
            "workspace": str(self.workspace),
            "state": self.get_state().agent_state.value,
            "iteration": self.get_state().iteration,
        }

        # Add agent-specific info
        if self.agent_type == AgentType.SDK:
            info["executor"] = "TaskOrchestrator/ClaudeSDK"
            if self.agent and hasattr(self.agent, 'adapter_config'):
                info["tools"] = self.agent.adapter_config.allowed_tools
                info["model"] = self.agent.adapter_config.model
        else:
            info["executor"] = "AgentController/LiteLLM"
            if self.agent and hasattr(self.agent, 'llm'):
                info["model"] = getattr(self.agent.llm.config, 'model', 'unknown')

        return info

    def reset(self) -> None:
        """
        Reset the adapter state.

        This resets both the state and the underlying executor
        (controller or orchestrator).
        """
        logger.info("Resetting OrchestratorAdapter")

        # Reset state
        self.state = State(
            inputs={},
            iteration=0,
            max_iterations=self.config.max_iterations,
        )
        self.state.agent_state = AgentState.INIT

        # Reset agent if available
        if self.agent:
            self.agent.reset()

        # Reset executor
        if self.controller:
            # AgentController reset
            self.controller.state = self.state

        logger.info("OrchestratorAdapter reset complete")


# Convenience function for creating adapter from config
def create_orchestrator_adapter(
    config: OpenHandsConfig,
    event_stream: EventStream,
    workspace: str,
    conversation_stats: Optional[ConversationStats] = None,
) -> OrchestratorAdapter:
    """
    Create OrchestratorAdapter from OpenHands config.

    This is a convenience function that extracts necessary parameters
    from the config object.

    Args:
        config: OpenHands configuration
        event_stream: Event stream
        workspace: Working directory
        conversation_stats: Optional conversation stats

    Returns:
        OrchestratorAdapter instance
    """
    return OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=workspace,
        conversation_stats=conversation_stats,
    )
