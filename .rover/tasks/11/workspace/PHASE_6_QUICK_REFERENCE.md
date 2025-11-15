# Phase 6 SDK Integration: Quick Reference

## Critical Information at a Glance

### The Three Options

```
OPTION 1: Modify AgentController (REJECTED)
  ❌ Bad: Violates Open/Closed, tight coupling, not extensible

OPTION 2: Enhance OrchestratorAdapter (SELECTED)
  ✅ Good: Clean separation, backward compatible, future-proof

OPTION 3: Create SDKController (REJECTED)
  ❌ Bad: Code duplication, maintenance nightmare
```

### The Recommendation

**Use Option 2: Route SDK agents through enhanced OrchestratorAdapter**

Do NOT modify AgentController. Keep it as-is for stability and clarity.

---

## Critical Code Locations

### Agent.step() - The Integration Point (MOST IMPORTANT)

```python
# File: agent_controller.py, line 901
action = self.agent.step(self.state)
```

This single line is where SDK agents integrate. The controller doesn't care if step() uses:
- LiteLLM (legacy agents)
- Claude SDK (SDK agents)
- Future LLM provider (future agents)

**Key Insight:** This abstraction is PERFECT. Don't break it.

### SDK Agent Example

```python
# File: codeact_agent/codeact_agent_sdk.py
class CodeActAgentSDK(Agent):
    def step(self, state: State) -> Action:
        action = run_async(self.adapter.execute_step(state))
        return action  # Same interface as legacy agents
```

### Agent Factory

```python
# File: agenthub/agent_factory.py
agent = AgentFactory.create_agent(
    "CodeActAgent", 
    config, 
    llm_registry,
    use_sdk=True  # SDK version, or False for legacy
)
```

---

## What Goes Where

### AgentController (Leave Unchanged)

**Current Responsibilities:**
- Lifecycle management
- State transitions
- Event handling
- Stuck detection
- Delegation
- Security analysis
- Error handling

**Status:** ✅ PERFECT AS-IS

### OrchestratorAdapter (Enhance)

**New Responsibilities:**
- Unified control plane
- Route to controller or SDK
- Unified error handling
- Unified metrics

**Status:** 🔧 NEEDS WORK (50% complete)

**Current:** 367 lines
**After Phase 6:** 700 lines
**New Methods:** `step()`, `get_state()`, `is_complete()`

### New SDKExecutor (Create)

**Responsibilities:**
- SDK-specific control flow
- Stuck detection for SDK
- Control flags for SDK
- Error handling bridge

**Status:** 📋 NEEDS CREATION

**Size:** ~300 lines
**Methods:** `step()`, `handle_error()`, `get_state()`

### New UnifiedErrorHandler (Create)

**Responsibilities:**
- Map LiteLLM errors to OpenHands
- Map Claude SDK errors to OpenHands
- Unified error state transitions

**Status:** 📋 NEEDS CREATION

**Size:** ~150 lines
**Method:** `handle_step_error()`, `_categorize_error()`

---

## Dependency Graph

```
AgentController
  ├─ Agent (abstract)
  │   └─ Subclasses: CodeActAgent, CodeActAgentSDK, etc.
  │
  ├─ StateTracker
  │   └─ State (contains history, metrics, flags)
  │
  ├─ EventStream
  │   └─ All events flow through here
  │
  ├─ StuckDetector
  │   └─ Analyzes history for loops
  │
  └─ ConversationStats
      └─ Tracks metrics

OrchestratorAdapter (NEW)
  ├─ AgentController (for legacy agents)
  ├─ SDKExecutor (for SDK agents)
  ├─ UnifiedErrorHandler
  └─ EventStream
```

**Key:** Both paths share EventStream and State.

---

## Integration Points: Detailed Map

| Component | File | Lines | Purpose | Status |
|-----------|------|-------|---------|--------|
| **Agent.step()** | agent_controller.py | 901 | Critical call point | ✅ Works |
| **State object** | controller/state/state.py | 312 | Shared state model | ✅ Works |
| **EventStream** | events/stream.py | N/A | Event pub/sub | ✅ Works |
| **StateTracker** | state/state_tracker.py | 268 | Persistence | ✅ Works |
| **StuckDetector** | stuck.py | 481 | Loop detection | ✅ Works |
| **OrchestratorAdapter** | orchestrator_adapter.py | 367 | Control plane | ⚠️ Incomplete |
| **ClaudeSDKAdapter** | agenthub/claude_sdk_adapter.py | 443 | SDK bridge | ✅ Works |
| **AgentFactory** | agenthub/agent_factory.py | 390 | Agent creation | ✅ Works |

---

## 4-Week Implementation Roadmap

### Week 1-2: Foundation
- [ ] Enhance OrchestratorAdapter
- [ ] Create SDKExecutor
- [ ] Create UnifiedErrorHandler
- [ ] Unit tests

**Deliverable:** SDK agents work through OrchestratorAdapter

### Week 2-3: Interface
- [ ] Extend State for SDK metadata
- [ ] Extend StateTracker
- [ ] Unified error handling integration
- [ ] More unit tests

**Deliverable:** Unified API ready

### Week 3-4: Integration
- [ ] Update AgentSession.start()
- [ ] Unified metrics collection
- [ ] Feature flags
- [ ] Integration tests

**Deliverable:** Production ready

### Week 4-5: Testing & Release
- [ ] E2E tests
- [ ] Performance testing
- [ ] Documentation
- [ ] Release prep

**Deliverable:** Phase 6 complete

---

## Files Changed Summary

```
NEW FILES (3):
  sdk_executor.py          [300 lines] - SDK control flow
  agent_detector.py        [50 lines]  - Detect agent type
  error_handler.py         [150 lines] - Unified errors

MODIFIED FILES (7):
  orchestrator_adapter.py  [+333 lines] - Core enhancement
  state/state.py          [+20 lines]   - SDK metadata
  state/state_tracker.py  [+30 lines]   - SDK tracking
  agent_session.py        [+50 lines]   - Routing logic
  core/loop.py            [+30 lines]   - Loop updates
  (agent_controller.py     [NO CHANGE]   - Keep as-is!)
  (agent.py               [NO CHANGE]   - Perfect interface)

TEST FILES (NEW):
  test_orchestrator_adapter.py   [300 lines] - 15 unit tests
  test_sdk_integration.py        [400 lines] - 20 integration tests
  test_sdk_agents_e2e.py         [150 lines] - 5 e2e tests
```

**CRITICAL:** Do NOT modify agent_controller.py or agent.py. They are perfect.

---

## Risk Mitigation Checklist

```
TECHNICAL RISKS:
[ ] Async/await mismatch → Comprehensive testing
[ ] State corruption → Snapshot validation
[ ] SDK errors → UnifiedErrorHandler
[ ] Performance → Benchmarking

OPERATIONAL RISKS:
[ ] Breaking changes → None planned (additive only)
[ ] Monitoring gaps → Metrics in place
[ ] Deployment issues → Feature flags
[ ] Customer confusion → Clear documentation

TESTING:
[ ] 50+ unit tests
[ ] 20+ integration tests
[ ] 5+ e2e tests
[ ] 90%+ coverage on new code
[ ] No regression on existing code
```

---

## Success Criteria (Check Before Release)

```
FUNCTIONAL:
[ ] SDK agents work with OrchestratorAdapter
[ ] Legacy agents work with AgentController (unchanged)
[ ] Mixed delegation works (legacy → SDK → legacy)
[ ] Error handling unified
[ ] Metrics tracking works
[ ] State persistence works

QUALITY:
[ ] 90%+ coverage on new code
[ ] All tests passing
[ ] No performance regression
[ ] No memory leaks
[ ] Code review approved

DOCUMENTATION:
[ ] Architecture docs updated
[ ] Migration guide written
[ ] API docs updated
[ ] Troubleshooting guide done

OPERATIONAL:
[ ] Metrics/monitoring in place
[ ] Feature flags working
[ ] Fallback mechanisms tested
[ ] Rollout plan ready
```

---

## Key Decisions Already Made

| Decision | Status | Reasoning |
|----------|--------|-----------|
| Keep AgentController unchanged | ✅ Final | Perfect abstraction, no need to modify |
| Use OrchestratorAdapter (not new SDKController) | ✅ Final | Avoids code duplication |
| SDK agents through OrchestratorAdapter | ✅ Final | Clean separation, future-proof |
| No breaking changes | ✅ Final | Backward compatibility critical |
| Feature flags for rollout | ✅ Final | Gradual adoption path |
| 5-6 week timeline | ✅ Final | Realistic, includes testing |
| 90%+ test coverage | ✅ Final | Quality bar for new code |

---

## What We're NOT Changing

```
✅ AgentController.py - KEEP AS-IS
   - Event handling
   - State transitions  
   - Control loop
   - Delegation
   - Error handling
   
✅ Agent base class - KEEP AS-IS
   - step() interface
   - reset() method
   - get_system_message()
   
✅ State object - KEEP MOSTLY (add SDK fields only)
   - Core fields unchanged
   - Add: agent_type, sdk_metadata
   
✅ EventStream - KEEP AS-IS
   - Perfect event pub/sub
   - Works for both agent types
```

---

## What We ARE Changing

```
🔧 OrchestratorAdapter - COMPLETE IT
   + Add agent type detection
   + Add unified step() method
   + Add error handling
   + Add metrics aggregation
   + Route SDK vs legacy

📋 Create SDKExecutor - NEW
   + SDK-specific control flow
   + Stuck detection
   + Control flags
   + Error bridge

📋 Create UnifiedErrorHandler - NEW
   + Map LiteLLM → OpenHands
   + Map SDK → OpenHands
   + Unified state transitions

🔧 Update AgentSession - MINIMAL
   + Detect agent type
   + Route to executor
   + Unify main loop

📋 Create Tests - NEW
   + 50+ unit tests
   + 20+ integration tests
   + 5+ e2e tests
```

---

## One-Page Brain Dump

**THE PROBLEM:** SDK agents work but aren't optimized. How to integrate them?

**THE SOLUTION:** Enhance OrchestratorAdapter to be unified control plane.

**HOW IT WORKS:**
1. User creates SDK agent (or legacy agent)
2. OrchestratorAdapter detects type
3. Routes to appropriate executor:
   - Legacy → AgentController (existing path)
   - SDK → SDKExecutor (new path)
4. Both use same State, EventStream, events
5. Unified error handling, metrics

**TIMELINE:** 5-6 weeks, 1-2 engineers

**EFFORT:** ~1500 lines of code (creation + tests)

**RISK:** Medium (testing mitigates)

**VALUE:** High (unifies agents, enables new capabilities)

**DECISION:** Start implementing week 1.

---

## Contact Points

**Questions about architecture?**
- See: PHASE_6_ANALYSIS.md Section 1, 4
- Key: AgentController is solid, extend OrchestratorAdapter

**Questions about implementation?**
- See: PHASE_6_ANALYSIS.md Section 5
- Key: 4 phases, week-by-week plan

**Questions about risk?**
- See: PHASE_6_ANALYSIS.md Section 8
- Key: Comprehensive testing + feature flags

**Questions about testing?**
- See: PHASE_6_ANALYSIS.md Section 7
- Key: 90%+ coverage, test pyramid

---

## Last Updated

Analysis Date: 2025-11-08
Status: Ready for implementation
Next Step: Architecture review & approval

