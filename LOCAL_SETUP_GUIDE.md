# Local Setup Guide: Run OpenHands with Claude Agent SDK on Port 3000
## Complete Step-by-Step Instructions for Testing

**Date:** November 9, 2025  
**Environment:** Windows 11 (Your Setup)  
**Node:** v22.18.0  
**Python:** 3.13.7  
**Target Port:** 3000  

---

## Quick Start (TL;DR)

```bash
# 1. Navigate to OpenHands project
cd C:\Users\Varun israni\skills-claude\OpenHands

# 2. Install dependencies
pip install -e .
npm install

# 3. Set environment variables
set ANTHROPIC_API_KEY=your-api-key-here
set AGENT_SDK_ENABLED=true

# 4. Run the server
python -m openhands.server.app --port 3000

# 5. Open browser
http://localhost:3000
```

---

## Part 1: Prerequisites & Setup

### Step 1: Get Claude API Key

**Option A: Using Claude API (Recommended)**

1. Go to: https://console.anthropic.com/
2. Sign in with your Anthropic account
3. Click "API Keys" in left sidebar
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-`)
6. Keep it safe - don't share it!

**Option B: Using Claude via Bedrock (AWS)**

If you prefer AWS:
1. Create AWS account
2. Enable Bedrock service
3. Request Claude model access
4. Get AWS credentials
5. Configure AWS CLI

**Option C: Using Claude via Vertex AI (Google Cloud)**

If you prefer GCP:
1. Create GCP project
2. Enable Vertex AI API
3. Configure authentication
4. Install Google Cloud SDK

**Recommendation:** Start with **Option A (Claude API)** - it's simplest

---

## Part 2: Environment Setup

### Step 2A: Create Environment File

Create a file: `C:\Users\Varun israni\skills-claude\OpenHands\.env`

```bash
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-your-key-here
CLAUDE_API_KEY=sk-ant-your-key-here

# Agent Configuration
AGENT_SDK_ENABLED=true
AGENT=CodeActAgent
USE_SDK=true

# Model Configuration
CLAUDE_MODEL=claude-sonnet-4-5-20250929
CLAUDE_MAX_TOKENS=4096

# Server Configuration
PORT=3000
HOST=localhost
LOG_LEVEL=INFO

# Optional: Workspace Configuration
WORKSPACE=/tmp/openhands_workspace
WORKSPACE_MOUNT_PATH=/tmp/openhands_workspace

# Optional: Feature Flags
FEATURE_FLAG_SDK_AGENTS=true
FEATURE_FLAG_MCP_SERVERS=true
FEATURE_FLAG_STREAMING=false

# Optional: Debug Mode
DEBUG=false
VERBOSE=true
```

### Step 2B: Windows PowerShell Setup

```powershell
# Create .env file
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
$env:AGENT_SDK_ENABLED = "true"
$env:AGENT = "CodeActAgent"
$env:PORT = "3000"
```

### Step 2C: Windows Command Prompt Setup

```batch
:: Create .env file
setx ANTHROPIC_API_KEY "sk-ant-your-key-here"
setx AGENT_SDK_ENABLED "true"
setx AGENT "CodeActAgent"
setx PORT "3000"

:: Verify
set | findstr ANTHROPIC
```

---

## Part 3: Installation Steps

### Step 3: Install OpenHands

```bash
# Navigate to project
cd "C:\Users\Varun israni\skills-claude\OpenHands"

# Install in editable mode (development)
pip install -e .

# Or install with all optional dependencies
pip install -e ".[all]"
```

**Expected Output:**
```
Successfully installed openhands-0.15.0
```

### Step 4: Install Node Dependencies

```bash
# Install frontend dependencies
npm install

# Install specific Claude SDK packages
npm install claude-agent-sdk
npm install @anthropic-ai/sdk
```

### Step 5: Install Optional Tools

```bash
# For Jupyter support
pip install jupyter jupyterlab ipython

# For browser automation
npm install playwright
npx playwright install

# For additional tools
pip install beautifulsoup4 requests selenium
```

---

## Part 4: Running the Server

### Option A: Run Python Server (Recommended for Testing)

```bash
# Navigate to project
cd "C:\Users\Varun israni\skills-claude\OpenHands"

# Run with SDK enabled
python -m openhands.server.app \
  --port 3000 \
  --host localhost \
  --use-sdk true \
  --agent CodeActAgent

# Or with environment variable
set AGENT_SDK_ENABLED=true
python -m openhands.server.app --port 3000
```

**Expected Output:**
```
Starting OpenHands Server...
Loading Claude Agent SDK...
Agent: CodeActAgent (SDK Version)
Server running on http://localhost:3000
Waiting for connections...
```

### Option B: Run with Docker (Alternative)

```bash
# Build Docker image
docker build -t openhands-sdk .

# Run container
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-your-key \
  -e AGENT_SDK_ENABLED=true \
  openhands-sdk
```

### Option C: Run Frontend Separately

```bash
# Terminal 1: Start Python backend
cd OpenHands
python -m openhands.server.app --port 8000

# Terminal 2: Start Node frontend
cd OpenHands/frontend
npm install
npm run dev -- --port 3000 --backend http://localhost:8000
```

---

## Part 5: Testing the Agent

### Test 1: Simple Code Execution (CodeActAgent)

```bash
# Navigate to project
cd "C:\Users\Varun israni\skills-claude\OpenHands"

# Run test script
python -c "
from openhands.agenthub.agent_factory import AgentFactory
from openhands.core.config import AgentConfig

# Create agent config
config = AgentConfig(
    agent_type='code',
    model='claude-sonnet-4-5-20250929'
)

# Create SDK agent
agent = AgentFactory.create_agent(
    agent_name='CodeActAgent',
    config=config,
    use_sdk=True
)

print(f'Agent created: {agent.__class__.__name__}')
print(f'Agent type: {type(agent)}')
print('✅ SDK Agent successfully instantiated!')
"
```

**Expected Output:**
```
Agent created: CodeActAgentSDK
Agent type: <class 'openhands.agenthub.codeact_agent.codeact_agent_sdk.CodeActAgentSDK'>
✅ SDK Agent successfully instantiated!
```

### Test 2: Run Agent with Task

```python
# Create test_agent.py
import asyncio
from openhands.agenthub.agent_factory import AgentFactory
from openhands.core.config import AgentConfig
from openhands.controller.state.state import State

async def test_agent():
    # Create config
    config = AgentConfig(
        agent_type='code',
        model='claude-sonnet-4-5-20250929'
    )
    
    # Create agent
    agent = AgentFactory.create_agent(
        agent_name='CodeActAgent',
        config=config,
        use_sdk=True
    )
    
    # Initialize agent
    await agent._initialize()
    
    # Create initial state
    state = State()
    
    # Run agent step
    action = agent.step(state)
    
    print(f"✅ Agent step executed successfully!")
    print(f"Action: {action}")
    
    # Cleanup
    await agent._cleanup()

# Run
asyncio.run(test_agent())
```

**Run it:**
```bash
python test_agent.py
```

### Test 3: Web Browser Test (BrowsingAgent)

```python
# Create test_browser.py
import asyncio
from openhands.agenthub.agent_factory import AgentFactory
from openhands.core.config import AgentConfig

async def test_browser():
    # Create config
    config = AgentConfig(
        agent_type='browsing',
        model='claude-sonnet-4-5-20250929'
    )
    
    # Create agent
    agent = AgentFactory.create_agent(
        agent_name='BrowsingAgent',
        config=config,
        use_sdk=True
    )
    
    print("✅ BrowsingAgent (SDK) created successfully!")
    print(f"Type: {type(agent).__name__}")

# Run
asyncio.run(test_browser())
```

---

## Part 6: API Usage Examples

### Example 1: Using Claude SDK Directly

```python
from anthropic import Anthropic

client = Anthropic(api_key="sk-ant-your-key")

# Simple completion
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello! What is 2 + 2?"}
    ]
)

print(message.content[0].text)
```

### Example 2: Using OpenHands API

```python
import requests

# Start a session
response = requests.post(
    "http://localhost:3000/api/sessions",
    json={"agent": "CodeActAgent"}
)

session_id = response.json()["session_id"]
print(f"Session created: {session_id}")

# Send task
task_response = requests.post(
    f"http://localhost:3000/api/sessions/{session_id}/tasks",
    json={"task": "What is 2 + 2?"}
)

print(task_response.json())
```

### Example 3: Using Agent SDK Agent

```python
from openhands.agenthub.agent_factory import AgentFactory
from openhands.core.config import AgentConfig

# Create agent
agent = AgentFactory.create_agent(
    agent_name="CodeActAgent",
    config=AgentConfig(model="claude-sonnet-4-5-20250929"),
    use_sdk=True  # ← This uses Claude Agent SDK
)

# Use agent
state = agent.initialize()
action = agent.step(state)
```

---

## Part 7: REST API Endpoints

### Available Endpoints (When Server Running on 3000)

**Sessions:**
```bash
# Create session
POST http://localhost:3000/api/sessions
Body: {"agent": "CodeActAgent"}

# Get session
GET http://localhost:3000/api/sessions/{session_id}

# Close session
DELETE http://localhost:3000/api/sessions/{session_id}
```

**Tasks:**
```bash
# Submit task
POST http://localhost:3000/api/sessions/{session_id}/tasks
Body: {"task": "your task here"}

# Get task status
GET http://localhost:3000/api/sessions/{session_id}/tasks/{task_id}

# Get task result
GET http://localhost:3000/api/sessions/{session_id}/tasks/{task_id}/result
```

**Agents:**
```bash
# List available agents
GET http://localhost:3000/api/agents

# Get agent info
GET http://localhost:3000/api/agents/{agent_name}
```

---

## Part 8: Recommended Claude SDK Solutions

### Option 1: Claude API (Simplest) ⭐ RECOMMENDED

**Pros:**
- ✅ Easiest setup (API key only)
- ✅ Latest models immediately available
- ✅ Fastest iteration
- ✅ Good for development/testing
- ✅ Pay per token (cost-effective for testing)

**Cons:**
- Limited to US data centers
- Requires internet connection

**Setup:**
```bash
# 1. Get API key from https://console.anthropic.com/
# 2. Set environment variable
set ANTHROPIC_API_KEY=sk-ant-your-key

# 3. Use it
python script.py
```

**Code Example:**
```python
from anthropic import Anthropic

client = Anthropic(api_key="sk-ant-your-key")
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hi!"}]
)
print(message.content[0].text)
```

---

### Option 2: AWS Bedrock (Enterprise) 🏢

**Pros:**
- ✅ Enterprise features
- ✅ VPC/Private endpoint support
- ✅ Cost optimization
- ✅ Multi-region support
- ✅ Additional AWS integration

**Cons:**
- More complex setup
- Requires AWS account
- Model access request needed

**Setup:**
```bash
# 1. Configure AWS CLI
aws configure

# 2. Install SDK
pip install boto3

# 3. Request Claude access in Bedrock console

# 4. Set environment
set AWS_REGION=us-east-1
set AWS_ACCESS_KEY_ID=your-key
set AWS_SECRET_ACCESS_KEY=your-secret
```

**Code Example:**
```python
import boto3

client = boto3.client('bedrock-runtime', region_name='us-east-1')

response = client.invoke_model(
    modelId='anthropic.claude-sonnet-4-5-20250929-v1:0',
    body=json.dumps({
        "messages": [{"role": "user", "content": "Hi!"}],
        "max_tokens": 1024
    })
)

print(response['body'].read())
```

---

### Option 3: Google Cloud Vertex AI 🔵

**Pros:**
- ✅ GCP ecosystem integration
- ✅ Multi-modal support
- ✅ Prompt caching
- ✅ Fine-tuning available

**Cons:**
- GCP-specific setup
- Requires Google Cloud account

**Setup:**
```bash
# 1. Install Google Cloud SDK
gcloud init

# 2. Install Python SDK
pip install google-cloud-aiplatform

# 3. Authenticate
gcloud auth application-default login

# 4. Set project
set GOOGLE_CLOUD_PROJECT=your-project-id
```

**Code Example:**
```python
from vertexai.generative_models import GenerativeModel

model = GenerativeModel("claude-3-5-sonnet@20241022")

response = model.generate_content("Hi!")
print(response.text)
```

---

## Part 9: Testing Checklist

### Pre-Launch Checks

```bash
# 1. Verify API key is set
echo %ANTHROPIC_API_KEY%

# 2. Check Python installation
python -c "import openhands; print('✅ OpenHands imported')"

# 3. Check Node installation
node -v && npm -v

# 4. Verify agent factory
python -c "from openhands.agenthub.agent_factory import AgentFactory; print('✅ Factory loaded')"

# 5. Test agent creation
python -c "
from openhands.agenthub.agent_factory import AgentFactory
from openhands.core.config import AgentConfig
agent = AgentFactory.create_agent('CodeActAgent', AgentConfig(), use_sdk=True)
print('✅ SDK Agent created')
"
```

### After Server Starts

```bash
# 1. Test endpoint availability
curl http://localhost:3000/api/agents

# 2. Create session
curl -X POST http://localhost:3000/api/sessions -H "Content-Type: application/json" -d "{\"agent\":\"CodeActAgent\"}"

# 3. Submit task
# (Use session_id from response above)
curl -X POST http://localhost:3000/api/sessions/SESSION_ID/tasks \
  -H "Content-Type: application/json" \
  -d "{\"task\":\"What is 2+2?\"}"

# 4. Check status
curl http://localhost:3000/api/sessions/SESSION_ID/tasks/TASK_ID
```

---

## Part 10: Troubleshooting

### Issue 1: "ANTHROPIC_API_KEY not found"

**Solution:**
```bash
# Check if set
echo %ANTHROPIC_API_KEY%

# If empty, set it
set ANTHROPIC_API_KEY=sk-ant-your-key-here

# Or in .env file
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Issue 2: "Port 3000 already in use"

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID 1234 /F

# Or use different port
python -m openhands.server.app --port 3001
```

### Issue 3: "Module not found: anthropic"

**Solution:**
```bash
# Install Python SDK
pip install anthropic

# Or install all dependencies
pip install -e .
pip install -r requirements.txt
```

### Issue 4: "Agent creation failed"

**Solution:**
```bash
# Enable verbose logging
set DEBUG=true
set LOG_LEVEL=DEBUG

# Run with detailed output
python -m openhands.server.app --port 3000 --verbose
```

### Issue 5: "MCP Server connection failed"

**Solution:**
```bash
# Install MCP dependencies
pip install mcp

# Install browser support
npm install playwright
npx playwright install

# Install Jupyter support
pip install jupyter ipython
```

---

## Part 11: Performance Tips

### Optimization 1: Use Connection Pooling

```python
from openhands.agenthub.agent_factory import AgentFactory

# Create once, reuse multiple times
agent = AgentFactory.create_agent(
    agent_name="CodeActAgent",
    use_sdk=True
)

# Use for multiple tasks
for task in tasks:
    action = agent.step(state)
```

### Optimization 2: Enable Prompt Caching

```python
from openhands.core.config import AgentConfig

config = AgentConfig(
    enable_prompt_cache=True,
    cache_ttl=3600  # 1 hour
)
```

### Optimization 3: Batch Requests

```python
# Don't do this (slow)
for item in large_list:
    response = call_api(item)

# Do this (faster)
responses = call_api_batch(large_list)
```

### Optimization 4: Async Operations

```python
import asyncio

async def run_agents():
    agents = [
        create_agent("CodeActAgent"),
        create_agent("BrowsingAgent"),
    ]
    
    results = await asyncio.gather(*[
        agent.step(state) for agent in agents
    ])
    
    return results

asyncio.run(run_agents())
```

---

## Part 12: Monitoring & Logs

### View Logs

```bash
# Windows PowerShell - tail logs
Get-Content -Path "logs/openhands.log" -Tail 50 -Wait

# Or in Python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Check Endpoint

```bash
# Check server health
curl http://localhost:3000/health

# Check agent status
curl http://localhost:3000/api/agents/CodeActAgent/status

# Check API key validity
curl -H "Authorization: Bearer sk-ant-your-key" \
     http://localhost:3000/api/validate-key
```

---

## Summary: Quick Reference

### Start OpenHands with SDK on Port 3000

```bash
# 1. Navigate to project
cd "C:\Users\Varun israni\skills-claude\OpenHands"

# 2. Set API key
set ANTHROPIC_API_KEY=sk-ant-your-key-here

# 3. Run server
python -m openhands.server.app --port 3000

# 4. Open browser
http://localhost:3000

# 5. Test API
curl http://localhost:3000/api/agents
```

### Available Agents to Test

- **CodeActAgent** - Code execution & file operations
- **BrowsingAgent** - Web browsing & automation
- **ReadOnlyAgent** - Safe file reading only
- **LOCAgent** - Code analysis & metrics
- **VisualBrowsingAgent** - Visual web interaction
- **DummyAgent** - Testing/demo purposes

### Recommended APIs to Use

**Option 1: Claude API** (Recommended)
- Simplest setup
- Best for testing/development
- Get key: https://console.anthropic.com/

**Option 2: AWS Bedrock**
- Enterprise features
- VPC support
- AWS integration

**Option 3: Google Vertex AI**
- GCP ecosystem
- Multi-modal support

---

**Setup Complete! You're ready to test Claude Agent SDK locally on port 3000.** 🚀

