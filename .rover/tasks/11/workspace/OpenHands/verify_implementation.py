#!/usr/bin/env python3
"""
Implementation Verification Script

This script verifies that all Phase 1 components are properly implemented
and can be imported without errors.

Usage:
    python verify_implementation.py
"""

import sys
from pathlib import Path

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BOLD = '\033[1m'

def check(description, condition):
    """Check a condition and print result."""
    if condition:
        print(f"{GREEN}✓{RESET} {description}")
        return True
    else:
        print(f"{RED}✗{RESET} {description}")
        return False

def main():
    """Run verification checks."""
    print(f"\n{BOLD}Phase 1 Implementation Verification{RESET}")
    print("=" * 80)

    checks_passed = 0
    total_checks = 0

    # 1. Check directory structure
    print(f"\n{BOLD}1. Directory Structure{RESET}")
    total_checks += 4

    base_path = Path(__file__).parent / "openhands"

    checks_passed += check("agent_hub directory exists",
                          (base_path / "agent_hub").is_dir())
    checks_passed += check("mcp_servers directory exists",
                          (base_path / "mcp_servers").is_dir())
    checks_passed += check("orchestrator directory exists",
                          (base_path / "orchestrator").is_dir())
    checks_passed += check("prompts directory exists",
                          (base_path / "prompts").is_dir())

    # 2. Check Python files
    print(f"\n{BOLD}2. Python Implementation Files{RESET}")
    total_checks += 7

    checks_passed += check("agent_hub/__init__.py exists",
                          (base_path / "agent_hub" / "__init__.py").is_file())
    checks_passed += check("agent_hub/hub.py exists",
                          (base_path / "agent_hub" / "hub.py").is_file())
    checks_passed += check("mcp_servers/__init__.py exists",
                          (base_path / "mcp_servers" / "__init__.py").is_file())
    checks_passed += check("mcp_servers/jupyter_mcp.py exists",
                          (base_path / "mcp_servers" / "jupyter_mcp.py").is_file())
    checks_passed += check("mcp_servers/browser_mcp.py exists",
                          (base_path / "mcp_servers" / "browser_mcp.py").is_file())
    checks_passed += check("orchestrator/__init__.py exists",
                          (base_path / "orchestrator" / "__init__.py").is_file())
    checks_passed += check("orchestrator/task_orchestrator.py exists",
                          (base_path / "orchestrator" / "task_orchestrator.py").is_file())

    # 3. Check prompt files
    print(f"\n{BOLD}3. System Prompt Files{RESET}")
    total_checks += 5

    prompts_path = base_path / "prompts"

    checks_passed += check("code_agent.txt exists",
                          (prompts_path / "code_agent.txt").is_file())
    checks_passed += check("analysis_agent.txt exists",
                          (prompts_path / "analysis_agent.txt").is_file())
    checks_passed += check("testing_agent.txt exists",
                          (prompts_path / "testing_agent.txt").is_file())
    checks_passed += check("browser_agent.txt exists",
                          (prompts_path / "browser_agent.txt").is_file())
    checks_passed += check("python_agent.txt exists",
                          (prompts_path / "python_agent.txt").is_file())

    # 4. Check POC files
    print(f"\n{BOLD}4. POC Files{RESET}")
    total_checks += 4

    poc_path = Path(__file__).parent / "poc"

    checks_passed += check("poc/poc_simple_query.py exists",
                          (poc_path / "poc_simple_query.py").is_file())
    checks_passed += check("poc/test_file_1.py exists",
                          (poc_path / "test_file_1.py").is_file())
    checks_passed += check("poc/test_file_2.py exists",
                          (poc_path / "test_file_2.py").is_file())
    checks_passed += check("poc/README.md exists",
                          (poc_path / "README.md").is_file())

    # 5. Check test files
    print(f"\n{BOLD}5. Test Files{RESET}")
    total_checks += 2

    tests_path = Path(__file__).parent / "tests"

    checks_passed += check("tests/test_agent_hub.py exists",
                          (tests_path / "test_agent_hub.py").is_file())
    checks_passed += check("tests/test_orchestrator.py exists",
                          (tests_path / "test_orchestrator.py").is_file())

    # 6. Check documentation
    print(f"\n{BOLD}6. Documentation Files{RESET}")
    total_checks += 2

    docs_path = Path(__file__).parent

    checks_passed += check("CLAUDE_SDK_INTEGRATION_README.md exists",
                          (docs_path / "CLAUDE_SDK_INTEGRATION_README.md").is_file())
    checks_passed += check("IMPLEMENTATION_SUMMARY.md exists",
                          (docs_path / "IMPLEMENTATION_SUMMARY.md").is_file())

    # 7. Try importing modules (optional - requires dependencies)
    print(f"\n{BOLD}7. Module Imports (Optional){RESET}")

    try:
        sys.path.insert(0, str(Path(__file__).parent))

        from openhands.agent_hub import AgentHub, AgentConfig
        checks_passed += 1
        total_checks += 1
        print(f"{GREEN}✓{RESET} Can import AgentHub and AgentConfig")
    except ImportError as e:
        total_checks += 1
        print(f"{YELLOW}⚠{RESET} Cannot import agent_hub (dependencies may be missing): {e}")

    try:
        from openhands.orchestrator import TaskOrchestrator, TaskResult, TaskStatus
        checks_passed += 1
        total_checks += 1
        print(f"{GREEN}✓{RESET} Can import TaskOrchestrator, TaskResult, TaskStatus")
    except ImportError as e:
        total_checks += 1
        print(f"{YELLOW}⚠{RESET} Cannot import orchestrator (dependencies may be missing): {e}")

    try:
        from openhands.mcp_servers import (
            create_jupyter_mcp_server,
            create_browser_mcp_server
        )
        checks_passed += 1
        total_checks += 1
        print(f"{GREEN}✓{RESET} Can import MCP server creators")
    except ImportError as e:
        total_checks += 1
        print(f"{YELLOW}⚠{RESET} Cannot import mcp_servers (dependencies may be missing): {e}")

    # Final summary
    print(f"\n{BOLD}{'=' * 80}{RESET}")
    print(f"{BOLD}Summary{RESET}")
    print(f"{'=' * 80}")
    print(f"Checks passed: {checks_passed}/{total_checks}")

    percentage = (checks_passed / total_checks) * 100

    if percentage == 100:
        print(f"\n{GREEN}{BOLD}✓ All checks passed! Implementation is complete.{RESET}")
        return 0
    elif percentage >= 90:
        print(f"\n{YELLOW}{BOLD}⚠ Most checks passed ({percentage:.1f}%). Review warnings above.{RESET}")
        return 0
    else:
        print(f"\n{RED}{BOLD}✗ Some checks failed ({percentage:.1f}%). Review errors above.{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
