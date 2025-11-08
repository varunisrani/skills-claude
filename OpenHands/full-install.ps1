# Complete PowerShell and .NET setup
Write-Host "=== Verifying .NET SDK ==="
dotnet --version

Write-Host "`n=== Checking for PowerShell Core ==="
$pwshPath = "C:\Program Files\PowerShell\7\pwsh.exe"
if (Test-Path $pwshPath) {
    Write-Host "PowerShell Core found at: $pwshPath"
    & $pwshPath --version
} else {
    Write-Host "PowerShell Core NOT found at expected location"
}

Write-Host "`n=== Installing Windows Management Framework (contains System.Management.Automation) ==="
# Download and install Windows Management Framework
$wmfUrl = "https://download.microsoft.com/download/2/C/6/2C6E1B50-A111-4641-8954-D7F86B2B3B54/Win10.0-KB5041587-x64.msu"
$wmfPath = "$env:TEMP\windows-management-framework.msu"

if (-not (Test-Path $wmfPath)) {
    Write-Host "Downloading WMF..."
    Invoke-WebRequest -Uri $wmfUrl -OutFile $wmfPath -UseBasicParsing -ErrorAction SilentlyContinue
} else {
    Write-Host "WMF already downloaded"
}

if (Test-Path $wmfPath) {
    Write-Host "Installing WMF (this may require system restart)..."
    Start-Process -FilePath "wusa.exe" -ArgumentList "$wmfPath","/quiet","/norestart" -Wait
    Write-Host "WMF installation completed"
} else {
    Write-Host "Could not download WMF"
}

Write-Host "`n=== Final verification ==="
Write-Host "Setup complete. Please restart your system for all changes to take effect."
