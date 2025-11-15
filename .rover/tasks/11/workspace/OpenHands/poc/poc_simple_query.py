#!/usr/bin/env python3
"""
POC Script: Simple Query with Claude Agent SDK

This script demonstrates basic usage of the Claude Agent SDK for OpenHands.
It shows how to use Claude Code to analyze files and find TODO comments.

Usage:
    python poc_simple_query.py

Requirements:
    - Claude Agent SDK installed (pip install claude-agent-sdk)
    - ANTHROPIC_API_KEY environment variable set
    - Claude Code CLI installed globally
"""

import asyncio
import os
from claude_agent_sdk import query, ClaudeAgentOptions


async def main():
    """Simple POC: Use Claude Code to find TODO comments."""

    print("🔍 Starting simple query POC...")
    print("=" * 80)

    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("   Please set it with: export ANTHROPIC_API_KEY='your-key-here'")
        return

    # Configure agent options
    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob"],
        cwd="/home/user/skills-claude/OpenHands/poc",
        system_prompt="You are a code analyzer. Find and categorize TODO comments.",
        permission_mode="accept",
        max_turns=10
    )

    print("\n📋 Task: Find all TODO comments in test files")
    print("-" * 80)

    try:
        # Execute query
        async for message in query(
            prompt="Find all TODO comments in this directory. List them with file names and line numbers.",
            options=options
        ):
            print(f"📨 Message: {message}")

        print("\n" + "=" * 80)
        print("✅ POC complete!")

    except Exception as e:
        print(f"\n❌ Error during execution: {e}")
        print(f"   Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\nClaude Agent SDK - Simple Query POC")
    print("OpenHands Integration Test\n")
    asyncio.run(main())
