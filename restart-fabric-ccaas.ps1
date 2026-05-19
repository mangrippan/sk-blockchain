# ============================================
# Restart Fabric Network (CCAAS Method)
# ============================================

Write-Host "🔄 Restarting Fabric network (CCAAS method)..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Stop existing network
Write-Host "Stopping existing network..." -ForegroundColor Yellow
Set-Location -Path "fabric-network"

if (Test-Path ".\stop-network.ps1") {
    .\stop-network.ps1
} else {
    # Fallback stop
    $testNetworkDir = ".\fabric-samples\test-network"
    if (Test-Path $testNetworkDir) {
        wsl -d Ubuntu -- bash -c "cd '/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/test-network' && ./network.sh down"
    }
}

Write-Host ""

# Wait a moment
Start-Sleep -Seconds 3

# Start network with CCAAS method
Write-Host "Starting network with CCAAS method..." -ForegroundColor Yellow
.\start-network-ccaas.ps1

$exitCode = $LASTEXITCODE

Set-Location -Path ".."

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Fabric network restarted successfully (CCAAS)" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to restart Fabric network" -ForegroundColor Red
    exit 1
}
