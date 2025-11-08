# TaskOrchestrator Integration Guide

This document describes the Phase 2 integration of the Claude Agent SDK's TaskOrchestrator with the existing OpenHands codebase.

## Overview

Phase 2 creates integration layers that allow OpenHands to use the new TaskOrchestrator architecture (from Phase 1) while maintaining backward compatibility with existing code.

### Key Components

1. **OrchestratorAdapter** - Adapter that makes TaskOrchestrator compatible with AgentController interface
2. **Evaluation Integrations** - Updated SWE-bench and WebArena evaluation scripts
3. **CLI Integration** - Alternative CLI entry point with orchestrator support
4. **API Integration** - REST API endpoints for TaskOrchestrator
5. **Examples** - Comprehensive usage examples and documentation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Existing OpenHands                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     CLI      │  │     API      │  │  Evaluation  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └─────────────────┼─────────────────┘          │
│                           │                            │
│         ┌─────────────────▼─────────────────┐          │
│         │   OrchestratorAdapter (New)       │          │
│         │   - Backward compatibility        │          │
│         │   - Event stream integration      │          │
│         │   - State management              │          │
│         └─────────────────┬─────────────────┘          │
└───────────────────────────┼─────────────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │     TaskOrchestrator (Phase 1)      │
         │  ┌────────────────────────────────┐ │
         │  │        AgentHub                │ │
         │  │  - Code Agent                  │ │
         │  │  - Analysis Agent              │ │
         │  │  - Testing Agent               │ │
         │  └────────────────────────────────┘ │
         │  ┌────────────────────────────────┐ │
         │  │      MCP Servers               │ │
         │  │  - Jupyter MCP                 │ │
         │  │  - Browser MCP                 │ │
         │  └────────────────────────────────┘ │
         └─────────────────────────────────────┘
```

## Integration Components

### 1. OrchestratorAdapter

**File:** `/home/user/skills-claude/OpenHands/openhands/controller/orchestrator_adapter.py`

The adapter provides backward compatibility by:
- Implementing AgentController-like interface
- Converting between OpenHands events and TaskOrchestrator messages
- Managing state transitions
- Providing progress callbacks

**Usage:**

```python
from openhands.controller.orchestrator_adapter import OrchestratorAdapter

# Create adapter
adapter = OrchestratorAdapter(
    config=config,
    event_stream=event_stream,
    workspace=workspace,
)

# Run a simple task
state = await adapter.run(
    task="Fix the authentication bug",
    agent_type="code",
)

# Run GitHub issue workflow
state = await adapter.run_github_issue(
    issue_title="Add user auth",
    issue_body="Implement JWT authentication",
    repo_path="/path/to/repo",
)
```

### 2. SWE-bench Integration

**File:** `/home/user/skills-claude/OpenHands/evaluation/benchmarks/swe_bench/run_infer_orchestrator.py`

Migrated SWE-bench evaluation to use TaskOrchestrator:
- Uses `execute_github_issue_workflow` pattern
- Maintains evaluation metrics compatibility
- Supports all SWE-bench modes (swe, swt, swt-ci)

**Usage:**

```bash
python evaluation/benchmarks/swe_bench/run_infer_orchestrator.py \
    --agent-cls CodeActAgent \
    --llm-config llm_config \
    --max-iterations 30 \
    --eval-num-workers 4 \
    --dataset-name princeton-nlp/SWE-bench_Lite \
    --eval-note "orchestrator-test"
```

### 3. WebArena Integration

**File:** `/home/user/skills-claude/OpenHands/evaluation/benchmarks/webarena/run_infer_orchestrator.py`

Migrated WebArena evaluation with Browser MCP support:
- Uses Browser MCP for web automation
- Simplified browser interaction
- Maintains reward calculation compatibility

**Usage:**

```bash
export WEBARENA_BASE_URL=http://localhost
export OPENAI_API_KEY=your_key

python evaluation/benchmarks/webarena/run_infer_orchestrator.py \
    --agent-cls BrowsingAgent \
    --llm-config llm_config \
    --max-iterations 30 \
    --eval-note "orchestrator-browser-test"
```

### 4. CLI Integration

**File:** `/home/user/skills-claude/OpenHands/openhands/core/main_orchestrator.py`

Alternative CLI entry point with orchestrator support:
- Maintains backward compatibility
- Opt-in via environment variable
- Supports simple tasks and GitHub issues

**Usage:**

```bash
# Enable orchestrator mode
export OPENHANDS_USE_ORCHESTRATOR=1

# Run a simple task
python -m openhands.core.main_orchestrator \
    --task "Create a hello world Python script"

# Resolve a GitHub issue
python -m openhands.core.main_orchestrator \
    --issue-title "Add authentication" \
    --issue-body "Implement user authentication"
```

### 5. API Integration

**File:** `/home/user/skills-claude/OpenHands/openhands/server/routes/orchestrator.py`

REST API endpoints for TaskOrchestrator:

#### Endpoints:

- `POST /api/orchestrator/task` - Execute a simple task
- `POST /api/orchestrator/github-issue` - Resolve a GitHub issue
- `GET /api/orchestrator/status/{task_id}` - Get task status
- `GET /api/orchestrator/result/{task_id}` - Get task result
- `GET /api/orchestrator/health` - Health check

**Usage:**

```bash
# Submit a task
curl -X POST http://localhost:3000/api/orchestrator/task \
    -H "Content-Type: application/json" \
    -d '{"task": "Create a hello world script", "agent_type": "code"}'

# Check status
curl http://localhost:3000/api/orchestrator/status/{task_id}

# Get result
curl http://localhost:3000/api/orchestrator/result/{task_id}
```

## Examples

Comprehensive examples are provided in `/home/user/skills-claude/OpenHands/examples/orchestrator_integration/`:

1. **simple_task.py** - Basic task execution
2. **github_issue.py** - GitHub issue resolution workflow
3. **cli_usage.sh** - CLI usage examples
4. **api_usage.py** - API usage examples with Python

## Migration Strategy

### Gradual Migration

The integration is designed for gradual migration:

1. **Phase 1** (Current): Both systems coexist
   - Legacy AgentController remains default
   - TaskOrchestrator opt-in via environment variable
   - All existing code continues to work

2. **Phase 2** (Testing): Parallel testing
   - Run evaluations with both systems
   - Compare results and performance
   - Fix any compatibility issues

3. **Phase 3** (Transition): Make orchestrator default
   - Flip default to TaskOrchestrator
   - Keep legacy as fallback
   - Update documentation

4. **Phase 4** (Cleanup): Remove legacy code
   - Remove AgentController
   - Clean up compatibility layers
   - Simplify architecture

### Backward Compatibility

The integration maintains backward compatibility through:

1. **Event Stream Compatibility**
   - Adapter publishes events to OpenHands event stream
   - Existing event handlers continue to work
   - State transitions are preserved

2. **State Management**
   - OrchestratorAdapter maintains State object
   - All state fields are populated correctly
   - Metrics and tracking work as before

3. **Configuration**
   - Uses existing OpenHandsConfig
   - No changes to configuration files required
   - All config options are respected

4. **API Compatibility**
   - REST API maintains existing endpoints
   - New orchestrator endpoints are additions
   - No breaking changes to API contracts

## Benefits of Integration

### Simplified Architecture

- **Less complexity**: TaskOrchestrator replaces complex AgentController
- **Cleaner code**: Better separation of concerns
- **Easier testing**: Simpler execution flow

### Better Agent Coordination

- **Multi-agent workflows**: Coordinate multiple specialized agents
- **Task decomposition**: Break complex tasks into manageable steps
- **Progress tracking**: Better visibility into execution

### MCP Integration

- **Jupyter MCP**: Better notebook execution
- **Browser MCP**: Improved web automation
- **Extensible**: Easy to add new MCP servers

### Performance

- **Faster execution**: Optimized Claude Code agents
- **Better error handling**: More robust error recovery
- **Resource efficiency**: Better resource management

## Testing

### Running Tests

```bash
# Test simple task execution
python examples/orchestrator_integration/simple_task.py

# Test GitHub issue workflow
python examples/orchestrator_integration/github_issue.py

# Test SWE-bench evaluation
python evaluation/benchmarks/swe_bench/run_infer_orchestrator.py \
    --eval-n-limit 5 \
    --eval-note "integration-test"

# Test WebArena evaluation
python evaluation/benchmarks/webarena/run_infer_orchestrator.py \
    --eval-n-limit 5 \
    --eval-note "integration-test"
```

### Validation

Compare results between legacy and orchestrator implementations:

```bash
# Run with legacy
python evaluation/benchmarks/swe_bench/run_infer.py \
    --eval-note "legacy" \
    --eval-n-limit 10

# Run with orchestrator
python evaluation/benchmarks/swe_bench/run_infer_orchestrator.py \
    --eval-note "orchestrator" \
    --eval-n-limit 10

# Compare outputs
python scripts/compare_eval_outputs.py \
    legacy_output.jsonl \
    orchestrator_output.jsonl
```

## Troubleshooting

### Common Issues

1. **API key not found**
   - Set `ANTHROPIC_API_KEY` environment variable
   - Or configure in OpenHandsConfig

2. **Import errors**
   - Ensure Phase 1 components are installed
   - Check Python path includes OpenHands directory

3. **Event stream issues**
   - Check event stream initialization
   - Verify event handlers are registered

4. **State management problems**
   - Check State object initialization
   - Verify iteration tracking

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
export OPENHANDS_USE_ORCHESTRATOR=1

python -m openhands.core.main_orchestrator --task "your task"
```

## Performance Comparison

### Metrics to Compare

1. **Execution Time**
   - Time to complete tasks
   - Iteration count
   - API calls made

2. **Success Rate**
   - Task completion rate
   - Error rate
   - Recovery from failures

3. **Resource Usage**
   - Memory consumption
   - CPU usage
   - Network bandwidth

4. **Code Quality**
   - Test pass rate
   - Code coverage
   - Linting errors

### Benchmarking

```bash
# Run benchmark suite
python scripts/benchmark_orchestrator.py \
    --tasks benchmark_tasks.json \
    --compare-with-legacy \
    --output benchmark_results.json
```

## Future Work

### Planned Enhancements

1. **More MCP Servers**
   - Database MCP for SQL operations
   - Docker MCP for container management
   - Git MCP for version control

2. **Advanced Workflows**
   - Multi-repository workflows
   - Parallel task execution
   - Conditional execution paths

3. **Better Monitoring**
   - Real-time progress dashboards
   - Detailed execution traces
   - Performance analytics

4. **Enhanced Testing**
   - More comprehensive test suite
   - Performance regression tests
   - Integration test framework

## References

- [Phase 1 Documentation](../openhands/README.md)
- [AgentHub Documentation](../openhands/agent_hub/README.md)
- [TaskOrchestrator Documentation](../openhands/orchestrator/README.md)
- [MCP Servers Documentation](../openhands/mcp_servers/README.md)

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the examples directory
- Consult Phase 1 documentation
- Open an issue on GitHub

## Contributing

Contributions are welcome! Please:
1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests

---

**Last Updated:** 2025-11-08
**Version:** Phase 2 Integration v1.0
