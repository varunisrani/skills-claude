@echo off
REM Set environment variables for pythonnet
set DOTNET_ROOT=%ProgramFiles%\dotnet
set PATH=%DOTNET_ROOT%;%PATH%

REM Verify .NET is installed
dotnet --version
if errorlevel 1 (
    echo ERROR: .NET SDK not found!
    pause
    exit /b 1
)

REM Run OpenHands server (without frontend)
echo Starting OpenHands server on port 3000 (API only - no frontend)...
set SERVE_FRONTEND=false
python -m openhands.server

pause
