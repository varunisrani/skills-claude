"""
End-to-end tests for simple workflows.

These tests validate complete workflows without mocking,
requiring actual API keys and services.
"""

import pytest
import os
from pathlib import Path


@pytest.mark.e2e
@pytest.mark.api
class TestSimpleWorkflowsE2E:
    """E2E tests for simple workflows (requires API key)."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_code_analysis_workflow(self, temp_workspace, skip_without_api_key):
        """Test simple code analysis workflow end-to-end."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create a sample Python file
        sample_file = temp_workspace / "sample.py"
        sample_file.write_text("""
def calculate_sum(numbers):
    '''Calculate sum of numbers.'''
    total = 0
    for num in numbers:
        total += num
    return total

def main():
    numbers = [1, 2, 3, 4, 5]
    result = calculate_sum(numbers)
    print(f"Sum: {result}")

if __name__ == "__main__":
    main()
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="analysis",
                task_description="Analyze the sample.py file and suggest improvements"
            )

            assert result.status == TaskStatus.COMPLETED
            assert len(result.messages) > 0
            assert result.error is None

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_simple_code_modification(self, temp_workspace, skip_without_api_key):
        """Test simple code modification workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create a sample file
        sample_file = temp_workspace / "greeting.py"
        sample_file.write_text("""
def greet(name):
    print("Hello " + name)

greet("World")
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="Add a docstring to the greet function"
            )

            assert result.status == TaskStatus.COMPLETED
            # File should have been modified
            content = sample_file.read_text()
            assert "docstring" in content.lower() or '"""' in content or "'''" in content

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_test_execution_workflow(self, temp_workspace, skip_without_api_key):
        """Test running tests workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create a simple test file
        test_file = temp_workspace / "test_math.py"
        test_file.write_text("""
import pytest

def test_addition():
    assert 2 + 2 == 4

def test_multiplication():
    assert 3 * 4 == 12

def test_division():
    assert 10 / 2 == 5
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="testing",
                task_description="Run the test_math.py tests using pytest"
            )

            assert result.status == TaskStatus.COMPLETED
            assert len(result.messages) > 0


@pytest.mark.e2e
@pytest.mark.api
@pytest.mark.slow
class TestMultiAgentWorkflowsE2E:
    """E2E tests for multi-agent workflows."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_analysis_then_code_workflow(self, temp_workspace, skip_without_api_key):
        """Test workflow with analysis followed by code changes."""
        from openhands.agent_hub import AgentHub

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create a file with a bug
        buggy_file = temp_workspace / "buggy.py"
        buggy_file.write_text("""
def divide_numbers(a, b):
    return a / b  # Bug: no zero check

result = divide_numbers(10, 0)
print(result)
""")

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as hub:
            # Step 1: Analysis
            analysis_results = await hub.execute_task(
                agent_type="analysis",
                task="Analyze buggy.py and identify issues"
            )

            assert len(analysis_results) > 0

            # Step 2: Fix the code
            code_results = await hub.execute_task(
                agent_type="code",
                task="Fix the division by zero bug in buggy.py"
            )

            assert len(code_results) > 0

            # File should be modified
            content = buggy_file.read_text()
            # Should have some form of zero check
            assert "if" in content or "!= 0" in content or "== 0" in content

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_parallel_tasks_workflow(self, temp_workspace, skip_without_api_key):
        """Test parallel execution of independent tasks."""
        from openhands.agent_hub import AgentHub

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create multiple files
        file1 = temp_workspace / "module1.py"
        file1.write_text("def func1(): pass")

        file2 = temp_workspace / "module2.py"
        file2.write_text("def func2(): pass")

        async with AgentHub(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as hub:
            # Execute tasks in parallel
            results = await hub.parallel_execute([
                ("analysis", "Analyze module1.py"),
                ("analysis", "Analyze module2.py")
            ])

            assert "analysis" in results
            assert len(results["analysis"]) > 0


@pytest.mark.e2e
@pytest.mark.api
class TestAdapterWorkflowsE2E:
    """E2E tests through OrchestratorAdapter."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_adapter_simple_run(self, temp_workspace, mock_config,
                                     mock_event_stream, skip_without_api_key):
        """Test simple run through adapter."""
        from openhands.controller.orchestrator_adapter import OrchestratorAdapter
        from openhands.core.schema import AgentState

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create sample file
        sample_file = temp_workspace / "test.py"
        sample_file.write_text("print('Hello')")

        async with OrchestratorAdapter(
            config=mock_config,
            event_stream=mock_event_stream,
            workspace=str(temp_workspace),
            api_key=api_key
        ) as adapter:
            state = await adapter.run(
                task="Count the number of lines in test.py"
            )

            assert state.agent_state == AgentState.FINISHED


@pytest.mark.e2e
@pytest.mark.api
class TestRealFileOperations:
    """E2E tests with real file operations."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_file_creation(self, temp_workspace, skip_without_api_key):
        """Test creating a new file."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="Create a new file called hello.py with a simple hello world function"
            )

            assert result.status == TaskStatus.COMPLETED

            # File should exist
            hello_file = temp_workspace / "hello.py"
            assert hello_file.exists()

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_file_reading(self, temp_workspace, skip_without_api_key):
        """Test reading file content."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create a file
        readme = temp_workspace / "README.md"
        readme.write_text("""
# Test Project

This is a test project for OpenHands.

## Features
- Feature 1
- Feature 2
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="analysis",
                task_description="Read README.md and list all features"
            )

            assert result.status == TaskStatus.COMPLETED

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_file_modification(self, temp_workspace, skip_without_api_key):
        """Test modifying existing file."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create a file
        config_file = temp_workspace / "config.py"
        original_content = """
DEBUG = False
PORT = 8000
"""
        config_file.write_text(original_content)

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="Change DEBUG to True in config.py"
            )

            assert result.status == TaskStatus.COMPLETED

            # File should be modified
            new_content = config_file.read_text()
            assert "DEBUG = True" in new_content or "DEBUG=True" in new_content


@pytest.mark.e2e
@pytest.mark.api
@pytest.mark.slow
class TestCompleteFeatureWorkflow:
    """E2E test for complete feature implementation."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_feature_implementation_workflow(self, temp_workspace, skip_without_api_key):
        """Test complete feature implementation workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_feature_implementation(
                feature_description="""
Create a simple calculator module:
- Function for addition
- Function for subtraction
- Each function should have a docstring
""",
                test_required=False
            )

            assert result.status == TaskStatus.COMPLETED
            assert len(result.messages) > 0

            # Some file should have been created
            py_files = list(temp_workspace.glob("*.py"))
            assert len(py_files) > 0
