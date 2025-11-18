# Claude PM Workflow - Simplified Fast Workflow

A streamlined project management system for Claude Code. Plan, create, and execute tasks with AI-powered automation and GitHub integration.

## Quick Start

### One Command - Full Automation

```bash
/pm:task-auto "Add feature X" --execute
```

That's it! This single command will:
- 🔍 Explore your codebase (2-5 min)
- 📋 Generate execution plan (1-2 min)
- 🎯 Create GitHub issue (30 sec)
- ⚡ Execute with parallel agents (10-30 min)
- ✅ Commit changes automatically

**Total time:** 15-40 minutes from idea to implementation!

### Manual Step-by-Step (More Control)

```bash
# 1. Explore codebase
/pm:task-explore "Add feature X"

# 2. Generate plan
/pm:task-plan <task-id>

# 3. Create GitHub issue
/pm:task-create <task-id>

# 4. Execute with parallel agents
/pm:task-execute <issue-number>
```

## Installation

### Prerequisites

1. **Git** - Version control
2. **GitHub CLI** (`gh`) - GitHub integration
   ```bash
   # Install gh CLI
   winget install GitHub.cli

   # Authenticate
   gh auth login
   ```
3. **Claude Code** - AI assistant

### Setup Steps

1. **Copy .claude folder to your project:**
   ```bash
   cp -r "path/to/claude-pm-workflow/.claude" "your-project-path/"
   ```

2. **Initialize:**
   ```bash
   /pm:init
   ```

3. **View all available commands:**
   ```bash
   /pm:help
   ```

## How It Works

### The Workflow

```
Task Description
       ↓
 [Explore Codebase] ← AI analyzes files, dependencies, complexity
       ↓
  [Generate Plan]   ← AI creates detailed execution steps
       ↓
[Create GitHub Issue] ← Single issue with complete plan
       ↓
 [Execute Plan]     ← Parallel agents implement the changes
       ↓
   ✅ Done!
```

### Key Features

✅ **Deep Code Exploration**
- Analyzes your codebase before planning
- Identifies affected files and dependencies
- Assesses complexity and effort
- Confidence scoring

✅ **Intelligent Planning**
- Generates detailed execution steps
- Identifies parallel work streams
- Creates acceptance criteria
- Defines testing strategy

✅ **GitHub Integration**
- Creates issues with detailed plans
- Auto-syncs progress every 30 minutes
- Supports labels, milestones
- Bidirectional sync (local ↔ GitHub)

✅ **Parallel Execution**
- Automatically identifies independent work
- Spawns parallel agents for speed
- Coordinates file access
- Integration agent merges results

✅ **Progress Tracking**
- Real-time progress files
- Per-stream status updates
- Commit tracking
- Test result monitoring

## Directory Structure

```
.claude/
├── commands/
│   └── pm/                    # 25 PM commands
│       ├── task-auto.md       # Full automation
│       ├── task-explore.md    # Code exploration
│       ├── task-plan.md       # Plan generation
│       ├── task-create.md     # GitHub issue creation
│       ├── task-execute.md    # Execution orchestrator
│       ├── issue-*.md         # Issue management (8 commands)
│       └── ...                # More commands
├── scripts/
│   └── pm/                    # Shell scripts
├── rules/
│   └── task-operations.md     # Workflow rules
└── tasks/                     # Task storage
    └── <issue-number>/
        ├── exploration.md
        ├── plan.md
        ├── task.md
        └── progress.md
```

## Commands Reference

### Core Workflow

| Command | Description | Time |
|---------|-------------|------|
| `/pm:task-auto "<task>" [--execute]` | Full automation | 15-40 min |
| `/pm:task-explore "<task>"` | Code exploration only | 2-5 min |
| `/pm:task-plan <task-id>` | Generate plan | 1-2 min |
| `/pm:task-create <task-id>` | Create GitHub issue | 30 sec |
| `/pm:task-execute <issue#>` | Execute with agents | 10-30 min |

### Issue Management

| Command | Description |
|---------|-------------|
| `/pm:issue-show <num>` | Display issue details |
| `/pm:issue-status <num>` | Check issue status |
| `/pm:issue-start <num>` | Begin work |
| `/pm:issue-sync <num>` | Sync to GitHub |
| `/pm:issue-close <num>` | Mark complete |
| `/pm:issue-edit <num>` | Edit details |
| `/pm:issue-analyze <num>` | Analyze for parallel streams |

### Workflow Helpers

| Command | Description |
|---------|-------------|
| `/pm:next` | Show next priority tasks |
| `/pm:status` | Project dashboard |
| `/pm:standup` | Daily standup report |
| `/pm:blocked` | Show blocked tasks |
| `/pm:in-progress` | List work in progress |
| `/pm:sync` | Sync with GitHub |
| `/pm:validate` | Check integrity |
| `/pm:clean` | Archive completed work |

## Examples

### Example 1: Quick Feature Addition

```bash
/pm:task-auto "Add dark mode toggle to settings" --execute
```

**What happens:**
1. ✅ Explores codebase (3 min)
2. ✅ Generates plan (2 min)
3. ✅ Creates GitHub issue #145
4. ✅ Executes with 2 parallel agents (15 min)
5. ✅ Commits changes
**Total: ~20 minutes**

### Example 2: Complex Refactoring

```bash
/pm:task-auto "Refactor authentication system" --depth deep --execute
```

**What happens:**
1. ✅ Deep exploration (10 min)
2. ✅ Detailed plan (3 min)
3. ✅ Creates issue #146
4. ✅ Executes with 4 parallel agents (45 min)
5. ✅ Integration and tests (10 min)
**Total: ~68 minutes**

### Example 3: Bug Fix (Fast)

```bash
/pm:task-auto "Fix login validation error" --execute
```

**Total: ~8 minutes**

### Example 4: Step-by-Step Control

```bash
# Explore first
/pm:task-explore "Add user profile page"

# Review exploration results in .claude/tasks/<task-id>/exploration.md

# Generate plan
/pm:task-plan <task-id>

# Review plan in .claude/tasks/<task-id>/plan.md

# Create issue when ready
/pm:task-create <task-id>

# Execute when approved
/pm:task-execute <issue-number>
```

## Advanced Usage

### Custom Exploration Depth

```bash
# Light (2-3 min) - for simple changes
/pm:task-auto "Update button color" --depth light

# Medium (4-6 min) - recommended default
/pm:task-auto "Add user profile" --depth medium

# Deep (8-12 min) - for complex features
/pm:task-auto "Refactor database" --depth deep
```

### Dry Run Mode

```bash
# See what would be done without executing
/pm:task-execute 145 --dry-run
```

### Resume Interrupted Execution

```bash
# Continue from where it stopped
/pm:task-execute 145 --resume
```

## Troubleshooting

### GitHub Authentication Issues

```bash
# Check authentication
gh auth status

# Re-authenticate
gh auth login
```

### Git Working Directory Not Clean

```bash
# Stash changes
git stash

# Or commit them
git add .
git commit -m "WIP"

# Then run command
/pm:task-auto "your task"
```

### Task Not Found

```bash
# List all tasks
ls .claude/tasks/

# Check status
/pm:issue-status <number>
```

## Best Practices

### ✅ DO:
- Use `/pm:task-auto` for most tasks
- Keep git working directory clean
- Review plans before approving
- Run tests frequently
- Commit with clear messages
- Sync progress to GitHub

### ❌ DON'T:
- Execute without reviewing plan
- Modify files outside agent's assigned list
- Skip tests
- Force push to main branch

## Configuration

### Settings (.claude/ccpm.config)

```bash
# Repository settings
GITHUB_REPO="owner/repo"
GITHUB_BASE_BRANCH="main"

# Execution settings
MAX_PARALLEL_AGENTS=5
AUTO_SYNC_INTERVAL=30  # minutes

# Planning settings
DEFAULT_EXPLORATION_DEPTH="medium"
```

## Project Compatibility

Works with any git-based project:
- ✅ Next.js / React
- ✅ Node.js / Express
- ✅ Python / Django / Flask
- ✅ Ruby / Rails
- ✅ Any GitHub repository

## Why This Workflow?

### Traditional Approach
```
Write PRD (30 min)
  ↓
Create Epic (20 min)
  ↓
Break into Tasks (30 min)
  ↓
Sync to GitHub (5 min)
  ↓
Start Implementation
───────────────────
Total Setup: ~85 minutes
```

### Simplified Workflow
```
/pm:task-auto "task" --execute
───────────────────
Total: 15-40 minutes
(includes implementation!)
```

**Result: 60-70% time saved!**

## Support & Documentation

- **Help:** `/pm:help`
- **Task Docs:** `.claude/tasks/README.md`
- **Rules:** `.claude/rules/task-operations.md`

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│  ONE-COMMAND AUTOMATION                             │
├─────────────────────────────────────────────────────┤
│  /pm:task-auto "task" --execute    → Full auto     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  STEP-BY-STEP WORKFLOW                              │
├─────────────────────────────────────────────────────┤
│  /pm:task-explore "task"           → Explore        │
│  /pm:task-plan <id>                → Plan           │
│  /pm:task-create <id>              → Create issue   │
│  /pm:task-execute <num>            → Execute        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ISSUE MANAGEMENT                                   │
├─────────────────────────────────────────────────────┤
│  /pm:issue-show <num>              → View issue     │
│  /pm:issue-status <num>            → Check status   │
│  /pm:issue-close <num>             → Close issue    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  HELPERS                                            │
├─────────────────────────────────────────────────────┤
│  /pm:help                          → All commands   │
│  /pm:status                        → Dashboard      │
│  /pm:next                          → Next tasks     │
└─────────────────────────────────────────────────────┘
```

---

**Version:** 2.0 - Simplified
**Last Updated:** November 18, 2025
**Created with:** Claude Code

**Start now:** `/pm:task-auto "your first task" --execute`
