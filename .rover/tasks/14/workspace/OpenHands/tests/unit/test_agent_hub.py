"""
Unit tests for AgentHub component.

Tests agent lifecycle, configuration, task execution, and caching
without making actual API calls.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from pathlib import Path


@pytest.mark.unit
class TestAgentConfig:
    """Test AgentConfig class."""

    def test_agent_config_initialization(self):
        """Test basic AgentConfig initialization."""
        from openhands.agent_hub import AgentConfig

        config = AgentConfig(
            agent_type="code",
            allowed_tools=["Read", "Write", "Edit"],
            system_prompt="You are a code agent",
            permission_mode="acceptEdits",
            max_turns=50
        )

        assert config.agent_type == "code"
        assert config.allowed_tools == ["Read", "Write", "Edit"]
        assert config.system_prompt == "You are a code agent"
        assert config.permission_mode == "acceptEdits"
        assert config.max_turns == 50
        assert config.model == "claude-sonnet-4-5-20250929"

    def test_agent_config_with_mcp_servers(self):
        """Test AgentConfig with MCP servers."""
        from openhands.agent_hub import AgentConfig

        mcp_servers = {"jupyter": Mock()}
        config = AgentConfig(
            agent_type="python",
            allowed_tools=["Read"],
            system_prompt="Python agent",
            mcp_servers=mcp_servers
        )

        assert config.mcp_servers == mcp_servers
        assert "jupyter" in config.mcp_servers


@pytest.mark.unit
class TestAgentHub:
    """Test AgentHub class."""

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    def test_hub_initialization(self, mock_browser, mock_jupyter, temp_workspace):
        """Test AgentHub initialization."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        )

        assert hub.workspace == temp_workspace
        assert hub.api_key == "test-key"
        assert len(hub.agents) == 0  # No agents created yet
        assert len(hub.configs) == 5  # 5 agent types configured
        assert "code" in hub.configs
        assert "analysis" in hub.configs
        assert "testing" in hub.configs
        assert "browser" in hub.configs
        assert "python" in hub.configs

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    def test_agent_configs_setup(self, mock_browser, mock_jupyter, temp_workspace):
        """Test that agent configurations are set up correctly."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        )

        # Test code agent config
        code_config = hub.configs["code"]
        assert code_config.agent_type == "code"
        assert "Read" in code_config.allowed_tools
        assert "Write" in code_config.allowed_tools
        assert "Edit" in code_config.allowed_tools
        assert code_config.permission_mode == "acceptEdits"
        assert code_config.max_turns == 50

        # Test analysis agent config
        analysis_config = hub.configs["analysis"]
        assert analysis_config.agent_type == "analysis"
        assert "Read" in analysis_config.allowed_tools
        assert "Grep" in analysis_config.allowed_tools
        assert "Write" not in analysis_config.allowed_tools
        assert analysis_config.permission_mode == "accept"

        # Test testing agent config
        testing_config = hub.configs["testing"]
        assert testing_config.agent_type == "testing"
        assert "Bash" in testing_config.allowed_tools
        assert testing_config.max_turns == 20

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    async def test_get_agent_creates_new(self, mock_client_class, mock_browser,
                                         mock_jupyter, temp_workspace):
        """Test getting an agent creates new instance."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        # Setup mock client
        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client_class.return_value = mock_client

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        )

        # Get code agent (should create new)
        agent = await hub.get_agent("code")

        assert agent is not None
        assert mock_client.connect.called
        assert "code" in hub.agents
        assert hub.agents["code"] == agent

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    async def test_get_agent_caching(self, mock_client_class, mock_browser,
                                     mock_jupyter, temp_workspace):
        """Test that agents are cached and reused."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        # Setup mock client
        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client_class.return_value = mock_client

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        )

        # Get agent twice
        agent1 = await hub.get_agent("code")
        agent2 = await hub.get_agent("code")

        # Should be same instance (cached)
        assert agent1 is agent2
        # Connect should only be called once
        assert mock_client.connect.call_count == 1

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_get_agent_invalid_type(self, mock_browser, mock_jupyter, temp_workspace):
        """Test getting invalid agent type raises error."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        )

        with pytest.raises(ValueError, match="Unknown agent type"):
            await hub.get_agent("invalid_type")

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_execute_task(self, mock_browser, mock_jupyter, temp_workspace):
        """Test task execution."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        # Create mock client with response
        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Test response")])

        mock_client.receive_response = mock_receive

        with patch('openhands.agent_hub.hub.ClaudeSDKClient', return_value=mock_client):
            hub = AgentHub(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            results = await hub.execute_task(
                agent_type="code",
                task="Test task"
            )

            assert len(results) == 1
            assert mock_client.query.called
            assert mock_client.query.call_args[0][0] == "Test task"

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_parallel_execute(self, mock_browser, mock_jupyter, temp_workspace):
        """Test parallel task execution."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        # Create mock client
        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Response")])

        mock_client.receive_response = mock_receive

        with patch('openhands.agent_hub.hub.ClaudeSDKClient', return_value=mock_client):
            hub = AgentHub(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            results = await hub.parallel_execute([
                ("code", "Task 1"),
                ("analysis", "Task 2")
            ])

            assert "code" in results
            assert "analysis" in results
            assert len(results["code"]) >= 1
            assert len(results["analysis"]) >= 1

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_cleanup(self, mock_browser, mock_jupyter, temp_workspace):
        """Test cleanup disconnects all agents."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        # Create mock client
        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.disconnect = AsyncMock()

        with patch('openhands.agent_hub.hub.ClaudeSDKClient', return_value=mock_client):
            hub = AgentHub(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            # Create some agents
            await hub.get_agent("code")
            await hub.get_agent("analysis")

            assert len(hub.agents) == 2

            # Cleanup
            await hub.cleanup()

            # Should disconnect all agents
            assert mock_client.disconnect.call_count == 2
            assert len(hub.agents) == 0

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_context_manager(self, mock_browser, mock_jupyter, temp_workspace):
        """Test AgentHub as async context manager."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.disconnect = AsyncMock()

        with patch('openhands.agent_hub.hub.ClaudeSDKClient', return_value=mock_client):
            async with AgentHub(workspace=str(temp_workspace), api_key="test-key") as hub:
                await hub.get_agent("code")
                assert len(hub.agents) == 1

            # Cleanup should be called automatically
            assert mock_client.disconnect.called

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    def test_load_prompt_existing(self, mock_browser, mock_jupyter, temp_workspace):
        """Test loading existing prompt file."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        # Create a test prompt file
        prompts_dir = temp_workspace / "prompts"
        prompts_dir.mkdir(exist_ok=True)
        prompt_file = prompts_dir / "test_agent.txt"
        prompt_file.write_text("Test prompt content")

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key",
            prompts_dir=str(prompts_dir)
        )

        prompt = hub._load_prompt("test_agent.txt")
        assert prompt == "Test prompt content"

    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    def test_load_prompt_missing(self, mock_browser, mock_jupyter, temp_workspace):
        """Test loading missing prompt file uses default."""
        from openhands.agent_hub import AgentHub

        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        prompts_dir = temp_workspace / "prompts"
        prompts_dir.mkdir(exist_ok=True)

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key",
            prompts_dir=str(prompts_dir)
        )

        prompt = hub._load_prompt("nonexistent.txt")
        assert "helpful AI assistant" in prompt
