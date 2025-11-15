# Why .NET SDK? What Does OpenHands Use It For?

**Question:** Why does OpenHands need .NET SDK? What is it used for?

**Answer:** Great question! Let me explain clearly.

---

## The Short Answer

.NET SDK is used by **OpenHands for Windows code execution only**.

Your Claude Agent SDK works perfectly **WITHOUT it**.

---

## What's Happening

### 1. Two Different Things

```
Claude Agent SDK          OpenHands Framework
─────────────────────────────────────────────
✅ Works now              ⚠️ Needs .NET SDK
✅ No extra setup         ⚠️ Windows-specific
✅ Talks to Claude API    ⚠️ Runs code locally
```

### 2. Why OpenHands Needs .NET SDK on Windows

OpenHands is a framework that **executes code locally** on your machine.

When you submit a task like "Create a file called hello.txt":
1. Claude says "I'll execute this command for you"
2. OpenHands needs to **run the command** on your Windows machine
3. To run commands, OpenHands uses **Windows PowerShell**
4. PowerShell (on modern Windows) requires **.NET SDK**

**Visual Flow:**
```
Your Task
   ↓
Claude Agent SDK (talks to Claude API)
   ↓
Claude says "Execute this code"
   ↓
OpenHands Framework (runs code locally)
   ↓
Needs PowerShell to execute
   ↓
PowerShell needs .NET SDK
   ↓
✓ Code executes on your machine
```

### 3. What Code Does It Execute?

Examples of tasks that need code execution:

```python
# Task 1: Create a file
"Create a file called hello.txt with content 'Hello World'"
# OpenHands needs to run: echo "Hello World" > hello.txt

# Task 2: Run Python code
"Create a Python script that calculates factorial"
# OpenHands needs to run: python script.py

# Task 3: List files
"What files are in the current directory?"
# OpenHands needs to run: dir (or ls)

# Task 4: Install package
"Install numpy"
# OpenHands needs to run: pip install numpy
```

All these require **executing commands** on your Windows machine.

---

## Why Claude Agent SDK Doesn't Need It

Claude Agent SDK is different:

```
Claude Agent SDK
   ↓
Just talks to Claude API (over the internet)
   ↓
Claude sends back text responses
   ↓
✓ No local code execution
✓ No PowerShell needed
✓ No .NET SDK needed
```

Examples of what Claude Agent SDK does:
```python
# Ask Claude a question
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "What is Python?"}]
)
# Claude responds with text
print(response.content[0].text)
# No code executed locally - just text exchange!
```

---

## Real World Comparison

### Scenario 1: Using Claude Agent SDK (Works Now ✅)

```
You → "Write a Python function to calculate factorial"
         ↓
    Claude Agent SDK sends request to Claude API
         ↓
    Claude responds: "Here's the code: def factorial(n)..."
         ↓
You receive the code text
     (Claude doesn't execute it, just gives you the code)
     (No .NET SDK needed!)
```

### Scenario 2: Using OpenHands (Needs .NET SDK ⚠️)

```
You → "Create a file with a Python function for factorial"
         ↓
    OpenHands asks Claude: "How do I create this file?"
         ↓
    Claude responds: "Run: echo '...' > factorial.py"
         ↓
    OpenHands tries to execute: echo '...' > factorial.py
         ↓
    Needs PowerShell to run the command
         ↓
    PowerShell needs .NET SDK on Windows
         ↓
    File gets created on your machine
         (File actually exists after this!)
```

---

## The Key Difference

| Feature | Claude Agent SDK | OpenHands |
|---------|------------------|-----------|
| **What it does** | Talks to Claude API | Runs code on your machine |
| **Uses PowerShell** | No | Yes (on Windows) |
| **Needs .NET SDK** | No | Yes (on Windows) |
| **Creates files** | No (just text) | Yes (actual files) |
| **Executes commands** | No | Yes |
| **Works now** | ✅ Yes | ⚠️ No (needs .NET SDK) |

---

## Technical Details

### How OpenHands Executes Code on Windows

```
OpenHands Framework
    ↓
windows_bash.py module
    ↓
pythonnet library
    ↓
Tries to load PowerShell
    ↓
PowerShell requires:
  - System.Management.Automation assembly
  - Which needs .NET SDK
    ↓
If .NET SDK not installed:
  ✗ PowerShell can't load
  ✗ Code execution fails
  ✗ Error: "Failed to load PowerShell SDK components"
```

### Error You Got

```
ERROR: PowerShell and .NET SDK are required but not properly configured
Failed to load PowerShell SDK components
Details: Could not load file or assembly 'System.Management.Automation'
```

This error means:
- ✗ .NET SDK not installed
- ✗ PowerShell components not available
- ✓ Claude Agent SDK still works fine (doesn't need PowerShell)

---

## What's Inside .NET SDK

.NET SDK contains:
- **PowerShell Core** - Modern PowerShell runtime
- **Runtime Libraries** - System assemblies like Management.Automation
- **Compiler** - For compiling .NET code
- **Development Tools** - Various utilities

For OpenHands, it only cares about the **PowerShell components**.

---

## Visual Architecture

```
YOUR SYSTEM
├─ Python 3.13.7 ✅
├─ Anthropic SDK ✅
│  └─ Claude Agent SDK ✅ (works now)
│
├─ OpenHands Framework ⚠️ (needs .NET SDK on Windows)
│  └─ windows_bash.py
│     └─ pythonnet
│        └─ PowerShell
│           └─ .NET SDK ❌ (not installed)
│
└─ .NET SDK ❌ (optional, only needed for OpenHands)
   └─ PowerShell Core
      └─ System assemblies
         └─ Management.Automation
```

---

## Decision Tree

```
Do you want to:

1. Use Claude Agent SDK directly?
   → No .NET SDK needed ✅
   → Start building now
   → Use test_sdk_direct.py

2. Use OpenHands Web UI on port 3000?
   → Install .NET SDK (~10 minutes) ⚠️
   → Then run: python -m openhands.server.app --port 3000

3. Not sure?
   → Start with option 1 (Claude Agent SDK)
   → Build and test first
   → Install .NET SDK later if you need OpenHands
```

---

## Summary

**Why .NET SDK?**
- OpenHands needs it to execute code on Windows via PowerShell

**Does Claude Agent SDK need it?**
- No! Claude Agent SDK only talks to Claude API

**Should you install it?**
- Only if you want the OpenHands web UI
- You can skip it and use Claude Agent SDK directly
- Installing it takes ~10 minutes if you change your mind later

**What should you do now?**
- Use Claude Agent SDK (works perfectly now)
- Skip .NET SDK for now
- Install it later if you want OpenHands web UI

---

## Real Example

### Without .NET SDK (Claude Agent SDK - Works Now) ✅

```python
from anthropic import Anthropic

client = Anthropic(
    base_url="https://api.z.ai/api/anthropic",
    api_key="your-api-key"
)

# Works perfectly!
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Write a Python function to sort a list"}
    ]
)

print(response.content[0].text)
# Output: "Here's a function: def sort_list(items): return sorted(items)"
# (Claude gives you code as text - doesn't execute it)
```

### With .NET SDK (OpenHands - Optional) ⚠️

```
You → "Create a Python file that sorts a list"
       ↓
OpenHands (with .NET SDK):
  1. Asks Claude how to do it
  2. Executes: python create_sorter.py
  3. Actually creates the file on your machine
  4. (Uses PowerShell via .NET SDK)
```

---

## Bottom Line

```
Claude Agent SDK:     ✅ Works now, no .NET SDK needed
OpenHands:          ⚠️ Needs .NET SDK on Windows (optional)

You can:
→ Build with Claude Agent SDK now (recommended)
→ Install .NET SDK later if you want OpenHands
→ Or skip OpenHands entirely and use Claude Agent SDK
```

Your choice!

---

**Generated:** November 9, 2025
**Key Point:** .NET SDK is OPTIONAL. Your Claude Agent SDK works perfectly without it!
