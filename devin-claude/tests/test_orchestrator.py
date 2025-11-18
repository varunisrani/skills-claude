#!/usr/bin/env python3
"""
Test script for Task Orchestrator

This script demonstrates and tests the Task Orchestrator functionality.
It shows various orchestration patterns including simple tasks, GitHub issue
resolution, and feature implementation workflows.

Usage:
    python tests/test_orchestrator.py

Requirements:
    - Claude Agent SDK installed
    - ANTHROPIC_API_KEY environment variable set
    - Claude Code CLI installed
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from openhands.orchestrator import TaskOrchestrator, TaskStatus

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def progress_callback(message: str, metadata: dict):
    """Progress callback for tracking execution."""
    print(f"📊 Progress: {message}")
    if metadata and logger.isEnabledFor(logging.DEBUG):
        print(f"   Metadata: {metadata}")


async def test_simple_task():
    """Test simple task execution."""
    print("\n" + "=" * 80)
    print("TEST 1: Simple Task Execution")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set. Skipping test.")
        return

    async with TaskOrchestrator(
        workspace=".",
        api_key=api_key,
        progress_callback=progress_callback
    ) as orchestrator:
        result = await orchestrator.execute_simple_task(
            agent_type="analysis",
            task_description="Analyze the POC directory and list all Python files"
        )

        print(f"\n✅ Task Status: {result.status.value}")
        print(f"   Messages: {len(result.messages)}")
        print(f"   Task ID: {result.task_id}")


async def test_feature_implementation():
    """Test feature implementation workflow."""
    print("\n" + "=" * 80)
    print("TEST 2: Feature Implementation Workflow")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set. Skipping test.")
        return

    async with TaskOrchestrator(
        workspace="/home/user/skills-claude/OpenHands/poc",
        api_key=api_key,
        progress_callback=progress_callback
    ) as orchestrator:
        result = await orchestrator.execute_feature_implementation(
            feature_description="""
Add a utility function to the POC that counts TODO comments.

Requirements:
- Function name: count_todos
- Parameter: directory path
- Returns: dictionary with file names and TODO count
- Include docstring
- Add simple test
""",
            test_required=False  # Skip test phase for this demo
        )

        print(f"\n✅ Workflow Status: {result.status.value}")
        print(f"   Total Messages: {len(result.messages)}")
        print(f"   Task ID: {result.task_id}")
        if result.error:
            print(f"   Error: {result.error}")


async def test_github_issue_workflow():
    """Test GitHub issue resolution workflow (mock)."""
    print("\n" + "=" * 80)
    print("TEST 3: GitHub Issue Workflow (Mock)")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set. Skipping test.")
        return

    async with TaskOrchestrator(
        workspace="/home/user/skills-claude/OpenHands/poc",
        api_key=api_key,
        progress_callback=progress_callback
    ) as orchestrator:
        result = await orchestrator.execute_github_issue_workflow(
            issue_title="Improve POC documentation",
            issue_body="""
The POC README needs more detail.

Please add:
1. Installation steps
2. Usage examples
3. Troubleshooting section

Make the documentation more helpful for new users.
""",
            repo_path="/home/user/skills-claude/OpenHands/poc"
        )

        print(f"\n✅ Workflow Status: {result.status.value}")
        print(f"   Total Messages: {len(result.messages)}")
        print(f"   Task ID: {result.task_id}")
        if result.error:
            print(f"   Error: {result.error}")


async def test_task_tracking():
    """Test task tracking functionality."""
    print("\n" + "=" * 80)
    print("TEST 4: Task Tracking")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY", "test-key")

    orchestrator = TaskOrchestrator(
        workspace=".",
        api_key=api_key
    )

    print(f"\n📊 Initial state:")
    print(f"   Tasks tracked: {len(orchestrator.tasks)}")
    print(f"   Task counter: {orchestrator.task_counter}")

    # Generate some task IDs
    task_ids = [orchestrator._generate_task_id() for _ in range(3)]

    print(f"\n📊 After generating 3 task IDs:")
    print(f"   Task IDs: {task_ids}")
    print(f"   Task counter: {orchestrator.task_counter}")

    await orchestrator.cleanup()


async def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("TASK ORCHESTRATOR TEST SUITE")
    print("=" * 80)

    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n⚠️  WARNING: ANTHROPIC_API_KEY not set")
        print("   Some tests will be skipped")
        print("   Set it with: export ANTHROPIC_API_KEY='your-key-here'")

    # Run task tracking test (doesn't need API key)
    await test_task_tracking()

    # Run tests that need API key
    if api_key:
        # Uncomment to run more extensive tests:
        # await test_simple_task()
        # await test_feature_implementation()
        # await test_github_issue_workflow()
        print("\n⏭️  API-dependent tests are commented out")
        print("   Uncomment them in the script to run full tests")
    else:
        print("\n⏭️  Skipping API-dependent tests")

    print("\n" + "=" * 80)
    print("TEST SUITE COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
