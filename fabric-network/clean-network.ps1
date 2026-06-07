# ============================================================
# Clean Fabric Network - Remove all containers, volumes, and artifacts
# Use this when you encounter ledger conflicts or need a fresh start
# ============================================================

$ErrorActionPreference = "Continue"

$SCRIPT_DIR = $PSScriptRoot
$testNetworkDir = "$SCRIPT_DIR\fabric-samples\test-network"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Cleaning Fabric Network" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to convert Windows path to WSL path
function ConvertTo-WslPath($winPath) {
    $p = $winPath -replace '\\','/'
    if ($p -match '^([A-Za-z]):(.*)') {
        $drive = $Matches[1].ToLower()
        $rest = $Matches[2]
        return "/mnt/$drive$rest"
    }
    return $p
}

$wslTestNetworkDir = ConvertTo-WslPath $testNetworkDir

# Step 1: Stop the network
Write-Host "Step 1: Stopping network..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "cd '$wslTestNetworkDir' && ./network.sh down 2>/dev/null; true"
Write-Host "✓ Network stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Remove all Fabric containers
Write-Host "Step 2: Removing Fabric containers..." -ForegroundColor Yellow
docker ps -a --format "{{.Names}}" | Select-String -Pattern "peer|orderer|ca_|prima" | ForEach-Object {
    $containerName = $_.ToString()
    Write-Host "  Removing container: $containerName" -ForegroundColor Gray
    docker rm -f $containerName 2>$null
}
Write-Host "✓ Containers removed" -ForegroundColor Green
Write-Host ""

# Step 3: Remove Docker volumes (this is where ledger data persists)
Write-Host "Step 3: Removing Docker volumes with ledger data..." -ForegroundColor Yellow
docker volume ls --format "{{.Name}}" | Select-String -Pattern "peer|orderer" | ForEach-Object {
    $volumeName = $_.ToString()
    Write-Host "  Removing volume: $volumeName" -ForegroundColor Gray
    docker volume rm $volumeName 2>$null
}
Write-Host "✓ Volumes removed" -ForegroundColor Green
Write-Host ""

# Step 4: Clean up local artifacts
Write-Host "Step 4: Cleaning up local artifacts..." -ForegroundColor Yellow

# Remove chaincode package
$packageFile = Join-Path $SCRIPT_DIR "prima_ccaas.tar.gz"
if (Test-Path $packageFile) {
    Remove-Item $packageFile -Force
    Write-Host "  Removed chaincode package" -ForegroundColor Gray
}

# Clean chaincode-ccaas directory
$ccaasDir = Join-Path $SCRIPT_DIR "chaincode-ccaas"
if (Test-Path $ccaasDir) {
    Remove-Item $ccaasDir -Recurse -Force
    Write-Host "  Removed chaincode-ccaas directory" -ForegroundColor Gray
}

# Remove wallet (will need to be re-enrolled)
$walletDir = Join-Path (Split-Path $SCRIPT_DIR -Parent) "fabric-config\wallet"
if (Test-Path $walletDir) {
    Remove-Item $walletDir -Recurse -Force
    Write-Host "  Removed wallet (will need re-enrollment)" -ForegroundColor Gray
}

Write-Host "✓ Artifacts cleaned" -ForegroundColor Green
Write-Host ""

# Step 5: Prune unused Docker resources
Write-Host "Step 5: Pruning unused Docker resources..." -ForegroundColor Yellow
docker system prune -f --volumes 2>$null | Out-Null
Write-Host "✓ Docker cleanup complete" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✓ Network cleaned successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: .\start-network-ccaas.ps1" -ForegroundColor White
Write-Host "  2. Run: node ..\backend\enroll-wallet.js" -ForegroundColor White
Write-Host "  3. Restart backend: pm2 restart prima-backend" -ForegroundColor White
Write-Host ""
