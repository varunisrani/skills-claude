"""
Jupyter MCP Server for Claude Agent SDK

This module provides a custom MCP server that enables Claude agents to execute
Python code in Jupyter kernels. This replaces OpenHands' IPython execution
functionality with a cleaner, SDK-integrated approach.

Features:
- Execute Python code in isolated Jupyter kernels
- Capture stdout, stderr, and return values
- Support multiple concurrent kernels
- Automatic kernel lifecycle management

Usage:
    from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server

    jupyter_mcp = create_jupyter_mcp_server()

    options = ClaudeAgentOptions(
        allowed_tools=["mcp__jupyter__execute_python", "mcp__jupyter__kernel_info"],
        mcp_servers={"jupyter": jupyter_mcp}
    )
"""

from claude_agent_sdk import tool, create_sdk_mcp_server
import jupyter_client
import asyncio
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class JupyterKernelManager:
    """
    Manage Jupyter kernels for code execution.

    This class handles:
    - Creating and starting Jupyter kernels
    - Executing code and capturing output
    - Managing multiple concurrent kernels
    - Cleanup and resource management
    """

    def __init__(self):
        self.kernels: Dict[str, tuple] = {}  # kernel_id -> (KernelManager, KernelClient)
        self.default_kernel_id = "default"
        logger.info("JupyterKernelManager initialized")

    async def get_or_create_kernel(self, kernel_id: Optional[str] = None) -> jupyter_client.KernelClient:
        """
        Get existing kernel or create new one.

        Args:
            kernel_id: Optional kernel identifier (default: 'default')

        Returns:
            KernelClient instance ready for execution
        """
        kid = kernel_id or self.default_kernel_id

        if kid not in self.kernels:
            logger.info(f"Creating new Jupyter kernel: {kid}")

            # Start new kernel
            km = jupyter_client.KernelManager()
            km.start_kernel()
            kc = km.client()
            kc.start_channels()

            # Wait for kernel to be ready
            await asyncio.sleep(2)

            self.kernels[kid] = (km, kc)
            logger.info(f"Kernel {kid} created and ready")

        return self.kernels[kid][1]  # Return client

    async def execute_code(self, code: str, kernel_id: Optional[str] = None, timeout: int = 30) -> Dict:
        """
        Execute code in kernel and return results.

        Args:
            code: Python code to execute
            kernel_id: Optional kernel identifier
            timeout: Maximum execution time in seconds

        Returns:
            Dictionary with execution results:
            {
                "stdout": str,      # Standard output
                "stderr": str,      # Error output
                "success": bool,    # Execution success status
                "result": str       # Execution result value
            }
        """
        kc = await self.get_or_create_kernel(kernel_id)

        logger.info(f"Executing code in kernel {kernel_id or self.default_kernel_id}")
        logger.debug(f"Code:\n{code}")

        # Execute code
        msg_id = kc.execute(code)

        # Collect outputs
        outputs = []
        errors = []
        result_value = None

        start_time = asyncio.get_event_loop().time()

        try:
            while True:
                # Check timeout
                if asyncio.get_event_loop().time() - start_time > timeout:
                    logger.warning(f"Execution timeout after {timeout}s")
                    errors.append(f"Execution timeout after {timeout} seconds")
                    break

                try:
                    msg = kc.get_iopub_msg(timeout=1)
                    msg_type = msg['header']['msg_type']

                    if msg_type == 'stream':
                        # Standard output/error stream
                        stream_name = msg['content']['name']
                        text = msg['content']['text']
                        if stream_name == 'stdout':
                            outputs.append(text)
                        elif stream_name == 'stderr':
                            errors.append(text)

                    elif msg_type == 'execute_result':
                        # Execution result (return value)
                        result_value = msg['content']['data'].get('text/plain', '')
                        outputs.append(f"Result: {result_value}")

                    elif msg_type == 'display_data':
                        # Display data (plots, etc.)
                        data = msg['content']['data']
                        if 'text/plain' in data:
                            outputs.append(f"Display: {data['text/plain']}")

                    elif msg_type == 'error':
                        # Execution error
                        error_traceback = '\n'.join(msg['content']['traceback'])
                        errors.append(error_traceback)

                    elif msg_type == 'status':
                        # Check if execution is complete
                        if msg['content']['execution_state'] == 'idle':
                            break

                except Exception as e:
                    # Timeout waiting for message (normal)
                    break

        except Exception as e:
            logger.error(f"Error during code execution: {e}")
            errors.append(f"Execution error: {str(e)}")

        success = len(errors) == 0

        return {
            "stdout": '\n'.join(outputs),
            "stderr": '\n'.join(errors),
            "success": success,
            "result": result_value
        }

    def cleanup(self):
        """Cleanup all kernels."""
        logger.info(f"Cleaning up {len(self.kernels)} kernels")

        for kid, (km, kc) in self.kernels.items():
            try:
                kc.stop_channels()
                km.shutdown_kernel()
                logger.info(f"Kernel {kid} cleaned up")
            except Exception as e:
                logger.error(f"Error cleaning up kernel {kid}: {e}")

        self.kernels.clear()


# Global kernel manager instance
_kernel_manager = JupyterKernelManager()


@tool(
    "execute_python",
    "Execute Python code in a Jupyter kernel and return the output",
    {
        "code": {
            "type": "string",
            "description": "Python code to execute"
        },
        "kernel_id": {
            "type": "string",
            "description": "Optional kernel ID to use (default: 'default')",
            "optional": True
        }
    }
)
async def execute_python(args):
    """
    Execute Python code in Jupyter kernel.

    This tool allows Claude agents to run Python code and see results,
    enabling data analysis, testing, and computational tasks.

    Args:
        args: Dictionary with 'code' and optional 'kernel_id'

    Returns:
        MCP tool result with execution output
    """
    code = args.get("code", "")
    kernel_id = args.get("kernel_id")

    if not code:
        return {
            "content": [{
                "type": "text",
                "text": "Error: No code provided"
            }],
            "isError": True
        }

    try:
        result = await _kernel_manager.execute_code(code, kernel_id)

        # Format output text
        output_parts = []

        if result['success']:
            output_parts.append("✅ Execution succeeded")
        else:
            output_parts.append("❌ Execution failed")

        if result['stdout']:
            output_parts.append(f"\nOutput:\n{result['stdout']}")

        if result['stderr']:
            output_parts.append(f"\nErrors:\n{result['stderr']}")

        if not result['stdout'] and not result['stderr']:
            output_parts.append("\n(no output)")

        output_text = '\n'.join(output_parts)

        return {
            "content": [{
                "type": "text",
                "text": output_text
            }],
            "isError": not result['success']
        }

    except Exception as e:
        logger.error(f"Error executing Python code: {e}")
        return {
            "content": [{
                "type": "text",
                "text": f"Error executing code: {str(e)}"
            }],
            "isError": True
        }


@tool(
    "kernel_info",
    "Get information about available Jupyter kernels",
    {}
)
async def kernel_info(args):
    """
    Get kernel information.

    Returns information about active Jupyter kernels managed by this MCP server.

    Args:
        args: Empty dictionary (no arguments required)

    Returns:
        MCP tool result with kernel information
    """
    kernel_ids = list(_kernel_manager.kernels.keys())

    info_parts = [
        f"Active Kernels: {len(kernel_ids)}",
    ]

    if kernel_ids:
        info_parts.append(f"Kernel IDs: {', '.join(kernel_ids)}")
    else:
        info_parts.append("No active kernels (kernels are created on first use)")

    info_text = '\n'.join(info_parts)

    return {
        "content": [{
            "type": "text",
            "text": info_text
        }]
    }


@tool(
    "reset_kernel",
    "Reset (restart) a Jupyter kernel",
    {
        "kernel_id": {
            "type": "string",
            "description": "Kernel ID to reset (default: 'default')",
            "optional": True
        }
    }
)
async def reset_kernel(args):
    """
    Reset a Jupyter kernel.

    This restarts the kernel, clearing all variables and state.

    Args:
        args: Dictionary with optional 'kernel_id'

    Returns:
        MCP tool result confirming reset
    """
    kernel_id = args.get("kernel_id") or _kernel_manager.default_kernel_id

    if kernel_id not in _kernel_manager.kernels:
        return {
            "content": [{
                "type": "text",
                "text": f"Kernel '{kernel_id}' does not exist"
            }],
            "isError": True
        }

    try:
        # Remove and recreate kernel
        km, kc = _kernel_manager.kernels[kernel_id]
        kc.stop_channels()
        km.shutdown_kernel()
        del _kernel_manager.kernels[kernel_id]

        logger.info(f"Kernel {kernel_id} reset")

        return {
            "content": [{
                "type": "text",
                "text": f"Kernel '{kernel_id}' has been reset"
            }]
        }

    except Exception as e:
        logger.error(f"Error resetting kernel {kernel_id}: {e}")
        return {
            "content": [{
                "type": "text",
                "text": f"Error resetting kernel: {str(e)}"
            }],
            "isError": True
        }


def create_jupyter_mcp_server():
    """
    Create Jupyter MCP server with all tools.

    Returns:
        MCP server instance configured with Jupyter tools
    """
    logger.info("Creating Jupyter MCP server")

    return create_sdk_mcp_server(
        name="jupyter",
        version="1.0.0",
        tools=[execute_python, kernel_info, reset_kernel]
    )
