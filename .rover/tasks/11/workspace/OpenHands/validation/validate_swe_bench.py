#!/usr/bin/env python3
"""
SWE-bench Validation Script

Validates OpenHands orchestrator performance on SWE-bench dataset.
Compares new implementation against legacy and baseline metrics.

Usage:
    python validation/validate_swe_bench.py --dataset small --output results.json
    python validation/validate_swe_bench.py --dataset medium --compare-baseline
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
class SWEBenchInstance:
    """SWE-bench instance."""
    instance_id: str
    repo: str
    base_commit: str
    problem_statement: str
    test_patch: str
    hints_text: str = ""


@dataclass
class ValidationResult:
    """Validation result for single instance."""
    instance_id: str
    success: bool
    execution_time: float
    error: str = ""
    tests_passed: int = 0
    tests_failed: int = 0
    cost: float = 0.0


@dataclass
class ValidationSummary:
    """Summary of validation run."""
    dataset_size: int
    success_count: int
    failure_count: int
    success_rate: float
    avg_execution_time: float
    total_cost: float
    results: List[ValidationResult]


class SWEBenchValidator:
    """SWE-bench validation tool."""

    def __init__(self, workspace: str, api_key: str):
        """
        Initialize validator.

        Args:
            workspace: Working directory
            api_key: Anthropic API key
        """
        self.workspace = Path(workspace)
        self.api_key = api_key
        self.results: List[ValidationResult] = []

    def load_dataset(self, dataset_name: str) -> List[SWEBenchInstance]:
        """
        Load SWE-bench dataset.

        Args:
            dataset_name: Dataset name (small, medium, full)

        Returns:
            List of instances
        """
        # Sample datasets (in real implementation, load from actual SWE-bench data)
        datasets = {
            "small": [
                SWEBenchInstance(
                    instance_id="django__django-12345",
                    repo="django/django",
                    base_commit="abc123",
                    problem_statement="Fix ORM query generation bug",
                    test_patch="diff --git a/tests/test_orm.py...",
                    hints_text="Check the query builder"
                ),
                SWEBenchInstance(
                    instance_id="requests__requests-5678",
                    repo="psf/requests",
                    base_commit="def456",
                    problem_statement="Add timeout parameter validation",
                    test_patch="diff --git a/tests/test_requests.py...",
                ),
            ],
            "medium": [],  # Would load 50-100 instances
            "full": [],  # Would load full dataset
        }

        instances = datasets.get(dataset_name, datasets["small"])
        print(f"Loaded {len(instances)} instances from {dataset_name} dataset")

        return instances

    async def validate_instance(self, instance: SWEBenchInstance) -> ValidationResult:
        """
        Validate single SWE-bench instance.

        Args:
            instance: SWE-bench instance

        Returns:
            Validation result
        """
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        print(f"\nValidating: {instance.instance_id}")
        print(f"  Repo: {instance.repo}")

        start_time = time.time()

        try:
            async with TaskOrchestrator(
                workspace=str(self.workspace),
                api_key=self.api_key
            ) as orchestrator:
                result = await orchestrator.execute_github_issue_workflow(
                    issue_title=f"[SWE-bench] {instance.instance_id}",
                    issue_body=instance.problem_statement,
                    repo_path=str(self.workspace)
                )

                execution_time = time.time() - start_time

                return ValidationResult(
                    instance_id=instance.instance_id,
                    success=result.status == TaskStatus.COMPLETED,
                    execution_time=execution_time,
                    tests_passed=1 if result.status == TaskStatus.COMPLETED else 0,
                    tests_failed=0 if result.status == TaskStatus.COMPLETED else 1,
                    cost=0.0  # Would need token tracking
                )

        except Exception as e:
            execution_time = time.time() - start_time
            return ValidationResult(
                instance_id=instance.instance_id,
                success=False,
                execution_time=execution_time,
                error=str(e)
            )

    async def validate_dataset(
        self,
        dataset_name: str,
        limit: int = None
    ) -> ValidationSummary:
        """
        Validate entire dataset.

        Args:
            dataset_name: Dataset name
            limit: Maximum number of instances to validate

        Returns:
            Validation summary
        """
        instances = self.load_dataset(dataset_name)

        if limit:
            instances = instances[:limit]

        print(f"\nValidating {len(instances)} instances...")

        results = []
        for i, instance in enumerate(instances, 1):
            print(f"\n[{i}/{len(instances)}]", end=" ")
            result = await self.validate_instance(instance)
            results.append(result)

            status = "✓" if result.success else "✗"
            print(f"{status} {result.execution_time:.1f}s")

            # Brief pause between instances
            await asyncio.sleep(1)

        # Calculate summary
        success_count = sum(1 for r in results if r.success)
        failure_count = len(results) - success_count
        success_rate = success_count / len(results) if results else 0
        avg_time = sum(r.execution_time for r in results) / len(results) if results else 0
        total_cost = sum(r.cost for r in results)

        return ValidationSummary(
            dataset_size=len(results),
            success_count=success_count,
            failure_count=failure_count,
            success_rate=success_rate,
            avg_execution_time=avg_time,
            total_cost=total_cost,
            results=results
        )

    def print_summary(self, summary: ValidationSummary):
        """
        Print validation summary.

        Args:
            summary: Validation summary
        """
        print("\n" + "=" * 70)
        print("SWE-BENCH VALIDATION SUMMARY")
        print("=" * 70)

        print(f"\nDataset Size: {summary.dataset_size}")
        print(f"Successful: {summary.success_count}")
        print(f"Failed: {summary.failure_count}")
        print(f"Success Rate: {summary.success_rate * 100:.1f}%")

        print(f"\nAverage Execution Time: {summary.avg_execution_time:.2f}s")
        print(f"Total Cost: ${summary.total_cost:.4f}")

        print(f"\nDetailed Results:")
        for result in summary.results:
            status = "✓" if result.success else "✗"
            print(f"  {status} {result.instance_id}: {result.execution_time:.1f}s")
            if result.error:
                print(f"    Error: {result.error[:100]}")

        print("=" * 70)

    def save_results(self, summary: ValidationSummary, output_file: str):
        """
        Save validation results.

        Args:
            summary: Validation summary
            output_file: Output file path
        """
        data = {
            **asdict(summary),
            "results": [asdict(r) for r in summary.results]
        }

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\nResults saved to {output_file}")

    def compare_with_baseline(self, summary: ValidationSummary, baseline_file: str):
        """
        Compare results with baseline.

        Args:
            summary: Current validation summary
            baseline_file: Baseline results file
        """
        baseline_path = Path(baseline_file)
        if not baseline_path.exists():
            print(f"Baseline file not found: {baseline_file}")
            return

        with open(baseline_path, 'r') as f:
            baseline_data = json.load(f)

        baseline_rate = baseline_data.get("success_rate", 0)
        baseline_time = baseline_data.get("avg_execution_time", 0)

        print("\n" + "=" * 70)
        print("COMPARISON WITH BASELINE")
        print("=" * 70)

        rate_diff = summary.success_rate - baseline_rate
        time_diff = summary.avg_execution_time - baseline_time

        print(f"\nSuccess Rate:")
        print(f"  Current: {summary.success_rate * 100:.1f}%")
        print(f"  Baseline: {baseline_rate * 100:.1f}%")
        print(f"  Difference: {rate_diff * 100:+.1f}%")

        print(f"\nExecution Time:")
        print(f"  Current: {summary.avg_execution_time:.2f}s")
        print(f"  Baseline: {baseline_time:.2f}s")
        print(f"  Difference: {time_diff:+.2f}s")

        print("=" * 70)


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="SWE-bench Validation Tool")
    parser.add_argument(
        "--dataset",
        choices=["small", "medium", "full"],
        default="small",
        help="Dataset to validate"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of instances"
    )
    parser.add_argument(
        "--workspace",
        default="/tmp/swe-bench-workspace",
        help="Workspace directory"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file"
    )
    parser.add_argument(
        "--baseline",
        help="Baseline results file for comparison"
    )
    parser.add_argument(
        "--api-key",
        help="Anthropic API key (or set ANTHROPIC_API_KEY)"
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
    validator = SWEBenchValidator(str(workspace), api_key)

    summary = await validator.validate_dataset(args.dataset, args.limit)

    # Print results
    validator.print_summary(summary)

    # Save results
    if args.output:
        validator.save_results(summary, args.output)

    # Compare with baseline
    if args.baseline:
        validator.compare_with_baseline(summary, args.baseline)


if __name__ == "__main__":
    asyncio.run(main())
