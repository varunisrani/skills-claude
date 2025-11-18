---
description: Fully automated task execution - from exploration to completion
allowed_tools:
  - Task
  - Bash
  - Read
  - Write
  - Grep
  - Glob
  - TodoWrite
  - AskUserQuestion
---

# task-auto: Fully Automated Task Workflow

Execute complete task from exploration to GitHub issue creation in one command.

## Usage

```bash
/pm:task-auto "<task_description>" [--depth <level>] [--execute]
```

## Parameters

- `<task_description>` - Natural language description of the task
- `--depth` (optional) - Exploration depth: `light|medium|deep` (default: medium)
- `--execute` (optional) - Auto-execute after issue creation (default: false)

## What This Command Does

Fully automates the simplified workflow by spawning **4 sub-agents** sequentially:

1. **Sub-agent 1**: Deep code exploration (`/pm:task-explore`)
2. **Sub-agent 2**: Generate execution plan (`/pm:task-plan`)
3. **Sub-agent 3**: Create GitHub issue (`/pm:task-create`)
4. **Sub-agent 4** (optional): Execute the task (`/pm:task-execute`)

**Total: 1 command → Complete task ready for execution!**

## Your Task - The Auto Orchestrator

You are the **Auto Orchestrator**. Follow this workflow:

### STEP 1: Initialize

Parse the user's input:

```javascript
// Extract task description
const task_description = extractFromCommand(user_input);

// Extract options
const depth = parseOption('--depth') || 'medium';
const auto_execute = hasFlag('--execute');

// Display what we're doing
console.log(`
🚀 Task Auto-Execute Starting

Task: ${task_description}
Exploration Depth: ${depth}
Auto-Execute: ${auto_execute ? 'Yes' : 'No (create issue only)'}
`);
```

### STEP 2: Create Master Todo List

Use TodoWrite to track all 4 steps:

```json
[
  {
    "content": "Explore codebase for task",
    "activeForm": "Exploring codebase for task",
    "status": "pending"
  },
  {
    "content": "Generate execution plan",
    "activeForm": "Generating execution plan",
    "status": "pending"
  },
  {
    "content": "Create GitHub issue",
    "activeForm": "Creating GitHub issue",
    "status": "pending"
  },
  {
    "content": "Execute task with agents",
    "activeForm": "Executing task with agents",
    "status": "pending"
  }
]
```

---

## 📋 TODO 1: Explore Codebase

**Update todo:** Mark "Explore codebase for task" as `in_progress`

**Spawn Sub-Agent:**

Use Task tool:
```
subagent_type: "general-purpose"
description: "Explore codebase"
prompt: "Execute /pm:task-explore for this task.

Task Description: ${task_description}
Exploration Depth: ${depth}

Your job:
1. Use SlashCommand tool to run: /pm:task-explore \"${task_description}\" --depth ${depth}
2. This will:
   - Analyze the codebase deeply
   - Identify affected files and components
   - Assess complexity and effort
   - Create exploration report
3. Wait for exploration to complete
4. Extract the task ID generated

Return format:
- **Task ID:** <task-id>
- **Description:** ${task_description}
- **Confidence:** high|medium|low
- **Complexity:** low|medium|high
- **Estimated Hours:** <number>
- **Files Analyzed:** <count>
- **Parallel Potential:** high|medium|low|none
- **Exploration File:** .claude/tasks/<task-id>/exploration.md
- **Status:** SUCCESS/FAILED"
```

**After agent completes:**
- Extract task_id from agent response
- Store for next steps
- Update todo: Mark as `completed`
- Display: "✓ Exploration complete - Task ID: {task_id}"

---

## 📋 TODO 2: Generate Execution Plan

**Update todo:** Mark "Generate execution plan" as `in_progress`

**Spawn Sub-Agent:**

Use Task tool:
```
subagent_type: "general-purpose"
description: "Generate execution plan"
prompt: "Execute /pm:task-plan to create detailed plan.

Task ID: ${task_id}

Your job:
1. Use SlashCommand tool to run: /pm:task-plan ${task_id}
2. This will:
   - Read the exploration report
   - Generate detailed execution plan
   - Identify parallel work streams
   - Create acceptance criteria
   - Define testing strategy
3. Wait for plan generation to complete

Return format:
- **Task ID:** ${task_id}
- **Plan Status:** created
- **Steps:** <count>
- **Parallel Streams:** <count>
- **Estimated Hours:** <refined-hours>
- **Acceptance Criteria:** <count>
- **Plan File:** .claude/tasks/${task_id}/plan.md
- **Status:** SUCCESS/FAILED"
```

**After agent completes:**
- Verify plan was created
- Extract key metrics (steps, streams, hours)
- Update todo: Mark as `completed`
- Display: "✓ Plan generated - {steps} steps, {streams} parallel streams"

---

## 📋 TODO 3: Create GitHub Issue

**Update todo:** Mark "Create GitHub issue" as `in_progress`

**Spawn Sub-Agent:**

Use Task tool:
```
subagent_type: "general-purpose"
description: "Create GitHub issue"
prompt: "Execute /pm:task-create to create GitHub issue.

Task ID: ${task_id}

Your job:
1. Use SlashCommand tool to run: /pm:task-create ${task_id}
2. This will:
   - Validate prerequisites (gh CLI, auth, etc.)
   - Build comprehensive issue body from plan
   - Create GitHub issue with labels: task, automated
   - Rename task directory: ${task_id} → <issue-number>
   - Update task.md with GitHub URL
3. Wait for issue creation to complete
4. Extract issue number and URL

Return format:
- **Issue Number:** #<number>
- **Issue URL:** <github-url>
- **Title:** ${task_description}
- **Labels:** task, automated
- **Estimated Hours:** <hours>
- **Parallel Streams:** <count>
- **Task Directory:** .claude/tasks/<issue-number>/
- **Status:** SUCCESS/FAILED"
```

**After agent completes:**
- Extract issue_number and github_url from agent response
- Store for execution step (if needed)
- Update todo: Mark as `completed`
- Display: "✓ GitHub issue created - #{issue_number}"

---

## 📋 TODO 4: Execute Task (Optional)

**Only if `--execute` flag is present**

**Update todo:** Mark "Execute task with agents" as `in_progress`

**Spawn Sub-Agent:**

Use Task tool:
```
subagent_type: "general-purpose"
description: "Execute task"
prompt: "Execute /pm:task-execute to implement the task.

Issue Number: ${issue_number}

Your job:
1. Use SlashCommand tool to run: /pm:task-execute ${issue_number}
2. This will:
   - Create feature branch: issue-${issue_number}
   - Spawn parallel agents for work streams
   - Implement changes according to plan
   - Run tests and validations
   - Commit changes with clear messages
   - Track progress in .claude/tasks/${issue_number}/progress.md
3. Monitor execution until complete or report errors

Return format:
- **Issue:** #${issue_number}
- **Branch:** issue-${issue_number}
- **Streams Executed:** <count>
- **Commits Made:** <count>
- **Tests:** PASS/FAIL
- **Completion:** <percentage>%
- **Status:** COMPLETED/IN_PROGRESS/FAILED
- **Next Steps:** <if not complete>"
```

**After agent completes:**
- Check execution status
- Update todo: Mark as `completed`
- Display execution summary

---

## STEP 3: Generate Final Report

When all agents complete, display comprehensive summary:

```
================================
🚀 TASK AUTO-EXECUTE COMPLETE
================================

Task: ${task_description}
Task ID: ${task_id}
GitHub Issue: #${issue_number}

📊 Execution Summary

Phase 1: Exploration
  ✓ Confidence: ${confidence}
  ✓ Complexity: ${complexity}
  ✓ Files analyzed: ${files_count}
  ✓ Estimated effort: ${estimated_hours}h

Phase 2: Planning
  ✓ Steps defined: ${steps_count}
  ✓ Parallel streams: ${streams_count}
  ✓ Acceptance criteria: ${criteria_count}
  ✓ Testing strategy: Defined

Phase 3: GitHub Issue
  ✓ Issue created: #${issue_number}
  ✓ URL: ${github_url}
  ✓ Labels: task, automated
  ✓ Task directory: .claude/tasks/${issue_number}/

${auto_execute ? `
Phase 4: Execution
  ✓ Branch: issue-${issue_number}
  ✓ Streams executed: ${streams_executed}
  ✓ Commits: ${commits_count}
  ✓ Tests: ${test_status}
  ✓ Completion: ${completion_percentage}%
` : `
Phase 4: Execution
  ⏸ Skipped (use --execute flag to auto-execute)
`}

📁 Local Files:
  - Exploration: .claude/tasks/${issue_number}/exploration.md
  - Plan: .claude/tasks/${issue_number}/plan.md
  - Metadata: .claude/tasks/${issue_number}/task.md
  ${auto_execute ? '- Progress: .claude/tasks/${issue_number}/progress.md' : ''}

🔗 GitHub:
  Issue: ${github_url}

${auto_execute ? `
✅ TASK COMPLETE!

Next Steps:
  1. Review changes: git diff main
  2. Run tests: npm test
  3. Close issue: /pm:issue-close ${issue_number}
  4. Create PR: gh pr create
` : `
📋 Next Steps:

  Option 1 - Execute Now:
  └─ /pm:task-execute ${issue_number}

  Option 2 - Execute Later:
  └─ Review plan: .claude/tasks/${issue_number}/plan.md
  └─ Execute when ready: /pm:task-execute ${issue_number}

  Monitor:
  ├─ /pm:issue-status ${issue_number}
  ├─ /pm:issue-sync ${issue_number}
  └─ /pm:issue-close ${issue_number}
`}

Total Time: ${elapsed_time}
================================
```

## Error Handling

### If Any Sub-Agent Fails

1. **Exploration Fails:**
   - Display error from agent
   - Suggest adjustments (different depth, more specific description)
   - Provide manual command: `/pm:task-explore "${task_description}" --depth deep`
   - STOP workflow

2. **Planning Fails:**
   - Display error
   - Exploration is saved, can retry planning
   - Provide manual command: `/pm:task-plan ${task_id}`
   - STOP workflow

3. **Issue Creation Fails:**
   - Check GitHub authentication
   - Verify repository configuration
   - Plan is saved, can retry creation
   - Provide manual command: `/pm:task-create ${task_id}`
   - STOP workflow

4. **Execution Fails (if --execute):**
   - Issue is already created
   - Can retry execution manually
   - Provide recovery commands
   - Don't delete issue

### Recovery

If auto-execute is interrupted:
```bash
# Check current state
ls .claude/tasks/

# Continue manually from last completed step
# If exploration done: /pm:task-plan <task-id>
# If plan done: /pm:task-create <task-id>
# If issue created: /pm:task-execute <issue-number>
```

## Examples

### Example 1: Explore + Plan + Issue (No Execute)

```bash
/pm:task-auto "Add dark mode toggle to settings"
```

**Result:**
- Explores codebase
- Generates plan
- Creates GitHub issue #145
- Stops (waits for manual execution)
- **Time:** ~4-8 minutes

### Example 2: Full Automation (With Execute)

```bash
/pm:task-auto "Add dark mode toggle to settings" --execute
```

**Result:**
- Explores codebase
- Generates plan
- Creates GitHub issue #145
- Automatically executes with parallel agents
- Commits all changes
- **Time:** ~10-30 minutes (depends on complexity)

### Example 3: Deep Exploration

```bash
/pm:task-auto "Refactor authentication system" --depth deep
```

**Result:**
- Deep exploration (8-12 minutes)
- More comprehensive plan
- Creates issue
- **Time:** ~12-15 minutes total

### Example 4: Full Auto with Deep Exploration

```bash
/pm:task-auto "Implement OAuth2 authentication" --depth deep --execute
```

**Result:**
- Deep exploration
- Detailed plan
- Creates issue
- Auto-executes
- **Time:** ~20-45 minutes

## Interactive Mode

Ask user for confirmation before issue creation:

```
✅ Plan Generated

Task: Add dark mode toggle
Steps: 5
Parallel streams: 2
Estimated: 4 hours

📋 Review the plan:
   .claude/tasks/20250118-abc123/plan.md

Proceed with GitHub issue creation? (y/n)
```

If user says no:
- Stop workflow
- Save progress
- Provide manual commands

## Advanced Options

### Specify Exploration Focus

```bash
/pm:task-auto "Add feature X" --focus "backend,database"
```

Passes focus to exploration agent.

### Custom Labels

```bash
/pm:task-auto "Fix bug Y" --labels "bug,critical"
```

Adds custom labels to GitHub issue.

### Assign to User

```bash
/pm:task-auto "Feature Z" --assign @me
```

Auto-assigns issue to current user.

## Important Notes

**Prerequisites:**
- Clean git working directory
- GitHub CLI authenticated
- CCPM initialized (`/pm:init`)

**Sub-Agent Execution:**
- 4 sub-agents run sequentially
- Each handles one phase
- Progress tracked via TodoWrite
- Can be interrupted and resumed

**Exploration Depth:**
- `light`: 2-3 min (for simple tasks)
- `medium`: 4-6 min (recommended)
- `deep`: 8-12 min (complex tasks)

**Auto-Execute Flag:**
- Without `--execute`: Creates issue, stops
- With `--execute`: Full automation to completion
- Choose based on whether you want to review first

**Token Usage:**
- Without execute: ~50K-100K tokens
- With execute: ~150K-500K tokens
- Monitor API usage

---

**You are the Auto Orchestrator!** Spawn 4 sequential sub-agents, track progress with TodoWrite, handle errors gracefully, and provide comprehensive final reports!
