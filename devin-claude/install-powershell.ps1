
# Install PowerShell Core
Write-Host "Downloading PowerShell Core..."
$url = "https://github.com/PowerShell/PowerShell/releases/download/v7.4.1/PowerShell-7.4.1-win-x64.msi"
$output = "powershell-core.msi"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
Write-Host "Installing PowerShell Core..."
Start-Process -FilePath msiexec.exe -ArgumentList "/i","$output","/quiet","/norestart" -Wait
Write-Host "PowerShell Core installation completed"
Remove-Item -Path $output -Force -ErrorAction SilentlyContinue
