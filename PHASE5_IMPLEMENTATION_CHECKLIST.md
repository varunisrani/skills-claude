# Phase 5: Implementation Checklist

**Decision:** Option C - Split Paths During Migration  
**Status:** Ready to Implement  
**Start Date:** [To Be Determined]  
**Owner:** [To Be Assigned]

---

## PHASE 1: FRAMEWORK SETUP (Weeks 1-2)

### Week 1: Configuration & Core Changes

#### Day 1-2: Update Configuration System
- [ ] Add `use_sdk: bool = True` flag to `AgentConfig`
  - File: `openhands/core/config/agent_config.py`
  - Add docstring explaining both paths
  - Add helper method: `AgentConfig.legacy_agent()`
  - Ensure backward compatibility

- [ ] Update LLMRegistry to document both paths
  - File: `openhands/llm/llm_registry.py`
  - Add comments explaining SDK path doesn't use this
  - Document expected behavior

- [ ] Update type hints in agent factory
  - File: `openhands/agenthub/agent_factory.py`
  - Add @overload for SDK path
  - Add @overload for legacy path

#### Day 3-4: Create Remaining SDK Agents

**VisualBrowsingAgentSDK:**
- [ ] Create `openhands/agenthub/visualbrowsing_agent/visualbrowsing_agent_sdk.py`
  - Extend Agent base class
  - Use ClaudeSDKAdapter
  - Port vision-specific features
  - Configure Browser MCP
  - Add vision capability detection
  - Lines of code: ~350-400 LOC
  - Estimated time: 2 days

- [ ] Key features to include:
  - [ ] Screenshot capture capability
  - [ ] Element interaction
  - [ ] Accessibility tree parsing
  - [ ] Form filling
  - [ ] Multi-page navigation

**LocAgentSDK:**
- [ ] Create `openhands/agenthub/loc_agent/loc_agent_sdk.py`
  - Extend Agent base class
  - Use ClaudeSDKAdapter
  - Minimal features (code location, LOC analysis)
  - ~150-200 LOC
  - Estimated time: 1 day

**DummyAgentSDK:**
- [ ] Create `openhands/agenthub/dummy_agent/agent_sdk.py`
  - Extend Agent base class
  - Use ClaudeSDKAdapter
  - Minimal implementation
  - ~100-150 LOC
  - Estimated time: 0.5 days

#### Day 5: Testing Framework
- [ ] Create test file: `tests/unit/agenthub/test_agent_paths.py`
  - [ ] Parametrize tests with `use_sdk` flag
  - [ ] Test agent creation for both paths
  - [ ] Test agent.step() for both paths
  - [ ] Verify behavior parity
  - [ ] Check output formats match
  - Estimated lines: 300-400 LOC

- [ ] Update existing agent tests
  - File: `tests/unit/agenthub/test_sdk_agents.py`
  - [ ] Add legacy path equivalents
  - [ ] Ensure all SDK tests have legacy mirrors
  - [ ] Document testing approach

- [ ] Create benchmark test
  - File: `tests/performance/test_agent_performance.py`
  - [ ] Compare SDK vs legacy execution time
  - [ ] Track token usage
  - [ ] Track cost differences
  - [ ] Record baseline metrics

### Week 2: Agent Factory & Testing

#### Day 6-7: Update Agent Factory
- [ ] Refactor `openhands/agenthub/agent_factory.py`
  - [ ] Add mapping: agent_type → {sdk: Class, legacy: Class}
  - [ ] Add logic: if config.use_sdk → select SDK class
  - [ ] Implement fallback to legacy if config.use_sdk = False
  - [ ] Add proper error handling
  - [ ] Add logging/debug output
  - [ ] Add docstring explaining both paths

```python
AGENT_CLASSES = {
    'codeact': {
        'sdk': CodeActAgentSDK,
        'legacy': CodeActAgent,
    },
    'browsing': {
        'sdk': BrowsingAgentSDK,
        'legacy': BrowsingAgent,
    },
    'readonly': {
        'sdk': ReadOnlyAgentSDK,
        'legacy': ReadOnlyAgent,
    },
    'loc': {
        'sdk': LocAgentSDK,
        'legacy': LocAgent,
    },
    'visualbrowsing': {
        'sdk': VisualBrowsingAgentSDK,
        'legacy': VisualBrowsingAgent,
    },
    'dummy': {
        'sdk': DummyAgentSDK,
        'legacy': DummyAgent,
    },
}
```

#### Day 8: Enhanced Testing
- [ ] Run all unit tests (both paths)
  - [ ] Test SDK agents
  - [ ] Test legacy agents
  - [ ] Verify both work independently
  - [ ] No breaking changes

- [ ] Run integration tests
  - [ ] Create test config with use_sdk=True
  - [ ] Create test config with use_sdk=False
  - [ ] Run same scenario in both modes
  - [ ] Compare outputs

- [ ] Document testing approach
  - File: `docs/TESTING_BOTH_PATHS.md`
  - [ ] Explain parametrized tests
  - [ ] Show how to run both paths
  - [ ] Provide benchmark expectations

#### Day 9: Documentation
- [ ] Create migration guide
  - File: `docs/AGENT_MIGRATION_GUIDE.md`
  - [ ] Explain both paths
  - [ ] Decision tree (which to choose)
  - [ ] Configuration examples
  - [ ] Migration steps for legacy users
  - [ ] Timeline and deprecation plan

- [ ] Create SDK agent documentation
  - File: `docs/SDK_AGENT_USAGE.md`
  - [ ] Architecture overview
  - [ ] How SDK agents work
  - [ ] Tool configuration
  - [ ] MCP server setup
  - [ ] Troubleshooting guide

- [ ] Create implementation summary
  - File: `PHASE5_IMPLEMENTATION_SUMMARY.md`
  - [ ] What was changed
  - [ ] Architecture diagram
  - [ ] File organization
  - [ ] Key decisions made

---

## PHASE 2: VALIDATION & RELEASE (Week 3)

### Day 10-11: Comprehensive Testing

- [ ] End-to-end testing for each agent
  - [ ] Test CodeAct agent (SDK)
  - [ ] Test CodeAct agent (Legacy)
  - [ ] Test Browsing agent (SDK)
  - [ ] Test Browsing agent (Legacy)
  - [ ] Test VisualBrowsing agent (SDK)
  - [ ] Test VisualBrowsing agent (Legacy)
  - [ ] Test Loc agent (SDK)
  - [ ] Test Loc agent (Legacy)
  - [ ] Test Dummy agent (SDK)
  - [ ] Test Dummy agent (Legacy)
  - [ ] Test ReadOnly agent (SDK)
  - [ ] Test ReadOnly agent (Legacy)

- [ ] Performance testing
  - [ ] Benchmark SDK agents
  - [ ] Benchmark legacy agents
  - [ ] Compare execution time
  - [ ] Track token usage
  - [ ] Track API costs
  - [ ] Record latency metrics
  - [ ] Compare resource usage

- [ ] Feature parity testing
  - [ ] Vision support (SDK vs Legacy)
  - [ ] Tool calling (SDK vs Legacy)
  - [ ] Function handling (SDK vs Legacy)
  - [ ] Error handling (SDK vs Legacy)
  - [ ] Message formatting (SDK vs Legacy)

### Day 12-13: Deprecation Warnings

- [ ] Add deprecation warnings to legacy agents
  ```python
  class CodeActAgent(Agent):
      def __init__(self, config: AgentConfig, ...):
          if not config.use_sdk:
              warnings.warn(
                  "CodeActAgent (legacy) is deprecated. "
                  "Please use CodeActAgentSDK. "
                  "Legacy support will be removed in v2.0.0 (Q2 2025). "
                  "See: docs/AGENT_MIGRATION_GUIDE.md",
                  DeprecationWarning,
                  stacklevel=2
              )
  ```

- [ ] Add deprecation warnings to LLMRegistry
  - [ ] When legacy path is used
  - [ ] Point to migration guide
  - [ ] Provide clear timeline

- [ ] Add deprecation warnings to Agent base class
  - [ ] Document which path is recommended
  - [ ] Link to migration resources

### Day 14: User Communication

- [ ] Write release notes
  - File: `RELEASE_NOTES_V[X].md`
  - [ ] Explain both paths available
  - [ ] Highlight no breaking changes
  - [ ] Deprecation timeline
  - [ ] Migration guide link
  - [ ] FAQ section

- [ ] Update README
  - [ ] Agent section updated
  - [ ] Configuration examples
  - [ ] Link to migration guide

- [ ] Create FAQ document
  - File: `docs/FAQ_LEGACY_VS_SDK.md`
  - [ ] Why two paths?
  - [ ] Which should I use?
  - [ ] Performance comparison
  - [ ] What's deprecated?
  - [ ] Timeline for removal
  - [ ] How to migrate

---

## PHASE 3: MONITORING & SUPPORT (Weeks 4-6)

### Week 4: Initial Rollout

- [ ] Deploy to staging
  - [ ] Test both paths in staging
  - [ ] Gather initial feedback
  - [ ] Monitor for issues

- [ ] Internal testing
  - [ ] Run benchmarks
  - [ ] Test edge cases
  - [ ] Document any issues found

- [ ] Create issue tracking
  - [ ] Set up GitHub issues for bugs
  - [ ] Create label: `llm-module` or `sdk-path`
  - [ ] Create label: `phase5-followup`

- [ ] Setup monitoring
  - [ ] Track which agents are used (SDK vs Legacy)
  - [ ] Monitor error rates
  - [ ] Track performance metrics
  - [ ] Setup alerting

### Week 5-6: Support & Patching

- [ ] Monitor GitHub issues
  - [ ] Triage reported bugs
  - [ ] Prioritize fixes
  - [ ] Create patches as needed

- [ ] Gather user feedback
  - [ ] Survey users on migration
  - [ ] Ask about pain points
  - [ ] Collect feature requests
  - [ ] Document learnings

- [ ] Performance analysis
  - [ ] Finalize benchmark results
  - [ ] Write performance comparison blog post
  - [ ] Document optimization opportunities

- [ ] Plan next phase
  - [ ] Decide on deprecation timeline
  - [ ] Plan v2.0 roadmap
  - [ ] Schedule Phase 4 (Optional cleanup)

---

## PHASE 4: OPTIONAL CLEANUP (Weeks 7+)

### When to Start: Q2 2025 (After 4-8 weeks in production)

#### Remove Legacy Agents One by One
- [ ] CodeActAgent (legacy)
- [ ] BrowsingAgent (legacy)
- [ ] ReadOnlyAgent (legacy)
- [ ] LocAgent (legacy)
- [ ] VisualBrowsingAgent (legacy)
- [ ] DummyAgent (legacy)

**For Each:**
1. [ ] Remove from agent_factory.py
2. [ ] Remove imports
3. [ ] Remove from docs/examples
4. [ ] Create migration guide
5. [ ] Tag for removal in changelog

#### Optional: Clean up LLM Module
- [ ] If unused by non-agent code:
  - [ ] Refactor to minimal interface
  - [ ] OR remove entirely
  - [ ] Update downstream imports
  - [ ] Verify no breakage

- [ ] Update documentation
  - [ ] Remove LLM module docs
  - [ ] OR document as legacy interface

---

## DELIVERABLES CHECKLIST

### Code Deliverables
- [ ] 3 new SDK agents (VisualBrowsing, Loc, Dummy)
- [ ] Updated agent_factory.py
- [ ] Comprehensive test suite (both paths)
- [ ] Performance benchmarks

### Documentation Deliverables
- [ ] AGENT_MIGRATION_GUIDE.md
- [ ] SDK_AGENT_USAGE.md
- [ ] FAQ_LEGACY_VS_SDK.md
- [ ] TESTING_BOTH_PATHS.md
- [ ] PHASE5_IMPLEMENTATION_SUMMARY.md
- [ ] Release notes
- [ ] Updated README

### Configuration Deliverables
- [ ] AgentConfig with use_sdk flag
- [ ] Example configs (SDK and legacy)
- [ ] Configuration documentation

### Testing Deliverables
- [ ] Unit tests (both paths)
- [ ] Integration tests (both paths)
- [ ] Performance benchmarks
- [ ] E2E test scenarios
- [ ] Edge case tests

### Metrics Deliverables
- [ ] Performance comparison (SDK vs Legacy)
- [ ] Token usage comparison
- [ ] Cost comparison
- [ ] Latency metrics
- [ ] Resource usage metrics

---

## VALIDATION CHECKLIST

### Technical Validation
- [ ] All 6 agents have working SDK versions
- [ ] Both SDK and legacy paths pass tests
- [ ] Performance within 10% parity
- [ ] No regressions in functionality
- [ ] Tool calling works (both paths)
- [ ] Vision works (both paths)
- [ ] Streaming works (where supported)
- [ ] Error handling works (both paths)
- [ ] Logging works (both paths)
- [ ] Cost tracking works (legacy only, SDK has built-in)

### Operational Validation
- [ ] Configuration system supports both paths
- [ ] Factory selects correct agent type
- [ ] Deprecation warnings display correctly
- [ ] Documentation is complete
- [ ] Examples work (both paths)
- [ ] FAQs cover common questions
- [ ] Support channels ready

### User Acceptance Validation
- [ ] Zero breaking changes confirmed
- [ ] Both paths documented clearly
- [ ] Migration path clear
- [ ] Deprecation timeline communicated
- [ ] Support team trained
- [ ] Rollback procedure documented

---

## RISK MITIGATION

### Risks & Responses

| Risk | Probability | Response |
|------|-------------|----------|
| SDK agent bugs | MEDIUM | Extensive testing, gradual rollout |
| Performance issues | MEDIUM | Benchmarking, optimization pass |
| Tool incompatibility | LOW | Validate tool definitions |
| User confusion | MEDIUM | Clear documentation, FAQ |
| Integration issues | LOW | E2E testing, staging validation |

### Rollback Plan
- [ ] Document rollback procedure
- [ ] Easy way to switch back: `use_sdk=False`
- [ ] No data loss on switch
- [ ] Clear logs of which path was used
- [ ] Historical metrics available

---

## SUCCESS CRITERIA

### Phase 1 Success (Week 2)
- [x] 3 new SDK agents created
- [x] Agent factory updated
- [x] Tests pass (both paths)
- [x] Documentation drafted

### Phase 2 Success (Week 3)
- [x] All tests pass
- [x] Performance metrics collected
- [x] Documentation finalized
- [x] Deprecation warnings added
- [x] Release notes ready

### Phase 3 Success (Weeks 4-6)
- [x] <2% error rate increase
- [x] >80% tests still passing
- [x] User feedback positive
- [x] No critical issues

### Phase 4 Success (Q2 2025)
- [x] All legacy agents removed
- [x] LLM module optional
- [x] v2.0 roadmap defined

---

## TIMELINE

```
Week 1: Framework
├─ Days 1-2: Config system
├─ Days 3-4: SDK agents (3)
└─ Day 5: Testing framework

Week 2: Validation
├─ Days 6-7: Agent factory
├─ Day 8: Testing
└─ Day 9: Documentation

Week 3: Release
├─ Days 10-11: Comprehensive testing
├─ Days 12-13: Deprecation warnings
└─ Day 14: User communication

Weeks 4-6: Monitoring
├─ Week 4: Initial rollout
└─ Weeks 5-6: Support & patching

Q2 2025: Optional Cleanup
└─ Remove legacy agents (if approved)
```

---

## APPROVAL & HANDOFF

**Analysis Complete:** November 8, 2025  
**Decision Required:** [Date]  
**Implementation Start:** [Date]  
**Expected Completion:** [Date + 3 weeks]  

**Stakeholders:**
- [ ] Technical Lead: Approval
- [ ] Product Manager: Timeline approval
- [ ] DevOps: Infrastructure readiness
- [ ] QA: Test plan approval
- [ ] Documentation: Review complete

---

## APPENDIX: FILE STRUCTURE

### New Files to Create
```
openhands/agenthub/
├── visualbrowsing_agent/
│   └── visualbrowsing_agent_sdk.py (NEW)
├── loc_agent/
│   └── loc_agent_sdk.py (NEW)
└── dummy_agent/
    └── agent_sdk.py (NEW)

tests/unit/agenthub/
└── test_agent_paths.py (NEW)

tests/performance/
└── test_agent_performance.py (NEW)

docs/
├── AGENT_MIGRATION_GUIDE.md (NEW)
├── SDK_AGENT_USAGE.md (NEW)
├── FAQ_LEGACY_VS_SDK.md (NEW)
└── TESTING_BOTH_PATHS.md (NEW)
```

### Files to Modify
```
openhands/
├── core/config/agent_config.py (ADD use_sdk flag)
├── agenthub/agent_factory.py (UPDATE logic)
├── llm/llm_registry.py (UPDATE docs)
└── [legacy agents] (ADD deprecation warnings)

docs/
├── README.md (UPDATE agent section)
└── [agent-specific docs] (UPDATE)

tests/
├── unit/agenthub/test_sdk_agents.py (ADD legacy mirrors)
└── [other test files] (UPDATE as needed)
```

### Documentation to Create
```
PHASE5_IMPLEMENTATION_SUMMARY.md (NEW)
RELEASE_NOTES_V[X].md (NEW)
```

---

**Document Version:** 1.0  
**Last Updated:** November 8, 2025  
**Status:** Ready for Implementation

