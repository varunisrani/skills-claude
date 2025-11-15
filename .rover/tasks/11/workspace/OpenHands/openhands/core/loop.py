import asyncio
from typing import Union

from openhands.controller import AgentController
from openhands.controller.orchestrator_adapter import OrchestratorAdapter
from openhands.core.logger import openhands_logger as logger
from openhands.core.schema import AgentState
from openhands.memory.memory import Memory
from openhands.runtime.base import Runtime
from openhands.runtime.runtime_status import RuntimeStatus


async def run_agent_until_done(
    controller: Union[AgentController, OrchestratorAdapter],
    runtime: Runtime,
    memory: Memory,
    end_states: list[AgentState],
    skip_set_callback: bool = False,
) -> None:
    """run_agent_until_done takes a controller/orchestrator and a runtime, and will run
    the agent until it reaches a terminal state.
    Note that runtime must be connected before being passed in here.

    Phase 6C: Now supports both AgentController (legacy) and OrchestratorAdapter (SDK).
    """
    # Detect executor type
    is_sdk_agent = isinstance(controller, OrchestratorAdapter)
    executor_type = "SDK" if is_sdk_agent else "Legacy"

    logger.info(f"Running agent loop with {executor_type} executor")

    def status_callback(msg_type: str, runtime_status: RuntimeStatus, msg: str) -> None:
        if msg_type == 'error':
            logger.error(msg)
            if controller:
                # Get state from appropriate executor
                if is_sdk_agent:
                    state = controller.get_state()
                    if state:
                        state.last_error = msg
                        state.agent_state = AgentState.ERROR
                else:
                    controller.state.last_error = msg
                    asyncio.create_task(controller.set_agent_state_to(AgentState.ERROR))
        else:
            logger.info(msg)

    if not skip_set_callback:
        if hasattr(runtime, 'status_callback') and runtime.status_callback:
            raise ValueError(
                'Runtime status_callback was set, but run_agent_until_done will override it'
            )
        if hasattr(controller, 'status_callback') and controller.status_callback:
            raise ValueError(
                'Controller status_callback was set, but run_agent_until_done will override it'
            )

        runtime.status_callback = status_callback
        controller.status_callback = status_callback
        memory.status_callback = status_callback

    # Main event loop - unified for both executor types
    while True:
        # Get current state from appropriate executor
        if is_sdk_agent:
            state = controller.get_state()
            current_state = state.agent_state if state else AgentState.ERROR
        else:
            current_state = controller.state.agent_state

        # Check if we've reached a terminal state
        if current_state in end_states:
            logger.info(f"{executor_type} agent reached terminal state: {current_state}")
            break

        # Track SDK-specific metrics if available
        if is_sdk_agent and state and hasattr(state, 'sdk_metadata'):
            if state.sdk_metadata:
                logger.debug(
                    f"SDK agent progress - "
                    f"iteration: {state.iteration}, "
                    f"sdk_steps: {state.sdk_metadata.get('step_count', 0)}"
                )

        await asyncio.sleep(1)
