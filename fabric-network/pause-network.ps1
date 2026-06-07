# ============================================================
# Pause Fabric Network (SOFT stop - preserves all data)
# ============================================================
# Stops the Fabric containers WITHOUT running `network.sh down`, so the
# Docker volumes (peer/orderer ledgers AND couchdb0/couchdb1 state databases)
# are kept intact. `network.sh down` deletes those volumes, which is why
# CouchDB data disappeared on every stop.
#
# Core containers (orderer/peers/couchdb/CAs) just get `docker stop` -- they
# have no `--rm`, so they can be brought back with `docker start` later (see
# resume-network.ps1). The CCAAS chaincode containers run with `--rm`, so
# stopping them removes them; resume re-runs them from the prebuilt image.
# ============================================================

$ErrorActionPreference = "Continue"

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
$chaincodeContainers = @(
    'chainrank.org1.example.com',
    'chainrank.org2.example.com'
)

Write-Host "Pausing Fabric network (data preserved)..." -ForegroundColor Yellow

# Stop core containers (volumes kept; restartable via resume-network.ps1)
foreach ($name in $coreContainers) {
    $exists = docker ps -a --filter "name=^/$name$" --format "{{.Names}}" 2>$null
    if ($exists -eq $name) {
        docker stop $name 2>$null | Out-Null
        Write-Host "  Stopped $name" -ForegroundColor Gray
    }
}

# Chaincode containers are --rm; stopping removes them. resume re-runs them.
foreach ($name in $chaincodeContainers) {
    $exists = docker ps -a --filter "name=^/$name$" --format "{{.Names}}" 2>$null
    if ($exists -eq $name) {
        docker rm -f $name 2>$null | Out-Null
        Write-Host "  Removed chaincode container $name" -ForegroundColor Gray
    }
}

Write-Host "Fabric network paused. Data volumes preserved." -ForegroundColor Green
Write-Host "  Resume with: .\run.ps1   (auto-detects paused state)" -ForegroundColor DarkGray
