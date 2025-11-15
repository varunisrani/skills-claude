@echo off
REM Quick Start Script for OpenHands with Claude Agent SDK on Port 3000
REM Windows Batch File
REM Usage: Run this file to start the server immediately

color 0A
title OpenHands with Claude Agent SDK - Port 3000
cls

echo.
echo ====================================================================
echo  OpenHands with Claude Agent SDK - Quick Start
echo ====================================================================
echo.

REM Check if API key is set
if "%ANTHROPIC_API_KEY%"=="" (
    echo ERROR: ANTHROPIC_API_KEY not set!
    echo.
    echo Please set your API key first:
    echo   setx ANTHROPIC_API_KEY "sk-ant-your-key-here"
    echo.
    echo Get your API key from: https://console.anthropic.com/
    echo.
    pause
    exit /b 1
)

echo ✓ API Key found: %ANTHROPIC_API_KEY:~0,10%...
echo.

REM Navigate to project
cd /d "C:\Users\Varun israni\skills-claude\OpenHands"
echo ✓ Changed directory to: %CD%
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.13+
    pause
    exit /b 1
)
echo ✓ Python found: 
python --version
echo.

REM Install dependencies (if needed)
echo Checking dependencies...
pip show openhands >nul 2>&1
if errorlevel 1 (
    echo Installing OpenHands...
    pip install -e . >nul 2>&1
    echo ✓ OpenHands installed
) else (
    echo ✓ OpenHands already installed
)
echo.

REM Set environment variables
set AGENT_SDK_ENABLED=true
set AGENT=CodeActAgent
set USE_SDK=true
set CLAUDE_MODEL=claude-sonnet-4-5-20250929
set LOG_LEVEL=INFO
set DEBUG=false

echo ====================================================================
echo  Configuration
echo ====================================================================
echo Agent SDK Enabled: %AGENT_SDK_ENABLED%
echo Agent Type: %AGENT%
echo Using SDK: %USE_SDK%
echo Model: %CLAUDE_MODEL%
echo Port: 3000
echo.

REM Display instructions
echo ====================================================================
echo  Starting Server...
echo ====================================================================
echo.
echo Once the server starts, you can:
echo   1. Open browser: http://localhost:3000
echo   2. Test API: curl http://localhost:3000/api/agents
echo   3. Create session: POST http://localhost:3000/api/sessions
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python -m openhands.server.app --port 3000

REM Pause if error
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start server
    pause
    exit /b 1
)
