# Claude Code Insight Guide

> **Master AI CLI tools from the inside out** — deep-dive documentation revealing what official docs don't tell you.

**For developers, researchers, and power users** who demand to understand how Claude Code and other AI CLI tools actually work under the hood. We extract undocumented features, hidden APIs, architecture internals, gotchas, and real implementation patterns directly from source code.

**Why use this guide?** Official docs tell you *what* to do. We show you *how it works*, *what's not documented*, and *what breaks*.

*All content extracted from public open-source repositories — no proprietary info, no secrets, just better organized knowledge for better AI agent development.*

## 💡 Motivation

Open source doesn't automatically mean well-documented. While these projects are publicly available, critical details often remain buried in implementation code:

- **Undocumented features** — Experimental APIs, beta functionality, and hidden capabilities not in official docs
- **Implementation internals** — How things actually work vs. what the public API exposes
- **System prompts** — The actual instructions sent to LLMs that shape agent behavior
- **Real-world patterns** — Gotchas, edge cases, and integration nuances learned from source code

The **Claude Code Insight Guide** was born from a simple question: **how does the Task tool work under the hood** across different CLI agents? That question sparked a deep-dive into Claude Code, Claude Agent SDK, and comparative AI CLI tools, extracting architecture diagrams, security models, tool systems, and undocumented flows that weren't explained in any official documentation.

**For developers and AI agents:** Use this guide as your definitive reference when building AI workflows, understanding tool implementations, or debugging complex behaviors. These insights bridge the gap between "read the source" and "trust the marketing page."

## 📚 Documentation Library

### 🎯 Core Focus: Claude Ecosystem

#### 1. Claude Agent SDK ⭐️
**[→ Complete Documentation](docs/claude-agent-sdk/README.md)**

Anthropic's official TypeScript library for building AI agents powered by Claude. Deep-dive into 17 built-in tools, MCP integration, security hooks, specialized sub-agents, and flexible permission modes.

**Key insights:** Undocumented APIs, system prompts, tool implementation patterns, agent orchestration, and advanced SDK features.

---

### 🔍 Comparative AI CLI Tools

Understanding Claude Code is enhanced by comparing it to other AI CLI implementations:

#### 2. OpenCode
**[→ Full Documentation](docs/opencode/README.md)**

Open-source, provider-agnostic AI coding agent. Multi-provider support (Anthropic, OpenAI, Google, Bedrock), client/server architecture with built-in LSP, and ACP/MCP protocol integration.

#### 3. Codex CLI
**[→ Full Documentation](docs/codex_cli/README.md)**

OpenAI's Rust-based terminal coding agent. High-performance implementation with advanced tools, security sandboxing, and comprehensive approval policies.

#### 4. Gemini CLI
**[→ Full Documentation](docs/gemini-cli/README.md)**

Google's terminal CLI for Gemini AI. 5-package modular system with 15+ tools, agent-to-agent communication, and VS Code integration.

---

## 🔍 Enhanced Research: Octocode MCP

Power your exploration of this guide with the **Octocode MCP server** — built for AI-powered code and GitHub research. Provides advanced pattern matching, semantic search, and cross-reference analysis across all Claude Code documentation.

→ [github.com/bgauryy/octocode-mcp](https://github.com/bgauryy/octocode-mcp) | [Demo](https://www.youtube.com/watch?v=S2pcEjHo6CM)



https://github.com/user-attachments/assets/825ebe61-4000-47a5-beb8-f241dde41a73



## 💬 Contribute & Request

**Want deeper insights on specific Claude features?** Have questions about undocumented behaviors, architecture patterns, or tool implementations? Open an issue with your questions.

**Know an AI/CLI tool that needs better documentation?** Share the repo URL and what's missing.

## 🌟 Support This Guide

⭐ **Star on GitHub** — Help others discover these insights
🔗 **Share** — Spread knowledge to the AI development community
💡 **Contribute** — Request documentation or share discoveries
💰 **Sponsor** — Support ongoing research and documentation efforts

## ⚖️ Disclaimer & License

**Research and educational purposes only.** Content derived from public open-source resources. All information should be verified independently. No warranty provided. Use at your own risk.

---

**🏢 Enterprise Solutions:** Need custom documentation for your organization's AI agent infrastructure? Professional documentation services available: [bgauryy@octocodeai.com](mailto:bgauryy@octocodeai.com)
