"""
Unit tests for OrchestratorAdapter component.

Tests the adapter layer between TaskOrchestrator and legacy AgentController
interface.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from pathlib import Path


@pytest.mark.unit
class TestOrchestratorAdapter:
    """Test OrchestratorAdapter class."""

    def test_adapter_initialization(self, temp_workspace, mock_config, mock_event_stream):
        """Test OrchestratorAdapter initialization."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key",
                max_retries=3
            )

            assert adapter.workspace == temp_workspace
            assert adapter.config == mock_config
            assert adapter.event_stream == mock_event_stream
            assert adapter.state.agent_state.value == "INIT"

    def test_adapter_from_orchestrator(self, mock_orchestrator, mock_config, mock_event_stream):
        """Test creating adapter from existing orchestrator."""
        from openhands.controller.orchestrator_adapter import OrchestratorAdapter

        adapter = OrchestratorAdapter.from_orchestrator(
            orchestrator=mock_orchestrator,
            event_stream=mock_event_stream,
            config=mock_config
        )

        assert adapter.orchestrator == mock_orchestrator
        assert adapter.event_stream == mock_event_stream
        assert adapter.config == mock_config

    async def test_handle_progress(self, temp_workspace, mock_config, mock_event_stream):
        """Test progress handling."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator'):
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            await adapter._handle_progress("Test message", {"iteration": 5})

            # Should update state
            assert adapter.state.iteration == 5

            # Should add event to stream
            assert mock_event_stream.add_event.called

    async def test_run_success(self, temp_workspace, mock_config, mock_event_stream):
        """Test successful task run."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter
            from openhands.orchestrator import TaskResult, TaskStatus
            from openhands.core.schema import AgentState

            # Setup mock orchestrator
            mock_orch = Mock()
            result = TaskResult(
                task_id="task_1",
                status=TaskStatus.COMPLETED,
                messages=[Mock()],
                metadata={}
            )
            mock_orch.execute_simple_task = AsyncMock(return_value=result)
            MockOrch.return_value = mock_orch

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            state = await adapter.run(task="Test task", agent_type="code")

            assert state.agent_state == AgentState.FINISHED
            assert mock_orch.execute_simple_task.called

    async def test_run_failure(self, temp_workspace, mock_config, mock_event_stream):
        """Test failed task run."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter
            from openhands.orchestrator import TaskResult, TaskStatus
            from openhands.core.schema import AgentState

            # Setup mock orchestrator with failure
            mock_orch = Mock()
            result = TaskResult(
                task_id="task_1",
                status=TaskStatus.FAILED,
                error="Test error",
                metadata={}
            )
            mock_orch.execute_simple_task = AsyncMock(return_value=result)
            MockOrch.return_value = mock_orch

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            state = await adapter.run(task="Test task", agent_type="code")

            assert state.agent_state == AgentState.ERROR
            assert state.last_error == "Test error"

    async def test_run_exception(self, temp_workspace, mock_config, mock_event_stream):
        """Test run with exception."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter
            from openhands.core.schema import AgentState

            # Setup mock orchestrator that raises exception
            mock_orch = Mock()
            mock_orch.execute_simple_task = AsyncMock(side_effect=Exception("Test exception"))
            MockOrch.return_value = mock_orch

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            state = await adapter.run(task="Test task", agent_type="code")

            assert state.agent_state == AgentState.ERROR
            assert "Test exception" in state.last_error

    async def test_run_github_issue_success(self, temp_workspace, mock_config, mock_event_stream):
        """Test successful GitHub issue run."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter
            from openhands.orchestrator import TaskResult, TaskStatus
            from openhands.core.schema import AgentState

            # Setup mock orchestrator
            mock_orch = Mock()
            result = TaskResult(
                task_id="task_1",
                status=TaskStatus.COMPLETED,
                messages=[Mock()],
                metadata={}
            )
            mock_orch.execute_github_issue_workflow = AsyncMock(return_value=result)
            MockOrch.return_value = mock_orch

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            state = await adapter.run_github_issue(
                issue_title="Test issue",
                issue_body="Test body"
            )

            assert state.agent_state == AgentState.FINISHED
            assert mock_orch.execute_github_issue_workflow.called

    async def test_run_github_issue_failure(self, temp_workspace, mock_config, mock_event_stream):
        """Test failed GitHub issue run."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter
            from openhands.orchestrator import TaskResult, TaskStatus
            from openhands.core.schema import AgentState

            # Setup mock orchestrator with failure
            mock_orch = Mock()
            result = TaskResult(
                task_id="task_1",
                status=TaskStatus.FAILED,
                error="GitHub error",
                metadata={}
            )
            mock_orch.execute_github_issue_workflow = AsyncMock(return_value=result)
            MockOrch.return_value = mock_orch

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            state = await adapter.run_github_issue(
                issue_title="Test issue",
                issue_body="Test body"
            )

            assert state.agent_state == AgentState.ERROR
            assert state.last_error == "GitHub error"

    async def test_context_manager(self, temp_workspace, mock_config, mock_event_stream):
        """Test adapter as async context manager."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            mock_orch = Mock()
            mock_orch.__aenter__ = AsyncMock(return_value=mock_orch)
            mock_orch.__aexit__ = AsyncMock()
            MockOrch.return_value = mock_orch

            async with OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            ) as adapter:
                assert adapter is not None

            # Cleanup should be called
            assert mock_orch.__aexit__.called

    def test_close(self, temp_workspace, mock_config, mock_event_stream):
        """Test adapter close method."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator'):
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            # Should not raise error
            adapter.close()

    def test_api_key_from_config(self, temp_workspace, mock_config, mock_event_stream):
        """Test API key extracted from config when not provided."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator'):
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            mock_config.llm.api_key = "config-api-key"

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace)
                # No api_key provided - should use config
            )

            # Should extract from config
            # (verified by not raising ValueError)
            assert adapter is not None

    def test_missing_api_key(self, temp_workspace, mock_event_stream):
        """Test error when API key is missing."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator'):
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            mock_config = Mock()
            mock_config.llm = Mock()
            mock_config.llm.api_key = None

            with pytest.raises(ValueError, match="API key must be provided"):
                OrchestratorAdapter(
                    config=mock_config,
                    event_stream=mock_event_stream,
                    workspace=str(temp_workspace)
                )

    async def test_user_progress_callback(self, temp_workspace, mock_config, mock_event_stream):
        """Test user progress callback is called."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator'):
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            callback_calls = []

            async def user_callback(msg, metadata):
                callback_calls.append((msg, metadata))

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key",
                progress_callback=user_callback
            )

            await adapter._handle_progress("Test", {"key": "value"})

            assert len(callback_calls) == 1
            assert callback_calls[0][0] == "Test"

    async def test_event_stream_integration(self, temp_workspace, mock_config, mock_event_stream):
        """Test that events are properly added to stream."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator') as MockOrch:
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter
            from openhands.orchestrator import TaskResult, TaskStatus

            mock_orch = Mock()
            result = TaskResult(
                task_id="task_1",
                status=TaskStatus.COMPLETED,
                messages=[Mock()],
                metadata={}
            )
            mock_orch.execute_simple_task = AsyncMock(return_value=result)
            MockOrch.return_value = mock_orch

            adapter = OrchestratorAdapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            await adapter.run(task="Test task")

            # Should add multiple events (initial message, finish action, state changed)
            assert mock_event_stream.add_event.call_count >= 3


@pytest.mark.unit
class TestCreateOrchestratorAdapter:
    """Test convenience function."""

    def test_create_orchestrator_adapter(self, temp_workspace, mock_config, mock_event_stream):
        """Test create_orchestrator_adapter convenience function."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator'):
            from openhands.controller.orchestrator_adapter import create_orchestrator_adapter

            adapter = create_orchestrator_adapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace)
            )

            assert adapter is not None
            assert adapter.config == mock_config
            assert adapter.event_stream == mock_event_stream

    def test_create_with_conversation_stats(self, temp_workspace, mock_config, mock_event_stream):
        """Test create_orchestrator_adapter with conversation stats."""
        with patch('openhands.controller.orchestrator_adapter.TaskOrchestrator'):
            from openhands.controller.orchestrator_adapter import create_orchestrator_adapter

            mock_stats = Mock()

            adapter = create_orchestrator_adapter(
                config=mock_config,
                event_stream=mock_event_stream,
                workspace=str(temp_workspace),
                conversation_stats=mock_stats
            )

            assert adapter is not None
            assert adapter.conversation_stats == mock_stats
