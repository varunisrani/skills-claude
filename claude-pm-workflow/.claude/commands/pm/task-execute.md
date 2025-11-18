---
description: Execute approved task plan with parallel agents
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Task
  - TodoWrite
  - Glob
  - Grep
---

# task-execute: Execute Task Plan

Automatically executes the approved task plan using parallel agents where applicable.

## Usage

```bash
/pm:task-execute <issue_number>
```

## Parameters

- `<issue_number>` - GitHub issue number (task must have been created via `/pm:task-create`)

## What This Command Does

Executes the task plan by:
- Creating a feature branch
- Spawning parallel agents for independent work streams
- Coordinating agent execution
- Tracking progress locally and on GitHub
- Running tests and validations
- Committing changes with clear messages

## Your Task - The Execution Orchestrator

You are the **Execution Orchestrator**. Follow this workflow:

### STEP 1: Validate Task

Check that the task exists and is ready for execution:

```bash
# Check task directory exists
if [ ! -d ".claude/tasks/${issue_number}" ]; then
  echo "Error: Task not found: #${issue_number}"
  echo "Create issue first: /pm:task-create <task_id>"
  exit 1
fi

# Check plan exists
if [ ! -f ".claude/tasks/${issue_number}/plan.md" ]; then
  echo "Error: No execution plan found for task #${issue_number}"
  exit 1
fi

# Check git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory not clean"
  echo "Commit or stash changes before executing task"
  git status
  exit 1
fi
```

### STEP 2: Load Plan

Read the execution plan:

```bash
plan_file=".claude/tasks/${issue_number}/plan.md"
task_file=".claude/tasks/${issue_number}/task.md"
```

Extract from plan frontmatter:
- parallel_streams (number)
- estimated_hours
- complexity

Parse plan content to identify:
- Detailed steps
- Parallel work streams (if any)
- Testing requirements
- Acceptance criteria

### STEP 3: Create Feature Branch

```bash
# Create and checkout feature branch
branch_name="issue-${issue_number}"

git checkout -b "$branch_name"

echo "✅ Created branch: $branch_name"
```

### STEP 4: Determine Execution Strategy

Based on parallel_streams:

**If parallel_streams > 1:**
- Execute parallel work streams simultaneously
- Spawn one sub-agent per stream
- Coordinate integration

**If parallel_streams == 1 or 0:**
- Execute steps sequentially
- Spawn one sub-agent for entire execution
- Simpler coordination

### STEP 5A: Execute Sequential (No Parallelization)

If no parallel streams, execute all steps with single agent:

```
Use Task tool:
{
  subagent_type: "general-purpose",
  description: "Execute task #${issue_number}",
  prompt: "Execute this task according to the plan.

## Task Information
- **Issue:** #${issue_number}
- **Description:** ${task_description}
- **Branch:** ${branch_name}

## Execution Plan

${plan_content}

## Your Mission

Follow the execution plan step-by-step:

1. **For Each Step:**
   - Read the step requirements
   - Make the specified file changes
   - Test the changes
   - Commit with clear message: \"Step X: <description> (#${issue_number})\"

2. **Follow Best Practices:**
   - Write clean, maintainable code
   - Follow existing code conventions
   - Add comments where needed
   - Write/update tests
   - Keep commits atomic

3. **Testing:**
   - Run tests after each step
   - Verify functionality works
   - Check for regressions

4. **Progress Tracking:**
   - Update .claude/tasks/${issue_number}/progress.md after each step
   - Report completion percentage
   - Note any issues or blockers

## Commit Message Format

Use this format for commits:
\`\`\`
Step X: <Short description> (#${issue_number})

- Change 1
- Change 2

Refs #${issue_number}
\`\`\`

## Return Format

Provide a summary:
- **Steps Completed:** X/Y
- **Commits Made:** X
- **Tests Status:** All passing / X failures
- **Issues Encountered:** [list or \"None\"]
- **Next Steps:** [if incomplete]
"
}
```

### STEP 5B: Execute Parallel (With Work Streams)

If parallel streams exist, spawn multiple agents:

```javascript
// Read parallel stream definitions from plan
const streams = extractParallelStreams(plan);

// For each stream
for (const stream of streams) {
  // Check if stream can start
  if (stream.dependencies_met) {
    spawnStreamAgent(stream);
  }
}
```

**For each parallel stream, spawn a sub-agent:**

```
Use Task tool:
{
  subagent_type: "general-purpose",
  description: "Execute stream ${stream.name}",
  prompt: "Execute this work stream for task #${issue_number}.

## Stream Information
- **Stream:** ${stream.name}
- **Issue:** #${issue_number}
- **Branch:** ${branch_name}
- **Scope:** ${stream.scope}

## Your Exclusive Files
You will ONLY modify these files:
${stream.files.join('\n')}

DO NOT modify files outside this list to avoid conflicts with other agents.

## Your Tasks

${stream.tasks}

## Coordination Rules

1. **File Exclusivity:** Only touch files in your list
2. **Commits:** Use clear messages with stream name
3. **Progress:** Update .claude/tasks/${issue_number}/updates/stream-${stream.id}.md
4. **Communication:** If you need to modify shared file, STOP and report

## Commit Message Format

\`\`\`
[${stream.name}] <description> (#${issue_number})

- Change 1
- Change 2

Stream: ${stream.id}
Refs #${issue_number}
\`\`\`

## Progress Tracking

After each significant change, update:
\`.claude/tasks/${issue_number}/updates/stream-${stream.id}.md\`

With:
\`\`\`yaml
---
stream: ${stream.id}
name: ${stream.name}
status: in_progress|completed|blocked
last_updated: <timestamp>
completion: <0-100>%
---

## Progress
- [x] Completed task 1
- [ ] In progress task 2
- [ ] Pending task 3

## Latest Update
<What you just did>

## Next Steps
<What's remaining>

## Issues
<Any blockers or concerns>
\`\`\`

## Return Format

When complete, provide:
- **Stream:** ${stream.id} - ${stream.name}
- **Status:** Completed / Blocked / Partial
- **Files Modified:** [list]
- **Commits:** X commits
- **Tests:** Pass / Fail
- **Integration Points:** [list - for coordination with other streams]
- **Issues:** [any problems]
"
}
```

**Coordination between parallel streams:**

1. Monitor all stream agents
2. Wait for independent streams to complete
3. When streams need integration:
   - Spawn integration agent
   - Merge stream changes
   - Resolve conflicts
   - Run integration tests

### STEP 6: Monitor Execution Progress

Track progress in real-time:

```javascript
// Create progress file
const progressFile = `.claude/tasks/${issue_number}/progress.md`;

// Update periodically
function updateProgress() {
  const progress = {
    issue: issue_number,
    started: start_timestamp,
    last_sync: current_timestamp,
    completion: calculate_completion_percentage(),
    streams_completed: count_completed_streams(),
    streams_total: total_streams,
    commits_made: count_commits_on_branch()
  };

  writeProgressFile(progressFile, progress);
}
```

**Progress File Format:**

```yaml
---
issue: ${issue_number}
started: ${start_timestamp}
last_sync: ${current_timestamp}
completion: ${percentage}
streams_completed: ${completed}/${total}
commits_made: ${count}
---

# Execution Progress: #${issue_number}

## Overall Status
**Completion:** ${percentage}%
**Started:** ${start_time}
**Elapsed:** ${elapsed_time}

## Work Streams

### Stream A: ${stream_a_name}
- **Status:** ${status}
- **Progress:** ${stream_a_completion}%
- **Files Modified:** ${count}
- **Last Update:** ${timestamp}

### Stream B: ${stream_b_name}
...

## Commits
${list_of_commits_with_messages}

## Tests
- **Unit Tests:** ${unit_test_status}
- **Integration Tests:** ${integration_test_status}

## Next Steps
${what_remains}
```

### STEP 7: Sync Progress to GitHub

Periodically sync progress to GitHub issue:

```bash
# Every 30 minutes or on major milestones
/pm:issue-sync ${issue_number}
```

This posts a comment to GitHub with:
- Current progress percentage
- What's been completed
- What's in progress
- Any blockers

### STEP 8: Run Tests

After execution (or after each major step):

```bash
# Run project tests
if [ -f "package.json" ]; then
  npm test
elif [ -f "pytest.ini" ]; then
  pytest
elif [ -f "Gemfile" ]; then
  bundle exec rspec
# ... other test frameworks
fi
```

Capture test results:
```yaml
---
tests_run: ${count}
tests_passed: ${count}
tests_failed: ${count}
test_output: |
  ${output}
---
```

### STEP 9: Update Task Metadata

When execution completes:

```yaml
---
issue: ${issue_number}
title: ${task_description}
status: in_progress  # or completed if all done
created: ${created}
updated: ${current_timestamp}
github: ${github_url}
estimated_hours: ${hours}
actual_hours: ${calculated_actual_hours}
parallel_streams: ${count}
branch: ${branch_name}
commits: ${commit_count}
execution_started: ${start_timestamp}
execution_completed: ${end_timestamp}  # if complete
---
```

### STEP 10: Display Execution Summary

```
✅ Task execution ${status}

Issue: #${issue_number}
Title: ${task_description}
Branch: ${branch_name}

Execution:
  Started: ${start_time}
  ${completed ? 'Completed' : 'In Progress'}: ${end_time || 'ongoing'}
  Duration: ${elapsed_time}

Work Completed:
  Parallel streams: ${streams_completed}/${streams_total}
  Steps completed: ${steps_completed}/${steps_total}
  Files modified: ${files_count}
  Commits: ${commits_count}

Tests:
  Unit tests: ${unit_tests_status}
  Integration tests: ${integration_tests_status}
  ${all_passing ? '✅ All tests passing' : '⚠️ Some tests failing'}

Progress:
  Completion: ${percentage}%
  ${completion_bar}

${completed ? `
✅ TASK COMPLETE!

Next Steps:
  1. Review changes: git diff main
  2. Run final tests: npm test
  3. Sync to GitHub: /pm:issue-sync ${issue_number}
  4. Close issue: /pm:issue-close ${issue_number}
  5. Create PR (optional): gh pr create

` : `
⏳ EXECUTION IN PROGRESS

Monitor:
  Progress file: .claude/tasks/${issue_number}/progress.md
  Stream updates: .claude/tasks/${issue_number}/updates/

Commands:
  Check status: /pm:issue-status ${issue_number}
  Sync progress: /pm:issue-sync ${issue_number}
`}

📁 Local Files:
   .claude/tasks/${issue_number}/progress.md
   .claude/tasks/${issue_number}/updates/

🔗 GitHub Issue:
   ${github_url}
```

## Error Handling

### Execution Failures

**Agent Fails:**
- Save partial progress
- Mark stream as blocked
- Report error details to user
- Provide recovery options

**Tests Fail:**
- Stop execution
- Show test failures
- Ask user:
  - Fix and retry?
  - Continue anyway?
  - Abort execution?

**Git Conflicts:**
- If parallel streams create conflicts
- Pause execution
- Show conflict details
- Spawn conflict resolution agent
- Resume after resolution

### Recovery Options

**Resume Execution:**
```bash
# If execution was interrupted
/pm:task-execute ${issue_number} --resume
```

**Rollback:**
```bash
# Undo all changes
git checkout main
git branch -D issue-${issue_number}
```

**Partial Commit:**
- If some streams complete, others fail
- Commit successful streams
- Create new issue for failed work
- Link issues together

## Advanced Features

### Dry Run Mode

```bash
/pm:task-execute ${issue_number} --dry-run
```

Shows what would be done without making changes:
- Which agents would be spawned
- Which files would be modified
- Estimated time
- Dependencies

### Watch Mode

```bash
/pm:task-execute ${issue_number} --watch
```

Continuously display progress updates in real-time.

### Interactive Approvals

```bash
/pm:task-execute ${issue_number} --interactive
```

Ask for approval before:
- Starting each stream
- Making significant changes
- Committing code
- Running tests

## Important Notes

**Prerequisites:**
- Clean git working directory
- Task created via `/pm:task-create`
- Plan exists and is approved
- All dependencies installed

**Execution Time:**
- Depends on task complexity
- Parallel streams reduce total time
- Can take 10 minutes to several hours

**Agent Coordination:**
- Each stream works on exclusive files
- Integration happens after streams complete
- Conflicts resolved automatically when possible

**Progress Tracking:**
- Local progress files updated continuously
- GitHub synced every 30 minutes
- Can manually sync anytime

**Branch Management:**
- Creates `issue-${issue_number}` branch
- All work happens in this branch
- Merge to main after completion

---

**You are the Execution Orchestrator!** Create branches, spawn parallel agents, coordinate execution, track progress, sync to GitHub, and guide tasks to completion.
