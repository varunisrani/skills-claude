"""Unified error handler for SDK and legacy agents.

This module provides a unified error handling interface that maps errors from both
LiteLLM (legacy agents) and Claude SDK (SDK agents) to OpenHands error types.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Optional, Tuple

from litellm.exceptions import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    BadRequestError,
    ContentPolicyViolationError,
    ContextWindowExceededError,
    InternalServerError,
    RateLimitError,
    ServiceUnavailableError,
)

from openhands.core.exceptions import (
    AgentStuckInLoopError,
    FunctionCallNotExistsError,
    FunctionCallValidationError,
    LLMContextWindowExceedError,
    LLMMalformedActionError,
    LLMNoActionError,
    LLMResponseError,
)
from openhands.core.logger import openhands_logger as logger
from openhands.events.observation.error import ErrorObservation

if TYPE_CHECKING:
    from openhands.controller.state.state import State


class ErrorCategory:
    """Error categories for unified handling."""

    LLM_ERROR = 'llm_error'
    CONTEXT_WINDOW = 'context_window'
    CONTROL_FLAG = 'control_flag'
    STUCK_DETECTION = 'stuck_detection'
    UNEXPECTED = 'unexpected'
    AUTHENTICATION = 'authentication'
    RATE_LIMIT = 'rate_limit'
    SERVICE_UNAVAILABLE = 'service_unavailable'
    INTERNAL_SERVER = 'internal_server'
    CONTENT_POLICY = 'content_policy'
    MALFORMED_ACTION = 'malformed_action'
    NO_ACTION = 'no_action'
    FUNCTION_CALL_ERROR = 'function_call_error'


class UnifiedErrorHandler:
    """Handle errors from both SDK and legacy agents.

    This class provides a unified interface for handling errors from different
    agent types, mapping them to appropriate OpenHands error types and categories.
    """

    def __init__(self):
        """Initialize the unified error handler."""
        self.logger = logger

    def handle_error(
        self,
        error: Exception,
        context: Optional[dict[str, Any]] = None,
        agent_type: str = 'legacy',
    ) -> Tuple[ErrorObservation, str]:
        """Handle error and return observation + category.

        Args:
            error: The exception that occurred
            context: Additional context about the error (state, action, etc.)
            agent_type: Type of agent ('legacy' or 'sdk')

        Returns:
            Tuple of (ErrorObservation, error_category)
        """
        if context is None:
            context = {}

        # Categorize the error
        category = self._categorize_error(error, agent_type)

        # Create error observation
        observation = self._create_error_observation(error, category, context)

        # Log error with structured metadata
        self._log_error(error, category, context, agent_type)

        return observation, category

    def _categorize_error(self, error: Exception, agent_type: str) -> str:
        """Categorize error into one of the error categories.

        Args:
            error: The exception to categorize
            agent_type: Type of agent ('legacy' or 'sdk')

        Returns:
            Error category string
        """
        # Handle stuck detection errors
        if isinstance(error, AgentStuckInLoopError):
            return ErrorCategory.STUCK_DETECTION

        # Handle context window errors
        if isinstance(
            error, (ContextWindowExceededError, LLMContextWindowExceedError)
        ):
            return ErrorCategory.CONTEXT_WINDOW

        # Handle authentication errors
        if isinstance(error, AuthenticationError):
            return ErrorCategory.AUTHENTICATION

        # Handle rate limit errors
        if isinstance(error, RateLimitError):
            return ErrorCategory.RATE_LIMIT

        # Handle service unavailable errors
        if isinstance(error, (ServiceUnavailableError, APIConnectionError)):
            return ErrorCategory.SERVICE_UNAVAILABLE

        # Handle internal server errors
        if isinstance(error, InternalServerError):
            return ErrorCategory.INTERNAL_SERVER

        # Handle content policy violations
        if isinstance(error, ContentPolicyViolationError) or (
            isinstance(error, BadRequestError)
            and 'ContentPolicyViolationError' in str(error)
        ):
            return ErrorCategory.CONTENT_POLICY

        # Handle malformed action errors
        if isinstance(error, LLMMalformedActionError):
            return ErrorCategory.MALFORMED_ACTION

        # Handle no action errors
        if isinstance(error, LLMNoActionError):
            return ErrorCategory.NO_ACTION

        # Handle function call errors
        if isinstance(error, (FunctionCallValidationError, FunctionCallNotExistsError)):
            return ErrorCategory.FUNCTION_CALL_ERROR

        # Handle generic LLM errors
        if isinstance(error, (LLMResponseError, APIError, BadRequestError)):
            return ErrorCategory.LLM_ERROR

        # Handle SDK-specific errors (placeholder for future SDK error types)
        if agent_type == 'sdk':
            # Future: Map Claude SDK specific errors here
            # For now, treat as LLM errors
            return ErrorCategory.LLM_ERROR

        # Default to unexpected
        return ErrorCategory.UNEXPECTED

    def _create_error_observation(
        self, error: Exception, category: str, context: dict[str, Any]
    ) -> ErrorObservation:
        """Create ErrorObservation from error.

        Args:
            error: The exception that occurred
            category: The error category
            context: Additional context

        Returns:
            ErrorObservation instance
        """
        # Build error message
        error_type = type(error).__name__
        error_msg = str(error)

        # Create content with category information
        content = f'[{category.upper()}] {error_type}: {error_msg}'

        # Add context information if available
        if context:
            if 'action' in context:
                content += f'\nAction: {context["action"]}'
            if 'step_count' in context:
                content += f'\nStep: {context["step_count"]}'

        # Create and return error observation
        return ErrorObservation(
            content=content,
            error_id=f'{error_type}_{id(error)}',
        )

    def _log_error(
        self,
        error: Exception,
        category: str,
        context: dict[str, Any],
        agent_type: str,
    ) -> None:
        """Log error with structured metadata.

        Args:
            error: The exception that occurred
            category: The error category
            context: Additional context
            agent_type: Type of agent
        """
        error_type = type(error).__name__
        error_msg = str(error)

        # Build structured log message
        log_data = {
            'error_type': error_type,
            'error_category': category,
            'agent_type': agent_type,
            'error_message': error_msg,
        }

        # Add context data
        if context:
            log_data['context'] = context

        # Log based on category severity
        if category in (
            ErrorCategory.AUTHENTICATION,
            ErrorCategory.CONTENT_POLICY,
            ErrorCategory.UNEXPECTED,
        ):
            self.logger.error(
                f'Critical error in {agent_type} agent: {error_type}',
                extra=log_data,
                exc_info=True,
            )
        elif category in (
            ErrorCategory.RATE_LIMIT,
            ErrorCategory.SERVICE_UNAVAILABLE,
            ErrorCategory.INTERNAL_SERVER,
        ):
            self.logger.warning(
                f'Service error in {agent_type} agent: {error_type}',
                extra=log_data,
            )
        else:
            self.logger.info(
                f'Recoverable error in {agent_type} agent: {error_type}',
                extra=log_data,
            )

    def is_recoverable(self, category: str) -> bool:
        """Check if an error category is recoverable.

        Args:
            category: The error category

        Returns:
            True if the error is recoverable, False otherwise
        """
        recoverable_categories = {
            ErrorCategory.RATE_LIMIT,
            ErrorCategory.SERVICE_UNAVAILABLE,
            ErrorCategory.MALFORMED_ACTION,
            ErrorCategory.NO_ACTION,
            ErrorCategory.FUNCTION_CALL_ERROR,
            ErrorCategory.CONTEXT_WINDOW,
        }
        return category in recoverable_categories

    def should_retry(self, category: str, retry_count: int = 0) -> bool:
        """Determine if an error should trigger a retry.

        Args:
            category: The error category
            retry_count: Number of retries already attempted

        Returns:
            True if should retry, False otherwise
        """
        max_retries = 3

        if retry_count >= max_retries:
            return False

        retryable_categories = {
            ErrorCategory.RATE_LIMIT,
            ErrorCategory.SERVICE_UNAVAILABLE,
            ErrorCategory.INTERNAL_SERVER,
        }

        return category in retryable_categories

    def get_user_message(self, category: str, error: Exception) -> str:
        """Get a user-friendly error message.

        Args:
            category: The error category
            error: The exception that occurred

        Returns:
            User-friendly error message
        """
        category_messages = {
            ErrorCategory.AUTHENTICATION: 'Authentication failed. Please check your API credentials.',
            ErrorCategory.RATE_LIMIT: 'Rate limit exceeded. The agent will retry automatically.',
            ErrorCategory.CONTEXT_WINDOW: 'Context window exceeded. Consider enabling history truncation.',
            ErrorCategory.CONTENT_POLICY: 'Content policy violation. Please rephrase your request.',
            ErrorCategory.SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Retrying...',
            ErrorCategory.INTERNAL_SERVER: 'Internal server error. The agent will retry.',
            ErrorCategory.STUCK_DETECTION: 'Agent stuck in a loop. Consider resetting or providing different instructions.',
            ErrorCategory.MALFORMED_ACTION: 'The agent produced a malformed action. Retrying...',
            ErrorCategory.NO_ACTION: 'The agent did not produce an action. Retrying...',
            ErrorCategory.FUNCTION_CALL_ERROR: 'Function call error. The agent will retry.',
            ErrorCategory.LLM_ERROR: f'LLM error: {str(error)}',
            ErrorCategory.UNEXPECTED: f'Unexpected error: {str(error)}',
        }

        return category_messages.get(
            category, f'An error occurred: {type(error).__name__}'
        )
