# OpenHands Complete Analysis & Conversion Plan - Index

**Date:** 2025-11-08
**Project:** OpenHands → **Claude Agent SDK** Conversion
**Status:** ✅ Analysis Complete, Ready for Implementation

---

## ⚠️ IMPORTANT: Claude Agent SDK vs Claude API SDK

This analysis targets the **Claude Agent SDK** (`claude-agent-sdk`), which is fundamentally different from the regular Anthropic Claude API SDK:

| Aspect | Claude API SDK | Claude Agent SDK |
|--------|---------------|------------------|
| **Purpose** | Direct API calls to Claude | **Programmatic control of Claude Code CLI** |
| **Installation** | `pip install anthropic` | `pip install claude-agent-sdk` + Node.js + Claude Code CLI |
| **Dependencies** | None (just API key) | **Requires `@anthropic-ai/claude-code` (npm)** |
| **Architecture** | Your code → Anthropic API → Claude model | **Your code → Claude Code CLI → Claude (with built-in tools)** |
| **Tools** | Define with API tool format | **Uses Claude Code's built-in tools + custom MCP tools** |
| **Agent Loop** | You implement | **Claude Code implements** |
| **Use Case** | Building custom AI applications | **Wrapping/extending Claude Code programmatically** |

**Key Insight:** Claude Agent SDK is a Python wrapper around the Claude Code CLI tool, giving you programmatic access to Claude Code's complete agentic capabilities.

---

## 📋 Document Index

This folder contains comprehensive analysis and conversion planning for migrating OpenHands from LiteLLM to Claude Agent SDK.

### Core Documents

#### 1. **OPENHANDS_TO_CLAUDE_AGENT_SDK_CONVERSION_PLAN.md** 🔴 PRIMARY DOCUMENT
**[Start Here - Complete Conversion Plan with Claude Agent SDK]**
- Executive summary and architectural paradigm shift
- **Claude Agent SDK** API reference (query, ClaudeSDKClient, tools, MCP)
- Three conversion approaches (Full Delegation, Hybrid, Adapter)
- **Recommended: Full Delegation** - leverage Claude Code's built-in capabilities
- Tool mapping (OpenHands tools → Claude Code built-in tools + custom MCP)
- 5-phase implementation plan
- Custom MCP tool examples (Jupyter, Browser)
- Testing strategy
- Risk assessment
- Complete checklists

**Who should read:** Engineers implementing the conversion, project managers, technical leads

**Key Difference:** This plan advocates for **delegating to Claude Code** rather than just replacing the LLM API calls.

---

#### 2. **CONVERSION_ARCHITECTURE_MAP.md** 🟡 TECHNICAL REFERENCE
**[Architecture & Dependencies - Pre-Agent SDK]**
- Complete dependency graph
- Agent inheritance hierarchy
- Data flow diagrams
- Tool execution flow
- Message format transformations
- Critical integration points
- Conversion order priorities

**Note:** This document was created before the Claude Agent SDK update. The architecture will be **significantly simpler** with Claude Agent SDK as most components can be removed.

**Who should read:** Architects, senior engineers planning the migration

---

#### 3. **OPENHANDS_TO_CLAUDE_SDK_CONVERSION_PLAN.md** 🟢 DEPRECATED
**[Original Plan - Claude API SDK]**
- Initial conversion strategy (before Claude Agent SDK)
- Targeted regular Claude API SDK (not Agent SDK)
- Component mapping (LiteLLM → Claude SDK)

**Status:** ⚠️ DEPRECATED - Superseded by Agent SDK plan

**Why deprecated:** The Claude Agent SDK approach is fundamentally different and more appropriate for OpenHands use case.

---

### Supporting Documents

#### 4. **OPENHANDS_ARCHITECTURE_REPORT.md**
**[General Architecture Overview]**
- OpenHands system architecture
- Core components
- Agent lifecycle
- Runtime architecture

#### 5. **LITELLM_ARCHITECTURE_ANALYSIS.md**
**[LiteLLM Integration Details]**
- How LiteLLM is used in OpenHands
- Integration patterns
- Dependencies

#### 6. **ANALYSIS_SUMMARY.md**
**[Quick Summary]**
- High-level findings
- Key statistics

#### 7. **LLM_QUICK_REFERENCE.md**
**[LLM Layer Reference]**
- Quick reference for LLM wrapper
- Configuration options

---

## 🎯 Quick Start Guide

### For Project Managers
1. Read: **OPENHANDS_TO_CLAUDE_AGENT_SDK_CONVERSION_PLAN.md** (Executive Summary)
2. **Key Decision:** Full Delegation to Claude Code (removes most of OpenHands agent infrastructure)
3. Timeline: 5 weeks, 5 phases
4. Risk level: Medium-High (architectural paradigm shift, but major simplification)
5. **Benefits:** Massive code reduction, leverage Claude Code's optimized agent loop

### For Tech Leads
1. Read: **OPENHANDS_TO_CLAUDE_AGENT_SDK_CONVERSION_PLAN.md** (Full Plan)
2. Understand: Claude Agent SDK wraps Claude Code CLI (not just API calls)
3. **Key Insight:** Can remove entire agent loop, tool system, runtime (Claude Code provides these)
4. Review: Tool mapping (most map to Claude Code built-in tools)
5. Plan: 5-phase migration with POC first

### For Developers
1. Read: **OPENHANDS_TO_CLAUDE_AGENT_SDK_CONVERSION_PLAN.md** (Implementation sections)
2. Install: `pip install claude-agent-sdk` + `npm install -g @anthropic-ai/claude-code`
3. Start: Phase 1 POC (Week 1)
4. Build: Custom MCP tools for Jupyter, Browser (Week 2)
5. Migrate: Agents one by one (Week 3)
6. Follow: Checklists in main document

---

## 📊 Analysis Summary

### Architectural Paradigm Shift

**Current (OpenHands + LiteLLM):**
```
OpenHands implements:
  ✅ Custom agent loop (step-by-step execution)
  ✅ Tool definitions (bash, ipython, editor, etc.)
  ✅ Function calling (tool call parsing)
  ✅ State management (observations, actions)
  ✅ Runtime (sandbox execution)
  ✅ LLM wrapper (LiteLLM)
```

**Target (OpenHands + Claude Agent SDK):**
```
Claude Code implements:
  ✅ Agent loop (automatic)
  ✅ Built-in tools (Read, Write, Edit, Bash, Glob, Grep, etc.)
  ✅ Function calling (automatic)
  ✅ Sandbox execution (built-in)
  ✅ LLM calls (built-in)

OpenHands focuses on:
  🎯 High-level orchestration
  🎯 Domain logic (SWE-bench, WebArena)
  🎯 Custom tools (Jupyter, Browser via MCP)
  🎯 Evaluation and metrics
```

**Impact:** ~60-70% code reduction in agent infrastructure!

---

### Scope of Conversion

**Agents to Convert:**
- ✅ CodeActAgent → Delegate to Claude Code + custom Jupyter MCP
- ✅ ReadOnlyAgent → Simple delegation (Read, Grep, Glob tools only)
- ✅ LocAgent → Delegation or custom MCP
- ✅ BrowsingAgent → Custom Browser MCP + Claude Code
- ✅ VisualBrowsingAgent → Vision support + custom Browser MCP
- ✅ DummyAgent → No changes (no LLM)

**Custom Tools Needed (via MCP):**
- 🔧 Jupyter/IPython tool (Claude Code doesn't have built-in Jupyter)
- 🔧 Browser tool (BrowserGym integration)
- 🔧 Maybe others (depending on domain requirements)

**Tools Provided by Claude Code (no custom needed):**
- ✅ Read, Write, Edit (file operations)
- ✅ Bash (command execution)
- ✅ Glob, Grep (file search)
- ✅ Task (subagent delegation)

**LiteLLM Functions → Claude Agent SDK:**
- `litellm.completion()` → `ClaudeSDKClient.query()` or `query()`
- All other LLM abstractions → Removed (Claude Code handles)

---

## 🏗️ Architecture Overview

### Current Flow (LiteLLM)
```
User Input
    ↓
AgentController
    ↓
Agent.step() [Custom agent loop]
    ↓
LLM.completion() [LiteLLM wrapper]
    ↓
litellm.completion() [Multi-provider API]
    ↓
Claude API / OpenAI API / etc.
    ↓
Parse response → Create Actions
    ↓
Runtime executes actions
    ↓
Return observations
    ↓
Loop back to Agent.step()
```

### Target Flow (Claude Agent SDK)
```
User Input
    ↓
Simplified Controller
    ↓
ClaudeSDKClient.query(prompt)
    ↓
Claude Code CLI
    ├─ Agent loop (built-in)
    ├─ Tool execution (built-in)
    ├─ Sandbox (built-in)
    └─ Claude API calls
    ↓
Receive messages (streaming)
    ↓
Process ResultMessage
```

**Key Difference:** Agent loop, tool execution, and runtime are **inside Claude Code**, not in OpenHands!

---

## 📈 Implementation Timeline

### Phase 1: Proof of Concept (Week 1)
- Install Claude Agent SDK and Claude Code CLI
- Create POC with `query()` function
- Test Claude Code's built-in tools
- Compare with OpenHands agents
- **Validate approach**

### Phase 2: Custom Tools (Week 2)
- Build Jupyter MCP tool with `@tool` decorator
- Build Browser MCP tool (BrowserGym)
- Create `create_sdk_mcp_server()` configs
- Test custom tools with Claude Code

### Phase 3: Agent Migration (Week 3)
- Migrate ReadOnlyAgent (easiest)
- Migrate LocAgent
- Migrate CodeActAgent (complex)
- Migrate BrowsingAgent (with custom tool)
- Migrate VisualBrowsingAgent (with vision)

### Phase 4: Infrastructure (Week 4)
- Simplify AgentController
- Remove/simplify Runtime
- Update state management
- Remove LiteLLM dependencies
- Update configuration

### Phase 5: Testing & Cleanup (Week 5)
- Full test suite
- Performance benchmarking
- SWE-bench evaluation
- Documentation
- Code cleanup

---

## ⚠️ Key Risks & Mitigation

### High Risk
1. **Architectural Paradigm Shift** (custom agent → delegate to Claude Code)
   - Mitigation: POC first, gradual migration, keep hybrid option

2. **Custom Tool Gaps** (Jupyter, Browser not in Claude Code)
   - Mitigation: Build MCP tools early (Phase 2), test thoroughly

3. **Dependency on Claude Code CLI** (requires Node.js)
   - Mitigation: Docker image with all deps, clear docs, setup scripts

### Medium Risk
4. **Performance Differences**
   - Mitigation: Benchmark early, optimize prompts, tune parameters

5. **Control Loss** (less fine-grained control over steps)
   - Mitigation: Use hooks, permission handlers, multi-turn orchestration

6. **Testing Complexity** (external CLI dependency)
   - Mitigation: Mock ClaudeSDKClient, Docker tests, good coverage

---

## ✅ Success Criteria

### Functional
- ✅ All 5 agents work with Claude Agent SDK
- ✅ Custom tools (Jupyter, Browser) work via MCP
- ✅ File operations work correctly
- ✅ Multi-turn conversations maintain context
- ✅ Error handling robust

### Performance
- ✅ Task completion time ≤ current (or within 20%)
- ✅ Response latency acceptable
- ✅ Cost ≤ current

### Quality
- ✅ Test coverage ≥ 85%
- ✅ SWE-bench success rate ≥ current
- ✅ Documentation complete

---

## 🔧 Technical Highlights

### Good News
- ✅ Claude Code already implements most of OpenHands functionality
- ✅ Massive simplification possible (remove ~60% of agent code)
- ✅ Built-in tools match most OpenHands tools
- ✅ Better performance from optimized Claude Code agent loop

### Challenges
- ⚠️ Architectural shift (delegation vs custom loop)
- ⚠️ Need custom MCP tools (Jupyter, Browser)
- ⚠️ External dependency (Claude Code CLI + Node.js)
- ⚠️ Testing with external CLI

### Opportunities
- 🎯 Focus on domain logic (SWE-bench, WebArena)
- 🎯 Leverage Claude Code's optimizations
- 🎯 Simpler codebase, easier maintenance
- 🎯 Better user experience (Claude Code is polished)

---

## 📚 Key Files in This Analysis

### Must Read
1. **OPENHANDS_TO_CLAUDE_AGENT_SDK_CONVERSION_PLAN.md** - Complete plan with Agent SDK
2. This file (index) - Quick reference

### Reference
3. **CONVERSION_ARCHITECTURE_MAP.md** - Detailed architecture (pre-Agent SDK, still useful)
4. Supporting docs - Architecture reports, LiteLLM analysis

---

## 🚀 Next Actions

### Immediate (This Week)
- [ ] Install Claude Agent SDK: `pip install claude-agent-sdk`
- [ ] Install Claude Code CLI: `npm install -g @anthropic-ai/claude-code`
- [ ] Verify installation: `claude-code --version`
- [ ] Get Anthropic API key
- [ ] Create POC script (Week 1 - Phase 1)

### Week 1
- [ ] Test `query()` function with simple prompts
- [ ] Test Claude Code's Read, Write, Edit, Bash tools
- [ ] Compare output with OpenHands CodeActAgent
- [ ] Document gaps and custom tool requirements
- [ ] **Decision point:** Validate Full Delegation approach

### Week 2-5
- [ ] Follow phase-by-phase plan
- [ ] Build custom MCP tools
- [ ] Migrate agents
- [ ] Update infrastructure
- [ ] Test and deploy

---

## 📞 Resources

### Documentation
- [Claude Agent SDK API Reference](https://docs.claude.com/en/api/agent-sdk/python)
- [Claude Agent SDK GitHub](https://github.com/anthropics/claude-agent-sdk-python)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [MCP Documentation](https://modelcontextprotocol.io/)

### Installation
```bash
# Python SDK
pip install claude-agent-sdk

# Claude Code CLI (requires Node.js)
npm install -g @anthropic-ai/claude-code

# Verify
claude-code --version
```

### Quick Test
```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="List all Python files in current directory",
    options=ClaudeAgentOptions(allowed_tools=["Glob"])
):
    print(message)
```

---

## 📝 Document History

- **2025-11-08 (v2.0)**: Updated for Claude Agent SDK
  - Complete rewrite targeting Claude Agent SDK (not API SDK)
  - Added Full Delegation approach
  - Updated tool mapping (Claude Code built-in tools)
  - Added custom MCP tool strategy
  - Updated timeline to 5 phases

- **2025-11-08 (v1.0)**: Initial comprehensive analysis
  - Agenthub structure analyzed
  - All LiteLLM usage documented
  - Dependencies mapped
  - Original conversion plan (Claude API SDK)

---

## 🎓 Conclusion

The OpenHands to **Claude Agent SDK** conversion represents a **major architectural simplification**. Instead of replacing just the LLM API layer, we can **delegate the entire agent loop** to Claude Code.

**Key Paradigm Shift:**
- **Before:** OpenHands implements agent loop, tools, runtime
- **After:** Claude Code implements agent loop, tools, runtime; OpenHands orchestrates

**Benefits:**
- ✅ ~60% code reduction in agent infrastructure
- ✅ Better performance (Claude Code is optimized)
- ✅ Easier maintenance (less custom code)
- ✅ Focus on value-add (domain logic, UI, evaluation)

**Recommendation:** **Proceed with Full Delegation (Option A)**

**Timeline:** 5 weeks

**Status:** ✅ Planning Complete - Ready for Phase 1 POC

---

**Status:** ✅ Analysis Complete - Ready for Implementation
**Next Step:** Begin Phase 1 (POC with Claude Agent SDK)
**Primary Document:** OPENHANDS_TO_CLAUDE_AGENT_SDK_CONVERSION_PLAN.md
