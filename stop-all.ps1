# ============================================
# ChainRank - Stop All Services
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ChainRank - Stopping All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# 1. Stop Chaincode Containers (CCAAS)
Write-Host "[1/3] Stopping Chaincode Containers..." -ForegroundColor Yellow
$chaincodeContainers = docker ps -q --filter "name=chainrank.org"
if ($chaincodeContainers) {
    docker stop $chaincodeContainers
    docker rm $chaincodeContainers
    Write-Host "Chaincode containers stopped" -ForegroundColor Green
} else {
    Write-Host "No chaincode containers running" -ForegroundColor Gray
}
Write-Host ""

# 2. Stop Fabric Network
Write-Host "[2/3] Stopping Hyperledger Fabric Network..." -ForegroundColor Yellow
Set-Location -Path "fabric-network"

if (Test-Path ".\stop-network.ps1") {
    .\stop-network.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Fabric network stopped successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to stop Fabric network" -ForegroundColor Red
    }
} else {
    Write-Host "stop-network.ps1 not found in fabric-network folder" -ForegroundColor Red
}

Set-Location -Path ".."
Write-Host ""

# 3. Stop Database
Write-Host "[3/3] Stopping PostgreSQL Database..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database stopped successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to stop database" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Services Stopped!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Backend and Frontend terminals may still be open." -ForegroundColor Yellow
Write-Host "Please close them manually or press Ctrl+C in each terminal." -ForegroundColor Yellow
Write-Host ""
Write-Host "To delete all data (reset database), run:" -ForegroundColor Gray
Write-Host "  docker compose -f docker-compose.dev.yml down -v" -ForegroundColor Cyan
Write-Host ""
