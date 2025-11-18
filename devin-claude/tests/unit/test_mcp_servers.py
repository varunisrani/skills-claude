"""
Unit tests for MCP server implementations.

Tests Jupyter and Browser MCP servers without requiring actual
kernel or browser instances.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock


@pytest.mark.unit
class TestJupyterMCP:
    """Test Jupyter MCP server."""

    @patch('openhands.mcp_servers.jupyter_mcp.JupyterKernelManager')
    def test_create_jupyter_mcp_server(self, mock_manager_class):
        """Test creating Jupyter MCP server."""
        from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server

        mock_manager = Mock()
        mock_manager_class.return_value = mock_manager

        server = create_jupyter_mcp_server()

        assert server is not None
        # Should create kernel manager
        assert mock_manager_class.called

    @patch('openhands.mcp_servers.jupyter_mcp.JupyterKernelManager')
    async def test_execute_python(self, mock_manager_class):
        """Test Python code execution."""
        from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server

        # Setup mock manager
        mock_manager = Mock()
        mock_manager.execute_code = AsyncMock(return_value={
            "status": "ok",
            "result": "42",
            "output": "Success"
        })
        mock_manager_class.return_value = mock_manager

        server = create_jupyter_mcp_server()

        # Execute code
        result = await server.execute_python(code="print(42)")

        assert result["status"] == "ok"
        assert result["result"] == "42"
        assert mock_manager.execute_code.called

    @patch('openhands.mcp_servers.jupyter_mcp.JupyterKernelManager')
    async def test_kernel_info(self, mock_manager_class):
        """Test getting kernel info."""
        from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server

        mock_manager = Mock()
        mock_manager.get_kernel_info = AsyncMock(return_value={
            "kernel": "python3",
            "version": "3.11",
            "status": "idle"
        })
        mock_manager_class.return_value = mock_manager

        server = create_jupyter_mcp_server()

        info = await server.kernel_info()

        assert info["kernel"] == "python3"
        assert info["status"] == "idle"

    @patch('openhands.mcp_servers.jupyter_mcp.JupyterKernelManager')
    async def test_reset_kernel(self, mock_manager_class):
        """Test resetting kernel."""
        from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server

        mock_manager = Mock()
        mock_manager.restart_kernel = AsyncMock(return_value={
            "status": "restarted"
        })
        mock_manager_class.return_value = mock_manager

        server = create_jupyter_mcp_server()

        result = await server.reset_kernel()

        assert result["status"] == "restarted"
        assert mock_manager.restart_kernel.called


@pytest.mark.unit
class TestBrowserMCP:
    """Test Browser MCP server."""

    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    def test_create_browser_mcp_server(self, mock_manager_class):
        """Test creating Browser MCP server."""
        from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

        mock_manager = Mock()
        mock_manager_class.return_value = mock_manager

        server = create_browser_mcp_server()

        assert server is not None
        # Should create browser manager
        assert mock_manager_class.called

    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    async def test_navigate(self, mock_manager_class):
        """Test browser navigation."""
        from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

        mock_manager = Mock()
        mock_manager.navigate = AsyncMock(return_value={
            "url": "https://example.com",
            "status": "success",
            "title": "Example Domain"
        })
        mock_manager_class.return_value = mock_manager

        server = create_browser_mcp_server()

        result = await server.navigate(url="https://example.com")

        assert result["url"] == "https://example.com"
        assert result["status"] == "success"
        assert mock_manager.navigate.called

    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    async def test_interact(self, mock_manager_class):
        """Test browser interaction."""
        from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

        mock_manager = Mock()
        mock_manager.interact = AsyncMock(return_value={
            "action": "click",
            "selector": "#button",
            "success": True
        })
        mock_manager_class.return_value = mock_manager

        server = create_browser_mcp_server()

        result = await server.interact(action="click", selector="#button")

        assert result["action"] == "click"
        assert result["success"] is True
        assert mock_manager.interact.called

    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    async def test_extract_content(self, mock_manager_class):
        """Test content extraction."""
        from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

        mock_manager = Mock()
        mock_manager.extract_content = AsyncMock(return_value={
            "content": "Page content",
            "selector": "body"
        })
        mock_manager_class.return_value = mock_manager

        server = create_browser_mcp_server()

        result = await server.extract_content(selector="body")

        assert "content" in result
        assert mock_manager.extract_content.called

    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    async def test_screenshot(self, mock_manager_class):
        """Test taking screenshot."""
        from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

        mock_manager = Mock()
        mock_manager.screenshot = AsyncMock(return_value={
            "image": "base64encodedimage",
            "format": "png"
        })
        mock_manager_class.return_value = mock_manager

        server = create_browser_mcp_server()

        result = await server.screenshot()

        assert "image" in result
        assert result["format"] == "png"
        assert mock_manager.screenshot.called

    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    async def test_get_page_info(self, mock_manager_class):
        """Test getting page info."""
        from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

        mock_manager = Mock()
        mock_manager.get_page_info = AsyncMock(return_value={
            "url": "https://example.com",
            "title": "Example",
            "status": "loaded"
        })
        mock_manager_class.return_value = mock_manager

        server = create_browser_mcp_server()

        result = await server.get_page_info()

        assert result["url"] == "https://example.com"
        assert result["title"] == "Example"
        assert mock_manager.get_page_info.called


@pytest.mark.unit
class TestMCPServerIntegration:
    """Test MCP server integration with agents."""

    @patch('openhands.mcp_servers.jupyter_mcp.JupyterKernelManager')
    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    def test_mcp_servers_in_agent_config(self, mock_browser_mgr, mock_jupyter_mgr):
        """Test that MCP servers are properly configured in agent configs."""
        from openhands.agent_hub import AgentHub

        mock_jupyter_mgr.return_value = Mock()
        mock_browser_mgr.return_value = Mock()

        with patch('openhands.agent_hub.hub.create_jupyter_mcp_server') as mock_jupyter, \
             patch('openhands.agent_hub.hub.create_browser_mcp_server') as mock_browser:

            mock_jupyter.return_value = Mock()
            mock_browser.return_value = Mock()

            hub = AgentHub(workspace="/tmp", api_key="test-key")

            # Browser agent should have browser MCP
            browser_config = hub.configs["browser"]
            assert "browser" in browser_config.mcp_servers

            # Python agent should have jupyter MCP
            python_config = hub.configs["python"]
            assert "jupyter" in python_config.mcp_servers

            # Code agent should not have MCP servers
            code_config = hub.configs["code"]
            assert len(code_config.mcp_servers) == 0

    @patch('openhands.mcp_servers.jupyter_mcp.JupyterKernelManager')
    async def test_jupyter_error_handling(self, mock_manager_class):
        """Test Jupyter MCP error handling."""
        from openhands.mcp_servers.jupyter_mcp import create_jupyter_mcp_server

        mock_manager = Mock()
        mock_manager.execute_code = AsyncMock(side_effect=Exception("Kernel error"))
        mock_manager_class.return_value = mock_manager

        server = create_jupyter_mcp_server()

        with pytest.raises(Exception, match="Kernel error"):
            await server.execute_python(code="raise Exception()")

    @patch('openhands.mcp_servers.browser_mcp.PlaywrightBrowserManager')
    async def test_browser_error_handling(self, mock_manager_class):
        """Test Browser MCP error handling."""
        from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

        mock_manager = Mock()
        mock_manager.navigate = AsyncMock(side_effect=Exception("Navigation failed"))
        mock_manager_class.return_value = mock_manager

        server = create_browser_mcp_server()

        with pytest.raises(Exception, match="Navigation failed"):
            await server.navigate(url="https://example.com")
