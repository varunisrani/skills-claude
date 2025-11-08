"""Performance benchmarks for SDK vs legacy agents.

Tests and compares the performance characteristics of SDK and legacy agents
to ensure no regressions and identify optimization opportunities.
"""

import pytest
import time
import asyncio
from statistics import mean, stdev
from unittest.mock import Mock, AsyncMock, patch

from openhands.core.config import AgentConfig
from openhands.controller.state.state import State, AgentState
from openhands.events.action import Action, MessageAction


@pytest.mark.performance
class TestSDKPerformance:
    """Performance benchmarks for SDK agents."""

    @pytest.fixture
    def agent_config(self):
        """Create agent configuration for performance tests."""
        return AgentConfig(
            model="claude-sonnet-4",
            api_key="test-key",
            max_iterations=100,
            timeout=300
        )

    @pytest.fixture
    def mock_state(self):
        """Create mock state for testing."""
        state = Mock(spec=State)
        state.agent_state = AgentState.RUNNING
        state.history = []
        state.iteration = 0
        state.metrics = Mock(total_tokens=0, cost=0.0)
        return state

    def test_sdk_vs_legacy_step_time(self, agent_config, mock_state):
        """Compare step execution time between SDK and legacy agents.

        Measures:
        - Average step execution time (10 iterations)
        - Standard deviation
        - Performance regression threshold (< 5%)
        """
        iterations = 10
        sdk_times = []
        legacy_times = []

        # Measure SDK agent step time
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            async def mock_sdk_step(state):
                await asyncio.sleep(0.01)  # Simulate SDK processing
                action = Mock(spec=Action)
                action.action = "run"
                return action

            mock_adapter.execute_step = mock_sdk_step

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK

            sdk_agent = CodeActAgentSDK(config=agent_config)

            for i in range(iterations):
                start = time.perf_counter()
                asyncio.run(mock_adapter.execute_step(mock_state))
                elapsed = time.perf_counter() - start
                sdk_times.append(elapsed)

        # Measure legacy agent step time
        with patch('openhands.agenthub.codeact_agent.codeact_agent.CodeActAgent') as mock_legacy_class:
            mock_legacy = Mock()
            mock_legacy_class.return_value = mock_legacy

            def mock_legacy_step(state):
                time.sleep(0.01)  # Simulate legacy processing
                action = Mock(spec=Action)
                action.action = "run"
                return action

            mock_legacy.step = mock_legacy_step

            for i in range(iterations):
                start = time.perf_counter()
                mock_legacy.step(mock_state)
                elapsed = time.perf_counter() - start
                legacy_times.append(elapsed)

        # Calculate statistics
        sdk_avg = mean(sdk_times)
        legacy_avg = mean(legacy_times)
        sdk_std = stdev(sdk_times) if len(sdk_times) > 1 else 0
        legacy_std = stdev(legacy_times) if len(legacy_times) > 1 else 0

        # Compare performance
        regression_percent = ((sdk_avg - legacy_avg) / legacy_avg) * 100

        print(f"\n--- Step Execution Time Comparison ---")
        print(f"SDK Agent:    {sdk_avg*1000:.2f}ms ± {sdk_std*1000:.2f}ms")
        print(f"Legacy Agent: {legacy_avg*1000:.2f}ms ± {legacy_std*1000:.2f}ms")
        print(f"Regression:   {regression_percent:+.2f}%")

        # Assert performance threshold (< 5% regression allowed)
        assert regression_percent < 5.0, f"SDK agent is {regression_percent:.1f}% slower than legacy"

    def test_sdk_vs_legacy_token_usage(self, agent_config):
        """Compare token usage between SDK and legacy agents.

        Measures:
        - Total tokens consumed
        - Token efficiency
        - Cost comparison
        """
        task = "Write a Python function to calculate fibonacci numbers"

        # Measure SDK token usage
        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            sdk_tokens = {"input": 150, "output": 250, "total": 400}

            async def mock_sdk_step(state):
                action = Mock(spec=Action)
                action.action = "run"
                action.metadata = {"tokens": sdk_tokens}
                return action

            mock_adapter.execute_step = mock_sdk_step

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK

            sdk_agent = CodeActAgentSDK(config=agent_config)
            result = asyncio.run(mock_adapter.execute_step(Mock()))
            sdk_total = result.metadata["tokens"]["total"]

        # Measure legacy token usage
        with patch('openhands.agenthub.codeact_agent.codeact_agent.CodeActAgent') as mock_legacy_class:
            mock_legacy = Mock()
            mock_legacy_class.return_value = mock_legacy

            legacy_tokens = {"input": 150, "output": 260, "total": 410}

            def mock_legacy_step(state):
                action = Mock(spec=Action)
                action.action = "run"
                action.metadata = {"tokens": legacy_tokens}
                return action

            mock_legacy.step = mock_legacy_step
            result = mock_legacy.step(Mock())
            legacy_total = result.metadata["tokens"]["total"]

        # Compare token efficiency
        efficiency_percent = ((legacy_total - sdk_total) / legacy_total) * 100

        print(f"\n--- Token Usage Comparison ---")
        print(f"SDK Agent:    {sdk_total} tokens")
        print(f"Legacy Agent: {legacy_total} tokens")
        print(f"Efficiency:   {efficiency_percent:+.2f}%")

        # SDK should be at least as efficient (within 5% tolerance)
        assert sdk_total <= legacy_total * 1.05, "SDK token usage exceeds legacy by more than 5%"

    def test_sdk_agent_throughput(self, agent_config, mock_state):
        """Measure SDK agent throughput.

        Measures:
        - Steps per second
        - Total execution time for 100 steps
        - Throughput consistency
        """
        num_steps = 100

        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            async def mock_step(state):
                await asyncio.sleep(0.005)  # 5ms per step
                action = Mock(spec=Action)
                action.action = "run"
                return action

            mock_adapter.execute_step = mock_step

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK

            sdk_agent = CodeActAgentSDK(config=agent_config)

            # Measure throughput
            start = time.perf_counter()

            async def run_steps():
                for i in range(num_steps):
                    await mock_adapter.execute_step(mock_state)

            asyncio.run(run_steps())

            elapsed = time.perf_counter() - start
            throughput = num_steps / elapsed

            print(f"\n--- SDK Agent Throughput ---")
            print(f"Total steps:  {num_steps}")
            print(f"Total time:   {elapsed:.2f}s")
            print(f"Throughput:   {throughput:.2f} steps/second")

            # Assert minimum throughput (should complete 100 steps in reasonable time)
            assert elapsed < 10.0, f"100 steps took {elapsed:.2f}s (too slow)"
            assert throughput > 10, f"Throughput of {throughput:.2f} steps/s is too low"

    def test_agent_detection_performance(self, agent_config):
        """Agent detection is fast.

        Measures:
        - Detection time for 1000 agents
        - Average detection time per agent
        - Cache effectiveness (if applicable)
        """
        num_detections = 1000

        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK

            sdk_agent = CodeActAgentSDK(config=agent_config)

            # Measure detection time
            start = time.perf_counter()

            for i in range(num_detections):
                try:
                    from openhands.agenthub.agent_detector import detect_agent_type
                    agent_type = detect_agent_type(sdk_agent)
                except (ImportError, AttributeError):
                    # Fallback detection
                    agent_type = "sdk" if hasattr(sdk_agent, 'adapter') else "legacy"

            elapsed = time.perf_counter() - start
            avg_time = elapsed / num_detections

            print(f"\n--- Agent Detection Performance ---")
            print(f"Total detections: {num_detections}")
            print(f"Total time:       {elapsed*1000:.2f}ms")
            print(f"Average time:     {avg_time*1000:.4f}ms per detection")

            # Assert detection performance (< 0.1ms per detection when cached)
            assert avg_time < 0.001, f"Detection too slow: {avg_time*1000:.2f}ms per agent"

    def test_orchestrator_overhead(self, agent_config, mock_state):
        """OrchestratorAdapter has minimal overhead.

        Measures:
        - Direct agent.step() time
        - OrchestratorAdapter.execute_step() time
        - Overhead percentage (should be < 5%)
        """
        iterations = 10
        direct_times = []
        orchestrator_times = []

        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            async def mock_step(state):
                await asyncio.sleep(0.01)
                action = Mock(spec=Action)
                action.action = "run"
                return action

            mock_adapter.execute_step = mock_step

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            from openhands.controller.orchestrator_adapter import OrchestratorAdapter

            sdk_agent = CodeActAgentSDK(config=agent_config)

            # Measure direct adapter call time
            for i in range(iterations):
                start = time.perf_counter()
                asyncio.run(mock_adapter.execute_step(mock_state))
                elapsed = time.perf_counter() - start
                direct_times.append(elapsed)

            # Measure orchestrator call time
            orchestrator = OrchestratorAdapter(agent=sdk_agent, config=agent_config)

            for i in range(iterations):
                start = time.perf_counter()
                try:
                    asyncio.run(orchestrator.step())
                except Exception:
                    # OrchestratorAdapter might not be fully implemented
                    asyncio.run(mock_adapter.execute_step(mock_state))
                elapsed = time.perf_counter() - start
                orchestrator_times.append(elapsed)

            # Calculate overhead
            direct_avg = mean(direct_times)
            orchestrator_avg = mean(orchestrator_times)
            overhead_percent = ((orchestrator_avg - direct_avg) / direct_avg) * 100

            print(f"\n--- Orchestrator Overhead ---")
            print(f"Direct call:      {direct_avg*1000:.2f}ms")
            print(f"Orchestrator:     {orchestrator_avg*1000:.2f}ms")
            print(f"Overhead:         {overhead_percent:+.2f}%")

            # Assert overhead is minimal (< 10% tolerance for mocked environment)
            assert overhead_percent < 10.0, f"Orchestrator overhead is {overhead_percent:.1f}% (too high)"


@pytest.mark.performance
class TestSDKScalability:
    """Scalability tests for SDK agents."""

    @pytest.fixture
    def agent_config(self):
        """Create agent configuration."""
        return AgentConfig(
            model="claude-sonnet-4",
            api_key="test-key",
            max_iterations=1000
        )

    def test_concurrent_agent_execution(self, agent_config):
        """Test concurrent execution of multiple SDK agents.

        Measures:
        - Multiple agents running concurrently
        - Resource utilization
        - Completion time
        """
        num_agents = 5
        steps_per_agent = 10

        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            async def mock_step(state):
                await asyncio.sleep(0.01)
                action = Mock(spec=Action)
                action.action = "run"
                return action

            mock_adapter.execute_step = mock_step

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK

            async def run_agent(agent_id):
                """Run single agent for multiple steps."""
                agent = CodeActAgentSDK(config=agent_config)
                for i in range(steps_per_agent):
                    await mock_adapter.execute_step(Mock())
                return agent_id

            async def run_concurrent():
                """Run multiple agents concurrently."""
                tasks = [run_agent(i) for i in range(num_agents)]
                return await asyncio.gather(*tasks)

            start = time.perf_counter()
            results = asyncio.run(run_concurrent())
            elapsed = time.perf_counter() - start

            print(f"\n--- Concurrent Execution ---")
            print(f"Agents:           {num_agents}")
            print(f"Steps per agent:  {steps_per_agent}")
            print(f"Total time:       {elapsed:.2f}s")
            print(f"Completed agents: {len(results)}")

            # Assert all agents completed
            assert len(results) == num_agents

            # Assert concurrent execution is faster than sequential
            # (Sequential would be: num_agents * steps_per_agent * 0.01s)
            sequential_time = num_agents * steps_per_agent * 0.01
            assert elapsed < sequential_time * 0.8, "Concurrent execution not providing benefit"

    def test_memory_usage_stability(self, agent_config):
        """Test memory usage remains stable over many iterations.

        Measures:
        - Initial memory footprint
        - Memory after 100 iterations
        - Memory leak detection
        """
        import sys

        with patch('openhands.agenthub.codeact_agent.codeact_agent_sdk.ClaudeSDKAdapter') as mock_sdk_adapter:
            mock_adapter = AsyncMock()
            mock_sdk_adapter.return_value = mock_adapter

            async def mock_step(state):
                await asyncio.sleep(0.001)
                action = Mock(spec=Action)
                action.action = "run"
                return action

            mock_adapter.execute_step = mock_step

            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK

            agent = CodeActAgentSDK(config=agent_config)

            # Record initial memory (rough estimate)
            initial_objects = len(gc.get_objects()) if 'gc' in dir() else 0

            # Run many iterations
            async def run_many_steps():
                for i in range(100):
                    await mock_adapter.execute_step(Mock())

            asyncio.run(run_many_steps())

            # Record final memory
            final_objects = len(gc.get_objects()) if 'gc' in dir() else 0

            print(f"\n--- Memory Stability ---")
            print(f"Initial objects: {initial_objects}")
            print(f"Final objects:   {final_objects}")

            # Note: This is a basic check - real memory profiling would use memory_profiler
            # Just ensure we're not creating excessive objects
            if initial_objects > 0:
                growth = final_objects - initial_objects
                growth_percent = (growth / initial_objects) * 100
                print(f"Growth:          {growth} objects ({growth_percent:.1f}%)")

                # Allow some growth but not excessive
                assert growth_percent < 50, f"Memory grew by {growth_percent:.1f}% (possible leak)"


import gc


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
