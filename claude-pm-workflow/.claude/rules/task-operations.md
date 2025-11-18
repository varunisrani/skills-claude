# Task Operations Rules

Rules and guidelines for working with the simplified task-based PM workflow.

## Task Directory Structure

```
.claude/tasks/<task-id-or-issue-number>/
├── exploration.md      # Code exploration results
├── plan.md            # Execution plan
├── task.md            # Task metadata and tracking
├── progress.md        # Execution progress (during execution)
└── updates/           # Per-stream progress (parallel execution)
    ├── stream-A.md
    └── stream-B.md
```

## Task ID Format

**Before GitHub sync:**
- Format: `YYYYMMDD-XXXXXX`
- Example: `20250118-abc123`
- Generated during `/pm:task-explore`

**After GitHub sync:**
- Format: `<issue-number>`
- Example: `145`
- Directory renamed during `/pm:task-create`

## Frontmatter Standards

### exploration.md
```yaml
---
task_id: string                   # Unique task identifier
description: string               # Task description
explored_at: ISO-8601 timestamp   # When exploration was done
depth: light|medium|deep          # Exploration depth
confidence: high|medium|low       # Confidence in understanding
files_analyzed: number            # Count of files analyzed
complexity: low|medium|high       # Task complexity
estimated_hours: number           # Initial time estimate
parallel_potential: high|medium|low|none
---
```

### plan.md
```yaml
---
task_id: string                   # Links to task
based_on_exploration: ISO-8601    # Exploration timestamp
created_at: ISO-8601              # Plan creation time
status: pending_approval|approved # Plan approval status
estimated_hours: number           # Refined estimate
parallel_streams: number          # Number of parallel streams
complexity: low|medium|high       # Complexity level
---
```

### task.md
```yaml
---
# Before GitHub sync
task_id: string                   # Unique identifier
description: string               # Task description
status: explored|planned|...      # Current status
created: ISO-8601                 # Creation timestamp
updated: ISO-8601                 # Last update timestamp
exploration_depth: light|medium|deep
plan_created: ISO-8601            # When plan was created

# After GitHub sync
issue: number                     # GitHub issue number
title: string                     # Issue title
github: URL                       # GitHub issue URL
labels: array                     # GitHub labels
branch: string                    # Git branch name

# During execution
execution_started: ISO-8601       # Execution start time
execution_completed: ISO-8601     # Execution end time
actual_hours: number              # Actual time spent
commits: number                   # Number of commits made
---
```

### progress.md
```yaml
---
issue: number                     # GitHub issue number
started: ISO-8601                 # Execution start time
last_sync: ISO-8601               # Last GitHub sync
completion: 0-100                 # Completion percentage
streams_completed: number         # Completed stream count
streams_total: number             # Total stream count
commits_made: number              # Git commits count
---
```

### updates/stream-X.md
```yaml
---
stream: string                    # Stream identifier (A, B, etc.)
name: string                      # Stream name
status: pending|in_progress|completed|blocked
last_updated: ISO-8601            # Last update timestamp
completion: 0-100                 # Stream completion %
files_modified: array             # List of modified files
---
```

## Task Status Flow

```
created (task-explore)
  ↓
explored (exploration complete)
  ↓
planned (plan created)
  ↓
pending_approval (awaiting user review)
  ↓
approved (user approved plan)
  ↓
open (GitHub issue created)
  ↓
in_progress (execution started)
  ↓
completed (execution finished)
  ↓
closed (GitHub issue closed)
```

## Directory Naming Rules

1. **Task Creation** (`/pm:task-explore`):
   - Create directory: `.claude/tasks/{YYYYMMDD-XXXXXX}/`
   - Use current date + random 6 chars

2. **GitHub Sync** (`/pm:task-create`):
   - Rename: `.claude/tasks/{task-id}/` → `.claude/tasks/{issue-number}/`
   - Update all references in files

3. **Archival** (`/pm:clean` or manual):
   - Move: `.claude/tasks/{issue-number}/` → `.claude/tasks/.archived/{issue-number}/`

## File Operations

### Reading Task Files

Always check both locations when reading:
```bash
# Try issue number first
if [ -f ".claude/tasks/${id}/task.md" ]; then
  task_dir=".claude/tasks/${id}"
# Then try as task-id pattern
elif [ -f ".claude/tasks/*-${id}/task.md" ]; then
  task_dir=$(find .claude/tasks -name "*-${id}" -type d)
fi
```

### Writing Task Files

Always use frontmatter for metadata:
```markdown
---
key: value
---

# Content starts here
```

### Updating Task Files

1. Read existing frontmatter
2. Update specific fields
3. Preserve other fields
4. Update `updated` timestamp
5. Write back to file

## GitHub Integration

### Issue Creation

When creating GitHub issue from task:
1. Validate plan exists
2. Build comprehensive issue body from plan
3. Create issue with labels: `task`, `automated`
4. Store issue number in task.md
5. Rename task directory to issue number
6. Post comment with local file references

### Issue Updates

Sync progress to GitHub:
1. Read progress.md
2. Format progress update comment
3. Post to GitHub issue
4. Update last_sync timestamp

### Issue Closure

When closing task:
1. Verify all acceptance criteria met
2. Run final tests
3. Close GitHub issue with summary comment
4. Update task status to closed
5. Optionally archive task directory

## Parallel Execution Coordination

### File Exclusivity

Each parallel stream has exclusive file access:
```yaml
# In plan.md
Stream A:
  files:
    - src/components/Button.tsx
    - src/components/Button.test.tsx

Stream B:
  files:
    - src/utils/theme.ts
    - src/utils/theme.test.ts
```

**Rule:** Streams MUST NOT modify files outside their assigned list.

### Progress Updates

Each stream agent updates its own file:
```bash
# Stream A updates
.claude/tasks/<issue>/updates/stream-A.md

# Stream B updates
.claude/tasks/<issue>/updates/stream-B.md
```

### Integration Points

When streams need to integrate:
1. All independent streams complete first
2. Spawn integration agent
3. Integration agent merges stream changes
4. Resolves any conflicts
5. Runs integration tests
6. Creates integration commit

## Error Handling

### Task Not Found

```bash
if [ ! -d ".claude/tasks/${id}" ]; then
  echo "Error: Task not found: ${id}"
  echo ""
  echo "Available tasks:"
  ls -1 .claude/tasks/ | grep -v "README.md" | grep -v ".archived"
  exit 1
fi
```

### Missing Files

```bash
required_files=("exploration.md" "plan.md" "task.md")

for file in "${required_files[@]}"; do
  if [ ! -f ".claude/tasks/${id}/${file}" ]; then
    echo "Error: Missing required file: ${file}"
    echo "Task may be incomplete or corrupted"
    exit 1
  fi
done
```

### Directory Rename Failures

If rename fails during GitHub sync:
1. Keep task in original directory
2. Add GitHub info to task.md anyway
3. Warn user about mismatch
4. Provide manual rename command
5. Continue with workflow

## Best Practices

### Task Exploration

- Use `medium` depth for most tasks (good balance)
- Use `deep` for unfamiliar or complex areas
- Use `light` only for trivial changes
- Re-explore if confidence is low

### Task Planning

- Review plans carefully before approving
- Edit plan.md directly if adjustments needed
- Mark plan as `approved` in frontmatter before creating issue
- Ensure acceptance criteria are specific and measurable

### Task Execution

- Keep git working directory clean before starting
- Create feature branch for all work
- Commit frequently with clear messages
- Run tests after each significant change
- Sync progress to GitHub regularly

### Task Completion

- Verify all acceptance criteria met
- Run full test suite
- Review all changes (git diff)
- Sync final status to GitHub
- Close issue with summary

## Timestamp Format

Always use ISO-8601 format for timestamps:
```yaml
created: 2025-01-18T14:30:00Z
updated: 2025-01-18T16:45:30Z
```

Get current timestamp:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

## Task Cleanup

### Manual Cleanup

Move completed tasks to archive:
```bash
mkdir -p .claude/tasks/.archived
mv .claude/tasks/<issue-number> .claude/tasks/.archived/
```

### Automated Cleanup

Use cleanup command:
```bash
/pm:clean
```

This will:
- Find all closed tasks
- Move to `.archived/` directory
- Generate cleanup report
- Update task count statistics

## Integration with Existing Commands

### GitHub Commands Still Work

All existing issue-* commands work with tasks:
- `/pm:issue-start <issue-number>`
- `/pm:issue-close <issue-number>`
- `/pm:issue-sync <issue-number>`
- `/pm:issue-show <issue-number>`
- `/pm:issue-edit <issue-number>`

### Status Commands

- `/pm:status` - Shows all tasks
- `/pm:next` - Next priority task
- `/pm:in-progress` - Currently executing tasks
- `/pm:blocked` - Blocked tasks

## Migration from Old CCPM

If you have existing epics/tasks in old format:
1. Complete existing epics using old commands
2. Start new work with new task-* commands
3. Both systems can coexist temporarily
4. Gradually phase out epic-based workflow

## Summary

- **One task = One directory = One GitHub issue**
- **Directory named by task-id initially, renamed to issue-number after GitHub sync**
- **All metadata in frontmatter (YAML)**
- **Parallel execution uses exclusive file lists**
- **Progress tracked locally and synced to GitHub**
- **Simple, fast, focused on execution over planning**
