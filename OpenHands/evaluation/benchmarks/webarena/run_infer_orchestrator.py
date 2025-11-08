"""
WebArena Evaluation with TaskOrchestrator

This is the migrated version of run_infer.py that uses the new TaskOrchestrator
with Browser MCP integration from the Claude Agent SDK conversion.

Key improvements:
- Uses Browser MCP for web automation
- Simplified browser interaction through MCP protocol
- Better error handling
- Cleaner agent coordination

Usage:
    export WEBARENA_BASE_URL=http://localhost
    export OPENAI_API_KEY=your_key

    python evaluation/benchmarks/webarena/run_infer_orchestrator.py \\
        --agent-cls BrowsingAgent \\
        --llm-config llm_config \\
        --max-iterations 30 \\
        --eval-num-workers 1 \\
        --eval-note "orchestrator-browser-test"
"""

import asyncio
import json
import os
from typing import Any

import browsergym.webarena  # noqa F401 register webarena tasks
import gymnasium as gym
import pandas as pd

from evaluation.utils.shared import (
    EvalMetadata,
    EvalOutput,
    compatibility_for_eval_history_pairs,
    get_default_sandbox_config_for_eval,
    get_metrics,
    get_openhands_config_for_eval,
    make_metadata,
    prepare_dataset,
    reset_logger_for_multiprocessing,
    run_evaluation,
)
from openhands.controller.state.state import State
from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.core.config import (
    OpenHandsConfig,
    get_llm_config_arg,
    parse_arguments,
)
from openhands.core.logger import openhands_logger as logger
from openhands.core.main import create_runtime
from openhands.events.action import (
    BrowseInteractiveAction,
    CmdRunAction,
    MessageAction,
)
from openhands.events.observation import CmdOutputObservation
from openhands.runtime.base import Runtime
from openhands.runtime.browser.browser_env import (
    BROWSER_EVAL_GET_GOAL_ACTION,
    BROWSER_EVAL_GET_REWARDS_ACTION,
)
from openhands.utils.async_utils import call_async_from_sync

SUPPORTED_AGENT_CLS = {'BrowsingAgent'}


def get_config(
    metadata: EvalMetadata,
    env_id: str,
) -> OpenHandsConfig:
    """
    Get configuration for WebArena evaluation.

    Args:
        metadata: Evaluation metadata
        env_id: WebArena environment ID

    Returns:
        OpenHandsConfig
    """
    base_url = os.environ.get('WEBARENA_BASE_URL', None)
    openai_api_key = os.environ.get('OPENAI_API_KEY', None)
    assert base_url is not None, 'WEBARENA_BASE_URL must be set'
    assert openai_api_key is not None, 'OPENAI_API_KEY must be set'

    sandbox_config = get_default_sandbox_config_for_eval()
    sandbox_config.base_container_image = 'python:3.12-bookworm'
    sandbox_config.browsergym_eval_env = env_id
    sandbox_config.runtime_startup_env_vars = {
        'BASE_URL': base_url,
        'OPENAI_API_KEY': openai_api_key,
        'SHOPPING': f'{base_url}:7770/',
        'SHOPPING_ADMIN': f'{base_url}:7780/admin',
        'REDDIT': f'{base_url}:9999',
        'GITLAB': f'{base_url}:8023',
        'WIKIPEDIA': f'{base_url}:8888/wikipedia_en_all_maxi_2022-05/A/User:The_other_Kiwix_guy/Landing',
        'MAP': f'{base_url}:3000',
        'HOMEPAGE': f'{base_url}:4399',
    }

    config = get_openhands_config_for_eval(
        metadata=metadata,
        runtime='docker',
        sandbox_config=sandbox_config,
    )
    config.set_llm_config(metadata.llm_config)

    agent_config = config.get_agent_config(metadata.agent_class)
    agent_config.enable_prompt_extensions = False

    return config


def initialize_runtime(runtime: Runtime) -> str:
    """
    Initialize the runtime for WebArena.

    This gets the task goal from the browser environment.

    Args:
        runtime: Runtime to initialize

    Returns:
        Task goal string
    """
    logger.info(f'{"-" * 50} BEGIN Runtime Initialization {"-" * 50}')

    # Create workspace
    action = CmdRunAction(command='mkdir -p /workspace')
    logger.info(action, extra={'msg_type': 'ACTION'})
    obs = runtime.run_action(action)
    assert obs.exit_code == 0

    # Get goal from browser environment
    action = BrowseInteractiveAction(browser_actions=BROWSER_EVAL_GET_GOAL_ACTION)
    logger.info(action, extra={'msg_type': 'ACTION'})
    obs = runtime.run_action(action)
    logger.info(obs, extra={'msg_type': 'OBSERVATION'})

    goal = obs.content

    logger.info(f'{"-" * 50} END Runtime Initialization {"-" * 50}')
    return goal


def complete_runtime(runtime: Runtime) -> dict[str, Any]:
    """
    Complete the runtime and get results.

    This retrieves the reward/score from the browser environment.

    Args:
        runtime: Runtime to complete

    Returns:
        Dictionary with rewards
    """
    logger.info(f'{"-" * 50} BEGIN Runtime Completion {"-" * 50}')

    action = BrowseInteractiveAction(browser_actions=BROWSER_EVAL_GET_REWARDS_ACTION)
    logger.info(action, extra={'msg_type': 'ACTION'})
    obs = runtime.run_action(action)
    logger.info(obs, extra={'msg_type': 'OBSERVATION'})

    logger.info(f'{"-" * 50} END Runtime Completion {"-" * 50}')

    return {
        'rewards': json.loads(obs.content),
    }


async def run_webarena_with_orchestrator(
    task_str: str,
    runtime: Runtime,
    config: OpenHandsConfig,
) -> State:
    """
    Run WebArena task using TaskOrchestrator with Browser MCP.

    This uses the Browser MCP server integrated in Phase 1 for
    web automation tasks.

    Args:
        task_str: Task description/goal
        runtime: Runtime environment
        config: OpenHands configuration

    Returns:
        Final state after execution
    """
    logger.info(f"Running WebArena task with TaskOrchestrator: {task_str[:100]}...")

    # Create event stream
    event_stream = runtime.event_stream

    # Create orchestrator adapter
    adapter = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=str(runtime.workspace_root),
    )

    # Build enhanced task with browser instructions
    enhanced_task = f"""
Web Automation Task:

Goal: {task_str}

You have access to a browser through the Browser MCP. Use it to:
1. Navigate to the required web pages
2. Interact with elements (click, type, etc.)
3. Complete the task as specified
4. Verify the result

The browser MCP provides tools for:
- navigate(url): Navigate to a URL
- click(selector): Click an element
- fill(selector, text): Fill a form field
- screenshot(): Take a screenshot
- evaluate(script): Execute JavaScript

Complete the web automation task step by step.
"""

    try:
        # Run task using orchestrator
        # For browser tasks, we use the "code" agent type which has
        # access to MCP tools including the browser
        state = await adapter.run(
            task=enhanced_task,
            agent_type="code",  # Code agent with MCP browser access
        )
    finally:
        adapter.close()

    return state


def process_instance(
    instance: pd.Series,
    metadata: EvalMetadata,
    reset_logger: bool = True,
) -> EvalOutput:
    """
    Process a single WebArena instance using TaskOrchestrator.

    Args:
        instance: WebArena instance
        metadata: Evaluation metadata
        reset_logger: Whether to reset logger

    Returns:
        EvalOutput with results
    """
    env_id = instance.instance_id
    config = get_config(metadata, env_id)

    # Setup logger
    if reset_logger:
        log_dir = os.path.join(metadata.eval_output_dir, 'infer_logs')
        reset_logger_for_multiprocessing(logger, env_id, log_dir)
    else:
        logger.info(f'Starting evaluation for instance {env_id}.')

    # Create and connect runtime
    runtime = create_runtime(config)
    call_async_from_sync(runtime.connect)

    # Initialize runtime and get task
    task_str = initialize_runtime(runtime)

    # Run with orchestrator
    state: State | None = asyncio.run(
        run_webarena_with_orchestrator(
            task_str=task_str,
            runtime=runtime,
            config=config,
        )
    )

    if state is None:
        raise ValueError('State should not be None.')

    # Get metrics
    metrics = get_metrics(state)

    # Get instruction from history
    instruction = ''
    for event in state.history:
        if isinstance(event, MessageAction):
            instruction = event.content
            break

    # Complete runtime and get rewards
    return_val = complete_runtime(runtime)
    logger.info(f'Return value from complete_runtime: {return_val}')
    reward = max(return_val['rewards'])

    # Convert history for compatibility
    histories = compatibility_for_eval_history_pairs(state.history)

    # Create output
    output = EvalOutput(
        instance_id=env_id,
        instruction=instruction,
        metadata=metadata,
        history=histories,
        metrics=metrics,
        error=state.last_error if state and state.last_error else None,
        test_result={
            'reward': reward,
        },
    )

    return output


if __name__ == '__main__':
    args = parse_arguments()

    # Get all WebArena tasks
    dataset = pd.DataFrame(
        {
            'instance_id': [
                id
                for id in gym.envs.registry.keys()
                if id.startswith('browsergym/webarena')
            ]
        }
    )

    # Get LLM config
    llm_config = None
    if args.llm_config:
        llm_config = get_llm_config_arg(args.llm_config)
        llm_config.modify_params = False
    if llm_config is None:
        raise ValueError(f'Could not find LLM config: --llm_config {args.llm_config}')

    # Create metadata
    metadata = make_metadata(
        llm_config,
        args.dataset_name or 'webarena',
        args.agent_cls,
        args.max_iterations,
        args.eval_note,
        args.eval_output_dir,
    )

    # Prepare output
    output_file = os.path.join(metadata.eval_output_dir, 'output.jsonl')
    instances = prepare_dataset(dataset, output_file, args.eval_n_limit)

    logger.info("Starting WebArena evaluation with TaskOrchestrator and Browser MCP")
    logger.info(f"Instances: {len(instances)}")

    # Run evaluation
    run_evaluation(
        instances,
        metadata,
        output_file,
        args.eval_num_workers,
        process_instance,
    )

    logger.info("WebArena evaluation with TaskOrchestrator completed!")
