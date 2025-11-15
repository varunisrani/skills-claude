# OpenHands to Claude Agent SDK Conversion Plan

**Document Version:** 2.0
**Date:** 2025-11-08
**Status:** Planning Phase - Updated for Claude Agent SDK

---

## ⚠️ CRITICAL UPDATE: Claude Agent SDK vs Claude API SDK

This plan targets the **Claude Agent SDK** (`claude-agent-sdk`), which is fundamentally different from the regular Anthropic Claude API SDK:

| Aspect | Claude API SDK | Claude Agent SDK |
|--------|---------------|------------------|
| **Purpose** | Direct API calls to Claude | Programmatic control of Claude Code CLI |
| **Installation** | `pip install anthropic` | `pip install claude-agent-sdk` + Node.js + Claude Code CLI |
| **Dependencies** | None (just API key) | Requires `@anthropic-ai/claude-code` (npm) |
| **Architecture** | Your code → Anthropic API → Claude model | Your code → Claude Code CLI → Claude (with built-in tools) |
| **Tools** | Define with API tool format | Uses Claude Code's built-in tools + custom MCP tools |
| **Use Case** | Building custom AI applications | Wrapping/extending Claude Code programmatically |

**Key Insight:** Claude Agent SDK is a Python wrapper around the Claude Code CLI tool, giving you programmatic access to Claude Code's complete agentic capabilities.

---

## Executive Summary

This document provides a comprehensive plan for converting OpenHands from **LiteLLM** (multi-provider LLM abstraction) to **Claude Agent SDK** (Claude Code programmatic wrapper).

### What is Claude Agent SDK?

The Claude Agent SDK enables Python applications to:
- **Control Claude Code programmatically** via `query()` and `ClaudeSDKClient`
- **Use Claude Code's built-in tools** (Read, Write, Bash, Edit, etc.)
- **Add custom tools** via in-process MCP servers (`@tool` decorator)
- **Implement hooks** for deterministic processing and automated feedback
- **Leverage Claude Code's agent loop** instead of building custom agent orchestration

### Architectural Paradigm Shift

**Current (OpenHands + LiteLLM):**
```
OpenHands Agents
  ↓ (custom agent loop)
LLM Wrapper
  ↓ (litellm.completion)
LiteLLM
  ↓ (provider abstraction)
Claude API / OpenAI API / etc.
```

**Target (OpenHands + Claude Agent SDK):**
```
OpenHands (simplified)
  ↓ (delegate to Claude Code)
Claude Agent SDK
  ↓ (query() or ClaudeSDKClient)
Claude Code CLI
  ↓ (built-in agent loop + tools)
Claude API
```

**Key Difference:** Instead of OpenHands implementing its own agent loop, it leverages Claude Code's built-in agentic capabilities.

---

## Table of Contents

1. [Architecture Analysis](#architecture-analysis)
2. [Conversion Strategy](#conversion-strategy)
3. [Implementation Approach](#implementation-approach)
4. [Tool Mapping](#tool-mapping)
5. [Agent Conversion](#agent-conversion)
6. [Implementation Phases](#implementation-phases)
7. [Code Examples](#code-examples)
8. [Risk Assessment](#risk-assessment)
9. [Success Criteria](#success-criteria)

---

## Architecture Analysis

### Current OpenHands Architecture

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       ↓
┌─────────────────────┐
│ AgentController     │ - Orchestrates agent lifecycle
│                     │ - Manages state, observations
│                     │ - Handles errors
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Agent.step()        │ - Custom agent loop
│ (CodeActAgent, etc.)│ - Decides next action
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ LLM.completion()    │ - LiteLLM wrapper
│                     │ - Retry logic
│                     │ - Cost tracking
└──────────┬──────────┘
           ↓
┌──────────────────────┐
│ litellm.completion() │ - Multi-provider abstraction
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Claude API           │ - HTTP API calls
└──────────────────────┘
```

**OpenHands implements:**
- ✅ Custom agent loop (step-by-step execution)
- ✅ Tool definitions (bash, ipython, editor, etc.)
- ✅ Function calling (tool call parsing)
- ✅ State management (observations, actions)
- ✅ Runtime (sandbox execution)
- ✅ Memory (condensation, history)

### Target Claude Agent SDK Architecture

**Option A: Full Delegation (Recommended)**
```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       ↓
┌──────────────────────────────┐
│ OpenHands (Simplified)       │ - Task decomposition
│                              │ - High-level orchestration
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│ ClaudeSDKClient              │ - query() for prompts
│                              │ - receive_response()
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│ Claude Code CLI              │ - Built-in agent loop
│                              │ - Built-in tools (Read, Write, Bash, etc.)
│                              │ - Function calling
│                              │ - Sandbox execution
└──────────┬───────────────────┘
           ↓
┌──────────────────────────────┐
│ Claude API                   │ - Model inference
└──────────────────────────────┘
```

**What Claude Code provides:**
- ✅ Agent loop (automatic tool use)
- ✅ Built-in tools (Read, Write, Edit, Bash, Glob, Grep, etc.)
- ✅ Function calling (automatic)
- ✅ Runtime/sandbox (built-in)
- ✅ Streaming support
- ✅ Error handling

**What OpenHands would focus on:**
- 🎯 High-level task orchestration
- 🎯 Domain-specific logic (SWE-bench, WebArena)
- 🎯 Custom tools via MCP (if needed beyond Claude Code's tools)
- 🎯 Evaluation and metrics
- 🎯 UI/UX layer

---

## Conversion Strategy

### Three Possible Approaches

#### Option A: Full Delegation to Claude Code ⭐ RECOMMENDED

**Concept:** Use Claude Code as the primary agent, OpenHands provides high-level orchestration.

**Pros:**
- ✅ Massive simplification (remove entire agent loop, tool system, LLM wrapper)
- ✅ Leverage Claude Code's tested and optimized agent capabilities
- ✅ Automatic tool use (no need to parse/execute manually)
- ✅ Built-in sandbox (no separate runtime needed)
- ✅ Native streaming, error handling, retry logic

**Cons:**
- ⚠️ Less control over individual agent steps
- ⚠️ Dependent on Claude Code's capabilities
- ⚠️ May need to adapt to Claude Code's tool set

**Use Case:** Best for most OpenHands use cases where you want robust agent execution with minimal custom logic.

---

#### Option B: Hybrid (Claude Code + Custom Agent Logic)

**Concept:** Use Claude Code for LLM calls and some tools, keep OpenHands agent loop for fine-grained control.

**Architecture:**
```
OpenHands AgentController
  ↓
Agent.step() (custom logic)
  ↓
query() for specific subtasks → Claude Code
  ↓
Process response, update state
```

**Pros:**
- ✅ Maintain fine-grained control
- ✅ Can use Claude Code's tools selectively
- ✅ Gradual migration path

**Cons:**
- ⚠️ More complex architecture
- ⚠️ Need to coordinate between two agent systems
- ⚠️ Doesn't simplify as much

**Use Case:** When you need specific agent logic that Claude Code doesn't support.

---

#### Option C: Adapter Layer (Minimal Changes)

**Concept:** Replace only LLM wrapper, keep all OpenHands agent logic.

**Architecture:**
```
Agent.step() (unchanged)
  ↓
LLM.completion() → query() (adapter)
  ↓
Parse response (unchanged)
  ↓
Execute actions (unchanged)
```

**Pros:**
- ✅ Minimal code changes
- ✅ Preserves all existing logic
- ✅ Quick migration

**Cons:**
- ⚠️ Misses opportunity for simplification
- ⚠️ Doesn't leverage Claude Code's full capabilities
- ⚠️ Still need to maintain agent loop, tools, runtime

**Use Case:** Quick proof-of-concept or when you must preserve exact behavior.

---

### Recommended Approach: Option A (Full Delegation)

**Rationale:**
1. **Claude Code already implements** most of what OpenHands does (agent loop, tools, runtime)
2. **Simplification** is a major win (reduce codebase, maintenance, complexity)
3. **Better performance** from Claude Code's optimized agent implementation
4. **Focus on value-add** (domain logic, evaluation, UI) rather than agent infrastructure

**Migration Strategy:**
1. Start with simple agents (ReadOnlyAgent, LocAgent)
2. Delegate to Claude Code via `ClaudeSDKClient`
3. Remove custom agent loop, tool execution, runtime
4. Add custom tools via MCP only where Claude Code's tools insufficient
5. Keep domain-specific orchestration (SWE-bench workflows, etc.)

---

## Claude Agent SDK API Reference

### Installation

```bash
pip install claude-agent-sdk

# Also requires Node.js and Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

**Prerequisites:**
- Python 3.10+
- Node.js
- Claude Code CLI 2.0.0+

### Core API

#### 1. `query()` Function

**For single-turn interactions** (new session each time):

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Analyze this codebase and find all TODO comments",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob"],
        cwd="/path/to/project",
        system_prompt="You are a code analyzer"
    )
):
    print(message)
```

**Returns:** `AsyncIterator[Message]` - yields messages as they arrive

#### 2. `ClaudeSDKClient` Class

**For continuous conversations** (maintains context):

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async with ClaudeSDKClient(options=options) as client:
    # First query
    await client.query("Read the README file")
    async for msg in client.receive_response():
        print(msg)

    # Follow-up (remembers context)
    await client.query("Summarize what you learned")
    async for msg in client.receive_response():
        print(msg)
```

**Key Methods:**
- `connect(prompt)` - Connect with optional initial prompt
- `query(prompt, session_id)` - Send query in streaming mode
- `receive_messages()` - Receive all messages
- `receive_response()` - Receive until ResultMessage
- `interrupt()` - Stop execution
- `disconnect()` - Close connection

#### 3. Custom Tools (In-Process MCP)

```python
from claude_agent_sdk import tool, create_sdk_mcp_server

@tool("analyze_imports", "Analyze Python imports", {"file_path": str})
async def analyze_imports(args):
    # Your tool logic
    return {
        "content": [{
            "type": "text",
            "text": f"Found imports in {args['file_path']}"
        }]
    }

# Create MCP server
analyzer = create_sdk_mcp_server(
    name="code_analyzer",
    version="1.0.0",
    tools=[analyze_imports]
)

# Use with Claude
options = ClaudeAgentOptions(
    mcp_servers={"analyzer": analyzer},
    allowed_tools=["mcp__analyzer__analyze_imports"]
)
```

#### 4. `ClaudeAgentOptions` Configuration

```python
@dataclass
class ClaudeAgentOptions:
    allowed_tools: list[str]              # Tools Claude can use
    system_prompt: str | None             # System prompt
    mcp_servers: dict                     # Custom MCP servers
    permission_mode: str                  # 'ask', 'accept', 'acceptEdits', etc.
    cwd: str | Path                       # Working directory
    max_turns: int | None                 # Max conversation turns
    model: str | None                     # Claude model
    can_use_tool: Callable                # Custom permission handler
    hooks: dict                           # Event hooks
    # ... more options
```

### Claude Code Built-in Tools

Claude Code provides these tools automatically (no need to define):

| Tool | Description | OpenHands Equivalent |
|------|-------------|---------------------|
| **Read** | Read file contents | Similar to OpenHands view/read |
| **Write** | Write file contents | Similar to CmdRunAction (echo/cat) |
| **Edit** | Edit files (str_replace style) | Similar to str_replace_editor |
| **Bash** | Execute bash commands | Similar to CmdRunAction (bash) |
| **Glob** | File pattern matching | Similar to glob tool |
| **Grep** | Search file contents | Similar to grep tool |
| **Task** | Delegate to subagent | Similar to multi-agent delegation |

**Key Insight:** Most OpenHands tools map directly to Claude Code built-in tools!

---

## Tool Mapping

### Direct Mappings (Claude Code has built-in)

| OpenHands Tool | Claude Code Tool | Notes |
|----------------|-----------------|-------|
| `bash` (CmdRunAction) | `Bash` | ✅ Direct match |
| `str_replace_editor` | `Edit` | ✅ Similar str_replace semantics |
| `view` / file reading | `Read` | ✅ Direct match |
| `glob` | `Glob` | ✅ Direct match |
| `grep` | `Grep` | ✅ Direct match |
| File writing | `Write` | ✅ Direct match |

### Tools Requiring Custom MCP

| OpenHands Tool | Status | Solution |
|----------------|--------|----------|
| `ipython` (Jupyter) | ⚠️ No built-in | Create custom MCP tool for Jupyter |
| `browser` (BrowserGym) | ⚠️ No built-in | Create custom MCP tool for browsing |
| `finish` | ⚠️ Different | Use ResultMessage / conversation completion |
| `think` | ⚠️ Different | Claude thinks automatically; may not need explicit tool |
| `task_tracker` | ⚠️ No built-in | Use `Task` tool or custom MCP |

### Custom Tools to Build

```python
# Example: IPython/Jupyter tool
@tool(
    "ipython_execute",
    "Execute Python code in Jupyter kernel",
    {"code": str, "kernel_id": str}
)
async def ipython_execute(args):
    # Connect to Jupyter kernel
    # Execute code
    # Return result
    return {"content": [{"type": "text", "text": result}]}

# Example: Browser tool
@tool(
    "browse_url",
    "Navigate to URL and interact with web page",
    {"url": str, "action": str}
)
async def browse_url(args):
    # Use BrowserGym or similar
    # Perform action
    return {"content": [{"type": "text", "text": observation}]}
```

---

## Agent Conversion

### Current Agent Architecture (Needs Complete Rework)

**CodeActAgent** (openhands/agenthub/codeact_agent/codeact_agent.py):
```python
def step(self, state: State) -> Action:
    # 1. Build messages from state
    messages = self._get_messages(state)

    # 2. Get tools
    tools = self._get_tools()

    # 3. Call LLM
    response = self.llm.completion(messages=messages, tools=tools)

    # 4. Parse response to actions
    actions = response_to_actions(response)

    # 5. Return actions for runtime to execute
    return actions
```

**Problems:**
- ❌ Custom agent loop (step-by-step)
- ❌ Manual tool calling
- ❌ Manual action execution coordination
- ❌ LiteLLM dependency

### Target Architecture (Claude Agent SDK)

**Approach 1: Simplified Agent (Delegate to Claude Code)**

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

class SimplifiedCodeActAgent:
    def __init__(self, config):
        self.options = ClaudeAgentOptions(
            allowed_tools=["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
            cwd=config.workspace_base,
            system_prompt=self._load_system_prompt(),
            permission_mode="acceptEdits",
            max_turns=config.max_iterations
        )

    async def execute_task(self, task_description: str) -> str:
        """Execute task by delegating to Claude Code."""
        async with ClaudeSDKClient(options=self.options) as client:
            await client.query(task_description)

            result = ""
            async for message in client.receive_response():
                # Process messages
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result += block.text

                # Check for completion
                if isinstance(message, ResultMessage):
                    break

            return result
```

**Benefits:**
- ✅ No custom agent loop needed
- ✅ No tool parsing needed
- ✅ No runtime coordination needed
- ✅ Claude Code handles everything automatically

**Approach 2: Multi-Turn Orchestration**

```python
class OrchestrationAgent:
    """Higher-level orchestration with Claude Code doing the work."""

    async def solve_issue(self, issue: GitHubIssue) -> PullRequest:
        async with ClaudeSDKClient(options=self.options) as client:
            # Step 1: Analyze issue
            await client.query(f"""
            Analyze this GitHub issue:
            {issue.title}
            {issue.body}

            Read relevant files and understand the problem.
            """)
            async for msg in client.receive_response():
                # Wait for analysis
                pass

            # Step 2: Implement fix
            await client.query("""
            Based on your analysis, implement the fix.
            Make all necessary file changes.
            """)
            async for msg in client.receive_response():
                # Claude Code automatically edits files
                pass

            # Step 3: Verify
            await client.query("""
            Run tests to verify your changes work.
            """)
            async for msg in client.receive_response():
                # Claude Code runs tests
                pass

            # Return modified files for PR
            return self._create_pr()
```

---

## Implementation Phases

### Phase 1: Proof of Concept (Week 1)

**Goal:** Validate Claude Agent SDK can replace OpenHands agent loop

**Tasks:**
- [ ] Install Claude Agent SDK + Claude Code CLI
- [ ] Create simple wrapper using `query()`
- [ ] Test basic file operations (Read, Write, Edit)
- [ ] Test bash commands
- [ ] Compare output to OpenHands CodeActAgent
- [ ] Document gaps and issues

**Deliverables:**
- Working POC script
- Comparison report (OpenHands vs Claude Agent SDK)
- List of custom tools needed

**Success Criteria:**
- ✅ Can execute simple coding tasks
- ✅ File operations work correctly
- ✅ Bash commands execute properly

---

### Phase 2: Custom Tools (Week 2)

**Goal:** Build custom MCP tools for capabilities not in Claude Code

**Tasks:**
- [ ] Implement IPython/Jupyter tool
  - [ ] Kernel management
  - [ ] Code execution
  - [ ] Output capture
- [ ] Implement Browser tool (BrowserGym integration)
  - [ ] Navigate to URL
  - [ ] Extract page content
  - [ ] Perform actions
- [ ] Implement any domain-specific tools (if needed)
- [ ] Test custom tools with Claude Agent SDK
- [ ] Integration test (built-in + custom tools together)

**Deliverables:**
- Custom MCP server implementations
- Tool tests
- Integration examples

**Success Criteria:**
- ✅ Jupyter code execution works
- ✅ Browser interactions work
- ✅ Tools integrate seamlessly with Claude Code

---

### Phase 3: Agent Migration (Week 3)

**Goal:** Replace OpenHands agents with Claude Agent SDK

**Agents:**
1. **ReadOnlyAgent** (Easiest - only uses Read, Grep, Glob)
   - Replace with `query()` using `allowed_tools=["Read", "Grep", "Glob"]`

2. **LocAgent** (Medium - uses code analysis tools)
   - May need custom MCP for advanced analysis
   - Or use Claude Code's built-in tools

3. **CodeActAgent** (Complex - full functionality)
   - Migrate to `ClaudeSDKClient` with all tools
   - Add custom Jupyter tool

4. **BrowsingAgent** (Complex - requires browser tool)
   - Create custom browser MCP
   - Integrate with Claude Code

5. **VisualBrowsingAgent** (Complex - vision required)
   - Use Claude 3.5 Sonnet (vision support)
   - Custom screenshot handling in MCP

**Tasks:**
- [ ] Create base agent wrapper class
- [ ] Migrate each agent
- [ ] Update agent registry
- [ ] Update controller integration
- [ ] Test each agent independently

**Deliverables:**
- 5 agents working with Claude Agent SDK
- Agent wrapper infrastructure
- Updated controller

**Success Criteria:**
- ✅ All agents execute tasks successfully
- ✅ Equivalent or better performance than LiteLLM version
- ✅ Tests pass

---

### Phase 4: Controller & Infrastructure (Week 4)

**Goal:** Update AgentController and surrounding infrastructure

**Tasks:**
- [ ] Update AgentController
  - Remove LLM wrapper dependency
  - Simplify state management
  - Update error handling
- [ ] Update or remove Runtime (may not be needed)
- [ ] Simplify observation handling
- [ ] Update metrics/logging
- [ ] Remove LiteLLM dependencies
- [ ] Update configuration

**Deliverables:**
- Simplified AgentController
- Updated configuration system
- Migration guide for users

**Success Criteria:**
- ✅ Controller orchestrates Claude Agent SDK
- ✅ Error handling robust
- ✅ Metrics accurate

---

### Phase 5: Testing & Optimization (Week 5)

**Goal:** Comprehensive testing and performance optimization

**Tasks:**
- [ ] Unit tests for all agents
- [ ] Integration tests
- [ ] End-to-end tests (SWE-bench, etc.)
- [ ] Performance benchmarking
- [ ] Cost analysis
- [ ] Documentation updates
- [ ] Migration guide for users
- [ ] Clean up old code

**Deliverables:**
- Complete test suite
- Performance report
- Cost analysis
- Documentation
- Clean codebase (no LiteLLM)

**Success Criteria:**
- ✅ All tests pass
- ✅ Performance ≥ current
- ✅ Documentation complete

---

## Code Examples

### Example 1: Simple Task with query()

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async def analyze_codebase():
    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob"],
        cwd="/path/to/project",
        system_prompt="You are a code analyzer"
    )

    async for message in query(
        prompt="Find all security vulnerabilities in this codebase",
        options=options
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(block.text)
        elif isinstance(message, ToolUseBlock):
            print(f"Using tool: {block.name}")
```

### Example 2: Multi-Turn Conversation with ClaudeSDKClient

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async def implement_feature():
    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Write", "Edit", "Bash"],
        cwd="/path/to/project",
        permission_mode="acceptEdits"
    )

    async with ClaudeSDKClient(options=options) as client:
        # Step 1: Understand codebase
        await client.query("Read and understand the codebase structure")
        async for msg in client.receive_response():
            pass  # Claude reads files automatically

        # Step 2: Implement
        await client.query("""
        Implement a new feature for user authentication.
        Create necessary files and update existing ones.
        """)
        async for msg in client.receive_response():
            pass  # Claude edits files automatically

        # Step 3: Test
        await client.query("Run the tests to verify the implementation")
        async for msg in client.receive_response():
            if isinstance(msg, ResultMessage):
                print("Feature implementation complete!")
```

### Example 3: Custom Jupyter Tool

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeSDKClient

@tool(
    "execute_python",
    "Execute Python code in Jupyter kernel",
    {"code": str}
)
async def execute_python(args):
    # Simplified - actual implementation would manage Jupyter kernel
    import subprocess

    result = subprocess.run(
        ["python", "-c", args["code"]],
        capture_output=True,
        text=True
    )

    return {
        "content": [{
            "type": "text",
            "text": f"Output:\n{result.stdout}\nErrors:\n{result.stderr}"
        }]
    }

# Create MCP server
jupyter_server = create_sdk_mcp_server(
    name="jupyter",
    version="1.0.0",
    tools=[execute_python]
)

# Use with Claude
async def run_data_analysis():
    options = ClaudeAgentOptions(
        mcp_servers={"jupyter": jupyter_server},
        allowed_tools=["Read", "mcp__jupyter__execute_python"],
        cwd="/path/to/project"
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query("""
        Analyze the data in data.csv using Python.
        Read the file, then use execute_python to perform analysis.
        """)

        async for msg in client.receive_response():
            print(msg)
```

### Example 4: Permission Control with Hooks

```python
async def permission_handler(tool_name, input_data, context):
    """Custom permission logic."""
    # Block writes to critical files
    if tool_name == "Write":
        file_path = input_data.get("file_path", "")
        if file_path.startswith("/etc/"):
            return {
                "behavior": "deny",
                "message": "Cannot write to system files",
                "interrupt": True
            }

    # Allow everything else
    return {"behavior": "allow", "updatedInput": input_data}

async def safe_execution():
    options = ClaudeAgentOptions(
        allowed_tools=["Read", "Write", "Bash"],
        can_use_tool=permission_handler,
        permission_mode="ask"
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query("Implement the feature")
        async for msg in client.receive_response():
            print(msg)
```

---

## Risk Assessment

### High Risks 🔴

#### 1. **Architectural Paradigm Shift**
**Risk:** Moving from custom agent loop to delegating to Claude Code is fundamentally different.

**Impact:** High - requires rethinking entire agent architecture

**Mitigation:**
- Start with POC to validate approach
- Test with simple agents first (ReadOnlyAgent)
- Keep OpenHands controller for orchestration
- Gradual migration agent by agent

#### 2. **Custom Tool Gaps**
**Risk:** Claude Code may not support all OpenHands tools (Jupyter, BrowserGym).

**Impact:** Medium - need to build custom MCP tools

**Mitigation:**
- Identify gaps early (Phase 1)
- Build custom MCP tools (Phase 2)
- Test thoroughly before full migration
- Fallback: keep hybrid approach if needed

#### 3. **Dependency on Claude Code CLI**
**Risk:** Requires Node.js and Claude Code CLI to be installed.

**Impact:** Medium - deployment complexity

**Mitigation:**
- Document installation requirements clearly
- Create Docker image with all dependencies
- Provide setup scripts
- Consider fallback to direct API if CLI unavailable

### Medium Risks 🟡

#### 4. **Performance Differences**
**Risk:** Claude Code agent loop may be slower/faster than OpenHands.

**Impact:** Medium - could affect user experience

**Mitigation:**
- Benchmark early (Phase 1)
- Optimize prompt engineering
- Use streaming for better perceived performance
- Tune max_turns and other parameters

#### 5. **Control Loss**
**Risk:** Less fine-grained control over agent steps.

**Impact:** Low-Medium - may affect specific use cases

**Mitigation:**
- Use hooks for deterministic processing
- Use permission handlers for control
- Keep hybrid option for critical use cases
- Multi-turn orchestration for complex workflows

#### 6. **Testing Complexity**
**Risk:** Testing becomes harder with external CLI dependency.

**Impact:** Medium - slower CI/CD, harder to mock

**Mitigation:**
- Create mock ClaudeSDKClient for tests
- Use Docker for consistent test environment
- Separate integration tests from unit tests
- Keep good test coverage

### Low Risks 🟢

#### 7. **Migration Effort**
**Risk:** Takes longer than estimated.

**Impact:** Low - doesn't block current functionality

**Mitigation:**
- Phased approach (5 weeks)
- Parallel development (keep LiteLLM working)
- Feature flags for gradual rollout

---

## Success Criteria

### Functional Requirements
- ✅ All 5 agents work with Claude Agent SDK (6th is DummyAgent, no changes)
- ✅ Custom tools (Jupyter, Browser) work via MCP
- ✅ File operations (Read, Write, Edit) work correctly
- ✅ Bash commands execute properly
- ✅ Multi-turn conversations maintain context
- ✅ Error handling robust
- ✅ Permission control works

### Performance Requirements
- ✅ Task completion time ≤ current (or within 20%)
- ✅ Response latency acceptable (< 2s for simple queries)
- ✅ Streaming works smoothly
- ✅ Cost per task ≤ current (ideally better with prompt caching)

### Quality Requirements
- ✅ Test coverage ≥ 85%
- ✅ All integration tests pass
- ✅ SWE-bench evaluation success rate ≥ current
- ✅ Documentation complete
- ✅ Migration guide available

### Deployment Requirements
- ✅ Docker image includes all dependencies
- ✅ Setup script works on Linux, macOS
- ✅ Clear installation documentation
- ✅ Health checks work

---

## Migration Checklist

### Prerequisites
- [ ] Install Node.js (v16+)
- [ ] Install Claude Code CLI: `npm install -g @anthropic-ai/claude-code`
- [ ] Install Claude Agent SDK: `pip install claude-agent-sdk`
- [ ] Verify Claude Code works: `claude-code --version`
- [ ] Get Anthropic API key

### Phase 1: POC (Week 1)
- [ ] Create POC script with `query()`
- [ ] Test Read, Write, Edit tools
- [ ] Test Bash tool
- [ ] Compare with OpenHands CodeActAgent
- [ ] Document gaps and custom tools needed
- [ ] Decide on migration approach (A, B, or C)

### Phase 2: Custom Tools (Week 2)
- [ ] Design Jupyter MCP tool
- [ ] Implement Jupyter tool with `@tool` decorator
- [ ] Test Jupyter tool independently
- [ ] Design Browser MCP tool
- [ ] Implement Browser tool
- [ ] Test Browser tool independently
- [ ] Create `create_sdk_mcp_server()` for each
- [ ] Integration test with Claude Code

### Phase 3: Agents (Week 3)
- [ ] Create base agent wrapper class
- [ ] Migrate ReadOnlyAgent
- [ ] Test ReadOnlyAgent
- [ ] Migrate LocAgent
- [ ] Test LocAgent
- [ ] Migrate CodeActAgent
- [ ] Test CodeActAgent
- [ ] Migrate BrowsingAgent (with custom tool)
- [ ] Test BrowsingAgent
- [ ] Migrate VisualBrowsingAgent (with vision)
- [ ] Test VisualBrowsingAgent

### Phase 4: Infrastructure (Week 4)
- [ ] Update AgentController
- [ ] Simplify/remove Runtime (if delegating to Claude Code)
- [ ] Update state management
- [ ] Update error handling
- [ ] Update metrics/logging
- [ ] Remove LiteLLM dependencies
- [ ] Update configuration system
- [ ] Create migration guide

### Phase 5: Testing (Week 5)
- [ ] Write unit tests for all agents
- [ ] Write integration tests
- [ ] Run SWE-bench evaluation
- [ ] Run WebArena evaluation
- [ ] Performance benchmarking
- [ ] Cost analysis
- [ ] Update documentation
- [ ] Code cleanup
- [ ] Final review

---

## Additional Resources

### Documentation
- [Claude Agent SDK Python Reference](https://docs.claude.com/en/api/agent-sdk/python)
- [Claude Agent SDK GitHub](https://github.com/anthropics/claude-agent-sdk-python)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [MCP Documentation](https://modelcontextprotocol.io/)

### Examples
- [Quick Start Example](https://github.com/anthropics/claude-agent-sdk-python/blob/main/examples/quick_start.py)
- [Streaming Mode Example](https://github.com/anthropics/claude-agent-sdk-python/blob/main/examples/streaming_mode.py)
- [Custom Tools Example](https://github.com/anthropics/claude-agent-sdk-python/blob/main/examples/custom_tools.py)

---

## Conclusion

Converting OpenHands to Claude Agent SDK represents a significant architectural shift from a **custom agent implementation** to **leveraging Claude Code's built-in agentic capabilities**.

**Key Decision Points:**

1. **Full Delegation (Option A)** vs Hybrid vs Adapter
   - **Recommendation:** Start with Full Delegation for simplification
   - Can always add custom logic later if needed

2. **Custom Tools**
   - Need: Jupyter, Browser (and maybe others)
   - Solution: In-process MCP servers with `@tool` decorator

3. **Migration Strategy**
   - **Recommendation:** Phased approach over 5 weeks
   - Start with POC, build custom tools, migrate agents, update infrastructure, test

**Expected Benefits:**
- ✅ **Massive simplification** (remove agent loop, tool system, runtime)
- ✅ **Better performance** (Claude Code is optimized)
- ✅ **Easier maintenance** (less custom code)
- ✅ **Focus on value-add** (domain logic, UI, evaluation)

**Timeline:** 5 weeks with dedicated effort

**Status:** ✅ Ready to begin Phase 1 (POC)

---

**Document Version:** 2.0
**Last Updated:** 2025-11-08
**Next Review:** After Phase 1 POC completion
