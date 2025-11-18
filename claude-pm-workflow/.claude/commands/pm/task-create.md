---
description: Create GitHub issue from approved task plan
allowed_tools:
  - Read
  - Write
  - Bash
  - Grep
---

# task-create: Create GitHub Issue

Creates a single GitHub issue from an approved task plan.

## Usage

```bash
/pm:task-create <task_id>
```

## Parameters

- `<task_id>` - Task ID with approved plan (e.g., `20250118-abc123`)

## What This Command Does

Creates ONE GitHub issue (not epic + subtasks) containing:
- Full task description
- Complete execution plan
- Acceptance criteria
- Testing strategy
- Estimates and metadata

Then renames local task directory from task-id to issue-number.

## Your Task - The Issue Creator

You are the **Issue Creator**. Follow this workflow:

### STEP 1: Validate Prerequisites

Check all required files exist and system is ready:

```bash
# Check task directory exists
if [ ! -d ".claude/tasks/${task_id}" ]; then
  echo "Error: Task not found: ${task_id}"
  echo "Run exploration first: /pm:task-explore <description>"
  exit 1
fi

# Check exploration exists
if [ ! -f ".claude/tasks/${task_id}/exploration.md" ]; then
  echo "Error: No exploration found for task: ${task_id}"
  echo "Run: /pm:task-explore <description>"
  exit 1
fi

# Check plan exists
if [ ! -f ".claude/tasks/${task_id}/plan.md" ]; then
  echo "Error: No plan found for task: ${task_id}"
  echo "Run: /pm:task-plan ${task_id}"
  exit 1
fi

# Check GitHub CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) not installed"
  echo "Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "Error: GitHub CLI not authenticated"
  echo "Run: gh auth login"
  exit 1
fi

# Check repository is configured (from ccpm.config)
if [ ! -f ".claude/ccpm.config" ]; then
  echo "Error: CCPM not initialized"
  echo "Run: /pm:init"
  exit 1
fi
```

### STEP 2: Load Task Data

Read all task files:

```bash
task_file=".claude/tasks/${task_id}/task.md"
exploration_file=".claude/tasks/${task_id}/exploration.md"
plan_file=".claude/tasks/${task_id}/plan.md"
```

Extract from frontmatter:
- Task description
- Estimated hours
- Parallel streams
- Complexity level
- Confidence level

### STEP 3: Build Issue Body

Create comprehensive issue body from plan:

```bash
# Create temporary file for issue body
issue_body_file="/tmp/pm-issue-${task_id}.md"

cat > "$issue_body_file" <<'EOF'
# ${task_description}

> **Created by:** CCPM Automated Workflow
> **Task ID:** ${task_id}
> **Confidence:** ${confidence}
> **Complexity:** ${complexity}
> **Estimated Effort:** ${estimated_hours} hours
> **Parallel Streams:** ${parallel_streams}

---

## Implementation Strategy

${implementation_strategy_from_plan}

---

## Detailed Steps

${detailed_steps_from_plan}

---

## Parallel Work Streams

${parallel_streams_section_from_plan}

---

## Acceptance Criteria

${acceptance_criteria_from_plan}

---

## Testing Strategy

${testing_strategy_from_plan}

---

## Risks & Mitigation

${risks_section_from_plan}

---

## Exploration Details

<details>
<summary>Click to view code exploration results</summary>

${exploration_summary_from_exploration_file}

**Files Analyzed:** ${files_analyzed}
**Explored At:** ${exploration_timestamp}
**Depth:** ${exploration_depth}

</details>

---

**📁 Local Task:** `.claude/tasks/${task_id}/`
**📋 Plan File:** `.claude/tasks/${task_id}/plan.md`
**🔍 Exploration:** `.claude/tasks/${task_id}/exploration.md`
EOF
```

### STEP 4: Create GitHub Issue

Use GitHub CLI to create the issue:

```bash
# Get repository from ccpm.config
repo=$(grep "^repository=" .claude/ccpm.config | cut -d'=' -f2)

if [ -z "$repo" ]; then
  echo "Error: Repository not configured in .claude/ccpm.config"
  exit 1
fi

# Validate not creating in CCPM template repo
if [ "$repo" = "anthropics/ccpm" ]; then
  echo "Error: Cannot create issues in CCPM template repository"
  echo "Configure your repository in .claude/ccpm.config"
  exit 1
fi

# Create issue with gh CLI
echo "Creating GitHub issue in ${repo}..."

issue_number=$(gh issue create \
  --repo "$repo" \
  --title "${task_description}" \
  --body-file "$issue_body_file" \
  --label "task" \
  --label "automated" \
  --json number \
  --jq '.number')

if [ -z "$issue_number" ]; then
  echo "Error: Failed to create GitHub issue"
  exit 1
fi

echo "✅ GitHub issue created: #${issue_number}"

# Clean up temp file
rm "$issue_body_file"
```

### STEP 5: Rename Task Directory

Move from task-id to issue-number:

```bash
# Rename directory
mv ".claude/tasks/${task_id}" ".claude/tasks/${issue_number}"

echo "✅ Task directory renamed: ${task_id} → ${issue_number}"
```

### STEP 6: Update Task Metadata

Update task.md with GitHub info:

```yaml
---
issue: ${issue_number}
title: ${task_description}
status: open
created: ${created_timestamp}
updated: ${current_timestamp}
github: https://github.com/${repo}/issues/${issue_number}
estimated_hours: ${estimated_hours}
parallel_streams: ${parallel_streams}
complexity: ${complexity}
confidence: ${confidence}
labels:
  - task
  - automated
---

# Task: ${task_description}

## GitHub Issue
**Issue:** #${issue_number}
**URL:** https://github.com/${repo}/issues/${issue_number}
**Status:** Open

## Status Checklist
- [x] Exploration complete
- [x] Plan created
- [x] Issue created
- [ ] Execution started
- [ ] Execution complete

## Timeline
- **Explored:** ${exploration_timestamp}
- **Planned:** ${plan_timestamp}
- **Issue Created:** ${current_timestamp}
- **Started:** -
- **Completed:** -

## Estimates
- **Effort:** ${estimated_hours} hours
- **Complexity:** ${complexity}
- **Confidence:** ${confidence}
- **Parallel Streams:** ${parallel_streams}

## Files
- **Exploration:** .claude/tasks/${issue_number}/exploration.md
- **Plan:** .claude/tasks/${issue_number}/plan.md
- **Metadata:** .claude/tasks/${issue_number}/task.md
```

### STEP 7: Add Issue Comment with Local References

Post a comment to the GitHub issue with local file references:

```bash
gh issue comment ${issue_number} \
  --repo "$repo" \
  --body "**Local Task Files:**

- 📁 Task Directory: \`.claude/tasks/${issue_number}/\`
- 🔍 Exploration Report: \`.claude/tasks/${issue_number}/exploration.md\`
- 📋 Execution Plan: \`.claude/tasks/${issue_number}/plan.md\`
- 📊 Task Metadata: \`.claude/tasks/${issue_number}/task.md\`

**Next Steps:**
1. Review the execution plan above
2. Start execution: \`/pm:task-execute ${issue_number}\`
3. Or start manually: \`/pm:issue-start ${issue_number}\`

**Progress Tracking:**
- Check status: \`/pm:issue-status ${issue_number}\`
- Sync updates: \`/pm:issue-sync ${issue_number}\`
- Close when complete: \`/pm:issue-close ${issue_number}\`"
```

### STEP 8: Display Success Summary

Show comprehensive summary to user:

```
✅ GitHub issue created successfully!

Issue: #${issue_number}
Title: ${task_description}
URL: https://github.com/${repo}/issues/${issue_number}

Labels:
  • task
  • automated

Metadata:
  Complexity: ${complexity}
  Estimated: ${estimated_hours} hours
  Parallel streams: ${parallel_streams}
  Confidence: ${confidence}

Local Files (renamed):
  📁 .claude/tasks/${issue_number}/
     ├── exploration.md  (code exploration)
     ├── plan.md         (execution plan)
     └── task.md         (task metadata)

📋 Next Steps:

  Option 1 - Automated Execution:
  └─ /pm:task-execute ${issue_number}
     This will automatically execute the plan with parallel agents

  Option 2 - Manual Control:
  └─ /pm:issue-start ${issue_number}
     Start work manually with full control

  Monitor Progress:
  ├─ /pm:issue-status ${issue_number}  (check status)
  ├─ /pm:issue-sync ${issue_number}    (sync progress to GitHub)
  └─ /pm:issue-close ${issue_number}   (mark complete)

🔗 View on GitHub:
   https://github.com/${repo}/issues/${issue_number}

⚡ Ready to execute!
```

## Error Handling

### Issue Creation Failures

**Network Error:**
- Retry up to 3 times with exponential backoff
- If still fails, save issue body locally
- Provide manual creation instructions

**Authentication Error:**
- Guide user through re-authentication
- Show command: `gh auth login`

**Permission Error:**
- Check if user has write access to repository
- Suggest repository configuration review

### File System Errors

**Directory Rename Fails:**
- If issue created but rename fails:
  - Keep task in old directory
  - Add GitHub info to task.md anyway
  - Warn user about directory mismatch
  - Provide manual rename command

**Metadata Update Fails:**
- Issue still created successfully
- Warn about incomplete local state
- Provide recovery steps

### Validation Errors

**Plan Not Approved:**
- Check plan status in frontmatter
- If status != "approved", prompt user:
  ```
  ⚠️  Plan status: ${status}

  Have you reviewed the plan?
  Review: .claude/tasks/${task_id}/plan.md

  Proceed anyway? (y/n)
  ```

**Missing Critical Sections:**
- Warn if plan missing key sections
- Create issue anyway with warnings
- Mark issue with "incomplete-plan" label

## Advanced Features

### Custom Labels

Allow user to specify additional labels:

```bash
/pm:task-create ${task_id} --labels "frontend,high-priority"
```

### Assignee

Auto-assign or allow custom assignee:

```bash
# Auto-assign to current user
--assign @me

# Assign to specific user
--assign username
```

### Milestone

Link to project milestone:

```bash
/pm:task-create ${task_id} --milestone "v2.0"
```

### Project Board

Add to GitHub project board:

```bash
/pm:task-create ${task_id} --project "Development Board"
```

## Important Notes

**Prerequisites:**
- GitHub CLI (`gh`) installed and authenticated
- Repository configured in `.claude/ccpm.config`
- Not the CCPM template repository

**Issue Structure:**
- Single issue (not epic with subtasks)
- Complete plan in issue body
- All metadata in labels and fields
- Local files linked in comments

**Directory Naming:**
- Task directory renamed to issue number
- Makes correlation obvious
- Old task-id preserved in metadata

**GitHub Integration:**
- Issue URL stored in task.md
- Can update via `/pm:issue-sync`
- Can close via `/pm:issue-close`
- All existing issue commands work

---

**You are the Issue Creator!** Validate prerequisites, build comprehensive issue body, create GitHub issue, rename directories, and prepare for execution.
