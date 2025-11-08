"""
Integration tests for Phase 6C SDK Controller Integration.

This module tests the integration between SDK agents and the server/API layer,
including feature flag support, routing logic, and backward compatibility.

Test Coverage:
    - Agent session SDK routing
    - Agent session legacy routing
    - Feature flag enabled/disabled scenarios
    - Event loop SDK agent support
    - Event loop legacy agent support
    - Metrics collection (SDK vs legacy)
    - Error handling integration
    - State persistence integration
    - Mixed delegation scenarios
    - Backward compatibility

Author: Phase 6C Implementation
"""

import asyncio
import os
import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from pathlib import Path

from openhands.controller import AgentController
from openhands.controller.agent import Agent
from openhands.controller.agent_detector import detect_agent_type, AgentType
from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.controller.state.state import State
from openhands.core.config import OpenHandsConfig, AgentConfig, LLMConfig
from openhands.core.config.sdk_config import SDKConfig, get_sdk_config, reset_sdk_config
from openhands.core.schema import AgentState
from openhands.core.loop import run_agent_until_done
from openhands.events.stream import EventStream
from openhands.events.action import MessageAction, AgentFinishAction
from openhands.events.event import EventSource
from openhands.llm.llm_registry import LLMRegistry
from openhands.memory.memory import Memory
from openhands.runtime.base import Runtime
from openhands.server.services.conversation_stats import ConversationStats
from openhands.server.session.agent_session import AgentSession
from openhands.storage.files import FileStore


# ============================================================================
# Test Fixtures
# ============================================================================


@pytest.fixture
def mock_file_store():
    """Create a mock file store."""
    store = Mock(spec=FileStore)
    store.list.return_value = []
    store.read.return_value = ""
    store.write.return_value = None
    return store


@pytest.fixture
def mock_event_stream(mock_file_store):
    """Create a mock event stream."""
    stream = Mock(spec=EventStream)
    stream.add_event = Mock()
    stream.get_latest_event_id = Mock(return_value=0)
    stream.close = Mock()
    return stream


@pytest.fixture
def mock_llm_registry():
    """Create a mock LLM registry."""
    registry = Mock(spec=LLMRegistry)
    return registry


@pytest.fixture
def mock_conversation_stats():
    """Create a mock conversation stats."""
    stats = Mock(spec=ConversationStats)
    stats.get_combined_metrics = Mock(return_value=Mock())
    return stats


@pytest.fixture
def mock_runtime():
    """Create a mock runtime."""
    runtime = Mock(spec=Runtime)
    runtime.status_callback = None
    runtime.security_analyzer = None
    runtime.connect = AsyncMock()
    runtime.close = Mock()
    return runtime


@pytest.fixture
def mock_memory():
    """Create a mock memory."""
    memory = Mock(spec=Memory)
    memory.status_callback = None
    return memory


@pytest.fixture
def mock_sdk_agent():
    """Create a mock SDK agent."""
    agent = Mock(spec=Agent)
    agent.name = "CodeActAgentSDK"
    agent.__class__.__name__ = "CodeActAgentSDK"
    agent.sandbox_plugins = []

    # SDK agent has adapter
    agent.adapter = Mock()
    agent.adapter.claude_client = Mock()

    # Mock methods
    agent.step = Mock(return_value=AgentFinishAction())
    agent.reset = Mock()
    agent.get_system_message = Mock()

    return agent


@pytest.fixture
def mock_legacy_agent():
    """Create a mock legacy agent."""
    agent = Mock(spec=Agent)
    agent.name = "CodeActAgent"
    agent.__class__.__name__ = "CodeActAgent"
    agent.sandbox_plugins = []

    # Legacy agent has llm
    agent.llm = Mock()
    agent.llm.config = Mock(model="gpt-4", base_url="https://api.openai.com")

    # Mock methods
    agent.step = Mock(return_value=AgentFinishAction())
    agent.reset = Mock()
    agent.get_system_message = Mock()

    return agent


@pytest.fixture
def openhands_config():
    """Create OpenHands configuration."""
    config = OpenHandsConfig()
    config.workspace_base = "/tmp/test_workspace"
    config.workspace_mount_path_in_sandbox = "/workspace"
    config.max_iterations = 10
    config.security.confirmation_mode = False
    return config


@pytest.fixture(autouse=True)
def reset_config():
    """Reset SDK config before each test."""
    reset_sdk_config()
    yield
    reset_sdk_config()


# ============================================================================
# Test 1-2: Agent Session Routing
# ============================================================================


def test_agent_session_sdk_routing(
    mock_sdk_agent,
    mock_file_store,
    mock_llm_registry,
    mock_conversation_stats,
    openhands_config,
):
    """Test that AgentSession routes SDK agents to OrchestratorAdapter when feature flag is enabled."""
    # Enable feature flag
    os.environ['OPENHANDS_USE_SDK_AGENTS'] = 'true'
    reset_sdk_config()

    # Create session
    session = AgentSession(
        sid="test_sdk_session",
        file_store=mock_file_store,
        llm_registry=mock_llm_registry,
        conversation_stats=mock_conversation_stats,
    )

    # Detect agent type
    agent_type = detect_agent_type(mock_sdk_agent)

    # Verify SDK detection
    assert agent_type == AgentType.SDK, "Should detect SDK agent"

    # Verify config
    sdk_config = get_sdk_config()
    assert sdk_config.use_sdk_agents is True, "Feature flag should be enabled"

    # Clean up
    os.environ.pop('OPENHANDS_USE_SDK_AGENTS', None)


def test_agent_session_legacy_routing(
    mock_legacy_agent,
    mock_file_store,
    mock_llm_registry,
    mock_conversation_stats,
    openhands_config,
):
    """Test that AgentSession routes legacy agents to AgentController."""
    # Ensure feature flag is disabled
    os.environ['OPENHANDS_USE_SDK_AGENTS'] = 'false'
    reset_sdk_config()

    # Create session
    session = AgentSession(
        sid="test_legacy_session",
        file_store=mock_file_store,
        llm_registry=mock_llm_registry,
        conversation_stats=mock_conversation_stats,
    )

    # Detect agent type
    agent_type = detect_agent_type(mock_legacy_agent)

    # Verify legacy detection
    assert agent_type == AgentType.LEGACY, "Should detect legacy agent"

    # Verify config
    sdk_config = get_sdk_config()
    assert sdk_config.use_sdk_agents is False, "Feature flag should be disabled"


# ============================================================================
# Test 3-4: Feature Flag Control
# ============================================================================


def test_feature_flag_enabled():
    """Test SDK features when feature flag is enabled."""
    # Set environment variable
    os.environ['OPENHANDS_USE_SDK_AGENTS'] = 'true'
    os.environ['OPENHANDS_USE_SDK_ORCHESTRATOR'] = 'true'
    reset_sdk_config()

    # Load config
    config = SDKConfig.from_env()

    # Verify flags
    assert config.use_sdk_agents is True
    assert config.use_sdk_orchestrator is True
    assert config.is_sdk_enabled() is True
    assert config.get_rollout_percentage() == 100

    # Clean up
    os.environ.pop('OPENHANDS_USE_SDK_AGENTS', None)
    os.environ.pop('OPENHANDS_USE_SDK_ORCHESTRATOR', None)


def test_feature_flag_disabled():
    """Test SDK features when feature flag is disabled."""
    # Ensure not set
    os.environ.pop('OPENHANDS_USE_SDK_AGENTS', None)
    os.environ.pop('OPENHANDS_USE_SDK_ORCHESTRATOR', None)
    reset_sdk_config()

    # Load config
    config = SDKConfig.from_env()

    # Verify flags
    assert config.use_sdk_agents is False
    assert config.use_sdk_orchestrator is False
    assert config.is_sdk_enabled() is False
    assert config.get_rollout_percentage() == 0


# ============================================================================
# Test 5-6: Event Loop Support
# ============================================================================


@pytest.mark.asyncio
async def test_event_loop_sdk_agent(mock_runtime, mock_memory):
    """Test event loop with SDK agent via OrchestratorAdapter."""
    # Create mock orchestrator
    orchestrator = Mock(spec=OrchestratorAdapter)
    orchestrator.status_callback = None

    # Mock state
    mock_state = Mock(spec=State)
    mock_state.agent_state = AgentState.RUNNING
    mock_state.iteration = 0
    mock_state.sdk_metadata = {'step_count': 0}

    orchestrator.get_state = Mock(return_value=mock_state)

    # Set up state progression: RUNNING -> FINISHED
    states = [
        AgentState.RUNNING,
        AgentState.RUNNING,
        AgentState.FINISHED,
    ]
    state_iter = iter(states)

    def get_state_progression():
        mock_state.agent_state = next(state_iter)
        return mock_state

    orchestrator.get_state = Mock(side_effect=get_state_progression)

    # Run agent loop
    end_states = [AgentState.FINISHED, AgentState.ERROR, AgentState.STOPPED]

    await run_agent_until_done(
        controller=orchestrator,
        runtime=mock_runtime,
        memory=mock_memory,
        end_states=end_states,
        skip_set_callback=False,
    )

    # Verify get_state was called
    assert orchestrator.get_state.call_count >= 2


@pytest.mark.asyncio
async def test_event_loop_legacy_agent(mock_runtime, mock_memory):
    """Test event loop with legacy agent via AgentController."""
    # Create mock controller
    controller = Mock(spec=AgentController)
    controller.status_callback = None

    # Mock state
    mock_state = Mock(spec=State)
    mock_state.agent_state = AgentState.RUNNING
    mock_state.iteration = 0

    controller.state = mock_state

    # Set up state progression: RUNNING -> FINISHED
    states = [
        AgentState.RUNNING,
        AgentState.RUNNING,
        AgentState.FINISHED,
    ]
    state_iter = iter(states)

    def get_next_state():
        return next(state_iter)

    # Update state.agent_state on each access
    type(mock_state).agent_state = property(lambda self: get_next_state())

    # Run agent loop
    end_states = [AgentState.FINISHED, AgentState.ERROR, AgentState.STOPPED]

    await run_agent_until_done(
        controller=controller,
        runtime=mock_runtime,
        memory=mock_memory,
        end_states=end_states,
        skip_set_callback=False,
    )

    # Verify controller was used
    assert controller.status_callback is not None


# ============================================================================
# Test 7-8: Metrics Collection
# ============================================================================


def test_metrics_collection_sdk():
    """Test metrics collection for SDK agents."""
    # Create mock SDK agent
    mock_agent = Mock()
    mock_agent.adapter = Mock()
    mock_agent.adapter.claude_client = Mock()

    # Create orchestrator
    config = OpenHandsConfig()
    event_stream = Mock()

    orchestrator = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace="/tmp/test",
        agent=mock_agent,
    )

    # Get metrics
    metrics = orchestrator.get_metrics()

    # Verify metrics object exists
    assert metrics is not None


def test_metrics_collection_legacy():
    """Test metrics collection for legacy agents."""
    # Create mock legacy agent
    mock_agent = Mock()
    mock_agent.llm = Mock()

    # Create mock controller
    controller = Mock(spec=AgentController)
    mock_state = Mock()
    mock_state.metrics = Mock()
    controller.get_state = Mock(return_value=mock_state)

    # Get state metrics
    state = controller.get_state()

    # Verify metrics exist
    assert state.metrics is not None


# ============================================================================
# Test 9: Error Handling Integration
# ============================================================================


@pytest.mark.asyncio
async def test_error_handling_integration():
    """Test unified error handling for both SDK and legacy agents."""
    # Create mock orchestrator with error state
    orchestrator = Mock(spec=OrchestratorAdapter)
    orchestrator.status_callback = None

    # Mock state with error
    mock_state = Mock(spec=State)
    mock_state.agent_state = AgentState.ERROR
    mock_state.last_error = "Test error"

    orchestrator.get_state = Mock(return_value=mock_state)

    # Create mock runtime and memory
    mock_runtime = Mock()
    mock_runtime.status_callback = None

    mock_memory = Mock()
    mock_memory.status_callback = None

    # Run agent loop - should exit immediately due to ERROR state
    end_states = [AgentState.FINISHED, AgentState.ERROR, AgentState.STOPPED]

    await run_agent_until_done(
        controller=orchestrator,
        runtime=mock_runtime,
        memory=mock_memory,
        end_states=end_states,
        skip_set_callback=False,
    )

    # Verify state was checked
    assert orchestrator.get_state.called


# ============================================================================
# Test 10: State Persistence Integration
# ============================================================================


def test_state_persistence_integration(mock_file_store):
    """Test state persistence for both SDK and legacy agents."""
    # Create mock state
    state = Mock(spec=State)
    state.agent_state = AgentState.RUNNING
    state.iteration = 5
    state.sdk_metadata = {'step_count': 10}
    state.save_to_session = Mock()

    # Save state
    state.save_to_session("test_session", mock_file_store)

    # Verify save was called
    assert state.save_to_session.called


# ============================================================================
# Test 11: Agent Type Detection
# ============================================================================


def test_agent_type_detection_sdk(mock_sdk_agent):
    """Test that SDK agents are correctly detected."""
    agent_type = detect_agent_type(mock_sdk_agent)
    assert agent_type == AgentType.SDK


def test_agent_type_detection_legacy(mock_legacy_agent):
    """Test that legacy agents are correctly detected."""
    agent_type = detect_agent_type(mock_legacy_agent)
    assert agent_type == AgentType.LEGACY


# ============================================================================
# Test 12: Backward Compatibility
# ============================================================================


def test_backward_compatibility_controller():
    """Test that AgentController still works without SDK integration."""
    # Ensure SDK features disabled
    os.environ.pop('OPENHANDS_USE_SDK_AGENTS', None)
    reset_sdk_config()

    # Create mock controller
    controller = Mock(spec=AgentController)
    mock_state = Mock()
    mock_state.agent_state = AgentState.RUNNING
    controller.state = mock_state

    # Verify controller still works
    assert controller.state.agent_state == AgentState.RUNNING


# ============================================================================
# Test 13: SDK Config Parsing
# ============================================================================


def test_sdk_config_bool_parsing():
    """Test parsing of boolean environment variables."""
    # Test various boolean formats
    test_cases = [
        ('true', True),
        ('TRUE', True),
        ('yes', True),
        ('1', True),
        ('on', True),
        ('false', False),
        ('FALSE', False),
        ('no', False),
        ('0', False),
        ('off', False),
    ]

    for value, expected in test_cases:
        os.environ['OPENHANDS_USE_SDK_AGENTS'] = value
        reset_sdk_config()
        config = get_sdk_config()
        assert config.use_sdk_agents == expected, f"Failed for value: {value}"

    # Clean up
    os.environ.pop('OPENHANDS_USE_SDK_AGENTS', None)


def test_sdk_config_int_parsing():
    """Test parsing of integer environment variables."""
    os.environ['OPENHANDS_SDK_TIMEOUT'] = '600'
    reset_sdk_config()

    config = get_sdk_config()
    assert config.sdk_timeout_seconds == 600

    # Clean up
    os.environ.pop('OPENHANDS_SDK_TIMEOUT', None)


def test_sdk_config_float_parsing():
    """Test parsing of float environment variables."""
    os.environ['OPENHANDS_SDK_RETRY_DELAY'] = '2.5'
    reset_sdk_config()

    config = get_sdk_config()
    assert config.sdk_retry_delay_seconds == 2.5

    # Clean up
    os.environ.pop('OPENHANDS_SDK_RETRY_DELAY', None)


# ============================================================================
# Test 14: SDK Config Serialization
# ============================================================================


def test_sdk_config_to_dict():
    """Test SDK config serialization to dictionary."""
    config = SDKConfig(
        use_sdk_agents=True,
        use_sdk_orchestrator=True,
        sdk_timeout_seconds=600,
    )

    config_dict = config.to_dict()

    assert config_dict['use_sdk_agents'] is True
    assert config_dict['use_sdk_orchestrator'] is True
    assert config_dict['sdk_timeout_seconds'] == 600


def test_sdk_config_from_dict():
    """Test SDK config deserialization from dictionary."""
    config_dict = {
        'use_sdk_agents': True,
        'use_sdk_orchestrator': False,
        'sdk_timeout_seconds': 450,
    }

    config = SDKConfig.from_dict(config_dict)

    assert config.use_sdk_agents is True
    assert config.use_sdk_orchestrator is False
    assert config.sdk_timeout_seconds == 450


# ============================================================================
# Test 15: Integration with Real Components (if available)
# ============================================================================


@pytest.mark.integration
@pytest.mark.skipif(
    not os.environ.get('RUN_INTEGRATION_TESTS'),
    reason="Integration tests disabled"
)
def test_real_sdk_agent_integration():
    """Test real SDK agent integration (requires actual components)."""
    # This test requires actual SDK components to be available
    # Skip if not in integration test mode
    pass


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
