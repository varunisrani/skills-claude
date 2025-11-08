# Claude Agent SDK - Proof of Concept

This directory contains POC scripts to validate the Claude Agent SDK integration approach for OpenHands.

## Files

- **poc_simple_query.py** - Simple query demonstration using Claude Agent SDK
- **test_file_1.py** - Sample Python file with TODO comments
- **test_file_2.py** - Another sample file with TODO comments

## Setup

1. Install Claude Code CLI:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. Install Claude Agent SDK:
   ```bash
   pip install claude-agent-sdk
   ```

3. Set your API key:
   ```bash
   export ANTHROPIC_API_KEY='your-api-key-here'
   ```

## Running the POC

```bash
cd /home/user/skills-claude/OpenHands/poc
python poc_simple_query.py
```

## Expected Behavior

The POC script should:
1. Connect to Claude Code CLI
2. Use the Read/Grep tools to find TODO comments
3. Return a list of all TODO items with file names and line numbers
4. Clean up automatically

## Success Criteria

- ✅ Script runs without errors
- ✅ Claude finds all TODO comments in test files
- ✅ Tool usage is visible in output
- ✅ Automatic cleanup occurs
- ✅ No manual intervention required

## Next Steps

After validating this POC:
1. Implement custom MCP tools (Jupyter, Browser)
2. Create specialized agent prompts
3. Build Agent Hub
4. Implement Task Orchestrator
