"""
API Usage Examples for TaskOrchestrator Integration

This example demonstrates how to use the TaskOrchestrator through
the REST API endpoints.

Usage:
    # Start the OpenHands server with orchestrator routes
    python -m openhands.server

    # Run the examples
    python examples/orchestrator_integration/api_usage.py
"""

import requests
import time
import json


def example_simple_task():
    """Example: Execute a simple task via API."""
    print("\n" + "=" * 60)
    print("Example 1: Simple Task Execution")
    print("=" * 60)

    # Submit task
    response = requests.post(
        "http://localhost:3000/api/orchestrator/task",
        json={
            "task": "Create a Python function to calculate fibonacci numbers",
            "agent_type": "code",
            "max_iterations": 20
        }
    )

    if response.status_code != 200:
        print(f"Error submitting task: {response.text}")
        return

    result = response.json()
    task_id = result["task_id"]
    print(f"Task submitted: {task_id}")
    print(f"Status: {result['status']}")

    # Poll for completion
    print("\nWaiting for task to complete...")
    while True:
        status_response = requests.get(
            f"http://localhost:3000/api/orchestrator/status/{task_id}"
        )

        if status_response.status_code != 200:
            print(f"Error getting status: {status_response.text}")
            break

        status = status_response.json()
        print(f"Status: {status['status']}, Iteration: {status['iteration']}")

        if status["status"] in ("completed", "failed"):
            break

        time.sleep(2)

    # Get result
    if status["status"] == "completed":
        result_response = requests.get(
            f"http://localhost:3000/api/orchestrator/result/{task_id}"
        )

        if result_response.status_code == 200:
            result = result_response.json()
            print("\nTask completed!")
            print(f"Agent State: {result['agent_state']}")
            print(f"Iterations: {result['iteration']}")
            print(f"Result: {json.dumps(result['result'], indent=2)}")
        else:
            print(f"Error getting result: {result_response.text}")
    else:
        print(f"\nTask failed: {status.get('error')}")


def example_github_issue():
    """Example: Resolve a GitHub issue via API."""
    print("\n" + "=" * 60)
    print("Example 2: GitHub Issue Resolution")
    print("=" * 60)

    # Submit GitHub issue task
    response = requests.post(
        "http://localhost:3000/api/orchestrator/github-issue",
        json={
            "title": "Add error handling to API endpoints",
            "body": """
            ## Description
            API endpoints currently don't handle errors consistently.

            ## Requirements
            - Add try-catch blocks
            - Return proper HTTP status codes
            - Log errors appropriately

            ## Files
            - api/routes.py
            - api/handlers.py
            """,
            "max_iterations": 50
        }
    )

    if response.status_code != 200:
        print(f"Error submitting task: {response.text}")
        return

    result = response.json()
    task_id = result["task_id"]
    print(f"Task submitted: {task_id}")
    print(f"Status: {result['status']}")

    # Poll for completion (same as above)
    print("\nWaiting for GitHub issue workflow to complete...")
    print("This may take several minutes...")

    while True:
        status_response = requests.get(
            f"http://localhost:3000/api/orchestrator/status/{task_id}"
        )

        if status_response.status_code != 200:
            print(f"Error getting status: {status_response.text}")
            break

        status = status_response.json()
        print(f"Status: {status['status']}, Iteration: {status['iteration']}")

        if status["status"] in ("completed", "failed"):
            break

        time.sleep(5)

    # Get result
    if status["status"] == "completed":
        result_response = requests.get(
            f"http://localhost:3000/api/orchestrator/result/{task_id}"
        )

        if result_response.status_code == 200:
            result = result_response.json()
            print("\nGitHub issue resolved!")
            print(f"Agent State: {result['agent_state']}")
            print(f"Iterations: {result['iteration']}")
        else:
            print(f"Error getting result: {result_response.text}")
    else:
        print(f"\nTask failed: {status.get('error')}")


def example_health_check():
    """Example: Check API health."""
    print("\n" + "=" * 60)
    print("Example 3: Health Check")
    print("=" * 60)

    response = requests.get("http://localhost:3000/api/orchestrator/health")

    if response.status_code == 200:
        health = response.json()
        print(f"Service: {health['service']}")
        print(f"Status: {health['status']}")
        print(f"Active Tasks: {health['active_tasks']}")
    else:
        print(f"Error: {response.text}")


if __name__ == "__main__":
    print("=" * 60)
    print("TaskOrchestrator API Usage Examples")
    print("=" * 60)
    print("\nMake sure the OpenHands server is running:")
    print("  python -m openhands.server")
    print("")

    # Run examples
    try:
        example_health_check()
        example_simple_task()
        # example_github_issue()  # Uncomment to run this longer example

        print("\n" + "=" * 60)
        print("Examples completed!")
        print("=" * 60)

    except requests.exceptions.ConnectionError:
        print("\nError: Could not connect to OpenHands server.")
        print("Make sure it's running on http://localhost:3000")
    except Exception as e:
        print(f"\nError: {e}")
