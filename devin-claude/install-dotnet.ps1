
# Download and install .NET SDK 8
Write-Host "Downloading .NET 8 SDK..."
$url = "https://dotnetcli.blob.core.windows.net/dotnet/Sdk/8.0.404/dotnet-sdk-8.0.404-win-x64.exe"
$output = "dotnet-sdk.exe"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
Write-Host "Installation starting..."
Start-Process -FilePath $output -ArgumentList "/install /quiet /norestart" -Wait -PassThru
Write-Host ".NET SDK 8 installation completed"
Remove-Item -Path $output -Force -ErrorAction SilentlyContinue
Write-Host "Verifying installation..."
dotnet --version
