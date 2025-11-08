"""SDK integration feature flags and configuration.

This module provides centralized configuration for SDK integration features,
allowing gradual rollout and testing of SDK agents alongside legacy agents.

Feature Flags:
    - OPENHANDS_USE_SDK_AGENTS: Enable SDK agent routing (default: false)
    - OPENHANDS_USE_SDK_ORCHESTRATOR: Enable OrchestratorAdapter (default: false)
    - OPENHANDS_SDK_FALLBACK_TO_LEGACY: Fallback to legacy on SDK errors (default: true)

Environment Variables:
    OPENHANDS_USE_SDK_AGENTS=true|false
    OPENHANDS_USE_SDK_ORCHESTRATOR=true|false
    OPENHANDS_SDK_FALLBACK_TO_LEGACY=true|false

Usage:
    from openhands.core.config.sdk_config import SDKConfig

    config = SDKConfig.from_env()
    if config.use_sdk_agents:
        # Route to SDK agents
        ...
    else:
        # Use legacy path
        ...

Notes:
    - All flags default to "false" for backward compatibility
    - Feature flags can be overridden at runtime
    - Rollout strategy: 0% → 10% → 50% → 100%
"""

import os
from dataclasses import dataclass, field
from typing import Optional

from openhands.core.logger import openhands_logger as logger


@dataclass
class SDKConfig:
    """Configuration for SDK integration features.

    This class encapsulates all feature flags and settings related to
    SDK agent integration. It can be loaded from environment variables
    or configured programmatically.

    Attributes:
        use_sdk_agents: Enable SDK agent detection and routing
        use_sdk_orchestrator: Use OrchestratorAdapter instead of AgentController
        fallback_to_legacy: Fallback to legacy agents if SDK fails
        sdk_timeout_seconds: Timeout for SDK operations (default: 300)
        enable_sdk_metrics: Track SDK-specific metrics
        sdk_debug_mode: Enable verbose SDK debugging
    """

    # Feature flags
    use_sdk_agents: bool = False
    use_sdk_orchestrator: bool = False
    fallback_to_legacy: bool = True

    # Configuration
    sdk_timeout_seconds: int = 300
    enable_sdk_metrics: bool = True
    sdk_debug_mode: bool = False

    # Advanced settings
    sdk_retry_attempts: int = 3
    sdk_retry_delay_seconds: float = 1.0

    @classmethod
    def from_env(cls) -> 'SDKConfig':
        """Load configuration from environment variables.

        Reads the following environment variables:
            - OPENHANDS_USE_SDK_AGENTS (default: false)
            - OPENHANDS_USE_SDK_ORCHESTRATOR (default: false)
            - OPENHANDS_SDK_FALLBACK_TO_LEGACY (default: true)
            - OPENHANDS_SDK_TIMEOUT (default: 300)
            - OPENHANDS_SDK_ENABLE_METRICS (default: true)
            - OPENHANDS_SDK_DEBUG (default: false)
            - OPENHANDS_SDK_RETRY_ATTEMPTS (default: 3)
            - OPENHANDS_SDK_RETRY_DELAY (default: 1.0)

        Returns:
            SDKConfig instance with values from environment

        Examples:
            >>> # Set environment variable
            >>> os.environ['OPENHANDS_USE_SDK_AGENTS'] = 'true'
            >>> config = SDKConfig.from_env()
            >>> config.use_sdk_agents
            True
        """
        config = cls(
            use_sdk_agents=_parse_bool_env('OPENHANDS_USE_SDK_AGENTS', False),
            use_sdk_orchestrator=_parse_bool_env('OPENHANDS_USE_SDK_ORCHESTRATOR', False),
            fallback_to_legacy=_parse_bool_env('OPENHANDS_SDK_FALLBACK_TO_LEGACY', True),
            sdk_timeout_seconds=_parse_int_env('OPENHANDS_SDK_TIMEOUT', 300),
            enable_sdk_metrics=_parse_bool_env('OPENHANDS_SDK_ENABLE_METRICS', True),
            sdk_debug_mode=_parse_bool_env('OPENHANDS_SDK_DEBUG', False),
            sdk_retry_attempts=_parse_int_env('OPENHANDS_SDK_RETRY_ATTEMPTS', 3),
            sdk_retry_delay_seconds=_parse_float_env('OPENHANDS_SDK_RETRY_DELAY', 1.0),
        )

        # Log configuration
        if config.use_sdk_agents or config.use_sdk_orchestrator:
            logger.info(
                f"SDK integration enabled - "
                f"agents: {config.use_sdk_agents}, "
                f"orchestrator: {config.use_sdk_orchestrator}, "
                f"fallback: {config.fallback_to_legacy}"
            )

        if config.sdk_debug_mode:
            logger.debug(
                f"SDK debug mode enabled - "
                f"timeout: {config.sdk_timeout_seconds}s, "
                f"retries: {config.sdk_retry_attempts}"
            )

        return config

    def to_dict(self) -> dict:
        """Convert configuration to dictionary.

        Returns:
            Dictionary representation of config

        Examples:
            >>> config = SDKConfig(use_sdk_agents=True)
            >>> config.to_dict()
            {'use_sdk_agents': True, 'use_sdk_orchestrator': False, ...}
        """
        return {
            'use_sdk_agents': self.use_sdk_agents,
            'use_sdk_orchestrator': self.use_sdk_orchestrator,
            'fallback_to_legacy': self.fallback_to_legacy,
            'sdk_timeout_seconds': self.sdk_timeout_seconds,
            'enable_sdk_metrics': self.enable_sdk_metrics,
            'sdk_debug_mode': self.sdk_debug_mode,
            'sdk_retry_attempts': self.sdk_retry_attempts,
            'sdk_retry_delay_seconds': self.sdk_retry_delay_seconds,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'SDKConfig':
        """Create configuration from dictionary.

        Args:
            data: Dictionary with configuration values

        Returns:
            SDKConfig instance

        Examples:
            >>> data = {'use_sdk_agents': True, 'use_sdk_orchestrator': False}
            >>> config = SDKConfig.from_dict(data)
            >>> config.use_sdk_agents
            True
        """
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})

    def is_sdk_enabled(self) -> bool:
        """Check if any SDK features are enabled.

        Returns:
            True if SDK agents or orchestrator are enabled

        Examples:
            >>> config = SDKConfig(use_sdk_agents=True)
            >>> config.is_sdk_enabled()
            True
        """
        return self.use_sdk_agents or self.use_sdk_orchestrator

    def get_rollout_percentage(self) -> int:
        """Get rollout percentage for gradual deployment.

        This can be used for A/B testing or gradual rollout of SDK features.

        Returns:
            Percentage (0-100) of traffic to route to SDK

        Note:
            Currently returns 0 or 100 based on flags. Can be extended
            for gradual rollout (e.g., 10%, 50%, etc.)
        """
        if self.use_sdk_agents or self.use_sdk_orchestrator:
            return 100
        return 0


# Helper functions for parsing environment variables


def _parse_bool_env(key: str, default: bool) -> bool:
    """Parse boolean environment variable.

    Accepts: true, false, yes, no, 1, 0 (case-insensitive)

    Args:
        key: Environment variable name
        default: Default value if not set

    Returns:
        Parsed boolean value
    """
    value = os.getenv(key)
    if value is None:
        return default

    value_lower = value.lower().strip()

    if value_lower in ('true', 'yes', '1', 'on', 'enabled'):
        return True
    elif value_lower in ('false', 'no', '0', 'off', 'disabled'):
        return False
    else:
        logger.warning(
            f"Invalid boolean value for {key}: '{value}', using default: {default}"
        )
        return default


def _parse_int_env(key: str, default: int) -> int:
    """Parse integer environment variable.

    Args:
        key: Environment variable name
        default: Default value if not set or invalid

    Returns:
        Parsed integer value
    """
    value = os.getenv(key)
    if value is None:
        return default

    try:
        return int(value)
    except ValueError:
        logger.warning(
            f"Invalid integer value for {key}: '{value}', using default: {default}"
        )
        return default


def _parse_float_env(key: str, default: float) -> float:
    """Parse float environment variable.

    Args:
        key: Environment variable name
        default: Default value if not set or invalid

    Returns:
        Parsed float value
    """
    value = os.getenv(key)
    if value is None:
        return default

    try:
        return float(value)
    except ValueError:
        logger.warning(
            f"Invalid float value for {key}: '{value}', using default: {default}"
        )
        return default


# Global singleton instance
_global_sdk_config: Optional[SDKConfig] = None


def get_sdk_config() -> SDKConfig:
    """Get global SDK configuration instance.

    This function returns a singleton SDKConfig instance loaded from
    environment variables. The instance is cached for performance.

    Returns:
        Global SDKConfig instance

    Examples:
        >>> config = get_sdk_config()
        >>> if config.use_sdk_agents:
        ...     print("SDK agents enabled")
    """
    global _global_sdk_config

    if _global_sdk_config is None:
        _global_sdk_config = SDKConfig.from_env()

    return _global_sdk_config


def reset_sdk_config() -> None:
    """Reset global SDK configuration.

    This forces the next call to get_sdk_config() to reload from
    environment variables. Useful for testing.

    Examples:
        >>> reset_sdk_config()
        >>> config = get_sdk_config()  # Reloads from env
    """
    global _global_sdk_config
    _global_sdk_config = None
    logger.debug("Global SDK config reset")


# Convenience functions


def is_sdk_enabled() -> bool:
    """Check if SDK features are enabled globally.

    Returns:
        True if SDK agents or orchestrator are enabled

    Examples:
        >>> if is_sdk_enabled():
        ...     print("Using SDK agents")
    """
    return get_sdk_config().is_sdk_enabled()


def should_use_sdk_agent() -> bool:
    """Check if SDK agents should be used.

    Returns:
        True if use_sdk_agents flag is set

    Examples:
        >>> if should_use_sdk_agent():
        ...     controller = OrchestratorAdapter(...)
        ... else:
        ...     controller = AgentController(...)
    """
    return get_sdk_config().use_sdk_agents


def should_use_sdk_orchestrator() -> bool:
    """Check if SDK orchestrator should be used.

    Returns:
        True if use_sdk_orchestrator flag is set

    Examples:
        >>> if should_use_sdk_orchestrator():
        ...     orchestrator = OrchestratorAdapter(...)
    """
    return get_sdk_config().use_sdk_orchestrator
