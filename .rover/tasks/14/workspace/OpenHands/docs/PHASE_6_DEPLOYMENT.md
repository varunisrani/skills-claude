# Phase 6 Deployment Guide

## Overview

This guide covers the production deployment of Phase 6 SDK Integration, including pre-deployment verification, feature flags, monitoring, rollback procedures, and known issues.

**Phase 6 Components:**
- OrchestratorAdapter (enhanced)
- SDKExecutor (new)
- UnifiedErrorHandler (new)
- AgentDetector (new)
- SDK Agents (CodeActAgentSDK, etc.)

**Deployment Strategy:** Gradual rollout with feature flags and monitoring.

---

## Production Checklist

### Pre-Deployment Verification

#### 1. Code Quality

```bash
# Run all tests
cd /OpenHands
pytest tests/ -v

# Run specific Phase 6 tests
pytest tests/e2e/test_sdk_agents_e2e.py -v
pytest tests/performance/test_sdk_performance.py -v
pytest tests/integration/test_orchestrator_integration.py -v

# Check test coverage
pytest --cov=openhands.controller.orchestrator_adapter
pytest --cov=openhands.controller.sdk_executor
pytest --cov=openhands.agenthub.agent_detector

# Ensure > 90% coverage on new code
```

**Pass Criteria:**
- ✅ All unit tests passing (100%)
- ✅ All integration tests passing (100%)
- ✅ All E2E tests passing (100%)
- ✅ Code coverage > 90% on new modules
- ✅ No critical linting errors

#### 2. Performance Benchmarks

```bash
# Run performance tests
pytest tests/performance/test_sdk_performance.py -v -s

# Check key metrics:
# - Step execution time < 5% regression
# - Token usage within 5% of legacy
# - Throughput > 10 steps/second
# - Agent detection < 1ms (cached)
# - Orchestrator overhead < 5%
```

**Pass Criteria:**
- ✅ No performance regressions > 5%
- ✅ Token efficiency maintained or improved
- ✅ Throughput meets baseline requirements
- ✅ Memory usage stable (no leaks)

#### 3. Integration Testing

```bash
# Test SDK agent creation
python3 << EOF
from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
from openhands.core.config import AgentConfig

config = AgentConfig(model="claude-sonnet-4", api_key="test-key")
agent = CodeActAgentSDK(config=config)
print("✅ SDK agent created successfully")
EOF

# Test orchestrator adapter
python3 << EOF
from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
from openhands.core.config import AgentConfig

config = AgentConfig(model="claude-sonnet-4", api_key="test-key")
agent = CodeActAgentSDK(config=config)
orchestrator = OrchestratorAdapter(agent=agent, config=config)
print("✅ OrchestratorAdapter initialized successfully")
EOF
```

**Pass Criteria:**
- ✅ SDK agents instantiate without errors
- ✅ OrchestratorAdapter initializes correctly
- ✅ Agent type detection works
- ✅ State management functional

#### 4. Documentation

```bash
# Verify documentation exists and is complete
ls -l OpenHands/docs/SDK_INTEGRATION_GUIDE.md
ls -l OpenHands/docs/PHASE_6_DEPLOYMENT.md
ls -l OpenHands/DEPLOYMENT_CHECKLIST.md

# Verify examples work
python OpenHands/examples/sdk_agent_example.py
```

**Pass Criteria:**
- ✅ SDK Integration Guide complete
- ✅ Deployment Guide complete
- ✅ API documentation updated
- ✅ Code examples working
- ✅ Troubleshooting guide comprehensive

#### 5. Security Review

```bash
# Check for security issues
bandit -r openhands/controller/orchestrator_adapter.py
bandit -r openhands/controller/sdk_executor.py
bandit -r openhands/agenthub/codeact_agent/codeact_agent_sdk.py

# Verify API key handling
grep -r "api_key" openhands/controller/ | grep -v "config.api_key"
```

**Pass Criteria:**
- ✅ No critical security issues
- ✅ API keys properly handled (not logged)
- ✅ Input validation in place
- ✅ Error messages don't leak sensitive info

#### 6. Backward Compatibility

```bash
# Test legacy agents still work
python3 << EOF
from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
from openhands.core.config import AgentConfig

config = AgentConfig(model="gpt-4")
agent = CodeActAgent(config=config)
print("✅ Legacy agent still works")
EOF

# Test mixed delegation
pytest tests/integration/test_mixed_delegation.py -v
```

**Pass Criteria:**
- ✅ Legacy agents unchanged
- ✅ Existing tests passing
- ✅ No breaking changes
- ✅ Mixed delegation works

---

## Feature Flags

### Gradual Rollout Strategy

Phase 6 uses feature flags for gradual rollout:

```
Stage 1: Internal Testing (0% users, 100% team)
Stage 2: Canary (5% users)
Stage 3: Beta (25% users)
Stage 4: Production (100% users)
```

### Flag Configuration

#### Environment Variables

```bash
# Master switch
export OPENHANDS_ENABLE_SDK_AGENTS=false  # Default: disabled

# Auto-detection (if master enabled)
export OPENHANDS_AUTO_DETECT_SDK=true

# Prefer SDK for Claude models
export OPENHANDS_PREFER_SDK_FOR_CLAUDE=true

# Fallback to legacy on error
export OPENHANDS_FALLBACK_TO_LEGACY=true

# Feature-specific flags
export OPENHANDS_SDK_ENABLE_ORCHESTRATOR=true
export OPENHANDS_SDK_ENABLE_MCP=true
```

#### Configuration File

```toml
# config.toml

[sdk_integration]
enabled = false  # Master switch
auto_detect = true
prefer_sdk_for_claude = true
fallback_to_legacy = true

[sdk_features]
orchestrator_adapter = true
mcp_servers = true
enhanced_error_handling = true
metrics_tracking = true

[rollout]
stage = "disabled"  # disabled, canary, beta, production
canary_percentage = 5
beta_percentage = 25
```

#### Runtime Configuration

```python
from openhands.core.config import AgentConfig

config = AgentConfig(
    # Enable SDK for this session
    use_sdk=True,

    # Or auto-detect based on model
    auto_detect_sdk=True,

    # Fallback behavior
    fallback_to_legacy=True
)
```

### Rollout Stages

#### Stage 0: Disabled (Default)

```bash
export OPENHANDS_ENABLE_SDK_AGENTS=false
```

- SDK agents not available
- All agents use legacy path
- Zero production impact

#### Stage 1: Internal Testing

```bash
export OPENHANDS_ENABLE_SDK_AGENTS=true
export OPENHANDS_ROLLOUT_STAGE=internal
export OPENHANDS_TEAM_ONLY=true
```

- SDK agents available to team only
- Full monitoring enabled
- Quick rollback available

#### Stage 2: Canary (5% Users)

```bash
export OPENHANDS_ENABLE_SDK_AGENTS=true
export OPENHANDS_ROLLOUT_STAGE=canary
export OPENHANDS_CANARY_PERCENTAGE=5
```

- 5% of users get SDK agents
- Based on session ID hash
- Monitor for issues

#### Stage 3: Beta (25% Users)

```bash
export OPENHANDS_ROLLOUT_STAGE=beta
export OPENHANDS_BETA_PERCENTAGE=25
```

- Expand to 25% of users
- Collect broader feedback
- Monitor performance metrics

#### Stage 4: Production (100%)

```bash
export OPENHANDS_ROLLOUT_STAGE=production
```

- All users get SDK agents (if Claude model)
- Legacy agents still available for other models
- Full production deployment

### User Selection Logic

```python
def should_use_sdk_agent(session_id: str, model: str) -> bool:
    """Determine if SDK agent should be used."""
    # Check master switch
    if not os.getenv("OPENHANDS_ENABLE_SDK_AGENTS"):
        return False

    # Check rollout stage
    stage = os.getenv("OPENHANDS_ROLLOUT_STAGE", "disabled")

    if stage == "disabled":
        return False
    elif stage == "internal":
        return is_team_member(session_id)
    elif stage == "canary":
        return hash(session_id) % 100 < 5  # 5%
    elif stage == "beta":
        return hash(session_id) % 100 < 25  # 25%
    elif stage == "production":
        return model.startswith("claude")  # Claude models only

    return False
```

---

## Monitoring

### Metrics to Track

#### 1. Agent Metrics

```python
# Track agent type usage
metrics.sdk_agent_count
metrics.legacy_agent_count
metrics.sdk_agent_percentage = sdk / (sdk + legacy) * 100

# Track success rates
metrics.sdk_success_rate
metrics.legacy_success_rate
metrics.sdk_error_rate
```

#### 2. Performance Metrics

```python
# Latency
metrics.sdk_step_latency_p50
metrics.sdk_step_latency_p95
metrics.sdk_step_latency_p99

# Throughput
metrics.sdk_steps_per_second
metrics.sdk_tasks_per_minute

# Efficiency
metrics.sdk_tokens_per_task
metrics.sdk_cost_per_task
```

#### 3. Error Metrics

```python
# Error rates
metrics.sdk_errors_total
metrics.sdk_errors_rate
metrics.sdk_errors_by_type

# Common errors
metrics.sdk_auth_errors
metrics.sdk_rate_limit_errors
metrics.sdk_context_window_errors
metrics.sdk_timeout_errors
```

#### 4. Resource Metrics

```python
# Memory
metrics.sdk_memory_usage
metrics.sdk_memory_growth

# CPU
metrics.sdk_cpu_usage

# Network
metrics.sdk_api_calls
metrics.sdk_api_latency
```

### Monitoring Setup

#### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
sdk_steps_total = Counter(
    'openhands_sdk_steps_total',
    'Total SDK agent steps',
    ['agent_type', 'status']
)

sdk_step_duration = Histogram(
    'openhands_sdk_step_duration_seconds',
    'SDK agent step duration',
    ['agent_type']
)

sdk_active_agents = Gauge(
    'openhands_sdk_active_agents',
    'Number of active SDK agents',
    ['agent_type']
)
```

#### Logging

```python
import logging

# Configure structured logging
logger = logging.getLogger("openhands.sdk")
logger.setLevel(logging.INFO)

# Log important events
logger.info("SDK agent created", extra={
    "agent_type": "codeact",
    "session_id": session_id,
    "model": config.model
})

logger.error("SDK step failed", extra={
    "error_type": type(e).__name__,
    "error_message": str(e),
    "session_id": session_id
})
```

#### Dashboard Queries

```promql
# SDK adoption rate
sum(openhands_sdk_steps_total) /
  (sum(openhands_sdk_steps_total) + sum(openhands_legacy_steps_total)) * 100

# Error rate
rate(openhands_sdk_steps_total{status="error"}[5m]) /
  rate(openhands_sdk_steps_total[5m])

# P95 latency
histogram_quantile(0.95,
  rate(openhands_sdk_step_duration_seconds_bucket[5m]))

# Success rate
rate(openhands_sdk_steps_total{status="success"}[5m]) /
  rate(openhands_sdk_steps_total[5m])
```

### Alerting Rules

```yaml
# alerts.yml

groups:
  - name: openhands_sdk
    interval: 1m
    rules:
      - alert: SDKErrorRateHigh
        expr: rate(openhands_sdk_steps_total{status="error"}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "SDK error rate > 5%"

      - alert: SDKLatencyHigh
        expr: histogram_quantile(0.95, rate(openhands_sdk_step_duration_seconds_bucket[5m])) > 2.0
        for: 5m
        annotations:
          summary: "SDK P95 latency > 2s"

      - alert: SDKMemoryLeaking
        expr: rate(openhands_sdk_memory_usage[10m]) > 0
        for: 30m
        annotations:
          summary: "SDK memory continuously growing"
```

---

## Rollback Plan

### When to Rollback

Trigger rollback if:
- ❌ Error rate > 10% for 5+ minutes
- ❌ P95 latency > 3x baseline for 10+ minutes
- ❌ Critical bug affecting production
- ❌ Memory leak detected
- ❌ Security issue discovered

### Rollback Procedure

#### 1. Immediate Rollback (< 5 minutes)

```bash
# Disable SDK agents globally
export OPENHANDS_ENABLE_SDK_AGENTS=false

# Or set to disabled in config
sed -i 's/enabled = true/enabled = false/' config.toml

# Restart services
sudo systemctl restart openhands
```

#### 2. Staged Rollback

```bash
# Roll back from 100% to 25%
export OPENHANDS_ROLLOUT_STAGE=beta
export OPENHANDS_BETA_PERCENTAGE=25

# Monitor for 10 minutes
sleep 600

# If issues persist, roll back to 5%
export OPENHANDS_ROLLOUT_STAGE=canary
export OPENHANDS_CANARY_PERCENTAGE=5

# If still issues, full rollback
export OPENHANDS_ENABLE_SDK_AGENTS=false
```

#### 3. Code Rollback

```bash
# Revert to previous version
git revert <phase6-commit-hash>

# Or checkout previous stable version
git checkout v1.x.x

# Redeploy
./deploy.sh
```

#### 4. Database/State Rollback

```bash
# If state schema changed, restore from backup
# (Should not be necessary - Phase 6 is additive)

# Verify state integrity
python verify_state.py
```

### Post-Rollback Actions

1. **Investigate Root Cause**
   - Collect logs from affected sessions
   - Review error traces
   - Identify failure pattern

2. **Fix and Test**
   - Create hotfix branch
   - Add regression test
   - Test thoroughly

3. **Communicate**
   - Notify team
   - Update status page
   - Document incident

4. **Re-deploy**
   - Start at canary stage
   - Monitor closely
   - Gradual rollout again

---

## Known Issues

### Issue 1: Async/Await Compatibility

**Symptom:** `RuntimeError: Event loop is already running`

**Cause:** Mixing sync and async code incorrectly.

**Workaround:**
```python
# Use asyncio.run() at top level only
# Inside async functions, use await
async def main():
    result = await orchestrator.step()  # Correct
```

**Status:** Documented, examples provided

---

### Issue 2: Agent Detection Edge Cases

**Symptom:** Agent type incorrectly detected

**Cause:** Agent class doesn't clearly indicate SDK vs legacy.

**Workaround:**
```python
# Explicitly set agent type
if hasattr(agent, 'adapter'):
    agent_type = "sdk"
else:
    agent_type = "legacy"
```

**Status:** Agent detector handles most cases, edge cases documented

---

### Issue 3: MCP Server Initialization

**Symptom:** MCP servers fail to start in some environments

**Cause:** Missing dependencies or permissions.

**Workaround:**
```bash
# Install MCP dependencies
pip install anthropic-mcp

# Check permissions
chmod +x mcp_servers/*
```

**Status:** Documentation updated with troubleshooting steps

---

### Issue 4: Context Window with Long Histories

**Symptom:** Context window errors more frequent with SDK

**Cause:** SDK uses different message formatting.

**Workaround:**
```python
# Enable condensation
config.enable_condensation = True

# Or reduce max iterations
config.max_iterations = 50
```

**Status:** Monitored, condensation helps

---

### Issue 5: Rate Limiting

**Symptom:** More rate limit errors under high load

**Cause:** Direct SDK calls may hit limits faster.

**Workaround:**
```python
# Implement backoff strategy
from tenacity import retry, wait_exponential

@retry(wait=wait_exponential(multiplier=1, min=4, max=60))
async def step_with_retry():
    return await orchestrator.step()
```

**Status:** Retry logic in error handler

---

## Deployment Steps

### Pre-Production

```bash
# 1. Merge Phase 6 PR
git checkout main
git merge phase-6-sdk-integration

# 2. Tag release
git tag -a v1.1.0 -m "Phase 6: SDK Integration"
git push origin v1.1.0

# 3. Build and test
make build
make test

# 4. Deploy to staging
./deploy.sh staging
```

### Production Deployment

```bash
# 1. Stage 0: Verify current state
curl https://api.openhands.com/health
# Expected: All green

# 2. Stage 1: Enable for team only
export OPENHANDS_ENABLE_SDK_AGENTS=true
export OPENHANDS_ROLLOUT_STAGE=internal
./deploy.sh production

# Wait 24 hours, monitor metrics

# 3. Stage 2: Canary (5%)
export OPENHANDS_ROLLOUT_STAGE=canary
./deploy.sh production

# Wait 48 hours, monitor metrics

# 4. Stage 3: Beta (25%)
export OPENHANDS_ROLLOUT_STAGE=beta
./deploy.sh production

# Wait 1 week, monitor metrics

# 5. Stage 4: Production (100%)
export OPENHANDS_ROLLOUT_STAGE=production
./deploy.sh production

# Monitor continuously
```

### Post-Deployment

```bash
# 1. Verify metrics
curl https://api.openhands.com/metrics | grep sdk

# 2. Check error rates
curl https://api.openhands.com/metrics | grep error_rate

# 3. Sample user sessions
./sample_sessions.sh --agent-type=sdk

# 4. Update documentation
./update_docs.sh

# 5. Announce to users
./announce.sh --channel=all
```

---

## Success Criteria

Phase 6 deployment is successful when:

✅ **Functionality**
- SDK agents work for Claude models
- Legacy agents unchanged
- No breaking changes observed

✅ **Performance**
- Error rate < 2% (baseline)
- P95 latency within 10% of baseline
- No memory leaks detected

✅ **Adoption**
- 50%+ Claude users on SDK agents
- Positive user feedback
- No major rollbacks

✅ **Operations**
- Monitoring dashboards working
- Alerts firing correctly
- Runbooks documented

---

## Support

### Escalation Path

1. **Level 1:** Check troubleshooting guide
2. **Level 2:** Check known issues
3. **Level 3:** Review logs and metrics
4. **Level 4:** Contact Phase 6 team
5. **Level 5:** Consider rollback

### Contact Information

- **Phase 6 Team:** #phase-6-sdk-integration
- **On-Call:** See PagerDuty rotation
- **Documentation:** `/OpenHands/docs/`

---

*Last Updated: 2025-11-08*
*Version: 1.0*
*Status: Ready for Production*
