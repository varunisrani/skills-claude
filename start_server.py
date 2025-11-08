#!/usr/bin/env python3
"""
Method 3: Python Auto-Start Script
Start OpenHands server with environment from .env file
"""

import os
import subprocess
import sys
from pathlib import Path

def load_env_file(env_path):
    """Load environment variables from .env file"""
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
    return env_vars

def main():
    print("\n" + "="*80)
    print("  OpenHands + Claude Agent SDK - Auto-Start Server")
    print("="*80 + "\n")

    # Get project root
    project_root = Path(__file__).parent / "OpenHands"
    env_file = project_root / ".env"

    print(f"Project Root: {project_root}")
    print(f"Env File: {env_file}")
    print()

    # Load environment variables
    print("Loading environment variables from .env...")
    env_vars = load_env_file(str(env_file))

    if env_vars:
        print(f"Loaded {len(env_vars)} environment variables:")
        for key, value in env_vars.items():
            if 'TOKEN' in key or 'KEY' in key or 'SECRET' in key:
                display_value = value[:20] + "..." if len(value) > 20 else value
            else:
                display_value = value
            print(f"  • {key}: {display_value}")
    else:
        print("Warning: No environment variables found in .env")

    print()

    # Update environment
    for key, value in env_vars.items():
        os.environ[key] = value

    print("Environment variables set!")
    print()

    # Verify configuration
    print("Verifying configuration...")
    base_url = os.getenv('ANTHROPIC_BASE_URL')
    auth_token = os.getenv('ANTHROPIC_AUTH_TOKEN')
    port = os.getenv('PORT', '3000')

    if base_url:
        print(f"  ✓ Base URL: {base_url}")
    else:
        print("  ✗ Base URL: NOT SET")

    if auth_token:
        print(f"  ✓ Auth Token: {auth_token[:20]}...")
    else:
        print("  ✗ Auth Token: NOT SET")

    print(f"  ✓ Port: {port}")
    print()

    # Start server
    print("="*80)
    print("Starting OpenHands Server...")
    print("="*80)
    print()
    print("The server will start on http://localhost:3000")
    print("Press Ctrl+C to stop the server")
    print()

    os.chdir(str(project_root))

    try:
        # Start the server
        subprocess.run(
            [sys.executable, "-m", "openhands.server.app", "--port", port],
            env=os.environ.copy()
        )
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
