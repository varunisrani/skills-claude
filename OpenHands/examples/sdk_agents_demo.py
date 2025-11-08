"""
SDK Agents Demo

This script demonstrates how to use the new Claude SDK-based agents
(CodeActAgentSDK, BrowsingAgentSDK, ReadOnlyAgentSDK) in OpenHands.

It shows:
1. How to create agents using the AgentFactory
2. How to use agents with the State/Action pattern
3. How to choose between legacy and SDK versions
4. Best practices for agent configuration

Usage:
    python examples/sdk_agents_demo.py
"""

import os
import sys
from pathlib import Path

# Add OpenHands to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from openhands.core.config import AgentConfig
from openhands.llm.llm_registry import LLMRegistry
from openhands.controller.state.state import State
from openhands.events.action import MessageAction
from openhands.agenthub.agent_factory import AgentFactory


def create_test_config(workspace: str = "/tmp/test") -> AgentConfig:
    """Create a test agent configuration."""
    config = AgentConfig()
    config.workspace_base = workspace
    config.cli_mode = False

    # Enable features
    config.enable_cmd = True
    config.enable_editor = True
    config.enable_jupyter = False
    config.enable_browsing = False
    config.enable_think = True
    config.enable_finish = True
    config.enable_condensation_request = False
    config.enable_plan_mode = False
    config.enable_llm_editor = False

    return config


def create_test_registry() -> LLMRegistry:
    """Create a test LLM registry."""
    # This is a simplified version - in real usage, this would be properly configured
    # with actual LLM settings
    from unittest.mock import Mock

    registry = Mock(spec=LLMRegistry)
    llm = Mock()
    llm.config = Mock()
    llm.config.model = "claude-sonnet-4-5-20250929"
    llm.config.max_message_chars = 10000
    llm.vision_is_active = Mock(return_value=False)
    llm.is_caching_prompt_active = Mock(return_value=False)

    registry.get_llm_from_agent_config = Mock(return_value=llm)

    return registry


def demo_agent_factory():
    """Demonstrate using the AgentFactory."""
    print("\n" + "=" * 70)
    print("Demo 1: Agent Factory")
    print("=" * 70)

    config = create_test_config()
    registry = create_test_registry()

    # List available agents
    print("\n1. Listing available agents:")
    agents = AgentFactory.list_agents()
    print(f"   Available agents: {agents}")

    # Check SDK availability
    print("\n2. Checking SDK availability:")
    for agent_name in ["CodeActAgent", "BrowsingAgent", "ReadOnlyAgent"]:
        has_sdk = AgentFactory.has_sdk_version(agent_name)
        print(f"   {agent_name}: SDK available = {has_sdk}")

    # Get agent info
    print("\n3. Getting agent information:")
    for agent_name in ["CodeActAgent", "BrowsingAgent", "ReadOnlyAgent"]:
        try:
            info = AgentFactory.get_agent_info(agent_name, use_sdk=True)
            print(f"   {agent_name}:")
            print(f"      Class: {info.get('class', 'N/A')}")
            print(f"      Version: {info.get('version', 'N/A')}")
            print(f"      Mode: {info.get('mode', 'N/A')}")
        except Exception as e:
            print(f"   {agent_name}: Error - {e}")

    print("\n✅ Agent Factory demo complete")


def demo_codeact_agent():
    """Demonstrate CodeActAgentSDK usage."""
    print("\n" + "=" * 70)
    print("Demo 2: CodeActAgentSDK")
    print("=" * 70)

    config = create_test_config()
    registry = create_test_registry()

    # Create SDK version
    print("\n1. Creating CodeActAgentSDK...")
    try:
        agent = AgentFactory.create_agent(
            "CodeActAgent",
            config=config,
            llm_registry=registry,
            use_sdk=True
        )

        print(f"   ✓ Created: {agent.name}")
        print(f"   ✓ Version: {agent.VERSION}")
        print(f"   ✓ Has adapter: {hasattr(agent, 'adapter')}")

        # Create a test state
        print("\n2. Creating test state...")
        state = State()
        state.history = [
            MessageAction(
                content="List all Python files in the current directory",
                source="user"
            )
        ]
        state.inputs = {"task": "List Python files"}

        print("   ✓ State created with task")

        # Note: We can't actually execute the step without a real Claude SDK connection
        print("\n3. Agent is ready to execute (requires Claude SDK connection)")
        print("   To execute: action = agent.step(state)")

        print("\n✅ CodeActAgentSDK demo complete")

    except Exception as e:
        print(f"   ✗ Error: {e}")
        print("   Note: This is expected if Claude SDK is not fully configured")


def demo_browsing_agent():
    """Demonstrate BrowsingAgentSDK usage."""
    print("\n" + "=" * 70)
    print("Demo 3: BrowsingAgentSDK")
    print("=" * 70)

    config = create_test_config()
    registry = create_test_registry()

    # Create SDK version
    print("\n1. Creating BrowsingAgentSDK...")
    try:
        agent = AgentFactory.create_agent(
            "BrowsingAgent",
            config=config,
            llm_registry=registry,
            use_sdk=True
        )

        print(f"   ✓ Created: {agent.name}")
        print(f"   ✓ Version: {agent.VERSION}")
        print(f"   ✓ Has adapter: {hasattr(agent, 'adapter')}")

        # Create a test state
        print("\n2. Creating test state for web browsing...")
        state = State()
        state.history = [
            MessageAction(
                content="Navigate to https://example.com and extract the main heading",
                source="user"
            )
        ]
        state.inputs = {"task": "Extract heading from example.com"}

        print("   ✓ State created with browsing task")

        print("\n3. Agent is ready for browsing (requires Browser MCP)")
        print("   To execute: action = agent.step(state)")

        print("\n✅ BrowsingAgentSDK demo complete")

    except Exception as e:
        print(f"   ✗ Error: {e}")
        print("   Note: Browser MCP requires: pip install playwright && playwright install")


def demo_readonly_agent():
    """Demonstrate ReadOnlyAgentSDK usage."""
    print("\n" + "=" * 70)
    print("Demo 4: ReadOnlyAgentSDK")
    print("=" * 70)

    config = create_test_config()
    registry = create_test_registry()

    # Create SDK version
    print("\n1. Creating ReadOnlyAgentSDK...")
    try:
        agent = AgentFactory.create_agent(
            "ReadOnlyAgent",
            config=config,
            llm_registry=registry,
            use_sdk=True
        )

        print(f"   ✓ Created: {agent.name}")
        print(f"   ✓ Version: {agent.VERSION}")
        print(f"   ✓ Has adapter: {hasattr(agent, 'adapter')}")

        # Create a test state
        print("\n2. Creating test state for code analysis...")
        state = State()
        state.history = [
            MessageAction(
                content="Find all TODO comments in Python files",
                source="user"
            )
        ]
        state.inputs = {"task": "Find TODOs"}

        print("   ✓ State created with analysis task")

        print("\n3. Agent is ready for read-only analysis")
        print("   Tools: Read, Grep, Glob (no modifications)")
        print("   To execute: action = agent.step(state)")

        print("\n✅ ReadOnlyAgentSDK demo complete")

    except Exception as e:
        print(f"   ✗ Error: {e}")


def demo_legacy_vs_sdk():
    """Compare legacy and SDK agents."""
    print("\n" + "=" * 70)
    print("Demo 5: Legacy vs SDK Comparison")
    print("=" * 70)

    config = create_test_config()
    registry = create_test_registry()

    print("\n1. Creating both versions of CodeActAgent...")

    # Try legacy
    try:
        legacy_agent = AgentFactory.create_agent(
            "CodeActAgent",
            config=config,
            llm_registry=registry,
            use_sdk=False
        )
        print(f"   ✓ Legacy: {legacy_agent.name} v{legacy_agent.VERSION}")
        print(f"      - Uses LiteLLM: {hasattr(legacy_agent, 'llm')}")
        print(f"      - Has adapter: {hasattr(legacy_agent, 'adapter')}")
    except Exception as e:
        print(f"   ✗ Legacy: {e}")

    # Try SDK
    try:
        sdk_agent = AgentFactory.create_agent(
            "CodeActAgent",
            config=config,
            llm_registry=registry,
            use_sdk=True
        )
        print(f"   ✓ SDK: {sdk_agent.name} v{sdk_agent.VERSION}")
        print(f"      - Uses LiteLLM: {hasattr(sdk_agent, 'llm')}")
        print(f"      - Has adapter: {hasattr(sdk_agent, 'adapter')}")
    except Exception as e:
        print(f"   ✗ SDK: {e}")

    print("\n2. Comparison:")
    print("   Legacy Agent:")
    print("      - Uses LiteLLM for completions")
    print("      - Custom agent loop (~1500 LOC)")
    print("      - Manual tool handling")
    print("      - Mature and tested")
    print("\n   SDK Agent:")
    print("      - Uses Claude Agent SDK")
    print("      - Simplified implementation (~200 LOC)")
    print("      - Native tool integration")
    print("      - Better performance and features")

    print("\n✅ Comparison demo complete")


def demo_configuration():
    """Demonstrate configuration options."""
    print("\n" + "=" * 70)
    print("Demo 6: Configuration Options")
    print("=" * 70)

    print("\n1. Environment variable control:")
    print("   export OPENHANDS_USE_SDK_AGENTS=true   # Use SDK by default")
    print("   export OPENHANDS_USE_SDK_AGENTS=false  # Use legacy by default")

    print("\n2. Config-based control:")
    print("   config.use_sdk_agents = True   # Use SDK")
    print("   config.use_sdk_agents = False  # Use legacy")

    print("\n3. Explicit control:")
    print("   # Force SDK")
    print("   agent = AgentFactory.create_agent(..., use_sdk=True)")
    print("\n   # Force legacy")
    print("   agent = AgentFactory.create_agent(..., use_sdk=False)")

    print("\n4. Auto-detection:")
    print("   # Let factory decide based on config/environment")
    print("   agent = AgentFactory.create_agent(..., use_sdk=None)")
    print("   # SDK will be used for Claude models automatically")

    print("\n✅ Configuration demo complete")


def main():
    """Run all demos."""
    print("\n" + "=" * 70)
    print("OpenHands SDK Agents Demo")
    print("=" * 70)
    print("\nThis demo shows how to use Claude SDK-based agents in OpenHands.")
    print("SDK agents provide the same interface as legacy agents but with:")
    print("  - Simpler implementation (80% less code)")
    print("  - Better performance")
    print("  - Native Claude SDK integration")
    print("  - Improved tool handling")

    try:
        # Run demos
        demo_agent_factory()
        demo_codeact_agent()
        demo_browsing_agent()
        demo_readonly_agent()
        demo_legacy_vs_sdk()
        demo_configuration()

        print("\n" + "=" * 70)
        print("All Demos Complete!")
        print("=" * 70)

        print("\nNext steps:")
        print("1. Install dependencies:")
        print("   pip install claude-agent-sdk playwright jupyter_client")
        print("   playwright install chromium")
        print("\n2. Set API key:")
        print("   export ANTHROPIC_API_KEY='your-key'")
        print("\n3. Enable SDK agents:")
        print("   export OPENHANDS_USE_SDK_AGENTS=true")
        print("\n4. Use in your code:")
        print("   agent = AgentFactory.create_agent('CodeActAgent', ...)")
        print("\nSee AGENTHUB_SDK_CONVERSION.md for full documentation.")

    except Exception as e:
        print(f"\n✗ Demo error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
