# Migration Guide: AgentController to TaskOrchestrator

This guide helps you migrate from the legacy AgentController to the new TaskOrchestrator architecture.

## Overview

The TaskOrchestrator integration provides a simplified, more maintainable architecture based on the Claude Agent SDK. This guide walks through migrating your code step by step.

## Why Migrate?

### Benefits

1. **Simplified Architecture**
   - Less complex code
   - Better separation of concerns
   - Easier to understand and maintain

2. **Better Performance**
   - Optimized Claude Code agents
   - More efficient resource usage
   - Faster task execution

3. **Enhanced Capabilities**
   - Multi-agent coordination
   - MCP server integration (Jupyter, Browser)
   - Better error handling and recovery

4. **Cleaner Code**
   - Async/await patterns throughout
   - Better type hints
   - Improved testability

## Migration Strategies

### Strategy 1: Gradual Migration (Recommended)

Migrate incrementally while keeping legacy code functional.

**Pros:**
- Low risk
- Can test both systems in parallel
- Easy rollback if issues arise

**Cons:**
- Temporary code duplication
- Both systems need maintenance

### Strategy 2: Complete Migration

Migrate all code at once.

**Pros:**
- Clean codebase immediately
- No code duplication
- Simpler to maintain

**Cons:**
- Higher risk
- More testing required
- Harder to rollback

## Step-by-Step Migration

### Step 1: Update Imports

**Before:**
```python
from openhands.controller.agent_controller import AgentController
from openhands.core.main import run_controller
```

**After:**
```python
from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.core.main_orchestrator import run_with_orchestrator
```

### Step 2: Update Controller Creation

**Before:**
```python
controller = AgentController(
    agent=agent,
    event_stream=event_stream,
    conversation_stats=conversation_stats,
    iteration_delta=max_iterations,
    agent_to_llm_config=agent_to_llm_config,
    agent_configs=agent_configs,
    sid=sid,
    confirmation_mode=False,
)
```

**After:**
```python
adapter = OrchestratorAdapter(
    config=config,
    event_stream=event_stream,
    workspace=workspace,
    conversation_stats=conversation_stats,
)
```

**Key differences:**
- No need to create agent manually
- Simpler parameters
- Workspace-based instead of agent-based

### Step 3: Update Task Execution

**Before:**
```python
from openhands.events.action import MessageAction

initial_action = MessageAction(content="Fix the bug")

state = await run_controller(
    config=config,
    initial_user_action=initial_action,
)
```

**After:**
```python
state = await run_with_orchestrator(
    config=config,
    task="Fix the bug",
    agent_type="code",
)
```

**Or using adapter directly:**
```python
state = await adapter.run(
    task="Fix the bug",
    agent_type="code",
)
```

### Step 4: Update GitHub Issue Handling

**Before:**
```python
instruction = get_instruction(instance, metadata)
initial_action = MessageAction(content=instruction)

state = await run_controller(
    config=config,
    initial_user_action=initial_action,
    runtime=runtime,
)
```

**After:**
```python
state = await adapter.run_github_issue(
    issue_title=instance.title,
    issue_body=instance.body,
    repo_path=repo_path,
)
```

### Step 5: Update Event Handling

**Before:**
```python
# Event handling is built into AgentController
# Events are published automatically
```

**After:**
```python
# Event handling still works through adapter
# Events are published to the same event stream

def progress_callback(message: str, metadata: dict):
    # Custom progress handling
    print(f"Progress: {message}")

adapter = OrchestratorAdapter(
    config=config,
    event_stream=event_stream,
    workspace=workspace,
    progress_callback=progress_callback,
)
```

## Common Migration Patterns

### Pattern 1: Simple CLI Tool

**Before:**
```python
async def main():
    config = setup_config()
    agent = create_agent(config)
    event_stream = create_event_stream()

    controller = AgentController(
        agent=agent,
        event_stream=event_stream,
        conversation_stats=stats,
        iteration_delta=30,
    )

    action = MessageAction(content=task)
    state = await controller.run(action)
```

**After:**
```python
async def main():
    config = setup_config()
    runtime = create_runtime(config)
    event_stream = runtime.event_stream

    adapter = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=workspace,
    )

    state = await adapter.run(task=task, agent_type="code")
```

### Pattern 2: Evaluation Script

**Before:**
```python
def process_instance(instance, metadata):
    config = get_config(metadata)
    runtime = create_runtime(config)

    instruction = get_instruction(instance)
    action = MessageAction(content=instruction)

    state = asyncio.run(
        run_controller(
            config=config,
            initial_user_action=action,
            runtime=runtime,
        )
    )

    return create_output(state, instance)
```

**After:**
```python
def process_instance(instance, metadata):
    config = get_config(metadata)
    runtime = create_runtime(config)

    adapter = OrchestratorAdapter(
        config=config,
        event_stream=runtime.event_stream,
        workspace=str(runtime.workspace_root),
    )

    state = asyncio.run(
        adapter.run_github_issue(
            issue_title=instance.title,
            issue_body=instance.body,
        )
    )

    return create_output(state, instance)
```

### Pattern 3: API Endpoint

**Before:**
```python
@router.post("/execute")
async def execute_task(request: TaskRequest):
    agent = create_agent(config)
    controller = AgentController(...)

    action = MessageAction(content=request.task)
    state = await controller.run(action)

    return {"status": state.agent_state}
```

**After:**
```python
@router.post("/execute")
async def execute_task(request: TaskRequest):
    adapter = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=workspace,
    )

    state = await adapter.run(
        task=request.task,
        agent_type="code",
    )

    return {"status": state.agent_state}
```

## Feature Mapping

### AgentController → TaskOrchestrator

| AgentController Feature | TaskOrchestrator Equivalent |
|------------------------|----------------------------|
| `run()` with MessageAction | `adapter.run(task, agent_type)` |
| Agent delegation | Multi-agent workflows |
| Event stream | Same event stream, adapter publishes |
| State management | State object maintained by adapter |
| Confirmation mode | Not yet implemented (Phase 3) |
| Stuck detection | Built into orchestrator |
| Security analyzer | Not yet implemented (Phase 3) |
| Replay manager | Not yet implemented (Phase 3) |

### New Features in TaskOrchestrator

| Feature | Description |
|---------|-------------|
| `run_github_issue()` | SWE-bench-optimized workflow |
| Agent Hub | Specialized agents (code, analysis, testing) |
| MCP Servers | Jupyter and Browser integration |
| Progress callbacks | Better progress tracking |
| Task decomposition | Automatic subtask creation |

## Configuration Changes

### Environment Variables

**New variables:**
- `OPENHANDS_USE_ORCHESTRATOR=1` - Enable orchestrator mode

**Unchanged:**
- `ANTHROPIC_API_KEY` - API key
- `LOG_LEVEL` - Logging level
- `WORKSPACE` - Workspace directory

### Config File

**Before:**
```yaml
agent:
  name: CodeActAgent
  llm_config: claude-3-5-sonnet

max_iterations: 30
```

**After:**
```yaml
# Agent type is now specified at runtime
# LLM config remains the same

max_iterations: 30

llm:
  model: claude-sonnet-4-5-20250929
  api_key: ${ANTHROPIC_API_KEY}
```

## Testing Migration

### Unit Tests

**Before:**
```python
def test_controller():
    controller = AgentController(...)
    action = MessageAction("test")
    state = await controller.run(action)
    assert state.agent_state == AgentState.FINISHED
```

**After:**
```python
def test_orchestrator():
    adapter = OrchestratorAdapter(...)
    state = await adapter.run("test", "code")
    assert state.agent_state == AgentState.FINISHED
```

### Integration Tests

```python
# Compare outputs from both systems
async def test_compatibility():
    task = "Create hello world"

    # Legacy
    state_legacy = await run_controller(
        config=config,
        initial_user_action=MessageAction(content=task),
    )

    # Orchestrator
    state_orch = await run_with_orchestrator(
        config=config,
        task=task,
    )

    # Compare
    assert state_legacy.agent_state == state_orch.agent_state
    assert state_legacy.iteration <= state_orch.iteration + 5  # Allow some variance
```

## Rollback Plan

If you need to rollback:

### 1. Disable Orchestrator Mode

```bash
unset OPENHANDS_USE_ORCHESTRATOR
```

### 2. Revert Code Changes

```bash
git revert <commit-hash>
```

### 3. Switch Evaluation Scripts

```bash
# Use original scripts
python evaluation/benchmarks/swe_bench/run_infer.py

# Instead of
python evaluation/benchmarks/swe_bench/run_infer_orchestrator.py
```

## Common Issues

### Issue 1: State Management Differences

**Problem:** State fields are missing or have different values

**Solution:**
- Adapter maintains State object compatibility
- All standard fields are populated
- Check adapter implementation for field mapping

### Issue 2: Event Stream Timing

**Problem:** Events arrive in different order

**Solution:**
- Event order may vary slightly
- Rely on event types, not order
- Use event.timestamp for ordering if needed

### Issue 3: Agent Selection

**Problem:** Not sure which agent type to use

**Solution:**
- `code` - General coding tasks, most common
- `analysis` - Code review, analysis
- `testing` - Test generation and execution
- Default to `code` if unsure

### Issue 4: Performance Differences

**Problem:** Tasks take different amounts of time

**Solution:**
- Orchestrator may be faster or slower depending on task
- Run benchmarks to compare
- Adjust max_iterations if needed

## Performance Considerations

### Iteration Counts

Orchestrator may use different iteration counts:

```python
# Legacy: Often more iterations
config.max_iterations = 50

# Orchestrator: Often fewer iterations due to better coordination
config.max_iterations = 30
```

### Resource Usage

Monitor resource usage during migration:

```bash
# Check memory usage
docker stats

# Check API usage
# Monitor Anthropic API dashboard
```

## Migration Checklist

- [ ] Review migration guide
- [ ] Identify code to migrate
- [ ] Update imports
- [ ] Update controller creation
- [ ] Update task execution
- [ ] Update event handling
- [ ] Add tests
- [ ] Run parallel testing
- [ ] Compare results
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor performance
- [ ] Deploy to production
- [ ] Remove legacy code (after validation)

## Getting Help

### Resources

- [Integration Guide](orchestrator_integration.md)
- [Examples](../examples/orchestrator_integration/)
- [API Documentation](../openhands/controller/orchestrator_adapter.py)

### Support Channels

- GitHub Issues: Report bugs
- Documentation: Check docs directory
- Examples: Review example code

## Timeline

Recommended migration timeline:

1. **Week 1-2:** Planning and testing
   - Review guide
   - Test examples
   - Plan migration

2. **Week 3-4:** Parallel implementation
   - Implement orchestrator version
   - Keep legacy running
   - Compare results

3. **Week 5-6:** Testing and validation
   - Run comprehensive tests
   - Fix issues
   - Performance tuning

4. **Week 7-8:** Deployment
   - Deploy to staging
   - Monitor closely
   - Deploy to production

5. **Week 9+:** Cleanup
   - Remove legacy code
   - Update documentation
   - Final optimization

## Conclusion

The migration to TaskOrchestrator provides significant benefits in terms of simplicity, maintainability, and capabilities. Follow this guide step by step, and don't hesitate to consult the examples and documentation.

Happy migrating! 🚀

---

**Last Updated:** 2025-11-08
**Version:** v1.0
