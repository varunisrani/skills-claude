# Diagnostic script to check PowerShell installation

Write-Host "=== Checking PowerShell Installation ===" -ForegroundColor Cyan

# Check PowerShell Core executables
Write-Host "`n1. Checking for pwsh.exe in PATH:" -ForegroundColor Yellow
$pwshPaths = $env:PATH -split ';' | ForEach-Object {
    $testPath = Join-Path $_ "pwsh.exe"
    if (Test-Path $testPath) {
        $testPath
    }
}
if ($pwshPaths) {
    $pwshPaths | ForEach-Object { Write-Host "  Found: $_" -ForegroundColor Green }
} else {
    Write-Host "  Not found in PATH" -ForegroundColor Red
}

# Check standard PowerShell Core installation locations
Write-Host "`n2. Checking standard PowerShell Core locations:" -ForegroundColor Yellow
$standardPaths = @(
    "$env:ProgramFiles\PowerShell\7",
    "$env:ProgramFiles\PowerShell\7-preview",
    "${env:ProgramFiles(x86)}\PowerShell\7"
)
foreach ($path in $standardPaths) {
    if (Test-Path $path) {
        Write-Host "  Found directory: $path" -ForegroundColor Green
        $dllPath = Join-Path $path "System.Management.Automation.dll"
        if (Test-Path $dllPath) {
            Write-Host "    DLL Found: $dllPath" -ForegroundColor Green
        } else {
            Write-Host "    DLL NOT Found: $dllPath" -ForegroundColor Red
        }
    }
}

# Check Windows PowerShell
Write-Host "`n3. Checking Windows PowerShell 5.1:" -ForegroundColor Yellow
$winPSPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0"
if (Test-Path $winPSPath) {
    Write-Host "  Found directory: $winPSPath" -ForegroundColor Green
    $dllPath = Join-Path $winPSPath "System.Management.Automation.dll"
    if (Test-Path $dllPath) {
        Write-Host "    DLL Found: $dllPath" -ForegroundColor Green
    } else {
        Write-Host "    DLL NOT Found: $dllPath" -ForegroundColor Red
    }
}

# Check .NET SDK
Write-Host "`n4. Checking .NET SDK:" -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  .NET SDK Version: $dotnetVersion" -ForegroundColor Green
    } else {
        Write-Host "  .NET SDK not found or not working" -ForegroundColor Red
    }
} catch {
    Write-Host "  .NET SDK not found: $_" -ForegroundColor Red
}

# Try running pwsh --version
Write-Host "`n5. Checking pwsh version:" -ForegroundColor Yellow
try {
    $pwshVersion = & pwsh --version 2>$null
    if ($?) {
        Write-Host "  PowerShell Version: $pwshVersion" -ForegroundColor Green
        $pwshExe = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
        if ($pwshExe) {
            Write-Host "  pwsh.exe location: $pwshExe" -ForegroundColor Green
            $pwshDir = Split-Path $pwshExe -Parent
            $dllPath = Join-Path $pwshDir "System.Management.Automation.dll"
            Write-Host "  Checking for DLL at: $dllPath" -ForegroundColor Yellow
            if (Test-Path $dllPath) {
                Write-Host "    DLL EXISTS!" -ForegroundColor Green
            } else {
                Write-Host "    DLL NOT FOUND" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  pwsh command not working" -ForegroundColor Red
    }
} catch {
    Write-Host "  pwsh not found: $_" -ForegroundColor Red
}

Write-Host "`n=== Diagnostic Complete ===" -ForegroundColor Cyan
