# ============================================
# Prima - Stop All Services
# Usage: .\stop-all.ps1 [-Hard]
#   (default) SOFT stop  : pauses Fabric, KEEPS all data (ledger + CouchDB)
#   -Hard               : full teardown, REMOVES volumes (wipes ledger+CouchDB)
# ============================================

param(
    [switch]$Hard
)

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
if ($Hard) {
    Write-Host "  Prima - Stopping (HARD / wipe data)" -ForegroundColor Cyan
} else {
    Write-Host "  Prima - Stopping (soft / keep data)" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────
# 1. Stop Backend & Frontend dev servers (ports 3000 / 5173)
# ─────────────────────────────────────────────
Write-Host "[1/4] Stopping Backend & Frontend..." -ForegroundColor Yellow
foreach ($port in @(3000, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        try {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop
            Write-Host "  Stopped process on port $port (PID $($c.OwningProcess))" -ForegroundColor Gray
        } catch {}
    }
}
# Backend runs inside WSL via `npm start`; make sure the WSL node process is gone
wsl -d Ubuntu -- bash -c "pkill -f 'node server.js' 2>/dev/null; true" 2>$null | Out-Null
Write-Host "  Backend/Frontend stopped" -ForegroundColor Green
Write-Host ""

# ─────────────────────────────────────────────
# 2. Fabric network
# ─────────────────────────────────────────────
if ($Hard) {
    Write-Host "[2/4] Tearing down Fabric Network (removing volumes)..." -ForegroundColor Yellow
    $chaincodeContainers = docker ps -aq --filter "name=prima.org"
    if ($chaincodeContainers) { docker rm -f $chaincodeContainers 2>$null | Out-Null }
    & "$PROJECT_ROOT\fabric-network\stop-network.ps1"
    Write-Host "  Fabric network torn down (data wiped)" -ForegroundColor Green
} else {
    Write-Host "[2/4] Pausing Fabric Network (data preserved)..." -ForegroundColor Yellow
    & "$PROJECT_ROOT\fabric-network\pause-network.ps1"
}
Write-Host ""

# ─────────────────────────────────────────────
# 3. PostgreSQL Database
# ─────────────────────────────────────────────
if ($Hard) {
    Write-Host "[3/4] Stopping & removing PostgreSQL..." -ForegroundColor Yellow
    docker compose -f "$PROJECT_ROOT\docker-compose.dev.yml" down 2>$null | Out-Null
    Write-Host "  Database container removed (named volume kept unless -v)" -ForegroundColor Green
} else {
    Write-Host "[3/4] Pausing PostgreSQL (data preserved)..." -ForegroundColor Yellow
    docker stop prima_postgres_dev 2>$null | Out-Null
    Write-Host "  Database stopped (volume preserved)" -ForegroundColor Green
}
Write-Host ""

# ─────────────────────────────────────────────
# 4. Done
# ─────────────────────────────────────────────
Write-Host "[4/4] Done." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Services Stopped!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if ($Hard) {
    Write-Host "Hard stop: ledger + CouchDB data were removed." -ForegroundColor Yellow
    Write-Host "Next start will rebuild from scratch: .\run.ps1" -ForegroundColor Gray
} else {
    Write-Host "Soft stop: all data preserved (ledger + CouchDB + DB)." -ForegroundColor Green
    Write-Host "Next start resumes instantly: .\run.ps1" -ForegroundColor Gray
    Write-Host "To wipe everything instead, run: .\stop-all.ps1 -Hard" -ForegroundColor DarkGray
}
Write-Host ""
