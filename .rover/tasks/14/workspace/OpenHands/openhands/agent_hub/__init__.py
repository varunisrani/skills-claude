"""
Agent Hub Package

This package provides the Agent Hub for managing multiple specialized Claude Code agents.
The hub replaces OpenHands' AgentController with a simplified orchestration layer.

Main Components:
- AgentHub: Central coordinator for specialized agents
- AgentConfig: Configuration for individual agent types

Usage:
    from openhands.agent_hub import AgentHub

    async with AgentHub(workspace="/project", api_key="sk-...") as hub:
        # Execute tasks with specialized agents
        results = await hub.execute_task("code", "Implement feature X")
"""

from .hub import AgentHub, AgentConfig

__all__ = ["AgentHub", "AgentConfig"]
