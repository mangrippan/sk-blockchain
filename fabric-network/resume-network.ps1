# ============================================================
# Resume Fabric Network (SOFT start - reuses preserved data)
# ============================================================
# Brings a PAUSED network (see pause-network.ps1) back up WITHOUT rebuilding:
#   1. `docker start` the core containers (orderer/peers/couchdb/CAs). Their
#      volumes still hold the committed ledger + CouchDB state, so the channel
#      and the installed/committed chaincode definition survive untouched.
#   2. Re-run the CCAAS chaincode containers (they are --rm, so pausing removed
#      them). The package ID is re-queried from the peer, where the chaincode
#      package is still installed (it lives in the peer's volume).
#   3. Verify the chaincode is still committed on the channel. If anything is
#      missing/inconsistent, exit non-zero so the caller falls back to a full
#      rebuild (start-network-ccaas.ps1).
#
# Exit codes: 0 = resumed OK, 1 = inconsistent state (caller should full-start).
# ============================================================

$ErrorActionPreference = "Continue"

$SCRIPT_DIR = $PSScriptRoot
$CHANNEL_NAME = "primachannel"
$CHAINCODE_NAME = "prima"
$CHAINCODE_VERSION = "1.0"
$CHAINCODE_PORT = 9999
$imageName = "${CHAINCODE_NAME}_ccaas:latest"

function ConvertTo-WslPath($winPath) {
    $p = $winPath -replace '\\','/'
    if ($p -match '^([A-Za-z]):(.*)') {
        return "/mnt/$($Matches[1].ToLower())$($Matches[2])"
    }
    return $p
}

$testNetworkDir = "$SCRIPT_DIR\fabric-samples\test-network"
$wslTestNetworkDir = ConvertTo-WslPath $testNetworkDir
$wslScriptDir = ConvertTo-WslPath $SCRIPT_DIR

$coreContainers = @(
    'orderer.example.com',
    'peer0.org1.example.com',
    'peer0.org2.example.com',
    'couchdb0',
    'couchdb1',
    'ca_org1',
    'ca_org2',
    'ca_orderer'
)

Write-Host "Resuming paused Fabric network (no rebuild)..." -ForegroundColor Yellow

# ── Step 1: start core containers ────────────────────────────
foreach ($name in $coreContainers) {
    $exists = docker ps -a --filter "name=^/$name$" --format "{{.Names}}" 2>$null
    if ($exists -eq $name) {
        docker start $name 2>$null | Out-Null
    } else {
        Write-Host "  Core container '$name' missing -> cannot resume, full rebuild needed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Core containers started" -ForegroundColor Gray

# ── Step 2: wait for peer0.org1 gRPC port to accept connections ──
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    if (Test-NetConnection -ComputerName 127.0.0.1 -Port 7051 -InformationLevel Quiet -WarningAction SilentlyContinue) {
        $ready = $true; break
    }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Host "  Peer port 7051 did not come up -> full rebuild needed" -ForegroundColor Red
    exit 1
}

# ── Step 3: re-query package ID (chaincode is still installed in peer volume) ──
$expectedLabel = "${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
$queryResult = wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':/usr/local/bin:/usr/bin:/bin && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode queryinstalled --output json 2>/dev/null"
try {
    $packages = $queryResult | ConvertFrom-Json
    $packageId = ($packages.installed_chaincodes | Where-Object { $_.label -eq $expectedLabel }).package_id
} catch {
    $packageId = $null
}
if ([string]::IsNullOrWhiteSpace($packageId)) {
    Write-Host "  Chaincode not installed on peer (volume lost?) -> full rebuild needed" -ForegroundColor Red
    exit 1
}
Write-Host "  Package ID: $packageId" -ForegroundColor Gray

# ── Step 4: re-run the CCAAS chaincode containers ────────────
foreach ($org in @('org1','org2')) {
    $ccName = "${CHAINCODE_NAME}.${org}.example.com"
    docker rm -f $ccName 2>$null | Out-Null
    docker run -d --rm `
        --name $ccName `
        --hostname $ccName `
        --network fabric_test `
        -e CHAINCODE_SERVER_ADDRESS="0.0.0.0:${CHAINCODE_PORT}" `
        -e CHAINCODE_ID="$packageId" `
        -e CORE_CHAINCODE_ID_NAME="$packageId" `
        $imageName | Out-Null
}
Write-Host "  Chaincode containers re-started" -ForegroundColor Gray
Start-Sleep -Seconds 3

# ── Step 5: verify chaincode still committed on the channel ──
$committed = wsl -d Ubuntu -- bash -c "export PATH='$wslScriptDir/fabric-samples/bin':/usr/local/bin:/usr/bin:/bin && export FABRIC_CFG_PATH='$wslScriptDir/fabric-samples/config' && cd '$wslTestNetworkDir' && . scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CHAINCODE_NAME 2>/dev/null"
if ($committed -notmatch "Version:\s*$CHAINCODE_VERSION") {
    Write-Host "  Chaincode '$CHAINCODE_NAME' not committed on '$CHANNEL_NAME' -> full rebuild needed" -ForegroundColor Red
    exit 1
}

# ── Step 6: make sure the backend wallet identity is still valid ──
# (idempotent: enrollUser re-enrolls only if the CA root changed; on a resume
#  the CA is unchanged, so this just confirms "already enrolled".)
Push-Location $SCRIPT_DIR
node enrollUser.js | Out-Null
$enrollOk = ($LASTEXITCODE -eq 0)
Pop-Location
if (-not $enrollOk) {
    Write-Host "  Wallet enrollment check failed -> full rebuild needed" -ForegroundColor Red
    exit 1
}

Write-Host "Fabric network resumed from preserved data (channel + ledger intact)." -ForegroundColor Green
exit 0
