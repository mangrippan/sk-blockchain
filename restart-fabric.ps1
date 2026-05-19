# ============================================
# ChainRank - Clean Restart Fabric Network
# ============================================
# This script properly cleans up old chaincode containers
# and restarts the Fabric network

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ChainRank - Fabric Network Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# 1. Stop old chaincode containers and CouchDB
Write-Host "[1/3] Stopping old chaincode containers and CouchDB..." -ForegroundColor Yellow
docker stop peer0.org1.example.com_chainrank_ccaas peer0.org2.example.com_chainrank_ccaas 2>$null
docker rm peer0.org1.example.com_chainrank_ccaas peer0.org2.example.com_chainrank_ccaas 2>$null
docker stop peer0org1_chainrank_ccaas peer0org2_chainrank_ccaas 2>$null
docker rm peer0org1_chainrank_ccaas peer0org2_chainrank_ccaas 2>$null
docker stop couchdb0 couchdb1 2>$null
docker rm couchdb0 couchdb1 2>$null

if ($LASTEXITCODE -eq 0 -or $true) {
    Write-Host "Old chaincode containers and CouchDB removed" -ForegroundColor Green
}

Write-Host ""

# 2. Stop Fabric network
Write-Host "[2/3] Stopping Fabric network..." -ForegroundColor Yellow
Set-Location -Path "fabric-network"

if (Test-Path ".\stop-network.ps1") {
    .\stop-network.ps1
    Write-Host "Fabric network stopped" -ForegroundColor Green
} else {
    Write-Host "stop-network.ps1 not found, cleaning up manually..." -ForegroundColor Yellow
    wsl -d Ubuntu -- bash -c "cd fabric-network/fabric-samples/test-network && ./network.sh down"
}

Set-Location -Path ".."
Write-Host ""

# 3. Start Fabric network with fresh deployment
Write-Host "[3/3] Starting Fabric network with fresh deployment..." -ForegroundColor Yellow
Set-Location -Path "fabric-network"

if (Test-Path ".\start-network.ps1") {
    .\start-network.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Fabric network started successfully!" -ForegroundColor Green
    } else {
        Write-Host "Network start completed, checking status..." -ForegroundColor Yellow
        
        # Verify if containers are actually running
        Set-Location -Path ".."
        Write-Host ""
        Write-Host "Checking container status..." -ForegroundColor Cyan
        docker ps --filter "name=peer0" --format "table {{.Names}}\t{{.Status}}"
        docker ps --filter "name=orderer" --format "table {{.Names}}\t{{.Status}}"
        docker ps --filter "name=chainrank" --format "table {{.Names}}\t{{.Status}}"
        
        Write-Host ""
        Write-Host "If all containers show 'Up', the network is running correctly." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "start-network.ps1 not found in fabric-network folder" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

Set-Location -Path ".."

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Fabric Network Restarted Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To verify chaincode is working:" -ForegroundColor Cyan
Write-Host "  cd fabric-network" -ForegroundColor Gray
Write-Host "  node enrollUser.js" -ForegroundColor Gray
Write-Host "  cd .." -ForegroundColor Gray
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  node test-fabric-connection.js" -ForegroundColor Gray
Write-Host ""
