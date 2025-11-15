"""
Task Orchestrator for Claude Agent SDK Integration

This module provides high-level task orchestration for OpenHands using Claude Agent SDK.
It replaces the complex AgentController with a simplified coordination layer that
delegates execution to Claude Code agents via AgentHub.

The orchestrator handles:
- Task decomposition
- Multi-agent coordination
- Error handling and retries
- Progress tracking
- Result aggregation

Usage:
    from openhands.orchestrator import TaskOrchestrator

    async with TaskOrchestrator(workspace="/project", api_key="sk-...") as orchestrator:
        result = await orchestrator.execute_github_issue_workflow(
            issue_title="Add authentication",
            issue_body="Implement user authentication...",
            repo_path="/project"
        )
"""

from typing import Dict, List, Optional, Callable, Any
import asyncio
import logging
from enum import Enum
from dataclasses import dataclass, field
from pathlib import Path

from openhands.agent_hub import AgentHub

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """Task execution status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TaskResult:
    """
    Result of task execution.

    Contains all information about a task's execution including
    status, messages, errors, and metadata.
    """
    task_id: str
    status: TaskStatus
    messages: List[Any] = field(default_factory=list)
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class TaskOrchestrator:
    """
    High-level task orchestration layer for OpenHands.

    This replaces the complex AgentController with a simplified coordination
    layer that delegates execution to Claude Code agents via AgentHub.

    Responsibilities:
    - Decompose high-level tasks into subtasks
    - Coordinate multiple agents
    - Handle errors and retries
    - Aggregate results
    - Provide progress callbacks

    The orchestrator implements various workflow patterns:
    - Simple task execution (single agent)
    - GitHub issue resolution (multi-phase workflow)
    - Feature implementation (design → implement → test)
    - Parallel execution (independent tasks)
    """

    def __init__(
        self,
        workspace: str,
        api_key: str,
        max_retries: int = 3,
        progress_callback: Optional[Callable] = None
    ):
        """
        Initialize Task Orchestrator.

        Args:
            workspace: Working directory for tasks
            api_key: Anthropic API key
            max_retries: Maximum retry attempts for failed tasks
            progress_callback: Optional callback for progress updates
        """
        self.workspace = Path(workspace).resolve()
        self.api_key = api_key
        self.max_retries = max_retries
        self.progress_callback = progress_callback

        # Initialize agent hub
        self.hub = AgentHub(
            workspace=str(self.workspace),
            api_key=self.api_key
        )

        # Task tracking
        self.tasks: Dict[str, TaskResult] = {}
        self.task_counter = 0

        logger.info(f"TaskOrchestrator initialized for workspace: {self.workspace}")

    def _generate_task_id(self) -> str:
        """Generate unique task ID."""
        self.task_counter += 1
        return f"task_{self.task_counter}"

    async def _report_progress(self, message: str, metadata: Dict = None):
        """Report progress to callback if provided."""
        if self.progress_callback:
            try:
                if asyncio.iscoroutinefunction(self.progress_callback):
                    await self.progress_callback(message, metadata or {})
                else:
                    self.progress_callback(message, metadata or {})
            except Exception as e:
                logger.error(f"Progress callback error: {e}")

    async def execute_simple_task(
        self,
        agent_type: str,
        task_description: str
    ) -> TaskResult:
        """
        Execute a simple single-agent task.

        Args:
            agent_type: Agent to use (code, analysis, testing, etc.)
            task_description: Task prompt

        Returns:
            TaskResult with execution results
        """
        task_id = self._generate_task_id()

        await self._report_progress(
            f"Starting task {task_id} with {agent_type} agent",
            {"task_id": task_id, "agent_type": agent_type}
        )

        result = TaskResult(
            task_id=task_id,
            status=TaskStatus.IN_PROGRESS,
            messages=[],
            metadata={"agent_type": agent_type, "task_description": task_description}
        )

        try:
            messages = await self.hub.execute_task(
                agent_type=agent_type,
                task=task_description
            )

            result.messages = messages
            result.status = TaskStatus.COMPLETED

            await self._report_progress(
                f"Task {task_id} completed successfully",
                {"task_id": task_id, "message_count": len(messages)}
            )

        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            result.status = TaskStatus.FAILED
            result.error = str(e)

            await self._report_progress(
                f"Task {task_id} failed: {e}",
                {"task_id": task_id, "error": str(e)}
            )

        self.tasks[task_id] = result
        return result

    async def execute_github_issue_workflow(
        self,
        issue_title: str,
        issue_body: str,
        repo_path: str
    ) -> TaskResult:
        """
        Execute complete GitHub issue resolution workflow.

        This is a high-level orchestration pattern for solving GitHub issues,
        similar to OpenHands' SWE-bench workflow.

        Workflow phases:
        1. Analyze issue and codebase
        2. Design solution
        3. Implement changes
        4. Run tests
        5. Fix failures (if needed)
        6. Verify solution

        Args:
            issue_title: GitHub issue title
            issue_body: GitHub issue description
            repo_path: Path to repository

        Returns:
            TaskResult with complete workflow results
        """
        task_id = self._generate_task_id()

        workflow_result = TaskResult(
            task_id=task_id,
            status=TaskStatus.IN_PROGRESS,
            messages=[],
            metadata={
                "issue_title": issue_title,
                "repo_path": repo_path,
                "workflow_type": "github_issue"
            }
        )

        try:
            # Phase 1: Analysis
            await self._report_progress("Phase 1: Analyzing issue and codebase...")

            analysis_agent = await self.hub.get_agent("analysis")
            await analysis_agent.query(f"""
Analyze this GitHub issue and the codebase to understand the problem:

Issue: {issue_title}
Description: {issue_body}

Tasks:
1. Locate relevant files in the codebase
2. Understand the current implementation
3. Identify what needs to be changed
4. Propose a solution approach

Provide a detailed analysis with file locations and proposed changes.
""")

            analysis_messages = []
            async for msg in analysis_agent.receive_response():
                analysis_messages.append(msg)
                workflow_result.messages.append(msg)

            # Extract analysis summary
            analysis_summary = self._extract_text_from_messages(analysis_messages)

            # Phase 2: Implementation
            await self._report_progress("Phase 2: Implementing solution...")

            code_agent = await self.hub.get_agent("code")
            await code_agent.query(f"""
Based on this analysis, implement the solution:

{analysis_summary[:1000]}...

Tasks:
1. Make necessary code changes
2. Add or update tests
3. Ensure code follows project conventions
4. Document your changes

Implement the complete solution.
""")

            impl_messages = []
            async for msg in code_agent.receive_response():
                impl_messages.append(msg)
                workflow_result.messages.append(msg)

            # Phase 3: Testing
            await self._report_progress("Phase 3: Running tests...")

            test_agent = await self.hub.get_agent("testing")
            await test_agent.query("""
Run the test suite and verify the implementation:

1. Run all tests
2. Check for failures
3. Report test results
4. Identify any issues

Provide complete test results.
""")

            test_messages = []
            async for msg in test_agent.receive_response():
                test_messages.append(msg)
                workflow_result.messages.append(msg)

            # Check test results
            test_summary = self._extract_text_from_messages(test_messages)

            if "failed" in test_summary.lower() or "error" in test_summary.lower():
                # Phase 4: Fix and retry (if tests failed)
                await self._report_progress("Phase 4: Fixing test failures...")

                await code_agent.query(f"""
Tests failed. Fix the issues:

Test Results:
{test_summary[:500]}...

Tasks:
1. Analyze test failures
2. Fix the issues
3. Ensure tests pass

Fix all test failures.
""")

                fix_messages = []
                async for msg in code_agent.receive_response():
                    fix_messages.append(msg)
                    workflow_result.messages.append(msg)

                # Re-run tests
                await test_agent.query("Run tests again to verify fixes")

                async for msg in test_agent.receive_response():
                    workflow_result.messages.append(msg)

            # Mark as completed
            workflow_result.status = TaskStatus.COMPLETED
            await self._report_progress(f"✅ Workflow {task_id} completed successfully")

        except Exception as e:
            logger.error(f"Workflow {task_id} failed: {e}")
            workflow_result.status = TaskStatus.FAILED
            workflow_result.error = str(e)
            await self._report_progress(f"❌ Workflow {task_id} failed: {e}")

        self.tasks[task_id] = workflow_result
        return workflow_result

    async def execute_feature_implementation(
        self,
        feature_description: str,
        test_required: bool = True
    ) -> TaskResult:
        """
        Execute complete feature implementation workflow.

        Workflow phases:
        1. Design feature architecture
        2. Implement feature
        3. Write tests (if required)
        4. Verify implementation

        Args:
            feature_description: Description of feature to implement
            test_required: Whether to write tests

        Returns:
            TaskResult with complete workflow results
        """
        task_id = self._generate_task_id()

        await self._report_progress(f"Starting feature implementation: {task_id}")

        result = TaskResult(
            task_id=task_id,
            status=TaskStatus.IN_PROGRESS,
            messages=[],
            metadata={
                "feature_description": feature_description,
                "workflow_type": "feature_implementation"
            }
        )

        try:
            code_agent = await self.hub.get_agent("code")

            # Phase 1: Design
            await self._report_progress("Phase 1: Designing feature...")

            await code_agent.query(f"""
Design this feature before implementing:

Feature: {feature_description}

Tasks:
1. Understand requirements
2. Design the solution architecture
3. Identify files to create/modify
4. Plan implementation steps

Provide a detailed design document.
""")

            async for msg in code_agent.receive_response():
                result.messages.append(msg)

            # Phase 2: Implement
            await self._report_progress("Phase 2: Implementing feature...")

            await code_agent.query("""
Now implement the feature based on your design.

Tasks:
1. Create/modify necessary files
2. Write clean, documented code
3. Handle edge cases
4. Follow best practices

Complete the implementation.
""")

            async for msg in code_agent.receive_response():
                result.messages.append(msg)

            # Phase 3: Tests (if required)
            if test_required:
                await self._report_progress("Phase 3: Writing tests...")

                await code_agent.query("""
Write comprehensive tests for the feature.

Tasks:
1. Create test file(s)
2. Write unit tests
3. Write integration tests
4. Ensure good coverage

Write complete test suite.
""")

                async for msg in code_agent.receive_response():
                    result.messages.append(msg)

                # Run tests
                await self._report_progress("Phase 4: Running tests...")

                test_agent = await self.hub.get_agent("testing")
                await test_agent.query("Run the new tests and verify they pass")

                async for msg in test_agent.receive_response():
                    result.messages.append(msg)

            result.status = TaskStatus.COMPLETED
            await self._report_progress(f"✅ Feature implementation {task_id} complete")

        except Exception as e:
            logger.error(f"Feature implementation {task_id} failed: {e}")
            result.status = TaskStatus.FAILED
            result.error = str(e)
            await self._report_progress(f"❌ Feature implementation {task_id} failed: {e}")

        self.tasks[task_id] = result
        return result

    def _extract_text_from_messages(self, messages: List) -> str:
        """
        Extract text content from messages.

        Args:
            messages: List of Claude SDK messages

        Returns:
            Concatenated text content
        """
        from claude_agent_sdk import AssistantMessage, TextBlock

        text_parts = []
        for msg in messages:
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        text_parts.append(block.text)

        return "\n".join(text_parts)

    async def cleanup(self):
        """Cleanup orchestrator resources."""
        logger.info("Cleaning up TaskOrchestrator...")
        await self.hub.cleanup()
        logger.info("TaskOrchestrator cleanup complete")

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.cleanup()
        return False  # Don't suppress exceptions
