"""
Integration tests for orchestrator components.

Tests the interaction between TaskOrchestrator, AgentHub, and OrchestratorAdapter
with mocked external services.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from pathlib import Path


@pytest.mark.integration
class TestOrchestratorWithHub:
    """Test TaskOrchestrator integration with AgentHub."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_simple_task_end_to_end(self, mock_browser, mock_jupyter,
                                          mock_client_class, temp_workspace):
        """Test simple task execution through orchestrator and hub."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Task completed successfully")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        # Execute task
        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="Analyze the workspace"
            )

            assert result.status == TaskStatus.COMPLETED
            assert len(result.messages) > 0
            assert mock_client.connect.called
            assert mock_client.query.called

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_multiple_agents_coordination(self, mock_browser, mock_jupyter,
                                                mock_client_class, temp_workspace):
        """Test coordination between multiple agents."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        call_log = []

        def create_mock_client():
            mock_client = AsyncMock()
            mock_client.connect = AsyncMock()
            mock_client.query = AsyncMock(side_effect=lambda task: call_log.append(task))

            async def mock_receive():
                yield Mock(content=[Mock(text="Response")])

            mock_client.receive_response = mock_receive
            return mock_client

        mock_client_class.side_effect = lambda **kwargs: create_mock_client()

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            # Execute tasks with different agents
            result1 = await orchestrator.execute_simple_task("code", "Task 1")
            result2 = await orchestrator.execute_simple_task("analysis", "Task 2")

            assert result1.status == TaskStatus.COMPLETED
            assert result2.status == TaskStatus.COMPLETED
            assert len(call_log) >= 2

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_agent_caching_integration(self, mock_browser, mock_jupyter,
                                             mock_client_class, temp_workspace):
        """Test that agents are cached and reused properly."""
        from openhands.orchestrator import TaskOrchestrator

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        client_instances = []

        def create_client(**kwargs):
            mock_client = AsyncMock()
            mock_client.connect = AsyncMock()
            mock_client.query = AsyncMock()

            async def mock_receive():
                yield Mock(content=[Mock(text="Response")])

            mock_client.receive_response = mock_receive
            client_instances.append(mock_client)
            return mock_client

        mock_client_class.side_effect = create_client

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            # Execute multiple tasks with same agent type
            await orchestrator.execute_simple_task("code", "Task 1")
            await orchestrator.execute_simple_task("code", "Task 2")
            await orchestrator.execute_simple_task("code", "Task 3")

            # Should only create one client for 'code' agent
            assert len(client_instances) == 1
            # But query should be called 3 times
            assert client_instances[0].query.call_count == 3


@pytest.mark.integration
class TestAdapterWithOrchestrator:
    """Test OrchestratorAdapter integration with TaskOrchestrator."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_adapter_run_integration(self, mock_browser, mock_jupyter,
                                           mock_client_class, temp_workspace,
                                           mock_config, mock_event_stream):
        """Test adapter run method integration with orchestrator."""
        from openhands.controller.orchestrator_adapter import OrchestratorAdapter
        from openhands.core.schema import AgentState

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Completed")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        # Execute through adapter
        async with OrchestratorAdapter(
            config=mock_config,
            event_stream=mock_event_stream,
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as adapter:
            state = await adapter.run(task="Test task")

            assert state.agent_state == AgentState.FINISHED
            assert mock_event_stream.add_event.called

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_adapter_github_workflow_integration(self, mock_browser, mock_jupyter,
                                                       mock_client_class, temp_workspace,
                                                       mock_config, mock_event_stream):
        """Test adapter GitHub workflow integration."""
        from openhands.controller.orchestrator_adapter import OrchestratorAdapter
        from openhands.core.schema import AgentState

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Phase completed")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with OrchestratorAdapter(
            config=mock_config,
            event_stream=mock_event_stream,
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as adapter:
            state = await adapter.run_github_issue(
                issue_title="Test issue",
                issue_body="Test body"
            )

            assert state.agent_state == AgentState.FINISHED
            # Should query multiple times for different phases
            assert mock_client.query.call_count >= 3


@pytest.mark.integration
class TestProgressTracking:
    """Test progress tracking across components."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_progress_callback_flow(self, mock_browser, mock_jupyter,
                                          mock_client_class, temp_workspace):
        """Test progress callbacks flow through system."""
        from openhands.orchestrator import TaskOrchestrator

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Response")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        # Track progress
        progress_messages = []

        async def progress_callback(msg, metadata):
            progress_messages.append(msg)

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key",
            progress_callback=progress_callback
        ) as orchestrator:
            await orchestrator.execute_simple_task("code", "Test")

            # Should have received progress updates
            assert len(progress_messages) > 0

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_adapter_progress_to_events(self, mock_browser, mock_jupyter,
                                              mock_client_class, temp_workspace,
                                              mock_config, mock_event_stream):
        """Test progress converts to events in adapter."""
        from openhands.controller.orchestrator_adapter import OrchestratorAdapter

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Response")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with OrchestratorAdapter(
            config=mock_config,
            event_stream=mock_event_stream,
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as adapter:
            await adapter.run(task="Test")

            # Progress should be converted to events
            assert mock_event_stream.add_event.call_count >= 1


@pytest.mark.integration
class TestErrorHandling:
    """Test error handling across components."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_orchestrator_error_recovery(self, mock_browser, mock_jupyter,
                                               mock_client_class, temp_workspace):
        """Test orchestrator handles agent errors."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock(side_effect=Exception("Agent error"))
        mock_client_class.return_value = mock_client

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            result = await orchestrator.execute_simple_task("code", "Test")

            assert result.status == TaskStatus.FAILED
            assert "Agent error" in result.error

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_adapter_error_to_event(self, mock_browser, mock_jupyter,
                                         mock_client_class, temp_workspace,
                                         mock_config, mock_event_stream):
        """Test adapter converts errors to events."""
        from openhands.controller.orchestrator_adapter import OrchestratorAdapter
        from openhands.core.schema import AgentState

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock(side_effect=Exception("Test error"))
        mock_client_class.return_value = mock_client

        async with OrchestratorAdapter(
            config=mock_config,
            event_stream=mock_event_stream,
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as adapter:
            state = await adapter.run(task="Test")

            assert state.agent_state == AgentState.ERROR
            # Should add error observation to event stream
            assert mock_event_stream.add_event.called


@pytest.mark.integration
@pytest.mark.slow
class TestResourceManagement:
    """Test resource management across components."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_cleanup_cascade(self, mock_browser, mock_jupyter,
                                   mock_client_class, temp_workspace):
        """Test cleanup cascades through all components."""
        from openhands.orchestrator import TaskOrchestrator

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        disconnect_calls = []

        def create_client(**kwargs):
            mock_client = AsyncMock()
            mock_client.connect = AsyncMock()
            mock_client.disconnect = AsyncMock(side_effect=lambda: disconnect_calls.append(1))
            mock_client.query = AsyncMock()

            async def mock_receive():
                yield Mock(content=[Mock(text="Response")])

            mock_client.receive_response = mock_receive
            return mock_client

        mock_client_class.side_effect = create_client

        orchestrator = TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        )

        # Create some agents
        await orchestrator.execute_simple_task("code", "Task 1")
        await orchestrator.execute_simple_task("analysis", "Task 2")

        # Cleanup
        await orchestrator.cleanup()

        # Should disconnect both agents
        assert len(disconnect_calls) == 2
