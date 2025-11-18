# Complete User Guide

Step-by-step guide to using the Claude PM Workflow system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Your First Task](#your-first-task)
3. [Understanding the Workflow](#understanding-the-workflow)
4. [Advanced Usage](#advanced-usage)
5. [Team Collaboration](#team-collaboration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

**Step 1: Copy the .claude folder**
```bash
# Navigate to your project
cd /path/to/your/project

# Copy the PM workflow
cp -r "/path/to/claude-pm-workflow/.claude" .
```

**Step 2: Install Prerequisites**
```bash
# Install GitHub CLI (if not installed)
winget install GitHub.cli   # Windows
brew install gh              # Mac
sudo apt install gh          # Linux

# Authenticate with GitHub
gh auth login
```

**Step 3: Initialize the system**
```bash
# Run initialization
/pm:init
```

**Step 4: Verify setup**
```bash
# Check system health
/pm:validate

# View available commands
/pm:help
```

### Understanding the Directory Structure

After installation, you'll have:

```
your-project/
├── .claude/
│   ├── commands/pm/        # 25 PM commands
│   ├── scripts/pm/         # Shell scripts
│   ├── rules/              # Workflow rules
│   └── tasks/              # Task storage (empty initially)
├── your-code/
└── ...
```

When you create tasks, they'll appear in `.claude/tasks/`:

```
.claude/tasks/
├── 145/                    # GitHub issue #145
│   ├── exploration.md
│   ├── plan.md
│   ├── task.md
│   └── progress.md
└── 146/                    # GitHub issue #146
    └── ...
```

---

## Your First Task

### Option A: Full Automation (Recommended for Beginners)

**One command does everything:**

```bash
/pm:task-auto "Add a logout button to the navbar" --execute
```

**What happens:**
1. ⏱️ **Minute 1-3:** AI explores your codebase
   - Finds navbar component
   - Identifies auth system
   - Assesses complexity

2. ⏱️ **Minute 4-5:** AI creates execution plan
   - Step 1: Add logout button UI
   - Step 2: Connect to auth system
   - Step 3: Add tests

3. ⏱️ **Minute 6:** AI creates GitHub issue #145
   - Full plan in issue body
   - Labels: task, automated

4. ⏱️ **Minute 7-20:** AI implements the feature
   - Creates branch: issue-145
   - Makes code changes
   - Writes tests
   - Commits changes

**Total time: ~20 minutes**

### Option B: Step-by-Step (Recommended for Learning)

**Step 1: Explore the codebase**
```bash
/pm:task-explore "Add a logout button to the navbar"
```

**Output:**
```
Exploring codebase...

Task ID: 20250118-abc123
Confidence: high
Complexity: low
Files to modify:
- src/components/Navbar.tsx
- src/utils/auth.ts
Estimated: 2 hours

Exploration saved to: .claude/tasks/20250118-abc123/exploration.md
```

**💡 Tip:** Open `exploration.md` to review AI's analysis

**Step 2: Generate execution plan**
```bash
/pm:task-plan 20250118-abc123
```

**Output:**
```
Creating plan...

Steps: 4
Parallel streams: 1 (sequential execution)
Estimated: 2 hours

Plan saved to: .claude/tasks/20250118-abc123/plan.md
```

**💡 Tip:** Review `plan.md` - Edit if needed before proceeding

**Step 3: Create GitHub issue**
```bash
/pm:task-create 20250118-abc123
```

**Output:**
```
Created GitHub Issue #145
URL: https://github.com/user/repo/issues/145

Directory renamed:
.claude/tasks/20250118-abc123 → .claude/tasks/145
```

**💡 Tip:** Check the GitHub issue - full plan is there

**Step 4: Execute the plan**
```bash
/pm:task-execute 145
```

**Output:**
```
Execution started for #145
Branch: issue-145

Progress: 0%
[====                    ] 20%
[========                ] 40%
[============            ] 60%
[================        ] 80%
[====================    ] 90%
[========================] 100%

Completed!
Commits: 3
Tests: Passing

Next steps:
1. Review changes: git diff main
2. Create PR: gh pr create
```

---

## Understanding the Workflow

### The Simplified Workflow Diagram

```
┌──────────────────┐
│  Task Idea       │
│  "Add logout"    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  EXPLORE                             │
│  AI analyzes codebase                │
│  - Finds relevant files              │
│  - Assesses complexity               │
│  - Estimates effort                  │
│  Output: exploration.md              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  PLAN                                │
│  AI creates execution plan           │
│  - Detailed steps                    │
│  - File modifications                │
│  - Testing strategy                  │
│  Output: plan.md                     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  CREATE ISSUE                        │
│  Push to GitHub                      │
│  - Single issue created              │
│  - Full plan in description          │
│  - Labels added                      │
│  Output: GitHub issue #145           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  EXECUTE                             │
│  AI implements changes               │
│  - Creates feature branch            │
│  - Makes code changes                │
│  - Writes tests                      │
│  - Commits atomically                │
│  Output: Working code!               │
└──────────────────────────────────────┘
```

### Task States

Tasks flow through these states:

```
created        → Task directory created
  ↓
explored       → Codebase analyzed
  ↓
planned        → Execution plan ready
  ↓
open           → GitHub issue created
  ↓
in_progress    → Execution started
  ↓
completed      → Work finished
  ↓
closed         → GitHub issue closed
```

### File Locations

**Before GitHub sync:**
```
.claude/tasks/20250118-abc123/
├── exploration.md
├── plan.md
└── task.md
```

**After GitHub sync:**
```
.claude/tasks/145/              # Renamed to issue number
├── exploration.md
├── plan.md
├── task.md
├── progress.md                 # Added during execution
└── updates/                    # Added if parallel streams
    ├── stream-A.md
    └── stream-B.md
```

---

## Advanced Usage

### Controlling Exploration Depth

**Light Exploration (2-3 minutes)**
```bash
/pm:task-auto "Change button color" --depth light
```
- Quick surface-level analysis
- Good for: Simple UI changes, styling, small fixes

**Medium Exploration (4-6 minutes) - Default**
```bash
/pm:task-auto "Add user profile page" --depth medium
```
- Balanced analysis
- Good for: Most features, moderate complexity

**Deep Exploration (8-12 minutes)**
```bash
/pm:task-auto "Refactor authentication system" --depth deep
```
- Comprehensive analysis
- Good for: Complex refactoring, unfamiliar areas, critical features

### Parallel Execution

Some tasks can be split into parallel work streams for faster execution.

**Example: Adding a complete feature**
```bash
/pm:task-auto "Add user dashboard with charts" --execute
```

AI might identify 3 parallel streams:
```
Stream A: Dashboard UI components     (3 hours)
Stream B: Chart data API endpoints    (3 hours)
Stream C: Data visualization logic    (2 hours)

Sequential: 8 hours total
Parallel: ~3 hours total (62% faster!)
```

**How it works:**
1. AI analyzes task
2. Identifies independent work streams
3. Assigns exclusive files to each stream
4. Spawns parallel agents
5. Coordinates execution
6. Integrates results

**View parallel analysis:**
```bash
/pm:issue-analyze 145
```

### Dry Run Mode

**Preview what would happen without making changes:**
```bash
/pm:task-execute 145 --dry-run
```

**Output:**
```
DRY RUN - No changes will be made

Would create branch: issue-145

Would modify files:
- src/components/Dashboard.tsx (new file)
- src/pages/dashboard.tsx (new file)
- src/api/stats.ts (modified)

Would spawn agents:
- Agent 1: Dashboard UI (2h estimated)
- Agent 2: API endpoints (2h estimated)

Estimated commits: 4
Estimated time: 2 hours

To execute for real: /pm:task-execute 145
```

### Resuming Interrupted Execution

If execution is interrupted (crash, network issue, etc.):

```bash
# Resume from where it stopped
/pm:task-execute 145 --resume
```

AI will:
- Read progress file
- Check which streams completed
- Resume incomplete work
- Continue from last checkpoint

---

## Team Collaboration

### Working with Team Members

**1. Share task visibility**
```bash
# Sync your progress to GitHub
/pm:issue-sync 145
```

Team members can see:
- Progress updates in issue comments
- Completion percentage
- Current status
- Blockers

**2. Import team member's issues**
```bash
# Someone created issue #150 on GitHub
/pm:import 150

# Now you can work on it
/pm:task-execute 150
```

**3. Daily standup**
```bash
/pm:standup
```

Share the output in team standup:
```
Yesterday:
✅ #144: Fixed navbar bug
✅ #145: Added logout button

Today:
🔄 #146: User dashboard (40% done)
📋 #147: Charts integration (starting)

Blockers: None
```

### Workflow for Teams

**Team Lead:**
```bash
# Create tasks for team
/pm:task-explore "Feature X"
/pm:task-plan <task-id>
/pm:task-create <task-id>

# Assign on GitHub, then team member can:
```

**Team Member:**
```bash
# Import assigned issue
/pm:import 145

# Execute
/pm:task-execute 145

# Sync progress
/pm:issue-sync 145  # Runs every 30 min automatically

# Complete
/pm:issue-close 145
```

### Project Dashboard

**View overall project status:**
```bash
/pm:status
```

**Output:**
```
Project Dashboard - Nov 18, 2025

Total Tasks: 20
├─ Completed: 12 (60%)
├─ In Progress: 4 (20%)
├─ Blocked: 1 (5%)
└─ Todo: 3 (15%)

🔄 In Progress:
#145: User dashboard (40%) - Alice
#146: API refactor (65%) - Bob
#148: Mobile layout (25%) - Carol
#149: Tests (80%) - David

⚠️ Blocked:
#147: Payment (blocked by #146)

📊 Velocity:
This week: 8 tasks completed
Average: 1.6 tasks/day
```

---

## Best Practices

### DO ✅

**1. Keep working directory clean**
```bash
# Before starting task
git status  # Should be clean

# If not clean
git stash   # or
git commit -am "WIP"
```

**2. Review plans before executing**
```bash
# Explore
/pm:task-explore "task"

# Review .claude/tasks/<id>/exploration.md
# Edit if needed

# Plan
/pm:task-plan <id>

# Review .claude/tasks/<id>/plan.md
# Edit if needed

# Then execute
/pm:task-create <id>
/pm:task-execute <issue>
```

**3. Use meaningful task descriptions**
```bash
# ✅ Good
/pm:task-auto "Add logout button to navbar with auth integration"

# ❌ Bad
/pm:task-auto "logout"
```

**4. Check status regularly**
```bash
# Daily
/pm:next        # What should I work on?
/pm:status      # How's the project?
/pm:standup     # Standup report
```

**5. Sync progress for team**
```bash
# After major milestones
/pm:issue-sync 145

# Auto-syncs every 30 min during execution
```

### DON'T ❌

**1. Don't skip tests**
```bash
# AI runs tests automatically
# If tests fail, fix them before closing

/pm:task-execute 145
# ... tests fail ...
# Fix issues
# Re-run
```

**2. Don't modify files outside agent's scope**
```bash
# In parallel execution, each stream has assigned files
# Modifying others causes conflicts
# Let AI handle coordination
```

**3. Don't force push to main**
```bash
# ❌ Bad
git push -f origin main

# ✅ Good
# Work in feature branch (AI does this)
# Create PR
# Merge after review
```

**4. Don't ignore blockers**
```bash
# Check blockers
/pm:blocked

# Resolve them
# Update dependencies
# Complete prerequisite tasks
```

**5. Don't accumulate too much WIP**
```bash
# Check work in progress
/pm:in-progress

# Limit: 2-3 tasks max
# Complete before starting new
```

### Workflow Patterns

**Pattern 1: Quick Fix**
```bash
# One-liner for bugs
/pm:task-auto "Fix login button not working" --execute
# Done in ~10 min
```

**Pattern 2: Feature Development**
```bash
# Explore first, review, then execute
/pm:task-explore "Add user settings page"
# Review exploration
/pm:task-plan <id>
# Review plan
/pm:task-create <id>
/pm:task-execute <issue>
```

**Pattern 3: Complex Refactoring**
```bash
# Deep exploration, manual review
/pm:task-explore "Refactor auth system" --depth deep
# Review thoroughly
/pm:task-plan <id>
# Edit plan if needed
/pm:task-create <id>
# Maybe dry-run first
/pm:task-execute <issue> --dry-run
# Then execute
/pm:task-execute <issue>
```

**Pattern 4: Team Sprint**
```bash
# Lead creates all tasks
for task in "Feature A" "Feature B" "Feature C"; do
  /pm:task-explore "$task"
  /pm:task-plan <id>
  /pm:task-create <id>
done

# Team imports and executes
# Team member 1:
/pm:import 145
/pm:task-execute 145

# Team member 2:
/pm:import 146
/pm:task-execute 146
```

---

## Troubleshooting

### Common Issues

**Issue: "GitHub CLI not authenticated"**
```bash
# Check status
gh auth status

# Login
gh auth login

# Select GitHub.com
# Select HTTPS
# Authenticate in browser

# Verify
/pm:validate
```

**Issue: "Working directory not clean"**
```bash
# Check what's changed
git status

# Option 1: Stash
git stash
/pm:task-auto "your task"
git stash pop  # After completion

# Option 2: Commit
git add .
git commit -m "WIP: Saving progress"
/pm:task-auto "your task"
```

**Issue: "Task not found"**
```bash
# List all tasks
ls .claude/tasks/

# If task ID vs issue number confusion
# Task IDs: YYYYMMDD-XXXXXX (before GitHub)
# Issue numbers: 145 (after GitHub)

# Use the correct identifier
/pm:task-plan 20250118-abc123      # Task ID
/pm:task-execute 145                # Issue number
```

**Issue: "Tests failing during execution"**
```bash
# Execution will stop on test failure
# Check error output
cat .claude/tasks/145/progress.md

# Fix the issue manually or
# Let AI retry
/pm:task-execute 145 --resume
```

**Issue: "Can't create GitHub issue"**
```bash
# Check repository access
gh repo view

# Ensure you're in a git repo
git remote -v

# Check permissions
gh auth status
```

**Issue: "Agent execution stuck"**
```bash
# Check progress
/pm:issue-status 145

# If truly stuck, interrupt and resume
# Ctrl+C
/pm:task-execute 145 --resume
```

### Getting Help

**1. Validate system**
```bash
/pm:validate
# Shows any configuration issues
```

**2. Check documentation**
```bash
# Command reference
cat COMMANDS.md | grep "command-name"

# This guide
cat GUIDE.md | grep "topic"

# Quick help
/pm:help
```

**3. Search for similar issues**
```bash
/pm:search "keyword"
# Find past similar tasks
```

**4. Start fresh**
```bash
# If really stuck, start new task
/pm:task-auto "task" --execute
```

---

## Real-World Examples

### Example 1: Bug Fix

**Scenario:** Login button doesn't work on mobile

```bash
# Quick fix
/pm:task-auto "Fix login button not working on mobile" --execute
```

**Time:** 8 minutes
**Result:** Fixed, tested, committed

---

### Example 2: New Feature

**Scenario:** Add user profile page

```bash
# Step-by-step approach
/pm:task-explore "Add user profile page with avatar, bio, and settings"

# Review exploration - looks good

/pm:task-plan 20250118-abc123

# Review plan - need to add email field
# Edit .claude/tasks/20250118-abc123/plan.md
# Add: "- Add email display field"

/pm:task-create 20250118-abc123

# Creates issue #145

/pm:task-execute 145
```

**Time:** 35 minutes total
**Result:** Complete feature with tests

---

### Example 3: Refactoring

**Scenario:** Refactor authentication system

```bash
# Deep exploration for safety
/pm:task-explore "Refactor authentication system to use JWT" --depth deep

# Takes 10 min - thorough analysis

# Review exploration carefully
cat .claude/tasks/20250118-xyz789/exploration.md

# Generate plan
/pm:task-plan 20250118-xyz789

# Review plan - AI identified 3 parallel streams
cat .claude/tasks/20250118-xyz789/plan.md

# Dry run first
/pm:task-create 20250118-xyz789  # Creates #146
/pm:task-execute 146 --dry-run

# Looks good, execute for real
/pm:task-execute 146
```

**Time:** 2 hours total
**Result:** Safe refactoring with parallel execution

---

### Example 4: Sprint Planning

**Scenario:** Plan and execute 5 tasks for sprint

```bash
# Create all tasks
/pm:task-auto "Add dark mode" --depth light
/pm:task-auto "User settings page"
/pm:task-auto "Email notifications"
/pm:task-auto "Profile avatars"
/pm:task-auto "Search functionality"

# Check what's ready
/pm:next

# Execute high priority
/pm:task-execute 145 --execute  # Dark mode
/pm:task-execute 147 --execute  # Settings

# Check progress
/pm:status

# Daily updates
/pm:standup
```

**Sprint velocity:** 5 tasks in 3 days

---

## Next Steps

### You've Learned:
- ✅ Installation and setup
- ✅ Basic workflow
- ✅ Advanced features
- ✅ Team collaboration
- ✅ Best practices
- ✅ Troubleshooting

### Try These:
1. **Your first automated task**
   ```bash
   /pm:task-auto "Add a feature you need" --execute
   ```

2. **Explore your project**
   ```bash
   /pm:status
   /pm:next
   ```

3. **Set up team workflow**
   ```bash
   /pm:sync
   ```

### Reference Documentation:
- **Commands:** [COMMANDS.md](./COMMANDS.md) - All 25 commands
- **FAQ:** [FAQ.md](./FAQ.md) - Common questions
- **Quick Start:** [README.md](./README.md) - Overview

### Get More Help:
```bash
/pm:help              # Quick reference
/pm:validate          # Check system
/pm:search "topic"    # Search tasks
```

---

**Happy building! 🚀**

Start your first task: `/pm:task-auto "your task description" --execute`
