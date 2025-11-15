"""Unit tests for UnifiedErrorHandler."""

import pytest
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

from openhands.controller.error_handler import ErrorCategory, UnifiedErrorHandler
from openhands.core.exceptions import (
    AgentStuckInLoopError,
    FunctionCallNotExistsError,
    FunctionCallValidationError,
    LLMContextWindowExceedError,
    LLMMalformedActionError,
    LLMNoActionError,
    LLMResponseError,
)
from openhands.events.observation.error import ErrorObservation


class TestUnifiedErrorHandler:
    """Test cases for UnifiedErrorHandler."""

    def setup_method(self):
        """Set up test fixtures."""
        self.handler = UnifiedErrorHandler()

    def test_unified_error_handler_initialization(self):
        """Test that UnifiedErrorHandler initializes correctly."""
        handler = UnifiedErrorHandler()
        assert handler is not None
        assert handler.logger is not None

    def test_categorize_llm_error(self):
        """Test categorization of generic LLM errors."""
        error = LLMResponseError('Failed to get response')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.LLM_ERROR

        api_error = APIError('API failed')
        category = self.handler._categorize_error(api_error, 'legacy')
        assert category == ErrorCategory.LLM_ERROR

    def test_categorize_context_window_error(self):
        """Test categorization of context window errors."""
        error = ContextWindowExceededError('Context window exceeded')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.CONTEXT_WINDOW

        llm_error = LLMContextWindowExceedError()
        category = self.handler._categorize_error(llm_error, 'legacy')
        assert category == ErrorCategory.CONTEXT_WINDOW

    def test_categorize_control_flag_error(self):
        """Test categorization of control flag errors (stuck detection)."""
        error = AgentStuckInLoopError('Agent stuck in loop')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.STUCK_DETECTION

    def test_categorize_stuck_error(self):
        """Test categorization of stuck detection errors."""
        error = AgentStuckInLoopError('Agent is stuck')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.STUCK_DETECTION

    def test_categorize_unexpected_error(self):
        """Test categorization of unexpected errors."""
        error = RuntimeError('Unexpected runtime error')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.UNEXPECTED

        value_error = ValueError('Invalid value')
        category = self.handler._categorize_error(value_error, 'legacy')
        assert category == ErrorCategory.UNEXPECTED

    def test_create_error_observation(self):
        """Test creation of ErrorObservation from error."""
        error = LLMMalformedActionError('Malformed JSON')
        category = ErrorCategory.MALFORMED_ACTION
        context = {'action': 'test_action', 'step_count': 5}

        observation = self.handler._create_error_observation(error, category, context)

        assert isinstance(observation, ErrorObservation)
        assert 'MALFORMED_ACTION' in observation.content
        assert 'LLMMalformedActionError' in observation.content
        assert 'Malformed JSON' in observation.content
        assert 'Action: test_action' in observation.content
        assert 'Step: 5' in observation.content
        assert observation.error_id.startswith('LLMMalformedActionError_')

    def test_handle_error_with_context(self):
        """Test handling error with context information."""
        error = RateLimitError('Rate limit exceeded')
        context = {'action': 'test_action', 'step_count': 3}

        observation, category = self.handler.handle_error(
            error, context=context, agent_type='legacy'
        )

        assert isinstance(observation, ErrorObservation)
        assert category == ErrorCategory.RATE_LIMIT
        assert 'RATE_LIMIT' in observation.content
        assert 'RateLimitError' in observation.content

    def test_error_logging(self):
        """Test that errors are logged with structured metadata."""
        error = AuthenticationError('Invalid API key')
        context = {'action': 'test_action'}

        # This should log but not raise
        observation, category = self.handler.handle_error(
            error, context=context, agent_type='legacy'
        )

        assert category == ErrorCategory.AUTHENTICATION
        assert isinstance(observation, ErrorObservation)

    def test_sdk_error_mapping(self):
        """Test that SDK agent errors are properly mapped."""
        # Test with SDK agent type
        error = APIError('SDK API error')
        category = self.handler._categorize_error(error, 'sdk')
        assert category == ErrorCategory.LLM_ERROR

        # Test all major error types with SDK
        test_cases = [
            (AuthenticationError('auth'), ErrorCategory.AUTHENTICATION),
            (RateLimitError('rate'), ErrorCategory.RATE_LIMIT),
            (ContextWindowExceededError('context'), ErrorCategory.CONTEXT_WINDOW),
            (ServiceUnavailableError('service'), ErrorCategory.SERVICE_UNAVAILABLE),
            (InternalServerError('internal'), ErrorCategory.INTERNAL_SERVER),
        ]

        for error, expected_category in test_cases:
            category = self.handler._categorize_error(error, 'sdk')
            assert category == expected_category

    def test_categorize_authentication_error(self):
        """Test categorization of authentication errors."""
        error = AuthenticationError('Invalid API key')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.AUTHENTICATION

    def test_categorize_rate_limit_error(self):
        """Test categorization of rate limit errors."""
        error = RateLimitError('Too many requests')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.RATE_LIMIT

    def test_categorize_service_unavailable_error(self):
        """Test categorization of service unavailable errors."""
        error = ServiceUnavailableError('Service down')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.SERVICE_UNAVAILABLE

        conn_error = APIConnectionError('Connection failed')
        category = self.handler._categorize_error(conn_error, 'legacy')
        assert category == ErrorCategory.SERVICE_UNAVAILABLE

    def test_categorize_internal_server_error(self):
        """Test categorization of internal server errors."""
        error = InternalServerError('Internal error')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.INTERNAL_SERVER

    def test_categorize_content_policy_error(self):
        """Test categorization of content policy violation errors."""
        error = ContentPolicyViolationError('Content blocked')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.CONTENT_POLICY

        # Test BadRequestError with ContentPolicyViolationError message
        bad_request = BadRequestError(
            'BadRequestError: ContentPolicyViolationError: Blocked'
        )
        category = self.handler._categorize_error(bad_request, 'legacy')
        assert category == ErrorCategory.CONTENT_POLICY

    def test_categorize_malformed_action_error(self):
        """Test categorization of malformed action errors."""
        error = LLMMalformedActionError('Invalid JSON format')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.MALFORMED_ACTION

    def test_categorize_no_action_error(self):
        """Test categorization of no action errors."""
        error = LLMNoActionError('Agent did not return action')
        category = self.handler._categorize_error(error, 'legacy')
        assert category == ErrorCategory.NO_ACTION

    def test_categorize_function_call_error(self):
        """Test categorization of function call errors."""
        validation_error = FunctionCallValidationError('Invalid parameters')
        category = self.handler._categorize_error(validation_error, 'legacy')
        assert category == ErrorCategory.FUNCTION_CALL_ERROR

        not_exists_error = FunctionCallNotExistsError('Function not found')
        category = self.handler._categorize_error(not_exists_error, 'legacy')
        assert category == ErrorCategory.FUNCTION_CALL_ERROR

    def test_is_recoverable(self):
        """Test checking if error category is recoverable."""
        assert self.handler.is_recoverable(ErrorCategory.RATE_LIMIT) is True
        assert self.handler.is_recoverable(ErrorCategory.SERVICE_UNAVAILABLE) is True
        assert self.handler.is_recoverable(ErrorCategory.MALFORMED_ACTION) is True
        assert self.handler.is_recoverable(ErrorCategory.CONTEXT_WINDOW) is True

        assert self.handler.is_recoverable(ErrorCategory.AUTHENTICATION) is False
        assert self.handler.is_recoverable(ErrorCategory.CONTENT_POLICY) is False
        assert self.handler.is_recoverable(ErrorCategory.UNEXPECTED) is False

    def test_should_retry(self):
        """Test determining if error should trigger a retry."""
        # Retryable categories
        assert self.handler.should_retry(ErrorCategory.RATE_LIMIT, 0) is True
        assert self.handler.should_retry(ErrorCategory.SERVICE_UNAVAILABLE, 1) is True
        assert self.handler.should_retry(ErrorCategory.INTERNAL_SERVER, 2) is True

        # Max retries exceeded
        assert self.handler.should_retry(ErrorCategory.RATE_LIMIT, 3) is False
        assert self.handler.should_retry(ErrorCategory.SERVICE_UNAVAILABLE, 5) is False

        # Non-retryable categories
        assert self.handler.should_retry(ErrorCategory.AUTHENTICATION, 0) is False
        assert self.handler.should_retry(ErrorCategory.MALFORMED_ACTION, 0) is False
        assert self.handler.should_retry(ErrorCategory.UNEXPECTED, 0) is False

    def test_get_user_message(self):
        """Test getting user-friendly error messages."""
        test_cases = [
            (
                ErrorCategory.AUTHENTICATION,
                AuthenticationError('test'),
                'Authentication failed',
            ),
            (ErrorCategory.RATE_LIMIT, RateLimitError('test'), 'Rate limit exceeded'),
            (
                ErrorCategory.CONTEXT_WINDOW,
                ContextWindowExceededError('test'),
                'Context window exceeded',
            ),
            (
                ErrorCategory.CONTENT_POLICY,
                ContentPolicyViolationError('test'),
                'Content policy violation',
            ),
            (
                ErrorCategory.STUCK_DETECTION,
                AgentStuckInLoopError('test'),
                'Agent stuck in a loop',
            ),
        ]

        for category, error, expected_substring in test_cases:
            message = self.handler.get_user_message(category, error)
            assert expected_substring in message

    def test_handle_error_creates_valid_observation(self):
        """Test that handle_error creates a valid ErrorObservation."""
        error = LLMMalformedActionError('Test error')
        context = {'action': 'test_action', 'step_count': 1}

        observation, category = self.handler.handle_error(
            error, context=context, agent_type='legacy'
        )

        # Verify observation structure
        assert isinstance(observation, ErrorObservation)
        assert hasattr(observation, 'content')
        assert hasattr(observation, 'error_id')
        assert len(observation.content) > 0
        assert len(observation.error_id) > 0

        # Verify category is correct
        assert category == ErrorCategory.MALFORMED_ACTION

    def test_handle_error_without_context(self):
        """Test that handle_error works without context."""
        error = RateLimitError('Rate limit exceeded')

        observation, category = self.handler.handle_error(error, agent_type='legacy')

        assert isinstance(observation, ErrorObservation)
        assert category == ErrorCategory.RATE_LIMIT
        assert 'RateLimitError' in observation.content
