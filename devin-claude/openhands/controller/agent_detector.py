"""Agent type detection utility for Phase 6 SDK integration.

This module provides utilities to detect whether an agent is SDK-based or legacy.
It uses multiple detection strategies to reliably identify agent types, with
caching for performance optimization.

Detection Strategies:
    1. Class name pattern matching (checks for "SDK" suffix)
    2. Adapter attribute detection (SDK agents have ClaudeSDKAdapter)
    3. Interface checking (SDK-specific methods and attributes)
    4. Fallback to safe default (legacy)

Usage:
    from openhands.controller.agent_detector import detect_agent_type, is_sdk_agent

    agent_type = detect_agent_type(agent)
    if is_sdk_agent(agent):
        # Handle SDK agent
        ...
    else:
        # Handle legacy agent
        ...

Notes:
    - Detection results are cached using lru_cache for performance
    - All detection failures gracefully fall back to "legacy"
    - No exceptions are raised to callers
    - Comprehensive logging for debugging
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from openhands.core.logger import openhands_logger as logger

if TYPE_CHECKING:
    from openhands.controller.agent import Agent


class AgentType:
    """Agent type constants."""

    SDK = "sdk"
    LEGACY = "legacy"


@lru_cache(maxsize=128)
def detect_agent_type(agent: 'Agent') -> str:
    """Detect whether agent is SDK or legacy type.

    This function uses multiple detection strategies to reliably determine
    the agent type. Results are cached for performance.

    Detection Strategies (in order):
        1. Class name check - looks for "SDK" in class name
        2. Adapter attribute - checks for ClaudeSDKAdapter
        3. Interface check - looks for SDK-specific methods
        4. Fallback - defaults to legacy if uncertain

    Args:
        agent: The agent instance to detect

    Returns:
        str: Either AgentType.SDK or AgentType.LEGACY

    Examples:
        >>> agent = CodeActAgentSDK(config, llm_registry)
        >>> detect_agent_type(agent)
        'sdk'

        >>> agent = CodeActAgent(config, llm_registry)
        >>> detect_agent_type(agent)
        'legacy'
    """
    if agent is None:
        logger.warning("Agent is None, defaulting to legacy")
        return AgentType.LEGACY

    try:
        # Strategy 1: Check class name for "SDK" suffix
        # Most reliable as SDK agents follow naming convention
        class_name = agent.__class__.__name__
        if class_name.endswith("SDK"):
            logger.debug(f"Detected SDK agent via class name: {class_name}")
            return AgentType.SDK

        # Strategy 2: Check for adapter attribute
        # SDK agents have a ClaudeSDKAdapter instance
        if hasattr(agent, "adapter"):
            adapter = agent.adapter
            # Verify it's actually a ClaudeSDKAdapter
            if adapter is not None and hasattr(adapter, "claude_client"):
                logger.debug(
                    f"Detected SDK agent via adapter attribute: {class_name}"
                )
                return AgentType.SDK
            # Has adapter but not Claude SDK adapter - could be custom
            logger.debug(
                f"Agent {class_name} has adapter but not ClaudeSDKAdapter, "
                "defaulting to legacy"
            )

        # Strategy 3: Check for SDK-specific interface
        # SDK agents may have adapter_config attribute
        if hasattr(agent, "adapter_config"):
            logger.debug(
                f"Detected SDK agent via adapter_config attribute: {class_name}"
            )
            return AgentType.SDK

        # Strategy 4: Check module path for SDK indicators
        # SDK agents typically live in modules with "sdk" in the path
        module_path = agent.__class__.__module__
        if "_sdk" in module_path.lower():
            logger.debug(f"Detected SDK agent via module path: {module_path}")
            return AgentType.SDK

        # Fallback: Default to legacy
        # This is the safe default as legacy agents are the baseline
        logger.debug(f"Agent {class_name} detected as legacy (default)")
        return AgentType.LEGACY

    except Exception as e:
        # If detection fails for any reason, default to legacy
        # This ensures the system remains functional even with detection errors
        logger.warning(
            f"Error detecting agent type, defaulting to legacy: {e}", exc_info=True
        )
        return AgentType.LEGACY


def is_sdk_agent(agent: 'Agent') -> bool:
    """Check if agent is SDK-based.

    Args:
        agent: The agent instance to check

    Returns:
        bool: True if agent is SDK-based, False otherwise

    Examples:
        >>> agent = CodeActAgentSDK(config, llm_registry)
        >>> is_sdk_agent(agent)
        True

        >>> agent = CodeActAgent(config, llm_registry)
        >>> is_sdk_agent(agent)
        False
    """
    return detect_agent_type(agent) == AgentType.SDK


def is_legacy_agent(agent: 'Agent') -> bool:
    """Check if agent is legacy.

    Args:
        agent: The agent instance to check

    Returns:
        bool: True if agent is legacy, False otherwise

    Examples:
        >>> agent = CodeActAgent(config, llm_registry)
        >>> is_legacy_agent(agent)
        True

        >>> agent = CodeActAgentSDK(config, llm_registry)
        >>> is_legacy_agent(agent)
        False
    """
    return detect_agent_type(agent) == AgentType.LEGACY


def clear_detection_cache() -> None:
    """Clear the agent type detection cache.

    This is useful for testing or when agent instances are dynamically
    modified at runtime.

    Note:
        This should rarely be needed in production code as agent types
        don't change after instantiation.
    """
    detect_agent_type.cache_clear()
    logger.debug("Agent detection cache cleared")


def get_cache_info() -> dict:
    """Get cache statistics for agent type detection.

    Returns:
        dict: Cache statistics including hits, misses, size, and maxsize

    Examples:
        >>> info = get_cache_info()
        >>> print(f"Cache hits: {info['hits']}, misses: {info['misses']}")
    """
    cache_info = detect_agent_type.cache_info()
    return {
        "hits": cache_info.hits,
        "misses": cache_info.misses,
        "current_size": cache_info.currsize,
        "max_size": cache_info.maxsize,
    }
