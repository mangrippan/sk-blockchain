# ============================================================
# Start Fabric Network + Deploy Chaincode (Windows PowerShell)
# ============================================================

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path $SCRIPT_DIR -Parent
$CHAINCODE_PATH = Join-Path $PROJECT_ROOT "chaincode"
$CHANNEL_NAME = "mychannel"
$CHAINCODE_NAME = "chainrank"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Starting Fabric Network" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check fabric-samples exists
if (!(Test-Path "$SCRIPT_DIR\fabric-samples")) {
    Write-Host "❌ fabric-samples not found. Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

$env:PATH = "$SCRIPT_DIR\fabric-samples\bin;$env:PATH"
$env:FABRIC_CFG_PATH = "$SCRIPT_DIR\fabric-samples\config"

$testNetworkDir = "$SCRIPT_DIR\fabric-samples\test-network"

# Use WSL/bash to run network scripts (Fabric scripts are bash-only)
if (!(Get-Command wsl -ErrorAction SilentlyContinue) -and !(Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Host "❌ WSL or Git Bash required to run Fabric network scripts." -ForegroundColor Red
    Write-Host "   Install WSL: wsl --install" -ForegroundColor Yellow
    exit 1
}

$shell = if (Get-Command wsl -ErrorAction SilentlyContinue) { "wsl" } else { "bash" }

# Convert Windows paths to WSL paths
$wslChaincodePath = if ($shell -eq "wsl") {
    $CHAINCODE_PATH -replace '\\','/' -replace 'C:','/mnt/c'
} else {
    $CHAINCODE_PATH -replace '\\','/'
}

$wslTestNetworkDir = if ($shell -eq "wsl") {
    $testNetworkDir -replace '\\','/' -replace 'C:','/mnt/c'
} else {
    $testNetworkDir -replace '\\','/'
}

# Bring down existing network
Write-Host "🧹 Cleaning up existing network..."
& $shell -c "cd '$wslTestNetworkDir' && ./network.sh down 2>/dev/null; true"

# Start network
Write-Host "🚀 Starting test-network with CA..." -ForegroundColor Yellow
& $shell -c "cd '$wslTestNetworkDir' && ./network.sh up createChannel -c $CHANNEL_NAME -ca"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start network" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Network is up! Channel '$CHANNEL_NAME' created." -ForegroundColor Green
Write-Host ""

# Deploy chaincode
Write-Host "📦 Deploying chaincode '$CHAINCODE_NAME'..." -ForegroundColor Yellow
& $shell -c "cd '$wslTestNetworkDir' && ./network.sh deployCC -ccn $CHAINCODE_NAME -ccp '$wslChaincodePath' -ccl javascript -c $CHANNEL_NAME"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy chaincode" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Chaincode deployed!" -ForegroundColor Green

# Copy connection profile
$connDir = Join-Path $PROJECT_ROOT "fabric-config"
if (!(Test-Path $connDir)) { New-Item -ItemType Directory -Path $connDir | Out-Null }

$srcProfile = "$testNetworkDir\organizations\peerOrganizations\org1.example.com\connection-org1.json"
$destProfile = Join-Path $connDir "connection-org1.json"

if (Test-Path $srcProfile) {
    Copy-Item $srcProfile $destProfile -Force
    Write-Host "✅ Connection profile saved to fabric-config\connection-org1.json" -ForegroundColor Green
}

# Enroll appUser
Write-Host ""
Write-Host "👤 Enrolling appUser..." -ForegroundColor Yellow
Push-Location $SCRIPT_DIR
node enrollUser.js
Pop-Location

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ Fabric Network Ready!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Set FABRIC_ENABLED=true in backend/.env to use blockchain" -ForegroundColor Yellow
Write-Host ""
