"""
GitHub Issue Resolution with TaskOrchestrator

This example demonstrates how to resolve a GitHub issue using the
TaskOrchestrator's execute_github_issue_workflow pattern.

This is similar to how SWE-bench evaluation works.

Usage:
    python examples/orchestrator_integration/github_issue.py
"""

import asyncio
from pathlib import Path

from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.core.config import OpenHandsConfig
from openhands.core.setup import create_runtime, generate_sid, get_provider_tokens
from openhands.utils.async_utils import call_async_from_sync
from openhands.utils.utils import create_registry_and_conversation_stats


async def main():
    """Resolve a GitHub issue with TaskOrchestrator."""

    # Configuration
    workspace = Path.cwd() / "test_repo"
    workspace.mkdir(exist_ok=True)

    # Example GitHub issue
    issue_title = "Add input validation to user registration"
    issue_body = """
    ## Description
    The user registration endpoint currently accepts any input without validation.
    This can lead to security issues and data quality problems.

    ## Requirements
    - Add email format validation
    - Add password strength requirements (min 8 chars, uppercase, lowercase, number)
    - Add username length validation (3-20 chars, alphanumeric only)
    - Return clear error messages for validation failures

    ## Files to modify
    - `auth.py` - Add validation functions
    - `tests/test_auth.py` - Add validation tests

    ## Acceptance Criteria
    - All validation rules are enforced
    - Tests pass
    - Error messages are clear and helpful
    """

    print("=" * 60)
    print("GitHub Issue Resolution with TaskOrchestrator")
    print("=" * 60)
    print(f"\nWorkspace: {workspace}")
    print(f"\nIssue: {issue_title}")
    print(f"\nDescription:\n{issue_body}\n")

    # Create config
    config = OpenHandsConfig()
    config.max_iterations = 50  # GitHub issues may need more iterations

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
        # Run GitHub issue workflow
        print("Executing GitHub issue workflow...")
        print("This will:")
        print("  1. Analyze the issue and codebase")
        print("  2. Design a solution")
        print("  3. Implement changes")
        print("  4. Run tests")
        print("  5. Fix any failures")
        print("  6. Verify the solution\n")

        state = await adapter.run_github_issue(
            issue_title=issue_title,
            issue_body=issue_body,
            repo_path=str(workspace),
        )

        # Print results
        print("\n" + "=" * 60)
        print("GitHub Issue Resolution Completed!")
        print("=" * 60)
        print(f"Status: {state.agent_state}")
        print(f"Iterations: {state.iteration}")

        if state.last_error:
            print(f"Error: {state.last_error}")

        print("\nCheck the workspace for:")
        print("  - Modified code files")
        print("  - Added tests")
        print("  - Git commits")
        print("=" * 60)

    finally:
        adapter.close()


if __name__ == "__main__":
    asyncio.run(main())
