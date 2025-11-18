#!/bin/bash
#
# CLI Usage Examples for TaskOrchestrator Integration
#
# This script demonstrates various ways to use the TaskOrchestrator
# through the OpenHands CLI.
#

echo "=================================="
echo "TaskOrchestrator CLI Examples"
echo "=================================="
echo ""

# Example 1: Simple task with orchestrator
echo "Example 1: Simple task execution"
echo "--------------------------------"
echo "Command:"
echo "  export OPENHANDS_USE_ORCHESTRATOR=1"
echo "  python -m openhands.core.main_orchestrator --task 'Create a hello world Python script'"
echo ""

# Example 2: Task from file
echo "Example 2: Task from file"
echo "------------------------"
echo "Create a file task.txt with your task description, then:"
echo "  export OPENHANDS_USE_ORCHESTRATOR=1"
echo "  python -m openhands.core.main_orchestrator --file task.txt"
echo ""

# Example 3: GitHub issue resolution
echo "Example 3: GitHub issue resolution"
echo "----------------------------------"
echo "  export OPENHANDS_USE_ORCHESTRATOR=1"
echo "  python -m openhands.core.main_orchestrator \\"
echo "    --issue-title 'Add user authentication' \\"
echo "    --issue-body 'Implement JWT-based authentication for API endpoints'"
echo ""

# Example 4: With custom workspace
echo "Example 4: Custom workspace"
echo "--------------------------"
echo "  export OPENHANDS_USE_ORCHESTRATOR=1"
echo "  python -m openhands.core.main_orchestrator \\"
echo "    --task 'Refactor the database layer' \\"
echo "    --workspace /path/to/project"
echo ""

# Example 5: With specific agent type
echo "Example 5: Specific agent type"
echo "-----------------------------"
echo "  export OPENHANDS_USE_ORCHESTRATOR=1"
echo "  python -m openhands.core.main_orchestrator \\"
echo "    --task 'Analyze code quality and suggest improvements' \\"
echo "    --agent-cls analysis"
echo ""

# Example 6: SWE-bench evaluation
echo "Example 6: SWE-bench evaluation with orchestrator"
echo "------------------------------------------------"
echo "  python evaluation/benchmarks/swe_bench/run_infer_orchestrator.py \\"
echo "    --agent-cls CodeActAgent \\"
echo "    --llm-config llm_config \\"
echo "    --max-iterations 30 \\"
echo "    --eval-num-workers 4 \\"
echo "    --dataset-name princeton-nlp/SWE-bench_Lite \\"
echo "    --eval-note 'orchestrator-evaluation'"
echo ""

# Example 7: WebArena evaluation
echo "Example 7: WebArena evaluation with orchestrator"
echo "-----------------------------------------------"
echo "  export WEBARENA_BASE_URL=http://localhost"
echo "  export OPENAI_API_KEY=your_key"
echo "  python evaluation/benchmarks/webarena/run_infer_orchestrator.py \\"
echo "    --agent-cls BrowsingAgent \\"
echo "    --llm-config llm_config \\"
echo "    --max-iterations 30 \\"
echo "    --eval-note 'orchestrator-browser-test'"
echo ""

echo "=================================="
echo "For more information, see:"
echo "  docs/orchestrator_integration.md"
echo "=================================="
