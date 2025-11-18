---
description: Create detailed execution plan from code exploration results
allowed_tools:
  - Read
  - Write
  - Bash
  - Task
  - TodoWrite
---

# task-plan: Create Execution Plan

Generates a detailed, step-by-step execution plan based on the code exploration results.

## Usage

```bash
/pm:task-plan <task_id> [--regenerate]
```

## Parameters

- `<task_id>` - Task ID from exploration (e.g., `20250118-abc123`)
- `--regenerate` (optional) - Regenerate plan if one already exists

## What This Command Does

Creates a comprehensive execution plan including:
- Step-by-step implementation approach
- File-level changes
- Parallel work streams (if applicable)
- Testing strategy
- Acceptance criteria

## Your Task - The Planning Orchestrator

You are the **Planning Orchestrator**. Follow this workflow:

### STEP 1: Validate Input

Check that the task ID exists and has exploration results:

```bash
# Check if exploration file exists
if [ ! -f ".claude/tasks/${task_id}/exploration.md" ]; then
  echo "Error: No exploration found for task: ${task_id}"
  echo "Run exploration first: /pm:task-explore <description>"
  exit 1
fi

# Check if plan already exists
if [ -f ".claude/tasks/${task_id}/plan.md" ] && [ "$REGENERATE" != "true" ]; then
  echo "Plan already exists for task: ${task_id}"
  echo "To regenerate: /pm:task-plan ${task_id} --regenerate"
  echo "To proceed: /pm:task-create ${task_id}"
  exit 0
fi
```

### STEP 2: Load Exploration Results

Read the exploration file:

```bash
exploration_file=".claude/tasks/${task_id}/exploration.md"
```

Extract key information from frontmatter:
- task_id
- description
- confidence
- complexity
- estimated_hours
- parallel_potential
- files_analyzed

### STEP 3: Spawn Planning Agent

Use the Task tool to create a detailed execution plan:

```
subagent_type: "general-purpose"
description: "Create execution plan"
prompt: "Create a detailed execution plan for this task.

## Input: Exploration Results

${exploration_file_contents}

## Your Mission

Based on the exploration results, create a comprehensive, actionable execution plan.

## Plan Structure

### 1. Implementation Strategy

Provide a high-level approach (2-3 paragraphs):
- Overall strategy and methodology
- Key architectural decisions
- Why this approach is optimal

### 2. Detailed Steps

Break down into concrete, sequential steps:

**Step 1: <Short Description>**
- **Files**: [list of files to modify/create]
- **Changes**:
  - Change 1: <specific code change>
  - Change 2: <specific code change>
- **Reason**: Why this step is necessary
- **Dependencies**: Any prerequisite steps
- **Tests**: What to test after this step

**Step 2: <Short Description>**
...

Aim for 5-10 steps maximum. Each step should be:
- Atomic (can be completed independently)
- Testable (clear validation criteria)
- Specific (exact files and changes)

### 3. Parallel Work Streams

If parallel_potential is medium/high, identify independent streams:

**Stream A: <Name>**
- **Scope**: What this stream covers
- **Files**: [exclusive file list]
- **Can Start**: immediately|after_stream_X
- **Estimated Time**: <hours>
- **Dependencies**: None|[list]

**Stream B: <Name>**
...

**Coordination**: How streams will integrate
**Conflicts**: Any potential conflicts between streams

If no parallelization possible, explicitly state: \"No parallel streams - sequential execution required\"

### 4. Acceptance Criteria

Clear, testable criteria for completion:
- [ ] Criterion 1: <specific, measurable>
- [ ] Criterion 2: <specific, measurable>
- [ ] Criterion 3: <specific, measurable>

Each criterion should be:
- Specific (not vague)
- Measurable (can verify true/false)
- Relevant (directly related to task)

### 5. Testing Strategy

**Unit Tests:**
- What needs unit test coverage
- Specific test cases to write
- Expected behavior to verify

**Integration Tests:**
- What integrations to test
- Test scenarios
- Edge cases to cover

**Manual Testing:**
- [ ] Manual test 1: <description>
- [ ] Manual test 2: <description>

### 6. Risks & Mitigation

**Risk 1: <Description>**
- Probability: high|medium|low
- Impact: high|medium|low
- Mitigation: <specific action to take>

**Risk 2: <Description>**
...

### 7. Rollback Plan

If something goes wrong:
1. <rollback step 1>
2. <rollback step 2>

## Guidelines

- Be specific: \"Update Button component\" → \"Add darkMode prop to Button component in src/components/Button.tsx\"
- Be realistic: Estimate time accurately based on complexity
- Be thorough: Cover edge cases and error scenarios
- Be pragmatic: Prefer simple solutions over complex ones

## Return Format

Return the complete plan as markdown with clear sections and formatting. Use code blocks for code examples, lists for steps, and bold for emphasis."
```

### STEP 4: Process Planning Results

When the agent returns the plan:

1. **Create Plan File**

Write to `.claude/tasks/${task_id}/plan.md`:

```yaml
---
task_id: ${task_id}
based_on_exploration: ${exploration_timestamp}
created_at: ${current_timestamp_ISO8601}
status: pending_approval
estimated_hours: ${estimated_hours_from_plan}
parallel_streams: ${stream_count}
complexity: ${complexity}
---

${plan_content_from_agent}
```

2. **Update Task Metadata**

Update `.claude/tasks/${task_id}/task.md`:

```yaml
---
task_id: ${task_id}
description: ${description}
status: planned
created: ${created_timestamp}
updated: ${current_timestamp}
exploration_depth: ${depth}
plan_created: ${current_timestamp}
estimated_hours: ${hours}
parallel_streams: ${streams}
---

# Task: ${description}

## Status
- [x] Exploration complete
- [x] Plan created
- [ ] Issue created
- [ ] Execution started
- [ ] Execution complete

## Timeline
- **Explored:** ${exploration_timestamp}
- **Planned:** ${current_timestamp}
- **Started:** -
- **Completed:** -

## Estimates
- **Effort:** ${estimated_hours} hours
- **Complexity:** ${complexity}
- **Parallel Streams:** ${streams}
```

### STEP 5: Display Summary

Show user a concise summary:

```
✅ Execution plan created

Task ID: ${task_id}
Plan Status: Pending Approval

Implementation:
  Steps: ${step_count}
  Parallel streams: ${stream_count}
  Estimated time: ${hours} hours${parallel_time ? ` (${parallel_time} with parallelization)` : ''}

Testing:
  Unit tests: ${unit_test_count}
  Integration tests: ${integration_test_count}
  Manual tests: ${manual_test_count}

Acceptance criteria: ${criteria_count}
Risks identified: ${risk_count}

📁 Plan saved to:
   .claude/tasks/${task_id}/plan.md

📋 Next Steps:
   1. REVIEW THE PLAN CAREFULLY
   2. Edit plan if needed: .claude/tasks/${task_id}/plan.md
   3. Approve and create GitHub issue: /pm:task-create ${task_id}
   4. Or regenerate plan: /pm:task-plan ${task_id} --regenerate

⚠️  IMPORTANT: Review the plan before proceeding!
```

### STEP 6: Calculate Time Estimates

If parallel streams are identified, calculate optimized time:

```javascript
// Sequential time = sum of all steps
const sequential_time = steps.reduce((sum, step) => sum + step.time, 0);

// Parallel time = max time across parallel streams + sequential overhead
const parallel_time = Math.max(...streams.map(s => s.time)) + sequential_overhead;

// Savings
const time_saved = sequential_time - parallel_time;
const savings_percent = ((time_saved / sequential_time) * 100).toFixed(0);
```

Display if parallel execution is beneficial:
```
⚡ Parallel Execution Benefit:
   Sequential: ${sequential_time}h
   Parallel: ${parallel_time}h
   Time saved: ${time_saved}h (${savings_percent}%)
```

## Error Handling

### If Planning Fails

1. **Insufficient Exploration Data**
   - Re-run exploration with deeper level
   - Ask user for more context
   - Generate best-effort plan with warnings

2. **Overly Complex Task**
   - Suggest breaking into smaller tasks
   - Create high-level plan only
   - Recommend manual decomposition

3. **Agent Uncertainty**
   - Create plan with low confidence indicators
   - Mark risky sections clearly
   - Suggest user review specific areas

### Plan Quality Checks

Before saving, validate:
- At least 3 steps defined
- All steps have file lists
- Acceptance criteria present
- Testing strategy defined
- Risks identified (if complexity > low)

If validation fails:
- Regenerate with more specific prompts
- Ask agent to elaborate on weak sections
- Warn user about plan quality issues

## Advanced Features

### Interactive Planning

If user wants to customize:

```bash
# User can edit plan after generation
nano .claude/tasks/${task_id}/plan.md

# Then re-validate
/pm:task-plan ${task_id} --validate
```

### Plan Templates

For common task types, use templates:
- Feature addition
- Bug fix
- Refactoring
- Performance optimization
- Security patch

Auto-detect task type from description and apply appropriate template structure.

### Dependency Analysis

Analyze step dependencies and create execution graph:
```
Step 1 (Database schema)
  ↓
Step 2 (API endpoints) ─┐
  ↓                     ├→ Step 4 (Integration tests)
Step 3 (UI components) ─┘
  ↓
Step 5 (Documentation)
```

## Important Notes

**Planning Best Practices:**
- Be specific about file changes
- Include testing at every step
- Consider rollback scenarios
- Estimate time realistically

**Parallel Execution:**
- Only suggest parallelization if truly independent
- Identify coordination points clearly
- Account for merge complexity

**User Review:**
- Plan is NOT final until user approves
- User can edit plan.md directly
- Encourage careful review before execution

**Quality Indicators:**
- Confidence: high|medium|low
- Completeness: All sections filled
- Specificity: Concrete file paths and changes
- Testability: Clear validation criteria

---

**You are the Planning Orchestrator!** Generate comprehensive plans, calculate estimates, validate quality, and guide users to approval.
