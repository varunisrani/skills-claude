# Quick Start: Claude Agent SDK

**Status:** ✅ Ready to Use Now
**No Additional Installation Required**

---

## 1. Basic Setup (One-Time)

```python
import os
from pathlib import Path
from anthropic import Anthropic

# Load environment variables
env_file = Path("OpenHands/.env")
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()

# Create client (one time, reuse it)
client = Anthropic(
    base_url=os.environ.get("ANTHROPIC_BASE_URL"),
    api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN"),
)

print("Claude Agent SDK initialized!")
```

---

## 2. Simple Message Example

```python
# Send a message and get a response
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Say hello and explain what you can do."}
    ]
)

print(response.content[0].text)
```

**Output:**
```
Hello! I'm Claude, an AI assistant made by Anthropic. I can help with a wide
variety of tasks including:

- Writing and editing
- Analysis and research
- Math and programming
- Creative projects
- Problem-solving
- And much more!

What would you like help with?
```

---

## 3. Multi-Turn Conversation

```python
# Maintain conversation history
messages = []

def chat(user_input):
    """Add user message and get response"""
    messages.append({
        "role": "user",
        "content": user_input
    })

    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=messages
    )

    assistant_response = response.content[0].text
    messages.append({
        "role": "assistant",
        "content": assistant_response
    })

    return assistant_response

# Example conversation
print(chat("What is Python?"))
print(chat("How do I create a function?"))
print(chat("Can you show me an example?"))
```

---

## 4. Code Generation

```python
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": """Write a Python function that:
1. Takes a list of numbers as input
2. Returns the sum of even numbers
3. Includes error handling
"""
        }
    ]
)

code = response.content[0].text
print(code)
```

**Output:**
```python
def sum_even_numbers(numbers):
    """
    Calculate the sum of even numbers in a list.

    Args:
        numbers: A list of numbers

    Returns:
        The sum of all even numbers in the list

    Raises:
        TypeError: If input is not a list or contains non-numeric values
    """
    if not isinstance(numbers, list):
        raise TypeError("Input must be a list")

    total = 0
    for num in numbers:
        if not isinstance(num, (int, float)):
            raise TypeError(f"All elements must be numbers, got {type(num)}")
        if num % 2 == 0:
            total += num

    return total

# Test
print(sum_even_numbers([1, 2, 3, 4, 5, 6]))  # Output: 12
```

---

## 5. System Instructions (Custom Behavior)

```python
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    system="You are a helpful Python expert. Always provide clear, well-commented code.",
    messages=[
        {
            "role": "user",
            "content": "Write a class for managing a to-do list"
        }
    ]
)

print(response.content[0].text)
```

---

## 6. JSON Response Mode

```python
import json

response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": """Return a JSON object with:
- name: A random person's name
- age: A random age
- skills: A list of 3 skills
- experience_years: Years of experience"""
        }
    ]
)

# Parse JSON response
response_text = response.content[0].text

# Handle markdown code blocks
if response_text.startswith("```json"):
    response_text = response_text.split("```json")[1].split("```")[0]
elif response_text.startswith("```"):
    response_text = response_text.split("```")[1].split("```")[0]

data = json.loads(response_text)
print(json.dumps(data, indent=2))
```

**Output:**
```json
{
  "name": "Sarah Johnson",
  "age": 32,
  "skills": ["Python", "Data Analysis", "Machine Learning"],
  "experience_years": 7
}
```

---

## 7. Document Analysis

```python
document = """
The Claude Agent SDK is a powerful tool for building AI applications.
It provides:
- Easy-to-use client library
- Support for multiple models
- Token counting and management
- Vision capabilities
- Tool use and function calling
"""

response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": f"""Analyze this document and provide:
1. Main topic
2. Key features (as bullet points)
3. Use cases

Document:
{document}"""
        }
    ]
)

print(response.content[0].text)
```

---

## 8. Building a Simple Agent

```python
class SimpleAgent:
    """A simple agent that can reason and respond to queries"""

    def __init__(self, client, model="claude-sonnet-4-5-20250929"):
        self.client = client
        self.model = model
        self.conversation_history = []

    def ask(self, question):
        """Ask the agent a question"""
        self.conversation_history.append({
            "role": "user",
            "content": question
        })

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system="You are a helpful AI assistant. Provide clear, accurate answers.",
            messages=self.conversation_history
        )

        assistant_message = response.content[0].text
        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })

        return assistant_message

    def reset(self):
        """Clear conversation history"""
        self.conversation_history = []

# Use the agent
agent = SimpleAgent(client)
print(agent.ask("What is machine learning?"))
print(agent.ask("How is it different from deep learning?"))
print(agent.ask("Can you give me a practical example?"))
```

---

## 9. Error Handling

```python
from anthropic import APIError, APIConnectionError

def safe_chat(client, message):
    """Chat with error handling"""
    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[{"role": "user", "content": message}]
        )
        return response.content[0].text

    except APIConnectionError as e:
        return f"Connection error: {e}"
    except APIError as e:
        return f"API error: {e}"
    except Exception as e:
        return f"Unexpected error: {e}"

# Safe usage
result = safe_chat(client, "Hello Claude!")
print(result)
```

---

## 10. Using Your Environment Setup

```python
import os
from pathlib import Path
from anthropic import Anthropic

def setup_client():
    """Load environment and create client"""
    # Load from .env file
    env_path = Path("OpenHands/.env")
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

    # Create and return client
    return Anthropic(
        base_url=os.environ.get("ANTHROPIC_BASE_URL"),
        api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN")
    )

# Usage
client = setup_client()
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=100,
    messages=[{"role": "user", "content": "Say 'Hello from Claude Agent SDK!'"}]
)
print(response.content[0].text)
```

---

## Complete Example: Todo Agent

```python
from anthropic import Anthropic
import json
from pathlib import Path
import os

# Setup
def load_env():
    env_path = Path("OpenHands/.env")
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

load_env()
client = Anthropic(
    base_url=os.environ.get("ANTHROPIC_BASE_URL"),
    api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN")
)

# Todo Agent
class TodoAgent:
    def __init__(self):
        self.todos = []

    def process_command(self, command):
        """Use Claude to understand and process todo commands"""

        # Ask Claude to understand the command
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=500,
            system="""You are a todo list assistant. Parse user commands and respond with JSON:
{
    "action": "add" | "list" | "remove" | "complete",
    "item": "description if needed",
    "id": "number if needed"
}""",
            messages=[
                {"role": "user", "content": f"Process this todo command: {command}"}
            ]
        )

        response_text = response.content[0].text

        # Parse JSON
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]

        action_data = json.loads(response_text)

        # Execute action
        if action_data["action"] == "add":
            self.todos.append({"id": len(self.todos) + 1, "task": action_data["item"], "done": False})
            return f"Added: {action_data['item']}"

        elif action_data["action"] == "list":
            return f"Your todos: {json.dumps(self.todos, indent=2)}"

        elif action_data["action"] == "complete":
            for todo in self.todos:
                if todo["id"] == action_data["id"]:
                    todo["done"] = True
            return f"Completed todo {action_data['id']}"

        return "Command processed"

# Use it
agent = TodoAgent()
print(agent.process_command("Add buy groceries"))
print(agent.process_command("Show my todos"))
print(agent.process_command("Mark todo 1 as done"))
```

---

## Tips & Tricks

### 1. Token Counting

```python
# Count tokens before sending
from anthropic import Anthropic

client = Anthropic(...)

message_content = "Your long message here..."
# Use the client's token counting if available
```

### 2. Streaming Responses

```python
# Stream responses for real-time output
with client.messages.stream(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a poem about AI"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### 3. Vision (Images)

```python
import base64

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")

response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": encode_image("path/to/image.jpg")
                    }
                },
                {
                    "type": "text",
                    "text": "What's in this image?"
                }
            ]
        }
    ]
)

print(response.content[0].text)
```

---

## Resources

- **Official Docs:** https://docs.anthropic.com
- **SDK Reference:** https://github.com/anthropics/anthropic-sdk-python
- **Your Test File:** `test_sdk_direct.py` (proven working)
- **Your Config:** `OpenHands/.env` (credentials loaded)

---

## You're Ready! 🚀

Your Claude Agent SDK is fully functional. Start building!

```bash
cd C:\Users\Varun israni\skills-claude
python test_sdk_direct.py  # Verify
# Then build your own application!
```

---

**Generated:** November 9, 2025
**Status:** ✅ Ready to Use
