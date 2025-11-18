# Frequently Asked Questions (FAQ)

Common questions and answers about the Claude PM Workflow.

## Table of Contents

1. [General Questions](#general-questions)
2. [Setup and Configuration](#setup-and-configuration)
3. [Workflow Questions](#workflow-questions)
4. [GitHub Integration](#github-integration)
5. [Execution and Performance](#execution-and-performance)
6. [Troubleshooting](#troubleshooting)
7. [Team and Collaboration](#team-and-collaboration)

---

## General Questions

### What is Claude PM Workflow?

A simplified project management system for Claude Code that automates task exploration, planning, and execution with GitHub integration.

**Key features:**
- AI-powered code exploration
- Automatic execution planning
- GitHub issue integration
- Parallel agent execution
- Progress tracking

### How is this different from traditional project management?

**Traditional PM:**
```
Write requirements (30 min)
Create project plan (60 min)
Break into tasks (45 min)
Assign tasks (15 min)
───────────────
Setup: 150 minutes
Then: Manual implementation
```

**Claude PM:**
```
/pm:task-auto "feature" --execute
───────────────
Setup + Implementation: 15-40 minutes
```

### Do I need to know how to code?

No! The AI handles code exploration and implementation. You just need to:
- Describe what you want
- Review AI's plans
- Approve execution

### What projects does this work with?

**Works with any:**
- Git-based project
- GitHub repository
- Programming language (JavaScript, Python, Ruby, etc.)
- Framework (React, Next.js, Django, Rails, etc.)

### Is this free to use?

Yes! The workflow system is free. You only need:
- GitHub account (free)
- Claude Code subscription (for AI features)
- Git (free)

---

## Setup and Configuration

### How do I install this?

**Quick setup (3 steps):**
```bash
# 1. Copy .claude folder to your project
cp -r "path/to/claude-pm-workflow/.claude" "your-project/"

# 2. Install GitHub CLI and authenticate
gh auth login

# 3. Initialize
/pm:init
```

See [GUIDE.md - Getting Started](./GUIDE.md#getting-started) for details.

### What are the prerequisites?

**Required:**
- Git
- GitHub CLI (`gh`)
- GitHub account
- Claude Code

**Optional:**
- Node.js (if using npm projects)
- Python (if using Python projects)
- Project-specific tools

### Do I need to configure anything?

**Minimal configuration needed:**

`.claude/ccpm.config`:
```bash
GITHUB_REPO="owner/repo-name"      # Your repo
GITHUB_BASE_BRANCH="main"          # Main branch
MAX_PARALLEL_AGENTS=5              # Parallel limit
```

Most settings have sensible defaults.

### Can I use this with an existing project?

**Yes! Just copy .claude folder:**
```bash
cd existing-project
cp -r "path/to/claude-pm-workflow/.claude" .
/pm:init
```

Works with existing code, existing issues, existing workflow.

### How do I update to the latest version?

```bash
# Backup your tasks
cp -r .claude/tasks .claude/tasks.backup

# Copy new .claude folder
cp -r "path/to/new-version/.claude" .

# Restore your tasks
cp -r .claude/tasks.backup/* .claude/tasks/

# Clean up
rm -rf .claude/tasks.backup
```

---

## Workflow Questions

### When should I use `/pm:task-auto` vs step-by-step?

**Use `/pm:task-auto`** when:
- ✅ Quick fixes or simple features
- ✅ You trust AI's judgment
- ✅ You want speed
- ✅ Familiar codebase area

**Use step-by-step** when:
- ✅ Complex refactoring
- ✅ Critical features
- ✅ Need to review plans carefully
- ✅ Unfamiliar code area
- ✅ Learning the system

### What's the difference between exploration depths?

**Light (2-3 min):**
- Surface-level analysis
- Good for: UI changes, styling, simple fixes
- Example: "Change button color to blue"

**Medium (4-6 min) - Default:**
- Balanced analysis
- Good for: Most features, moderate complexity
- Example: "Add user profile page"

**Deep (8-12 min):**
- Comprehensive analysis
- Good for: Refactoring, complex features, critical code
- Example: "Refactor authentication system"

### Can I edit the plan before execution?

**Yes!**
```bash
# Generate plan
/pm:task-plan <task-id>

# Edit the plan
nano .claude/tasks/<task-id>/plan.md
# or use your favorite editor

# Then create issue and execute
/pm:task-create <task-id>
/pm:task-execute <issue-number>
```

### What if I don't like the exploration results?

**Options:**
1. **Try deeper exploration:**
   ```bash
   /pm:task-explore "task" --depth deep
   ```

2. **Be more specific in description:**
   ```bash
   # ❌ Vague
   /pm:task-explore "add login"

   # ✅ Specific
   /pm:task-explore "add email/password login form to /auth/login page with validation"
   ```

3. **Start over:**
   ```bash
   # Delete and retry
   rm -rf .claude/tasks/<task-id>
   /pm:task-explore "better description"
   ```

### How do I handle dependencies between tasks?

**Option 1: Note dependencies in task description**
```bash
/pm:task-auto "Add user dashboard (requires #145 auth system)"
```

**Option 2: Check blockers**
```bash
/pm:blocked
# Shows what's blocking what
```

**Option 3: Use task ordering**
```bash
# Complete prerequisite first
/pm:task-execute 145  # Auth system
# Then dependent task
/pm:task-execute 147  # Dashboard
```

---

## GitHub Integration

### Do I need a GitHub repository?

**Yes**, for full functionality. But you can:
- Use private repos (free on GitHub)
- Use organization repos
- Use forks

**Without GitHub:**
- Exploration and planning still work
- Execution works
- Just no GitHub issue creation/sync

### Can I use GitLab or Bitbucket instead?

**Not currently.** The system uses GitHub CLI (`gh`) which is GitHub-specific.

**Workaround:**
- Use GitHub for PM tracking
- Mirror to GitLab/Bitbucket for code hosting

### How are GitHub issues created?

**Automatically:**
```bash
/pm:task-create <task-id>
```

**Creates:**
- Issue title from task description
- Complete plan in issue body
- Labels: "task", "automated"
- Links to local task directory

### Can I customize issue labels?

**Edit** `.claude/commands/pm/task-create.md`:
```bash
# Change from
--label "task" --label "automated"

# To
--label "feature" --label "ai-generated"
```

### What if I already have GitHub issues?

**Import them:**
```bash
/pm:import <issue-number>
```

**This:**
- Creates local task structure
- Imports issue details
- Ready for execution

### How often does it sync to GitHub?

**Automatically:**
- Every 30 minutes during execution
- After major milestones
- On completion

**Manually:**
```bash
/pm:issue-sync <issue-number>
```

---

## Execution and Performance

### How fast is task execution?

**Depends on complexity:**

| Task Type | Time |
|-----------|------|
| Bug fix | 5-15 min |
| Simple feature | 15-30 min |
| Medium feature | 30-60 min |
| Complex feature | 1-3 hours |
| Refactoring | 2-6 hours |

### What is parallel execution?

**AI splits work into independent streams:**

**Example:**
```
Task: Add user dashboard

Without parallel (sequential):
  UI components: 3 hours
  API endpoints: 3 hours
  Tests: 2 hours
  ────────────────
  Total: 8 hours

With parallel (3 agents):
  Stream A: UI (3h)     ┐
  Stream B: API (3h)    ├─ Run simultaneously
  Stream C: Tests (2h)  ┘
  ────────────────
  Total: ~3 hours (62% faster!)
```

### How many parallel agents can run?

**Default: 5 agents max**

Configure in `.claude/ccpm.config`:
```bash
MAX_PARALLEL_AGENTS=5
```

**Considerations:**
- More agents = faster but more resource-intensive
- Quality over speed
- 3-5 agents is optimal for most tasks

### What if execution fails?

**AI will:**
1. Save progress
2. Show error details
3. Offer to retry

**You can:**
```bash
# Resume from where it stopped
/pm:task-execute <issue> --resume

# Or start fresh
git checkout main
git branch -D issue-<number>
/pm:task-execute <issue>
```

### Does it run tests automatically?

**Yes!**
- Runs tests after each major step
- Stops on test failures
- Shows test output
- Won't close issue if tests fail

**Supported test frameworks:**
- npm test (Jest, Vitest, etc.)
- pytest (Python)
- rspec (Ruby)
- cargo test (Rust)
- go test (Go)
- Auto-detected based on project

### Can I stop execution midway?

**Yes:**
```bash
# Press Ctrl+C to stop

# Resume later
/pm:task-execute <issue> --resume
```

Progress is saved, safe to resume.

---

## Troubleshooting

### "GitHub CLI not authenticated" error

**Fix:**
```bash
# Check status
gh auth status

# Re-authenticate
gh auth login

# Follow prompts:
# - Select GitHub.com
# - Select HTTPS
# - Authenticate in browser

# Verify
gh auth status
```

### "Working directory not clean" error

**Fix:**
```bash
# Check status
git status

# Option 1: Stash
git stash

# Option 2: Commit
git commit -am "WIP"

# Then retry
/pm:task-auto "your task"
```

### "Task not found" error

**Common cause:** Mixing task IDs and issue numbers

```bash
# Task ID format: 20250118-abc123 (before GitHub)
/pm:task-plan 20250118-abc123  ✅

# Issue number: 145 (after GitHub)
/pm:task-execute 145  ✅

# Wrong:
/pm:task-execute 20250118-abc123  ❌
/pm:task-plan 145  ❌
```

**List all tasks:**
```bash
ls .claude/tasks/
```

### Tests failing during execution

**AI stops on test failures:**

```bash
# Check error
cat .claude/tasks/<issue>/progress.md

# Fix manually if needed
# Then resume
/pm:task-execute <issue> --resume
```

### "Permission denied" errors

**GitHub permissions:**
```bash
# Check repo access
gh repo view

# Check permissions
gh auth status
```

**File permissions:**
```bash
# Make scripts executable
chmod +x .claude/scripts/pm/*.sh
```

### Agent seems stuck

**Check progress:**
```bash
/pm:issue-status <issue>
```

**If truly stuck:**
```bash
# Interrupt
Ctrl+C

# Resume
/pm:task-execute <issue> --resume
```

### Can't create GitHub issue

**Checklist:**
- ✅ GitHub CLI authenticated: `gh auth status`
- ✅ In git repository: `git remote -v`
- ✅ Repository exists on GitHub
- ✅ Have write permissions
- ✅ Plan file exists: `ls .claude/tasks/<task-id>/plan.md`

---

## Team and Collaboration

### Can multiple people use this?

**Yes!** Great for teams.

**Each team member:**
1. Copies .claude folder to their local project
2. Authenticates with GitHub
3. Imports or creates tasks
4. Syncs progress

**Shared:**
- GitHub issues (everyone sees progress)
- Repository code
- Task tracking

**Local:**
- .claude/tasks/ directory
- Execution agents

### How do team members see my progress?

**Automatic:**
- Progress synced to GitHub every 30 min
- Comments posted to issues
- Status updates visible

**Manual:**
```bash
/pm:issue-sync <issue>
```

**Team sees:**
- Completion percentage
- What's done
- What's in progress
- Blockers

### Can we work on the same task simultaneously?

**Not recommended** for the same GitHub issue.

**Better:**
- Break into separate issues
- Or use parallel streams (AI handles this)

**If needed:**
- Use git branches
- Coordinate manually
- Merge later

### How do we handle code reviews?

**Workflow:**
```bash
# 1. Execute task
/pm:task-execute 145

# 2. Create PR
gh pr create --fill

# 3. Team reviews PR on GitHub
# 4. Merge after approval

# 5. Close issue
/pm:issue-close 145
```

### What about sprint planning?

**Lead creates tasks:**
```bash
for task in "Feature A" "Feature B" "Feature C"; do
  /pm:task-explore "$task"
  /pm:task-plan <id>
  /pm:task-create <id>
done
```

**Team pulls tasks:**
```bash
# See available work
/pm:next

# Import and execute
/pm:import 145
/pm:task-execute 145
```

**Track progress:**
```bash
/pm:status    # Overall dashboard
/pm:standup   # Daily updates
```

---

## More Questions?

### Not finding your answer?

1. **Check documentation:**
   - [README.md](./README.md) - Quick start
   - [GUIDE.md](./GUIDE.md) - Complete guide
   - [COMMANDS.md](./COMMANDS.md) - All commands

2. **Search past issues:**
   ```bash
   /pm:search "your question"
   ```

3. **Validate system:**
   ```bash
   /pm:validate
   ```

4. **Check GitHub issues:**
   - Look for similar problems
   - Create new issue if needed

### Quick command reference

```bash
# Help
/pm:help

# Validate system
/pm:validate

# Create task
/pm:task-auto "task" --execute

# Check status
/pm:status

# Search
/pm:search "keyword"
```

---

**Still stuck? Create a GitHub issue with:**
- What you tried
- Error messages
- Output of `/pm:validate`
- Your workflow steps

We're here to help! 🚀
