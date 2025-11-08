"""
SDK Agent Execution Helper for Phase 6 Integration

This module provides the SDKExecutor class, which handles the execution of SDK-based
agents in OpenHands. It encapsulates SDK-specific control flow while maintaining
compatibility with the existing State/Action/Observation model.

Key responsibilities:
- Execute SDK agent step() method with proper state management
- Validate state integrity before and after step execution
- Handle async/sync bridge (run_async pattern)
- Emit events during execution
- Map SDK exceptions to OpenHands error types
- Integrate with stuck detection and control flags

Architecture:
    SDKExecutor sits between OrchestratorAdapter and the SDK agent, providing
    a clean interface for SDK agent execution. It mirrors much of the logic in
    AgentController._step() but is specialized for SDK agents.

Usage:
    from openhands.controller.sdk_executor import SDKExecutor

    executor = SDKExecutor(
        agent=sdk_agent,
        state=state,
        event_stream=event_stream,
        headless_mode=True
    )

    # Execute a step
    action = executor.execute_step()
"""

import asyncio
import traceback
from typing import TYPE_CHECKING, Optional, Dict, Any

from openhands.core.logger import openhands_logger as logger
from openhands.core.schema import AgentState
from openhands.core.exceptions import (
    AgentStuckInLoopError,
    LLMNoActionError,
    LLMMalformedActionError,
    LLMResponseError,
    LLMContextWindowExceedError,
    FunctionCallValidationError,
    FunctionCallNotExistsError,
)
from openhands.controller.stuck import StuckDetector
from openhands.events.action import Action, NullAction
from openhands.events.observation import ErrorObservation
from openhands.events.event import EventSource

if TYPE_CHECKING:
    from openhands.controller.agent import Agent
    from openhands.controller.state.state import State
    from openhands.events.stream import EventStream


def run_async(coro):
    """
    Run async function in sync context.

    This helper enables synchronous code to call async SDK methods. It handles
    both cases where an event loop is already running (nested async context)
    and where no loop exists.

    Args:
        coro: Async coroutine to execute

    Returns:
        Result of the coroutine

    Raises:
        Any exception raised by the coroutine
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # Already in async context, need nest_asyncio
        try:
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(coro)
        except ImportError:
            logger.error("nest_asyncio not available, cannot run async in nested context")
            raise RuntimeError(
                "Cannot run async coroutine in nested async context without nest_asyncio. "
                "Install with: pip install nest-asyncio"
            )
    else:
        # Create new event loop
        return asyncio.run(coro)


class SDKExecutor:
    """
    Executor for SDK-based agents.

    This class provides the execution logic for agents that use Claude SDK
    (or other SDK-based implementations) instead of legacy LiteLLM-based agents.
    It handles the complete step execution cycle including:

    - State validation before step
    - Stuck detection (loop detection)
    - Control flag checking (iteration/budget limits)
    - Agent step execution via SDK
    - Action validation after step
    - Error handling and mapping to OpenHands error types
    - Event emission
    - State updates

    The SDKExecutor is designed to be used by OrchestratorAdapter as part of
    Phase 6 SDK integration. It provides a clean separation between SDK agent
    execution and legacy agent execution.
    """

    def __init__(
        self,
        agent: 'Agent',
        state: 'State',
        event_stream: 'EventStream',
        headless_mode: bool = True,
        confirmation_mode: bool = False,
    ):
        """
        Initialize SDK executor.

        Args:
            agent: SDK-based agent instance (must have adapter attribute)
            state: Current OpenHands state
            event_stream: Event stream for publishing events
            headless_mode: Whether running in headless (automated) mode
            confirmation_mode: Whether to require user confirmation for actions
        """
        self.agent = agent
        self.state = state
        self.event_stream = event_stream
        self.headless_mode = headless_mode
        self.confirmation_mode = confirmation_mode

        # Initialize stuck detector
        self.stuck_detector = StuckDetector(state)

        # Track pending action (waiting for observation)
        self._pending_action: Optional[Action] = None

        # Validate that agent has adapter
        if not hasattr(agent, 'adapter'):
            raise ValueError(
                f"Agent {agent.__class__.__name__} does not have an adapter. "
                "SDKExecutor requires agents with ClaudeSDKAdapter or similar."
            )

        logger.info(
            f"SDKExecutor initialized for {agent.__class__.__name__}",
            extra={'agent_type': agent.__class__.__name__}
        )

    def execute_step(self) -> Action:
        """
        Execute a single SDK agent step.

        This is the main entry point for step execution. It orchestrates the
        complete step cycle:

        1. Validate state (must be RUNNING, no pending action)
        2. Check for stuck/loop condition
        3. Check control flags (iteration/budget limits)
        4. Execute agent.step(state) via SDK
        5. Validate returned action
        6. Handle any errors
        7. Update state metadata
        8. Return action

        Returns:
            Action to execute (may be NullAction if validation fails)

        Error Handling:
            - LLM errors: Converted to ErrorObservation, returns NullAction
            - SDK errors: Mapped to OpenHands errors, may set state to ERROR
            - Validation errors: Logged and returns NullAction
            - Unexpected errors: Logged with stack trace, returns NullAction
        """
        # Step 1: Validate state before execution
        if not self._validate_pre_step():
            return NullAction()

        logger.debug(
            f"Executing SDK step - Delegate Level: {self.state.delegate_level}, "
            f"Local Step: {self.state.get_local_step()}, "
            f"Global Step: {self.state.iteration_flag.current_value}",
            extra={'msg_type': 'SDK_STEP'}
        )

        # Step 2: Check for stuck condition
        if self._is_stuck():
            self._handle_stuck_error()
            return NullAction()

        # Step 3: Check control flags (iteration and budget limits)
        if not self._check_control_flags():
            return NullAction()

        # Step 4: Execute agent step via SDK
        action: Action = NullAction()

        try:
            # Call agent.step(state) - SDK agents handle async internally
            action = self.agent.step(self.state)

            if action is None:
                raise LLMNoActionError('No action was returned from SDK agent')

            # Mark action source
            action._source = EventSource.AGENT  # type: ignore [attr-defined]

            logger.info(
                f"SDK agent returned action: {action.__class__.__name__}",
                extra={'action_type': action.__class__.__name__}
            )

        except (
            LLMMalformedActionError,
            LLMNoActionError,
            LLMResponseError,
            FunctionCallValidationError,
            FunctionCallNotExistsError,
        ) as e:
            # These are LLM-level errors that should be sent back to the agent
            logger.warning(
                f"LLM error during SDK step: {e}",
                extra={'error_type': type(e).__name__}
            )
            self._emit_error_observation(str(e))
            return NullAction()

        except LLMContextWindowExceedError as e:
            # Context window exceeded - may trigger condensation
            logger.error(
                f"Context window exceeded in SDK agent: {e}",
                extra={'error_type': 'context_window'}
            )
            self._handle_context_window_error(e)
            return NullAction()

        except Exception as e:
            # Unexpected error - log and convert to ErrorObservation
            logger.error(
                f"Unexpected error during SDK step execution: {e}",
                exc_info=True,
                extra={'error_type': type(e).__name__}
            )
            self._handle_unexpected_error(e)
            return NullAction()

        # Step 5: Validate action
        if not self._validate_action(action):
            logger.warning(
                f"Action validation failed for {action.__class__.__name__}",
                extra={'action_type': action.__class__.__name__}
            )
            return NullAction()

        # Step 6: Update state metadata
        self._update_state_metadata(action)

        return action

    def _validate_pre_step(self) -> bool:
        """
        Validate state before step execution.

        Checks:
        - Agent state must be RUNNING
        - No pending action waiting for observation

        Returns:
            True if state is valid for stepping, False otherwise
        """
        # Check agent state
        if self.state.agent_state != AgentState.RUNNING:
            logger.debug(
                f'SDK agent not stepping because state is {self.state.agent_state} (not RUNNING)',
                extra={'msg_type': 'SDK_STEP_BLOCKED_STATE', 'state': self.state.agent_state}
            )
            return False

        # Check for pending action
        if self._pending_action:
            action_id = getattr(self._pending_action, 'id', 'unknown')
            action_type = type(self._pending_action).__name__
            logger.debug(
                f'SDK agent not stepping because of pending action: {action_type} (id={action_id})',
                extra={'msg_type': 'SDK_STEP_BLOCKED_PENDING_ACTION'}
            )
            return False

        return True

    def _is_stuck(self) -> bool:
        """
        Check if agent is stuck in a loop.

        Uses StuckDetector to analyze the state history and detect
        repeated action-observation cycles.

        Returns:
            True if stuck, False otherwise
        """
        try:
            is_stuck = self.stuck_detector.is_stuck(headless_mode=self.headless_mode)

            if is_stuck:
                logger.warning(
                    "SDK agent detected stuck in loop",
                    extra={'msg_type': 'SDK_STUCK_DETECTED'}
                )

            return is_stuck

        except Exception as e:
            logger.error(
                f"Error in stuck detection: {e}",
                exc_info=True
            )
            # Don't block on stuck detection errors
            return False

    def _check_control_flags(self) -> bool:
        """
        Check control flags (iteration and budget limits).

        Returns:
            True if control flags allow stepping, False otherwise
        """
        try:
            # This may raise an exception if limits are exceeded
            self.state.iteration_flag.check()

            if self.state.budget_flag:
                self.state.budget_flag.check()

            return True

        except Exception as e:
            logger.warning(
                f"Control flag limits hit: {e}",
                extra={'msg_type': 'SDK_CONTROL_FLAG_LIMIT'}
            )
            self._handle_control_flag_error(e)
            return False

    def _validate_action(self, action: Action) -> bool:
        """
        Validate action after step execution.

        Checks:
        - Action is not None
        - Action is an Action instance
        - Action has required attributes

        Args:
            action: Action to validate

        Returns:
            True if action is valid, False otherwise
        """
        if action is None:
            logger.error("Action is None after SDK step")
            return False

        if not isinstance(action, Action):
            logger.error(
                f"Invalid action type: {type(action)}. Expected Action instance.",
                extra={'action_type': type(action).__name__}
            )
            return False

        # Action is valid
        return True

    def _update_state_metadata(self, action: Action) -> None:
        """
        Update state metadata after successful step.

        This can be extended to track SDK-specific metrics like:
        - Turn count
        - Message count
        - Model used
        - Token usage

        Args:
            action: Action that was executed
        """
        # Update SDK metadata if state has it
        if hasattr(self.state, 'sdk_metadata'):
            if not isinstance(self.state.sdk_metadata, dict):
                self.state.sdk_metadata = {}

            # Track step count
            step_count = self.state.sdk_metadata.get('step_count', 0)
            self.state.sdk_metadata['step_count'] = step_count + 1

            # Track last action type
            self.state.sdk_metadata['last_action_type'] = action.__class__.__name__

            # Track agent type
            self.state.sdk_metadata['agent_type'] = self.agent.__class__.__name__

        logger.debug(
            f"Updated state metadata after SDK step",
            extra={'step_count': self.state.sdk_metadata.get('step_count') if hasattr(self.state, 'sdk_metadata') else 0}
        )

    def _handle_stuck_error(self) -> None:
        """
        Handle stuck/loop detection error.

        Sets state to ERROR and emits appropriate observation.
        """
        error_msg = "Agent got stuck in a loop"
        logger.error(error_msg, extra={'msg_type': 'SDK_STUCK_ERROR'})

        self.state.agent_state = AgentState.ERROR
        self.state.last_error = error_msg

        self._emit_error_observation(error_msg)

    def _handle_control_flag_error(self, error: Exception) -> None:
        """
        Handle control flag limit errors.

        Sets state to ERROR with appropriate message.

        Args:
            error: The control flag exception
        """
        error_msg = f"Control limit exceeded: {str(error)}"
        logger.error(error_msg, extra={'msg_type': 'SDK_CONTROL_FLAG_ERROR'})

        self.state.agent_state = AgentState.ERROR
        self.state.last_error = error_msg

        self._emit_error_observation(error_msg)

    def _handle_context_window_error(self, error: LLMContextWindowExceedError) -> None:
        """
        Handle context window exceeded error.

        May trigger condensation if enabled, otherwise sets ERROR state.

        Args:
            error: The context window error
        """
        error_msg = str(error)

        # Check if condensation is enabled
        enable_condensation = getattr(self.agent.config, 'enable_history_truncation', False)

        if enable_condensation:
            logger.warning(
                "Context window exceeded, requesting condensation",
                extra={'msg_type': 'SDK_CONTEXT_WINDOW_CONDENSATION'}
            )
            # Import here to avoid circular dependency
            from openhands.events.action import CondensationRequestAction

            # Emit condensation request
            self.event_stream.add_event(
                CondensationRequestAction(),
                EventSource.AGENT
            )
        else:
            logger.error(
                "Context window exceeded and condensation disabled",
                extra={'msg_type': 'SDK_CONTEXT_WINDOW_ERROR'}
            )
            self.state.agent_state = AgentState.ERROR
            self.state.last_error = error_msg
            self._emit_error_observation(error_msg)

    def _handle_unexpected_error(self, error: Exception) -> None:
        """
        Handle unexpected errors during step execution.

        Logs error with stack trace and sets state to ERROR.

        Args:
            error: The unexpected exception
        """
        error_msg = f"Unexpected error in SDK step: {str(error)}"
        stack_trace = traceback.format_exc()

        logger.error(
            f"{error_msg}\n{stack_trace}",
            extra={'msg_type': 'SDK_UNEXPECTED_ERROR', 'error_type': type(error).__name__}
        )

        self.state.agent_state = AgentState.ERROR
        self.state.last_error = error_msg

        self._emit_error_observation(f"{error_msg}\n\nStack trace:\n{stack_trace[:500]}")

    def _emit_error_observation(self, content: str) -> None:
        """
        Emit an error observation to the event stream.

        Args:
            content: Error message content
        """
        try:
            self.event_stream.add_event(
                ErrorObservation(content=content),
                EventSource.AGENT
            )
            logger.debug("Emitted error observation to event stream")
        except Exception as e:
            logger.error(
                f"Failed to emit error observation: {e}",
                exc_info=True
            )

    def set_pending_action(self, action: Optional[Action]) -> None:
        """
        Set or clear the pending action.

        A pending action is one that has been emitted but is waiting for
        an observation to be received before the next step can execute.

        Args:
            action: Action to set as pending, or None to clear
        """
        self._pending_action = action

        if action:
            logger.debug(
                f"Set pending action: {action.__class__.__name__}",
                extra={'action_type': action.__class__.__name__}
            )
        else:
            logger.debug("Cleared pending action")

    def get_state(self) -> 'State':
        """
        Get the current state.

        Returns:
            Current OpenHands state
        """
        return self.state

    def reset(self) -> None:
        """
        Reset executor state.

        Clears pending action and resets stuck detector.
        """
        logger.debug("Resetting SDKExecutor")
        self._pending_action = None
        self.stuck_detector = StuckDetector(self.state)
