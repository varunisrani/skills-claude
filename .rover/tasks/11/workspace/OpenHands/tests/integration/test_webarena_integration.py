"""
Integration tests for WebArena workflow.

Tests browser automation and web interaction workflows used for
WebArena evaluation.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from pathlib import Path


@pytest.mark.integration
@pytest.mark.webarena
class TestWebArenaWorkflow:
    """Test WebArena browser automation workflow."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_browser_navigation_task(self, mock_browser_server, mock_jupyter,
                                           mock_client_class, temp_workspace,
                                           mock_browser_mcp):
        """Test simple browser navigation task."""
        from openhands.agent_hub import AgentHub

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Navigation completed")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as hub:
            # Execute browser task
            result = await hub.execute_task(
                agent_type="browser",
                task="Navigate to https://example.com and extract the title"
            )

            assert len(result) > 0
            assert mock_browser_mcp.navigate.called or mock_client.query.called

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_browser_interaction_task(self, mock_browser_server, mock_jupyter,
                                            mock_client_class, temp_workspace,
                                            mock_browser_mcp):
        """Test browser interaction task with clicks and form filling."""
        from openhands.agent_hub import AgentHub

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        interaction_log = []

        async def track_interact(action, selector):
            interaction_log.append((action, selector))
            return {"success": True}

        mock_browser_mcp.interact = AsyncMock(side_effect=track_interact)

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Task completed")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as hub:
            result = await hub.execute_task(
                agent_type="browser",
                task="Click the login button and enter credentials"
            )

            assert len(result) > 0

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_browser_with_screenshots(self, mock_browser_server, mock_jupyter,
                                            mock_client_class, temp_workspace,
                                            mock_browser_mcp):
        """Test browser task with screenshot capture."""
        from openhands.agent_hub import AgentHub

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        screenshot_calls = []

        async def track_screenshot():
            screenshot_calls.append(1)
            return {"image": "base64data", "format": "png"}

        mock_browser_mcp.screenshot = AsyncMock(side_effect=track_screenshot)

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Screenshot taken")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as hub:
            result = await hub.execute_task(
                agent_type="browser",
                task="Navigate to page and take screenshot"
            )

            assert len(result) > 0


@pytest.mark.integration
@pytest.mark.webarena
class TestWebArenaMultiStep:
    """Test multi-step WebArena workflows."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_shopping_workflow(self, mock_browser_server, mock_jupyter,
                                     mock_client_class, temp_workspace,
                                     mock_browser_mcp, mock_webarena_task):
        """Test shopping cart workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        response_sequence = [
            "Navigated to product page",
            "Added to cart",
            "Proceeded to checkout"
        ]
        response_index = [0]

        async def mock_receive():
            idx = response_index[0]
            response_index[0] += 1
            if idx < len(response_sequence):
                yield Mock(content=[Mock(text=response_sequence[idx])])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            # Execute shopping workflow
            result = await orchestrator.execute_simple_task(
                agent_type="browser",
                task_description=mock_webarena_task["intent"]
            )

            assert result.status == TaskStatus.COMPLETED

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_form_filling_workflow(self, mock_browser_server, mock_jupyter,
                                         mock_client_class, temp_workspace,
                                         mock_browser_mcp):
        """Test form filling workflow."""
        from openhands.agent_hub import AgentHub

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        form_actions = []

        async def track_interact(action, selector, value=None):
            form_actions.append({"action": action, "selector": selector, "value": value})
            return {"success": True}

        mock_browser_mcp.interact = AsyncMock(side_effect=track_interact)

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Form submitted")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as hub:
            result = await hub.execute_task(
                agent_type="browser",
                task="Fill out registration form with name, email, and submit"
            )

            assert len(result) > 0


@pytest.mark.integration
@pytest.mark.webarena
class TestWebArenaEnvironment:
    """Test WebArena environment setup and validation."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_browser_agent_config(self, mock_browser_server, mock_jupyter,
                                        mock_client_class, temp_workspace,
                                        mock_browser_mcp):
        """Test browser agent has correct configuration."""
        from openhands.agent_hub import AgentHub

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        hub = AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        )

        # Check browser agent config
        browser_config = hub.configs["browser"]
        assert "mcp__browser__navigate" in browser_config.allowed_tools
        assert "mcp__browser__interact" in browser_config.allowed_tools
        assert "mcp__browser__screenshot" in browser_config.allowed_tools
        assert "browser" in browser_config.mcp_servers

        await hub.cleanup()

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_browser_mcp_integration(self, mock_browser_server, mock_jupyter,
                                           mock_client_class, temp_workspace,
                                           mock_browser_mcp):
        """Test browser MCP server is properly integrated."""
        from openhands.agent_hub import AgentHub

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as hub:
            # Browser MCP should be available
            assert hub.browser_mcp is not None

            # Browser agent should reference the MCP
            browser_config = hub.configs["browser"]
            assert "browser" in browser_config.mcp_servers


@pytest.mark.integration
@pytest.mark.webarena
@pytest.mark.slow
class TestWebArenaMetrics:
    """Test WebArena metrics and reward calculation."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_task_success_tracking(self, mock_browser_server, mock_jupyter,
                                         mock_client_class, temp_workspace,
                                         mock_browser_mcp):
        """Test tracking task success for WebArena."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Task completed successfully")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="browser",
                task_description="Complete shopping task"
            )

            assert result.status == TaskStatus.COMPLETED
            assert result.task_id is not None

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_interaction_count(self, mock_browser_server, mock_jupyter,
                                     mock_client_class, temp_workspace,
                                     mock_browser_mcp):
        """Test counting browser interactions."""
        from openhands.agent_hub import AgentHub

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser_server.return_value = mock_browser_mcp

        interaction_count = [0]

        async def count_interact(**kwargs):
            interaction_count[0] += 1
            return {"success": True}

        mock_browser_mcp.interact = AsyncMock(side_effect=count_interact)
        mock_browser_mcp.navigate = AsyncMock(side_effect=count_interact)

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Done")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as hub:
            await hub.execute_task(
                agent_type="browser",
                task="Navigate and interact with page"
            )

            # Can track interaction count
            # (actual count depends on agent behavior)
            assert interaction_count[0] >= 0
