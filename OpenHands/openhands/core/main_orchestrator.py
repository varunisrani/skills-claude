"""
CLI Entry Point with TaskOrchestrator Integration

This provides an alternative main entry point that uses TaskOrchestrator
instead of the legacy AgentController. It maintains CLI compatibility
while leveraging the Claude Agent SDK architecture.

Usage:
    # Use orchestrator mode with environment variable
    export OPENHANDS_USE_ORCHESTRATOR=1
    python -m openhands.core.main_orchestrator --task "Fix the bug in auth.py"

    # Or use directly
    python -m openhands.core.main_orchestrator \\
        --task "Implement user authentication" \\
        --agent-cls code \\
        --max-iterations 30
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Optional

from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.controller.state.state import State
from openhands.core.config import (
    OpenHandsConfig,
    parse_arguments,
    setup_config_from_args,
)
from openhands.core.logger import openhands_logger as logger
from openhands.core.schema import AgentState
from openhands.core.setup import (
    create_memory,
    create_runtime,
    generate_sid,
    get_provider_tokens,
    initialize_repository_for_runtime,
)
from openhands.events import EventStream
from openhands.events.action import MessageAction
from openhands.memory.memory import Memory
from openhands.runtime.base import Runtime
from openhands.utils.async_utils import call_async_from_sync
from openhands.utils.utils import create_registry_and_conversation_stats


async def run_with_orchestrator(
    config: OpenHandsConfig,
    task: str,
    sid: str | None = None,
    runtime: Runtime | None = None,
    memory: Memory | None = None,
    agent_type: str = "code",
    headless_mode: bool = True,
) -> State | None:
    """
    Run a task using TaskOrchestrator.

    This is the orchestrator-based alternative to run_controller().
    It provides a simpler execution flow while maintaining compatibility
    with the existing OpenHands infrastructure.

    Args:
        config: OpenHands configuration
        task: Task description
        sid: Session ID (optional)
        runtime: Runtime instance (optional)
        memory: Memory instance (optional)
        agent_type: Agent type to use (code, analysis, testing, etc.)
        headless_mode: Whether to run in headless mode

    Returns:
        Final state after execution, or None on error
    """
    sid = sid or generate_sid(config)

    llm_registry, conversation_stats, config = create_registry_and_conversation_stats(
        config,
        sid,
        None,
    )

    # Create runtime if not provided
    repo_directory = None
    if runtime is None:
        repo_tokens = get_provider_tokens()
        runtime = create_runtime(
            config,
            llm_registry,
            sid=sid,
            headless_mode=headless_mode,
            agent=None,  # Not needed for orchestrator
            git_provider_tokens=repo_tokens,
        )
        call_async_from_sync(runtime.connect)

        # Initialize repository if needed
        if config.sandbox.selected_repo:
            repo_directory = initialize_repository_for_runtime(
                runtime,
                immutable_provider_tokens=repo_tokens,
                selected_repository=config.sandbox.selected_repo,
            )

    event_stream = runtime.event_stream

    # Create memory if not provided
    if memory is None:
        memory = create_memory(
            runtime=runtime,
            event_stream=event_stream,
            sid=sid,
            selected_repository=config.sandbox.selected_repo,
            repo_directory=repo_directory,
            conversation_instructions=None,
            working_dir=str(runtime.workspace_root),
        )

    # Create orchestrator adapter
    logger.info("Creating OrchestratorAdapter...")
    adapter = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=str(runtime.workspace_root),
        conversation_stats=conversation_stats,
    )

    try:
        # Run the task
        logger.info(f"Running task with {agent_type} agent: {task[:100]}...")
        state = await adapter.run(
            task=task,
            agent_type=agent_type,
        )

        logger.info(f"Task completed with state: {state.agent_state}")
        return state

    except Exception as e:
        logger.error(f"Error running task: {e}", exc_info=True)
        return None

    finally:
        adapter.close()


async def run_github_issue_with_orchestrator(
    config: OpenHandsConfig,
    issue_title: str,
    issue_body: str,
    repo_path: Optional[str] = None,
    sid: str | None = None,
    runtime: Runtime | None = None,
    headless_mode: bool = True,
) -> State | None:
    """
    Run GitHub issue resolution using TaskOrchestrator.

    This uses the execute_github_issue_workflow pattern which is
    optimized for SWE-bench-style tasks.

    Args:
        config: OpenHands configuration
        issue_title: GitHub issue title
        issue_body: GitHub issue description
        repo_path: Repository path (optional)
        sid: Session ID (optional)
        runtime: Runtime instance (optional)
        headless_mode: Whether to run in headless mode

    Returns:
        Final state after execution, or None on error
    """
    sid = sid or generate_sid(config)

    llm_registry, conversation_stats, config = create_registry_and_conversation_stats(
        config,
        sid,
        None,
    )

    # Create runtime if not provided
    if runtime is None:
        repo_tokens = get_provider_tokens()
        runtime = create_runtime(
            config,
            llm_registry,
            sid=sid,
            headless_mode=headless_mode,
            agent=None,
            git_provider_tokens=repo_tokens,
        )
        call_async_from_sync(runtime.connect)

    event_stream = runtime.event_stream

    # Use workspace as repo_path if not provided
    if repo_path is None:
        repo_path = str(runtime.workspace_root)

    # Create orchestrator adapter
    logger.info("Creating OrchestratorAdapter for GitHub issue workflow...")
    adapter = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=str(runtime.workspace_root),
        conversation_stats=conversation_stats,
    )

    try:
        # Run GitHub issue workflow
        logger.info(f"Running GitHub issue workflow: {issue_title}")
        state = await adapter.run_github_issue(
            issue_title=issue_title,
            issue_body=issue_body,
            repo_path=repo_path,
        )

        logger.info(f"GitHub issue workflow completed with state: {state.agent_state}")
        return state

    except Exception as e:
        logger.error(f"Error running GitHub issue workflow: {e}", exc_info=True)
        return None

    finally:
        adapter.close()


def main():
    """
    Main CLI entry point with orchestrator support.

    This supports both regular task execution and GitHub issue resolution.
    """
    # Check if orchestrator mode is enabled
    use_orchestrator = os.environ.get('OPENHANDS_USE_ORCHESTRATOR', '0') in ('1', 'true', 'True')

    # Parse arguments
    args = parse_arguments()

    # Setup config
    config = setup_config_from_args(args)

    # Determine what to run
    task = None
    issue_title = None
    issue_body = None
    agent_type = getattr(args, 'agent_cls', 'code')

    # Check for task input
    if hasattr(args, 'task') and args.task:
        task = args.task
    elif hasattr(args, 'file') and args.file:
        # Read task from file
        task_file = Path(args.file)
        if task_file.exists():
            task = task_file.read_text()
        else:
            logger.error(f"Task file not found: {args.file}")
            sys.exit(1)

    # Check for GitHub issue inputs
    if hasattr(args, 'issue_title') and args.issue_title:
        issue_title = args.issue_title
        issue_body = getattr(args, 'issue_body', '')

    # Validate inputs
    if not task and not issue_title:
        logger.error("No task or issue specified. Use --task or --issue-title")
        sys.exit(1)

    # Run with orchestrator
    if use_orchestrator:
        logger.info("Running with TaskOrchestrator (orchestrator mode enabled)")

        if issue_title:
            # Run GitHub issue workflow
            state = asyncio.run(
                run_github_issue_with_orchestrator(
                    config=config,
                    issue_title=issue_title,
                    issue_body=issue_body or "",
                )
            )
        else:
            # Run simple task
            state = asyncio.run(
                run_with_orchestrator(
                    config=config,
                    task=task,
                    agent_type=agent_type,
                )
            )

        # Print results
        if state:
            print(f"\n{'=' * 60}")
            print(f"Task Status: {state.agent_state}")
            print(f"Iterations: {state.iteration}")
            if state.last_error:
                print(f"Error: {state.last_error}")
            print(f"{'=' * 60}\n")

            # Exit with appropriate code
            sys.exit(0 if state.agent_state == AgentState.FINISHED else 1)
        else:
            print("\nTask execution failed.")
            sys.exit(1)
    else:
        # Fall back to original run_controller
        logger.info("Running with legacy AgentController (set OPENHANDS_USE_ORCHESTRATOR=1 for orchestrator mode)")
        from openhands.core.main import run_controller
        from openhands.events.action import MessageAction

        initial_action = MessageAction(content=task or f"{issue_title}\n\n{issue_body}")

        state = asyncio.run(
            run_controller(
                config=config,
                initial_user_action=initial_action,
            )
        )

        if state:
            sys.exit(0 if state.agent_state == AgentState.FINISHED else 1)
        else:
            sys.exit(1)


if __name__ == '__main__':
    main()
