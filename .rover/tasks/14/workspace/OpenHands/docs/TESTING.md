# Testing Guide for OpenHands Claude Agent SDK Integration

This guide provides comprehensive documentation for testing the Claude Agent SDK integration in OpenHands.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Categories](#test-categories)
5. [Writing Tests](#writing-tests)
6. [Performance Benchmarking](#performance-benchmarking)
7. [Validation](#validation)
8. [Quality Assurance](#quality-assurance)
9. [CI/CD Integration](#cicd-integration)
10. [Troubleshooting](#troubleshooting)

## Overview

The OpenHands testing infrastructure provides comprehensive coverage for the Claude Agent SDK integration:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete workflows
- **Performance Benchmarks**: Measure and compare performance
- **Validation Scripts**: Validate against SWE-bench and WebArena
- **Cost Analysis**: Track and analyze API costs

### Coverage Goals

- Unit tests: >80% code coverage
- Integration tests: All major component interactions
- E2E tests: Key workflows and use cases
- Performance baselines established and monitored

## Test Structure

```
OpenHands/
├── tests/
│   ├── conftest.py              # Shared fixtures and configuration
│   ├── unit/                    # Unit tests (fast, no external deps)
│   │   ├── test_agent_hub.py
│   │   ├── test_task_orchestrator.py
│   │   ├── test_orchestrator_adapter.py
│   │   └── test_mcp_servers.py
│   ├── integration/             # Integration tests
│   │   ├── test_orchestrator_integration.py
│   │   ├── test_swe_bench_integration.py
│   │   └── test_webarena_integration.py
│   └── e2e/                     # End-to-end tests (requires API)
│       ├── test_simple_workflows.py
│       └── test_complex_workflows.py
├── benchmarks/                  # Performance benchmarking
│   ├── performance_compare.py
│   ├── resource_monitor.py
│   └── cost_analyzer.py
└── validation/                  # Dataset validation
    ├── validate_swe_bench.py
    └── validate_webarena.py
```

## Running Tests

### Quick Start

```bash
# Run unit tests (fast, no API key required)
make test-unit

# Run all tests
make test-all

# Run with coverage
make coverage
```

### Detailed Commands

```bash
# Unit tests only
pytest tests/unit -v -m unit

# Integration tests
pytest tests/integration -v -m integration

# E2E tests (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY="your-key-here"
pytest tests/e2e -v -m e2e

# Run specific test file
pytest tests/unit/test_agent_hub.py -v

# Run specific test
pytest tests/unit/test_agent_hub.py::TestAgentHub::test_hub_initialization -v

# Run tests excluding slow tests
pytest tests/ -v -m "not slow"

# Run tests with specific marker
pytest tests/ -v -m "unit and not slow"
```

### Test Markers

Tests are categorized using pytest markers:

- `@pytest.mark.unit` - Fast unit tests, no external dependencies
- `@pytest.mark.integration` - Integration tests, may mock external services
- `@pytest.mark.e2e` - End-to-end tests, require real services
- `@pytest.mark.api` - Tests requiring API keys
- `@pytest.mark.slow` - Slow-running tests (>10 seconds)
- `@pytest.mark.benchmark` - Performance benchmarking tests
- `@pytest.mark.swe_bench` - SWE-bench specific tests
- `@pytest.mark.webarena` - WebArena specific tests

## Test Categories

### Unit Tests

Unit tests validate individual components in isolation using mocks:

```python
@pytest.mark.unit
async def test_agent_hub_initialization(temp_workspace):
    """Test AgentHub initializes correctly."""
    hub = AgentHub(workspace=str(temp_workspace), api_key="test-key")
    assert hub.workspace == temp_workspace
    assert len(hub.configs) == 5
```

**Run unit tests:**
```bash
pytest tests/unit -v
```

### Integration Tests

Integration tests validate component interactions with mocked external services:

```python
@pytest.mark.integration
async def test_orchestrator_with_hub(temp_workspace):
    """Test TaskOrchestrator integration with AgentHub."""
    async with TaskOrchestrator(...) as orchestrator:
        result = await orchestrator.execute_simple_task(...)
        assert result.status == TaskStatus.COMPLETED
```

**Run integration tests:**
```bash
pytest tests/integration -v
```

### End-to-End Tests

E2E tests validate complete workflows with real API calls:

```python
@pytest.mark.e2e
@pytest.mark.api
@pytest.mark.skip(reason="Requires ANTHROPIC_API_KEY")
async def test_github_issue_workflow(temp_workspace, skip_without_api_key):
    """Test complete GitHub issue resolution."""
    # Real API call with actual orchestrator
```

**Run E2E tests:**
```bash
export ANTHROPIC_API_KEY="your-key"
pytest tests/e2e -v
```

**Note:** E2E tests are skipped by default. Remove `@pytest.mark.skip` or use `pytest --run-skipped` to run them.

## Writing Tests

### Test Fixtures

Common fixtures are available in `tests/conftest.py`:

```python
def test_example(temp_workspace, mock_config, mock_event_stream):
    """Example test using fixtures."""
    # temp_workspace: Temporary directory
    # mock_config: Mocked OpenHandsConfig
    # mock_event_stream: Mocked EventStream
```

Available fixtures:
- `temp_workspace` - Temporary workspace directory
- `api_key` - API key from environment or mock
- `mock_claude_client` - Mocked ClaudeSDKClient
- `mock_agent_hub` - Mocked AgentHub
- `mock_orchestrator` - Mocked TaskOrchestrator
- `mock_event_stream` - Mocked EventStream
- `mock_config` - Mocked OpenHandsConfig
- `mock_jupyter_mcp` - Mocked Jupyter MCP server
- `mock_browser_mcp` - Mocked Browser MCP server
- `sample_issue` - Sample GitHub issue data
- `performance_tracker` - Performance metrics tracker
- `cost_tracker` - Cost tracking utilities

### Writing Unit Tests

```python
import pytest
from unittest.mock import Mock, AsyncMock, patch

@pytest.mark.unit
class TestMyComponent:
    """Test MyComponent class."""

    def test_initialization(self):
        """Test component initializes correctly."""
        component = MyComponent(param="value")
        assert component.param == "value"

    async def test_async_method(self):
        """Test async method."""
        component = MyComponent()
        result = await component.async_method()
        assert result is not None

    @patch('module.ExternalDependency')
    async def test_with_mock(self, mock_dep):
        """Test with mocked dependency."""
        mock_dep.return_value = Mock()
        component = MyComponent()
        result = await component.method_using_dependency()
        assert mock_dep.called
```

### Writing Integration Tests

```python
@pytest.mark.integration
class TestComponentIntegration:
    """Test component integration."""

    @patch('external.service.ApiClient')
    async def test_integration(self, mock_api):
        """Test integration between components."""
        # Setup mocks
        mock_api.return_value.call = AsyncMock(return_value="response")

        # Test interaction
        component_a = ComponentA()
        component_b = ComponentB()

        result = await component_a.interact_with(component_b)

        assert result.success
```

### Best Practices

1. **Use descriptive test names**: `test_agent_hub_caching_works_correctly`
2. **One assertion per test** (when possible)
3. **Use fixtures for common setup**
4. **Mock external dependencies** in unit/integration tests
5. **Test error cases** as well as happy paths
6. **Use async/await correctly** for async tests
7. **Clean up resources** in fixtures or teardown
8. **Document test intent** with docstrings

## Performance Benchmarking

### Running Benchmarks

```bash
# Quick benchmark (simple task, 1 run)
make benchmark-quick

# Full benchmark (all tasks, 3 runs)
make benchmark

# Custom benchmark
python benchmarks/performance_compare.py --task github_issue --runs 5 --output results.json
```

### Resource Monitoring

```bash
# Monitor task execution
python benchmarks/resource_monitor.py --task "Analyze codebase" --output monitor.json

# Standalone monitoring
python benchmarks/resource_monitor.py --duration 60 --interval 1
```

### Cost Analysis

```bash
# Estimate cost
python benchmarks/cost_analyzer.py --estimate \
    --input-tokens 10000 --output-tokens 5000 --model claude-sonnet-4-5

# Analyze API log
python benchmarks/cost_analyzer.py --log api_calls.json --detailed --output report.json
```

### Performance Baselines

Current performance baselines (update after establishing):

| Metric | Orchestrator (New) | Legacy (Old) | Improvement |
|--------|-------------------|--------------|-------------|
| Simple Task | TBD | TBD | TBD |
| GitHub Issue | TBD | TBD | TBD |
| Memory Usage | TBD | TBD | TBD |
| Token Efficiency | TBD | TBD | TBD |

## Validation

### SWE-bench Validation

```bash
# Small dataset (5-10 instances)
python validation/validate_swe_bench.py --dataset small --output swe_results.json

# Compare with baseline
python validation/validate_swe_bench.py --dataset small \
    --baseline baseline_results.json --output new_results.json
```

### WebArena Validation

```bash
# All tasks
python validation/validate_webarena.py --tasks all --output webarena_results.json

# Specific category
python validation/validate_webarena.py --tasks shopping --limit 5
```

## Quality Assurance

### Linting

```bash
# Check code
make lint

# Auto-fix issues
make format
```

Configuration: `ruff.toml`

### Type Checking

```bash
# Run mypy
make typecheck
```

Configuration: `mypy.ini`

### Coverage

```bash
# Generate coverage report
make coverage

# View HTML report
open htmlcov/index.html
```

Configuration: `.coveragerc`

Target: **>80% coverage** for core components

### Full QA Suite

```bash
# Run all QA checks
make qa
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.12'

    - name: Install dependencies
      run: |
        pip install -r requirements-dev.txt

    - name: Run QA checks
      run: make qa

    - name: Run unit tests
      run: make test-unit

    - name: Run integration tests
      run: make test-integration

    - name: Generate coverage
      run: make coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: local
    hooks:
      - id: pytest-unit
        name: pytest-unit
        entry: pytest tests/unit -v
        language: system
        pass_filenames: false
        always_run: true
```

Install hooks:
```bash
pre-commit install
```

## Troubleshooting

### Common Issues

#### 1. Tests Failing with "Module Not Found"

```bash
# Ensure OpenHands is in PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or install in development mode
pip install -e .
```

#### 2. API Key Issues

```bash
# Set API key
export ANTHROPIC_API_KEY="your-key-here"

# Verify it's set
echo $ANTHROPIC_API_KEY
```

#### 3. Async Test Issues

Ensure `pytest-asyncio` is installed and configured:

```bash
pip install pytest-asyncio
```

In `pytest.ini`:
```ini
[pytest]
asyncio_mode = auto
```

#### 4. Mock Not Working

Ensure mock patches use correct import path:

```python
# ✗ Wrong - patches where it's defined
@patch('openhands.agent_hub.AgentHub')

# ✓ Correct - patches where it's imported
@patch('openhands.orchestrator.task_orchestrator.AgentHub')
```

#### 5. Coverage Too Low

Identify uncovered code:

```bash
pytest --cov=openhands --cov-report=html tests/
open htmlcov/index.html
```

### Debug Mode

```bash
# Verbose output
pytest -vv tests/

# Show print statements
pytest -s tests/

# Stop at first failure
pytest -x tests/

# Drop into debugger on failure
pytest --pdb tests/

# Show local variables on failure
pytest -l tests/
```

### Performance Issues

If tests are slow:

```bash
# Run only fast tests
pytest -v -m "not slow"

# Run in parallel (requires pytest-xdist)
pytest -n auto tests/unit
```

## Contributing

When adding new features:

1. Write unit tests first (TDD)
2. Add integration tests for interactions
3. Add E2E tests for critical workflows
4. Update documentation
5. Ensure >80% coverage
6. Run full QA suite before PR

### Test Checklist

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests considered (add if needed)
- [ ] Fixtures reused where possible
- [ ] Error cases tested
- [ ] Documentation updated
- [ ] Coverage >80%
- [ ] All QA checks pass
- [ ] Performance impact considered

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [mypy Documentation](https://mypy.readthedocs.io/)
- [Coverage.py](https://coverage.readthedocs.io/)

## Questions?

For questions or issues with testing:
1. Check this documentation
2. Review existing tests for examples
3. Check troubleshooting section
4. Ask in team chat or create an issue
