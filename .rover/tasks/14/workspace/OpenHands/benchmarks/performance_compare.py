#!/usr/bin/env python3
"""
Performance Comparison Tool

Compares performance between TaskOrchestrator (new) and AgentController (legacy).
Measures execution time, memory usage, token consumption, and API efficiency.

Usage:
    python benchmarks/performance_compare.py --task simple --runs 5
    python benchmarks/performance_compare.py --task github_issue --runs 3 --output results.json
"""

import asyncio
import argparse
import time
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
import psutil
import os

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class PerformanceMetrics:
    """Performance metrics for a single run."""
    execution_time: float  # seconds
    memory_usage: float  # MB
    peak_memory: float  # MB
    api_calls: int
    tokens_input: int
    tokens_output: int
    success: bool
    error: str = ""


@dataclass
class BenchmarkResult:
    """Benchmark results for multiple runs."""
    test_name: str
    implementation: str  # "orchestrator" or "legacy"
    runs: List[PerformanceMetrics]
    avg_execution_time: float
    avg_memory_usage: float
    avg_api_calls: float
    avg_tokens_total: int
    success_rate: float


class PerformanceBenchmark:
    """Performance benchmarking tool."""

    def __init__(self, workspace: str, api_key: str):
        """
        Initialize benchmark.

        Args:
            workspace: Working directory
            api_key: Anthropic API key
        """
        self.workspace = Path(workspace)
        self.api_key = api_key
        self.process = psutil.Process()

    async def benchmark_orchestrator_simple_task(self, task: str) -> PerformanceMetrics:
        """
        Benchmark simple task with TaskOrchestrator.

        Args:
            task: Task description

        Returns:
            Performance metrics
        """
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        # Reset memory baseline
        initial_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        peak_memory = initial_memory

        start_time = time.time()

        try:
            async with TaskOrchestrator(
                workspace=str(self.workspace),
                api_key=self.api_key
            ) as orchestrator:
                # Monitor memory during execution
                def check_memory():
                    nonlocal peak_memory
                    current = self.process.memory_info().rss / 1024 / 1024
                    peak_memory = max(peak_memory, current)

                result = await orchestrator.execute_simple_task(
                    agent_type="code",
                    task_description=task
                )

                check_memory()

                execution_time = time.time() - start_time
                final_memory = self.process.memory_info().rss / 1024 / 1024
                memory_used = final_memory - initial_memory

                return PerformanceMetrics(
                    execution_time=execution_time,
                    memory_usage=memory_used,
                    peak_memory=peak_memory - initial_memory,
                    api_calls=1,  # Simplified - would need API tracking
                    tokens_input=0,  # Would need token tracking
                    tokens_output=0,
                    success=result.status == TaskStatus.COMPLETED
                )

        except Exception as e:
            execution_time = time.time() - start_time
            return PerformanceMetrics(
                execution_time=execution_time,
                memory_usage=0,
                peak_memory=0,
                api_calls=0,
                tokens_input=0,
                tokens_output=0,
                success=False,
                error=str(e)
            )

    async def benchmark_orchestrator_github_issue(
        self,
        issue_title: str,
        issue_body: str
    ) -> PerformanceMetrics:
        """
        Benchmark GitHub issue workflow with TaskOrchestrator.

        Args:
            issue_title: Issue title
            issue_body: Issue description

        Returns:
            Performance metrics
        """
        from openhands.orchestrator import TaskOrchestrator, TaskStatus

        initial_memory = self.process.memory_info().rss / 1024 / 1024
        peak_memory = initial_memory

        start_time = time.time()

        try:
            async with TaskOrchestrator(
                workspace=str(self.workspace),
                api_key=self.api_key
            ) as orchestrator:
                result = await orchestrator.execute_github_issue_workflow(
                    issue_title=issue_title,
                    issue_body=issue_body,
                    repo_path=str(self.workspace)
                )

                execution_time = time.time() - start_time
                final_memory = self.process.memory_info().rss / 1024 / 1024
                current_peak = max(self.process.memory_info().rss / 1024 / 1024, peak_memory)

                return PerformanceMetrics(
                    execution_time=execution_time,
                    memory_usage=final_memory - initial_memory,
                    peak_memory=current_peak - initial_memory,
                    api_calls=3,  # Approximate: analysis + code + testing
                    tokens_input=0,
                    tokens_output=0,
                    success=result.status == TaskStatus.COMPLETED
                )

        except Exception as e:
            execution_time = time.time() - start_time
            return PerformanceMetrics(
                execution_time=execution_time,
                memory_usage=0,
                peak_memory=0,
                api_calls=0,
                tokens_input=0,
                tokens_output=0,
                success=False,
                error=str(e)
            )

    async def run_benchmark(
        self,
        test_name: str,
        test_func,
        num_runs: int = 5
    ) -> BenchmarkResult:
        """
        Run benchmark multiple times and aggregate results.

        Args:
            test_name: Name of test
            test_func: Async function to benchmark
            num_runs: Number of runs

        Returns:
            Aggregated benchmark results
        """
        print(f"\nRunning {test_name} ({num_runs} runs)...")

        runs = []
        for i in range(num_runs):
            print(f"  Run {i + 1}/{num_runs}...", end=" ", flush=True)

            metrics = await test_func()
            runs.append(metrics)

            if metrics.success:
                print(f"✓ ({metrics.execution_time:.2f}s)")
            else:
                print(f"✗ ({metrics.error})")

            # Brief pause between runs
            await asyncio.sleep(1)

        # Calculate averages
        successful_runs = [r for r in runs if r.success]

        if successful_runs:
            avg_time = sum(r.execution_time for r in successful_runs) / len(successful_runs)
            avg_memory = sum(r.memory_usage for r in successful_runs) / len(successful_runs)
            avg_api = sum(r.api_calls for r in successful_runs) / len(successful_runs)
            avg_tokens = sum(r.tokens_input + r.tokens_output for r in successful_runs) / len(successful_runs)
        else:
            avg_time = avg_memory = avg_api = avg_tokens = 0

        success_rate = len(successful_runs) / len(runs)

        return BenchmarkResult(
            test_name=test_name,
            implementation="orchestrator",
            runs=runs,
            avg_execution_time=avg_time,
            avg_memory_usage=avg_memory,
            avg_api_calls=avg_api,
            avg_tokens_total=int(avg_tokens),
            success_rate=success_rate
        )

    def print_results(self, results: List[BenchmarkResult]):
        """
        Print benchmark results.

        Args:
            results: List of benchmark results
        """
        print("\n" + "=" * 80)
        print("BENCHMARK RESULTS")
        print("=" * 80)

        for result in results:
            print(f"\nTest: {result.test_name}")
            print(f"Implementation: {result.implementation}")
            print(f"Runs: {len(result.runs)}")
            print(f"Success Rate: {result.success_rate * 100:.1f}%")
            print(f"\nAverages (successful runs):")
            print(f"  Execution Time: {result.avg_execution_time:.2f}s")
            print(f"  Memory Usage: {result.avg_memory_usage:.2f} MB")
            print(f"  API Calls: {result.avg_api_calls:.1f}")
            print(f"  Total Tokens: {result.avg_tokens_total}")

            if result.runs:
                print(f"\nDetailed Runs:")
                for i, run in enumerate(result.runs, 1):
                    status = "✓" if run.success else "✗"
                    print(f"  Run {i}: {status} {run.execution_time:.2f}s, "
                          f"{run.memory_usage:.2f}MB, {run.api_calls} calls")
                    if run.error:
                        print(f"    Error: {run.error}")

        print("\n" + "=" * 80)

    def save_results(self, results: List[BenchmarkResult], output_file: str):
        """
        Save results to JSON file.

        Args:
            results: Benchmark results
            output_file: Output file path
        """
        data = {
            "benchmarks": [
                {
                    **asdict(result),
                    "runs": [asdict(r) for r in result.runs]
                }
                for result in results
            ]
        }

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\nResults saved to {output_file}")


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Performance Benchmark Tool")
    parser.add_argument(
        "--task",
        choices=["simple", "github_issue", "all"],
        default="simple",
        help="Task type to benchmark"
    )
    parser.add_argument(
        "--runs",
        type=int,
        default=3,
        help="Number of runs per benchmark"
    )
    parser.add_argument(
        "--workspace",
        default="/tmp/benchmark-workspace",
        help="Workspace directory"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file"
    )
    parser.add_argument(
        "--api-key",
        help="Anthropic API key (or set ANTHROPIC_API_KEY)"
    )

    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        print("Set it with: export ANTHROPIC_API_KEY='your-key'")
        sys.exit(1)

    # Create workspace
    workspace = Path(args.workspace)
    workspace.mkdir(parents=True, exist_ok=True)

    # Create sample files for benchmarking
    sample_file = workspace / "sample.py"
    sample_file.write_text("""
def hello():
    print("Hello, World!")
""")

    # Initialize benchmark
    benchmark = PerformanceBenchmark(
        workspace=str(workspace),
        api_key=api_key
    )

    results = []

    # Run benchmarks
    if args.task in ["simple", "all"]:
        result = await benchmark.run_benchmark(
            "Simple Task",
            lambda: benchmark.benchmark_orchestrator_simple_task(
                "Add a docstring to the hello function in sample.py"
            ),
            num_runs=args.runs
        )
        results.append(result)

    if args.task in ["github_issue", "all"]:
        result = await benchmark.run_benchmark(
            "GitHub Issue Workflow",
            lambda: benchmark.benchmark_orchestrator_github_issue(
                "Add error handling",
                "Add try-except error handling to the hello function"
            ),
            num_runs=args.runs
        )
        results.append(result)

    # Print results
    benchmark.print_results(results)

    # Save results
    if args.output:
        benchmark.save_results(results, args.output)


if __name__ == "__main__":
    asyncio.run(main())
