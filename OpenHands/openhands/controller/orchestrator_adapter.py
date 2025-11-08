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

from typing import Optional, Callable, Any, Dict
import asyncio
import logging
from pathlib import Path

from openhands.controller.state.state import State
from openhands.core.config import OpenHandsConfig, AgentConfig
from openhands.core.schema import AgentState
from openhands.events import EventStream, EventSource
from openhands.events.action import Action, MessageAction, AgentFinishAction
from openhands.events.observation import Observation, AgentStateChangedObservation
from openhands.orchestrator import TaskOrchestrator, TaskStatus
from openhands.server.services.conversation_stats import ConversationStats

logger = logging.getLogger(__name__)


class OrchestratorAdapter:
    """
    Adapter that makes TaskOrchestrator compatible with AgentController interface.

    This provides backward compatibility while enabling migration to the
    Claude Agent SDK-based architecture.

    Key differences from AgentController:
    - Simplified state management (no complex event loop)
    - Delegated execution to Claude Code agents
    - Cleaner error handling
    - Better separation of concerns

    Attributes:
        orchestrator: The underlying TaskOrchestrator
        event_stream: OpenHands event stream for compatibility
        state: Current execution state
        config: OpenHands configuration
    """

    def __init__(
        self,
        config: OpenHandsConfig,
        event_stream: EventStream,
        workspace: str,
        api_key: Optional[str] = None,
        conversation_stats: Optional[ConversationStats] = None,
        max_retries: int = 3,
        progress_callback: Optional[Callable] = None,
    ):
        """
        Initialize the adapter.

        Args:
            config: OpenHands configuration
            event_stream: Event stream for publishing events
            workspace: Working directory
            api_key: Anthropic API key (will use config if not provided)
            conversation_stats: Conversation statistics tracker
            max_retries: Maximum retry attempts
            progress_callback: Optional progress callback
        """
        self.config = config
        self.event_stream = event_stream
        self.workspace = Path(workspace).resolve()
        self.conversation_stats = conversation_stats

        # Get API key from config if not provided
        if api_key is None:
            api_key = getattr(config.llm, 'api_key', None)
            if api_key is None:
                raise ValueError("API key must be provided or set in config")

        # Initialize TaskOrchestrator
        self.orchestrator = TaskOrchestrator(
            workspace=str(self.workspace),
            api_key=api_key,
            max_retries=max_retries,
            progress_callback=self._handle_progress
        )

        # Initialize state
        self.state = State(
            inputs={},
            iteration=0,
            max_iterations=config.max_iterations,
        )
        self.state.agent_state = AgentState.INIT

        # Store callback
        self._user_progress_callback = progress_callback

        logger.info(f"OrchestratorAdapter initialized for workspace: {self.workspace}")

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
        await self.orchestrator.__aexit__(exc_type, exc_val, exc_tb)

    def close(self):
        """Close the adapter and cleanup resources."""
        # TaskOrchestrator cleanup is handled by context manager
        logger.info("OrchestratorAdapter closed")


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
