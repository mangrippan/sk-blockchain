# ============================================================
# Start Fabric Network + Deploy Chaincode (Windows PowerShell)
# ============================================================

$ErrorActionPreference = "Continue"

$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path $SCRIPT_DIR -Parent
$CHAINCODE_PATH = Join-Path $PROJECT_ROOT "chaincode"
$CHANNEL_NAME = "skchannel"
$CHAINCODE_NAME = "chainrank"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Starting Fabric Network" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check fabric-samples exists
if (!(Test-Path "$SCRIPT_DIR\fabric-samples")) {
    Write-Host "fabric-samples not found. Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

$env:PATH = "$SCRIPT_DIR\fabric-samples\bin;$env:PATH"
$env:FABRIC_CFG_PATH = "$SCRIPT_DIR\fabric-samples\config"

$testNetworkDir = "$SCRIPT_DIR\fabric-samples\test-network"

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

$wslChaincodePath = ConvertTo-WslPath $CHAINCODE_PATH
$wslTestNetworkDir = ConvertTo-WslPath $testNetworkDir

# Bring down existing network
Write-Host "Cleaning up existing network..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "cd '$wslTestNetworkDir' && ./network.sh down 2>/dev/null; true"

# Start network with CouchDB as state database
Write-Host "Starting test-network with CA and CouchDB..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "cd '$wslTestNetworkDir' && ./network.sh up createChannel -c $CHANNEL_NAME -ca -s couchdb"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start network" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Network is up! Channel '$CHANNEL_NAME' created with CouchDB state database." -ForegroundColor Green
Write-Host "CouchDB UI available at:" -ForegroundColor Cyan
Write-Host "  Org1: http://localhost:5984/_utils (admin/adminpw)" -ForegroundColor Cyan
Write-Host "  Org2: http://localhost:7984/_utils (admin/adminpw)" -ForegroundColor Cyan
Write-Host ""

# Package chaincode using peer lifecycle command (proper way)
Write-Host "Packaging chaincode '$CHAINCODE_NAME'..." -ForegroundColor Yellow

wsl -d Ubuntu -- bash -c "export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:\$PATH && export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config && cd '$wslTestNetworkDir' && peer lifecycle chaincode package /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/chainrank.tar.gz --path '$wslChaincodePath' --lang node --label chainrank_1.0"

$packageFile = Join-Path $SCRIPT_DIR "chainrank.tar.gz"
if (-not (Test-Path $packageFile)) {
    Write-Host "Failed to package chaincode" -ForegroundColor Red
    exit 1
}

Write-Host "Chaincode packaged successfully" -ForegroundColor Green

# Install pre-packaged chaincode
Write-Host "Installing chaincode on peers..." -ForegroundColor Yellow
$packageFile = Join-Path $SCRIPT_DIR "chainrank.tar.gz"
$wslPackageFile = ConvertTo-WslPath $packageFile

wsl -d Ubuntu -- bash -c "export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:\$PATH && export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode install '$wslPackageFile'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install chaincode on Org1" -ForegroundColor Red
    exit 1
}

wsl -d Ubuntu -- bash -c "export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:\$PATH && export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 2 && peer lifecycle chaincode install '$wslPackageFile'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install chaincode on Org2" -ForegroundColor Red
    exit 1
}

# Get package ID
$packageId = wsl -d Ubuntu -- bash -c "export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:\$PATH && export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[] | select(.label==\"chainrank_1.0\") | .package_id'"

Write-Host "Package ID: $packageId" -ForegroundColor Cyan

# Approve chaincode for Org1
Write-Host "Approving chaincode for Org1..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:\$PATH && export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \$ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version 1.0 --package-id $packageId --sequence 1"

# Approve chaincode for Org2
Write-Host "Approving chaincode for Org2..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:\$PATH && export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 2 && peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \$ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version 1.0 --package-id $packageId --sequence 1"

# Commit chaincode definition
Write-Host "Committing chaincode definition..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:\$PATH && export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \$ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version 1.0 --sequence 1 --peerAddresses localhost:7051 --tlsRootCertFiles \$PEER0_ORG1_CA --peerAddresses localhost:9051 --tlsRootCertFiles \$PEER0_ORG2_CA"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Chaincode deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to commit chaincode" -ForegroundColor Red
    exit 1
}

# Copy connection profile
$connDir = Join-Path $PROJECT_ROOT "fabric-config"
if (!(Test-Path $connDir)) { New-Item -ItemType Directory -Path $connDir | Out-Null }

$srcProfile = "$testNetworkDir\organizations\peerOrganizations\org1.example.com\connection-org1.json"
$destProfile = Join-Path $connDir "connection-org1.json"

if (Test-Path $srcProfile) {
    Copy-Item $srcProfile $destProfile -Force
    Write-Host "Connection profile saved to fabric-config\connection-org1.json" -ForegroundColor Green
}

# Enroll appUser
Write-Host ""
Write-Host "Enrolling appUser..." -ForegroundColor Yellow
Push-Location $SCRIPT_DIR
node enrollUser.js
Pop-Location

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Fabric Network Ready!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Set FABRIC_ENABLED=true in backend/.env to use blockchain" -ForegroundColor Yellow
Write-Host ""
