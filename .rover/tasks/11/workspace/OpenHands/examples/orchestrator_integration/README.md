# TaskOrchestrator Integration Examples

This directory contains comprehensive examples demonstrating how to use the TaskOrchestrator integration with OpenHands.

## Overview

The TaskOrchestrator integration (Phase 2) provides a simplified, Claude Agent SDK-based architecture for running tasks. These examples show how to use it in various scenarios.

## Examples

### 1. Simple Task Execution

**File:** `simple_task.py`

Demonstrates basic task execution with TaskOrchestrator.

**What it does:**
- Creates a workspace
- Executes a simple coding task
- Shows progress and results

**Run:**
```bash
python examples/orchestrator_integration/simple_task.py
```

**Key concepts:**
- Creating OrchestratorAdapter
- Running simple tasks
- Handling results

### 2. GitHub Issue Resolution

**File:** `github_issue.py`

Demonstrates the GitHub issue workflow pattern (similar to SWE-bench).

**What it does:**
- Sets up a test repository
- Resolves a GitHub issue using multi-phase workflow
- Shows analysis → implementation → testing → verification

**Run:**
```bash
python examples/orchestrator_integration/github_issue.py
```

**Key concepts:**
- GitHub issue workflow
- Multi-phase execution
- Test-driven development

### 3. CLI Usage

**File:** `cli_usage.sh`

Shell script showing various CLI usage patterns.

**What it covers:**
- Simple task execution
- Task from file
- GitHub issue resolution
- Custom workspace
- Different agent types
- SWE-bench evaluation
- WebArena evaluation

**Run:**
```bash
chmod +x examples/orchestrator_integration/cli_usage.sh
./examples/orchestrator_integration/cli_usage.sh
```

### 4. API Usage

**File:** `api_usage.py`

Demonstrates REST API usage for TaskOrchestrator.

**What it does:**
- Submits tasks via API
- Polls for status
- Retrieves results
- Shows error handling

**Run:**
```bash
# Start server first
python -m openhands.server

# In another terminal
python examples/orchestrator_integration/api_usage.py
```

**Key concepts:**
- REST API endpoints
- Async task execution
- Status polling
- Result retrieval

## Quick Start

### Prerequisites

1. **Install OpenHands:**
```bash
cd OpenHands
pip install -e .
```

2. **Set API Key:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

3. **Enable Orchestrator Mode:**
```bash
export OPENHANDS_USE_ORCHESTRATOR=1
```

### Run Your First Example

```bash
# Simple task
python examples/orchestrator_integration/simple_task.py
```

## Common Use Cases

### Use Case 1: Automated Code Generation

```python
from openhands.controller.orchestrator_adapter import OrchestratorAdapter

adapter = OrchestratorAdapter(config, event_stream, workspace)

state = await adapter.run(
    task="Create a REST API with user CRUD operations",
    agent_type="code"
)
```

### Use Case 2: Bug Fixing

```python
state = await adapter.run_github_issue(
    issue_title="Fix memory leak in data processor",
    issue_body="The data processor leaks memory when processing large files...",
    repo_path="/path/to/repo"
)
```

### Use Case 3: Code Analysis

```python
state = await adapter.run(
    task="Analyze the codebase and identify security vulnerabilities",
    agent_type="analysis"
)
```

### Use Case 4: Test Generation

```python
state = await adapter.run(
    task="Generate comprehensive unit tests for the authentication module",
    agent_type="testing"
)
```

## Configuration

### Environment Variables

- `OPENHANDS_USE_ORCHESTRATOR=1` - Enable orchestrator mode
- `ANTHROPIC_API_KEY=sk-...` - Anthropic API key
- `LOG_LEVEL=DEBUG` - Enable debug logging
- `WEBARENA_BASE_URL=http://...` - WebArena base URL (for browser tasks)

### Configuration File

Create `config.yaml`:

```yaml
max_iterations: 50
workspace: /path/to/workspace
agent_type: code

llm:
  model: claude-sonnet-4-5-20250929
  api_key: ${ANTHROPIC_API_KEY}
  temperature: 0.0
```

## Integration Points

### With Existing OpenHands Code

```python
# Legacy approach
from openhands.core.main import run_controller

state = await run_controller(
    config=config,
    initial_user_action=MessageAction(content=task)
)

# New orchestrator approach
from openhands.core.main_orchestrator import run_with_orchestrator

state = await run_with_orchestrator(
    config=config,
    task=task,
    agent_type="code"
)
```

### With Custom Event Handlers

```python
def progress_callback(message: str, metadata: dict):
    print(f"Progress: {message}")
    print(f"Metadata: {metadata}")

adapter = OrchestratorAdapter(
    config=config,
    event_stream=event_stream,
    workspace=workspace,
    progress_callback=progress_callback
)
```

### With Evaluation Framework

```python
from evaluation.utils.shared import run_evaluation

def process_instance(instance, metadata):
    # Use orchestrator for evaluation
    adapter = OrchestratorAdapter(...)
    state = await adapter.run_github_issue(
        issue_title=instance.title,
        issue_body=instance.body
    )
    return create_eval_output(state, instance)

run_evaluation(instances, metadata, output_file, workers, process_instance)
```

## Advanced Examples

### Multi-Step Workflow

```python
# Step 1: Analyze
analysis_state = await adapter.run(
    task="Analyze the requirements",
    agent_type="analysis"
)

# Step 2: Implement
impl_state = await adapter.run(
    task=f"Implement based on this analysis: {analysis_state.output}",
    agent_type="code"
)

# Step 3: Test
test_state = await adapter.run(
    task="Run all tests and fix failures",
    agent_type="testing"
)
```

### With Custom MCP Servers

```python
# The orchestrator automatically uses MCP servers from Phase 1
# - Jupyter MCP for notebook execution
# - Browser MCP for web automation

# Example: Web automation task
state = await adapter.run(
    task="Navigate to example.com and extract all links",
    agent_type="code"  # Has access to Browser MCP
)
```

### Error Handling

```python
try:
    state = await adapter.run(task="Complex task", agent_type="code")

    if state.agent_state == AgentState.FINISHED:
        print("Success!")
    elif state.agent_state == AgentState.ERROR:
        print(f"Error: {state.last_error}")
        # Handle error, retry, etc.

except Exception as e:
    print(f"Execution failed: {e}")
    # Handle exception
```

## Performance Tips

### 1. Set Appropriate Iteration Limits

```python
config.max_iterations = 30  # For simple tasks
config.max_iterations = 50  # For complex tasks
config.max_iterations = 100  # For SWE-bench
```

### 2. Use Specific Agent Types

```python
# Use analysis agent for code review
state = await adapter.run(task="Review code", agent_type="analysis")

# Use code agent for implementation
state = await adapter.run(task="Implement feature", agent_type="code")

# Use testing agent for test generation
state = await adapter.run(task="Generate tests", agent_type="testing")
```

### 3. Provide Clear Task Descriptions

```python
# Good: Clear, specific task
task = """
Create a user authentication system with:
1. JWT token generation
2. Password hashing with bcrypt
3. Login and logout endpoints
4. Unit tests with pytest
"""

# Poor: Vague task
task = "Add auth"
```

## Troubleshooting

### Issue: Import errors

**Solution:**
```bash
# Ensure OpenHands is installed
cd OpenHands
pip install -e .

# Check Python path
export PYTHONPATH=/path/to/skills-claude/OpenHands:$PYTHONPATH
```

### Issue: API key not found

**Solution:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Issue: Tasks fail immediately

**Solution:**
- Check workspace permissions
- Verify event stream is initialized
- Enable debug logging: `export LOG_LEVEL=DEBUG`

### Issue: Slow execution

**Solution:**
- Reduce max_iterations for simple tasks
- Use more specific task descriptions
- Check network connectivity

## Best Practices

### 1. Task Descriptions

- Be specific about requirements
- Include acceptance criteria
- List relevant files if known
- Provide examples when helpful

### 2. Workspace Management

- Use separate workspaces for different projects
- Clean up workspaces after tasks
- Use version control in workspaces

### 3. Error Handling

- Always check state.agent_state
- Handle errors gracefully
- Log errors for debugging
- Implement retry logic for transient failures

### 4. Progress Tracking

- Use progress callbacks
- Monitor iteration count
- Set reasonable timeouts
- Cancel long-running tasks if needed

## Next Steps

1. **Try the examples** - Run each example to understand the patterns
2. **Read the docs** - Review `/home/user/skills-claude/OpenHands/docs/orchestrator_integration.md`
3. **Experiment** - Modify examples for your use cases
4. **Integrate** - Use orchestrator in your own code

## Resources

- [Phase 2 Integration Guide](../../docs/orchestrator_integration.md)
- [TaskOrchestrator Documentation](../../openhands/orchestrator/README.md)
- [AgentHub Documentation](../../openhands/agent_hub/README.md)
- [MCP Servers Documentation](../../openhands/mcp_servers/README.md)

## Contributing

Found a bug or want to add an example?

1. Fork the repository
2. Create your feature branch
3. Add tests
4. Submit a pull request

## Support

- GitHub Issues: Report bugs and request features
- Documentation: Check the docs directory
- Examples: Review existing examples

---

Happy coding with TaskOrchestrator! 🚀
