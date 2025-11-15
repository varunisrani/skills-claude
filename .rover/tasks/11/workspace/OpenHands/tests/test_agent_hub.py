#!/usr/bin/env python3
"""
Test script for Agent Hub

This script demonstrates and tests the Agent Hub functionality.
It shows various usage patterns including single agent execution,
parallel execution, and sequential workflows.

Usage:
    python tests/test_agent_hub.py

Requirements:
    - Claude Agent SDK installed
    - ANTHROPIC_API_KEY environment variable set
    - Claude Code CLI installed
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from openhands.agent_hub import AgentHub

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_single_agent():
    """Test single agent execution."""
    print("\n" + "=" * 80)
    print("TEST 1: Single Agent Execution")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set. Skipping test.")
        return

    async with AgentHub(workspace=".", api_key=api_key) as hub:
        print("\n📋 Task: Find all TODO comments in the codebase")

        # Use analysis agent to find TODO comments
        results = await hub.execute_task(
            agent_type="analysis",
            task="Find all TODO comments in this codebase and categorize them by file"
        )

        print(f"\n✅ Received {len(results)} messages")
        print(f"First message: {results[0] if results else 'No results'}")


async def test_parallel_agents():
    """Test parallel agent execution."""
    print("\n" + "=" * 80)
    print("TEST 2: Parallel Agent Execution")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set. Skipping test.")
        return

    async with AgentHub(workspace=".", api_key=api_key) as hub:
        print("\n📋 Tasks: Run analysis and code review in parallel")

        # Run multiple tasks in parallel
        results = await hub.parallel_execute([
            ("analysis", "Analyze the agent_hub directory structure"),
            ("analysis", "Review the MCP server implementations")
        ])

        print(f"\n✅ Parallel execution complete")
        print(f"Results keys: {list(results.keys())}")
        for agent_type, messages in results.items():
            print(f"{agent_type}: {len(messages)} messages")


async def test_sequential_workflow():
    """Test sequential multi-agent workflow."""
    print("\n" + "=" * 80)
    print("TEST 3: Sequential Workflow")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set. Skipping test.")
        return

    async with AgentHub(workspace=".", api_key=api_key) as hub:
        # Step 1: Analyze
        print("\n📊 Step 1: Analysis...")
        analysis_results = await hub.execute_task(
            agent_type="analysis",
            task="Analyze the POC directory structure and files"
        )
        print(f"Analysis complete: {len(analysis_results)} messages")

        # Step 2: Review (using same agent - it remembers context)
        print("\n📊 Step 2: Code Review...")
        review_agent = await hub.get_agent("analysis")
        await review_agent.query("Based on your analysis, what improvements would you suggest?")

        review_results = []
        async for msg in review_agent.receive_response():
            review_results.append(msg)

        print(f"Review complete: {len(review_results)} messages")

        print("\n✅ Sequential workflow complete")


async def test_agent_reuse():
    """Test agent caching and reuse."""
    print("\n" + "=" * 80)
    print("TEST 4: Agent Caching and Reuse")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set. Skipping test.")
        return

    async with AgentHub(workspace=".", api_key=api_key) as hub:
        print("\n📋 Creating analysis agent (first time)...")
        agent1 = await hub.get_agent("analysis")
        print(f"Agent 1 ID: {id(agent1)}")

        print("\n📋 Getting analysis agent (should be cached)...")
        agent2 = await hub.get_agent("analysis")
        print(f"Agent 2 ID: {id(agent2)}")

        if agent1 is agent2:
            print("✅ Agents are the same (caching works)")
        else:
            print("❌ Agents are different (caching failed)")

        print(f"\nTotal agents created: {len(hub.agents)}")
        print(f"Agent types: {list(hub.agents.keys())}")


async def test_agent_configs():
    """Test agent configurations."""
    print("\n" + "=" * 80)
    print("TEST 5: Agent Configurations")
    print("=" * 80)

    api_key = os.getenv("ANTHROPIC_API_KEY", "test-key")

    hub = AgentHub(workspace=".", api_key=api_key)

    print("\n📋 Available agent types:")
    for agent_type, config in hub.configs.items():
        print(f"\n{agent_type.upper()} Agent:")
        print(f"  Tools: {', '.join(config.allowed_tools)}")
        print(f"  Permission mode: {config.permission_mode}")
        print(f"  Max turns: {config.max_turns}")
        print(f"  MCP servers: {list(config.mcp_servers.keys()) if config.mcp_servers else 'None'}")

    await hub.cleanup()


async def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("AGENT HUB TEST SUITE")
    print("=" * 80)

    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n⚠️  WARNING: ANTHROPIC_API_KEY not set")
        print("   Some tests will be skipped")
        print("   Set it with: export ANTHROPIC_API_KEY='your-key-here'")

    # Run configuration test (doesn't need API key)
    await test_agent_configs()

    # Run tests that need API key
    if api_key:
        await test_agent_reuse()
        # Uncomment to run more extensive tests:
        # await test_single_agent()
        # await test_parallel_agents()
        # await test_sequential_workflow()
    else:
        print("\n⏭️  Skipping API-dependent tests")

    print("\n" + "=" * 80)
    print("TEST SUITE COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
