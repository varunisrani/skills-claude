"""
Pytest configuration and fixtures for OpenHands test suite.

This module provides common fixtures, mocks, and utilities for testing
the Claude Agent SDK integration.
"""

import asyncio
import os
import pytest
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional
from unittest.mock import Mock, AsyncMock, MagicMock, patch
import logging

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# ============================================================================
# Pytest Configuration
# ============================================================================

def pytest_configure(config):
    """Configure pytest with custom settings."""
    # Register custom markers
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "e2e: End-to-end tests")
    config.addinivalue_line("markers", "api: Tests requiring API keys")
    config.addinivalue_line("markers", "slow: Slow running tests")


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on location."""
    for item in items:
        # Add markers based on test location
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)


# ============================================================================
# Basic Fixtures
# ============================================================================

@pytest.fixture
def temp_workspace(tmp_path):
    """
    Create a temporary workspace directory for testing.

    Returns:
        Path: Temporary workspace directory
    """
    workspace = tmp_path / "workspace"
    workspace.mkdir(parents=True, exist_ok=True)
    return workspace


@pytest.fixture
def api_key():
    """
    Get API key from environment or return mock key.

    Returns:
        str: API key (real or mock)
    """
    return os.getenv("ANTHROPIC_API_KEY", "test-api-key-mock")


@pytest.fixture
def skip_without_api_key():
    """Skip test if API key is not available."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        pytest.skip("ANTHROPIC_API_KEY not set")


# ============================================================================
# Mock Fixtures
# ============================================================================

@pytest.fixture
def mock_claude_client():
    """
    Mock ClaudeSDKClient for testing without API calls.

    Returns:
        AsyncMock: Mocked client
    """
    client = AsyncMock()
    client.connect = AsyncMock()
    client.disconnect = AsyncMock()
    client.query = AsyncMock()

    async def mock_receive():
        """Mock response generator."""
        from openhands.orchestrator import TaskStatus
        yield Mock(content=[Mock(text="Test response")])

    client.receive_response = mock_receive
    return client


@pytest.fixture
def mock_agent_hub(mock_claude_client):
    """
    Mock AgentHub for testing without creating real agents.

    Returns:
        Mock: Mocked AgentHub
    """
    hub = Mock()
    hub.workspace = Path("/tmp/test-workspace")
    hub.api_key = "test-api-key"
    hub.agents = {}
    hub.configs = {
        "code": Mock(agent_type="code", allowed_tools=["Read", "Write", "Edit"]),
        "analysis": Mock(agent_type="analysis", allowed_tools=["Read", "Grep"]),
        "testing": Mock(agent_type="testing", allowed_tools=["Read", "Bash"]),
    }

    async def mock_get_agent(agent_type):
        return mock_claude_client

    async def mock_execute_task(agent_type, task, callback=None):
        return [Mock(content="Test result")]

    async def mock_cleanup():
        pass

    hub.get_agent = AsyncMock(side_effect=mock_get_agent)
    hub.execute_task = AsyncMock(side_effect=mock_execute_task)
    hub.cleanup = AsyncMock(side_effect=mock_cleanup)

    return hub


@pytest.fixture
def mock_orchestrator(mock_agent_hub):
    """
    Mock TaskOrchestrator for testing without real execution.

    Returns:
        Mock: Mocked TaskOrchestrator
    """
    from openhands.orchestrator import TaskResult, TaskStatus

    orchestrator = Mock()
    orchestrator.workspace = Path("/tmp/test-workspace")
    orchestrator.api_key = "test-api-key"
    orchestrator.hub = mock_agent_hub
    orchestrator.tasks = {}
    orchestrator.task_counter = 0

    async def mock_execute_simple(agent_type, task_description):
        orchestrator.task_counter += 1
        return TaskResult(
            task_id=f"task_{orchestrator.task_counter}",
            status=TaskStatus.COMPLETED,
            messages=[Mock(content="Test result")],
            metadata={"agent_type": agent_type}
        )

    async def mock_execute_github(issue_title, issue_body, repo_path):
        orchestrator.task_counter += 1
        return TaskResult(
            task_id=f"task_{orchestrator.task_counter}",
            status=TaskStatus.COMPLETED,
            messages=[Mock(content="GitHub issue resolved")],
            metadata={"issue_title": issue_title}
        )

    async def mock_cleanup():
        pass

    orchestrator.execute_simple_task = AsyncMock(side_effect=mock_execute_simple)
    orchestrator.execute_github_issue_workflow = AsyncMock(side_effect=mock_execute_github)
    orchestrator.execute_feature_implementation = AsyncMock(side_effect=mock_execute_simple)
    orchestrator.cleanup = AsyncMock(side_effect=mock_cleanup)

    return orchestrator


@pytest.fixture
def mock_event_stream():
    """
    Mock EventStream for testing OrchestratorAdapter.

    Returns:
        Mock: Mocked EventStream
    """
    stream = Mock()
    stream.add_event = Mock()
    stream.get_events = Mock(return_value=[])
    return stream


@pytest.fixture
def mock_config():
    """
    Mock OpenHandsConfig for testing.

    Returns:
        Mock: Mocked config
    """
    config = Mock()
    config.max_iterations = 100
    config.llm = Mock()
    config.llm.api_key = "test-api-key"
    config.llm.model = "claude-sonnet-4-5-20250929"
    return config


# ============================================================================
# MCP Server Fixtures
# ============================================================================

@pytest.fixture
def mock_jupyter_mcp():
    """
    Mock Jupyter MCP server.

    Returns:
        Mock: Mocked Jupyter MCP server
    """
    mcp = Mock()
    mcp.execute_python = AsyncMock(return_value={"result": "Success", "output": "42"})
    mcp.kernel_info = AsyncMock(return_value={"kernel": "python3", "status": "idle"})
    mcp.reset_kernel = AsyncMock(return_value={"status": "reset"})
    return mcp


@pytest.fixture
def mock_browser_mcp():
    """
    Mock Browser MCP server.

    Returns:
        Mock: Mocked Browser MCP server
    """
    mcp = Mock()
    mcp.navigate = AsyncMock(return_value={"url": "https://example.com", "status": "success"})
    mcp.interact = AsyncMock(return_value={"action": "click", "success": True})
    mcp.extract_content = AsyncMock(return_value={"content": "Test content"})
    mcp.screenshot = AsyncMock(return_value={"image": "base64data"})
    return mcp


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def sample_issue():
    """
    Sample GitHub issue for testing.

    Returns:
        Dict: Issue data
    """
    return {
        "title": "Add authentication feature",
        "body": "Implement user authentication with JWT tokens.\n\nRequirements:\n- Login endpoint\n- Token generation\n- Token validation",
        "number": 123,
        "state": "open"
    }


@pytest.fixture
def sample_task():
    """
    Sample task description for testing.

    Returns:
        str: Task description
    """
    return "Refactor the authentication module to use async/await"


@pytest.fixture
def sample_code_file(temp_workspace):
    """
    Create a sample Python file for testing.

    Returns:
        Path: Path to created file
    """
    file_path = temp_workspace / "sample.py"
    file_path.write_text("""
def hello_world():
    '''Say hello.'''
    print("Hello, World!")

def add_numbers(a, b):
    '''Add two numbers.'''
    return a + b

if __name__ == "__main__":
    hello_world()
    print(add_numbers(2, 3))
""")
    return file_path


@pytest.fixture
def sample_test_file(temp_workspace):
    """
    Create a sample test file.

    Returns:
        Path: Path to created file
    """
    file_path = temp_workspace / "test_sample.py"
    file_path.write_text("""
import pytest

def test_addition():
    assert 2 + 2 == 4

def test_string():
    assert "hello".upper() == "HELLO"

def test_list():
    assert [1, 2, 3] == [1, 2, 3]
""")
    return file_path


# ============================================================================
# Performance Tracking Fixtures
# ============================================================================

@pytest.fixture
def performance_tracker():
    """
    Track performance metrics during tests.

    Returns:
        Dict: Performance metrics
    """
    import time

    metrics = {
        "start_time": time.time(),
        "end_time": None,
        "duration": None,
        "memory_start": None,
        "memory_end": None,
        "api_calls": 0,
        "tokens_used": 0,
    }

    yield metrics

    metrics["end_time"] = time.time()
    metrics["duration"] = metrics["end_time"] - metrics["start_time"]


@pytest.fixture
def cost_tracker():
    """
    Track costs during tests.

    Returns:
        Dict: Cost tracking data
    """
    costs = {
        "total_cost": 0.0,
        "input_tokens": 0,
        "output_tokens": 0,
        "api_calls": 0,
        "cost_per_call": [],
    }

    def add_call(input_tokens, output_tokens, model="claude-sonnet-4-5"):
        """Add cost for an API call."""
        # Approximate pricing (update with actual rates)
        input_cost = input_tokens * 0.000003  # $3 per million tokens
        output_cost = output_tokens * 0.000015  # $15 per million tokens
        call_cost = input_cost + output_cost

        costs["input_tokens"] += input_tokens
        costs["output_tokens"] += output_tokens
        costs["total_cost"] += call_cost
        costs["api_calls"] += 1
        costs["cost_per_call"].append(call_cost)

    costs["add_call"] = add_call
    return costs


# ============================================================================
# Comparison Fixtures
# ============================================================================

@pytest.fixture
def legacy_controller_mock():
    """
    Mock legacy AgentController for comparison testing.

    Returns:
        Mock: Mocked legacy controller
    """
    controller = Mock()

    async def mock_run(task, **kwargs):
        await asyncio.sleep(0.1)  # Simulate processing
        state = Mock()
        state.agent_state = "FINISHED"
        state.iteration = 10
        return state

    controller.run = AsyncMock(side_effect=mock_run)
    return controller


# ============================================================================
# Database Fixtures (for SWE-bench/WebArena)
# ============================================================================

@pytest.fixture
def mock_swe_bench_instance():
    """
    Mock SWE-bench instance for testing.

    Returns:
        Dict: SWE-bench instance data
    """
    return {
        "instance_id": "django__django-12345",
        "repo": "django/django",
        "base_commit": "abc123",
        "problem_statement": "Fix bug in ORM query generation",
        "test_patch": "diff --git a/tests/test_orm.py...",
        "expected_behavior": "Query should not generate duplicate SQL",
    }


@pytest.fixture
def mock_webarena_task():
    """
    Mock WebArena task for testing.

    Returns:
        Dict: WebArena task data
    """
    return {
        "task_id": "shopping_1",
        "intent": "Add product to cart and checkout",
        "start_url": "http://shop.webarena.test",
        "steps": [
            {"action": "click", "selector": "#product-123"},
            {"action": "click", "selector": ".add-to-cart"},
            {"action": "click", "selector": ".checkout"},
        ],
        "expected_result": "Order confirmation page",
    }


# ============================================================================
# Async Utilities
# ============================================================================

@pytest.fixture
def event_loop():
    """
    Create event loop for async tests.

    Returns:
        asyncio.AbstractEventLoop: Event loop
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Environment Setup
# ============================================================================

@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """
    Setup test environment variables.

    This fixture runs automatically for all tests.
    """
    # Set test environment
    monkeypatch.setenv("OPENHANDS_ENV", "test")
    monkeypatch.setenv("LOG_LEVEL", "INFO")

    # Ensure we don't accidentally use real API keys in tests
    # unless explicitly enabled
    if not os.getenv("ALLOW_REAL_API_CALLS"):
        # Don't override if it's already set (for integration tests)
        if "ANTHROPIC_API_KEY" not in os.environ:
            monkeypatch.setenv("ANTHROPIC_API_KEY", "")


# ============================================================================
# Cleanup Fixtures
# ============================================================================

@pytest.fixture(autouse=True)
def cleanup_after_test():
    """
    Cleanup resources after each test.

    This fixture runs automatically for all tests.
    """
    yield

    # Cleanup any temp files, connections, etc.
    # This runs after each test
    import gc
    gc.collect()
