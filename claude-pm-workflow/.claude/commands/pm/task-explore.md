---
description: Deep code exploration for a task - analyzes codebase to understand context
allowed_tools:
  - Task
  - Glob
  - Grep
  - Read
  - Bash
  - Write
  - TodoWrite
---

# task-explore: Deep Code Exploration

Analyzes the codebase to understand the context and scope of a task before planning.

## Usage

```bash
/pm:task-explore "<task_description>" [--depth <level>]
```

## Parameters

- `<task_description>` - Natural language description of what needs to be done
- `--depth` (optional) - Exploration depth: `light|medium|deep` (default: medium)

## What This Command Does

Spawns exploration agents to deeply analyze the codebase and understand:
- Which files/components will be affected
- Current architecture and patterns
- Dependencies and relationships
- Technical constraints and risks
- Similar existing implementations
- Complexity assessment

## Your Task - The Exploration Orchestrator

You are the **Exploration Orchestrator**. Follow this workflow:

### STEP 1: Parse Input

Extract the task description and depth level from user input.

Example:
- User types: `/pm:task-explore "Add dark mode toggle to settings"`
- Task: `Add dark mode toggle to settings`
- Depth: `medium` (default)

Generate a unique task ID:
```javascript
// Format: {date}-{random}
// Example: 20250118-abc123
const task_id = `${YYYYMMDD}-${random_6_chars}`;
```

### STEP 2: Create Task Directory

```bash
mkdir -p .claude/tasks/${task_id}
```

### STEP 3: Spawn Exploration Agent

Use the Task tool to spawn a comprehensive exploration agent:

```
subagent_type: "Explore"
description: "Explore codebase for task"
prompt: "Deep exploration of codebase for this task.

Task: {TASK_DESCRIPTION}
Depth: {DEPTH_LEVEL}

Your mission:
Analyze the codebase to understand everything needed to implement this task.

## Exploration Areas

### 1. Identify Affected Components
- Which files will need to be modified?
- Which files will need to be created?
- What components/modules are involved?
- What's the current architecture?

### 2. Find Similar Implementations
- Search for similar features already implemented
- Identify patterns and conventions being used
- Find code we can reuse or reference

### 3. Map Dependencies
- What dependencies exist between files?
- What external libraries are used?
- What API contracts need to be maintained?

### 4. Analyze Technical Constraints
- What are the technical limitations?
- What are potential risks?
- What backward compatibility concerns exist?
- What performance considerations apply?

### 5. Assess Complexity
- How complex is this task?
- Estimated effort in hours
- Can work be done in parallel streams?
- What's the recommended approach?

## Exploration Strategy

Use {DEPTH_LEVEL} exploration:

**Light** (2-3 minutes):
- Quick file search for keywords
- Check obvious files (based on task description)
- Basic pattern analysis

**Medium** (4-6 minutes):
- Comprehensive file search
- Read key files thoroughly
- Analyze architecture and dependencies
- Find similar implementations

**Deep** (8-12 minutes):
- Exhaustive codebase analysis
- Read all related files
- Map complete dependency tree
- Analyze all edge cases
- Check test coverage

## Return Format

Provide a comprehensive exploration report with these sections:

### Task Overview
- Task ID: {task_id}
- Description: {TASK_DESCRIPTION}
- Confidence Level: high|medium|low (how well you understand the task)

### Scope Analysis
**Files to Modify:**
- path/to/file1.ext - Why: <reason>
- path/to/file2.ext - Why: <reason>

**Files to Create:**
- path/to/new-file.ext - Purpose: <purpose>

**Components Affected:**
- Component A: <how it's affected>
- Component B: <how it's affected>

### Current Implementation
**Architecture Pattern:** <describe the pattern>

**Key Files and Roles:**
- file1.ext: <role/purpose>
- file2.ext: <role/purpose>

**Conventions to Follow:**
- <convention 1>
- <convention 2>

**Similar Implementations Found:**
- path/to/similar-feature.ext: <description>

### Dependencies
**Internal Dependencies:**
- Dependency A: <description>
- Dependency B: <description>

**External Dependencies:**
- package-name: <how it's used>

**API Contracts:**
- <contract description if applicable>

### Technical Considerations
**Constraints:**
- <constraint 1>
- <constraint 2>

**Risks:**
- Risk: <description>
  Impact: high|medium|low
  Mitigation: <suggestion>

**Backward Compatibility:**
- <any concerns?>

**Performance Considerations:**
- <any concerns?>

### Complexity Assessment
**Estimated Effort:** <X-Y hours>
**Complexity Level:** low|medium|high
**Parallel Potential:** high|medium|low|none
**Number of Parallel Streams:** <number if applicable>
**Recommended Approach:** <strategy description>

### Suggested Next Steps
1. <step 1>
2. <step 2>
3. <step 3>

Use 'very thorough' exploration level."
```

### STEP 4: Process Exploration Results

When the agent returns its exploration report:

1. **Create Exploration File**

Write the report to `.claude/tasks/${task_id}/exploration.md`:

```yaml
---
task_id: ${task_id}
description: ${TASK_DESCRIPTION}
explored_at: ${current_timestamp_ISO8601}
depth: ${DEPTH_LEVEL}
confidence: ${confidence_from_agent}
files_analyzed: ${count_of_files}
complexity: ${complexity_from_agent}
estimated_hours: ${hours_from_agent}
parallel_potential: ${parallel_potential_from_agent}
---

${exploration_report_from_agent}
```

2. **Extract Key Metrics**

From the agent's report, extract:
- Confidence level
- Files to modify (count)
- Files to create (count)
- Estimated effort
- Parallel potential
- Complexity level

### STEP 5: Display Summary

Show user a concise summary:

```
✅ Task exploration complete

Task ID: ${task_id}
Confidence: ${confidence}

Scope:
  Files to modify: ${count}
  Files to create: ${count}
  Components affected: ${count}

Analysis:
  Complexity: ${complexity}
  Estimated effort: ${hours} hours
  Parallel potential: ${potential}
  ${parallel_streams > 1 ? `Parallel streams: ${parallel_streams}` : ''}

Dependencies: ${dependency_count}
Risks identified: ${risk_count}

📁 Exploration saved to:
   .claude/tasks/${task_id}/exploration.md

📋 Next Steps:
   1. Review the exploration report
   2. Create execution plan: /pm:task-plan ${task_id}
   3. Or re-explore with different depth: /pm:task-explore "${TASK_DESCRIPTION}" --depth deep
```

### STEP 6: Save Task Metadata

Create a minimal task tracking file at `.claude/tasks/${task_id}/task.md`:

```yaml
---
task_id: ${task_id}
description: ${TASK_DESCRIPTION}
status: explored
created: ${current_timestamp_ISO8601}
updated: ${current_timestamp_ISO8601}
exploration_depth: ${DEPTH_LEVEL}
---

# Task: ${TASK_DESCRIPTION}

## Status
- [x] Exploration complete
- [ ] Plan created
- [ ] Issue created
- [ ] Execution started
- [ ] Execution complete

## Timeline
- **Explored:** ${timestamp}
- **Planned:** -
- **Started:** -
- **Completed:** -
```

## Error Handling

### If Exploration Fails

1. **Low Confidence**: If agent returns confidence: low
   - Suggest re-running with deeper exploration
   - Ask user for more context
   - Provide what was found anyway

2. **No Files Found**: If agent can't find relevant files
   - Ask user to clarify the task
   - Suggest keywords to search for
   - Offer manual file specification

3. **Agent Timeout**: If exploration takes too long
   - Save partial results
   - Suggest splitting into smaller tasks
   - Offer to continue exploration

## Advanced Options

### Custom Exploration Focus

Allow user to guide exploration:

```bash
/pm:task-explore "Add feature X" --focus "backend,database"
```

This tells the agent to focus exploration on specific areas.

### Cached Exploration

If a similar task was explored recently:
- Check `.claude/tasks/` for similar descriptions
- Offer to reuse previous exploration
- Show diff if accepting cached exploration

## Important Notes

**Prerequisites:**
- Project must have code to explore
- Task description should be specific enough

**Best Practices:**
- Use medium depth for most tasks (good balance)
- Use deep depth for complex/unfamiliar areas
- Use light depth for trivial changes you understand well

**Exploration Time:**
- Light: 2-3 minutes
- Medium: 4-6 minutes
- Deep: 8-12 minutes

**Remember:** Good exploration = Better planning = Faster execution!

---

**You are the Exploration Orchestrator!** Spawn the exploration agent, process results, create files, and guide the user to the next step.
