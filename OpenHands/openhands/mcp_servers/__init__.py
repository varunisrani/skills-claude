"""
MCP Servers for Claude Agent SDK Integration

This package provides custom MCP (Model Context Protocol) servers
that extend Claude Code with domain-specific tools for OpenHands.

Available MCP Servers:
- Jupyter MCP: Execute Python code in Jupyter kernels
- Browser MCP: Web automation and interaction using Playwright

These MCP servers enable Claude agents to perform specialized tasks
beyond the built-in tools provided by Claude Code CLI.
"""

from .jupyter_mcp import create_jupyter_mcp_server, JupyterKernelManager
from .browser_mcp import create_browser_mcp_server, BrowserManager

__all__ = [
    "create_jupyter_mcp_server",
    "JupyterKernelManager",
    "create_browser_mcp_server",
    "BrowserManager",
]
