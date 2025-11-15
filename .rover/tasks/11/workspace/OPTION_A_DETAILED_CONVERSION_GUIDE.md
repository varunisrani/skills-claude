# OpenHands to Claude Agent SDK: Option A - Full Delegation
## Complete Implementation Guide

**Document Version:** 1.0
**Date:** 2025-11-08
**Status:** Implementation Ready
**Target Architecture:** Full Delegation to Claude Agent SDK

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Agent Hub Design](#agent-hub-design)
4. [Main Agent Conversation Patterns](#main-agent-conversation-patterns)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Complete Code Examples](#complete-code-examples)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)
9. [Migration Checklist](#migration-checklist)

---

## Executive Summary

This guide provides a **complete, step-by-step implementation plan** for converting OpenHands to use Claude Agent SDK with **Option A: Full Delegation** architecture.

### What is Option A?

**Option A: Full Delegation** means:
- ✅ **Delegate agent execution** to Claude Code's built-in agent loop
- ✅ **Remove custom agent loop** from OpenHands
- ✅ **Remove custom tool parsing** and execution logic
- ✅ **Simplify to orchestration layer** that coordinates Claude Code agents
- ✅ **Focus on domain logic** (SWE-bench, WebArena, etc.)

### Architectural Transformation

**Before (Current OpenHands):**
```
User Request
  ↓
AgentController (orchestrates)
  ↓
Agent.step() (custom loop: decide → call LLM → parse → execute)
  ↓
LLM.completion() (LiteLLM wrapper)
  ↓
litellm.completion() (provider abstraction)
  ↓
Claude API / OpenAI API / etc.
```

**After (Option A with Claude Agent SDK):**
```
User Request
  ↓
TaskOrchestrator (high-level coordination)
  ↓
ClaudeSDKClient.query() (single call does everything)
  ↓
Claude Code CLI (built-in: loop → tools → execute)
  ↓
Claude API
```

### Key Benefits

| Aspect | Current (LiteLLM) | Option A (Claude Agent SDK) |
|--------|------------------|---------------------------|
| **Code Complexity** | ~15,000 LOC for agent system | ~500 LOC orchestration layer |
| **Agent Loop** | Custom implementation | Built-in (Claude Code) |
| **Tool System** | Custom definitions + parsing | Built-in tools + custom MCP |
| **Runtime** | Separate sandbox management | Built-in sandbox |
| **Maintenance** | High (custom agent logic) | Low (use Claude Code) |
| **Performance** | Variable | Optimized (Claude Code) |
| **Focus** | Agent infrastructure | Domain logic + UX |

---

## Architecture Overview

### Core Components

#### 1. Task Orchestrator
**Role:** High-level task decomposition and coordination

**Responsibilities:**
- Receive user requests
- Break down complex tasks into subtasks
- Coordinate multiple Claude Code agents
- Aggregate results
- Handle errors and retries

**Does NOT:**
- ❌ Implement agent loop
- ❌ Parse tool calls
- ❌ Execute tools directly
- ❌ Manage conversation history (Claude Code does this)

#### 2. Agent Hub
**Role:** Manage multiple specialized agents working together

**Pattern:**
```
TaskOrchestrator
  ↓
AgentHub (coordinates)
  ├─→ CodeAgent (ClaudeSDKClient)
  ├─→ AnalysisAgent (ClaudeSDKClient)
  ├─→ TestingAgent (ClaudeSDKClient)
  └─→ BrowserAgent (ClaudeSDKClient + custom MCP)
```

**Key Insight:** Each agent is a `ClaudeSDKClient` instance with specific:
- System prompt
- Allowed tools
- Working directory
- Custom MCP servers (if needed)

#### 3. Custom MCP Servers
**Role:** Extend Claude Code with domain-specific tools

**Required for OpenHands:**
- **Jupyter/IPython MCP** - Python code execution
- **Browser MCP** - Web interaction (BrowserGym)
- **Task Tracking MCP** - Progress tracking (optional)

#### 4. Conversation Manager
**Role:** Handle multi-turn interactions with Claude Code

**Patterns:**
- Single-turn: Use `query()` function
- Multi-turn: Use `ClaudeSDKClient` with context retention
- Parallel: Multiple `ClaudeSDKClient` instances
- Sequential: Chain queries in same client

---

## Agent Hub Design

### Architecture Pattern: Hub-and-Spoke

The **Agent Hub** coordinates specialized agents, each optimized for specific tasks.

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from typing import Dict, List, Optional
import asyncio

class AgentHub:
    """
    Central hub for managing multiple specialized Claude Code agents.

    This replaces OpenHands' AgentController with a simplified orchestration layer.
    """

    def __init__(self, workspace: str, api_key: str):
        self.workspace = workspace
        self.api_key = api_key
        self.agents: Dict[str, ClaudeSDKClient] = {}
        self._setup_agents()

    def _setup_agents(self):
        """Initialize specialized agent configurations."""

        # Code Agent: File operations, editing, refactoring
        self.code_agent_options = ClaudeAgentOptions(
            allowed_tools=["Read", "Write", "Edit", "Glob", "Grep"],
            cwd=self.workspace,
            system_prompt=self._load_prompt("code_agent.txt"),
            permission_mode="acceptEdits",
            max_turns=50,
            model="claude-sonnet-4-5-20250929"
        )

        # Analysis Agent: Read-only code analysis
        self.analysis_agent_options = ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob"],
            cwd=self.workspace,
            system_prompt=self._load_prompt("analysis_agent.txt"),
            permission_mode="accept",
            max_turns=30,
            model="claude-sonnet-4-5-20250929"
        )

        # Testing Agent: Run tests, verify changes
        self.testing_agent_options = ClaudeAgentOptions(
            allowed_tools=["Read", "Bash"],
            cwd=self.workspace,
            system_prompt=self._load_prompt("testing_agent.txt"),
            permission_mode="accept",
            max_turns=20,
            model="claude-sonnet-4-5-20250929"
        )

        # Browser Agent: Web interactions (needs custom MCP)
        self.browser_agent_options = ClaudeAgentOptions(
            allowed_tools=["Read", "mcp__browser__navigate", "mcp__browser__interact"],
            cwd=self.workspace,
            system_prompt=self._load_prompt("browser_agent.txt"),
            mcp_servers={"browser": self._create_browser_mcp()},
            permission_mode="accept",
            max_turns=40,
            model="claude-sonnet-4-5-20250929"
        )

        # Python Execution Agent: Jupyter/IPython (needs custom MCP)
        self.python_agent_options = ClaudeAgentOptions(
            allowed_tools=["Read", "mcp__jupyter__execute", "mcp__jupyter__kernel_info"],
            cwd=self.workspace,
            system_prompt=self._load_prompt("python_agent.txt"),
            mcp_servers={"jupyter": self._create_jupyter_mcp()},
            permission_mode="accept",
            max_turns=30,
            model="claude-sonnet-4-5-20250929"
        )

    async def get_agent(self, agent_type: str) -> ClaudeSDKClient:
        """Get or create an agent instance."""
        if agent_type not in self.agents:
            options_map = {
                "code": self.code_agent_options,
                "analysis": self.analysis_agent_options,
                "testing": self.testing_agent_options,
                "browser": self.browser_agent_options,
                "python": self.python_agent_options
            }

            if agent_type not in options_map:
                raise ValueError(f"Unknown agent type: {agent_type}")

            client = ClaudeSDKClient(options=options_map[agent_type])
            await client.connect()
            self.agents[agent_type] = client

        return self.agents[agent_type]

    async def cleanup(self):
        """Cleanup all agent connections."""
        for client in self.agents.values():
            await client.disconnect()
        self.agents.clear()

    def _load_prompt(self, filename: str) -> str:
        """Load system prompt from file."""
        # Load from prompts/ directory
        pass

    def _create_browser_mcp(self):
        """Create Browser MCP server (see MCP section)."""
        pass

    def _create_jupyter_mcp(self):
        """Create Jupyter MCP server (see MCP section)."""
        pass


# Usage example
async def main():
    hub = AgentHub(workspace="/path/to/project", api_key="sk-...")

    try:
        # Get code agent
        code_agent = await hub.get_agent("code")

        # Get analysis agent
        analysis_agent = await hub.get_agent("analysis")

        # Parallel execution
        await asyncio.gather(
            code_agent.query("Refactor the authentication module"),
            analysis_agent.query("Analyze security vulnerabilities")
        )

        # Collect results
        code_results = []
        async for msg in code_agent.receive_response():
            code_results.append(msg)

        analysis_results = []
        async for msg in analysis_agent.receive_response():
            analysis_results.append(msg)

    finally:
        await hub.cleanup()
```

### Agent Specialization Strategy

| Agent Type | Tools | Use Case | System Prompt Focus |
|-----------|-------|----------|-------------------|
| **CodeAgent** | Read, Write, Edit, Bash | Implementation, refactoring | "You are an expert software engineer..." |
| **AnalysisAgent** | Read, Grep, Glob | Code review, security analysis | "You are a code analyst focusing on..." |
| **TestingAgent** | Read, Bash | Test execution, verification | "You run tests and verify changes..." |
| **BrowserAgent** | Read, browser MCP | Web testing, scraping | "You interact with web applications..." |
| **PythonAgent** | Read, jupyter MCP | Data analysis, scripts | "You execute Python code for analysis..." |

### Why Multiple Agents?

1. **Separation of Concerns:** Each agent has clear responsibility
2. **Parallel Execution:** Run analysis while implementing
3. **Context Management:** Each agent maintains focused context
4. **Permission Control:** Different permission levels per agent
5. **Tool Optimization:** Each agent has only needed tools

---

## Main Agent Conversation Patterns

### Pattern 1: Single-Turn Query (Simple Tasks)

**Use When:** Task is self-contained and doesn't need follow-up

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async def simple_task_execution():
    """Execute simple task with single query."""

    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Grep"],
        cwd="/path/to/project",
        system_prompt="You are a code analyzer"
    )

    # Single query, new session each time
    async for message in query(
        prompt="Find all TODO comments in the codebase",
        options=options
    ):
        # Process streaming messages
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(f"Assistant: {block.text}")

        elif isinstance(message, ToolUseBlock):
            print(f"Using tool: {message.name}")

        elif isinstance(message, ResultMessage):
            print("Task complete!")
            break
```

**Pros:**
- ✅ Simple, clean code
- ✅ No connection management
- ✅ Automatic cleanup

**Cons:**
- ⚠️ No context retention between calls
- ⚠️ Can't do follow-up questions

### Pattern 2: Multi-Turn Conversation (Complex Tasks)

**Use When:** Task requires back-and-forth or iterative refinement

```python
async def multi_turn_implementation():
    """Implement feature with multiple conversation turns."""

    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Write", "Edit", "Bash"],
        cwd="/path/to/project",
        permission_mode="acceptEdits",
        max_turns=50
    )

    async with ClaudeSDKClient(options=options) as client:
        # Turn 1: Understand codebase
        await client.query("""
        Analyze the authentication system in this codebase.
        Focus on how users currently log in and what files are involved.
        """)

        analysis_result = ""
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        analysis_result += block.text

        print(f"Analysis: {analysis_result}")

        # Turn 2: Implement (remembers context from turn 1)
        await client.query("""
        Based on your analysis, implement OAuth2 authentication.
        Create new files as needed and update existing ones.
        """)

        async for msg in client.receive_response():
            if isinstance(msg, ResultMessage):
                print("Implementation complete!")
                break

        # Turn 3: Verify (remembers everything)
        await client.query("""
        Review your changes. Do they correctly implement OAuth2?
        Check for security issues.
        """)

        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        print(f"Review: {block.text}")
```

**Pros:**
- ✅ Context retained across turns
- ✅ Natural conversation flow
- ✅ Iterative refinement

**Cons:**
- ⚠️ Token usage grows with turns
- ⚠️ Need connection management

### Pattern 3: Parallel Agent Execution (Independent Tasks)

**Use When:** Multiple independent tasks can run simultaneously

```python
async def parallel_task_execution():
    """Execute multiple independent tasks in parallel."""

    # Setup options for different agents
    analysis_options = ClaudeAgentOptions(
        allowed_tools=["Read", "Grep"],
        cwd="/path/to/project",
        system_prompt="You analyze code for security issues"
    )

    refactor_options = ClaudeAgentOptions(
        allowed_tools=["Read", "Edit"],
        cwd="/path/to/project",
        system_prompt="You refactor code for better quality"
    )

    async def security_analysis():
        """Run security analysis."""
        results = []
        async for msg in query(
            prompt="Analyze for SQL injection vulnerabilities",
            options=analysis_options
        ):
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        results.append(block.text)
        return "\n".join(results)

    async def code_refactoring():
        """Run refactoring."""
        results = []
        async for msg in query(
            prompt="Refactor database access layer for consistency",
            options=refactor_options
        ):
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        results.append(block.text)
        return "\n".join(results)

    # Execute in parallel
    security_result, refactor_result = await asyncio.gather(
        security_analysis(),
        code_refactoring()
    )

    print("Security Analysis:", security_result)
    print("Refactoring:", refactor_result)
```

**Pros:**
- ✅ Faster execution (parallel)
- ✅ Independent contexts
- ✅ Resource efficient

**Cons:**
- ⚠️ Tasks must be independent
- ⚠️ No communication between agents

### Pattern 4: Sequential Orchestration (Dependent Tasks)

**Use When:** Tasks depend on previous results

```python
async def sequential_orchestration():
    """Orchestrate sequential dependent tasks."""

    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Write", "Edit", "Bash"],
        cwd="/path/to/project",
        permission_mode="acceptEdits"
    )

    async with ClaudeSDKClient(options=options) as client:
        # Phase 1: Gather context
        print("Phase 1: Gathering context...")
        await client.query("Read the main application file and understand its structure")

        context = []
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        context.append(block.text)

        # Phase 2: Design solution (uses context from Phase 1)
        print("Phase 2: Designing solution...")
        await client.query("""
        Based on what you learned, design a solution for adding rate limiting.
        Explain your approach before implementing.
        """)

        design = []
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        design.append(block.text)

        print(f"Design: {design}")

        # Phase 3: Implement (uses design from Phase 2)
        print("Phase 3: Implementing...")
        await client.query("Now implement the rate limiting as you designed")

        async for msg in client.receive_response():
            if isinstance(msg, ResultMessage):
                print("Implementation complete!")
                break

        # Phase 4: Test (uses implementation from Phase 3)
        print("Phase 4: Testing...")
        await client.query("Run tests to verify rate limiting works correctly")

        test_results = []
        async for msg in client.receive_response():
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        test_results.append(block.text)

        print(f"Test Results: {test_results}")
```

**Pros:**
- ✅ Clear phase separation
- ✅ Context flows between phases
- ✅ Easy to debug

**Cons:**
- ⚠️ Sequential (slower)
- ⚠️ One failure stops pipeline

### Pattern 5: Feedback Loop (Iterative Improvement)

**Use When:** Task requires iterative refinement until criteria met

```python
async def feedback_loop_execution():
    """Implement feedback loop pattern for iterative improvement."""

    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Write", "Edit", "Bash"],
        cwd="/path/to/project",
        permission_mode="acceptEdits",
        max_turns=100
    )

    async with ClaudeSDKClient(options=options) as client:
        max_iterations = 5
        success = False

        for iteration in range(max_iterations):
            print(f"\n=== Iteration {iteration + 1} ===")

            # Step 1: Take action
            if iteration == 0:
                await client.query("Implement user registration endpoint with validation")
            else:
                await client.query("Fix the issues identified in the previous test run")

            async for msg in client.receive_response():
                if isinstance(msg, ResultMessage):
                    break

            # Step 2: Verify work
            await client.query("Run the test suite and analyze failures")

            test_output = []
            async for msg in client.receive_response():
                if isinstance(msg, AssistantMessage):
                    for block in msg.content:
                        if isinstance(block, TextBlock):
                            test_output.append(block.text)

            # Step 3: Check if complete
            if "all tests passed" in "\n".join(test_output).lower():
                print("✅ All tests passed!")
                success = True
                break
            else:
                print(f"⚠️ Tests failed, retrying... ({iteration + 1}/{max_iterations})")

        if not success:
            print("❌ Failed to pass tests after maximum iterations")
```

**Pros:**
- ✅ Automatic error correction
- ✅ Iterative improvement
- ✅ Robust execution

**Cons:**
- ⚠️ Can be slow (multiple iterations)
- ⚠️ Token usage grows

---

## Step-by-Step Implementation

### Phase 1: Environment Setup (Day 1)

#### Step 1.1: Install Dependencies

```bash
# Install Node.js (required for Claude Code CLI)
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Verify installation
node --version  # Should be v16+
npm --version
```

#### Step 1.2: Install Claude Code CLI

```bash
# Install globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude-code --version  # Should be 2.0.0+

# Test it works
export ANTHROPIC_API_KEY="your-api-key"
claude-code --help
```

#### Step 1.3: Install Claude Agent SDK

```bash
# Create Python virtual environment
cd /path/to/openhands
python3 -m venv venv-claude-sdk
source venv-claude-sdk/bin/activate

# Install Claude Agent SDK
pip install claude-agent-sdk

# Verify installation
python -c "from claude_agent_sdk import query, ClaudeSDKClient; print('✅ SDK installed')"
```

#### Step 1.4: Create Test Project

```bash
# Create test directory
mkdir -p openhands_claude_sdk_test
cd openhands_claude_sdk_test

# Create simple test files
cat > test_file.txt << 'EOF'
This is a test file for Claude Agent SDK.
TODO: Implement feature X
TODO: Fix bug Y
EOF

cat > simple_script.py << 'EOF'
def hello():
    print("Hello from Claude Agent SDK")

if __name__ == "__main__":
    hello()
EOF
```

#### Step 1.5: Write POC Script

```python
# File: poc_simple_query.py

import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    """Simple POC: Use Claude Code to find TODO comments."""

    print("🔍 Starting simple query POC...")

    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Grep"],
        cwd=".",
        system_prompt="You are a code analyzer"
    )

    async for message in query(
        prompt="Find all TODO comments in this directory",
        options=options
    ):
        print(f"📨 Message: {message}")

    print("✅ POC complete!")

if __name__ == "__main__":
    asyncio.run(main())
```

```bash
# Run POC
python poc_simple_query.py
```

**Expected Output:**
- Claude Code reads files
- Finds TODO comments
- Returns results
- Automatic cleanup

**Success Criteria:**
- ✅ Script runs without errors
- ✅ Claude finds TODO comments
- ✅ Tool usage visible in output

---

### Phase 2: Custom MCP Tools (Days 2-4)

#### Step 2.1: Design Jupyter MCP Tool

**Requirements:**
- Execute Python code in Jupyter kernel
- Capture stdout, stderr, and return values
- Handle kernel lifecycle
- Support multiple kernels

**Architecture:**
```python
from claude_agent_sdk import tool, create_sdk_mcp_server
import jupyter_client
import asyncio
from typing import Dict, Optional

class JupyterKernelManager:
    """Manage Jupyter kernels for code execution."""

    def __init__(self):
        self.kernels: Dict[str, jupyter_client.KernelClient] = {}
        self.default_kernel_id = "default"

    async def get_or_create_kernel(self, kernel_id: Optional[str] = None) -> jupyter_client.KernelClient:
        """Get existing kernel or create new one."""
        kid = kernel_id or self.default_kernel_id

        if kid not in self.kernels:
            # Start new kernel
            km = jupyter_client.KernelManager()
            km.start_kernel()
            kc = km.client()
            kc.start_channels()

            # Wait for kernel to be ready
            await asyncio.sleep(2)

            self.kernels[kid] = kc

        return self.kernels[kid]

    async def execute_code(self, code: str, kernel_id: Optional[str] = None) -> Dict:
        """Execute code in kernel and return results."""
        kc = await self.get_or_create_kernel(kernel_id)

        # Execute code
        msg_id = kc.execute(code)

        # Collect outputs
        outputs = []
        errors = []

        while True:
            try:
                msg = kc.get_iopub_msg(timeout=10)
                msg_type = msg['header']['msg_type']

                if msg_type == 'stream':
                    outputs.append(msg['content']['text'])

                elif msg_type == 'execute_result':
                    outputs.append(msg['content']['data'].get('text/plain', ''))

                elif msg_type == 'error':
                    errors.append('\n'.join(msg['content']['traceback']))

                elif msg_type == 'status':
                    if msg['content']['execution_state'] == 'idle':
                        break

            except Exception as e:
                break

        return {
            "stdout": '\n'.join(outputs),
            "stderr": '\n'.join(errors),
            "success": len(errors) == 0
        }

    def cleanup(self):
        """Cleanup all kernels."""
        for kc in self.kernels.values():
            kc.stop_channels()
        self.kernels.clear()


# Global kernel manager
_kernel_manager = JupyterKernelManager()


@tool(
    "execute_python",
    "Execute Python code in a Jupyter kernel and return the output",
    {
        "code": {
            "type": "string",
            "description": "Python code to execute"
        },
        "kernel_id": {
            "type": "string",
            "description": "Optional kernel ID to use (default: 'default')",
            "optional": True
        }
    }
)
async def execute_python(args):
    """Execute Python code in Jupyter kernel."""
    code = args.get("code", "")
    kernel_id = args.get("kernel_id")

    if not code:
        return {
            "content": [{
                "type": "text",
                "text": "Error: No code provided"
            }],
            "isError": True
        }

    try:
        result = await _kernel_manager.execute_code(code, kernel_id)

        output_text = f"""
Execution {'succeeded' if result['success'] else 'failed'}:

Output:
{result['stdout'] or '(no output)'}

Errors:
{result['stderr'] or '(no errors)'}
""".strip()

        return {
            "content": [{
                "type": "text",
                "text": output_text
            }],
            "isError": not result['success']
        }

    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Error executing code: {str(e)}"
            }],
            "isError": True
        }


@tool(
    "kernel_info",
    "Get information about available Jupyter kernels",
    {}
)
async def kernel_info(args):
    """Get kernel information."""
    kernel_ids = list(_kernel_manager.kernels.keys())

    info_text = f"""
Active Kernels: {len(kernel_ids)}
Kernel IDs: {', '.join(kernel_ids) if kernel_ids else 'None'}
"""

    return {
        "content": [{
            "type": "text",
            "text": info_text.strip()
        }]
    }


# Create MCP server
def create_jupyter_mcp_server():
    """Create Jupyter MCP server with all tools."""
    return create_sdk_mcp_server(
        name="jupyter",
        version="1.0.0",
        tools=[execute_python, kernel_info]
    )
```

**File:** `openhands/mcp_servers/jupyter_mcp.py`

#### Step 2.2: Design Browser MCP Tool

**Requirements:**
- Navigate to URLs
- Extract page content
- Perform interactions (click, type, etc.)
- Take screenshots
- Support BrowserGym integration

**Architecture:**
```python
from claude_agent_sdk import tool, create_sdk_mcp_server
from playwright.async_api import async_playwright, Browser, Page
from typing import Optional, Dict
import asyncio
import base64

class BrowserManager:
    """Manage browser instances for web interactions."""

    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.pages: Dict[str, Page] = {}
        self.default_page_id = "default"

    async def initialize(self):
        """Initialize Playwright browser."""
        if self.browser is None:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=True)

    async def get_or_create_page(self, page_id: Optional[str] = None) -> Page:
        """Get existing page or create new one."""
        await self.initialize()

        pid = page_id or self.default_page_id

        if pid not in self.pages:
            self.pages[pid] = await self.browser.new_page()

        return self.pages[pid]

    async def cleanup(self):
        """Cleanup browser resources."""
        for page in self.pages.values():
            await page.close()

        if self.browser:
            await self.browser.close()

        if self.playwright:
            await self.playwright.stop()


# Global browser manager
_browser_manager = BrowserManager()


@tool(
    "navigate",
    "Navigate to a URL in the browser",
    {
        "url": {
            "type": "string",
            "description": "URL to navigate to"
        },
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        }
    }
)
async def navigate(args):
    """Navigate to URL."""
    url = args.get("url", "")
    page_id = args.get("page_id")

    if not url:
        return {
            "content": [{"type": "text", "text": "Error: No URL provided"}],
            "isError": True
        }

    try:
        page = await _browser_manager.get_or_create_page(page_id)
        response = await page.goto(url, wait_until="networkidle")

        title = await page.title()
        content_preview = await page.content()
        content_preview = content_preview[:500] + "..." if len(content_preview) > 500 else content_preview

        return {
            "content": [{
                "type": "text",
                "text": f"Navigated to: {url}\nTitle: {title}\nStatus: {response.status}\n\nContent Preview:\n{content_preview}"
            }]
        }

    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Navigation error: {str(e)}"}],
            "isError": True
        }


@tool(
    "interact",
    "Interact with page elements (click, type, etc.)",
    {
        "action": {
            "type": "string",
            "description": "Action to perform: 'click', 'type', 'select'"
        },
        "selector": {
            "type": "string",
            "description": "CSS selector for element"
        },
        "value": {
            "type": "string",
            "description": "Value for 'type' or 'select' actions",
            "optional": True
        },
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        }
    }
)
async def interact(args):
    """Interact with page elements."""
    action = args.get("action", "")
    selector = args.get("selector", "")
    value = args.get("value", "")
    page_id = args.get("page_id")

    if not action or not selector:
        return {
            "content": [{"type": "text", "text": "Error: Missing action or selector"}],
            "isError": True
        }

    try:
        page = await _browser_manager.get_or_create_page(page_id)

        if action == "click":
            await page.click(selector)
            result = f"Clicked on: {selector}"

        elif action == "type":
            await page.fill(selector, value)
            result = f"Typed '{value}' into: {selector}"

        elif action == "select":
            await page.select_option(selector, value)
            result = f"Selected '{value}' in: {selector}"

        else:
            return {
                "content": [{"type": "text", "text": f"Unknown action: {action}"}],
                "isError": True
            }

        return {
            "content": [{"type": "text", "text": result}]
        }

    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Interaction error: {str(e)}"}],
            "isError": True
        }


@tool(
    "screenshot",
    "Take a screenshot of the current page",
    {
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        }
    }
)
async def screenshot(args):
    """Take screenshot of page."""
    page_id = args.get("page_id")

    try:
        page = await _browser_manager.get_or_create_page(page_id)
        screenshot_bytes = await page.screenshot()
        screenshot_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')

        return {
            "content": [{
                "type": "image",
                "data": screenshot_b64,
                "mimeType": "image/png"
            }]
        }

    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Screenshot error: {str(e)}"}],
            "isError": True
        }


@tool(
    "extract_content",
    "Extract text content from the page",
    {
        "selector": {
            "type": "string",
            "description": "Optional CSS selector to extract specific element (default: entire page)",
            "optional": True
        },
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        }
    }
)
async def extract_content(args):
    """Extract text content from page."""
    selector = args.get("selector")
    page_id = args.get("page_id")

    try:
        page = await _browser_manager.get_or_create_page(page_id)

        if selector:
            element = await page.query_selector(selector)
            if element:
                content = await element.inner_text()
            else:
                return {
                    "content": [{"type": "text", "text": f"Element not found: {selector}"}],
                    "isError": True
                }
        else:
            content = await page.inner_text("body")

        return {
            "content": [{
                "type": "text",
                "text": f"Extracted Content:\n\n{content}"
            }]
        }

    except Exception as e:
        return {
            "content": [{"type": "text", "text": f"Content extraction error: {str(e)}"}],
            "isError": True
        }


# Create MCP server
def create_browser_mcp_server():
    """Create Browser MCP server with all tools."""
    return create_sdk_mcp_server(
        name="browser",
        version="1.0.0",
        tools=[navigate, interact, screenshot, extract_content]
    )
```

**File:** `openhands/mcp_servers/browser_mcp.py`

#### Step 2.3: Test Custom MCP Tools

```python
# File: test_custom_mcps.py

import asyncio
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server
from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

async def test_jupyter_mcp():
    """Test Jupyter MCP tool."""
    print("\n=== Testing Jupyter MCP ===")

    jupyter_server = create_jupyter_mcp_server()

    options = ClaudeAgentOptions(
        allowed_tools=["mcp__jupyter__execute_python", "mcp__jupyter__kernel_info"],
        mcp_servers={"jupyter": jupyter_server},
        cwd=".",
        system_prompt="You execute Python code for data analysis"
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query("""
        Execute this Python code:

        import numpy as np
        data = np.array([1, 2, 3, 4, 5])
        print(f"Mean: {data.mean()}")
        print(f"Sum: {data.sum()}")
        """)

        async for msg in client.receive_response():
            print(f"Response: {msg}")

async def test_browser_mcp():
    """Test Browser MCP tool."""
    print("\n=== Testing Browser MCP ===")

    browser_server = create_browser_mcp_server()

    options = ClaudeAgentOptions(
        allowed_tools=[
            "mcp__browser__navigate",
            "mcp__browser__interact",
            "mcp__browser__extract_content"
        ],
        mcp_servers={"browser": browser_server},
        cwd=".",
        system_prompt="You interact with web pages"
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query("""
        Navigate to https://example.com and extract the main heading text.
        """)

        async for msg in client.receive_response():
            print(f"Response: {msg}")

async def main():
    await test_jupyter_mcp()
    await test_browser_mcp()

if __name__ == "__main__":
    asyncio.run(main())
```

**Run tests:**
```bash
python test_custom_mcps.py
```

**Success Criteria:**
- ✅ Jupyter executes Python code
- ✅ Browser navigates to URL
- ✅ Content extraction works
- ✅ No errors in tool execution

---

### Phase 3: Agent Hub Implementation (Days 5-7)

#### Step 3.1: Create System Prompts

Create specialized prompts for each agent type.

**File:** `openhands/prompts/code_agent.txt`
```
You are an expert software engineer specializing in writing, editing, and refactoring code.

Your capabilities:
- Read files to understand existing code
- Write new files when needed
- Edit existing files using precise string replacements
- Search for code patterns using grep
- Find files using glob patterns

Your approach:
1. Always read files before editing to understand context
2. Make precise, targeted edits
3. Preserve existing code style and conventions
4. Write clean, well-documented code
5. Consider edge cases and error handling

When implementing features:
- Break down complex tasks into smaller steps
- Test your changes as you go
- Document your reasoning
- Ask for clarification if requirements are ambiguous

You work in the Claude Code environment with full file system access.
```

**File:** `openhands/prompts/analysis_agent.txt`
```
You are a code analyst specializing in understanding codebases and identifying issues.

Your capabilities:
- Read files to understand code structure
- Search for patterns using grep
- Find files using glob patterns
- Analyze code for bugs, security issues, and quality problems

Your approach:
1. Start with high-level structure (directories, main files)
2. Understand the architecture and design patterns
3. Look for security vulnerabilities (SQL injection, XSS, etc.)
4. Identify code quality issues (duplication, complexity)
5. Provide actionable recommendations

You are read-only - you analyze but do not modify code.
Focus on thorough, systematic analysis.
```

**File:** `openhands/prompts/testing_agent.txt`
```
You are a testing specialist who runs tests and verifies code changes.

Your capabilities:
- Read test files and test configurations
- Execute test commands using bash
- Analyze test output and failures
- Identify what tests are failing and why

Your approach:
1. Find and understand the test setup (pytest, unittest, jest, etc.)
2. Run the full test suite
3. Analyze failures in detail
4. Identify patterns in failures
5. Suggest specific fixes for failing tests

When running tests:
- Always capture full output
- Run tests multiple times if flaky
- Check for test dependencies
- Verify test environment is correct

You verify that code changes work as expected.
```

**File:** `openhands/prompts/browser_agent.txt`
```
You are a web interaction specialist using browser automation tools.

Your capabilities:
- Navigate to URLs
- Extract page content
- Interact with page elements (click, type, select)
- Take screenshots
- Verify web application behavior

Your approach:
1. Navigate to the target URL
2. Wait for page to fully load
3. Extract relevant content
4. Perform requested interactions
5. Verify results

When interacting with web pages:
- Use specific CSS selectors
- Wait for elements to be visible
- Handle dynamic content
- Take screenshots for verification
- Extract structured data when possible

You work with web applications through browser automation.
```

**File:** `openhands/prompts/python_agent.txt`
```
You are a Python execution specialist using Jupyter kernels for code execution.

Your capabilities:
- Execute Python code
- Perform data analysis
- Generate visualizations
- Test code snippets
- Debug Python errors

Your approach:
1. Understand the task requirements
2. Write clean, executable Python code
3. Execute and capture output
4. Analyze results
5. Iterate if needed

When executing code:
- Import necessary libraries
- Handle errors gracefully
- Print intermediate results
- Use meaningful variable names
- Document complex operations

You execute Python code in an interactive Jupyter environment.
```

#### Step 3.2: Implement Complete Agent Hub

```python
# File: openhands/agent_hub/hub.py

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from typing import Dict, List, Optional, Callable
import asyncio
import logging
from pathlib import Path

from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server
from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

logger = logging.getLogger(__name__)


class AgentConfig:
    """Configuration for a specialized agent."""

    def __init__(
        self,
        agent_type: str,
        allowed_tools: List[str],
        system_prompt: str,
        mcp_servers: Optional[Dict] = None,
        permission_mode: str = "accept",
        max_turns: int = 50,
        model: str = "claude-sonnet-4-5-20250929"
    ):
        self.agent_type = agent_type
        self.allowed_tools = allowed_tools
        self.system_prompt = system_prompt
        self.mcp_servers = mcp_servers or {}
        self.permission_mode = permission_mode
        self.max_turns = max_turns
        self.model = model


class AgentHub:
    """
    Central hub for managing multiple specialized Claude Code agents.

    This replaces OpenHands' AgentController with a simplified orchestration layer
    that delegates execution to Claude Code agents.
    """

    def __init__(
        self,
        workspace: str,
        api_key: str,
        prompts_dir: Optional[str] = None
    ):
        self.workspace = Path(workspace).resolve()
        self.api_key = api_key
        self.prompts_dir = Path(prompts_dir) if prompts_dir else Path(__file__).parent.parent / "prompts"

        # Active agent clients
        self.agents: Dict[str, ClaudeSDKClient] = {}

        # Agent configurations
        self.configs: Dict[str, AgentConfig] = {}

        # Initialize MCP servers (shared across agents)
        self.jupyter_mcp = create_jupyter_mcp_server()
        self.browser_mcp = create_browser_mcp_server()

        # Setup agent configurations
        self._setup_agent_configs()

        logger.info(f"AgentHub initialized with workspace: {self.workspace}")

    def _load_prompt(self, filename: str) -> str:
        """Load system prompt from file."""
        prompt_path = self.prompts_dir / filename

        if not prompt_path.exists():
            logger.warning(f"Prompt file not found: {prompt_path}, using default")
            return f"You are a helpful AI assistant for {filename.replace('.txt', '')} tasks."

        return prompt_path.read_text()

    def _setup_agent_configs(self):
        """Initialize configurations for all specialized agents."""

        # Code Agent: Full editing capabilities
        self.configs["code"] = AgentConfig(
            agent_type="code",
            allowed_tools=["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
            system_prompt=self._load_prompt("code_agent.txt"),
            permission_mode="acceptEdits",
            max_turns=50
        )

        # Analysis Agent: Read-only analysis
        self.configs["analysis"] = AgentConfig(
            agent_type="analysis",
            allowed_tools=["Read", "Grep", "Glob"],
            system_prompt=self._load_prompt("analysis_agent.txt"),
            permission_mode="accept",
            max_turns=30
        )

        # Testing Agent: Run tests
        self.configs["testing"] = AgentConfig(
            agent_type="testing",
            allowed_tools=["Read", "Bash"],
            system_prompt=self._load_prompt("testing_agent.txt"),
            permission_mode="accept",
            max_turns=20
        )

        # Browser Agent: Web interactions
        self.configs["browser"] = AgentConfig(
            agent_type="browser",
            allowed_tools=[
                "Read",
                "mcp__browser__navigate",
                "mcp__browser__interact",
                "mcp__browser__extract_content",
                "mcp__browser__screenshot"
            ],
            system_prompt=self._load_prompt("browser_agent.txt"),
            mcp_servers={"browser": self.browser_mcp},
            permission_mode="accept",
            max_turns=40
        )

        # Python Agent: Code execution
        self.configs["python"] = AgentConfig(
            agent_type="python",
            allowed_tools=[
                "Read",
                "mcp__jupyter__execute_python",
                "mcp__jupyter__kernel_info"
            ],
            system_prompt=self._load_prompt("python_agent.txt"),
            mcp_servers={"jupyter": self.jupyter_mcp},
            permission_mode="accept",
            max_turns=30
        )

    async def get_agent(self, agent_type: str) -> ClaudeSDKClient:
        """
        Get or create an agent instance.

        Args:
            agent_type: Type of agent (code, analysis, testing, browser, python)

        Returns:
            Connected ClaudeSDKClient instance
        """
        if agent_type not in self.configs:
            raise ValueError(f"Unknown agent type: {agent_type}. "
                           f"Available: {list(self.configs.keys())}")

        # Return existing agent if already created
        if agent_type in self.agents:
            return self.agents[agent_type]

        # Create new agent
        config = self.configs[agent_type]

        options = ClaudeAgentOptions(
            allowed_tools=config.allowed_tools,
            system_prompt=config.system_prompt,
            mcp_servers=config.mcp_servers,
            permission_mode=config.permission_mode,
            cwd=str(self.workspace),
            max_turns=config.max_turns,
            model=config.model
        )

        client = ClaudeSDKClient(options=options)
        await client.connect()

        self.agents[agent_type] = client
        logger.info(f"Created and connected {agent_type} agent")

        return client

    async def execute_task(
        self,
        agent_type: str,
        task: str,
        callback: Optional[Callable] = None
    ) -> List:
        """
        Execute a task with specified agent.

        Args:
            agent_type: Type of agent to use
            task: Task description/prompt
            callback: Optional callback for streaming messages

        Returns:
            List of messages from agent
        """
        agent = await self.get_agent(agent_type)

        logger.info(f"Executing task with {agent_type} agent: {task[:100]}...")

        await agent.query(task)

        messages = []
        async for msg in agent.receive_response():
            messages.append(msg)

            if callback:
                await callback(msg)

        logger.info(f"Task complete, received {len(messages)} messages")

        return messages

    async def parallel_execute(
        self,
        tasks: List[tuple]  # [(agent_type, task_description), ...]
    ) -> Dict[str, List]:
        """
        Execute multiple tasks in parallel.

        Args:
            tasks: List of (agent_type, task_description) tuples

        Returns:
            Dictionary mapping agent_type to results
        """
        logger.info(f"Executing {len(tasks)} tasks in parallel")

        async def run_task(agent_type, task_desc):
            return agent_type, await self.execute_task(agent_type, task_desc)

        results_list = await asyncio.gather(*[
            run_task(agent_type, task_desc)
            for agent_type, task_desc in tasks
        ])

        return dict(results_list)

    async def cleanup(self):
        """Cleanup all agent connections and resources."""
        logger.info("Cleaning up AgentHub...")

        for agent_type, client in self.agents.items():
            try:
                await client.disconnect()
                logger.info(f"Disconnected {agent_type} agent")
            except Exception as e:
                logger.error(f"Error disconnecting {agent_type} agent: {e}")

        self.agents.clear()

        # Cleanup MCP servers if they have cleanup methods
        # (Add cleanup logic for Jupyter kernels, browser instances, etc.)

        logger.info("AgentHub cleanup complete")

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.cleanup()
```

**File:** `openhands/agent_hub/__init__.py`
```python
from .hub import AgentHub, AgentConfig

__all__ = ["AgentHub", "AgentConfig"]
```

#### Step 3.3: Test Agent Hub

```python
# File: test_agent_hub.py

import asyncio
import logging
from openhands.agent_hub import AgentHub

logging.basicConfig(level=logging.INFO)

async def test_single_agent():
    """Test single agent execution."""
    print("\n=== Test: Single Agent ===")

    async with AgentHub(workspace=".", api_key="your-api-key") as hub:
        # Use analysis agent to find TODO comments
        results = await hub.execute_task(
            agent_type="analysis",
            task="Find all TODO comments in this codebase and categorize them by priority"
        )

        print(f"Received {len(results)} messages")
        for msg in results:
            print(msg)

async def test_parallel_agents():
    """Test parallel agent execution."""
    print("\n=== Test: Parallel Agents ===")

    async with AgentHub(workspace=".", api_key="your-api-key") as hub:
        # Run analysis and code review in parallel
        results = await hub.parallel_execute([
            ("analysis", "Analyze the codebase structure and architecture"),
            ("testing", "Run all tests and report results")
        ])

        print(f"Analysis results: {len(results['analysis'])} messages")
        print(f"Testing results: {len(results['testing'])} messages")

async def test_sequential_workflow():
    """Test sequential multi-agent workflow."""
    print("\n=== Test: Sequential Workflow ===")

    async with AgentHub(workspace=".", api_key="your-api-key") as hub:
        # Step 1: Analyze
        print("Step 1: Analysis...")
        analysis_results = await hub.execute_task(
            agent_type="analysis",
            task="Analyze the authentication module for security issues"
        )

        # Step 2: Implement fixes
        print("Step 2: Implementation...")
        code_results = await hub.execute_task(
            agent_type="code",
            task="Based on security analysis, fix any SQL injection vulnerabilities"
        )

        # Step 3: Test
        print("Step 3: Testing...")
        test_results = await hub.execute_task(
            agent_type="testing",
            task="Run security tests to verify fixes"
        )

        print("✅ Sequential workflow complete")

async def main():
    await test_single_agent()
    # await test_parallel_agents()
    # await test_sequential_workflow()

if __name__ == "__main__":
    asyncio.run(main())
```

---

### Phase 4: Task Orchestrator (Days 8-10)

The **Task Orchestrator** is the high-level coordinator that replaces much of OpenHands' AgentController.

#### Step 4.1: Design Task Orchestrator

```python
# File: openhands/orchestrator/task_orchestrator.py

from typing import Dict, List, Optional, Callable
import asyncio
import logging
from enum import Enum
from dataclasses import dataclass
from pathlib import Path

from openhands.agent_hub import AgentHub

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """Task execution status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class TaskResult:
    """Result of task execution."""
    task_id: str
    status: TaskStatus
    messages: List
    error: Optional[str] = None
    metadata: Dict = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class TaskOrchestrator:
    """
    High-level task orchestration layer for OpenHands.

    This replaces the complex AgentController with a simplified coordination
    layer that delegates execution to Claude Code agents via AgentHub.

    Responsibilities:
    - Decompose high-level tasks into subtasks
    - Coordinate multiple agents
    - Handle errors and retries
    - Aggregate results
    - Provide progress callbacks
    """

    def __init__(
        self,
        workspace: str,
        api_key: str,
        max_retries: int = 3,
        progress_callback: Optional[Callable] = None
    ):
        self.workspace = Path(workspace).resolve()
        self.api_key = api_key
        self.max_retries = max_retries
        self.progress_callback = progress_callback

        # Initialize agent hub
        self.hub = AgentHub(
            workspace=str(self.workspace),
            api_key=self.api_key
        )

        # Task tracking
        self.tasks: Dict[str, TaskResult] = {}
        self.task_counter = 0

        logger.info(f"TaskOrchestrator initialized for workspace: {self.workspace}")

    def _generate_task_id(self) -> str:
        """Generate unique task ID."""
        self.task_counter += 1
        return f"task_{self.task_counter}"

    async def _report_progress(self, message: str, metadata: Dict = None):
        """Report progress to callback if provided."""
        if self.progress_callback:
            await self.progress_callback(message, metadata or {})

    async def execute_simple_task(
        self,
        agent_type: str,
        task_description: str
    ) -> TaskResult:
        """
        Execute a simple single-agent task.

        Args:
            agent_type: Agent to use (code, analysis, testing, etc.)
            task_description: Task prompt

        Returns:
            TaskResult with execution results
        """
        task_id = self._generate_task_id()

        await self._report_progress(
            f"Starting task {task_id} with {agent_type} agent",
            {"task_id": task_id, "agent_type": agent_type}
        )

        result = TaskResult(
            task_id=task_id,
            status=TaskStatus.IN_PROGRESS,
            messages=[]
        )

        try:
            messages = await self.hub.execute_task(
                agent_type=agent_type,
                task=task_description,
                callback=self._report_progress
            )

            result.messages = messages
            result.status = TaskStatus.COMPLETED

            await self._report_progress(
                f"Task {task_id} completed successfully",
                {"task_id": task_id}
            )

        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            result.status = TaskStatus.FAILED
            result.error = str(e)

            await self._report_progress(
                f"Task {task_id} failed: {e}",
                {"task_id": task_id, "error": str(e)}
            )

        self.tasks[task_id] = result
        return result

    async def execute_github_issue_workflow(
        self,
        issue_title: str,
        issue_body: str,
        repo_path: str
    ) -> TaskResult:
        """
        Execute complete GitHub issue resolution workflow.

        This is a high-level orchestration pattern for solving GitHub issues,
        similar to OpenHands' SWE-bench workflow.

        Workflow:
        1. Analyze issue and codebase
        2. Design solution
        3. Implement changes
        4. Run tests
        5. Verify solution

        Args:
            issue_title: GitHub issue title
            issue_body: GitHub issue description
            repo_path: Path to repository

        Returns:
            TaskResult with complete workflow results
        """
        task_id = self._generate_task_id()
        workflow_result = TaskResult(
            task_id=task_id,
            status=TaskStatus.IN_PROGRESS,
            messages=[],
            metadata={
                "issue_title": issue_title,
                "repo_path": repo_path,
                "workflow_type": "github_issue"
            }
        )

        try:
            # Phase 1: Analysis
            await self._report_progress("Phase 1: Analyzing issue and codebase...")

            analysis_agent = await self.hub.get_agent("analysis")
            await analysis_agent.query(f"""
Analyze this GitHub issue and the codebase to understand the problem:

Issue: {issue_title}
Description: {issue_body}

Tasks:
1. Locate relevant files in the codebase
2. Understand the current implementation
3. Identify what needs to be changed
4. Propose a solution approach

Provide a detailed analysis with file locations and proposed changes.
""")

            analysis_messages = []
            async for msg in analysis_agent.receive_response():
                analysis_messages.append(msg)
                workflow_result.messages.append(msg)

            # Extract analysis summary
            analysis_summary = self._extract_text_from_messages(analysis_messages)

            # Phase 2: Implementation
            await self._report_progress("Phase 2: Implementing solution...")

            code_agent = await self.hub.get_agent("code")
            await code_agent.query(f"""
Based on this analysis, implement the solution:

{analysis_summary}

Tasks:
1. Make necessary code changes
2. Add or update tests
3. Ensure code follows project conventions
4. Document your changes

Implement the complete solution.
""")

            impl_messages = []
            async for msg in code_agent.receive_response():
                impl_messages.append(msg)
                workflow_result.messages.append(msg)

            # Phase 3: Testing
            await self._report_progress("Phase 3: Running tests...")

            test_agent = await self.hub.get_agent("testing")
            await test_agent.query("""
Run the test suite and verify the implementation:

1. Run all tests
2. Check for failures
3. Report test results
4. Identify any issues

Provide complete test results.
""")

            test_messages = []
            async for msg in test_agent.receive_response():
                test_messages.append(msg)
                workflow_result.messages.append(msg)

            # Check test results
            test_summary = self._extract_text_from_messages(test_messages)

            if "failed" in test_summary.lower() or "error" in test_summary.lower():
                # Phase 4: Fix and retry (if tests failed)
                await self._report_progress("Phase 4: Fixing test failures...")

                await code_agent.query(f"""
Tests failed. Fix the issues:

Test Results:
{test_summary}

Tasks:
1. Analyze test failures
2. Fix the issues
3. Ensure tests pass

Fix all test failures.
""")

                fix_messages = []
                async for msg in code_agent.receive_response():
                    fix_messages.append(msg)
                    workflow_result.messages.append(msg)

                # Re-run tests
                await test_agent.query("Run tests again to verify fixes")

                async for msg in test_agent.receive_response():
                    workflow_result.messages.append(msg)

            # Mark as completed
            workflow_result.status = TaskStatus.COMPLETED
            await self._report_progress(f"✅ Workflow {task_id} completed successfully")

        except Exception as e:
            logger.error(f"Workflow {task_id} failed: {e}")
            workflow_result.status = TaskStatus.FAILED
            workflow_result.error = str(e)
            await self._report_progress(f"❌ Workflow {task_id} failed: {e}")

        self.tasks[task_id] = workflow_result
        return workflow_result

    async def execute_feature_implementation(
        self,
        feature_description: str,
        test_required: bool = True
    ) -> TaskResult:
        """
        Execute complete feature implementation workflow.

        Workflow:
        1. Design feature architecture
        2. Implement feature
        3. Write tests (if required)
        4. Verify implementation

        Args:
            feature_description: Description of feature to implement
            test_required: Whether to write tests

        Returns:
            TaskResult with complete workflow results
        """
        task_id = self._generate_task_id()

        await self._report_progress(f"Starting feature implementation: {task_id}")

        result = TaskResult(
            task_id=task_id,
            status=TaskStatus.IN_PROGRESS,
            messages=[],
            metadata={
                "feature_description": feature_description,
                "workflow_type": "feature_implementation"
            }
        )

        try:
            code_agent = await self.hub.get_agent("code")

            # Phase 1: Design
            await self._report_progress("Phase 1: Designing feature...")

            await code_agent.query(f"""
Design this feature before implementing:

Feature: {feature_description}

Tasks:
1. Understand requirements
2. Design the solution architecture
3. Identify files to create/modify
4. Plan implementation steps

Provide a detailed design document.
""")

            async for msg in code_agent.receive_response():
                result.messages.append(msg)

            # Phase 2: Implement
            await self._report_progress("Phase 2: Implementing feature...")

            await code_agent.query("""
Now implement the feature based on your design.

Tasks:
1. Create/modify necessary files
2. Write clean, documented code
3. Handle edge cases
4. Follow best practices

Complete the implementation.
""")

            async for msg in code_agent.receive_response():
                result.messages.append(msg)

            # Phase 3: Tests (if required)
            if test_required:
                await self._report_progress("Phase 3: Writing tests...")

                await code_agent.query("""
Write comprehensive tests for the feature.

Tasks:
1. Create test file(s)
2. Write unit tests
3. Write integration tests
4. Ensure good coverage

Write complete test suite.
""")

                async for msg in code_agent.receive_response():
                    result.messages.append(msg)

                # Run tests
                await self._report_progress("Phase 4: Running tests...")

                test_agent = await self.hub.get_agent("testing")
                await test_agent.query("Run the new tests and verify they pass")

                async for msg in test_agent.receive_response():
                    result.messages.append(msg)

            result.status = TaskStatus.COMPLETED
            await self._report_progress(f"✅ Feature implementation {task_id} complete")

        except Exception as e:
            logger.error(f"Feature implementation {task_id} failed: {e}")
            result.status = TaskStatus.FAILED
            result.error = str(e)
            await self._report_progress(f"❌ Feature implementation {task_id} failed: {e}")

        self.tasks[task_id] = result
        return result

    def _extract_text_from_messages(self, messages: List) -> str:
        """Extract text content from messages."""
        from claude_agent_sdk import AssistantMessage, TextBlock

        text_parts = []
        for msg in messages:
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        text_parts.append(block.text)

        return "\n".join(text_parts)

    async def cleanup(self):
        """Cleanup orchestrator resources."""
        await self.hub.cleanup()

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.cleanup()
```

#### Step 4.2: Test Task Orchestrator

```python
# File: test_orchestrator.py

import asyncio
import logging
from openhands.orchestrator.task_orchestrator import TaskOrchestrator

logging.basicConfig(level=logging.INFO)

async def progress_callback(message: str, metadata: dict):
    """Progress callback for tracking execution."""
    print(f"📊 Progress: {message}")
    if metadata:
        print(f"   Metadata: {metadata}")

async def test_simple_task():
    """Test simple task execution."""
    print("\n=== Test: Simple Task ===")

    async with TaskOrchestrator(
        workspace=".",
        api_key="your-api-key",
        progress_callback=progress_callback
    ) as orchestrator:
        result = await orchestrator.execute_simple_task(
            agent_type="analysis",
            task_description="Analyze the codebase structure and provide a summary"
        )

        print(f"\nTask Status: {result.status}")
        print(f"Messages: {len(result.messages)}")

async def test_github_issue_workflow():
    """Test GitHub issue resolution workflow."""
    print("\n=== Test: GitHub Issue Workflow ===")

    async with TaskOrchestrator(
        workspace="./test_repo",
        api_key="your-api-key",
        progress_callback=progress_callback
    ) as orchestrator:
        result = await orchestrator.execute_github_issue_workflow(
            issue_title="Add user authentication",
            issue_body="""
We need to add user authentication to the application.

Requirements:
- Login endpoint
- Registration endpoint
- JWT token generation
- Password hashing
- Session management

Please implement these features with proper error handling and tests.
""",
            repo_path="./test_repo"
        )

        print(f"\nWorkflow Status: {result.status}")
        print(f"Total Messages: {len(result.messages)}")
        if result.error:
            print(f"Error: {result.error}")

async def test_feature_implementation():
    """Test feature implementation workflow."""
    print("\n=== Test: Feature Implementation ===")

    async with TaskOrchestrator(
        workspace=".",
        api_key="your-api-key",
        progress_callback=progress_callback
    ) as orchestrator:
        result = await orchestrator.execute_feature_implementation(
            feature_description="""
Implement a rate limiting middleware for the API.

Requirements:
- Limit requests per IP address
- Configurable rate limit (requests per minute)
- Return 429 status when limit exceeded
- Include rate limit headers in response
- Persistent storage of request counts (Redis)
""",
            test_required=True
        )

        print(f"\nFeature Status: {result.status}")
        print(f"Total Messages: {len(result.messages)}")

async def main():
    # await test_simple_task()
    await test_github_issue_workflow()
    # await test_feature_implementation()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Complete Code Examples

### Example 1: SWE-bench Issue Resolution

Complete example of resolving a SWE-bench style issue:

```python
# File: examples/swe_bench_resolution.py

import asyncio
import logging
from pathlib import Path
from openhands.orchestrator.task_orchestrator import TaskOrchestrator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def resolve_swe_bench_issue(
    repo_path: str,
    issue_data: dict,
    api_key: str
):
    """
    Resolve a SWE-bench issue using Claude Agent SDK.

    This replaces OpenHands' complex agent loop with simple orchestration.
    """
    logger.info(f"Resolving SWE-bench issue: {issue_data['instance_id']}")

    async def progress(msg, meta):
        logger.info(f"Progress: {msg}")

    async with TaskOrchestrator(
        workspace=repo_path,
        api_key=api_key,
        progress_callback=progress
    ) as orchestrator:
        # Execute issue resolution workflow
        result = await orchestrator.execute_github_issue_workflow(
            issue_title=issue_data['problem_statement'],
            issue_body=f"""
Problem Statement:
{issue_data['problem_statement']}

Repository: {issue_data['repo']}
Version: {issue_data['version']}
Base Commit: {issue_data['base_commit']}

Expected Behavior:
{issue_data.get('hints_text', 'See problem statement')}

Please:
1. Locate the relevant code
2. Understand the issue
3. Implement a fix
4. Ensure tests pass
5. Verify the solution
""",
            repo_path=repo_path
        )

        if result.status.value == "completed":
            logger.info(f"✅ Issue resolved: {issue_data['instance_id']}")
            return {
                "success": True,
                "instance_id": issue_data['instance_id'],
                "messages": result.messages
            }
        else:
            logger.error(f"❌ Issue resolution failed: {result.error}")
            return {
                "success": False,
                "instance_id": issue_data['instance_id'],
                "error": result.error
            }


async def main():
    # Example SWE-bench issue
    issue = {
        "instance_id": "django__django-12345",
        "repo": "django/django",
        "version": "3.1",
        "base_commit": "abc123def",
        "problem_statement": """
When using QuerySet.filter() with a Q object containing multiple conditions,
the SQL generated is inefficient and can lead to performance issues.

The current implementation generates:
SELECT * FROM table WHERE (a = 1) OR (a = 2) OR (a = 3) ...

Expected:
SELECT * FROM table WHERE a IN (1, 2, 3)

This affects queries with more than 3 OR conditions.
""",
        "hints_text": "Look at django/db/models/sql/query.py"
    }

    result = await resolve_swe_bench_issue(
        repo_path="/tmp/django_test",
        issue_data=issue,
        api_key="your-api-key"
    )

    print(f"\nResult: {result}")


if __name__ == "__main__":
    asyncio.run(main())
```

### Example 2: Multi-Agent Parallel Execution

Example showing parallel execution of multiple agents:

```python
# File: examples/parallel_agents_example.py

import asyncio
import logging
from openhands.agent_hub import AgentHub

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def comprehensive_codebase_analysis(
    repo_path: str,
    api_key: str
):
    """
    Perform comprehensive codebase analysis using multiple agents in parallel.

    Agents run simultaneously:
    - Security analysis
    - Code quality review
    - Test coverage check
    - Documentation analysis
    """
    logger.info("Starting comprehensive codebase analysis...")

    async with AgentHub(workspace=repo_path, api_key=api_key) as hub:
        # Define parallel tasks
        tasks = [
            ("analysis", """
Perform security analysis:
1. Check for SQL injection vulnerabilities
2. Check for XSS vulnerabilities
3. Check for authentication/authorization issues
4. Check for sensitive data exposure
5. Provide detailed security report
"""),
            ("analysis", """
Perform code quality review:
1. Identify code duplication
2. Find overly complex functions
3. Check code organization
4. Review naming conventions
5. Provide improvement recommendations
"""),
            ("testing", """
Analyze test coverage:
1. Run test suite
2. Check coverage percentage
3. Identify untested code paths
4. Suggest additional tests needed
5. Provide coverage report
"""),
            ("analysis", """
Review documentation:
1. Check README completeness
2. Review inline code comments
3. Check API documentation
4. Identify missing documentation
5. Provide documentation improvement plan
""")
        ]

        # Execute all tasks in parallel
        logger.info(f"Executing {len(tasks)} analysis tasks in parallel...")
        results = await hub.parallel_execute(tasks)

        # Process results
        logger.info("Analysis complete! Processing results...")

        analysis_reports = results.get("analysis", [])
        test_reports = results.get("testing", [])

        return {
            "security_analysis": analysis_reports[0] if len(analysis_reports) > 0 else [],
            "quality_review": analysis_reports[1] if len(analysis_reports) > 1 else [],
            "test_coverage": test_reports,
            "documentation_review": analysis_reports[2] if len(analysis_reports) > 2 else []
        }


async def main():
    results = await comprehensive_codebase_analysis(
        repo_path="./my_project",
        api_key="your-api-key"
    )

    print("\n" + "="*80)
    print("COMPREHENSIVE ANALYSIS RESULTS")
    print("="*80)

    for key, value in results.items():
        print(f"\n{key.upper()}:")
        print(f"  Messages: {len(value)}")


if __name__ == "__main__":
    asyncio.run(main())
```

### Example 3: Web Testing with Browser Agent

Example using browser agent for web application testing:

```python
# File: examples/web_testing_example.py

import asyncio
import logging
from openhands.agent_hub import AgentHub

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_web_application(
    app_url: str,
    test_scenarios: list,
    api_key: str
):
    """
    Test web application using browser agent.

    Args:
        app_url: Base URL of application
        test_scenarios: List of test scenarios to execute
        api_key: Anthropic API key
    """
    logger.info(f"Testing web application: {app_url}")

    async with AgentHub(workspace=".", api_key=api_key) as hub:
        browser_agent = await hub.get_agent("browser")

        test_results = []

        for scenario in test_scenarios:
            logger.info(f"Executing scenario: {scenario['name']}")

            await browser_agent.query(f"""
Test Scenario: {scenario['name']}
Application URL: {app_url}

Steps:
{scenario['steps']}

Expected Result:
{scenario['expected']}

Execute this test scenario and report:
1. Whether the test passed or failed
2. Screenshots of key steps
3. Any errors encountered
4. Detailed test results
""")

            messages = []
            async for msg in browser_agent.receive_response():
                messages.append(msg)

            test_results.append({
                "scenario": scenario['name'],
                "messages": messages
            })

        return test_results


async def main():
    scenarios = [
        {
            "name": "User Registration",
            "steps": """
1. Navigate to /register
2. Fill in username: testuser
3. Fill in email: test@example.com
4. Fill in password: SecurePass123!
5. Click "Register" button
6. Verify redirect to dashboard
""",
            "expected": "User successfully registered and redirected to dashboard"
        },
        {
            "name": "User Login",
            "steps": """
1. Navigate to /login
2. Fill in email: test@example.com
3. Fill in password: SecurePass123!
4. Click "Login" button
5. Verify redirect to dashboard
6. Verify username displayed in header
""",
            "expected": "User successfully logged in"
        },
        {
            "name": "Create Post",
            "steps": """
1. Navigate to /posts/new (assume logged in)
2. Fill in title: Test Post
3. Fill in content: This is a test post
4. Click "Publish" button
5. Verify post appears in feed
""",
            "expected": "Post successfully created and visible"
        }
    ]

    results = await test_web_application(
        app_url="http://localhost:3000",
        test_scenarios=scenarios,
        api_key="your-api-key"
    )

    print("\n" + "="*80)
    print("WEB APPLICATION TEST RESULTS")
    print("="*80)

    for result in results:
        print(f"\nScenario: {result['scenario']}")
        print(f"Messages: {len(result['messages'])}")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Testing Strategy

### Unit Tests

```python
# File: tests/test_agent_hub.py

import pytest
import asyncio
from openhands.agent_hub import AgentHub, AgentConfig

@pytest.mark.asyncio
async def test_agent_hub_initialization():
    """Test AgentHub initialization."""
    hub = AgentHub(workspace="/tmp/test", api_key="test-key")

    assert hub.workspace.name == "test"
    assert len(hub.configs) == 5  # 5 agent types
    assert "code" in hub.configs
    assert "analysis" in hub.configs


@pytest.mark.asyncio
async def test_agent_creation():
    """Test agent creation."""
    hub = AgentHub(workspace="/tmp/test", api_key="test-key")

    # Mock the actual connection
    # (In real tests, you'd mock ClaudeSDKClient)

    assert len(hub.agents) == 0

    # After getting agent, it should be cached
    # agent = await hub.get_agent("code")
    # assert len(hub.agents) == 1

    await hub.cleanup()


@pytest.mark.asyncio
async def test_parallel_execution():
    """Test parallel agent execution."""
    # Mock test for parallel execution
    pass
```

### Integration Tests

```python
# File: tests/integration/test_workflows.py

import pytest
import asyncio
from openhands.orchestrator.task_orchestrator import TaskOrchestrator
from openhands.orchestrator.task_orchestrator import TaskStatus

@pytest.mark.integration
@pytest.mark.asyncio
async def test_simple_task_workflow():
    """Test simple task execution workflow."""
    orchestrator = TaskOrchestrator(
        workspace="/tmp/test_project",
        api_key="test-key"
    )

    # This would require mocking Claude SDK responses
    # result = await orchestrator.execute_simple_task(
    #     agent_type="analysis",
    #     task_description="Find TODO comments"
    # )

    # assert result.status == TaskStatus.COMPLETED
    # assert len(result.messages) > 0

    await orchestrator.cleanup()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_issue_workflow():
    """Test full GitHub issue resolution workflow."""
    # End-to-end test
    pass
```

---

## Deployment Guide

### Docker Configuration

```dockerfile
# File: Dockerfile.claude-agent-sdk

FROM python:3.11-slim

# Install Node.js (required for Claude Code CLI)
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Claude Agent SDK
RUN pip install claude-agent-sdk jupyter_client playwright

# Install Playwright browsers
RUN playwright install chromium

# Copy application code
COPY . .

# Set environment variables
ENV ANTHROPIC_API_KEY=""
ENV WORKSPACE=/workspace

# Create workspace directory
RUN mkdir -p /workspace

# Run application
CMD ["python", "-m", "openhands.main"]
```

**Build and run:**
```bash
docker build -f Dockerfile.claude-agent-sdk -t openhands-claude-sdk .

docker run -it \
  -e ANTHROPIC_API_KEY="your-api-key" \
  -v $(pwd)/workspace:/workspace \
  openhands-claude-sdk
```

### Environment Configuration

```bash
# File: .env.example

# Anthropic API Key (required)
ANTHROPIC_API_KEY=sk-ant-...

# Workspace directory
WORKSPACE=/path/to/workspace

# Claude Agent SDK settings
CLAUDE_MODEL=claude-sonnet-4-5-20250929
MAX_TURNS=50
PERMISSION_MODE=acceptEdits

# Logging
LOG_LEVEL=INFO
LOG_FILE=openhands.log

# Optional: Custom prompts directory
PROMPTS_DIR=./openhands/prompts
```

---

## Migration Checklist

### Phase 1: Setup (Week 1)
- [ ] Install Node.js and Claude Code CLI
- [ ] Install Claude Agent SDK
- [ ] Create test project structure
- [ ] Write and run POC scripts
- [ ] Validate Claude Code integration works
- [ ] Document installation process

### Phase 2: Custom Tools (Week 2)
- [ ] Design Jupyter MCP tool
- [ ] Implement Jupyter tool with kernel management
- [ ] Test Jupyter tool independently
- [ ] Design Browser MCP tool
- [ ] Implement Browser tool with Playwright
- [ ] Test Browser tool independently
- [ ] Integration test: Claude Code + custom tools
- [ ] Document custom tools

### Phase 3: Agent Hub (Week 3)
- [ ] Create system prompts for all agent types
- [ ] Implement AgentHub class
- [ ] Implement AgentConfig class
- [ ] Test single agent execution
- [ ] Test parallel agent execution
- [ ] Test agent cleanup
- [ ] Document Agent Hub API

### Phase 4: Task Orchestrator (Week 4)
- [ ] Implement TaskOrchestrator class
- [ ] Implement simple task execution
- [ ] Implement GitHub issue workflow
- [ ] Implement feature implementation workflow
- [ ] Test all workflow types
- [ ] Add progress callbacks
- [ ] Document orchestration patterns

### Phase 5: Integration (Week 5)
- [ ] Replace OpenHands AgentController with TaskOrchestrator
- [ ] Migrate SWE-bench evaluation
- [ ] Migrate WebArena evaluation
- [ ] Update CLI interface
- [ ] Update API endpoints
- [ ] Test end-to-end workflows

### Phase 6: Testing (Week 6)
- [ ] Write unit tests for AgentHub
- [ ] Write unit tests for TaskOrchestrator
- [ ] Write integration tests
- [ ] Write end-to-end tests
- [ ] Run SWE-bench benchmark
- [ ] Run WebArena benchmark
- [ ] Performance testing
- [ ] Cost analysis

### Phase 7: Documentation (Week 7)
- [ ] Write user migration guide
- [ ] Document new architecture
- [ ] Create example scripts
- [ ] Update README
- [ ] Create Docker setup guide
- [ ] Write troubleshooting guide
- [ ] Create video tutorials (optional)

### Phase 8: Deployment (Week 8)
- [ ] Create Docker image
- [ ] Test Docker deployment
- [ ] Setup CI/CD pipelines
- [ ] Deploy to staging
- [ ] Run acceptance tests
- [ ] Deploy to production
- [ ] Monitor performance

---

## Conclusion

This guide provides a **complete, step-by-step implementation** for converting OpenHands to use Claude Agent SDK with Option A (Full Delegation) architecture.

### Key Takeaways

1. **Massive Simplification:** From ~15,000 LOC agent system to ~500 LOC orchestration layer
2. **Better Performance:** Leverage Claude Code's optimized agent loop
3. **Focus on Value:** Spend time on domain logic, not infrastructure
4. **Flexible Architecture:** Easy to add new agent types and workflows
5. **Production Ready:** Includes testing, deployment, and monitoring

### Next Steps

1. **Start with Phase 1:** Setup environment and validate POC
2. **Build Custom Tools:** Implement Jupyter and Browser MCPs
3. **Implement Agent Hub:** Create specialized agents
4. **Build Orchestrator:** Implement high-level workflows
5. **Test Thoroughly:** Ensure quality and performance
6. **Deploy Gradually:** Roll out in phases with feature flags

### Success Metrics

- ✅ All SWE-bench tests pass with ≥ current success rate
- ✅ Code complexity reduced by >80%
- ✅ Maintenance effort reduced significantly
- ✅ Performance equals or exceeds current system
- ✅ Cost per task reduced (prompt caching)

**Ready to begin implementation? Start with Phase 1 setup!**

---

**Document Version:** 1.0
**Last Updated:** 2025-11-08
**Status:** ✅ Ready for Implementation
