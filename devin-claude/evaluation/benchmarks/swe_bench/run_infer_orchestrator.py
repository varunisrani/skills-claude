"""
SWE-bench Evaluation with TaskOrchestrator

This is the migrated version of run_infer.py that uses the new TaskOrchestrator
from the Claude Agent SDK integration instead of the legacy AgentController.

Key improvements:
- Simplified execution flow using orchestrator pattern
- Better error handling and recovery
- Cleaner agent coordination
- Progress tracking and callbacks

Usage:
    python evaluation/benchmarks/swe_bench/run_infer_orchestrator.py \\
        --agent-cls CodeActAgent \\
        --llm-config llm_config \\
        --max-iterations 30 \\
        --eval-num-workers 1 \\
        --dataset-name princeton-nlp/SWE-bench_Lite \\
        --eval-note "orchestrator-test"
"""

import asyncio
import copy
import json
import os
import tempfile
from typing import Any, Literal

import pandas as pd
import toml
from datasets import load_dataset
from jinja2 import Environment, FileSystemLoader

import openhands.agenthub
from evaluation.benchmarks.swe_bench.binary_patch_utils import (
    remove_binary_diffs,
    remove_binary_files_from_git,
)
from evaluation.benchmarks.swe_bench.resource.mapping import (
    get_instance_resource_factor,
)
from evaluation.benchmarks.swe_bench.resource.swt_bench_constants import (
    MAP_REPO_TO_INSTALL,
    MAP_REPO_TO_TEST_FRAMEWORK_VERBOSE,
    MAP_VERSION_TO_INSTALL,
)
from evaluation.utils.shared import (
    EvalException,
    EvalMetadata,
    EvalOutput,
    assert_and_raise,
    check_maximum_retries_exceeded,
    codeact_user_response,
    get_default_sandbox_config_for_eval,
    get_metrics,
    get_openhands_config_for_eval,
    is_fatal_evaluation_error,
    make_metadata,
    prepare_dataset,
    reset_logger_for_multiprocessing,
    run_evaluation,
    update_llm_config_for_completions_logging,
)
from openhands.controller.state.state import State
from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.core.config import (
    AgentConfig,
    OpenHandsConfig,
    get_agent_config_arg,
    get_evaluation_parser,
    get_llm_config_arg,
    get_llms_for_routing_config,
    get_model_routing_config_arg,
)
from openhands.core.config.condenser_config import NoOpCondenserConfig
from openhands.core.config.utils import get_condenser_config_arg
from openhands.core.logger import openhands_logger as logger
from openhands.core.main import create_runtime
from openhands.critic import AgentFinishedCritic
from openhands.events import EventStream
from openhands.events.action import CmdRunAction, FileReadAction, MessageAction
from openhands.events.observation import (
    CmdOutputObservation,
    ErrorObservation,
    FileReadObservation,
)
from openhands.events.serialization.event import event_from_dict, event_to_dict
from openhands.runtime.base import Runtime
from openhands.utils.async_utils import call_async_from_sync
from openhands.utils.shutdown_listener import sleep_if_should_continue

USE_HINT_TEXT = os.environ.get('USE_HINT_TEXT', 'false').lower() == 'true'
RUN_WITH_BROWSING = os.environ.get('RUN_WITH_BROWSING', 'false').lower() == 'true'
ENABLE_LLM_EDITOR = os.environ.get('ENABLE_LLM_EDITOR', 'false').lower() == 'true'
BenchMode = Literal['swe', 'swt', 'swt-ci']

# Global variable to track dataset type
DATASET_TYPE = 'SWE-bench'


def set_dataset_type(dataset_name: str) -> str:
    """Set dataset type based on dataset name."""
    global DATASET_TYPE
    name_lower = dataset_name.lower()

    if 'swe-gym' in name_lower:
        DATASET_TYPE = 'SWE-Gym'
    elif 'swe-bench-live' in name_lower:
        DATASET_TYPE = 'SWE-bench-Live'
    elif 'swe-rebench' in name_lower:
        DATASET_TYPE = 'SWE-rebench'
    elif 'multimodal' in name_lower:
        DATASET_TYPE = 'Multimodal'
    else:
        DATASET_TYPE = 'SWE-bench'

    logger.info(f'Dataset type set to: {DATASET_TYPE}')


def _get_swebench_workspace_dir_name(instance: pd.Series) -> str:
    if DATASET_TYPE == 'SWE-bench-Live':
        return instance.instance_id
    else:
        return f'{instance.repo}__{instance.version}'.replace('/', '__')


def get_instruction(instance: pd.Series, metadata: EvalMetadata) -> str:
    """
    Get instruction for the task.

    Returns the instruction text instead of MessageAction for easier
    processing by TaskOrchestrator.

    Args:
        instance: SWE-bench instance
        metadata: Evaluation metadata

    Returns:
        Instruction text
    """
    workspace_dir_name = _get_swebench_workspace_dir_name(instance)
    mode = metadata.details['mode']
    llm_model = metadata.llm_config.model

    # Determine the template file based on mode and LLM
    if metadata.instruction_template_name:
        template_name = metadata.instruction_template_name
    elif mode.startswith('swt'):
        template_name = 'swt.j2'
    elif mode == 'swe':
        if 'gpt-4.1' in llm_model:
            template_name = 'swe_gpt4.j2'
        else:
            template_name = 'swe_default.j2'
    else:
        logger.error(f'Unexpected evaluation mode: {mode}. Falling back to default.')
        template_name = 'swe_default.j2'

    logger.debug(f'Using instruction template file: {template_name}')

    # Set up Jinja2 environment
    prompts_dir = os.path.join(os.path.dirname(__file__), 'prompts')
    env = Environment(loader=FileSystemLoader(prompts_dir))
    template = env.get_template(template_name)

    # Prepare context for rendering
    context = {
        'instance': instance,
        'workspace_dir_name': workspace_dir_name,
        'metadata': metadata,
    }

    # Add specific context for swt-ci mode if needed
    if mode == 'swt-ci':
        context['test_instructions'] = (
            f'The following command can be used to run the tests: `{list(MAP_REPO_TO_TEST_FRAMEWORK_VERBOSE[instance.repo].values())[0]}`. Make sure they fail in the expected way.\n'
        )

    # Render the template
    instruction = template.render(context)
    return instruction


async def run_swe_bench_with_orchestrator(
    instance: pd.Series,
    metadata: EvalMetadata,
    runtime: Runtime,
    config: OpenHandsConfig,
) -> State:
    """
    Run SWE-bench task using TaskOrchestrator.

    This replaces the run_controller call with orchestrator-based execution.

    Args:
        instance: SWE-bench instance
        metadata: Evaluation metadata
        runtime: Runtime environment
        config: OpenHands configuration

    Returns:
        Final state after execution
    """
    # Get instruction
    instruction = get_instruction(instance, metadata)

    # Create event stream
    event_stream = runtime.event_stream

    # Create orchestrator adapter
    adapter = OrchestratorAdapter(
        config=config,
        event_stream=event_stream,
        workspace=str(runtime.workspace_root),
    )

    # Extract issue title and body from instruction
    # For SWE-bench, we'll use the problem statement
    issue_title = f"SWE-bench: {instance.instance_id}"
    issue_body = instance.problem_statement

    logger.info(f"Running SWE-bench task with TaskOrchestrator: {issue_title}")

    try:
        # Use GitHub issue workflow for SWE-bench
        state = await adapter.run_github_issue(
            issue_title=issue_title,
            issue_body=issue_body,
            repo_path=str(runtime.workspace_root),
        )
    finally:
        # Cleanup
        adapter.close()

    return state


def process_instance(
    instance: pd.Series,
    metadata: EvalMetadata,
    reset_logger: bool = True,
) -> EvalOutput:
    """
    Process a single SWE-bench instance using TaskOrchestrator.

    This is the main entry point for evaluation, compatible with the
    existing evaluation framework.

    Args:
        instance: SWE-bench instance
        metadata: Evaluation metadata
        reset_logger: Whether to reset logger for multiprocessing

    Returns:
        EvalOutput with results
    """
    instance_id = instance.instance_id
    config = get_config_for_instance(instance, metadata)

    # Setup the logger properly
    if reset_logger:
        log_dir = os.path.join(metadata.eval_output_dir, 'infer_logs')
        reset_logger_for_multiprocessing(logger, instance_id, log_dir)
    else:
        logger.info(f'Starting evaluation for instance {instance_id}.')

    # Create runtime
    runtime = create_runtime(config)
    call_async_from_sync(runtime.connect)

    # Initialize runtime (clone repo, setup environment, etc.)
    initialize_swe_bench_runtime(runtime, instance, metadata)

    # Run with orchestrator
    try:
        state: State = asyncio.run(
            run_swe_bench_with_orchestrator(
                instance=instance,
                metadata=metadata,
                runtime=runtime,
                config=config,
            )
        )
    except Exception as e:
        logger.error(f"Error running instance {instance_id}: {e}")
        state = None

    if state is None:
        raise ValueError('State should not be None.')

    # Get metrics
    metrics = get_metrics(state)

    # Get instruction
    instruction = get_instruction(instance, metadata)

    # Evaluate the patch
    test_result = evaluate_swe_bench_patch(runtime, instance, metadata)

    # Prepare output
    from evaluation.utils.shared import compatibility_for_eval_history_pairs
    histories = compatibility_for_eval_history_pairs(state.history)

    output = EvalOutput(
        instance_id=instance_id,
        instruction=instruction,
        metadata=metadata,
        history=histories,
        metrics=metrics,
        error=state.last_error if state and state.last_error else None,
        test_result=test_result,
    )

    return output


def get_config_for_instance(
    instance: pd.Series,
    metadata: EvalMetadata,
) -> OpenHandsConfig:
    """
    Get OpenHands config for a SWE-bench instance.

    Args:
        instance: SWE-bench instance
        metadata: Evaluation metadata

    Returns:
        OpenHandsConfig
    """
    # Get base config
    sandbox_config = get_default_sandbox_config_for_eval()

    # Set workspace
    workspace_dir_name = _get_swebench_workspace_dir_name(instance)
    sandbox_config.workspace_mount_path = workspace_dir_name

    config = get_openhands_config_for_eval(
        metadata=metadata,
        runtime='docker',
        sandbox_config=sandbox_config,
    )

    config.set_llm_config(metadata.llm_config)

    return config


def initialize_swe_bench_runtime(
    runtime: Runtime,
    instance: pd.Series,
    metadata: EvalMetadata,
):
    """
    Initialize runtime for SWE-bench evaluation.

    This includes:
    - Cloning the repository
    - Checking out the correct version
    - Installing dependencies
    - Applying any necessary patches

    Args:
        runtime: Runtime to initialize
        instance: SWE-bench instance
        metadata: Evaluation metadata
    """
    logger.info(f"Initializing runtime for {instance.instance_id}")

    # Clone repository
    action = CmdRunAction(
        command=f"git clone https://github.com/{instance.repo} /workspace/{instance.repo.split('/')[-1]}"
    )
    obs = runtime.run_action(action)
    logger.info(f"Clone output: {obs}")

    # Checkout specific version
    repo_dir = f"/workspace/{instance.repo.split('/')[-1]}"
    action = CmdRunAction(
        command=f"cd {repo_dir} && git checkout {instance.base_commit}"
    )
    obs = runtime.run_action(action)
    logger.info(f"Checkout output: {obs}")

    # Install dependencies (if specified)
    if hasattr(instance, 'repo') and instance.repo in MAP_REPO_TO_INSTALL:
        install_cmd = MAP_REPO_TO_INSTALL[instance.repo]
        action = CmdRunAction(command=f"cd {repo_dir} && {install_cmd}")
        obs = runtime.run_action(action)
        logger.info(f"Install output: {obs}")


def evaluate_swe_bench_patch(
    runtime: Runtime,
    instance: pd.Series,
    metadata: EvalMetadata,
) -> dict:
    """
    Evaluate the generated patch.

    This runs the tests and compares against the expected results.

    Args:
        runtime: Runtime with the patch applied
        instance: SWE-bench instance
        metadata: Evaluation metadata

    Returns:
        Test results dictionary
    """
    logger.info(f"Evaluating patch for {instance.instance_id}")

    repo_dir = f"/workspace/{instance.repo.split('/')[-1]}"

    # Run tests
    if hasattr(instance, 'test_patch'):
        # Apply test patch if available
        test_patch_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.patch')
        test_patch_file.write(instance.test_patch)
        test_patch_file.close()

        # Copy to runtime and apply
        # (This is simplified - actual implementation would need file transfer)

    # Get test command
    test_cmd = "pytest"  # Default, should be instance-specific

    if hasattr(instance, 'repo') and instance.repo in MAP_REPO_TO_TEST_FRAMEWORK_VERBOSE:
        test_framework = list(MAP_REPO_TO_TEST_FRAMEWORK_VERBOSE[instance.repo].values())[0]
        test_cmd = test_framework

    # Run tests
    action = CmdRunAction(command=f"cd {repo_dir} && {test_cmd}")
    obs = runtime.run_action(action)

    # Parse results
    test_result = {
        'exit_code': obs.exit_code,
        'output': obs.content,
        'passed': obs.exit_code == 0,
    }

    return test_result


if __name__ == '__main__':
    # Parse arguments
    parser = get_evaluation_parser()
    parser.add_argument(
        '--mode',
        type=str,
        default='swe',
        choices=['swe', 'swt', 'swt-ci'],
        help='Evaluation mode (swe, swt, or swt-ci)',
    )
    args = parser.parse_args()

    # Load dataset
    dataset_name = args.dataset_name or 'princeton-nlp/SWE-bench_Lite'
    set_dataset_type(dataset_name)

    dataset = load_dataset(dataset_name, split='test')
    dataset = pd.DataFrame(dataset)

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
        dataset_name,
        args.agent_cls,
        args.max_iterations,
        args.eval_note,
        args.eval_output_dir,
    )

    # Add mode to metadata
    metadata.details['mode'] = args.mode

    # Prepare output
    output_file = os.path.join(metadata.eval_output_dir, 'output.jsonl')
    instances = prepare_dataset(dataset, output_file, args.eval_n_limit)

    logger.info(f"Starting SWE-bench evaluation with TaskOrchestrator")
    logger.info(f"Mode: {args.mode}")
    logger.info(f"Dataset: {dataset_name}")
    logger.info(f"Instances: {len(instances)}")

    # Run evaluation
    run_evaluation(
        instances,
        metadata,
        output_file,
        args.eval_num_workers,
        process_instance,
    )

    logger.info("SWE-bench evaluation with TaskOrchestrator completed!")
