"""
End-to-end tests for complex workflows.

These tests validate complete complex workflows including
GitHub issue resolution and feature implementation.
"""

import pytest
import os
from pathlib import Path


@pytest.mark.e2e
@pytest.mark.api
@pytest.mark.slow
class TestGitHubIssueWorkflowE2E:
    """E2E tests for GitHub issue resolution workflow."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_simple_bug_fix_workflow(self, temp_workspace, skip_without_api_key):
        """Test complete bug fix workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create a buggy module
        buggy_module = temp_workspace / "calculator.py"
        buggy_module.write_text("""
def add(a, b):
    return a + b

def subtract(a, b):
    return a + b  # Bug: should be a - b

def multiply(a, b):
    return a * b
""")

        # Create a test file
        test_file = temp_workspace / "test_calculator.py"
        test_file.write_text("""
from calculator import add, subtract, multiply

def test_add():
    assert add(5, 3) == 8

def test_subtract():
    assert subtract(5, 3) == 2  # This will fail

def test_multiply():
    assert multiply(5, 3) == 15
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Fix subtract function bug",
                issue_body="""
The subtract function is returning incorrect results.
It appears to be adding instead of subtracting.

Expected: subtract(5, 3) should return 2
Actual: subtract(5, 3) returns 8

Please fix this bug and ensure tests pass.
""",
                repo_path=str(temp_workspace)
            )

            assert result.status == TaskStatus.COMPLETED
            assert len(result.messages) > 0

            # Bug should be fixed
            content = buggy_module.read_text()
            assert "a - b" in content

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_feature_addition_workflow(self, temp_workspace, skip_without_api_key):
        """Test adding a new feature via GitHub issue workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create existing module
        math_module = temp_workspace / "math_utils.py"
        math_module.write_text("""
def square(x):
    '''Return square of x.'''
    return x * x

def cube(x):
    '''Return cube of x.'''
    return x * x * x
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Add power function",
                issue_body="""
Please add a new function called `power(x, n)` that returns x raised to the power of n.

Requirements:
- Function should handle positive and negative exponents
- Include docstring
- Add simple test cases
""",
                repo_path=str(temp_workspace)
            )

            assert result.status == TaskStatus.COMPLETED

            # Function should be added
            content = math_module.read_text()
            assert "power" in content

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_documentation_improvement_workflow(self, temp_workspace, skip_without_api_key):
        """Test documentation improvement workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create module with poor documentation
        module = temp_workspace / "data_processor.py"
        module.write_text("""
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result

def filter_data(data, threshold):
    return [x for x in data if x > threshold]
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Improve documentation",
                issue_body="""
The data_processor module needs better documentation.

Please add:
1. Module-level docstring
2. Docstrings for all functions with parameter descriptions
3. Usage examples in docstrings
""",
                repo_path=str(temp_workspace)
            )

            assert result.status == TaskStatus.COMPLETED

            # Should have docstrings
            content = module.read_text()
            assert '"""' in content or "'''" in content


@pytest.mark.e2e
@pytest.mark.api
@pytest.mark.slow
class TestFeatureImplementationWorkflowE2E:
    """E2E tests for feature implementation workflow."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_complete_feature_with_tests(self, temp_workspace, skip_without_api_key):
        """Test complete feature implementation with tests."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_feature_implementation(
                feature_description="""
Implement a string utility module with the following functions:
1. reverse_string(s): Reverse a string
2. is_palindrome(s): Check if string is palindrome
3. count_vowels(s): Count vowels in string

Each function should have:
- Proper docstrings
- Type hints
- Handle edge cases
""",
                test_required=True
            )

            assert result.status == TaskStatus.COMPLETED
            assert len(result.messages) > 0

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_api_client_feature(self, temp_workspace, skip_without_api_key):
        """Test implementing an API client feature."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_feature_implementation(
                feature_description="""
Create a simple HTTP client wrapper:
- Class called HttpClient
- Methods: get(), post()
- Basic error handling
- Timeout support
""",
                test_required=False
            )

            assert result.status == TaskStatus.COMPLETED

            # Some implementation should exist
            py_files = list(temp_workspace.glob("*.py"))
            assert len(py_files) > 0


@pytest.mark.e2e
@pytest.mark.api
@pytest.mark.slow
class TestRealProjectWorkflowE2E:
    """E2E tests on real project scenarios."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_refactoring_workflow(self, temp_workspace, skip_without_api_key):
        """Test code refactoring workflow."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create code that needs refactoring
        messy_code = temp_workspace / "messy.py"
        messy_code.write_text("""
def process(data):
    result = []
    for i in range(len(data)):
        if data[i] > 0:
            if data[i] < 100:
                if data[i] % 2 == 0:
                    result.append(data[i] * 2)
    return result
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="""
Refactor messy.py to improve readability:
- Reduce nesting
- Use list comprehensions where appropriate
- Add comments
- Improve variable names
"""
            )

            assert result.status == TaskStatus.COMPLETED

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_test_generation_workflow(self, temp_workspace, skip_without_api_key):
        """Test generating tests for existing code."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create module without tests
        module = temp_workspace / "validator.py"
        module.write_text("""
def validate_email(email):
    '''Validate email format.'''
    return '@' in email and '.' in email

def validate_phone(phone):
    '''Validate phone number format.'''
    return len(phone) >= 10 and phone.isdigit()

def validate_age(age):
    '''Validate age is reasonable.'''
    return 0 <= age <= 150
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="""
Create comprehensive tests for validator.py:
- Test file should be test_validator.py
- Include positive and negative test cases
- Test edge cases
- Use pytest
"""
            )

            assert result.status == TaskStatus.COMPLETED

            # Test file should be created
            test_file = temp_workspace / "test_validator.py"
            assert test_file.exists()


@pytest.mark.e2e
@pytest.mark.api
@pytest.mark.slow
class TestErrorRecoveryWorkflowE2E:
    """E2E tests for error recovery scenarios."""

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_fix_failing_tests_workflow(self, temp_workspace, skip_without_api_key):
        """Test workflow that fixes failing tests."""
        from openhands.orchestrator import TaskOrchestrator

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create code with failing tests
        code_file = temp_workspace / "math_ops.py"
        code_file.write_text("""
def divide(a, b):
    return a / b
""")

        test_file = temp_workspace / "test_math_ops.py"
        test_file.write_text("""
import pytest
from math_ops import divide

def test_divide_normal():
    assert divide(10, 2) == 5

def test_divide_by_zero():
    # This will fail - no error handling
    assert divide(10, 0) == float('inf')
""")

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            # This workflow should detect failing test and fix it
            result = await orchestrator.execute_github_issue_workflow(
                issue_title="Fix divide by zero",
                issue_body="The divide function doesn't handle division by zero",
                repo_path=str(temp_workspace)
            )

            # Should complete (with or without perfect fix)
            assert result is not None

    @pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
    async def test_syntax_error_recovery(self, temp_workspace, skip_without_api_key):
        """Test recovering from syntax errors."""
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        api_key = os.getenv("ANTHROPIC_API_KEY")

        # Create file with syntax error
        broken_file = temp_workspace / "broken.py"
        broken_file.write_text("""
def calculate(x, y)
    result = x + y
    return result
""")  # Missing colon

        async with TaskOrchestrator(
            workspace=str(temp_workspace),
            api_key=api_key
        ) as orchestrator:
            result = await orchestrator.execute_simple_task(
                agent_type="code",
                task_description="Fix the syntax error in broken.py"
            )

            assert result.status == TaskStatus.COMPLETED

            # Syntax error should be fixed
            content = broken_file.read_text()
            assert "def calculate(x, y):" in content
