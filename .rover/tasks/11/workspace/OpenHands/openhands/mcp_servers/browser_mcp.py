"""
Browser MCP Server for Claude Agent SDK

This module provides a custom MCP server that enables Claude agents to interact
with web pages using Playwright browser automation. This replaces OpenHands'
BrowserGym functionality with a cleaner, SDK-integrated approach.

Features:
- Navigate to URLs
- Extract page content and text
- Perform interactions (click, type, select)
- Take screenshots
- Support multiple concurrent browser pages

Usage:
    from openhands.mcp_servers.browser_mcp import create_browser_mcp_server

    browser_mcp = create_browser_mcp_server()

    options = ClaudeAgentOptions(
        allowed_tools=[
            "mcp__browser__navigate",
            "mcp__browser__interact",
            "mcp__browser__screenshot",
            "mcp__browser__extract_content"
        ],
        mcp_servers={"browser": browser_mcp}
    )
"""

from claude_agent_sdk import tool, create_sdk_mcp_server
from playwright.async_api import async_playwright, Browser, Page, Playwright
from typing import Optional, Dict
import asyncio
import base64
import logging

logger = logging.getLogger(__name__)


class BrowserManager:
    """
    Manage browser instances for web interactions.

    This class handles:
    - Initializing Playwright browser
    - Creating and managing multiple pages
    - Navigating and interacting with web pages
    - Cleanup and resource management
    """

    def __init__(self):
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.pages: Dict[str, Page] = {}
        self.default_page_id = "default"
        logger.info("BrowserManager initialized")

    async def initialize(self):
        """Initialize Playwright browser if not already initialized."""
        if self.browser is None:
            logger.info("Starting Playwright browser")
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            logger.info("Browser started successfully")

    async def get_or_create_page(self, page_id: Optional[str] = None) -> Page:
        """
        Get existing page or create new one.

        Args:
            page_id: Optional page identifier (default: 'default')

        Returns:
            Page instance ready for interaction
        """
        await self.initialize()

        pid = page_id or self.default_page_id

        if pid not in self.pages:
            logger.info(f"Creating new browser page: {pid}")
            self.pages[pid] = await self.browser.new_page()

        return self.pages[pid]

    async def cleanup(self):
        """Cleanup browser resources."""
        logger.info(f"Cleaning up {len(self.pages)} browser pages")

        for pid, page in self.pages.items():
            try:
                await page.close()
                logger.info(f"Page {pid} closed")
            except Exception as e:
                logger.error(f"Error closing page {pid}: {e}")

        self.pages.clear()

        if self.browser:
            try:
                await self.browser.close()
                logger.info("Browser closed")
            except Exception as e:
                logger.error(f"Error closing browser: {e}")

        if self.playwright:
            try:
                await self.playwright.stop()
                logger.info("Playwright stopped")
            except Exception as e:
                logger.error(f"Error stopping Playwright: {e}")


# Global browser manager instance
_browser_manager = BrowserManager()


@tool(
    "navigate",
    "Navigate to a URL in the browser",
    {
        "url": {
            "type": "string",
            "description": "URL to navigate to"
        },
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        },
        "wait_until": {
            "type": "string",
            "description": "When to consider navigation complete: 'load', 'domcontentloaded', 'networkidle' (default: 'networkidle')",
            "optional": True
        }
    }
)
async def navigate(args):
    """
    Navigate to URL.

    This tool loads a web page in the browser and waits for it to be ready.

    Args:
        args: Dictionary with 'url', optional 'page_id', and optional 'wait_until'

    Returns:
        MCP tool result with navigation status
    """
    url = args.get("url", "")
    page_id = args.get("page_id")
    wait_until = args.get("wait_until", "networkidle")

    if not url:
        return {
            "content": [{"type": "text", "text": "Error: No URL provided"}],
            "isError": True
        }

    try:
        logger.info(f"Navigating to: {url}")
        page = await _browser_manager.get_or_create_page(page_id)
        response = await page.goto(url, wait_until=wait_until, timeout=30000)

        title = await page.title()
        current_url = page.url

        # Get content preview
        content = await page.content()
        content_preview = content[:500] + "..." if len(content) > 500 else content

        result_text = f"""✅ Navigation successful

URL: {current_url}
Title: {title}
Status: {response.status if response else 'N/A'}

Content Preview:
{content_preview}
"""

        return {
            "content": [{
                "type": "text",
                "text": result_text
            }]
        }

    except Exception as e:
        logger.error(f"Navigation error: {e}")
        return {
            "content": [{"type": "text", "text": f"❌ Navigation error: {str(e)}"}],
            "isError": True
        }


@tool(
    "interact",
    "Interact with page elements (click, type, select)",
    {
        "action": {
            "type": "string",
            "description": "Action to perform: 'click', 'type', 'select', 'hover'"
        },
        "selector": {
            "type": "string",
            "description": "CSS selector for element"
        },
        "value": {
            "type": "string",
            "description": "Value for 'type' or 'select' actions",
            "optional": True
        },
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        }
    }
)
async def interact(args):
    """
    Interact with page elements.

    This tool performs actions on web page elements like clicking buttons,
    typing text, selecting options, etc.

    Args:
        args: Dictionary with 'action', 'selector', optional 'value', optional 'page_id'

    Returns:
        MCP tool result with interaction status
    """
    action = args.get("action", "")
    selector = args.get("selector", "")
    value = args.get("value", "")
    page_id = args.get("page_id")

    if not action or not selector:
        return {
            "content": [{"type": "text", "text": "Error: Missing action or selector"}],
            "isError": True
        }

    try:
        logger.info(f"Performing action '{action}' on selector '{selector}'")
        page = await _browser_manager.get_or_create_page(page_id)

        # Wait for element to be available
        await page.wait_for_selector(selector, timeout=10000)

        if action == "click":
            await page.click(selector)
            result = f"✅ Clicked on: {selector}"

        elif action == "type":
            await page.fill(selector, value)
            result = f"✅ Typed '{value}' into: {selector}"

        elif action == "select":
            await page.select_option(selector, value)
            result = f"✅ Selected '{value}' in: {selector}"

        elif action == "hover":
            await page.hover(selector)
            result = f"✅ Hovered over: {selector}"

        else:
            return {
                "content": [{"type": "text", "text": f"❌ Unknown action: {action}"}],
                "isError": True
            }

        return {
            "content": [{"type": "text", "text": result}]
        }

    except Exception as e:
        logger.error(f"Interaction error: {e}")
        return {
            "content": [{"type": "text", "text": f"❌ Interaction error: {str(e)}"}],
            "isError": True
        }


@tool(
    "screenshot",
    "Take a screenshot of the current page",
    {
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        },
        "full_page": {
            "type": "boolean",
            "description": "Capture full page (default: False)",
            "optional": True
        }
    }
)
async def screenshot(args):
    """
    Take screenshot of page.

    This tool captures a screenshot of the current browser page.

    Args:
        args: Dictionary with optional 'page_id' and 'full_page'

    Returns:
        MCP tool result with screenshot image
    """
    page_id = args.get("page_id")
    full_page = args.get("full_page", False)

    try:
        logger.info(f"Taking screenshot (full_page={full_page})")
        page = await _browser_manager.get_or_create_page(page_id)
        screenshot_bytes = await page.screenshot(full_page=full_page)
        screenshot_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')

        return {
            "content": [{
                "type": "image",
                "data": screenshot_b64,
                "mimeType": "image/png"
            }]
        }

    except Exception as e:
        logger.error(f"Screenshot error: {e}")
        return {
            "content": [{"type": "text", "text": f"❌ Screenshot error: {str(e)}"}],
            "isError": True
        }


@tool(
    "extract_content",
    "Extract text content from the page",
    {
        "selector": {
            "type": "string",
            "description": "Optional CSS selector to extract specific element (default: entire page)",
            "optional": True
        },
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        }
    }
)
async def extract_content(args):
    """
    Extract text content from page.

    This tool extracts visible text from the page or a specific element.

    Args:
        args: Dictionary with optional 'selector' and 'page_id'

    Returns:
        MCP tool result with extracted content
    """
    selector = args.get("selector")
    page_id = args.get("page_id")

    try:
        logger.info(f"Extracting content (selector={selector or 'body'})")
        page = await _browser_manager.get_or_create_page(page_id)

        if selector:
            element = await page.query_selector(selector)
            if element:
                content = await element.inner_text()
            else:
                return {
                    "content": [{"type": "text", "text": f"❌ Element not found: {selector}"}],
                    "isError": True
                }
        else:
            content = await page.inner_text("body")

        # Get page title and URL for context
        title = await page.title()
        url = page.url

        result_text = f"""📄 Extracted Content

Page: {title}
URL: {url}
Selector: {selector or 'body (entire page)'}

Content:
{content}
"""

        return {
            "content": [{
                "type": "text",
                "text": result_text
            }]
        }

    except Exception as e:
        logger.error(f"Content extraction error: {e}")
        return {
            "content": [{"type": "text", "text": f"❌ Content extraction error: {str(e)}"}],
            "isError": True
        }


@tool(
    "get_page_info",
    "Get information about the current page",
    {
        "page_id": {
            "type": "string",
            "description": "Optional page ID (default: 'default')",
            "optional": True
        }
    }
)
async def get_page_info(args):
    """
    Get page information.

    This tool returns details about the current browser page.

    Args:
        args: Dictionary with optional 'page_id'

    Returns:
        MCP tool result with page information
    """
    page_id = args.get("page_id")

    try:
        page = await _browser_manager.get_or_create_page(page_id)

        title = await page.title()
        url = page.url

        info_text = f"""📊 Page Information

Title: {title}
URL: {url}
Page ID: {page_id or _browser_manager.default_page_id}
"""

        return {
            "content": [{
                "type": "text",
                "text": info_text
            }]
        }

    except Exception as e:
        logger.error(f"Error getting page info: {e}")
        return {
            "content": [{"type": "text", "text": f"❌ Error: {str(e)}"}],
            "isError": True
        }


def create_browser_mcp_server():
    """
    Create Browser MCP server with all tools.

    Returns:
        MCP server instance configured with browser tools
    """
    logger.info("Creating Browser MCP server")

    return create_sdk_mcp_server(
        name="browser",
        version="1.0.0",
        tools=[
            navigate,
            interact,
            screenshot,
            extract_content,
            get_page_info
        ]
    )
