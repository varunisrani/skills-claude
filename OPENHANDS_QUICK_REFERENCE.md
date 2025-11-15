# OpenHands Quick Reference Guide

## What is OpenHands?

**OpenHands** is an open-source AI development platform ("Code Less, Make More") that enables AI agents to autonomously perform software development tasks.

**Key Capabilities:**
- Code modification and refactoring
- Command execution
- Web browsing and API interactions
- Test execution and analysis
- Feature implementation

---

## Claude Agent SDK Integration

### Architecture
```
Custom Agent Loop (15,000 LOC) → Claude SDK Integration (1,400 LOC) → Claude API
```

### Key Achievement
- **91% code reduction** while maintaining all functionality
- Massive simplification of agent orchestration
- Built-in optimizations and better error handling

---

## Core Components

### 1. Agent Hub (`openhands/agent_hub/`, 376 LOC)
**Purpose:** Coordinates 5 specialized AI agents

| Agent | Tools | Use Case |
|-------|-------|----------|
| **Code** | Read, Write, Edit, Bash | Development |
| **Analysis** | Read, Grep, Glob | Code Review |
| **Testing** | Read, Bash | QA |
| **Browser** | Playwright | Web Testing |
| **Python** | Jupyter | Execution |

**Features:**
- Agent caching
- Parallel/sequential execution
- Automatic resource cleanup

### 2. MCP Servers (`openhands/mcp_servers/`, 874 LOC)

**Jupyter MCP** (383 LOC)
- Python code execution
- Multiple kernels
- Kernel management

**Browser MCP** (491 LOC)
- Playwright automation
- Multi-page support
- Element interaction
- Screenshots

### 3. Task Orchestrator (`openhands/orchestrator/`, 494 LOC)
**Workflow Patterns:**
- Simple task execution
- GitHub issue resolution
- Feature implementation
- Parallel execution

---

## Integration Phases

### Phase 1 ✅ (Foundation)
- Agent Hub created
- MCP servers implemented
- Task Orchestrator built
- POC scripts and tests

### Phase 2 ✅ (Integration)
- OrchestratorAdapter for backward compatibility
- SWE-bench and WebArena integration
- CLI and API endpoints
- Comprehensive examples

### Phase 3-4 (Planned)
- Enhanced features (V1.1)
- Performance optimization
- Legacy agent deprecation

---

## Rebranding Plan: VICT

### Project Transformation
```
claude-code-test-runner → varun-israni-claude-tester (VICT)
cc-test-runner          → vict (CLI command)
test-state-server       → vict-state-server
```

### Branding Goals
- Personal attribution to Varun Israni
- Unique identity independent of OpenHands
- Memorable CLI command
- Consistent component naming

### Implementation Status
- Phase 1 (Core): Pending
- Phase 2 (Docs): Pending
- Phase 3 (CI/CD): Pending
- Phase 4 (Polish): Pending

---

## Key Documentation Files

### In OpenHands Directory
1. **CLAUDE_SDK_INTEGRATION_README.md** - Architecture & usage
2. **INTEGRATION_OVERVIEW.md** - Phase 1 & 2 summary
3. **IMPLEMENTATION_SUMMARY.md** - Phase 1 details
4. **PHASE2_INTEGRATION_SUMMARY.md** - Phase 2 details

### In Parent Directory
1. **OPENHANDS_ARCHITECTURE_REPORT.md** - Original design
2. **OPENHANDS_COMPREHENSIVE_ANALYSIS.md** - Full analysis
3. **REBRANDING_PLAN.md** - Complete rebranding strategy
4. **AGENTHUB_SDK_CONVERSION.md** - Agent migration guide

---

## Integration Statistics

| Metric | Value |
|--------|-------|
| Code Integration | 1,809 LOC |
| Code Reduction | 91% |
| Agent Types | 5 |
| MCP Servers | 2 |
| Documentation Files | 15+ |
| Implementation Phases | 2 Complete, 2+ Planned |

---

## Critical Insights

### Architecture Strengths
1. **Simplification** - 91% code reduction
2. **Modularity** - Clean separation of concerns
3. **Compatibility** - 100% backward compatible
4. **Performance** - Built-in optimizations

### Integration Approach
- **Option A: Full Delegation** (chosen)
  - Maximum code reduction
  - Best maintainability
  - Clearest architecture

### Rebranding Significance
- Establishes personal attribution
- Creates independent brand identity
- Positions as comprehensive framework
- Strategy for market adoption

---

## Quick Links

**Main Files:**
- `/home/user/skills-claude/OpenHands/CLAUDE_SDK_INTEGRATION_README.md`
- `/home/user/skills-claude/OpenHands/INTEGRATION_OVERVIEW.md`
- `/home/user/skills-claude/REBRANDING_PLAN.md`
- `/home/user/skills-claude/OPENHANDS_COMPREHENSIVE_ANALYSIS.md` (this analysis)

**Code Locations:**
- Agent Hub: `/home/user/skills-claude/OpenHands/openhands/agent_hub/`
- MCP Servers: `/home/user/skills-claude/OpenHands/openhands/mcp_servers/`
- Orchestrator: `/home/user/skills-claude/OpenHands/openhands/orchestrator/`

---

## Next Steps

**For Understanding the System:**
1. Read `CLAUDE_SDK_INTEGRATION_README.md` (450+ lines)
2. Review `INTEGRATION_OVERVIEW.md` for architecture
3. Study `OPENHANDS_COMPREHENSIVE_ANALYSIS.md` for complete context

**For Implementation:**
1. Review integration patterns in Phase 2
2. Use OrchestratorAdapter for compatibility
3. Follow the migration guide for legacy code
4. Test with both old and new code paths

**For Rebranding (VICT):**
1. Execute Phase 1 core changes
2. Update all documentation
3. Test CI/CD pipelines
4. Plan marketing launch

---

*Last Updated: 2025-11-15*
*Based on analysis of /home/user/skills-claude/OpenHands directory*
