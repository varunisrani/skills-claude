#!/usr/bin/env python3
"""
Cost Analysis Tool

Analyzes and tracks costs for Claude API usage including token consumption,
API calls, and estimated costs.

Usage:
    python benchmarks/cost_analyzer.py --log api_log.json
    python benchmarks/cost_analyzer.py --estimate --input-tokens 10000 --output-tokens 5000
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Pricing information (as of 2025-01 - update with current rates)
PRICING = {
    "claude-sonnet-4-5-20250929": {
        "input": 0.000003,  # $3 per million tokens
        "output": 0.000015,  # $15 per million tokens
    },
    "claude-opus-4-20250514": {
        "input": 0.000015,  # $15 per million tokens
        "output": 0.000075,  # $75 per million tokens
    },
    "claude-haiku-3-5-20241022": {
        "input": 0.000001,  # $1 per million tokens
        "output": 0.000005,  # $5 per million tokens
    }
}


@dataclass
class APICall:
    """Single API call record."""
    timestamp: str
    model: str
    input_tokens: int
    output_tokens: int
    cost: float
    task_type: str = "unknown"
    cached_tokens: int = 0


@dataclass
class CostSummary:
    """Cost summary for analysis period."""
    total_calls: int
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    total_cost: float
    avg_cost_per_call: float
    avg_tokens_per_call: float
    cost_by_model: Dict[str, float]
    cost_by_task_type: Dict[str, float]


class CostAnalyzer:
    """Cost analysis tool."""

    def __init__(self):
        """Initialize cost analyzer."""
        self.calls: List[APICall] = []

    def add_call(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        task_type: str = "unknown",
        cached_tokens: int = 0,
        timestamp: str = None
    ):
        """
        Add API call to tracking.

        Args:
            model: Model name
            input_tokens: Input token count
            output_tokens: Output token count
            task_type: Type of task
            cached_tokens: Number of cached tokens (reduce cost)
            timestamp: Timestamp (or current time)
        """
        if timestamp is None:
            timestamp = datetime.now().isoformat()

        # Calculate cost
        pricing = PRICING.get(model, PRICING["claude-sonnet-4-5-20250929"])

        # Cached tokens are much cheaper
        effective_input = input_tokens - cached_tokens
        cache_cost = cached_tokens * pricing["input"] * 0.1  # 90% discount for cache

        input_cost = effective_input * pricing["input"]
        output_cost = output_tokens * pricing["output"]
        total_cost = input_cost + output_cost + cache_cost

        call = APICall(
            timestamp=timestamp,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=total_cost,
            task_type=task_type,
            cached_tokens=cached_tokens
        )

        self.calls.append(call)

    def estimate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cached_tokens: int = 0
    ) -> float:
        """
        Estimate cost for given token counts.

        Args:
            model: Model name
            input_tokens: Input token count
            output_tokens: Output token count
            cached_tokens: Cached token count

        Returns:
            Estimated cost in dollars
        """
        pricing = PRICING.get(model, PRICING["claude-sonnet-4-5-20250929"])

        effective_input = input_tokens - cached_tokens
        cache_cost = cached_tokens * pricing["input"] * 0.1

        input_cost = effective_input * pricing["input"]
        output_cost = output_tokens * pricing["output"]

        return input_cost + output_cost + cache_cost

    def get_summary(self) -> CostSummary:
        """
        Get cost summary.

        Returns:
            CostSummary
        """
        if not self.calls:
            return CostSummary(
                total_calls=0,
                total_input_tokens=0,
                total_output_tokens=0,
                total_tokens=0,
                total_cost=0,
                avg_cost_per_call=0,
                avg_tokens_per_call=0,
                cost_by_model={},
                cost_by_task_type={}
            )

        total_input = sum(c.input_tokens for c in self.calls)
        total_output = sum(c.output_tokens for c in self.calls)
        total_cost = sum(c.cost for c in self.calls)

        # Group by model
        cost_by_model = {}
        for call in self.calls:
            cost_by_model[call.model] = cost_by_model.get(call.model, 0) + call.cost

        # Group by task type
        cost_by_task = {}
        for call in self.calls:
            cost_by_task[call.task_type] = cost_by_task.get(call.task_type, 0) + call.cost

        return CostSummary(
            total_calls=len(self.calls),
            total_input_tokens=total_input,
            total_output_tokens=total_output,
            total_tokens=total_input + total_output,
            total_cost=total_cost,
            avg_cost_per_call=total_cost / len(self.calls),
            avg_tokens_per_call=(total_input + total_output) / len(self.calls),
            cost_by_model=cost_by_model,
            cost_by_task_type=cost_by_task
        )

    def print_summary(self):
        """Print cost summary."""
        summary = self.get_summary()

        print("\n" + "=" * 70)
        print("COST ANALYSIS SUMMARY")
        print("=" * 70)

        print(f"\nTotal API Calls: {summary.total_calls}")
        print(f"Total Tokens: {summary.total_tokens:,}")
        print(f"  Input: {summary.total_input_tokens:,}")
        print(f"  Output: {summary.total_output_tokens:,}")

        print(f"\nTotal Cost: ${summary.total_cost:.4f}")
        print(f"Average Cost per Call: ${summary.avg_cost_per_call:.4f}")
        print(f"Average Tokens per Call: {summary.avg_tokens_per_call:.0f}")

        if summary.cost_by_model:
            print(f"\nCost by Model:")
            for model, cost in sorted(summary.cost_by_model.items(), key=lambda x: x[1], reverse=True):
                print(f"  {model}: ${cost:.4f}")

        if summary.cost_by_task_type:
            print(f"\nCost by Task Type:")
            for task_type, cost in sorted(summary.cost_by_task_type.items(), key=lambda x: x[1], reverse=True):
                print(f"  {task_type}: ${cost:.4f}")

        print("=" * 70)

    def print_detailed_calls(self, limit: int = 20):
        """
        Print detailed call information.

        Args:
            limit: Maximum number of calls to print
        """
        print(f"\nDetailed Calls (showing last {limit}):")
        print("-" * 100)

        calls_to_show = self.calls[-limit:] if len(self.calls) > limit else self.calls

        for i, call in enumerate(calls_to_show, 1):
            print(f"{i}. {call.timestamp}")
            print(f"   Model: {call.model}")
            print(f"   Tokens: {call.input_tokens:,} in, {call.output_tokens:,} out")
            if call.cached_tokens > 0:
                print(f"   Cached: {call.cached_tokens:,}")
            print(f"   Cost: ${call.cost:.4f}")
            print(f"   Task: {call.task_type}")
            print()

    def save_report(self, output_file: str):
        """
        Save cost report to JSON file.

        Args:
            output_file: Output file path
        """
        summary = self.get_summary()

        data = {
            "generated_at": datetime.now().isoformat(),
            "summary": asdict(summary),
            "calls": [asdict(c) for c in self.calls]
        }

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\nReport saved to {output_file}")

    def load_log(self, log_file: str):
        """
        Load API calls from log file.

        Args:
            log_file: Log file path
        """
        log_path = Path(log_file)

        if not log_path.exists():
            print(f"Error: Log file not found: {log_file}")
            return

        with open(log_path, 'r') as f:
            data = json.load(f)

        # Load calls
        if "calls" in data:
            for call_data in data["calls"]:
                call = APICall(**call_data)
                self.calls.append(call)

        print(f"Loaded {len(self.calls)} API calls from {log_file}")

    def compare_scenarios(self, scenario_a: str, scenario_b: str):
        """
        Compare costs between two scenarios.

        Args:
            scenario_a: Name of first scenario
            scenario_b: Name of second scenario
        """
        # Group calls by scenario (task_type)
        calls_a = [c for c in self.calls if scenario_a in c.task_type]
        calls_b = [c for c in self.calls if scenario_b in c.task_type]

        if not calls_a or not calls_b:
            print("Not enough data to compare scenarios")
            return

        cost_a = sum(c.cost for c in calls_a)
        cost_b = sum(c.cost for c in calls_b)
        tokens_a = sum(c.input_tokens + c.output_tokens for c in calls_a)
        tokens_b = sum(c.input_tokens + c.output_tokens for c in calls_b)

        print(f"\n" + "=" * 70)
        print(f"SCENARIO COMPARISON: {scenario_a} vs {scenario_b}")
        print("=" * 70)

        print(f"\n{scenario_a}:")
        print(f"  Calls: {len(calls_a)}")
        print(f"  Total Cost: ${cost_a:.4f}")
        print(f"  Total Tokens: {tokens_a:,}")
        print(f"  Avg Cost/Call: ${cost_a / len(calls_a):.4f}")

        print(f"\n{scenario_b}:")
        print(f"  Calls: {len(calls_b)}")
        print(f"  Total Cost: ${cost_b:.4f}")
        print(f"  Total Tokens: {tokens_b:,}")
        print(f"  Avg Cost/Call: ${cost_b / len(calls_b):.4f}")

        print(f"\nDifference:")
        cost_diff = cost_b - cost_a
        cost_diff_pct = (cost_diff / cost_a * 100) if cost_a > 0 else 0
        print(f"  Cost: ${cost_diff:+.4f} ({cost_diff_pct:+.1f}%)")

        tokens_diff = tokens_b - tokens_a
        tokens_diff_pct = (tokens_diff / tokens_a * 100) if tokens_a > 0 else 0
        print(f"  Tokens: {tokens_diff:+,} ({tokens_diff_pct:+.1f}%)")

        print("=" * 70)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Cost Analysis Tool")
    parser.add_argument(
        "--log",
        help="Load API log file"
    )
    parser.add_argument(
        "--estimate",
        action="store_true",
        help="Estimate cost for token counts"
    )
    parser.add_argument(
        "--input-tokens",
        type=int,
        help="Input token count for estimation"
    )
    parser.add_argument(
        "--output-tokens",
        type=int,
        help="Output token count for estimation"
    )
    parser.add_argument(
        "--cached-tokens",
        type=int,
        default=0,
        help="Cached token count"
    )
    parser.add_argument(
        "--model",
        default="claude-sonnet-4-5-20250929",
        help="Model name"
    )
    parser.add_argument(
        "--output",
        help="Output report file"
    )
    parser.add_argument(
        "--detailed",
        action="store_true",
        help="Show detailed call information"
    )

    args = parser.parse_args()

    analyzer = CostAnalyzer()

    if args.estimate:
        # Estimate mode
        if args.input_tokens is None or args.output_tokens is None:
            print("Error: --input-tokens and --output-tokens required for estimation")
            sys.exit(1)

        cost = analyzer.estimate_cost(
            args.model,
            args.input_tokens,
            args.output_tokens,
            args.cached_tokens
        )

        print("\nCost Estimation")
        print("=" * 50)
        print(f"Model: {args.model}")
        print(f"Input Tokens: {args.input_tokens:,}")
        print(f"Output Tokens: {args.output_tokens:,}")
        if args.cached_tokens:
            print(f"Cached Tokens: {args.cached_tokens:,}")
        print(f"\nEstimated Cost: ${cost:.4f}")
        print("=" * 50)

    elif args.log:
        # Load and analyze log
        analyzer.load_log(args.log)
        analyzer.print_summary()

        if args.detailed:
            analyzer.print_detailed_calls()

        if args.output:
            analyzer.save_report(args.output)

    else:
        # Demo mode with sample data
        print("Demo mode: Adding sample API calls...")

        analyzer.add_call("claude-sonnet-4-5-20250929", 1000, 500, "simple_task")
        analyzer.add_call("claude-sonnet-4-5-20250929", 2000, 1000, "github_issue")
        analyzer.add_call("claude-sonnet-4-5-20250929", 1500, 750, "feature_implementation")
        analyzer.add_call("claude-sonnet-4-5-20250929", 3000, 1500, "github_issue", cached_tokens=500)

        analyzer.print_summary()

        if args.output:
            analyzer.save_report(args.output)


if __name__ == "__main__":
    main()
