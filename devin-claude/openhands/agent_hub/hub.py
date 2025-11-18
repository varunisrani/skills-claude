"""
Agent Hub for Claude Agent SDK Integration

This module provides the central hub for managing multiple specialized Claude Code agents.
It replaces OpenHands' AgentController with a simplified orchestration layer that
delegates execution to Claude Code agents.

The Agent Hub implements a hub-and-spoke pattern where:
- The hub coordinates specialized agents
- Each agent has specific tools and responsibilities
- Agents can run in parallel or sequentially
- Context is maintained per agent

Usage:
    from openhands.agent_hub import AgentHub

    async with AgentHub(workspace="/path/to/project", api_key="sk-...") as hub:
        # Get code agent
        code_agent = await hub.get_agent("code")

        # Execute task
        results = await hub.execute_task("code", "Refactor authentication module")
"""

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from typing import Dict, List, Optional, Callable
import asyncio
import logging
from pathlib import Path

from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server
from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

logger = logging.getLogger(__name__)


class AgentConfig:
    """
    Configuration for a specialized agent.

    This class encapsulates all configuration needed to create a Claude Code agent
    with specific capabilities and constraints.
    """

    def __init__(
        self,
        agent_type: str,
        allowed_tools: List[str],
        system_prompt: str,
        mcp_servers: Optional[Dict] = None,
        permission_mode: str = "accept",
        max_turns: int = 50,
        model: str = "claude-sonnet-4-5-20250929"
    ):
        """
        Initialize agent configuration.

        Args:
            agent_type: Type identifier (code, analysis, testing, browser, python)
            allowed_tools: List of tool names this agent can use
            system_prompt: System prompt defining agent behavior
            mcp_servers: Optional dict of MCP servers to enable
            permission_mode: Permission mode (accept, acceptEdits, prompt)
            max_turns: Maximum conversation turns
            model: Claude model to use
        """
        self.agent_type = agent_type
        self.allowed_tools = allowed_tools
        self.system_prompt = system_prompt
        self.mcp_servers = mcp_servers or {}
        self.permission_mode = permission_mode
        self.max_turns = max_turns
        self.model = model


class AgentHub:
    """
    Central hub for managing multiple specialized Claude Code agents.

    This replaces OpenHands' AgentController with a simplified orchestration layer
    that delegates execution to Claude Code agents.

    The hub provides:
    - Agent lifecycle management (creation, caching, cleanup)
    - Specialized agent configurations
    - Task execution with single or multiple agents
    - Parallel and sequential execution patterns
    - Progress tracking and callbacks
    """

    def __init__(
        self,
        workspace: str,
        api_key: str,
        prompts_dir: Optional[str] = None
    ):
        """
        Initialize Agent Hub.

        Args:
            workspace: Working directory for agents
            api_key: Anthropic API key
            prompts_dir: Optional custom prompts directory
        """
        self.workspace = Path(workspace).resolve()
        self.api_key = api_key
        self.prompts_dir = Path(prompts_dir) if prompts_dir else Path(__file__).parent.parent / "prompts"

        # Active agent clients (cached for reuse)
        self.agents: Dict[str, ClaudeSDKClient] = {}

        # Agent configurations
        self.configs: Dict[str, AgentConfig] = {}

        # Initialize MCP servers (shared across agents)
        self.jupyter_mcp = create_jupyter_mcp_server()
        self.browser_mcp = create_browser_mcp_server()

        # Setup agent configurations
        self._setup_agent_configs()

        logger.info(f"AgentHub initialized with workspace: {self.workspace}")
        logger.info(f"Available agent types: {list(self.configs.keys())}")

    def _load_prompt(self, filename: str) -> str:
        """
        Load system prompt from file.

        Args:
            filename: Prompt file name (e.g., "code_agent.txt")

        Returns:
            System prompt text
        """
        prompt_path = self.prompts_dir / filename

        if not prompt_path.exists():
            logger.warning(f"Prompt file not found: {prompt_path}, using default")
            return f"You are a helpful AI assistant for {filename.replace('.txt', '')} tasks."

        return prompt_path.read_text()

    def _setup_agent_configs(self):
        """Initialize configurations for all specialized agents."""

        # Code Agent: Full editing capabilities
        self.configs["code"] = AgentConfig(
            agent_type="code",
            allowed_tools=["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
            system_prompt=self._load_prompt("code_agent.txt"),
            permission_mode="acceptEdits",
            max_turns=50
        )

        # Analysis Agent: Read-only analysis
        self.configs["analysis"] = AgentConfig(
            agent_type="analysis",
            allowed_tools=["Read", "Grep", "Glob"],
            system_prompt=self._load_prompt("analysis_agent.txt"),
            permission_mode="accept",
            max_turns=30
        )

        # Testing Agent: Run tests
        self.configs["testing"] = AgentConfig(
            agent_type="testing",
            allowed_tools=["Read", "Bash"],
            system_prompt=self._load_prompt("testing_agent.txt"),
            permission_mode="accept",
            max_turns=20
        )

        # Browser Agent: Web interactions
        self.configs["browser"] = AgentConfig(
            agent_type="browser",
            allowed_tools=[
                "Read",
                "mcp__browser__navigate",
                "mcp__browser__interact",
                "mcp__browser__extract_content",
                "mcp__browser__screenshot",
                "mcp__browser__get_page_info"
            ],
            system_prompt=self._load_prompt("browser_agent.txt"),
            mcp_servers={"browser": self.browser_mcp},
            permission_mode="accept",
            max_turns=40
        )

        # Python Agent: Code execution
        self.configs["python"] = AgentConfig(
            agent_type="python",
            allowed_tools=[
                "Read",
                "mcp__jupyter__execute_python",
                "mcp__jupyter__kernel_info",
                "mcp__jupyter__reset_kernel"
            ],
            system_prompt=self._load_prompt("python_agent.txt"),
            mcp_servers={"jupyter": self.jupyter_mcp},
            permission_mode="accept",
            max_turns=30
        )

        logger.info(f"Configured {len(self.configs)} agent types")

    async def get_agent(self, agent_type: str) -> ClaudeSDKClient:
        """
        Get or create an agent instance.

        This method manages agent lifecycle, creating new agents on demand
        and caching them for reuse.

        Args:
            agent_type: Type of agent (code, analysis, testing, browser, python)

        Returns:
            Connected ClaudeSDKClient instance

        Raises:
            ValueError: If agent_type is unknown
        """
        if agent_type not in self.configs:
            raise ValueError(f"Unknown agent type: {agent_type}. "
                           f"Available: {list(self.configs.keys())}")

        # Return existing agent if already created
        if agent_type in self.agents:
            logger.debug(f"Reusing cached {agent_type} agent")
            return self.agents[agent_type]

        # Create new agent
        config = self.configs[agent_type]

        logger.info(f"Creating new {agent_type} agent")

        options = ClaudeAgentOptions(
            allowed_tools=config.allowed_tools,
            system_prompt=config.system_prompt,
            mcp_servers=config.mcp_servers,
            permission_mode=config.permission_mode,
            cwd=str(self.workspace),
            max_turns=config.max_turns,
            model=config.model
        )

        client = ClaudeSDKClient(options=options)
        await client.connect()

        self.agents[agent_type] = client
        logger.info(f"Created and connected {agent_type} agent")

        return client

    async def execute_task(
        self,
        agent_type: str,
        task: str,
        callback: Optional[Callable] = None
    ) -> List:
        """
        Execute a task with specified agent.

        Args:
            agent_type: Type of agent to use
            task: Task description/prompt
            callback: Optional callback for streaming messages

        Returns:
            List of messages from agent

        Raises:
            ValueError: If agent_type is unknown
            Exception: If task execution fails
        """
        agent = await self.get_agent(agent_type)

        logger.info(f"Executing task with {agent_type} agent")
        logger.debug(f"Task: {task[:100]}...")

        await agent.query(task)

        messages = []
        async for msg in agent.receive_response():
            messages.append(msg)

            if callback:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(msg)
                    else:
                        callback(msg)
                except Exception as e:
                    logger.error(f"Callback error: {e}")

        logger.info(f"Task complete, received {len(messages)} messages")

        return messages

    async def parallel_execute(
        self,
        tasks: List[tuple]  # [(agent_type, task_description), ...]
    ) -> Dict[str, List]:
        """
        Execute multiple tasks in parallel.

        This is useful when tasks are independent and can run simultaneously,
        improving overall execution time.

        Args:
            tasks: List of (agent_type, task_description) tuples

        Returns:
            Dictionary mapping agent_type to results

        Example:
            results = await hub.parallel_execute([
                ("analysis", "Find security issues"),
                ("testing", "Run test suite")
            ])
        """
        logger.info(f"Executing {len(tasks)} tasks in parallel")

        async def run_task(agent_type, task_desc):
            """Execute single task and return results."""
            try:
                results = await self.execute_task(agent_type, task_desc)
                return agent_type, results
            except Exception as e:
                logger.error(f"Task failed for {agent_type}: {e}")
                return agent_type, []

        # Execute all tasks in parallel
        results_list = await asyncio.gather(*[
            run_task(agent_type, task_desc)
            for agent_type, task_desc in tasks
        ])

        # Convert to dictionary
        results_dict = {}
        for agent_type, results in results_list:
            if agent_type not in results_dict:
                results_dict[agent_type] = []
            results_dict[agent_type].extend(results)

        logger.info(f"Parallel execution complete")

        return results_dict

    async def cleanup(self):
        """Cleanup all agent connections and resources."""
        logger.info(f"Cleaning up AgentHub ({len(self.agents)} agents)")

        for agent_type, client in self.agents.items():
            try:
                await client.disconnect()
                logger.info(f"Disconnected {agent_type} agent")
            except Exception as e:
                logger.error(f"Error disconnecting {agent_type} agent: {e}")

        self.agents.clear()

        # Cleanup MCP servers if they have cleanup methods
        # Note: The kernel manager and browser manager have cleanup methods
        # that should be called when shutting down

        logger.info("AgentHub cleanup complete")

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.cleanup()
        return False  # Don't suppress exceptions
