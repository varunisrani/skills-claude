# Tasks Directory

This directory stores task files for the **Simplified Fast Workflow**.

## Structure

Each task gets its own directory:

```
tasks/
└── <issue-number>/
    ├── exploration.md      # Code exploration results
    ├── plan.md            # Execution plan
    ├── task.md            # Task metadata
    ├── progress.md        # Execution progress
    └── updates/           # Per-stream progress
        ├── stream-A.md
        └── stream-B.md
```

## Usage

Task directories are created automatically when you run:

```bash
/pm:task-explore "your task description"
```

After GitHub sync, the directory is renamed from `<task-id>` to `<issue-number>`.

## Workflow

1. `/pm:task-explore` → Creates task directory
2. `/pm:task-plan` → Adds plan.md
3. `/pm:task-create` → Renames to issue number, adds GitHub info
4. `/pm:task-execute` → Adds progress.md and updates/

See main README.md for complete documentation.
