import { which } from "bun";
import { systemPrompt } from "./system";
import { query } from "@anthropic-ai/claude-code";
import { inputs } from "../utils/args";
import type { TestCase } from "../types/test-case";

/**
 * Initiates a Claude Code query to start a test execution.
 * @param testCase - The test case to start.
 * @returns The Claude Code query.
 * @throws {Error} If Claude is not found on path.
 */
export const startTest = (testCase: TestCase) => {
    const claudePath = which("claude");
    if (!claudePath) {
        throw new Error("Claude not found on PATH. Did you run `bun install`?");
    }
    return query({
        prompt: "Query the test plan from mcp__vict-state__get_test_plan MCP tool to get started.",
        options: {
            customSystemPrompt: systemPrompt(),
            maxTurns: inputs.maxTurns,
            pathToClaudeCodeExecutable: claudePath,
            model: inputs.model,
            mcpServers: {
                "vict-playwright": {
                    command: "bunx",
                    args: [
                        "@playwright/mcp@v0.0.31",
                        "--output-dir",
                        `${inputs.resultsPath}/${testCase.id}/playwright`,
                        "--save-trace",
                        "--image-responses",
                        "omit",
                    ],
                },
                "vict-state": {
                    type: "http",
                    url: "http://localhost:3001/",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            },
            allowedTools: [
                // Playwright MCP tools for interacting with the browser
                "mcp__vict-playwright__browser_close",
                "mcp__vict-playwright__browser_resize",
                "mcp__vict-playwright__browser_console_messages",
                "mcp__vict-playwright__browser_handle_dialog",
                "mcp__vict-playwright__browser_evaluate",
                "mcp__vict-playwright__browser_file_upload",
                "mcp__vict-playwright__browser_install",
                "mcp__vict-playwright__browser_press_key",
                "mcp__vict-playwright__browser_type",
                "mcp__vict-playwright__browser_navigate",
                "mcp__vict-playwright__browser_navigate_back",
                "mcp__vict-playwright__browser_navigate_forward",
                "mcp__vict-playwright__browser_network_requests",
                "mcp__vict-playwright__browser_snapshot",
                "mcp__vict-playwright__browser_click",
                "mcp__vict-playwright__browser_drag",
                "mcp__vict-playwright__browser_hover",
                "mcp__vict-playwright__browser_select_option",
                "mcp__vict-playwright__browser_tab_list",
                "mcp__vict-playwright__browser_tab_new",
                "mcp__vict-playwright__browser_tab_select",
                "mcp__vict-playwright__browser_tab_close",
                "mcp__vict-playwright__browser_take_screenshot",
                "mcp__vict-playwright__browser_wait_for",
                // Custom MCP tools for managing the test state
                "mcp__vict-state__get_test_plan",
                "mcp__vict-state__update_test_step",
            ],
        },
    });
};
