"""
Orchestrator Package

This package provides high-level task orchestration for OpenHands using Claude Agent SDK.
The orchestrator coordinates multiple agents to execute complex workflows.

Main Components:
- TaskOrchestrator: High-level task coordination
- TaskResult: Task execution results
- TaskStatus: Task status enumeration

Usage:
    from openhands.orchestrator import TaskOrchestrator

    async with TaskOrchestrator(workspace="/project", api_key="sk-...") as orch:
        result = await orch.execute_github_issue_workflow(...)
"""

from .task_orchestrator import TaskOrchestrator, TaskResult, TaskStatus

__all__ = ["TaskOrchestrator", "TaskResult", "TaskStatus"]
