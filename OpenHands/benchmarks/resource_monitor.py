#!/usr/bin/env python3
"""
Resource Monitoring Tool

Monitors resource usage (CPU, memory, network) during task execution.
Provides real-time monitoring and generates detailed reports.

Usage:
    python benchmarks/resource_monitor.py --duration 60 --interval 1
    python benchmarks/resource_monitor.py --task "Analyze codebase" --output monitor.json
"""

import asyncio
import argparse
import time
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict
import psutil
import os
from datetime import datetime

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class ResourceSnapshot:
    """Resource usage snapshot at a point in time."""
    timestamp: float
    cpu_percent: float  # CPU usage percentage
    memory_mb: float  # Memory usage in MB
    memory_percent: float  # Memory usage percentage
    threads: int  # Number of threads
    open_files: int  # Number of open files
    connections: int  # Number of network connections


class ResourceMonitor:
    """Resource monitoring tool."""

    def __init__(self, interval: float = 1.0):
        """
        Initialize resource monitor.

        Args:
            interval: Sampling interval in seconds
        """
        self.interval = interval
        self.process = psutil.Process()
        self.snapshots: List[ResourceSnapshot] = []
        self.monitoring = False

    async def start_monitoring(self):
        """Start monitoring resources."""
        self.monitoring = True
        self.snapshots = []

        print(f"Starting resource monitoring (interval: {self.interval}s)...")

        while self.monitoring:
            snapshot = self._take_snapshot()
            self.snapshots.append(snapshot)

            # Print live stats
            print(f"\r  CPU: {snapshot.cpu_percent:.1f}% | "
                  f"Memory: {snapshot.memory_mb:.1f}MB ({snapshot.memory_percent:.1f}%) | "
                  f"Threads: {snapshot.threads} | "
                  f"Files: {snapshot.open_files}",
                  end="", flush=True)

            await asyncio.sleep(self.interval)

        print()  # New line after monitoring

    def stop_monitoring(self):
        """Stop monitoring resources."""
        self.monitoring = False

    def _take_snapshot(self) -> ResourceSnapshot:
        """
        Take resource usage snapshot.

        Returns:
            ResourceSnapshot
        """
        try:
            memory_info = self.process.memory_info()
            memory_mb = memory_info.rss / 1024 / 1024

            # Get CPU percentage (non-blocking)
            cpu_percent = self.process.cpu_percent(interval=None)

            # Count open files (may not work on all systems)
            try:
                open_files = len(self.process.open_files())
            except:
                open_files = 0

            # Count network connections
            try:
                connections = len(self.process.connections())
            except:
                connections = 0

            return ResourceSnapshot(
                timestamp=time.time(),
                cpu_percent=cpu_percent,
                memory_mb=memory_mb,
                memory_percent=self.process.memory_percent(),
                threads=self.process.num_threads(),
                open_files=open_files,
                connections=connections
            )

        except Exception as e:
            print(f"\nWarning: Failed to collect snapshot: {e}")
            return ResourceSnapshot(
                timestamp=time.time(),
                cpu_percent=0,
                memory_mb=0,
                memory_percent=0,
                threads=0,
                open_files=0,
                connections=0
            )

    def get_statistics(self) -> Dict[str, Any]:
        """
        Calculate statistics from collected snapshots.

        Returns:
            Dictionary of statistics
        """
        if not self.snapshots:
            return {}

        cpu_values = [s.cpu_percent for s in self.snapshots]
        memory_values = [s.memory_mb for s in self.snapshots]
        threads_values = [s.threads for s in self.snapshots]

        return {
            "duration": self.snapshots[-1].timestamp - self.snapshots[0].timestamp,
            "samples": len(self.snapshots),
            "cpu": {
                "avg": sum(cpu_values) / len(cpu_values),
                "max": max(cpu_values),
                "min": min(cpu_values)
            },
            "memory": {
                "avg_mb": sum(memory_values) / len(memory_values),
                "max_mb": max(memory_values),
                "min_mb": min(memory_values),
                "peak_mb": max(memory_values)
            },
            "threads": {
                "avg": sum(threads_values) / len(threads_values),
                "max": max(threads_values),
                "min": min(threads_values)
            }
        }

    def print_report(self):
        """Print monitoring report."""
        stats = self.get_statistics()

        if not stats:
            print("No data collected")
            return

        print("\n" + "=" * 60)
        print("RESOURCE MONITORING REPORT")
        print("=" * 60)
        print(f"\nDuration: {stats['duration']:.2f}s")
        print(f"Samples: {stats['samples']}")

        print(f"\nCPU Usage:")
        print(f"  Average: {stats['cpu']['avg']:.1f}%")
        print(f"  Maximum: {stats['cpu']['max']:.1f}%")
        print(f"  Minimum: {stats['cpu']['min']:.1f}%")

        print(f"\nMemory Usage:")
        print(f"  Average: {stats['memory']['avg_mb']:.2f} MB")
        print(f"  Peak: {stats['memory']['peak_mb']:.2f} MB")
        print(f"  Minimum: {stats['memory']['min_mb']:.2f} MB")

        print(f"\nThreads:")
        print(f"  Average: {stats['threads']['avg']:.1f}")
        print(f"  Maximum: {stats['threads']['max']}")

        print("=" * 60)

    def save_report(self, output_file: str):
        """
        Save monitoring report to JSON file.

        Args:
            output_file: Output file path
        """
        stats = self.get_statistics()

        data = {
            "timestamp": datetime.now().isoformat(),
            "statistics": stats,
            "snapshots": [asdict(s) for s in self.snapshots]
        }

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\nReport saved to {output_file}")

    async def monitor_task(self, task_coro):
        """
        Monitor resources while executing a task.

        Args:
            task_coro: Async task to monitor

        Returns:
            Task result
        """
        # Start monitoring
        monitor_task = asyncio.create_task(self.start_monitoring())

        try:
            # Execute task
            result = await task_coro
            return result

        finally:
            # Stop monitoring
            self.stop_monitoring()
            await monitor_task


async def monitor_orchestrator_task(
    monitor: ResourceMonitor,
    workspace: str,
    api_key: str,
    task: str
):
    """
    Monitor resource usage during orchestrator task.

    Args:
        monitor: ResourceMonitor instance
        workspace: Workspace directory
        api_key: API key
        task: Task description

    Returns:
        Task result
    """
    from openhands.orchestrator import TaskOrchestrator

    async with TaskOrchestrator(
        workspace=workspace,
        api_key=api_key
    ) as orchestrator:
        result = await monitor.monitor_task(
            orchestrator.execute_simple_task(
                agent_type="code",
                task_description=task
            )
        )

        return result


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Resource Monitoring Tool")
    parser.add_argument(
        "--duration",
        type=float,
        help="Monitoring duration in seconds (standalone mode)"
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Sampling interval in seconds"
    )
    parser.add_argument(
        "--task",
        help="Task to execute and monitor"
    )
    parser.add_argument(
        "--workspace",
        default="/tmp/monitor-workspace",
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

    # Create monitor
    monitor = ResourceMonitor(interval=args.interval)

    if args.task:
        # Monitor specific task
        api_key = args.api_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            print("Error: ANTHROPIC_API_KEY not set")
            sys.exit(1)

        # Create workspace
        workspace = Path(args.workspace)
        workspace.mkdir(parents=True, exist_ok=True)

        print(f"Executing and monitoring task: {args.task}")

        result = await monitor_orchestrator_task(
            monitor,
            str(workspace),
            api_key,
            args.task
        )

        print(f"\nTask completed: {result.status.value}")

    elif args.duration:
        # Standalone monitoring
        monitor_task = asyncio.create_task(monitor.start_monitoring())

        await asyncio.sleep(args.duration)

        monitor.stop_monitoring()
        await monitor_task

    else:
        print("Error: Specify --duration or --task")
        sys.exit(1)

    # Print report
    monitor.print_report()

    # Save report
    if args.output:
        monitor.save_report(args.output)


if __name__ == "__main__":
    asyncio.run(main())
