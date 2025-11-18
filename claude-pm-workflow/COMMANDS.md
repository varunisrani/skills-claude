# Commands Reference

Complete documentation for all 25 PM workflow commands.

## Table of Contents

1. [Core Workflow Commands](#core-workflow-commands) (5 commands)
2. [Issue Management Commands](#issue-management-commands) (8 commands)
3. [Workflow Helper Commands](#workflow-helper-commands) (5 commands)
4. [Sync Commands](#sync-commands) (2 commands)
5. [Maintenance Commands](#maintenance-commands) (3 commands)
6. [Setup Commands](#setup-commands) (2 commands)

---

## Core Workflow Commands

### `/pm:task-auto`

**Full workflow automation - from exploration to execution in one command.**

**Syntax:**
```bash
/pm:task-auto "<task_description>" [--depth <level>] [--execute]
```

**Parameters:**
- `<task_description>` - Natural language description of what you want to build
- `--depth <level>` - (Optional) Exploration depth: `light`, `medium`, `deep` (default: medium)
- `--execute` - (Optional) Auto-execute after creating issue (default: false)

**What it does:**
1. Spawns exploration agent → Analyzes codebase
2. Spawns planning agent → Creates execution plan
3. Spawns issue creation agent → Creates GitHub issue
4. (If --execute) Spawns execution agent → Implements the task

**Time:** 4-8 minutes (without execute), 15-40 minutes (with execute)

**Examples:**
```bash
# Create issue only (review before executing)
/pm:task-auto "Add dark mode toggle"

# Full automation with execution
/pm:task-auto "Add dark mode toggle" --execute

# Deep exploration for complex tasks
/pm:task-auto "Refactor authentication" --depth deep

# Complete automation with deep exploration
/pm:task-auto "Implement OAuth2" --depth deep --execute
```

**Output:**
- Task ID
- GitHub issue number
- Exploration summary (confidence, complexity, files)
- Plan summary (steps, parallel streams)
- Execution progress (if --execute used)

**When to use:**
- ✅ Quick feature additions
- ✅ Bug fixes
- ✅ Refactoring tasks
- ✅ When you want AI to handle everything

---

### `/pm:task-explore`

**Deep code exploration before planning.**

**Syntax:**
```bash
/pm:task-explore "<task_description>" [--depth <level>]
```

**Parameters:**
- `<task_description>` - What you want to build
- `--depth <level>` - (Optional) `light` (2-3 min), `medium` (4-6 min), `deep` (8-12 min)

**What it does:**
1. Analyzes your codebase
2. Identifies affected files and dependencies
3. Assesses complexity and effort
4. Creates exploration report

**Time:** 2-12 minutes (depending on depth)

**Examples:**
```bash
# Quick exploration
/pm:task-explore "Add logout button" --depth light

# Standard exploration (recommended)
/pm:task-explore "Add user profile page"

# Deep exploration for complex features
/pm:task-explore "Refactor database layer" --depth deep
```

**Output:**
```
Task ID: 20250118-abc123
Confidence: high
Complexity: medium
Estimated Hours: 4
Files Analyzed: 15
Parallel Potential: high

Exploration saved to: .claude/tasks/20250118-abc123/exploration.md
```

**Creates:**
- `.claude/tasks/<task-id>/` directory
- `exploration.md` - Full exploration report
- `task.md` - Task metadata

**When to use:**
- ✅ First step of manual workflow
- ✅ When you want to review exploration before planning
- ✅ For understanding unfamiliar code areas

---

### `/pm:task-plan`

**Generate detailed execution plan from exploration.**

**Syntax:**
```bash
/pm:task-plan <task-id>
```

**Parameters:**
- `<task-id>` - Task ID from task-explore (format: YYYYMMDD-XXXXXX)

**What it does:**
1. Reads exploration results
2. Generates detailed execution steps
3. Identifies parallel work streams
4. Creates acceptance criteria
5. Defines testing strategy

**Time:** 1-3 minutes

**Examples:**
```bash
# After exploration
/pm:task-plan 20250118-abc123
```

**Output:**
```
Plan created for task: 20250118-abc123
Steps: 8
Parallel Streams: 2
Estimated Hours: 4.5
Acceptance Criteria: 5

Plan saved to: .claude/tasks/20250118-abc123/plan.md
```

**Creates:**
- `plan.md` - Complete execution plan with:
  - Detailed steps
  - File modifications
  - Parallel work streams
  - Acceptance criteria
  - Testing strategy

**When to use:**
- ✅ After task-explore
- ✅ Before creating GitHub issue
- ✅ To review implementation approach

---

### `/pm:task-create`

**Create GitHub issue from task plan.**

**Syntax:**
```bash
/pm:task-create <task-id>
```

**Parameters:**
- `<task-id>` - Task ID with completed plan

**What it does:**
1. Validates plan exists
2. Creates GitHub issue with complete plan
3. Adds labels: "task", "automated"
4. Renames directory from task-id to issue-number
5. Updates task metadata

**Time:** 30 seconds

**Examples:**
```bash
# After planning
/pm:task-create 20250118-abc123
```

**Output:**
```
GitHub Issue Created!
Issue Number: #145
Title: Add dark mode toggle
URL: https://github.com/user/repo/issues/145
Labels: task, automated

Directory renamed:
.claude/tasks/20250118-abc123 → .claude/tasks/145
```

**Creates:**
- GitHub issue with full plan in body
- Updates task.md with GitHub info

**When to use:**
- ✅ After reviewing and approving plan
- ✅ Before execution
- ✅ To track work on GitHub

---

### `/pm:task-execute`

**Execute task plan with parallel agents.**

**Syntax:**
```bash
/pm:task-execute <issue-number> [--dry-run] [--resume]
```

**Parameters:**
- `<issue-number>` - GitHub issue number
- `--dry-run` - (Optional) Show what would be done without executing
- `--resume` - (Optional) Resume interrupted execution

**What it does:**
1. Creates feature branch: `issue-<number>`
2. Spawns parallel agents for independent work streams
3. Coordinates agent execution
4. Tracks progress in real-time
5. Runs tests
6. Commits changes

**Time:** 10-60 minutes (depends on complexity)

**Examples:**
```bash
# Execute task
/pm:task-execute 145

# See what would happen (no changes)
/pm:task-execute 145 --dry-run

# Resume interrupted execution
/pm:task-execute 145 --resume
```

**Output:**
```
Execution Started
Issue: #145
Branch: issue-145

Work Streams:
  Stream A: Components (in_progress)
  Stream B: Styling (in_progress)

Progress: 45%
Commits: 3
Tests: Passing

Progress file: .claude/tasks/145/progress.md
```

**Creates:**
- `progress.md` - Real-time execution progress
- `updates/stream-A.md` - Per-stream updates (if parallel)
- Git commits on feature branch

**When to use:**
- ✅ After creating GitHub issue
- ✅ When ready to implement
- ✅ For automatic parallel execution

---

## Issue Management Commands

### `/pm:issue-show`

**Display issue details and progress.**

**Syntax:**
```bash
/pm:issue-show <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Shows issue title, status, labels
- Displays task metadata
- Shows execution progress if started
- Lists files modified

**Examples:**
```bash
/pm:issue-show 145
```

**Output:**
```
Issue #145: Add dark mode toggle
Status: in_progress
Labels: task, automated
Branch: issue-145

Progress: 65%
Streams: 2/2 completed
Commits: 5
Tests: Passing

Files Modified:
- src/components/ThemeToggle.tsx
- src/utils/theme.ts
- src/styles/globals.css
```

**When to use:**
- ✅ Check task status
- ✅ Review progress
- ✅ See what's been modified

---

### `/pm:issue-status`

**Quick status check for issue.**

**Syntax:**
```bash
/pm:issue-status <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Quick status overview
- Completion percentage
- Current blockers
- Next steps

**Examples:**
```bash
/pm:issue-status 145
```

**Output:**
```
Issue #145
Status: in_progress
Completion: 65%
Blockers: None
Next: Integration testing
```

**When to use:**
- ✅ Quick status check
- ✅ During standup
- ✅ Check multiple issues quickly

---

### `/pm:issue-start`

**Begin work on existing issue.**

**Syntax:**
```bash
/pm:issue-start <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Validates issue exists
- Creates feature branch
- Initializes progress tracking
- Spawns specialized agent

**Examples:**
```bash
/pm:issue-start 145
```

**When to use:**
- ✅ Start work on imported issue
- ✅ Resume work on existing issue
- ✅ Manual task execution

---

### `/pm:issue-sync`

**Sync progress to GitHub issue.**

**Syntax:**
```bash
/pm:issue-sync <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Reads local progress
- Posts update comment to GitHub
- Syncs status, completion %
- Updates labels if needed

**Examples:**
```bash
/pm:issue-sync 145
```

**Output:**
```
Synced to GitHub: #145
Comment posted with progress update
Completion: 65%
Last sync: 2025-11-18 07:30:00
```

**When to use:**
- ✅ Share progress with team
- ✅ After major milestones
- ✅ Auto-syncs every 30 min during execution

---

### `/pm:issue-close`

**Mark issue as complete.**

**Syntax:**
```bash
/pm:issue-close <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Validates all acceptance criteria met
- Runs final tests
- Posts completion summary to GitHub
- Closes GitHub issue
- Updates local task status

**Examples:**
```bash
/pm:issue-close 145
```

**Output:**
```
Issue #145 Closed!

Summary:
- Commits: 8
- Files Modified: 12
- Tests: All passing
- Completion: 100%

GitHub issue closed with summary comment.
```

**When to use:**
- ✅ After task completion
- ✅ All tests passing
- ✅ Work merged to main

---

### `/pm:issue-reopen`

**Reopen closed issue.**

**Syntax:**
```bash
/pm:issue-reopen <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Reopens GitHub issue
- Restores local task status
- Allows resuming work

**Examples:**
```bash
/pm:issue-reopen 145
```

**When to use:**
- ✅ Found bugs after closing
- ✅ Need to make changes
- ✅ Accidentally closed

---

### `/pm:issue-edit`

**Edit issue details.**

**Syntax:**
```bash
/pm:issue-edit <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Opens interactive editor
- Update title, description
- Modify labels, assignees
- Update estimates

**Examples:**
```bash
/pm:issue-edit 145
```

**When to use:**
- ✅ Fix typos
- ✅ Update requirements
- ✅ Adjust estimates

---

### `/pm:issue-analyze`

**Analyze issue for parallel work streams.**

**Syntax:**
```bash
/pm:issue-analyze <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number

**What it does:**
- Analyzes task complexity
- Identifies parallelization opportunities
- Suggests work stream breakdown
- Estimates time savings

**Examples:**
```bash
/pm:issue-analyze 145
```

**Output:**
```
Analysis for #145

Current Approach: Sequential (estimated 8 hours)

Parallel Potential: HIGH
Suggested Streams: 3

Stream A: Frontend Components (3h)
Stream B: Backend API (3h)
Stream C: Tests (2h)

Parallel Execution: ~3 hours (62% faster)
```

**When to use:**
- ✅ Large complex tasks
- ✅ Before execution
- ✅ Optimize execution time

---

## Workflow Helper Commands

### `/pm:next`

**Show next priority tasks.**

**Syntax:**
```bash
/pm:next
```

**What it does:**
- Lists available tasks
- Shows priorities
- Filters by dependencies
- Suggests what to work on next

**Examples:**
```bash
/pm:next
```

**Output:**
```
Next Priority Tasks:

1. Issue #145 - Add dark mode (Ready)
   Priority: High
   Estimated: 4h

2. Issue #146 - Fix login bug (Ready)
   Priority: Critical
   Estimated: 2h

3. Issue #147 - User profiles (Blocked)
   Blocked by: #145
```

**When to use:**
- ✅ Start of day
- ✅ After completing task
- ✅ Finding available work

---

### `/pm:status`

**Overall project dashboard.**

**Syntax:**
```bash
/pm:status
```

**What it does:**
- Shows all tasks
- Progress overview
- Completion statistics
- Blocked tasks
- Recently completed

**Examples:**
```bash
/pm:status
```

**Output:**
```
Project Dashboard

Total Tasks: 15
Completed: 8 (53%)
In Progress: 3 (20%)
Blocked: 1 (7%)
Todo: 3 (20%)

In Progress:
- #145: Add dark mode (65%)
- #148: API refactor (30%)
- #149: Tests (90%)

Blocked:
- #147: Waiting on #145

Recently Completed:
- #144: Fix navbar (2 days ago)
- #143: Update deps (3 days ago)
```

**When to use:**
- ✅ Daily standup
- ✅ Project overview
- ✅ Progress reporting

---

### `/pm:standup`

**Daily standup report.**

**Syntax:**
```bash
/pm:standup
```

**What it does:**
- Yesterday's completed work
- Today's planned work
- Current blockers
- Progress metrics

**Examples:**
```bash
/pm:standup
```

**Output:**
```
Daily Standup - Nov 18, 2025

Yesterday:
✅ #144: Fix navbar bug (completed)
✅ #143: Update dependencies (completed)

Today:
🔄 #145: Add dark mode (65% done)
🔄 #148: API refactor (30% done)
📋 #149: Write tests (starting)

Blockers:
⚠️  #147: Waiting on #145 completion

Velocity:
- This week: 5 tasks completed
- Average: 2.5 tasks/day
```

**When to use:**
- ✅ Daily standup meetings
- ✅ Progress reports
- ✅ Team updates

---

### `/pm:blocked`

**Show blocked tasks.**

**Syntax:**
```bash
/pm:blocked
```

**What it does:**
- Lists all blocked tasks
- Shows blocking dependencies
- Suggests unblocking actions

**Examples:**
```bash
/pm:blocked
```

**Output:**
```
Blocked Tasks:

#147: User profiles
Blocked by: #145 (Add dark mode)
Action: Complete #145 first

#150: Payment integration
Blocked by: External API access
Action: Request API keys from DevOps
```

**When to use:**
- ✅ Remove bottlenecks
- ✅ Planning priorities
- ✅ Team coordination

---

### `/pm:in-progress`

**List work in progress.**

**Syntax:**
```bash
/pm:in-progress
```

**What it does:**
- Shows all active tasks
- Current progress
- Time estimates
- Who's working on what

**Examples:**
```bash
/pm:in-progress
```

**Output:**
```
Work In Progress:

#145: Add dark mode
Progress: 65%
Estimated Remaining: 1.5h
Branch: issue-145

#148: API refactor
Progress: 30%
Estimated Remaining: 5h
Branch: issue-148

Total WIP: 2 tasks
```

**When to use:**
- ✅ Check active work
- ✅ Avoid too much WIP
- ✅ Focus on completion

---

## Sync Commands

### `/pm:sync`

**Full bidirectional sync with GitHub.**

**Syntax:**
```bash
/pm:sync
```

**What it does:**
- Syncs local tasks to GitHub
- Pulls GitHub updates
- Reconciles conflicts
- Updates all statuses

**Examples:**
```bash
/pm:sync
```

**Output:**
```
Syncing with GitHub...

Pushed to GitHub:
- #145: Progress update
- #148: Status change

Pulled from GitHub:
- #146: New comments
- #147: Label updated

Sync complete!
```

**When to use:**
- ✅ Team collaboration
- ✅ After offline work
- ✅ Before major changes

---

### `/pm:import`

**Import existing GitHub issue.**

**Syntax:**
```bash
/pm:import <issue-number>
```

**Parameters:**
- `<issue-number>` - GitHub issue number to import

**What it does:**
- Fetches issue from GitHub
- Creates local task structure
- Imports description, labels
- Ready for execution

**Examples:**
```bash
/pm:import 145
```

**Output:**
```
Imported Issue #145

Title: Add dark mode toggle
Labels: enhancement, frontend
Description imported.

Local task created: .claude/tasks/145/

Ready to execute: /pm:task-execute 145
```

**When to use:**
- ✅ Work on existing issues
- ✅ Import team issues
- ✅ Manual task creation

---

## Maintenance Commands

### `/pm:validate`

**Check system integrity.**

**Syntax:**
```bash
/pm:validate
```

**What it does:**
- Validates task directory structure
- Checks GitHub connectivity
- Verifies git configuration
- Identifies issues

**Examples:**
```bash
/pm:validate
```

**Output:**
```
System Validation

✅ Task directory structure: OK
✅ GitHub CLI authenticated: OK
✅ Git configuration: OK
✅ Repository connection: OK
⚠️  Warning: 3 tasks missing progress files

All critical checks passed!
```

**When to use:**
- ✅ After setup
- ✅ Troubleshooting issues
- ✅ Before major operations

---

### `/pm:clean`

**Archive completed work.**

**Syntax:**
```bash
/pm:clean
```

**What it does:**
- Finds completed tasks
- Moves to .archived/ directory
- Generates cleanup report
- Frees up space

**Examples:**
```bash
/pm:clean
```

**Output:**
```
Cleaning up completed tasks...

Archived:
- #142: Fix bug (completed 10 days ago)
- #143: Update deps (completed 7 days ago)
- #144: Navbar fix (completed 5 days ago)

Total archived: 3 tasks
Space saved: 15 MB

Active tasks: 12
```

**When to use:**
- ✅ Keep workspace clean
- ✅ Improve performance
- ✅ End of sprint

---

### `/pm:search`

**Search across all content.**

**Syntax:**
```bash
/pm:search <query>
```

**Parameters:**
- `<query>` - Search term

**What it does:**
- Searches task descriptions
- Searches plans and explorations
- Searches progress notes
- Returns matching tasks

**Examples:**
```bash
/pm:search "authentication"
/pm:search "bug"
/pm:search "refactor"
```

**Output:**
```
Search results for "authentication":

#145: Add OAuth authentication
Match: Task description, plan (Step 3)

#148: Refactor auth system
Match: Exploration report

#150: Fix auth bug
Match: Issue title

Found 3 matching tasks.
```

**When to use:**
- ✅ Find related work
- ✅ Locate past issues
- ✅ Check duplicates

---

## Setup Commands

### `/pm:init`

**Initialize PM system.**

**Syntax:**
```bash
/pm:init
```

**What it does:**
- Checks prerequisites
- Validates GitHub CLI
- Creates directory structure
- Configures settings

**Examples:**
```bash
/pm:init
```

**Output:**
```
Initializing PM System...

✅ GitHub CLI: Installed
✅ Git: Configured
✅ Repository: Connected

Creating directories:
✅ .claude/tasks/
✅ .claude/commands/pm/
✅ .claude/scripts/pm/

Configuration saved.

Ready to use! Try: /pm:help
```

**When to use:**
- ✅ First time setup
- ✅ New project
- ✅ After copying .claude folder

---

### `/pm:help`

**Show all commands.**

**Syntax:**
```bash
/pm:help
```

**What it does:**
- Lists all 25 commands
- Shows quick examples
- Displays workflow tips

**Examples:**
```bash
/pm:help
```

**When to use:**
- ✅ Learn available commands
- ✅ Quick reference
- ✅ Find command syntax

---

## Command Cheat Sheet

### Quick Workflow
```bash
# One-command automation
/pm:task-auto "task" --execute

# Step-by-step
/pm:task-explore "task"
/pm:task-plan <task-id>
/pm:task-create <task-id>
/pm:task-execute <issue#>
```

### Common Operations
```bash
/pm:status              # Dashboard
/pm:next                # Next tasks
/pm:issue-show 145      # View issue
/pm:issue-close 145     # Complete task
/pm:sync                # Sync with GitHub
```

### Maintenance
```bash
/pm:validate            # Check system
/pm:clean               # Archive old tasks
/pm:search "query"      # Find tasks
```

---

**For detailed usage guide, see [GUIDE.md](./GUIDE.md)**
**For quick start, see [README.md](./README.md)**
