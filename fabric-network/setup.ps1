# ============================================================
# Hyperledger Fabric Network Setup Script (Windows PowerShell)
# Downloads fabric-samples, binaries, and Docker images
# ============================================================

$ErrorActionPreference = "Stop"

$FABRIC_VERSION = "2.5.4"
$CA_VERSION = "1.5.7"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ChainRank - Fabric Network Setup (Windows)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
try {
    docker info 2>$null | Out-Null
    Write-Host "Ã¢Å"â€¦ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Ã¢ÂÅ' Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Download Fabric samples
if (!(Test-Path "fabric-samples")) {
    Write-Host ""
    Write-Host "Ã°Å¸"Â¦ Downloading Hyperledger Fabric samples, binaries, and Docker images..." -ForegroundColor Yellow
    Write-Host "   This may take several minutes..."
    Write-Host ""
    
    # Download install script
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh" -OutFile "install-fabric.sh"
    
    # Run via WSL or Git Bash
    if (Get-Command wsl -ErrorAction SilentlyContinue) {
        wsl bash ./install-fabric.sh --fabric-version $FABRIC_VERSION --ca-version $CA_VERSION
    } elseif (Get-Command bash -ErrorAction SilentlyContinue) {
        bash ./install-fabric.sh --fabric-version $FABRIC_VERSION --ca-version $CA_VERSION
    } else {
        Write-Host "Ã¢ÂÅ' Need WSL or Git Bash to run Fabric install script." -ForegroundColor Red
        Write-Host "   Install WSL: wsl --install" -ForegroundColor Yellow
        Remove-Item "install-fabric.sh" -ErrorAction SilentlyContinue
        exit 1
    }
    
    Remove-Item "install-fabric.sh" -ErrorAction SilentlyContinue
} else {
    Write-Host "Ã¢Å"â€¦ fabric-samples already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Ã¢Å"â€¦ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: .\start-network.ps1"
Write-Host "  2. This will start the network and deploy chaincode"
Write-Host ""
