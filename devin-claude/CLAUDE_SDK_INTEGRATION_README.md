# Claude Agent SDK Integration for OpenHands

## Overview

This directory contains the foundational implementation for integrating Claude Agent SDK into OpenHands, following **Option A: Full Delegation** architecture from the detailed conversion guide.

This integration replaces OpenHands' complex custom agent loop (~15,000 LOC) with a simplified orchestration layer (~500 LOC) that delegates execution to Claude Code's built-in agent capabilities.

## Architecture

### Core Components

```
OpenHands + Claude Agent SDK
│
├── Agent Hub (openhands/agent_hub/)
│   ├── hub.py - Central coordinator for specialized agents
│   └── __init__.py - Package exports
│
├── MCP Servers (openhands/mcp_servers/)
│   ├── jupyter_mcp.py - Python execution via Jupyter kernels
│   ├── browser_mcp.py - Web automation via Playwright
│   └── __init__.py - Package exports
│
├── Orchestrator (openhands/orchestrator/)
│   ├── task_orchestrator.py - High-level workflow coordination
│   └── __init__.py - Package exports
│
├── Prompts (openhands/prompts/)
│   ├── code_agent.txt - System prompt for code editing agent
│   ├── analysis_agent.txt - System prompt for analysis agent
│   ├── testing_agent.txt - System prompt for testing agent
│   ├── browser_agent.txt - System prompt for browser agent
│   └── python_agent.txt - System prompt for Python execution agent
│
├── POC (poc/)
│   ├── poc_simple_query.py - Simple query demonstration
│   ├── test_file_1.py - Sample file with TODOs
│   ├── test_file_2.py - Another sample file
│   └── README.md - POC documentation
│
└── Tests (tests/)
    ├── test_agent_hub.py - Agent Hub test suite
    └── test_orchestrator.py - Orchestrator test suite
```

## What's Implemented (Phase 1)

### 1. Directory Structure ✅
- `openhands/agent_hub/` - Agent management
- `openhands/orchestrator/` - Task orchestration
- `openhands/mcp_servers/` - Custom MCP tools
- `openhands/prompts/` - Agent system prompts
- `poc/` - Proof of concept scripts
- `tests/` - Test suite

### 2. MCP Servers ✅

#### Jupyter MCP Server
**File:** `openhands/mcp_servers/jupyter_mcp.py`

Custom MCP server for Python code execution:
- Execute Python code in Jupyter kernels
- Capture stdout, stderr, and return values
- Support multiple concurrent kernels
- Kernel lifecycle management (create, execute, reset)

**Tools provided:**
- `execute_python` - Execute Python code
- `kernel_info` - Get kernel information
- `reset_kernel` - Reset a kernel

#### Browser MCP Server
**File:** `openhands/mcp_servers/browser_mcp.py`

Custom MCP server for web automation:
- Navigate to URLs
- Extract page content
- Interact with elements (click, type, select)
- Take screenshots
- Support multiple browser pages

**Tools provided:**
- `navigate` - Navigate to URL
- `interact` - Interact with page elements
- `screenshot` - Capture screenshot
- `extract_content` - Extract text content
- `get_page_info` - Get page information

### 3. Agent Hub ✅

**File:** `openhands/agent_hub/hub.py`

Central coordinator for specialized agents:
- Manages 5 agent types (code, analysis, testing, browser, python)
- Each agent has specific tools and permissions
- Agent caching and reuse
- Parallel and sequential execution support
- Automatic cleanup

**Agent Types:**

| Agent | Tools | Purpose |
|-------|-------|---------|
| **Code** | Read, Write, Edit, Bash | Implementation and refactoring |
| **Analysis** | Read, Grep, Glob | Code analysis and review |
| **Testing** | Read, Bash | Test execution and verification |
| **Browser** | Browser MCP tools | Web testing and interaction |
| **Python** | Jupyter MCP tools | Python code execution |

### 4. System Prompts ✅

**Location:** `openhands/prompts/`

Specialized prompts for each agent type:
- `code_agent.txt` - Expert software engineer
- `analysis_agent.txt` - Code analyst
- `testing_agent.txt` - Testing specialist
- `browser_agent.txt` - Web interaction specialist
- `python_agent.txt` - Python execution specialist

### 5. Task Orchestrator ✅

**File:** `openhands/orchestrator/task_orchestrator.py`

High-level workflow coordination:
- Simple task execution
- GitHub issue resolution workflow
- Feature implementation workflow
- Progress tracking and callbacks
- Error handling and retries

**Workflow Patterns:**
- **Simple Task** - Single agent execution
- **GitHub Issue** - Analyze → Implement → Test → Fix
- **Feature Implementation** - Design → Implement → Test

### 6. POC Scripts ✅

**Location:** `poc/`

Proof of concept demonstrations:
- `poc_simple_query.py` - Simple Claude Agent SDK usage
- Test files with TODO comments for analysis
- README with setup instructions

### 7. Test Suite ✅

**Location:** `tests/`

Comprehensive test scripts:
- `test_agent_hub.py` - Agent Hub functionality tests
- `test_orchestrator.py` - Orchestrator workflow tests

## Installation

### Prerequisites

1. **Node.js** (required for Claude Code CLI):
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # macOS
   brew install node
   ```

2. **Claude Code CLI**:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

3. **Python Dependencies**:
   ```bash
   pip install claude-agent-sdk jupyter_client playwright
   playwright install chromium
   ```

### Setup

1. Set API key:
   ```bash
   export ANTHROPIC_API_KEY='your-api-key-here'
   ```

2. Verify installation:
   ```bash
   # Test Claude Code CLI
   claude-code --version

   # Test Python SDK
   python -c "from claude_agent_sdk import query; print('✅ SDK installed')"
   ```

## Usage Examples

### Example 1: Simple Query (POC)

```bash
cd poc
python poc_simple_query.py
```

This demonstrates basic Claude Agent SDK usage by finding TODO comments in test files.

### Example 2: Agent Hub

```python
from openhands.agent_hub import AgentHub
import asyncio

async def main():
    async with AgentHub(workspace=".", api_key="sk-...") as hub:
        # Execute analysis task
        results = await hub.execute_task(
            agent_type="analysis",
            task="Find all security vulnerabilities in the codebase"
        )

        print(f"Analysis complete: {len(results)} messages")

asyncio.run(main())
```

### Example 3: Task Orchestrator

```python
from openhands.orchestrator import TaskOrchestrator
import asyncio

async def main():
    async with TaskOrchestrator(workspace=".", api_key="sk-...") as orch:
        result = await orch.execute_github_issue_workflow(
            issue_title="Add authentication",
            issue_body="Implement user authentication with JWT",
            repo_path="/path/to/repo"
        )

        print(f"Workflow status: {result.status.value}")

asyncio.run(main())
```

### Example 4: Parallel Execution

```python
from openhands.agent_hub import AgentHub
import asyncio

async def main():
    async with AgentHub(workspace=".", api_key="sk-...") as hub:
        # Run multiple analyses in parallel
        results = await hub.parallel_execute([
            ("analysis", "Find security issues"),
            ("analysis", "Find code quality issues"),
            ("testing", "Run test suite")
        ])

        for agent_type, messages in results.items():
            print(f"{agent_type}: {len(messages)} messages")

asyncio.run(main())
```

## Running Tests

### Agent Hub Tests

```bash
cd /home/user/skills-claude/OpenHands
python tests/test_agent_hub.py
```

**Tests include:**
- Agent configuration validation
- Agent caching and reuse
- Single agent execution
- Parallel agent execution
- Sequential workflows

### Orchestrator Tests

```bash
python tests/test_orchestrator.py
```

**Tests include:**
- Simple task execution
- Feature implementation workflow
- GitHub issue workflow
- Task tracking

## Key Benefits

| Aspect | Before (Custom Loop) | After (Claude SDK) |
|--------|---------------------|-------------------|
| **Code Complexity** | ~15,000 LOC | ~500 LOC |
| **Agent Loop** | Custom implementation | Built-in (Claude Code) |
| **Tool System** | Custom definitions | Built-in + MCP |
| **Maintenance** | High | Low |
| **Focus** | Infrastructure | Domain logic |

## Next Steps

### Phase 2: Integration

1. **Replace AgentController** with TaskOrchestrator
2. **Migrate SWE-bench** evaluation
3. **Migrate WebArena** evaluation
4. **Update API endpoints**
5. **End-to-end testing**

### Phase 3: Testing & Validation

1. **Unit tests** for all components
2. **Integration tests** for workflows
3. **SWE-bench benchmark** runs
4. **Performance testing**
5. **Cost analysis**

### Phase 4: Deployment

1. **Docker image** creation
2. **CI/CD pipelines** setup
3. **Staging deployment**
4. **Production rollout**
5. **Monitoring setup**

## Architecture Diagram

```
User Request
    ↓
TaskOrchestrator
    ↓
AgentHub (coordinates)
    ├─→ CodeAgent (ClaudeSDKClient)
    ├─→ AnalysisAgent (ClaudeSDKClient)
    ├─→ TestingAgent (ClaudeSDKClient)
    ├─→ BrowserAgent (ClaudeSDKClient + Browser MCP)
    └─→ PythonAgent (ClaudeSDKClient + Jupyter MCP)
        ↓
Claude Code CLI (built-in agent loop)
    ↓
Claude API
```

## File Structure Summary

```
OpenHands/
├── openhands/
│   ├── agent_hub/
│   │   ├── __init__.py
│   │   └── hub.py (294 lines)
│   ├── mcp_servers/
│   │   ├── __init__.py
│   │   ├── jupyter_mcp.py (333 lines)
│   │   └── browser_mcp.py (348 lines)
│   ├── orchestrator/
│   │   ├── __init__.py
│   │   └── task_orchestrator.py (411 lines)
│   └── prompts/
│       ├── code_agent.txt
│       ├── analysis_agent.txt
│       ├── testing_agent.txt
│       ├── browser_agent.txt
│       └── python_agent.txt
├── poc/
│   ├── poc_simple_query.py
│   ├── test_file_1.py
│   ├── test_file_2.py
│   └── README.md
└── tests/
    ├── test_agent_hub.py
    └── test_orchestrator.py
```

## Troubleshooting

### Common Issues

1. **"ANTHROPIC_API_KEY not set"**
   - Set environment variable: `export ANTHROPIC_API_KEY='your-key'`

2. **"claude-code command not found"**
   - Install CLI: `npm install -g @anthropic-ai/claude-code`

3. **"Module claude_agent_sdk not found"**
   - Install SDK: `pip install claude-agent-sdk`

4. **Playwright browser issues**
   - Install browsers: `playwright install chromium`

## Documentation References

- **Detailed Conversion Guide**: `/home/user/skills-claude/OPTION_A_DETAILED_CONVERSION_GUIDE.md`
- **Architecture Analysis**: `/home/user/skills-claude/OPENHANDS_ARCHITECTURE_REPORT.md`
- **Conversion Strategy**: `/home/user/skills-claude/OPENHANDS_TO_CLAUDE_AGENT_SDK_CONVERSION_PLAN.md`

## Contributing

This is Phase 1 of the conversion. Contributions should:
1. Follow the architecture patterns established
2. Maintain async/await patterns
3. Include logging
4. Add tests for new functionality
5. Update documentation

## Status

**Phase 1: COMPLETE ✅**
- Directory structure created
- MCP servers implemented
- Agent Hub implemented
- System prompts created
- Task Orchestrator implemented
- POC scripts created
- Test suite created

**Next Phase: Integration & Testing**
