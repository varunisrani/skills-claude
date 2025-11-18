"""Unit tests for SDK metadata tracking in State and StateTracker."""

import tempfile
from unittest.mock import MagicMock

import pytest

from openhands.controller.state.state import State
from openhands.controller.state.state_tracker import StateTracker
from openhands.events.action.agent import AgentFinishAction
from openhands.events.action.message import MessageAction
from openhands.events.stream import EventStream
from openhands.server.services.conversation_stats import ConversationStats
from openhands.storage.files import FileStore


class TestStateSDKMetadata:
    """Test cases for SDK metadata tracking in State."""

    def setup_method(self):
        """Set up test fixtures."""
        self.state = State(session_id='test-session')

    def test_state_sdk_metadata_initialization(self):
        """Test that State initializes with None SDK metadata."""
        state = State(session_id='test-session')
        assert state.sdk_metadata is None

    def test_update_sdk_metadata(self):
        """Test updating SDK metadata creates dictionary and sets values."""
        # First update should create the dictionary
        self.state.update_sdk_metadata('model', 'claude-sonnet-4')
        assert self.state.sdk_metadata is not None
        assert self.state.sdk_metadata['model'] == 'claude-sonnet-4'

        # Second update should append to existing dictionary
        self.state.update_sdk_metadata('turn_count', 5)
        assert self.state.sdk_metadata['turn_count'] == 5
        assert self.state.sdk_metadata['model'] == 'claude-sonnet-4'

        # Update existing key
        self.state.update_sdk_metadata('turn_count', 10)
        assert self.state.sdk_metadata['turn_count'] == 10

    def test_get_sdk_metadata(self):
        """Test retrieving SDK metadata with defaults."""
        # Get from None metadata should return default
        value = self.state.get_sdk_metadata('nonexistent', 'default')
        assert value == 'default'

        # Set metadata and retrieve
        self.state.update_sdk_metadata('step_count', 3)
        assert self.state.get_sdk_metadata('step_count') == 3
        assert self.state.get_sdk_metadata('step_count', 0) == 3

        # Get nonexistent key with default
        assert self.state.get_sdk_metadata('missing', 42) == 42

        # Get nonexistent key without default
        assert self.state.get_sdk_metadata('missing') is None

    def test_update_multiple_metadata_keys(self):
        """Test updating multiple SDK metadata keys."""
        metadata_updates = {
            'model': 'claude-sonnet-4',
            'turn_count': 3,
            'token_usage': 1500,
            'step_count': 5,
            'custom_field': 'custom_value',
        }

        for key, value in metadata_updates.items():
            self.state.update_sdk_metadata(key, value)

        # Verify all updates
        for key, value in metadata_updates.items():
            assert self.state.get_sdk_metadata(key) == value

    def test_sdk_metadata_persistence(self):
        """Test that SDK metadata persists through save/restore cycle."""
        # Set up state with SDK metadata
        self.state.update_sdk_metadata('model', 'claude-sonnet-4')
        self.state.update_sdk_metadata('step_count', 5)
        self.state.update_sdk_metadata('turn_count', 3)

        # Save state
        with tempfile.TemporaryDirectory() as temp_dir:
            file_store = FileStore(temp_dir)
            self.state.save_to_session('test-session', file_store, None)

            # Restore state
            restored_state = State.restore_from_session('test-session', file_store, None)

            # Verify SDK metadata persisted
            assert restored_state.sdk_metadata is not None
            assert restored_state.get_sdk_metadata('model') == 'claude-sonnet-4'
            assert restored_state.get_sdk_metadata('step_count') == 5
            assert restored_state.get_sdk_metadata('turn_count') == 3


class TestStateTrackerSDKTracking:
    """Test cases for SDK tracking in StateTracker."""

    def setup_method(self):
        """Set up test fixtures."""
        with tempfile.TemporaryDirectory() as temp_dir:
            self.temp_dir = temp_dir
            self.file_store = FileStore(temp_dir)
            self.event_stream = EventStream('test-session', self.file_store)
            self.conversation_stats = MagicMock(spec=ConversationStats)

            self.state_tracker = StateTracker('test-session', self.file_store, None)
            self.state_tracker.set_initial_state(
                id='test-session',
                state=None,
                conversation_stats=self.conversation_stats,
                max_iterations=100,
                max_budget_per_task=None,
                confirmation_mode=False,
            )
            self.state_tracker._init_history(self.event_stream)

    def test_state_tracker_sdk_step_basic(self):
        """Test basic SDK step tracking."""
        action = MessageAction(content='Test message')
        sdk_metadata = {'model': 'claude-sonnet-4', 'turn_count': 1}

        self.state_tracker.track_sdk_step(action, sdk_metadata)

        # Verify step count incremented
        assert self.state_tracker.state.get_sdk_metadata('step_count') == 1

        # Verify action type tracked
        assert (
            self.state_tracker.state.get_sdk_metadata('last_action_type')
            == 'MessageAction'
        )

        # Verify SDK metadata stored
        assert self.state_tracker.state.get_sdk_metadata('model') == 'claude-sonnet-4'
        assert self.state_tracker.state.get_sdk_metadata('turn_count') == 1

    def test_state_tracker_sdk_step_increments(self):
        """Test that SDK step tracking increments correctly."""
        action1 = MessageAction(content='First message')
        action2 = AgentFinishAction()

        self.state_tracker.track_sdk_step(action1, None)
        assert self.state_tracker.state.get_sdk_metadata('step_count') == 1

        self.state_tracker.track_sdk_step(action2, None)
        assert self.state_tracker.state.get_sdk_metadata('step_count') == 2

    def test_state_tracker_sdk_step_token_tracking(self):
        """Test SDK token usage tracking across multiple steps."""
        action = MessageAction(content='Test message')

        # First step with tokens
        self.state_tracker.track_sdk_step(action, {'token_usage': 100})
        assert self.state_tracker.state.get_sdk_metadata('total_tokens') == 100

        # Second step with more tokens
        self.state_tracker.track_sdk_step(action, {'token_usage': 150})
        assert self.state_tracker.state.get_sdk_metadata('total_tokens') == 250

        # Third step with tokens
        self.state_tracker.track_sdk_step(action, {'token_usage': 50})
        assert self.state_tracker.state.get_sdk_metadata('total_tokens') == 300

    def test_state_tracker_sdk_step_without_metadata(self):
        """Test SDK step tracking without additional metadata."""
        action = MessageAction(content='Test message')

        self.state_tracker.track_sdk_step(action, None)

        # Verify basic tracking still works
        assert self.state_tracker.state.get_sdk_metadata('step_count') == 1
        assert (
            self.state_tracker.state.get_sdk_metadata('last_action_type')
            == 'MessageAction'
        )

        # Verify no other metadata set
        assert self.state_tracker.state.get_sdk_metadata('model') is None
        assert self.state_tracker.state.get_sdk_metadata('turn_count') is None

    def test_state_tracker_sdk_step_custom_metadata(self):
        """Test SDK step tracking with custom metadata fields."""
        action = MessageAction(content='Test message')
        custom_metadata = {
            'model': 'claude-sonnet-4',
            'turn_count': 3,
            'token_usage': 200,
            'custom_field_1': 'value1',
            'custom_field_2': 42,
            'custom_field_3': {'nested': 'data'},
        }

        self.state_tracker.track_sdk_step(action, custom_metadata)

        # Verify standard fields
        assert self.state_tracker.state.get_sdk_metadata('model') == 'claude-sonnet-4'
        assert self.state_tracker.state.get_sdk_metadata('turn_count') == 3
        assert self.state_tracker.state.get_sdk_metadata('total_tokens') == 200

        # Verify custom fields
        assert self.state_tracker.state.get_sdk_metadata('custom_field_1') == 'value1'
        assert self.state_tracker.state.get_sdk_metadata('custom_field_2') == 42
        assert self.state_tracker.state.get_sdk_metadata('custom_field_3') == {
            'nested': 'data'
        }

    def test_state_tracker_sdk_step_updates_model(self):
        """Test that model information is updated when provided."""
        action = MessageAction(content='Test message')

        # Set initial model
        self.state_tracker.track_sdk_step(action, {'model': 'claude-sonnet-3.5'})
        assert self.state_tracker.state.get_sdk_metadata('model') == 'claude-sonnet-3.5'

        # Update to different model
        self.state_tracker.track_sdk_step(action, {'model': 'claude-sonnet-4'})
        assert self.state_tracker.state.get_sdk_metadata('model') == 'claude-sonnet-4'

    def test_state_tracker_sdk_step_different_action_types(self):
        """Test SDK step tracking with different action types."""
        message_action = MessageAction(content='Test message')
        finish_action = AgentFinishAction()

        self.state_tracker.track_sdk_step(message_action, None)
        assert (
            self.state_tracker.state.get_sdk_metadata('last_action_type')
            == 'MessageAction'
        )

        self.state_tracker.track_sdk_step(finish_action, None)
        assert (
            self.state_tracker.state.get_sdk_metadata('last_action_type')
            == 'AgentFinishAction'
        )

    def test_state_tracker_sdk_metadata_with_state_save(self):
        """Test that SDK metadata persists through state save/restore."""
        action = MessageAction(content='Test message')
        sdk_metadata = {
            'model': 'claude-sonnet-4',
            'turn_count': 5,
            'token_usage': 500,
        }

        # Track SDK step
        self.state_tracker.track_sdk_step(action, sdk_metadata)

        # Save state
        self.state_tracker.save_state()

        # Create new state tracker and restore
        with tempfile.TemporaryDirectory() as temp_dir:
            file_store = FileStore(temp_dir)
            # Copy the saved state
            original_file = self.file_store.read(f'sessions/test-session/agent_state')
            file_store.write(f'sessions/test-session/agent_state', original_file)

            # Restore
            restored_state = State.restore_from_session('test-session', file_store, None)

            # Verify SDK metadata persisted
            assert restored_state.get_sdk_metadata('step_count') == 1
            assert restored_state.get_sdk_metadata('model') == 'claude-sonnet-4'
            assert restored_state.get_sdk_metadata('turn_count') == 5
            assert restored_state.get_sdk_metadata('total_tokens') == 500
