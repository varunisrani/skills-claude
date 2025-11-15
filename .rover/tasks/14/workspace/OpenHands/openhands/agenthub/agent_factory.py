"""
Agent Factory for OpenHands

This module provides a factory pattern for creating agents with support for both:
1. Legacy agents (using LiteLLM)
2. SDK agents (using Claude Agent SDK)

This enables gradual migration from legacy to SDK agents while maintaining
backward compatibility.

Usage:
    from openhands.agenthub.agent_factory import AgentFactory

    # Create SDK version (preferred)
    agent = AgentFactory.create_agent(
        agent_name="CodeActAgent",
        config=config,
        llm_registry=registry,
        use_sdk=True
    )

    # Create legacy version (for compatibility)
    agent = AgentFactory.create_agent(
        agent_name="CodeActAgent",
        config=config,
        llm_registry=registry,
        use_sdk=False
    )
"""

import os
from typing import Optional, Type
from enum import Enum

from openhands.controller.agent import Agent
from openhands.core.config import AgentConfig
from openhands.core.logger import openhands_logger as logger
from openhands.llm.llm_registry import LLMRegistry


class AgentMode(Enum):
    """Agent execution mode."""
    LEGACY = "legacy"  # Use LiteLLM-based agents
    SDK = "sdk"        # Use Claude SDK-based agents
    AUTO = "auto"      # Auto-select based on config


class AgentFactory:
    """
    Factory for creating OpenHands agents.

    This factory supports creating both legacy and SDK versions of agents,
    enabling gradual migration to Claude Agent SDK.

    Supported agents:
    - CodeActAgent / CodeActAgentSDK
    - BrowsingAgent / BrowsingAgentSDK
    - ReadOnlyAgent / ReadOnlyAgentSDK
    - VisualBrowsingAgent / VisualBrowsingAgentSDK
    - LOCAgent / LocAgentSDK
    - DummyAgent / DummyAgentSDK
    """

    # Map of agent names to their classes
    LEGACY_AGENTS = {
        "CodeActAgent": None,  # Will be lazily loaded
        "BrowsingAgent": None,
        "ReadOnlyAgent": None,
        "DummyAgent": None,
        "LOCAgent": None,
        "VisualBrowsingAgent": None,
    }

    SDK_AGENTS = {
        "CodeActAgent": None,  # Will be lazily loaded
        "BrowsingAgent": None,
        "ReadOnlyAgent": None,
        "VisualBrowsingAgent": None,
        "LOCAgent": None,
        "DummyAgent": None,
    }

    @classmethod
    def _load_legacy_agent(cls, agent_name: str) -> Type[Agent]:
        """
        Lazy load legacy agent class.

        Args:
            agent_name: Name of the agent

        Returns:
            Agent class

        Raises:
            ImportError: If agent class cannot be loaded
        """
        if agent_name == "CodeActAgent":
            from openhands.agenthub.codeact_agent.codeact_agent import CodeActAgent
            return CodeActAgent

        elif agent_name == "BrowsingAgent":
            from openhands.agenthub.browsing_agent.browsing_agent import BrowsingAgent
            return BrowsingAgent

        elif agent_name == "ReadOnlyAgent":
            from openhands.agenthub.readonly_agent.readonly_agent import ReadOnlyAgent
            return ReadOnlyAgent

        elif agent_name == "DummyAgent":
            from openhands.agenthub.dummy_agent.agent import DummyAgent
            return DummyAgent

        elif agent_name == "LOCAgent":
            from openhands.agenthub.loc_agent.loc_agent import LOCAgent
            return LOCAgent

        elif agent_name == "VisualBrowsingAgent":
            from openhands.agenthub.visualbrowsing_agent.visualbrowsing_agent import (
                VisualBrowsingAgent
            )
            return VisualBrowsingAgent

        else:
            raise ImportError(f"Unknown legacy agent: {agent_name}")

    @classmethod
    def _load_sdk_agent(cls, agent_name: str) -> Type[Agent]:
        """
        Lazy load SDK agent class.

        Args:
            agent_name: Name of the agent

        Returns:
            Agent class

        Raises:
            ImportError: If agent class cannot be loaded or doesn't have SDK version
        """
        if agent_name == "CodeActAgent":
            from openhands.agenthub.codeact_agent.codeact_agent_sdk import CodeActAgentSDK
            return CodeActAgentSDK

        elif agent_name == "BrowsingAgent":
            from openhands.agenthub.browsing_agent.browsing_agent_sdk import BrowsingAgentSDK
            return BrowsingAgentSDK

        elif agent_name == "ReadOnlyAgent":
            from openhands.agenthub.readonly_agent.readonly_agent_sdk import ReadOnlyAgentSDK
            return ReadOnlyAgentSDK

        elif agent_name == "VisualBrowsingAgent":
            from openhands.agenthub.visualbrowsing_agent.visualbrowsing_agent_sdk import VisualBrowsingAgentSDK
            return VisualBrowsingAgentSDK

        elif agent_name == "LOCAgent":
            from openhands.agenthub.loc_agent.loc_agent_sdk import LocAgentSDK
            return LocAgentSDK

        elif agent_name == "DummyAgent":
            from openhands.agenthub.dummy_agent.agent_sdk import DummyAgentSDK
            return DummyAgentSDK

        else:
            raise ImportError(
                f"No SDK version available for {agent_name}. "
                f"Available SDK agents: {list(cls.SDK_AGENTS.keys())}"
            )

    @classmethod
    def create_agent(
        cls,
        agent_name: str,
        config: AgentConfig,
        llm_registry: LLMRegistry,
        use_sdk: Optional[bool] = None
    ) -> Agent:
        """
        Create an agent instance.

        Args:
            agent_name: Name of the agent (e.g., "CodeActAgent")
            config: Agent configuration
            llm_registry: LLM registry
            use_sdk: Whether to use SDK version (None = auto-detect)

        Returns:
            Agent instance

        Raises:
            ValueError: If agent_name is unknown
            ImportError: If agent class cannot be loaded

        Examples:
            # Create SDK version explicitly
            agent = AgentFactory.create_agent(
                "CodeActAgent", config, registry, use_sdk=True
            )

            # Create legacy version
            agent = AgentFactory.create_agent(
                "CodeActAgent", config, registry, use_sdk=False
            )

            # Auto-detect based on environment
            agent = AgentFactory.create_agent(
                "CodeActAgent", config, registry
            )
        """
        # Auto-detect SDK usage if not specified
        if use_sdk is None:
            use_sdk = cls._should_use_sdk(config)

        logger.info(f"Creating {agent_name} (SDK={use_sdk})")

        # Load appropriate agent class
        if use_sdk:
            try:
                agent_class = cls._load_sdk_agent(agent_name)
                logger.info(f"Using SDK agent: {agent_class.__name__}")
            except ImportError as e:
                logger.warning(f"SDK agent not available: {e}")
                logger.info(f"Falling back to legacy agent: {agent_name}")
                agent_class = cls._load_legacy_agent(agent_name)
        else:
            agent_class = cls._load_legacy_agent(agent_name)
            logger.info(f"Using legacy agent: {agent_class.__name__}")

        # Create agent instance
        try:
            agent = agent_class(config=config, llm_registry=llm_registry)
            logger.info(f"Created agent: {agent.name} (version {agent.VERSION})")
            return agent
        except Exception as e:
            logger.error(f"Failed to create agent {agent_name}: {e}")
            raise

    @classmethod
    def _should_use_sdk(cls, config: AgentConfig) -> bool:
        """
        Determine whether to use SDK agents based on configuration.

        Args:
            config: Agent configuration

        Returns:
            True if SDK should be used, False otherwise
        """
        # Check environment variable
        use_sdk_env = os.environ.get("OPENHANDS_USE_SDK_AGENTS", "").lower()
        if use_sdk_env == "true":
            return True
        elif use_sdk_env == "false":
            return False

        # Check if model is Claude (SDK agents work best with Claude)
        if hasattr(config, 'llm_config') and config.llm_config:
            model = getattr(config.llm_config, 'model', '')
            if 'claude' in model.lower():
                return True

        # Check config flag if available
        if hasattr(config, 'use_sdk_agents'):
            return config.use_sdk_agents

        # Default: use SDK for supported agents
        # This enables gradual rollout
        return False

    @classmethod
    def list_agents(cls, include_sdk: bool = True, include_legacy: bool = True) -> dict:
        """
        List available agents.

        Args:
            include_sdk: Include SDK agents
            include_legacy: Include legacy agents

        Returns:
            Dictionary with agent information
        """
        agents = {}

        if include_legacy:
            agents["legacy"] = list(cls.LEGACY_AGENTS.keys())

        if include_sdk:
            agents["sdk"] = list(cls.SDK_AGENTS.keys())

        return agents

    @classmethod
    def has_sdk_version(cls, agent_name: str) -> bool:
        """
        Check if an agent has an SDK version.

        Args:
            agent_name: Name of the agent

        Returns:
            True if SDK version exists
        """
        return agent_name in cls.SDK_AGENTS

    @classmethod
    def get_agent_info(cls, agent_name: str, use_sdk: bool = False) -> dict:
        """
        Get information about an agent.

        Args:
            agent_name: Name of the agent
            use_sdk: Whether to get SDK version info

        Returns:
            Dictionary with agent information
        """
        try:
            if use_sdk:
                agent_class = cls._load_sdk_agent(agent_name)
            else:
                agent_class = cls._load_legacy_agent(agent_name)

            return {
                "name": agent_name,
                "class": agent_class.__name__,
                "version": getattr(agent_class, "VERSION", "unknown"),
                "mode": "sdk" if use_sdk else "legacy",
                "has_sdk": cls.has_sdk_version(agent_name),
                "deprecated": getattr(agent_class, "DEPRECATED", False),
            }
        except Exception as e:
            logger.error(f"Error getting agent info: {e}")
            return {"name": agent_name, "error": str(e)}


# Convenience functions

def create_codeact_agent(
    config: AgentConfig,
    llm_registry: LLMRegistry,
    use_sdk: Optional[bool] = None
) -> Agent:
    """Create a CodeActAgent instance."""
    return AgentFactory.create_agent("CodeActAgent", config, llm_registry, use_sdk)


def create_browsing_agent(
    config: AgentConfig,
    llm_registry: LLMRegistry,
    use_sdk: Optional[bool] = None
) -> Agent:
    """Create a BrowsingAgent instance."""
    return AgentFactory.create_agent("BrowsingAgent", config, llm_registry, use_sdk)


def create_readonly_agent(
    config: AgentConfig,
    llm_registry: LLMRegistry,
    use_sdk: Optional[bool] = None
) -> Agent:
    """Create a ReadOnlyAgent instance."""
    return AgentFactory.create_agent("ReadOnlyAgent", config, llm_registry, use_sdk)


def create_visualbrowsing_agent(
    config: AgentConfig,
    llm_registry: LLMRegistry,
    use_sdk: Optional[bool] = None
) -> Agent:
    """Create a VisualBrowsingAgent instance."""
    return AgentFactory.create_agent("VisualBrowsingAgent", config, llm_registry, use_sdk)


def create_loc_agent(
    config: AgentConfig,
    llm_registry: LLMRegistry,
    use_sdk: Optional[bool] = None
) -> Agent:
    """Create a LOCAgent instance."""
    return AgentFactory.create_agent("LOCAgent", config, llm_registry, use_sdk)


def create_dummy_agent(
    config: AgentConfig,
    llm_registry: LLMRegistry,
    use_sdk: Optional[bool] = None
) -> Agent:
    """Create a DummyAgent instance."""
    return AgentFactory.create_agent("DummyAgent", config, llm_registry, use_sdk)
