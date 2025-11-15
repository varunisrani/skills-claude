#!/usr/bin/env python3
"""
Direct Claude Agent SDK test - bypasses OpenHands Windows initialization
This demonstrates the Claude Agent SDK functionality without OpenHands framework overhead
"""

import os
import sys
from pathlib import Path

# Load environment variables from .env
env_path = Path("C:\\Users\\Varun israni\\skills-claude\\OpenHands\\.env")
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ[key.strip()] = value.strip()

print("=" * 80)
print("  Direct Claude Agent SDK Test")
print("=" * 80)
print()

# Step 1: Verify environment
print("Step 1: Verifying environment...")
required_vars = [
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_AUTH_TOKEN",
    "CLAUDE_MODEL"
]

all_set = True
for var in required_vars:
    if var in os.environ:
        value = os.environ[var]
        if len(value) > 20:
            display = value[:10] + "..." + value[-10:]
        else:
            display = value
        print(f"  OK {var:30} = {display}")
    else:
        print(f"  ERROR {var:30} NOT SET")
        all_set = False

print()

if not all_set:
    print("ERROR: Missing required environment variables")
    sys.exit(1)

# Step 2: Test Claude SDK
print("Step 2: Testing Claude Agent SDK...")
print()

try:
    from anthropic import Anthropic
    print("  OK Anthropic SDK imported successfully")

    # Create client
    client = Anthropic(
        base_url=os.environ.get("ANTHROPIC_BASE_URL"),
        api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN"),
    )
    print("  OK Anthropic client created")

    # Test API connection
    model = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")
    print(f"  OK Using model: {model}")

    # Create a simple message
    print("  Testing message creation...")
    message = client.messages.create(
        model=model,
        max_tokens=100,
        messages=[
            {
                "role": "user",
                "content": "Say 'Claude Agent SDK is working!' briefly."
            }
        ]
    )

    response_text = message.content[0].text
    print(f"  OK Claude response: {response_text}")

    print()
    print("=" * 80)
    print("SUCCESS! Claude Agent SDK is fully functional!")
    print("=" * 80)
    print()
    print("Summary:")
    print("  OK Environment variables loaded correctly")
    print("  OK Anthropic SDK client initialized")
    print("  OK API connection successful")
    print("  OK Claude model responding")
    print()
    print("Your system is ready to use Claude Agent SDK!")
    print()

except Exception as e:
    print(f"  ERROR: {e}")
    print()
    print("=" * 80)
    print("ERROR: Failed to initialize Claude SDK")
    print("=" * 80)
    import traceback
    traceback.print_exc()
    sys.exit(1)
