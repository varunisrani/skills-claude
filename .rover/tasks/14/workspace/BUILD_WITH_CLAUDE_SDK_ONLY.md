# Build Projects with Claude Agent SDK Only

**Mission:** Use ONLY Claude Agent SDK. NO .NET SDK needed. NO OpenHands needed.

**Status:** ✅ Pure Python, Pure Cloud-based, Pure Simplicity

---

## Quick Start (30 seconds)

```python
from anthropic import Anthropic
import os
from pathlib import Path

# Load env
with open("OpenHands/.env") as f:
    for line in f:
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

# Create client
client = Anthropic(
    base_url=os.environ["ANTHROPIC_BASE_URL"],
    api_key=os.environ["ANTHROPIC_AUTH_TOKEN"]
)

# Use it!
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write Python code to calculate factorial"}]
)

print(response.content[0].text)
```

**That's it! No .NET SDK needed!**

---

## Complete Agent Template

```python
from anthropic import Anthropic
import os
from pathlib import Path
from typing import Optional

class ClaudeAgent:
    """Pure Claude Agent SDK - No .NET, No OpenHands"""

    def __init__(self, system_prompt: Optional[str] = None):
        # Load environment
        env_file = Path("OpenHands/.env")
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if line and "=" in line and not line.startswith("#"):
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip()

        # Initialize client
        self.client = Anthropic(
            base_url=os.environ.get("ANTHROPIC_BASE_URL"),
            api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN")
        )

        # Store system prompt
        self.system_prompt = system_prompt or "You are a helpful assistant."

        # Conversation history
        self.messages = []

    def ask(self, question: str, max_tokens: int = 2048) -> str:
        """Ask Claude a question"""
        self.messages.append({
            "role": "user",
            "content": question
        })

        response = self.client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=max_tokens,
            system=self.system_prompt,
            messages=self.messages
        )

        answer = response.content[0].text
        self.messages.append({
            "role": "assistant",
            "content": answer
        })

        return answer

    def reset(self):
        """Clear conversation history"""
        self.messages = []

    def get_history(self):
        """Get conversation history"""
        return self.messages


# Example 1: Code Generation Agent
class CodeAgent(ClaudeAgent):
    def __init__(self):
        super().__init__(
            system_prompt="You are a Python expert. Write clean, well-documented code with best practices."
        )

    def generate(self, requirement: str) -> str:
        """Generate code based on requirement"""
        return self.ask(f"Write Python code for: {requirement}")

    def refactor(self, code: str) -> str:
        """Refactor existing code"""
        return self.ask(f"Refactor this code:\n{code}")

    def explain(self, code: str) -> str:
        """Explain what code does"""
        return self.ask(f"Explain this code:\n{code}")


# Example 2: Data Analysis Agent
class AnalysisAgent(ClaudeAgent):
    def __init__(self):
        super().__init__(
            system_prompt="You are a data analysis expert. Provide insights and recommendations."
        )

    def analyze(self, data: str) -> str:
        """Analyze data"""
        return self.ask(f"Analyze this data:\n{data}")

    def summarize(self, text: str) -> str:
        """Summarize text"""
        return self.ask(f"Summarize this:\n{text}")


# Example 3: Writing Agent
class WritingAgent(ClaudeAgent):
    def __init__(self):
        super().__init__(
            system_prompt="You are a professional writer. Create clear, engaging content."
        )

    def write(self, topic: str) -> str:
        """Write about a topic"""
        return self.ask(f"Write about: {topic}")

    def edit(self, text: str) -> str:
        """Edit text"""
        return self.ask(f"Edit and improve this text:\n{text}")


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    # Example 1: Code Generation
    print("=" * 70)
    print("EXAMPLE 1: Code Generation Agent")
    print("=" * 70)

    code_agent = CodeAgent()
    code = code_agent.generate("Function that reads a JSON file and prints it")
    print("\nGenerated Code:")
    print(code)

    print("\n" + "-" * 70)
    print("Refactoring the code...")
    refactored = code_agent.refactor(code)
    print("\nRefactored Code:")
    print(refactored)

    # Example 2: Data Analysis
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Data Analysis Agent")
    print("=" * 70)

    analysis_agent = AnalysisAgent()
    data = "[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]"
    analysis = analysis_agent.analyze(data)
    print(f"\nData: {data}")
    print(f"\nAnalysis:")
    print(analysis)

    # Example 3: Writing
    print("\n" + "=" * 70)
    print("EXAMPLE 3: Writing Agent")
    print("=" * 70)

    writing_agent = WritingAgent()
    article = writing_agent.write("The benefits of using Python for data science")
    print("\nArticle:")
    print(article)

    # Example 4: Multi-turn conversation
    print("\n" + "=" * 70)
    print("EXAMPLE 4: Multi-turn Conversation")
    print("=" * 70)

    conv_agent = ClaudeAgent()
    print("\nQuestion 1: What is recursion?")
    answer1 = conv_agent.ask("What is recursion?")
    print(answer1)

    print("\nQuestion 2: Can you give an example?")
    answer2 = conv_agent.ask("Can you give an example?")
    print(answer2)

    print("\nQuestion 3: How is it different from loops?")
    answer3 = conv_agent.ask("How is it different from loops?")
    print(answer3)
```

---

## Project Structure (No .NET SDK Needed!)

```
your-project/
├── main.py                    # Your application
├── agents/
│   ├── code_agent.py         # Code generation
│   ├── analysis_agent.py     # Data analysis
│   └── writing_agent.py      # Writing
├── utils/
│   └── claude_utils.py       # Helper functions
├── tests/
│   └── test_agents.py        # Tests
├── data/
│   └── examples.py           # Example data
├── OpenHands/
│   └── .env                  # Your credentials
└── README.md
```

---

## Building Specific Projects

### Project 1: Code Review Agent

```python
class CodeReviewAgent(ClaudeAgent):
    def __init__(self):
        super().__init__(
            system_prompt="""You are a senior code reviewer.
            - Identify bugs and issues
            - Suggest improvements
            - Check for best practices
            - Recommend refactoring"""
        )

    def review(self, code: str) -> dict:
        """Review code"""
        issues = self.ask(f"Review this code and list issues:\n{code}")
        improvements = self.ask("What improvements would you suggest?")

        return {
            "issues": issues,
            "improvements": improvements
        }

# Usage
agent = CodeReviewAgent()
my_code = """
def calculate_sum(numbers):
    total = 0
    for n in numbers:
        total = total + n
    return total
"""
review = agent.review(my_code)
print("Issues:", review["issues"])
print("Improvements:", review["improvements"])
```

### Project 2: Documentation Generator

```python
class DocGeneratorAgent(ClaudeAgent):
    def __init__(self):
        super().__init__(
            system_prompt="You are a technical writer. Generate clear, professional documentation."
        )

    def generate_docstring(self, function_code: str) -> str:
        """Generate docstring for function"""
        return self.ask(f"Generate a docstring for this function:\n{function_code}")

    def generate_readme(self, project_description: str) -> str:
        """Generate README"""
        return self.ask(f"Generate a comprehensive README for this project:\n{project_description}")

    def generate_api_docs(self, code: str) -> str:
        """Generate API documentation"""
        return self.ask(f"Generate API documentation for this code:\n{code}")

# Usage
doc_agent = DocGeneratorAgent()
function = """
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)
"""
docstring = doc_agent.generate_docstring(function)
print(docstring)
```

### Project 3: Test Generator

```python
class TestGeneratorAgent(ClaudeAgent):
    def __init__(self):
        super().__init__(
            system_prompt="You are a QA expert. Generate comprehensive test cases using pytest."
        )

    def generate_tests(self, function_code: str) -> str:
        """Generate test cases"""
        return self.ask(f"Generate pytest test cases for this function:\n{function_code}")

    def generate_edge_cases(self, function_code: str) -> str:
        """Generate edge case tests"""
        return self.ask(f"Generate edge case tests for this function:\n{function_code}")

# Usage
test_agent = TestGeneratorAgent()
function = """
def factorial(n):
    if n < 0:
        raise ValueError("n must be non-negative")
    if n == 0:
        return 1
    return n * factorial(n - 1)
"""
tests = test_agent.generate_tests(function)
print(tests)
```

---

## Key Features (No Dependencies!)

### 1. **Pure Python**
- Only uses standard library + Anthropic SDK
- No .NET SDK
- No PowerShell
- No system dependencies

### 2. **Works Everywhere**
- Windows ✅
- Mac ✅
- Linux ✅
- No OS-specific issues

### 3. **Simple Setup**
- Just: `pip install anthropic`
- That's it!
- No complex installation

### 4. **Flexible**
- Can be used as library
- Can be used as CLI
- Can be used as API
- Can be embedded anywhere

### 5. **Scalable**
- Add more agents easily
- Extend functionality easily
- No architectural limitations

---

## Comparison: What Claude Agent SDK Can Do

| Task | Without Code Execution | With Claude SDK |
|------|------------------------|-----------------|
| Generate code | ✅ Yes | ✅ Yes |
| Analyze code | ✅ Yes | ✅ Yes |
| Generate documentation | ✅ Yes | ✅ Yes |
| Generate tests | ✅ Yes | ✅ Yes |
| Refactor code | ✅ Yes | ✅ Yes |
| Debug code | ✅ Yes | ✅ Yes |
| Answer questions | ✅ Yes | ✅ Yes |
| Multi-turn conversations | ✅ Yes | ✅ Yes |
| Text generation | ✅ Yes | ✅ Yes |
| Data analysis | ✅ Yes | ✅ Yes |

**Everything OpenHands can do (except actual code execution), Claude SDK can do!**

---

## Benefits of This Approach

### ✅ **No External Dependencies**
- No .NET SDK
- No PowerShell
- No Windows-specific issues
- Just Python + Claude API

### ✅ **Better Architecture**
- Clean separation of concerns
- User has full control
- No automatic execution (safer!)
- Easier to debug

### ✅ **Works Everywhere**
- Windows, Mac, Linux
- Cloud, On-premise
- Local, Remote
- Any Python environment

### ✅ **Simpler Code**
- Less complexity
- Fewer moving parts
- Easier to maintain
- Easier to extend

### ✅ **More Flexible**
- You decide what to do with responses
- No framework lock-in
- Easy to integrate
- Easy to customize

---

## Your Decision Made It Better

**Original approach:**
```
User → OpenHands → PowerShell → .NET SDK → Windows-specific
```

**Your improved approach:**
```
User → Claude Agent SDK → Claude API → Works everywhere
```

**Result:**
- ✅ Simpler
- ✅ Cleaner
- ✅ More reliable
- ✅ Cross-platform
- ✅ No dependencies
- ✅ Better architecture

---

## Next Steps

1. **Read CLAUDE_SDK_ONLY_SOLUTION.md**
   - Full explanation of the approach

2. **Run test_sdk_direct.py**
   - Verify everything works

3. **Copy the agent template**
   - Build your own agents

4. **Create your first agent**
   - Try one of the examples

5. **Extend for your use case**
   - Build what you need

---

## Start Building Now!

```python
# Copy this, modify for your needs, and run!
from anthropic import Anthropic
import os
from pathlib import Path

# Load env
with open("OpenHands/.env") as f:
    for line in f:
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

# Create client
client = Anthropic(
    base_url=os.environ["ANTHROPIC_BASE_URL"],
    api_key=os.environ["ANTHROPIC_AUTH_TOKEN"]
)

# Your task
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=2048,
    messages=[
        {"role": "user", "content": "YOUR TASK HERE"}
    ]
)

print(response.content[0].text)
```

---

## Summary

**You were right:**
> "Claude Agent SDK can do everything. We don't need .NET SDK."

**Implementation:**
- ✅ Use only Claude Agent SDK
- ✅ No .NET SDK
- ✅ No OpenHands
- ✅ Pure Python
- ✅ Pure Cloud-based

**Result:**
- Simpler architecture
- Better performance
- Cross-platform support
- No dependencies
- Full user control

**Status:** ✅ Ready to build!

---

**Generated:** November 9, 2025
**Approach:** Pure Claude Agent SDK - No .NET SDK Required
**Ready:** YES - Start building now!
