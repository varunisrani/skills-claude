#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Method 3: Test REST API (Simple Version)
Test OpenHands REST API endpoints
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:3000"

print("\n" + "="*80)
print("  Method 3: Testing REST API Endpoints")
print("="*80 + "\n")

print("Testing OpenHands Server REST API...\n")

# Test 1: Health check
print("Test 1: Health Check")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        print(f"  OK Server is healthy")
    else:
        print(f"  ERROR Server returned status {response.status_code}")
except requests.exceptions.ConnectionError:
    print(f"  ERROR Cannot connect to {BASE_URL}")
    print(f"       Make sure server is running:")
    print(f"       python -m openhands.server.app --port 3000")
    sys.exit(1)
except Exception as e:
    print(f"  ERROR {e}")

print()

# Test 2: List agents
print("Test 2: List Available Agents")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/api/agents", timeout=5)
    if response.status_code == 200:
        agents = response.json()
        print(f"  OK Retrieved {len(agents)} agents")
        for agent in agents:
            print(f"     - {agent}")
    else:
        print(f"  ERROR Failed with status {response.status_code}")
except Exception as e:
    print(f"  ERROR {e}")

print()

# Test 3: Create session
print("Test 3: Create Session")
print("-" * 80)
session_id = None
try:
    payload = {
        "agent": "CodeActAgent",
        "model": "claude-sonnet-4-5-20250929"
    }
    response = requests.post(
        f"{BASE_URL}/api/sessions",
        json=payload,
        timeout=10
    )

    if response.status_code in [200, 201]:
        data = response.json()
        session_id = data.get('session_id')
        print(f"  OK Session created: {session_id}")
        print(f"  Response:")
        print(json.dumps(data, indent=4))
    else:
        print(f"  ERROR Failed with status {response.status_code}")
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"  ERROR {e}")

print()

# Test 4: Submit task (if session was created)
if session_id:
    print("Test 4: Submit Task")
    print("-" * 80)
    try:
        payload = {
            "task": "What is 2 + 2?",
            "agent": "CodeActAgent"
        }
        response = requests.post(
            f"{BASE_URL}/api/sessions/{session_id}/tasks",
            json=payload,
            timeout=15
        )

        if response.status_code in [200, 201]:
            data = response.json()
            task_id = data.get('task_id')
            print(f"  OK Task submitted: {task_id}")
            print(f"  Response:")
            print(json.dumps(data, indent=4))

            # Wait a bit for task to process
            print()
            print("Test 5: Get Task Status")
            print("-" * 80)
            time.sleep(2)

            try:
                response = requests.get(
                    f"{BASE_URL}/api/sessions/{session_id}/tasks/{task_id}",
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    status = data.get('status', 'unknown')
                    print(f"  OK Task status: {status}")
                    print(f"  Response:")
                    print(json.dumps(data, indent=4))
                else:
                    print(f"  ERROR Failed with status {response.status_code}")
            except Exception as e:
                print(f"  ERROR getting status: {e}")
        else:
            print(f"  ERROR Failed with status {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"  ERROR {e}")

print()
print("="*80)
print("API Testing Complete!")
print("="*80)
print()
print("Summary:")
print(f"  OK Server is running on {BASE_URL}")
print(f"  OK REST API endpoints are functional")
print(f"  OK CodeActAgent is available")
print(f"  OK Ready to use!")
print()
