# Pre-package chaincode in Windows to avoid Docker build issues in WSL
$ErrorActionPreference = "Stop"

$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path $SCRIPT_DIR -Parent
$CHAINCODE_PATH = Join-Path $PROJECT_ROOT "chaincode"
$PACKAGE_FILE = Join-Path $SCRIPT_DIR "chainrank.tar.gz"

Write-Host "Packaging chaincode..." -ForegroundColor Yellow

# Ensure chaincode dependencies are installed
Push-Location $CHAINCODE_PATH
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing chaincode dependencies..." -ForegroundColor Gray
    npm install --production
}
Pop-Location

# Create metadata
$metadata = @{
    type = "node"
    label = "chainrank_1.0"
} | ConvertTo-Json

$metadataDir = Join-Path $env:TEMP "chaincode-metadata"
if (Test-Path $metadataDir) { Remove-Item $metadataDir -Recurse -Force }
New-Item -ItemType Directory -Path $metadataDir | Out-Null
$metadata | Out-File -FilePath (Join-Path $metadataDir "metadata.json") -Encoding utf8

# Create package using tar (requires WSL or tar.exe)
Write-Host "Creating chaincode package..." -ForegroundColor Gray

# Create temp script file to avoid quoting issues
$tempScript = Join-Path $env:TEMP "package-chaincode.sh"
@"
#!/bin/bash
cd /tmp || exit 1
rm -rf chaincode-pkg
mkdir -p chaincode-pkg
cd chaincode-pkg || exit 1

# Create code directory and copy chaincode
mkdir code
cp /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/chaincode/*.js code/
cp /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/chaincode/package.json code/
if [ -d /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/chaincode/lib ]; then
  mkdir -p code/lib
  cp /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/chaincode/lib/*.js code/lib/
fi
if [ -d /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/chaincode/META-INF ]; then
  mkdir -p code/META-INF
  cp -r /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/chaincode/META-INF/* code/META-INF/
fi

# Create metadata.json
cat > metadata.json <<'METAEOF'
{
  "type": "node",
  "label": "chainrank_1.0"
}
METAEOF

# Create tar package with proper structure
tar czf /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/chainrank.tar.gz code metadata.json
"@ -replace "`r`n", "`n" | Out-File -FilePath $tempScript -Encoding utf8 -NoNewline

# Convert to WSL path and execute
$wslScript = ConvertTo-WslPath $tempScript
wsl -d Ubuntu -- bash $wslScript

# Cleanup
Remove-Item $tempScript

# Check if file was created successfully
Start-Sleep -Seconds 1
if (Test-Path $PACKAGE_FILE) {
    $fileSize = (Get-Item $PACKAGE_FILE).Length
    Write-Host "Chaincode packaged successfully: $PACKAGE_FILE ($fileSize bytes)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Failed to create package" -ForegroundColor Red
    exit 1
}
