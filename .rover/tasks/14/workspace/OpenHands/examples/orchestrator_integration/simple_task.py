"""
Simple Task Execution with TaskOrchestrator

This example demonstrates how to execute a simple task using the
TaskOrchestrator integration.

Usage:
    python examples/orchestrator_integration/simple_task.py
"""

import asyncio
import os
from pathlib import Path

from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.core.config import OpenHandsConfig
from openhands.core.setup import create_runtime, generate_sid, get_provider_tokens
from openhands.events import EventStream
from openhands.utils.async_utils import call_async_from_sync
from openhands.utils.utils import create_registry_and_conversation_stats


async def main():
    """Run a simple task with TaskOrchestrator."""

    # Configuration
    workspace = Path.cwd() / "workspace"
    workspace.mkdir(exist_ok=True)

    task = """
    Create a simple Python script that:
    1. Reads a CSV file with user data
    2. Calculates the average age
    3. Prints the result

    Make sure to include error handling and documentation.
    """

    print("=" * 60)
    print("Simple Task Execution with TaskOrchestrator")
    print("=" * 60)
    print(f"\nWorkspace: {workspace}")
    print(f"\nTask: {task.strip()}\n")

    # Create config
    config = OpenHandsConfig()
    config.max_iterations = 20

    # Generate session ID
    sid = generate_sid(config)

    # Create runtime
    llm_registry, conversation_stats, config = create_registry_and_conversation_stats(
        config, sid, None
    )

    runtime = create_runtime(
        config,
        llm_registry,
        sid=sid,
        headless_mode=True,
        agent=None,
        git_provider_tokens=get_provider_tokens(),
    )

    call_async_from_sync(runtime.connect)

    event_stream = runtime.event_stream

    # Create orchestrator adapter
    print("Creating OrchestratorAdapter...")
    adapter = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=str(workspace),
        conversation_stats=conversation_stats,
    )

    try:
        # Run the task
        print("Executing task with code agent...")
        state = await adapter.run(
            task=task,
            agent_type="code",
        )

        # Print results
        print("\n" + "=" * 60)
        print("Task Completed!")
        print("=" * 60)
        print(f"Status: {state.agent_state}")
        print(f"Iterations: {state.iteration}")

        if state.last_error:
            print(f"Error: {state.last_error}")

        print("\nCheck the workspace directory for generated files.")
        print("=" * 60)

    finally:
        adapter.close()


if __name__ == "__main__":
    asyncio.run(main())
