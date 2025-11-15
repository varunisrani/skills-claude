"""
Integration tests for SWE-bench workflow.

Tests the end-to-end GitHub issue resolution workflow that is used
for SWE-bench evaluation.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from pathlib import Path


@pytest.mark.integration
@pytest.mark.swe_bench
class TestSWEBenchWorkflow:
    """Test SWE-bench GitHub issue resolution workflow."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_simple_issue_resolution(self, mock_browser, mock_jupyter,
                                           mock_client_class, temp_workspace,
                                           sample_issue):
        """Test simple issue resolution workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        phase_calls = []

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()

        def track_query(query):
            if "Analyze" in query:
                phase_calls.append("analysis")
            elif "implement" in query:
                phase_calls.append("implementation")
            elif "test" in query:
                phase_calls.append("testing")

        mock_client.query = AsyncMock(side_effect=track_query)

        async def mock_receive():
            yield Mock(content=[Mock(text="Phase completed")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            result = await orchestrator.execute_github_issue_workflow(
                issue_title=sample_issue["title"],
                issue_body=sample_issue["body"],
                repo_path=str(temp_workspace)
            )

            assert result.status == TaskStatus.COMPLETED
            # Should go through all phases
            assert "analysis" in phase_calls
            assert "implementation" in phase_calls
            assert "testing" in phase_calls

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_issue_with_test_failures(self, mock_browser, mock_jupyter,
                                            mock_client_class, temp_workspace):
        """Test issue resolution with test failures and retry."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        call_count = {"testing": 0}

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            # First test run fails, second succeeds
            call_count["testing"] += 1
            if call_count["testing"] == 1:
                yield Mock(content=[Mock(text="Tests failed: 2 errors")])
            else:
                yield Mock(content=[Mock(text="All tests passed")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Fix bug",
                issue_body="Bug description",
                repo_path=str(temp_workspace)
            )

            # Should complete after retry
            assert result.status == TaskStatus.COMPLETED
            # Testing agent should be called multiple times
            assert call_count["testing"] >= 2


@pytest.mark.integration
@pytest.mark.swe_bench
class TestSWEBenchAdapter:
    """Test SWE-bench workflow through adapter."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_adapter_github_issue(self, mock_browser, mock_jupyter,
                                        mock_client_class, temp_workspace,
                                        mock_config, mock_event_stream, sample_issue):
        """Test GitHub issue through adapter interface."""
        from openhands.controller.orchestrator_adapter import OrchestratorAdapter
        from openhands.core.schema import AgentState

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Phase done")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with OrchestratorAdapter(
            config=mock_config,
            event_stream=mock_event_stream,
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as adapter:
            state = await adapter.run_github_issue(
                issue_title=sample_issue["title"],
                issue_body=sample_issue["body"],
                repo_path=str(temp_workspace)
            )

            assert state.agent_state == AgentState.FINISHED


@pytest.mark.integration
@pytest.mark.swe_bench
@pytest.mark.slow
class TestSWEBenchMetrics:
    """Test SWE-bench metrics collection."""

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_metrics_collection(self, mock_browser, mock_jupyter,
                                      mock_client_class, temp_workspace,
                                      performance_tracker):
        """Test that metrics are properly collected during workflow."""
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

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Test",
                issue_body="Test",
                repo_path=str(temp_workspace)
            )

            # Check metrics collected
            assert performance_tracker["duration"] is not None
            assert performance_tracker["duration"] > 0

    @patch('openhands.agent_hub.hub.ClaudeSDKClient')
    @patch('openhands.agent_hub.hub.create_jupyter_mcp_server')
    @patch('openhands.agent_hub.hub.create_browser_mcp_server')
    async def test_task_metadata(self, mock_browser, mock_jupyter,
                                mock_client_class, temp_workspace):
        """Test that task metadata is properly stored."""
        from openhands.orchestrator import TaskOrchestrator

        # Setup mocks
        mock_jupyter.return_value = Mock()
        mock_browser.return_value = Mock()

        mock_client = AsyncMock()
        mock_client.connect = AsyncMock()
        mock_client.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Done")])

        mock_client.receive_response = mock_receive
        mock_client_class.return_value = mock_client

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key="test-key"
        ) as orchestrator:
            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Test Issue",
                issue_body="Description",
                repo_path=str(temp_workspace)
            )

            # Check metadata
            assert result.metadata["issue_title"] == "Test Issue"
            assert result.metadata["workflow_type"] == "github_issue"
            assert result.metadata["repo_path"] == str(temp_workspace)
