# OpenHands Complete Analysis & Conversion Plan - Index

**Date:** 2025-11-08
**Project:** OpenHands → Claude Agent SDK Conversion
**Status:** ✅ Analysis Complete, Ready for Implementation

---

## 📋 Document Index

This folder contains comprehensive analysis and conversion planning for migrating OpenHands from LiteLLM to Claude Agent SDK.

### Core Documents

#### 1. **OPENHANDS_TO_CLAUDE_SDK_CONVERSION_PLAN.md** 🔴 PRIMARY DOCUMENT
**[Start Here - Complete Conversion Plan]**
- Executive summary and strategy
- Component mapping (LiteLLM → Claude SDK)
- Phase-by-phase implementation plan (4 weeks)
- Agent-specific conversion details
- Tool conversion strategy
- Testing strategy
- Risk assessment
- Complete checklists

**Who should read:** Engineers implementing the conversion, project managers, technical leads

---

#### 2. **CONVERSION_ARCHITECTURE_MAP.md** 🟡 TECHNICAL REFERENCE
**[Architecture & Dependencies]**
- Complete dependency graph
- Agent inheritance hierarchy
- Data flow diagrams
- Tool execution flow
- Message format transformations
- Critical integration points
- Conversion order priorities

**Who should read:** Architects, senior engineers planning the migration

---

#### 3. **LITELLM_TO_CLAUDE_SDK_CONVERSION_STRATEGY.md** 🟢 SUPPLEMENTARY
**[Earlier Strategy Document]**
- Initial conversion strategy (pre-agenthub analysis)
- LiteLLM usage patterns
- Conversion approaches
- Code examples

**Who should read:** Reference only, superseded by main conversion plan

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
1. Read: **OPENHANDS_TO_CLAUDE_SDK_CONVERSION_PLAN.md** (Executive Summary + Timeline)
2. Timeline: 3-4 weeks, 5 phases
3. Risk level: Medium (well-abstracted architecture)
4. Key decision: Proceed with Option A (Full Replacement)

### For Tech Leads
1. Read: **CONVERSION_ARCHITECTURE_MAP.md** (Dependencies + Integration Points)
2. Read: **OPENHANDS_TO_CLAUDE_SDK_CONVERSION_PLAN.md** (Full Plan)
3. Review: Implementation phases and resource requirements
4. Plan: Team allocation for 5 phases

### For Developers
1. Read: **OPENHANDS_TO_CLAUDE_SDK_CONVERSION_PLAN.md** (Component Mapping + Checklists)
2. Reference: **CONVERSION_ARCHITECTURE_MAP.md** for specific components
3. Follow: Phase-by-phase implementation plan
4. Use: Checklists in main document to track progress

---

## 📊 Analysis Summary

### Scope of Conversion

**Agents to Convert:**
- ✅ CodeActAgent (11 tools)
- ✅ ReadOnlyAgent (3 tools)
- ✅ LocAgent (3 tools)
- ✅ BrowsingAgent
- ✅ VisualBrowsingAgent (requires vision support)
- ✅ DummyAgent (no changes needed)

**Files with Direct LiteLLM Dependencies:**
- 🔴 8 primary files requiring conversion
- 🟡 45+ tool definition files
- 🟢 50+ test files requiring updates

**LiteLLM Functions to Replace:**
- `litellm.completion()` → `client.messages.create()`
- `litellm.acompletion()` → `client.messages.create()` (async)
- `litellm.token_counter()` → `anthropic.count_tokens()`
- `litellm_completion_cost()` → Manual calculation
- 4 more utility functions

**LiteLLM Types to Replace:**
- `ModelResponse` → `Message` (Claude SDK)
- `ChatCompletionToolParam` → `ToolParam`
- `ChatCompletionMessageToolCall` → `ToolUseBlock`
- 5 more types

---

## 🏗️ Architecture Overview

### Current Flow (LiteLLM)
```
User Input
    ↓
AgentController
    ↓
Agent.step()
    ↓
LLM.completion() ← [LiteLLM Wrapper]
    ↓
litellm.completion() ← [External Dependency]
    ↓
ModelResponse ← [LiteLLM Type]
    ↓
response_to_actions()
    ↓
Actions → Runtime → Observations
```

### Target Flow (Claude SDK)
```
User Input
    ↓
AgentController
    ↓
Agent.step()
    ↓
LLM.completion() ← [Claude SDK Wrapper]
    ↓
client.messages.create() ← [Anthropic SDK]
    ↓
Message ← [Claude SDK Type]
    ↓
response_to_actions()
    ↓
Actions → Runtime → Observations
```

**Key Difference:** Replace LiteLLM abstraction with direct Claude SDK integration

---

## 📈 Implementation Timeline

### Phase 1: Foundation (Week 1)
- Set up Claude SDK
- Create LLM wrapper
- Message conversion
- Basic tests

### Phase 2: Tool Integration (Week 2)
- Convert 17+ tool definitions
- Update function calling parsers
- Tool execution tests

### Phase 3: Agent Conversion (Week 3)
- Convert 6 agents
- Vision support (VisualBrowsingAgent)
- Agent tests

### Phase 4: Advanced Features (Week 3-4)
- Memory condensers
- Streaming/async
- Prompt caching
- Cost tracking

### Phase 5: Testing & Cleanup (Week 4)
- Full test suite
- Performance benchmarking
- Remove LiteLLM dependencies
- Documentation

---

## ⚠️ Key Risks & Mitigation

### High Risk
1. **Function calling format changes**
   - Mitigation: Extensive unit tests, gradual rollout

2. **Message format incompatibilities**
   - Mitigation: Validation layer, comprehensive tests

### Medium Risk
3. **Performance degradation**
   - Mitigation: Benchmark first, optimize retry logic

4. **Vision model integration**
   - Mitigation: Test early with samples, fallback mode

5. **Cost tracking accuracy**
   - Mitigation: Manual verification, detailed logging

---

## ✅ Success Criteria

### Functional
- ✅ All 6 agents work with Claude SDK
- ✅ All 17+ tools execute correctly
- ✅ Vision support works
- ✅ Streaming/async work
- ✅ Cost tracking accurate

### Performance
- ✅ Response time ≤ current
- ✅ Token usage optimized
- ✅ Cost ≤ current (with caching)

### Quality
- ✅ Test coverage ≥ 90%
- ✅ All existing tests pass
- ✅ No LiteLLM dependencies
- ✅ Documentation complete

---

## 🔧 Technical Highlights

### Good News
- ✅ Architecture already well-abstracted
- ✅ Most code decoupled from LiteLLM
- ✅ Main work in LLM wrapper layer
- ✅ JSON Schema compatible (tools)
- ✅ Existing tests provide safety net

### Challenges
- ⚠️ System message handling (Claude requires separate param)
- ⚠️ Tool format conversion (45+ files)
- ⚠️ Vision/multimodal messages
- ⚠️ Streaming implementation
- ⚠️ Cost calculation updates

### Opportunities
- 🎯 Native prompt caching (cost savings!)
- 🎯 Better Claude integration
- 🎯 Simplified architecture
- 🎯 Improved debugging
- 🎯 First-class vision support

---

## 📚 Key Files to Modify

### Priority 1 (Critical)
1. `openhands/llm/llm.py` (842 lines) - LLM wrapper
2. `openhands/llm/async_llm.py` - Async completions
3. `openhands/core/message.py` - Message format

### Priority 2 (High)
4. `openhands/controller/agent.py` - Base agent class
5. `openhands/agenthub/codeact_agent/function_calling.py` - Response parsing
6. `openhands/llm/fn_call_converter.py` - Tool conversion

### Priority 3 (Medium)
7. All tool files (45+)
8. Agent implementations (6 files)
9. Memory condensers (3 files)
10. Streaming/metrics (3 files)

---

## 🚀 Next Actions

### Immediate (This Week)
- [ ] Set up Claude SDK development environment
- [ ] Get Anthropic API key
- [ ] Create proof of concept (simple completion)
- [ ] Test tool calling basics

### Week 1
- [ ] Implement Phase 1 (Foundation)
- [ ] Create ClaudeLLM wrapper
- [ ] Basic tests passing

### Week 2-4
- [ ] Follow phase-by-phase plan
- [ ] Regular testing and validation
- [ ] Documentation updates

---

## 📞 Resources

### Documentation
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Claude SDK Python](https://github.com/anthropics/anthropic-sdk-python)
- [Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [Vision Guide](https://docs.anthropic.com/claude/docs/vision)

### OpenHands
- [Architecture Docs](https://docs.all-hands.dev)
- [Agent Development](https://docs.all-hands.dev/modules/usage/agents)

---

## 📝 Document History

- **2025-11-08**: Initial comprehensive analysis complete
  - Agenthub structure analyzed
  - All LiteLLM usage documented
  - Dependencies mapped
  - Conversion plan created
  - Architecture documentation complete

---

## 🎓 Conclusion

The OpenHands codebase is **ready for conversion** to Claude Agent SDK. The well-abstracted architecture makes this a **medium-risk, high-reward** migration. With the comprehensive plan and phase-by-phase approach, we can complete the conversion in **3-4 weeks** while maintaining all functionality and improving performance.

**Recommendation: Proceed with Option A (Full Replacement)**

---

**Status:** ✅ Planning Complete - Ready for Implementation
**Next Step:** Begin Phase 1 (Foundation)
