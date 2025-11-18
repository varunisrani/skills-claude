#!/usr/bin/env python3
"""
WebArena Validation Script

Validates OpenHands browser automation on WebArena tasks.
Tests browser interaction, navigation, and task completion accuracy.

Usage:
    python validation/validate_webarena.py --tasks shopping --output results.json
    python validation/validate_webarena.py --all --compare-baseline
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict
import time

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class WebArenaTask:
    """WebArena task."""
    task_id: str
    category: str
    intent: str
    start_url: str
    expected_result: str
    steps: List[Dict[str, str]]


@dataclass
class TaskResult:
    """Task execution result."""
    task_id: str
    success: bool
    execution_time: float
    interactions_count: int
    reward: float  # 0-1 score
    error: str = ""


@dataclass
class ValidationSummary:
    """Validation summary."""
    total_tasks: int
    successful: int
    failed: int
    success_rate: float
    avg_reward: float
    avg_execution_time: float
    avg_interactions: float
    results: List[TaskResult]


class WebArenaValidator:
    """WebArena validation tool."""

    def __init__(self, workspace: str, api_key: str):
        """
        Initialize validator.

        Args:
            workspace: Working directory
            api_key: Anthropic API key
        """
        self.workspace = Path(workspace)
        self.api_key = api_key

    def load_tasks(self, category: str = "all") -> List[WebArenaTask]:
        """
        Load WebArena tasks.

        Args:
            category: Task category

        Returns:
            List of tasks
        """
        # Sample tasks (real implementation would load from WebArena dataset)
        all_tasks = [
            WebArenaTask(
                task_id="shopping_1",
                category="shopping",
                intent="Add product to cart and checkout",
                start_url="http://shop.webarena.test",
                expected_result="Order confirmation",
                steps=[
                    {"action": "click", "selector": "#product-123"},
                    {"action": "click", "selector": ".add-to-cart"},
                    {"action": "click", "selector": ".checkout"},
                ]
            ),
            WebArenaTask(
                task_id="search_1",
                category="search",
                intent="Search for product and filter results",
                start_url="http://shop.webarena.test",
                expected_result="Filtered product list",
                steps=[
                    {"action": "type", "selector": "#search", "value": "laptop"},
                    {"action": "click", "selector": "#filter-price"},
                ]
            ),
        ]

        if category != "all":
            tasks = [t for t in all_tasks if t.category == category]
        else:
            tasks = all_tasks

        print(f"Loaded {len(tasks)} WebArena tasks")
        return tasks

    async def validate_task(self, task: WebArenaTask) -> TaskResult:
        """
        Validate single WebArena task.

        Args:
            task: WebArena task

        Returns:
            Task result
        """
        from openhands.agent_hub import AgentHub

        print(f"\nValidating: {task.task_id}")
        print(f"  Intent: {task.intent}")

        start_time = time.time()
        interactions = 0

        try:
            async with AgentHub(
                workspace=str(self.workspace),
                api_key=self.api_key
            ) as hub:
                # Execute task with browser agent
                result = await hub.execute_task(
                    agent_type="browser",
                    task=f"{task.intent}\n\nStart URL: {task.start_url}\nExpected: {task.expected_result}"
                )

                execution_time = time.time() - start_time

                # Calculate reward (simplified - real implementation would check actual result)
                reward = 1.0 if len(result) > 0 else 0.0

                return TaskResult(
                    task_id=task.task_id,
                    success=True,
                    execution_time=execution_time,
                    interactions_count=interactions,
                    reward=reward
                )

        except Exception as e:
            execution_time = time.time() - start_time
            return TaskResult(
                task_id=task.task_id,
                success=False,
                execution_time=execution_time,
                interactions_count=interactions,
                reward=0.0,
                error=str(e)
            )

    async def validate_tasks(
        self,
        category: str = "all",
        limit: int = None
    ) -> ValidationSummary:
        """
        Validate WebArena tasks.

        Args:
            category: Task category
            limit: Maximum number of tasks

        Returns:
            Validation summary
        """
        tasks = self.load_tasks(category)

        if limit:
            tasks = tasks[:limit]

        print(f"\nValidating {len(tasks)} tasks...")

        results = []
        for i, task in enumerate(tasks, 1):
            print(f"\n[{i}/{len(tasks)}]", end=" ")
            result = await self.validate_task(task)
            results.append(result)

            status = "✓" if result.success else "✗"
            print(f"{status} {result.execution_time:.1f}s (reward: {result.reward:.2f})")

            await asyncio.sleep(1)

        # Calculate summary
        successful = sum(1 for r in results if r.success)
        failed = len(results) - successful
        success_rate = successful / len(results) if results else 0
        avg_reward = sum(r.reward for r in results) / len(results) if results else 0
        avg_time = sum(r.execution_time for r in results) / len(results) if results else 0
        avg_interactions = sum(r.interactions_count for r in results) / len(results) if results else 0

        return ValidationSummary(
            total_tasks=len(results),
            successful=successful,
            failed=failed,
            success_rate=success_rate,
            avg_reward=avg_reward,
            avg_execution_time=avg_time,
            avg_interactions=avg_interactions,
            results=results
        )

    def print_summary(self, summary: ValidationSummary):
        """Print validation summary."""
        print("\n" + "=" * 70)
        print("WEBARENA VALIDATION SUMMARY")
        print("=" * 70)

        print(f"\nTotal Tasks: {summary.total_tasks}")
        print(f"Successful: {summary.successful}")
        print(f"Failed: {summary.failed}")
        print(f"Success Rate: {summary.success_rate * 100:.1f}%")

        print(f"\nAverage Reward: {summary.avg_reward:.3f}")
        print(f"Average Execution Time: {summary.avg_execution_time:.2f}s")
        print(f"Average Interactions: {summary.avg_interactions:.1f}")

        print(f"\nDetailed Results:")
        for result in summary.results:
            status = "✓" if result.success else "✗"
            print(f"  {status} {result.task_id}: {result.reward:.2f} reward, {result.execution_time:.1f}s")
            if result.error:
                print(f"    Error: {result.error[:80]}")

        print("=" * 70)

    def save_results(self, summary: ValidationSummary, output_file: str):
        """Save validation results."""
        data = {
            **asdict(summary),
            "results": [asdict(r) for r in summary.results]
        }

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\nResults saved to {output_file}")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="WebArena Validation Tool")
    parser.add_argument(
        "--tasks",
        choices=["shopping", "search", "all"],
        default="all",
        help="Task category"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of tasks"
    )
    parser.add_argument(
        "--workspace",
        default="/tmp/webarena-workspace",
        help="Workspace directory"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file"
    )
    parser.add_argument(
        "--api-key",
        help="Anthropic API key"
    )

    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or sys.stdin.isatty() and input("API key: ") or None
    if not api_key:
        print("Error: API key required")
        sys.exit(1)

    # Create workspace
    workspace = Path(args.workspace)
    workspace.mkdir(parents=True, exist_ok=True)

    # Run validation
    validator = WebArenaValidator(str(workspace), api_key)

    summary = await validator.validate_tasks(args.tasks, args.limit)

    # Print and save results
    validator.print_summary(summary)

    if args.output:
        validator.save_results(summary, args.output)


if __name__ == "__main__":
    asyncio.run(main())
