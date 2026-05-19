# ============================================================
# Start Fabric Network + Deploy Chaincode (CCAAS Method)
# Alternative method using Chaincode-as-a-Service
# Pre-builds Docker image in Windows to avoid WSL Docker issues
# ============================================================

$ErrorActionPreference = "Continue"

$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path $SCRIPT_DIR -Parent
$CHAINCODE_PATH = Join-Path $PROJECT_ROOT "chaincode"
$CHANNEL_NAME = "skchannel"
$CHAINCODE_NAME = "chainrank"
$CHAINCODE_VERSION = "1.0"
$CHAINCODE_PORT = 9999

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Starting Fabric Network (CCAAS Method)" -ForegroundColor Cyan
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

$wslTestNetworkDir = ConvertTo-WslPath $testNetworkDir

# Bring down existing network
Write-Host "Cleaning up existing network..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "cd '$wslTestNetworkDir' && ./network.sh down 2>/dev/null; true"

# Start network with CouchDB
Write-Host "Starting test-network with CA and CouchDB..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "cd '$wslTestNetworkDir' && ./network.sh up createChannel -c $CHANNEL_NAME -ca -s couchdb"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start network" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Network is up! Channel '$CHANNEL_NAME' created with CouchDB." -ForegroundColor Green
Write-Host "CouchDB UI available at:" -ForegroundColor Cyan
Write-Host "  Org1: http://localhost:5984/_utils (admin/adminpw)" -ForegroundColor Cyan
Write-Host "  Org2: http://localhost:7984/_utils (admin/adminpw)" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CCAAS Method: Pre-build Docker image in Windows
# ============================================

Write-Host "Building chaincode Docker image in Windows..." -ForegroundColor Yellow
$imageName = "${CHAINCODE_NAME}_ccaas:latest"

# Build Docker image using Windows Docker (not WSL)
docker build -t $imageName -f "$CHAINCODE_PATH\Dockerfile" $CHAINCODE_PATH

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build chaincode Docker image" -ForegroundColor Red
    exit 1
}

Write-Host "Chaincode image built successfully: $imageName" -ForegroundColor Green
Write-Host ""

# Create connection.json for CCAAS
Write-Host "Creating CCAAS connection configuration..." -ForegroundColor Yellow

$ccaasDir = Join-Path $SCRIPT_DIR "chaincode-ccaas"
if (!(Test-Path $ccaasDir)) { New-Item -ItemType Directory -Path $ccaasDir | Out-Null }

# Create code directory
$codeDir = Join-Path $ccaasDir "code"
if (Test-Path $codeDir) { Remove-Item $codeDir -Recurse -Force }
New-Item -ItemType Directory -Path $codeDir | Out-Null

# Create connection.json inside code (UTF8 without BOM) 
$connectionJson = "{`"address`":`"${CHAINCODE_NAME}.org1.example.com:${CHAINCODE_PORT}`",`"dial_timeout`":`"10s`",`"tls_required`":false}"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $codeDir "connection.json"), $connectionJson, $utf8NoBom)

# Create metadata.json at root (UTF8 without BOM)  
$metadataJson = "{`"type`":`"ccaas`",`"label`":`"${CHAINCODE_NAME}_${CHAINCODE_VERSION}`"}"
[System.IO.File]::WriteAllText((Join-Path $ccaasDir "metadata.json"), $metadataJson, $utf8NoBom)

# Clean up any stale connection.json at root (should only exist in code/)
$staleConnFile = Join-Path $ccaasDir "connection.json"
if (Test-Path $staleConnFile) { Remove-Item $staleConnFile -Force }

# Package CCAAS chaincode
Write-Host "Packaging CCAAS chaincode..." -ForegroundColor Yellow
$packageFile = Join-Path $SCRIPT_DIR "${CHAINCODE_NAME}_ccaas.tar.gz"

# Create tar package using WSL with nested structure
# Fabric CCAAS requires: outer tar contains metadata.json + code.tar.gz
# and code.tar.gz contains connection.json
$wslCcaasDir = ConvertTo-WslPath $ccaasDir
$wslPackageFile = ConvertTo-WslPath $packageFile

# Step 1: Create code.tar.gz from code/ directory
wsl -d Ubuntu -- bash -c "cd '$wslCcaasDir/code' && tar czf ../code.tar.gz connection.json"

# Step 2: Create outer package with metadata.json + code.tar.gz
wsl -d Ubuntu -- bash -c "cd '$wslCcaasDir' && tar czf '$wslPackageFile' metadata.json code.tar.gz"

if (!(Test-Path $packageFile)) {
    Write-Host "Failed to create CCAAS package" -ForegroundColor Red
    exit 1
}

$packageSize = (Get-Item $packageFile).Length
Write-Host "CCAAS package created successfully ($packageSize bytes)" -ForegroundColor Green
Write-Host ""

# Install chaincode on peers
Write-Host "Installing chaincode on peers..." -ForegroundColor Yellow

$wslScriptDir = ConvertTo-WslPath $SCRIPT_DIR

wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':\`$PATH && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode install '$wslPackageFile'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install on Org1" -ForegroundColor Red
    exit 1
}

wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':\`$PATH && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 2 && peer lifecycle chaincode install '$wslPackageFile'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install chaincode" -ForegroundColor Red
    exit 1
}

Write-Host "Chaincode installed on both peers" -ForegroundColor Green
Write-Host ""

# Get package ID
Write-Host "Getting package ID..." -ForegroundColor Yellow

$expectedLabel = "${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
$queryResult = wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':\`$PATH && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode queryinstalled --output json 2>/dev/null"

# Parse JSON in PowerShell to extract package ID
try {
    $packages = $queryResult | ConvertFrom-Json
    $packageId = ($packages.installed_chaincodes | Where-Object { $_.label -eq $expectedLabel }).package_id
} catch {
    # Fallback: parse manually from output
    $packageId = $queryResult | Select-String -Pattern "chainrank_1.0:([a-f0-9]{64})" | ForEach-Object { $_.Matches.Groups[1].Value }
    if ($packageId) {
        $packageId = "chainrank_1.0:$packageId"
    }
}

if ([string]::IsNullOrWhiteSpace($packageId)) {
    Write-Host "Failed to get package ID" -ForegroundColor Red
    exit 1
}

Write-Host "Package ID: $packageId" -ForegroundColor Cyan
Write-Host ""

# Start chaincode containers
Write-Host "Starting chaincode containers..." -ForegroundColor Yellow

# Stop old containers if exist
docker stop "${CHAINCODE_NAME}.org1.example.com" "${CHAINCODE_NAME}.org2.example.com" 2>$null | Out-Null
docker rm "${CHAINCODE_NAME}.org1.example.com" "${CHAINCODE_NAME}.org2.example.com" 2>$null | Out-Null

# Start chaincode for Org1
docker run -d --rm `
    --name "${CHAINCODE_NAME}.org1.example.com" `
    --hostname "${CHAINCODE_NAME}.org1.example.com" `
    --network fabric_test `
    -e CHAINCODE_SERVER_ADDRESS="0.0.0.0:${CHAINCODE_PORT}" `
    -e CHAINCODE_ID="$packageId" `
    -e CORE_CHAINCODE_ID_NAME="$packageId" `
    $imageName

# Start chaincode for Org2
docker run -d --rm `
    --name "${CHAINCODE_NAME}.org2.example.com" `
    --hostname "${CHAINCODE_NAME}.org2.example.com" `
    --network fabric_test `
    -e CHAINCODE_SERVER_ADDRESS="0.0.0.0:${CHAINCODE_PORT}" `
    -e CHAINCODE_ID="$packageId" `
    -e CORE_CHAINCODE_ID_NAME="$packageId" `
    $imageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start chaincode containers" -ForegroundColor Red
    exit 1
}

Write-Host "Chaincode containers started" -ForegroundColor Green
Start-Sleep -Seconds 3
Write-Host ""

# Approve chaincode for Org1
Write-Host "Approving chaincode for Org1..." -ForegroundColor Yellow

wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':\`$PATH && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \`$ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $packageId --sequence 1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to approve chaincode for Org1" -ForegroundColor Red
    exit 1
}

Write-Host "Chaincode approved for Org1" -ForegroundColor Green
Write-Host ""

# Approve chaincode for Org2
Write-Host "Approving chaincode for Org2..." -ForegroundColor Yellow

wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':\`$PATH && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 2 && peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \`$ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $packageId --sequence 1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to approve chaincode for Org2" -ForegroundColor Red
    exit 1
}

Write-Host "Chaincode approved for Org2" -ForegroundColor Green
Write-Host ""

# Commit chaincode definition
Write-Host "Committing chaincode definition..." -ForegroundColor Yellow

wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':\`$PATH && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \`$ORDERER_CA --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence 1 --peerAddresses localhost:7051 --tlsRootCertFiles \`$PEER0_ORG1_CA --peerAddresses localhost:9051 --tlsRootCertFiles \`$PEER0_ORG2_CA"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to commit chaincode" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Chaincode committed successfully!" -ForegroundColor Green
Write-Host ""

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
Write-Host "  Fabric Network Ready (CCAAS)!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Network Information:" -ForegroundColor Cyan
Write-Host "  Channel: $CHANNEL_NAME" -ForegroundColor Gray
Write-Host "  Chaincode: $CHAINCODE_NAME v$CHAINCODE_VERSION" -ForegroundColor Gray
Write-Host "  Method: CCAAS (external chaincode)" -ForegroundColor Gray
Write-Host ""
Write-Host "Chaincode Containers:" -ForegroundColor Cyan
docker ps --filter "name=$CHAINCODE_NAME" --format "table {{.Names}}\t{{.Status}}"
Write-Host ""
