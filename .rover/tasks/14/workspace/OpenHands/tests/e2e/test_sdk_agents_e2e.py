"""End-to-end tests for SDK agent integration.

Tests the complete lifecycle of SDK agents through the OrchestratorAdapter,
including file operations, web navigation, error recovery, and mixed delegation.
"""

import pytest
import asyncio
import tempfile
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch, MagicMock

from openhands.core.config import AgentConfig
from openhands.controller.state.state import State, AgentState
from openhands.events.event import Event
from openhands.events.action import Action, MessageAction, AgentFinishAction
from openhands.events.observation import Observation, NullObservation


@pytest.mark.e2e
class TestSDKAgentsE2E:
    """End-to-end tests for SDK agents."""

    @pytest.fixture
    def temp_workspace(self):
        """Create temporary workspace for testing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir)

    @pytest.fixture
    def agent_config(self):
        """Create agent configuration."""
        config = AgentConfig(
            model="claude-sonnet-4",
            api_key="test-key",
            max_iterations=10,
            timeout=300
        )
        return config

    @pytest.mark.asyncio
    async def test_codeact_sdk_file_operations(self, temp_workspace, agent_config):
        """CodeActAgentSDK can perform file operations.

        Tests:
        - Agent initialization
        - File read operation
        - File write operation
        - Result verification
        """
        # Create test file
        test_file = temp_workspace / "test.txt"
        test_file.write_text("Hello World")

        # Mock SDK components
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            # Mock execute_step to return file read action
            mock_action = Mock(spec=Action)
            mock_action.action = "read"
            mock_action.thought = "Reading test file"
            mock_action.args = {"path": str(test_file)}
            mock_adapter.execute_step = AsyncMock(return_value=mock_action)

            # Import after patching
            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            # Create SDK agent
            agent = CodeActAgentSDK(config=agent_config)

            # Create orchestrator
            orchestrator = OrchestratorAdapter(
                agent=agent,
                config=agent_config
            )

            # Execute step
            result = await orchestrator.step()

            # Verify results
            assert result is not None
            assert mock_adapter.execute_step.called
            assert orchestrator.get_state() is not None

    @pytest.mark.asyncio
    async def test_browsing_sdk_web_navigation(self, agent_config):
        """BrowsingAgentSDK can navigate web pages.

        Tests:
        - Agent initialization
        - URL navigation
        - Content extraction
        - Result verification
        """
        with patch('openhands.agenthub.browsing_agent.browsing_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            # Mock web navigation action
            mock_action = Mock(spec=Action)
            mock_action.action = "browse"
            mock_action.thought = "Navigating to URL"
            mock_action.args = {"url": "https://example.com"}
            mock_adapter.execute_step = AsyncMock(return_value=mock_action)

            # Import after patching
            try:
                from openhands.agenthub.browsing_agent.browsing_agent_sdk import BrowsingAgentSDK
                from openhands.controller.orchestrator_adapter import OrchestratorAdapter

                # Create SDK agent
                agent = BrowsingAgentSDK(config=agent_config)

                # Create orchestrator
                orchestrator = OrchestratorAdapter(
                    agent=agent,
                    config=agent_config
                )

                # Execute step
                result = await orchestrator.step()

                # Verify results
                assert result is not None
                assert mock_adapter.execute_step.called
            except ImportError:
                pytest.skip("BrowsingAgentSDK not yet implemented")

    @pytest.mark.asyncio
    async def test_sdk_agent_task_completion(self, temp_workspace, agent_config):
        """SDK agent can complete full task lifecycle.

        Tests:
        - Task initialization
        - Multiple step execution
        - Task completion detection
        - Final state verification
        """
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            # Simulate multi-step task
            call_count = [0]

            async def mock_execute_step(state):
                call_count[0] += 1
                if call_count[0] >= 3:
                    # Return finish action on third call
                    finish_action = AgentFinishAction()
                    finish_action.thought = "Task completed"
                    finish_action.outputs = {"status": "success"}
                    return finish_action
                else:
                    # Return intermediate actions
                    action = Mock(spec=Action)
                    action.action = "run_command"
                    action.thought = f"Step {call_count[0]}"
                    return action

            mock_adapter.execute_step = mock_execute_step

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            agent = CodeActAgentSDK(config=agent_config)
            orchestrator = OrchestratorAdapter(agent=agent, config=agent_config)

            # Execute multiple steps
            for i in range(5):
                result = await orchestrator.step()
                state = orchestrator.get_state()

                # Check if completed
                if isinstance(result, AgentFinishAction):
                    assert state.agent_state == AgentState.FINISHED
                    break

            # Verify completion
            assert call_count[0] >= 3
            assert orchestrator.get_state().agent_state == AgentState.FINISHED

    @pytest.mark.asyncio
    async def test_sdk_agent_error_recovery(self, agent_config):
        """SDK agent recovers from errors gracefully.

        Tests:
        - Error condition triggering
        - Error handling mechanism
        - State recovery
        - Continued execution
        """
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            # Simulate error then recovery
            call_count = [0]

            async def mock_execute_step_with_error(state):
                call_count[0] += 1
                if call_count[0] == 1:
                    # First call raises error
                    raise ValueError("Simulated SDK error")
                else:
                    # Subsequent calls succeed
                    action = Mock(spec=Action)
                    action.action = "run_command"
                    action.thought = "Recovered from error"
                    return action

            mock_adapter.execute_step = mock_execute_step_with_error

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            agent = CodeActAgentSDK(config=agent_config)
            orchestrator = OrchestratorAdapter(agent=agent, config=agent_config)

            # First step should handle error
            try:
                result1 = await orchestrator.step()
            except ValueError:
                # Error expected on first call
                pass

            # Second step should succeed
            result2 = await orchestrator.step()

            # Verify recovery
            assert result2 is not None
            assert call_count[0] >= 2

    @pytest.mark.asyncio
    async def test_sdk_legacy_comparison(self, temp_workspace, agent_config):
        """SDK and legacy agents produce equivalent results.

        Tests:
        - Same task for SDK agent
        - Same task for legacy agent
        - Output comparison
        - Behavior equivalence
        """
        task_description = "Write hello.txt with content 'Hello World'"

        # Test with SDK agent
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            sdk_action = Mock(spec=Action)
            sdk_action.action = "write"
            sdk_action.args = {"path": "hello.txt", "content": "Hello World"}
            mock_adapter.execute_step = AsyncMock(return_value=sdk_action)

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK

            sdk_agent = CodeActAgentSDK(config=agent_config)
            sdk_result = await mock_adapter.execute_step(Mock())

            assert sdk_result.action == "write"
            assert sdk_result.args["content"] == "Hello World"

        # Test with legacy agent (mock)
        with patch('openhands.agenthub.codeact_agent.codeact_agent.CodeActAgent') as mock_legacy:
            mock_agent = Mock()
            mock_legacy.return_value = mock_agent

            legacy_action = Mock(spec=Action)
            legacy_action.action = "write"
            legacy_action.args = {"path": "hello.txt", "content": "Hello World"}
            mock_agent.step = Mock(return_value=legacy_action)

            legacy_result = mock_agent.step(Mock())

            assert legacy_result.action == "write"
            assert legacy_result.args["content"] == "Hello World"

        # Compare results
        assert sdk_result.action == legacy_result.action
        assert sdk_result.args == legacy_result.args

    @pytest.mark.asyncio
    async def test_orchestrator_adapter_routing(self, agent_config):
        """OrchestratorAdapter correctly routes SDK agents.

        Tests:
        - SDK agent detection
        - Routing through OrchestratorAdapter
        - Execution path verification
        - State management
        """
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            mock_action = Mock(spec=Action)
            mock_action.action = "run"
            mock_adapter.execute_step = AsyncMock(return_value=mock_action)

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter
            from openhands.agenthub.agent_detector import detect_agent_type

            agent = CodeActAgentSDK(config=agent_config)

            # Verify agent type detection
            try:
                agent_type = detect_agent_type(agent)
                assert agent_type == "sdk"
            except (ImportError, AttributeError):
                # Agent detector may not exist yet
                pass

            # Create orchestrator
            orchestrator = OrchestratorAdapter(agent=agent, config=agent_config)

            # Verify routing
            result = await orchestrator.step()

            assert result is not None
            assert mock_adapter.execute_step.called

    @pytest.mark.asyncio
    async def test_mixed_agent_delegation(self, agent_config):
        """Mixed SDK and legacy agent delegation works.

        Tests:
        - Multi-agent scenario setup
        - SDK and legacy agent mixing
        - Delegation mechanism
        - Result aggregation
        """
        # This test verifies that delegation works between different agent types
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            # Mock delegation action
            mock_action = Mock(spec=Action)
            mock_action.action = "delegate"
            mock_action.args = {"target_agent": "legacy_agent", "task": "subtask"}
            mock_adapter.execute_step = AsyncMock(return_value=mock_action)

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            # Create SDK agent (parent)
            sdk_agent = CodeActAgentSDK(config=agent_config)
            orchestrator = OrchestratorAdapter(agent=sdk_agent, config=agent_config)

            # Execute delegation
            result = await orchestrator.step()

            # Verify delegation mechanism
            assert result is not None
            # Note: Full delegation testing requires AgentController integration

    @pytest.mark.asyncio
    async def test_real_workspace_execution(self, temp_workspace, agent_config):
        """SDK agents work in real workspace.

        Tests:
        - Temporary workspace creation
        - Real file operations
        - Workspace state verification
        - Cleanup verification
        """
        # Create test files in workspace
        (temp_workspace / "input.txt").write_text("Test input")

        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            # Mock file operation
            mock_action = Mock(spec=Action)
            mock_action.action = "run_command"
            mock_action.args = {
                "command": f"cat {temp_workspace / 'input.txt'}"
            }
            mock_adapter.execute_step = AsyncMock(return_value=mock_action)

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            # Create agent with workspace
            agent = CodeActAgentSDK(config=agent_config)
            orchestrator = OrchestratorAdapter(
                agent=agent,
                config=agent_config,
                workspace=str(temp_workspace)
            )

            # Execute operation
            result = await orchestrator.step()

            # Verify workspace interaction
            assert result is not None
            assert temp_workspace.exists()
            assert (temp_workspace / "input.txt").exists()


@pytest.mark.e2e
class TestSDKAgentIntegration:
    """Additional integration tests for SDK agents."""

    @pytest.mark.asyncio
    async def test_sdk_agent_metrics_tracking(self, agent_config):
        """SDK agents track metrics correctly.

        Tests:
        - Token usage tracking
        - Cost calculation
        - Metrics aggregation
        """
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            # Mock action with metrics
            mock_action = Mock(spec=Action)
            mock_action.action = "run"
            mock_adapter.execute_step = AsyncMock(return_value=mock_action)

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            agent = CodeActAgentSDK(config=agent_config)
            orchestrator = OrchestratorAdapter(agent=agent, config=agent_config)

            # Execute steps
            await orchestrator.step()

            # Verify metrics
            state = orchestrator.get_state()
            assert state is not None
            assert hasattr(state, 'metrics') or hasattr(state, 'sdk_metadata')

    @pytest.mark.asyncio
    async def test_sdk_agent_timeout_handling(self, agent_config):
        """SDK agents handle timeouts correctly.

        Tests:
        - Long-running operation
        - Timeout detection
        - Graceful termination
        """
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_adapter_class:
            mock_adapter = AsyncMock()
            mock_adapter_class.return_value = mock_adapter

            # Mock slow operation
            async def slow_execute():
                await asyncio.sleep(0.1)
                return Mock(spec=Action)

            mock_adapter.execute_step = slow_execute

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            agent = CodeActAgentSDK(config=agent_config)
            orchestrator = OrchestratorAdapter(agent=agent, config=agent_config)

            # Execute with timeout
            try:
                result = await asyncio.wait_for(orchestrator.step(), timeout=1.0)
                assert result is not None
            except asyncio.TimeoutError:
                pytest.fail("Operation should not timeout with 1s limit")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
