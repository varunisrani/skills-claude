"""
Tests for SDK-based agents (CodeActAgentSDK, BrowsingAgentSDK, ReadOnlyAgentSDK).

These tests verify that SDK agents:
1. Maintain backward compatibility with Agent interface
2. Work with Claude SDK adapter
3. Handle State → Action conversion correctly
4. Support the same features as legacy agents
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import asyncio

# Import test utilities
from openhands.core.config import AgentConfig
from openhands.llm.llm_registry import LLMRegistry
from openhands.controller.state.state import State
from openhands.events.action import (
    Action,
    MessageAction,
    CmdRunAction,
    FileReadAction,
    AgentFinishAction,
)
from openhands.events.observation import CmdOutputObservation

# Import SDK agents
try:
    from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
    from openhands.agenthub.browsing_agent.browsing_agent_sdk import BrowsingAgentSDK
    from openhands.agenthub.readonly_agent.readonly_agent_sdk import ReadOnlyAgentSDK
    from openhands.agenthub.agent_factory import AgentFactory
    SDK_AGENTS_AVAILABLE = True
except ImportError as e:
    SDK_AGENTS_AVAILABLE = False
    SDK_IMPORT_ERROR = str(e)


# Skip all tests if SDK not available
pytestmark = pytest.mark.skipif(
    not SDK_AGENTS_AVAILABLE,
    reason=f"SDK agents not available: {SDK_IMPORT_ERROR if not SDK_AGENTS_AVAILABLE else ''}"
)


@pytest.fixture
def mock_config():
    """Create a mock agent config."""
    config = Mock(spec=AgentConfig)
    config.workspace_base = "/test/workspace"
    config.cli_mode = False
    config.enable_cmd = True
    config.enable_editor = True
    config.enable_jupyter = False
    config.enable_browsing = False
    config.enable_think = True
    config.enable_finish = True
    config.enable_condensation_request = False
    config.enable_plan_mode = False
    config.enable_llm_editor = False
    config.resolved_system_prompt_filename = "system_prompt.txt"
    return config


@pytest.fixture
def mock_llm_registry():
    """Create a mock LLM registry."""
    registry = Mock(spec=LLMRegistry)
    llm = Mock()
    llm.config = Mock()
    llm.config.model = "claude-sonnet-4-5-20250929"
    registry.get_llm_from_agent_config.return_value = llm
    return registry


@pytest.fixture
def mock_state():
    """Create a mock state with history."""
    state = Mock(spec=State)
    state.history = [
        MessageAction(content="Test task: list files", source="user")
    ]
    state.inputs = {"task": "Test task"}
    state.get_last_user_message.return_value = MessageAction(
        content="Test task: list files",
        source="user"
    )
    return state


class TestClaudeSDKAdapter:
    """Test the ClaudeSDKAdapter."""

    @patch('openhands.agenthub.claude_sdk_adapter.ClaudeSDKClient')
    def test_adapter_initialization(self, mock_client_class, mock_config):
        """Test adapter initializes correctly."""
        from openhands.agenthub.claude_sdk_adapter import (
            ClaudeSDKAdapter,
            ClaudeSDKAdapterConfig
        )

        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="test",
            allowed_tools=["Read", "Bash"],
            system_prompt="Test prompt",
            workspace_base="/test"
        )

        adapter = ClaudeSDKAdapter(adapter_config)

        assert adapter.config.agent_type == "test"
        assert "Read" in adapter.config.allowed_tools
        assert adapter.claude_client is None

    @patch('openhands.agenthub.claude_sdk_adapter.ClaudeSDKClient')
    def test_state_to_prompt(self, mock_client_class, mock_state):
        """Test state conversion to prompt."""
        from openhands.agenthub.claude_sdk_adapter import (
            ClaudeSDKAdapter,
            ClaudeSDKAdapterConfig
        )

        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="test",
            allowed_tools=["Read"],
            system_prompt="Test"
        )

        adapter = ClaudeSDKAdapter(adapter_config)
        prompt = adapter.state_to_prompt(mock_state)

        assert isinstance(prompt, str)
        assert len(prompt) > 0
        assert "Test task" in prompt

    def test_messages_to_action_text(self):
        """Test converting text messages to action."""
        from openhands.agenthub.claude_sdk_adapter import (
            ClaudeSDKAdapter,
            ClaudeSDKAdapterConfig
        )

        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="test",
            allowed_tools=["Read"],
            system_prompt="Test"
        )

        adapter = ClaudeSDKAdapter(adapter_config)

        # Mock text message
        mock_message = Mock()
        mock_message.content = "Here is some information"

        action = adapter.messages_to_action([mock_message])

        assert isinstance(action, MessageAction)
        assert "information" in action.content

    def test_messages_to_action_finish(self):
        """Test converting finish indicator to AgentFinishAction."""
        from openhands.agenthub.claude_sdk_adapter import (
            ClaudeSDKAdapter,
            ClaudeSDKAdapterConfig
        )

        adapter_config = ClaudeSDKAdapterConfig(
            agent_type="test",
            allowed_tools=["Read"],
            system_prompt="Test"
        )

        adapter = ClaudeSDKAdapter(adapter_config)

        # Mock message with finish indicator
        mock_message = Mock()
        mock_message.content = "Task is complete and finished"

        action = adapter.messages_to_action([mock_message])

        assert isinstance(action, AgentFinishAction)


class TestCodeActAgentSDK:
    """Test CodeActAgentSDK."""

    @patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter')
    def test_initialization(self, mock_adapter_class, mock_config, mock_llm_registry):
        """Test CodeActAgentSDK initializes correctly."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter

        agent = CodeActAgentSDK(mock_config, mock_llm_registry)

        assert agent is not None
        assert hasattr(agent, 'adapter')
        assert agent.VERSION == '3.0-SDK'

    @patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter')
    def test_step_exit_command(self, mock_adapter_class, mock_config, mock_llm_registry, mock_state):
        """Test step handles /exit command."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter

        agent = CodeActAgentSDK(mock_config, mock_llm_registry)

        # Set exit command
        mock_state.get_last_user_message.return_value = MessageAction(
            content="/exit",
            source="user"
        )

        action = agent.step(mock_state)

        assert isinstance(action, AgentFinishAction)

    @patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter')
    def test_reset(self, mock_adapter_class, mock_config, mock_llm_registry):
        """Test reset method."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter

        agent = CodeActAgentSDK(mock_config, mock_llm_registry)
        agent.reset()

        # Should not raise exceptions
        assert True


class TestBrowsingAgentSDK:
    """Test BrowsingAgentSDK."""

    @patch('openhands.agenthub.browsing_agent.browsing_agent_sdk.create_browser_mcp_server')
    @patch('openhands.agenthub.browsing_agent.browsing_agent_sdk.ClaudeSDKAdapter')
    def test_initialization(self, mock_adapter_class, mock_mcp_server, mock_config, mock_llm_registry):
        """Test BrowsingAgentSDK initializes correctly."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter
        mock_mcp_server.return_value = Mock()

        agent = BrowsingAgentSDK(mock_config, mock_llm_registry)

        assert agent is not None
        assert hasattr(agent, 'adapter')
        assert agent.VERSION == '2.0-SDK'

    @patch('openhands.agenthub.browsing_agent.browsing_agent_sdk.create_browser_mcp_server')
    @patch('openhands.agenthub.browsing_agent.browsing_agent_sdk.ClaudeSDKAdapter')
    def test_step_exit_command(self, mock_adapter_class, mock_mcp_server, mock_config, mock_llm_registry, mock_state):
        """Test browsing agent handles /exit command."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter
        mock_mcp_server.return_value = Mock()

        agent = BrowsingAgentSDK(mock_config, mock_llm_registry)

        # Set exit command
        mock_state.get_last_user_message.return_value = MessageAction(
            content="/exit",
            source="user"
        )

        action = agent.step(mock_state)

        assert isinstance(action, AgentFinishAction)


class TestReadOnlyAgentSDK:
    """Test ReadOnlyAgentSDK."""

    @patch('openhands.agenthub.readonly_agent.readonly_agent_sdk.ClaudeSDKAdapter')
    def test_initialization(self, mock_adapter_class, mock_config, mock_llm_registry):
        """Test ReadOnlyAgentSDK initializes correctly."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter

        agent = ReadOnlyAgentSDK(mock_config, mock_llm_registry)

        assert agent is not None
        assert hasattr(agent, 'adapter')
        assert agent.VERSION == '2.0-SDK'

    @patch('openhands.agenthub.readonly_agent.readonly_agent_sdk.ClaudeSDKAdapter')
    def test_step_prevents_modifications(self, mock_adapter_class, mock_config, mock_llm_registry, mock_state):
        """Test readonly agent prevents modification actions."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        # Mock adapter to return a write action (which should be blocked)
        mock_adapter.execute_step = AsyncMock(return_value=FileWriteAction(
            path="/test/file.txt",
            content="test"
        ))
        mock_adapter_class.return_value = mock_adapter

        agent = ReadOnlyAgentSDK(mock_config, mock_llm_registry)

        action = agent.step(mock_state)

        # Should convert write action to error message
        assert isinstance(action, MessageAction)
        assert "cannot perform modifications" in action.content.lower()

    @patch('openhands.agenthub.readonly_agent.readonly_agent_sdk.ClaudeSDKAdapter')
    def test_step_allows_read_actions(self, mock_adapter_class, mock_config, mock_llm_registry, mock_state):
        """Test readonly agent allows read actions."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        # Mock adapter to return a read action (which should be allowed)
        mock_adapter.execute_step = AsyncMock(return_value=FileReadAction(
            path="/test/file.txt"
        ))
        mock_adapter_class.return_value = mock_adapter

        agent = ReadOnlyAgentSDK(mock_config, mock_llm_registry)

        action = agent.step(mock_state)

        # Should allow read action
        assert isinstance(action, FileReadAction)


class TestAgentFactory:
    """Test AgentFactory."""

    def test_list_agents(self):
        """Test listing available agents."""
        agents = AgentFactory.list_agents()

        assert "legacy" in agents or "sdk" in agents
        if "sdk" in agents:
            assert "CodeActAgent" in agents["sdk"]
            assert "BrowsingAgent" in agents["sdk"]
            assert "ReadOnlyAgent" in agents["sdk"]

    def test_has_sdk_version(self):
        """Test checking for SDK versions."""
        assert AgentFactory.has_sdk_version("CodeActAgent") == True
        assert AgentFactory.has_sdk_version("BrowsingAgent") == True
        assert AgentFactory.has_sdk_version("ReadOnlyAgent") == True

    @patch('openhands.agenthub.agent_factory.ClaudeSDKAdapter')
    def test_get_agent_info(self, mock_adapter_class, mock_config, mock_llm_registry):
        """Test getting agent information."""
        info = AgentFactory.get_agent_info("CodeActAgent", use_sdk=True)

        assert info["name"] == "CodeActAgent"
        assert info["mode"] == "sdk"
        assert info["has_sdk"] == True

    @patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter')
    def test_create_sdk_agent(self, mock_adapter_class, mock_config, mock_llm_registry):
        """Test creating SDK agent via factory."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter

        agent = AgentFactory.create_agent(
            "CodeActAgent",
            config=mock_config,
            llm_registry=mock_llm_registry,
            use_sdk=True
        )

        assert agent is not None
        assert isinstance(agent, CodeActAgentSDK)
        assert agent.VERSION == '3.0-SDK'


class TestBackwardCompatibility:
    """Test backward compatibility with Agent interface."""

    @patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter')
    def test_agent_interface(self, mock_adapter_class, mock_config, mock_llm_registry):
        """Test SDK agents implement Agent interface."""
        from openhands.controller.agent import Agent

        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter_class.return_value = mock_adapter

        agent = CodeActAgentSDK(mock_config, mock_llm_registry)

        # Check Agent interface
        assert isinstance(agent, Agent)
        assert hasattr(agent, 'step')
        assert hasattr(agent, 'reset')
        assert hasattr(agent, 'name')
        assert hasattr(agent, 'VERSION')

    @patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter')
    def test_step_signature(self, mock_adapter_class, mock_config, mock_llm_registry, mock_state):
        """Test step method signature matches Agent."""
        mock_adapter = Mock()
        mock_adapter.initialize = AsyncMock()
        mock_adapter.execute_step = AsyncMock(return_value=MessageAction(content="test"))
        mock_adapter_class.return_value = mock_adapter

        agent = CodeActAgentSDK(mock_config, mock_llm_registry)

        # step should accept State and return Action
        action = agent.step(mock_state)

        assert isinstance(action, Action)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
