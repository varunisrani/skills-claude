# Proper PowerShell Core Installation Script
Write-Host "=== PowerShell Core Installation ===" -ForegroundColor Cyan

# Check if already installed
$pwshInstalled = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwshInstalled) {
    Write-Host "PowerShell Core is already installed at: $($pwshInstalled.Source)" -ForegroundColor Green
    & pwsh --version
    exit 0
}

# Download PowerShell Core MSI
Write-Host "`nDownloading PowerShell 7.4.6..." -ForegroundColor Yellow
$url = "https://github.com/PowerShell/PowerShell/releases/download/v7.4.6/PowerShell-7.4.6-win-x64.msi"
$output = "$PSScriptRoot\PowerShell-7.4.6-win-x64.msi"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "Download complete: $output" -ForegroundColor Green
    Write-Host "File size: $((Get-Item $output).Length / 1MB) MB" -ForegroundColor Gray
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

# Install with visible output and error checking
Write-Host "`nInstalling PowerShell Core..." -ForegroundColor Yellow
Write-Host "This may take a few minutes and may show a UAC prompt..." -ForegroundColor Gray

try {
    # Run MSI with logging
    $logFile = "$PSScriptRoot\pwsh-install.log"
    $arguments = @(
        "/i"
        "`"$output`""
        "/qn"  # Quiet with no UI
        "ADD_EXPLORER_CONTEXT_MENU_OPENPOWERSHELL=1"
        "ADD_FILE_CONTEXT_MENU_RUNPOWERSHELL=1"
        "ENABLE_PSREMOTING=1"
        "REGISTER_MANIFEST=1"
        "USE_MU=1"
        "ENABLE_MU=1"
        "/norestart"
        "/l*v"
        "`"$logFile`""
    )

    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $arguments -Wait -PassThru -Verb RunAs

    if ($process.ExitCode -eq 0) {
        Write-Host "Installation completed successfully!" -ForegroundColor Green
    } elseif ($process.ExitCode -eq 3010) {
        Write-Host "Installation completed successfully (reboot required)" -ForegroundColor Yellow
    } else {
        Write-Host "Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
        Write-Host "Check log file: $logFile" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Installation error: $_" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup MSI file
    if (Test-Path $output) {
        Remove-Item -Path $output -Force -ErrorAction SilentlyContinue
    }
}

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$pwshPath = "C:\Program Files\PowerShell\7\pwsh.exe"
if (Test-Path $pwshPath) {
    Write-Host "PowerShell Core installed successfully!" -ForegroundColor Green
    Write-Host "Location: $pwshPath" -ForegroundColor Gray

    # Test it
    & $pwshPath --version

    # Check for DLL
    $dllPath = "C:\Program Files\PowerShell\7\System.Management.Automation.dll"
    if (Test-Path $dllPath) {
        Write-Host "`nSystem.Management.Automation.dll found!" -ForegroundColor Green
        Write-Host "Location: $dllPath" -ForegroundColor Gray
    } else {
        Write-Host "`nWARNING: System.Management.Automation.dll NOT found at $dllPath" -ForegroundColor Red
    }
} else {
    Write-Host "ERROR: PowerShell Core was not installed at the expected location" -ForegroundColor Red
    Write-Host "Expected: $pwshPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "Please restart your terminal for PATH changes to take effect" -ForegroundColor Yellow
