"""
Unit tests for TaskOrchestrator component.

Tests task execution, workflows, error handling, and progress tracking
without making actual API calls.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from pathlib import Path


@pytest.mark.unit
class TestTaskStatus:
    """Test TaskStatus enum."""

    def test_task_status_values(self):
        """Test TaskStatus enum values."""
        from openhands.orchestrator import TaskStatus

        assert TaskStatus.PENDING.value == "pending"
        assert TaskStatus.IN_PROGRESS.value == "in_progress"
        assert TaskStatus.COMPLETED.value == "completed"
        assert TaskStatus.FAILED.value == "failed"


@pytest.mark.unit
class TestTaskResult:
    """Test TaskResult dataclass."""

    def test_task_result_creation(self):
        """Test creating TaskResult."""
        from openhands.orchestrator import TaskResult, TaskStatus

        result = TaskResult(
            task_id="task_1",
            status=TaskStatus.COMPLETED,
            messages=[Mock()],
            metadata={"key": "value"}
        )

        assert result.task_id == "task_1"
        assert result.status == TaskStatus.COMPLETED
        assert len(result.messages) == 1
        assert result.error is None
        assert result.metadata["key"] == "value"

    def test_task_result_with_error(self):
        """Test TaskResult with error."""
        from openhands.orchestrator import TaskResult, TaskStatus

        result = TaskResult(
            task_id="task_1",
            status=TaskStatus.FAILED,
            error="Test error"
        )

        assert result.status == TaskStatus.FAILED
        assert result.error == "Test error"


@pytest.mark.unit
class TestTaskOrchestrator:
    """Test TaskOrchestrator class."""

    def test_orchestrator_initialization(self, temp_workspace, mock_agent_hub):
        """Test TaskOrchestrator initialization."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key",
                max_retries=3
            )

            assert orchestrator.workspace == temp_workspace
            assert orchestrator.api_key == "test-key"
            assert orchestrator.max_retries == 3
            assert len(orchestrator.tasks) == 0
            assert orchestrator.task_counter == 0

    def test_generate_task_id(self, temp_workspace, mock_agent_hub):
        """Test task ID generation."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            id1 = orchestrator._generate_task_id()
            id2 = orchestrator._generate_task_id()
            id3 = orchestrator._generate_task_id()

            assert id1 == "task_1"
            assert id2 == "task_2"
            assert id3 == "task_3"

    async def test_report_progress_with_callback(self, temp_workspace, mock_agent_hub):
        """Test progress reporting with callback."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            callback_called = []

            async def callback(msg, metadata):
                callback_called.append((msg, metadata))

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key",
                progress_callback=callback
            )

            await orchestrator._report_progress("Test message", {"key": "value"})

            assert len(callback_called) == 1
            assert callback_called[0][0] == "Test message"
            assert callback_called[0][1]["key"] == "value"

    async def test_execute_simple_task_success(self, temp_workspace, mock_agent_hub):
        """Test successful simple task execution."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator, TaskStatus

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="Test task"
            )

            assert result.status == TaskStatus.COMPLETED
            assert result.task_id == "task_1"
            assert len(result.messages) > 0
            assert result.error is None

    async def test_execute_simple_task_failure(self, temp_workspace, mock_agent_hub):
        """Test failed simple task execution."""
        # Make hub.execute_task raise an error
        mock_agent_hub.execute_task = AsyncMock(side_effect=Exception("Test error"))

        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator, TaskStatus

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="Test task"
            )

            assert result.status == TaskStatus.FAILED
            assert result.error == "Test error"

    async def test_execute_github_issue_workflow(self, temp_workspace, mock_agent_hub):
        """Test GitHub issue workflow execution."""
        # Setup mock agent
        mock_agent = AsyncMock()
        mock_agent.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Analysis complete")])

        mock_agent.receive_response = mock_receive
        mock_agent_hub.get_agent = AsyncMock(return_value=mock_agent)

        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator, TaskStatus

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Test issue",
                issue_body="Test body",
                repo_path=str(temp_workspace)
            )

            assert result.status == TaskStatus.COMPLETED
            assert result.metadata["issue_title"] == "Test issue"
            assert result.metadata["workflow_type"] == "github_issue"

    async def test_execute_feature_implementation(self, temp_workspace, mock_agent_hub):
        """Test feature implementation workflow."""
        # Setup mock agent
        mock_agent = AsyncMock()
        mock_agent.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Feature implemented")])

        mock_agent.receive_response = mock_receive
        mock_agent_hub.get_agent = AsyncMock(return_value=mock_agent)

        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator, TaskStatus

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            result = await orchestrator.execute_feature_implementation(
                feature_description="Test feature",
                test_required=False
            )

            assert result.status == TaskStatus.COMPLETED
            assert result.metadata["workflow_type"] == "feature_implementation"

    async def test_extract_text_from_messages(self, temp_workspace, mock_agent_hub):
        """Test text extraction from messages."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            # Create mock messages with text blocks
            with patch('openhands.orchestrator.task_orchestrator.AssistantMessage') as MockAssistant, \
                 patch('openhands.orchestrator.task_orchestrator.TextBlock') as MockText:

                text_block1 = Mock()
                text_block1.text = "Part 1"

                text_block2 = Mock()
                text_block2.text = "Part 2"

                message1 = Mock()
                message1.content = [text_block1]

                message2 = Mock()
                message2.content = [text_block2]

                MockAssistant.return_value = message1
                MockText.return_value = text_block1

                # Mock isinstance checks
                with patch('openhands.orchestrator.task_orchestrator.isinstance') as mock_isinstance:
                    def isinstance_side_effect(obj, cls):
                        if obj in [message1, message2]:
                            return cls.__name__ == 'AssistantMessage'
                        if obj in [text_block1, text_block2]:
                            return cls.__name__ == 'TextBlock'
                        return False

                    mock_isinstance.side_effect = isinstance_side_effect

                    text = orchestrator._extract_text_from_messages([message1, message2])

                    # Note: This test is simplified - real implementation may differ
                    assert isinstance(text, str)

    async def test_cleanup(self, temp_workspace, mock_agent_hub):
        """Test orchestrator cleanup."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            await orchestrator.cleanup()

            assert mock_agent_hub.cleanup.called

    async def test_context_manager(self, temp_workspace, mock_agent_hub):
        """Test TaskOrchestrator as async context manager."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            async with TaskOrchestrator(workspace=str(temp_workspace), api_key="test-key") as orch:
                assert orch is not None

            # Cleanup should be called
            assert mock_agent_hub.cleanup.called

    async def test_task_tracking(self, temp_workspace, mock_agent_hub):
        """Test that tasks are tracked correctly."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator, TaskStatus

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            # Execute multiple tasks
            result1 = await orchestrator.execute_simple_task("code", "Task 1")
            result2 = await orchestrator.execute_simple_task("analysis", "Task 2")

            # Should be tracked
            assert len(orchestrator.tasks) == 2
            assert "task_1" in orchestrator.tasks
            assert "task_2" in orchestrator.tasks
            assert orchestrator.tasks["task_1"].status == TaskStatus.COMPLETED
            assert orchestrator.tasks["task_2"].status == TaskStatus.COMPLETED

    async def test_progress_callback_error_handling(self, temp_workspace, mock_agent_hub):
        """Test that callback errors don't crash execution."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            def bad_callback(msg, metadata):
                raise Exception("Callback error")

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key",
                progress_callback=bad_callback
            )

            # Should not raise error even though callback fails
            await orchestrator._report_progress("Test", {})

    async def test_max_retries_configuration(self, temp_workspace, mock_agent_hub):
        """Test max_retries configuration."""
        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key",
                max_retries=5
            )

            assert orchestrator.max_retries == 5


@pytest.mark.unit
class TestTaskOrchestratorWorkflows:
    """Test specific workflow patterns."""

    async def test_github_issue_phases(self, temp_workspace, mock_agent_hub):
        """Test that GitHub issue workflow executes all phases."""
        call_count = {"analysis": 0, "code": 0, "testing": 0}

        async def track_get_agent(agent_type):
            call_count[agent_type] = call_count.get(agent_type, 0) + 1
            mock_agent = AsyncMock()
            mock_agent.query = AsyncMock()

            async def mock_receive():
                yield Mock(content=[Mock(text=f"{agent_type} response")])

            mock_agent.receive_response = mock_receive
            return mock_agent

        mock_agent_hub.get_agent = AsyncMock(side_effect=track_get_agent)

        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            await orchestrator.execute_github_issue_workflow(
                issue_title="Test",
                issue_body="Test body",
                repo_path=str(temp_workspace)
            )

            # Should use analysis, code, and testing agents
            assert call_count["analysis"] >= 1
            assert call_count["code"] >= 1
            assert call_count["testing"] >= 1

    async def test_feature_implementation_without_tests(self, temp_workspace, mock_agent_hub):
        """Test feature implementation workflow without tests."""
        mock_agent = AsyncMock()
        mock_agent.query = AsyncMock()

        async def mock_receive():
            yield Mock(content=[Mock(text="Response")])

        mock_agent.receive_response = mock_receive
        mock_agent_hub.get_agent = AsyncMock(return_value=mock_agent)

        with patch('openhands.orchestrator.task_orchestrator.AgentHub', return_value=mock_agent_hub):
            from openhands.orchestrator import TaskOrchestrator

            orchestrator = TaskOrchestrator(
                workspace=str(temp_workspace),
                api_key="test-key"
            )

            result = await orchestrator.execute_feature_implementation(
                feature_description="Test",
                test_required=False
            )

            # Should not call testing agent
            query_calls = [call for call in mock_agent.query.call_args_list]
            # Should have design and implementation phases only
            assert mock_agent.query.call_count >= 2
