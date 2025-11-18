# Claude Code Skills Repository

> **A comprehensive collection of Claude Code tools, workflows, and automation systems**

**Environment:** Windows 11 | Python 3.13.7 | Node 22.18.0
**Last Updated:** November 18, 2025

---

## 📋 Repository Overview

This repository contains **7 specialized projects** for Claude Code development, covering everything from documentation and project management to testing and agent orchestration.

### Quick Status Guide

| Status | Meaning | Usage |
|--------|---------|-------|
| ✅ **Stable** | Production-ready, fully tested | Safe for production use |
| 🚧 **Under Build** | Experimental, active development | Testing and experimentation only |

---

## 🗂️ Projects in This Repository

### 📚 Documentation & Learning

#### 1. **Claude Code Insight Guide** ✅
> **Deep-dive technical documentation for AI CLI tools**

- **Path:** `claude-code-insight-guide/`
- **Status:** ✅ Stable
- **Purpose:** Comprehensive technical documentation covering Claude Agent SDK, OpenHands, Aider, and Cursor
- **What's Inside:**
  - 118+ markdown files with detailed analysis
  - Architecture breakdowns
  - API references
  - Integration guides
  - Best practices and patterns
- **Quick Start:** [Read README →](./claude-code-insight-guide/README.md)

---

### 🎯 Project Management Systems

#### 2. **Claude Advanced PM** 🚧
> **Spec-driven development workflow with GitHub Issues and parallel AI agents**

- **Path:** `claude-advanced-pm/`
- **Status:** 🚧 Under Build (based on [Claude Code PM](https://github.com/automazeio/ccpm) by Automaze.io)
- **Purpose:** Battle-tested project management for Claude Code that eliminates context loss
- **Key Features:**
  - PRD → Epic → Task → GitHub → Production workflow
  - Parallel agent execution (5-8 simultaneous tasks)
  - GitHub Issues as database
  - Full traceability from idea to production
  - 89% less context switching
- **Quick Start:** [Read README →](./claude-advanced-pm/README.md) | [Check Status →](./claude-advanced-pm/STATUS.md)
- **Commands:** `/pm:init`, `/pm:prd-new`, `/pm:epic-oneshot`, `/pm:next`

#### 3. **Claude PM Workflow** ✅
> **Lightweight, fast automation for Claude Code projects**

- **Path:** `claude-pm-workflow/`
- **Status:** ✅ Stable
- **Purpose:** Quick project management without heavy setup
- **What's Inside:**
  - Lightweight workflow commands
  - Fast task management
  - GitHub integration
  - Minimal configuration
- **Quick Start:** [Read README →](./claude-pm-workflow/README.md)

---

### 🤖 AI Agent Systems

#### 4. **Devin-Claude** 🚧
> **OpenHands fork with enhanced Claude Agent SDK integration**

- **Path:** `devin-claude/`
- **Status:** 🚧 Under Build (experimental OpenHands fork)
- **Purpose:** AI agent framework for autonomous software development
- **Key Features:**
  - 6 specialized agents (CodeAct, Browsing, ReadOnly, LOC, Visual, Dummy)
  - Full Claude Agent SDK implementation
  - Docker sandbox isolation
  - Web UI on port 3000
  - MCP server integration (Jupyter, Browser)
- **Quick Start:** [Read README →](./devin-claude/README.md) | [Check Status →](./devin-claude/STATUS.md)
- **Setup Time:** 10 minutes

#### 5. **Claude Rover** 🚧
> **Advanced agent orchestration with Git worktrees and parallel execution**

- **Path:** `claude-rover/`
- **Status:** 🚧 Under Build
- **Purpose:** Multi-agent orchestration system for complex development tasks
- **Key Features:**
  - Git worktree-based isolation
  - Parallel agent execution
  - Frontend: Next.js 16 + React 19 + TypeScript
  - Backend: Python + FastAPI
  - Real-time agent coordination
- **Quick Start:** [Read README →](./claude-rover/README.md) | [Frontend Guide →](./claude-rover/FRONTEND_GUIDE.md) | [Check Status →](./claude-rover/STATUS.md)

#### 6. **Claude Code Skills** ✅
> **Reusable skills and agents for Claude Code**

- **Path:** `claude-code-skills/`
- **Status:** ✅ Stable
- **Purpose:** Collection of pre-built skills and agent templates
- **What's Inside:**
  - Specialized agent definitions
  - Reusable skill modules
  - Integration patterns
  - Best practices
- **Quick Start:** [Read README →](./claude-code-skills/README.md)

---

### 🧪 Testing & Quality

#### 7. **Claude Code Tester** 🚧
> **E2E test automation with natural language test definitions**

- **Path:** `claude-code-tester/`
- **Status:** 🚧 Under Build
- **Purpose:** Automated end-to-end testing for Claude Code projects
- **Key Features:**
  - Natural language test definitions
  - Playwright MCP integration
  - Automated test execution
  - Screenshot capture
  - Result reporting
- **Quick Start:** [Read README →](./claude-code-tester/README.md) | [Check Status →](./claude-code-tester/STATUS.md)
- **Usage:**
  ```bash
  ./dist/claude-code-tester --testsPath=./tests.json
  ```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have these installed:
- **Python:** 3.13.7+
- **Node.js:** 22.18.0+
- **Git:** Latest version
- **GitHub CLI:** For PM systems (`gh` command)

### Choose Your Path

#### 🎓 Learning & Documentation
Start with **Claude Code Insight Guide** to understand AI CLI tools:
```bash
cd claude-code-insight-guide
# Browse the documentation
```

#### 📋 Project Management
Use **Claude Advanced PM** for structured, spec-driven development:
```bash
cd claude-advanced-pm
/pm:init
/pm:prd-new your-feature
```

Or use **Claude PM Workflow** for lightweight task management:
```bash
cd claude-pm-workflow
# Follow the README for setup
```

#### 🤖 AI Agent Development
Try **Devin-Claude** for autonomous coding:
```bash
cd devin-claude
pip install -e .
python -m openhands.server.app --port 3000
# Open http://localhost:3000
```

Or explore **Claude Rover** for advanced orchestration:
```bash
cd claude-rover
# See README and FRONTEND_GUIDE for setup
```

#### 🧪 Testing & Quality
Use **Claude Code Tester** for E2E testing:
```bash
cd claude-code-tester
npm install
./dist/claude-code-tester --testsPath=./tests.json
```

---

## 📊 Project Comparison

### Project Management: Advanced PM vs PM Workflow

| Feature | Claude Advanced PM | Claude PM Workflow |
|---------|-------------------|-------------------|
| Status | 🚧 Under Build | ✅ Stable |
| Setup Complexity | Moderate | Low |
| GitHub Integration | Deep (Issues, PRs) | Basic |
| Parallel Agents | ✅ Yes (5-8 tasks) | ❌ No |
| Traceability | Full (PRD→Code) | Basic |
| Best For | Large features, teams | Quick tasks, solo |

### Agent Systems: Devin-Claude vs Claude Rover

| Feature | Devin-Claude | Claude Rover |
|---------|-------------|--------------|
| Status | 🚧 Under Build | 🚧 Under Build |
| Based On | OpenHands | Custom |
| Agents | 6 pre-built | Custom orchestration |
| Isolation | Docker sandbox | Git worktrees |
| UI | Web UI (port 3000) | Frontend + Backend |
| Best For | Autonomous coding | Complex workflows |

---

## 🎯 Common Workflows

### Workflow 1: Spec-Driven Feature Development

```bash
# 1. Create PRD
cd claude-advanced-pm
/pm:prd-new memory-system

# 2. Generate Epic
/pm:prd-parse memory-system

# 3. Push to GitHub
/pm:epic-oneshot memory-system

# 4. Start development
/pm:issue-start 1234

# 5. Test implementation
cd ../claude-code-tester
./dist/claude-code-tester --testsPath=./tests.json
```

### Workflow 2: Autonomous Agent Development

```bash
# 1. Start agent framework
cd devin-claude
python -m openhands.server.app --port 3000

# 2. Open browser
# Navigate to http://localhost:3000

# 3. Select agent and give task
# Watch autonomous execution
```

### Workflow 3: Learning & Documentation

```bash
# 1. Browse documentation
cd claude-code-insight-guide

# 2. Read specific guides
# - Claude Agent SDK documentation
# - OpenHands architecture
# - Integration patterns
```

---

## 📁 Repository Structure

```
skills-claude/
├── claude-code-insight-guide/      # ✅ Documentation & learning
├── claude-advanced-pm/             # 🚧 Spec-driven PM system
├── claude-pm-workflow/             # ✅ Lightweight PM
├── devin-claude/                   # 🚧 OpenHands fork
├── claude-rover/                   # 🚧 Agent orchestration
├── claude-code-skills/             # ✅ Reusable skills
├── claude-code-tester/             # 🚧 E2E testing
└── README.md                       # This file
```

---

## ⚠️ Important Notes

### Experimental Projects (🚧 Under Build)

These projects are actively being developed:
- **Claude Advanced PM** - Not production-ready
- **Devin-Claude** - Experimental OpenHands fork
- **Claude Rover** - Active development
- **Claude Code Tester** - Testing phase

**Warning:** Experimental projects may have:
- Breaking changes
- Incomplete features
- Bugs and issues
- Unstable APIs

**Use experimental projects for:**
- ✅ Learning and experimentation
- ✅ Testing and feedback
- ✅ Development environments
- ❌ Production use

### Stable Projects (✅)

These projects are production-ready:
- **Claude Code Insight Guide** - Complete documentation
- **Claude PM Workflow** - Stable automation
- **Claude Code Skills** - Tested skills

---

## 🔗 External Resources

### Original Projects
- [Claude Code PM (CCPM)](https://github.com/automazeio/ccpm) by Automaze.io
- [OpenHands](https://github.com/All-Hands-AI/OpenHands) by All-Hands-AI

### Claude Resources
- [Claude API Documentation](https://docs.anthropic.com/)
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)
- [Anthropic Console](https://console.anthropic.com/)

### Tools & Dependencies
- [GitHub CLI](https://cli.github.com/)
- [Playwright](https://playwright.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)

---

## 📞 Support & Feedback

### For Stable Projects (✅)
Refer to each project's README for specific support channels.

### For Experimental Projects (🚧)
- Check STATUS.md in each project
- Review UNDER_BUILD.txt for warnings
- Report issues in project directories
- Testing and feedback welcome

---

## 📝 License

Each project maintains its own license. See individual project directories for details.

- **Claude Advanced PM**: MIT License (based on CCPM by Automaze.io)
- **Devin-Claude**: Based on OpenHands license
- **Other projects**: See respective LICENSE files

---

## ✨ Quick Tips

### For New Users
1. Start with **Claude Code Insight Guide** to understand the ecosystem
2. Try **Claude PM Workflow** for quick project management
3. Explore **Claude Code Skills** for reusable patterns

### For Advanced Users
1. Experiment with **Claude Advanced PM** for complex projects
2. Test **Devin-Claude** for autonomous development
3. Build with **Claude Rover** for custom orchestration
4. Automate with **Claude Code Tester** for quality assurance

### For Contributors
- Stable projects: Production-ready contributions welcome
- Experimental projects: Testing, feedback, and experimental PRs welcome
- Check each project's contribution guidelines

---

## 🎉 What's Next?

Explore the projects that match your needs:

| If you want to... | Use this project |
|------------------|------------------|
| Learn AI CLI tools | Claude Code Insight Guide |
| Manage complex features | Claude Advanced PM |
| Quick task automation | Claude PM Workflow |
| Autonomous coding | Devin-Claude |
| Advanced orchestration | Claude Rover |
| Reusable patterns | Claude Code Skills |
| Automated testing | Claude Code Tester |

**Pick a project and dive in! Each README provides detailed setup and usage instructions.**

---

**Happy Building with Claude Code! 🚀**

*Repository curated by Varun Israni*

