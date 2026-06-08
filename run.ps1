# ============================================================
# Prima - Run All Services (Non-Interactive)
# Starts: PostgreSQL, Fabric Network, Backend, Frontend
# Usage: .\run.ps1 [-SkipFabric] [-SkipFrontend] [-Clean] [-Verify]
#   -Verify : run only the end-of-startup health checks, start nothing
# ============================================================

param(
    [switch]$SkipFabric,
    [switch]$SkipFrontend,
    [switch]$Clean,
    [switch]$Verify
)

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = $PSScriptRoot

# ─────────────────────────────────────────────
# Smoke test: probe each component for real and report honestly, instead of
# unconditionally printing "All Services Started!". Returns $true if everything
# that should be up is actually responding.
# ─────────────────────────────────────────────
function Test-Port {
    # Detect a listener on ANY local address family -- IPv4 (127.0.0.1/0.0.0.0)
    # AND IPv6 (::1/::). Vite binds to ::1 on Windows and Docker publishes on
    # both families, so a 127.0.0.1-only probe (Test-NetConnection) would report
    # "not listening" even when the service is up and serving over localhost.
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Invoke-SmokeTest {
    Write-Host ''
    Write-Host '  -------- Health checks --------' -ForegroundColor Cyan
    $allOk = $true

    # PostgreSQL
    $pgHealth = docker inspect --format "{{.State.Health.Status}}" prima_postgres_dev 2>$null
    if ($pgHealth -eq "healthy") { Write-Host "  [OK]   PostgreSQL (healthy)" -ForegroundColor Green }
    else { Write-Host "  [FAIL] PostgreSQL (status: $pgHealth)" -ForegroundColor Red; $allOk = $false }

    # Fabric (network level)
    if (-not $SkipFabric) {
        if (Test-Port 7051) { Write-Host "  [OK]   Fabric peer port 7051 reachable" -ForegroundColor Green }
        else { Write-Host "  [FAIL] Fabric peer port 7051 not reachable" -ForegroundColor Red; $allOk = $false }

        $ccUp = (docker ps --filter "name=^/prima.org1.example.com$" --format "{{.Status}}" 2>$null) -match "^Up"
        if ($ccUp) { Write-Host "  [OK]   Chaincode container running" -ForegroundColor Green }
        else { Write-Host "  [FAIL] Chaincode container not running" -ForegroundColor Red; $allOk = $false }
    }

    # Backend /health (wait up to ~40s; WSL npm start + Fabric connect takes a moment)
    $backendOk = $false
    for ($i = 0; $i -lt 20; $i++) {
        try {
            # Use 127.0.0.1 (not localhost): the backend runs in WSL and Windows
            # forwards the port on IPv4 only, while "localhost" resolves to ::1
            # (IPv6) first and would time out even when the backend is healthy.
            $h = Invoke-RestMethod -Uri "http://127.0.0.1:3000/health" -TimeoutSec 2 -ErrorAction Stop
            if ($h.status -eq "OK") { $backendOk = $true; break }
        } catch { Start-Sleep -Seconds 2 }
    }
    if ($backendOk) { Write-Host "  [OK]   Backend /health responding" -ForegroundColor Green }
    else { Write-Host "  [FAIL] Backend /health not responding on :3000" -ForegroundColor Red; $allOk = $false }

    # Backend -> Fabric connectivity (best-effort; /system/status needs auth, so
    # a 401 still proves the backend is up. We surface the network-level Fabric
    # checks above as the real signal that the chain is reachable.)
    if (-not $SkipFabric -and $backendOk) {
        Write-Host "  [i]    Backend<->Fabric link verifies on first real request (see topbar indicator)" -ForegroundColor DarkGray
    }

    # Frontend
    if (-not $SkipFrontend) {
        if (Test-Port 5173) { Write-Host "  [OK]   Frontend dev server on :5173" -ForegroundColor Green }
        else { Write-Host "  [FAIL] Frontend not listening on :5173" -ForegroundColor Red; $allOk = $false }
    }

    Write-Host '  -------------------------------' -ForegroundColor Cyan
    if ($allOk) { Write-Host "  All checks passed." -ForegroundColor Green }
    else { Write-Host "  Some checks FAILED - see above." -ForegroundColor Red }
    return $allOk
}

# -Verify mode: just run the health checks and exit, start nothing.
if ($Verify) {
    Invoke-SmokeTest | Out-Null
    return
}

Write-Host ''
Write-Host '  ========================================' -ForegroundColor Cyan
Write-Host '    Prima - Starting All Services    ' -ForegroundColor Cyan
Write-Host '  ========================================' -ForegroundColor Cyan
Write-Host ''

$startTime = Get-Date

# ─────────────────────────────────────────────
# Step 1: PostgreSQL Database
# ─────────────────────────────────────────────
Write-Host "[1/4] PostgreSQL Database" -ForegroundColor Yellow

$pgRunning = docker ps --filter "name=prima_postgres_dev" --format "{{.Status}}" 2>$null
if ($pgRunning -match "Up") {
    Write-Host "  Already running" -ForegroundColor Green
} else {
    Write-Host "  Starting..." -ForegroundColor Gray
    docker start prima_postgres_dev 2>$null
    if ($LASTEXITCODE -ne 0) {
        docker compose -f "$PROJECT_ROOT\docker-compose.dev.yml" up -d postgres
    }
    # Wait for healthy
    $attempts = 0
    do {
        Start-Sleep -Seconds 2
        $attempts++
        $health = docker inspect --format "{{.State.Health.Status}}" prima_postgres_dev 2>$null
    } while ($health -ne "healthy" -and $attempts -lt 10)

    if ($health -eq "healthy") {
        Write-Host "  Started (healthy)" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: DB may not be ready yet" -ForegroundColor Yellow
    }
}
Write-Host ""

# ─────────────────────────────────────────────
# Step 2: Fabric Network
# ─────────────────────────────────────────────
Write-Host "[2/4] Hyperledger Fabric Network" -ForegroundColor Yellow

if ($SkipFabric) {
    Write-Host "  Skipped (-SkipFabric flag)" -ForegroundColor Gray
} else {
    # Detect three distinct states instead of just "containers Up or not":
    #   1. peer Up  + chaincode Up  -> already running, nothing to do
    #   2. peer container EXISTS (paused/partial) -> resume from preserved data
    #      (fast, keeps the ledger AND CouchDB volumes; see resume-network.ps1)
    #   3. peer container ABSENT -> full fresh build (start-network-ccaas.ps1)
    # -Clean always forces a full hard reset regardless of current state (this
    # also fixes the old gotcha where -Clean was silently ignored when the
    # containers happened to be Up).
    $peerStatus = docker ps -a --filter "name=^/peer0.org1.example.com$" --format "{{.Status}}" 2>$null
    $peerExists = -not [string]::IsNullOrWhiteSpace($peerStatus)
    $peerUp = $peerStatus -match "^Up"
    $chaincodeUp = (docker ps --filter "name=^/prima.org1.example.com$" --format "{{.Status}}" 2>$null) -match "^Up"

    $needFullStart = $false

    if ($Clean) {
        Write-Host "  Cleaning previous network (-Clean flag)..." -ForegroundColor Gray
        & "$PROJECT_ROOT\fabric-network\clean-network.ps1"
        Write-Host ""
        $needFullStart = $true
    } elseif ($peerUp -and $chaincodeUp) {
        Write-Host "  Already running (peer + chaincode)" -ForegroundColor Green
    } elseif ($peerExists) {
        Write-Host "  Paused/partial network detected - resuming (data preserved)..." -ForegroundColor Gray
        & "$PROJECT_ROOT\fabric-network\resume-network.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Resume not possible - falling back to full rebuild..." -ForegroundColor Yellow
            $needFullStart = $true
        } else {
            Write-Host "  Network resumed (ledger + CouchDB intact)" -ForegroundColor Green
        }
    } else {
        Write-Host "  No existing network - building fresh..." -ForegroundColor Gray
        $needFullStart = $true
    }

    if ($needFullStart) {
        Write-Host "  Starting network (CCAAS method)..." -ForegroundColor Gray
        Write-Host "  This takes ~2-3 minutes..." -ForegroundColor DarkGray
        & "$PROJECT_ROOT\fabric-network\start-network-ccaas.ps1"

        if ($LASTEXITCODE -ne 0) {
            Write-Host "  FAILED - Try running with -Clean flag: .\run.ps1 -Clean" -ForegroundColor Red
            Write-Host "  Continuing without Fabric..." -ForegroundColor Yellow
        } else {
            Write-Host "  Network ready" -ForegroundColor Green
        }
    }
}
Write-Host ""

# ─────────────────────────────────────────────
# Step 3: Backend Server
# ─────────────────────────────────────────────
Write-Host "[3/4] Backend Server (Express.js)" -ForegroundColor Yellow

# Check if already running on port 3000
$portCheck = netstat -ano 2>$null | Select-String ":3000.*LISTENING"
if ($portCheck) {
    Write-Host "  Already running on port 3000" -ForegroundColor Green
} else {
    # Readiness gate: don't launch the backend until the Fabric peer is actually
    # accepting connections. Launching too early is exactly what produced the
    # intermittent "ECONNREFUSED 127.0.0.1:7051" at startup -- the backend tried
    # to connect before the peer's gRPC port was listening.
    if (-not $SkipFabric) {
        Write-Host "  Waiting for Fabric peer (port 7051)..." -ForegroundColor Gray
        $peerReady = $false
        for ($i = 0; $i -lt 30; $i++) {
            if (Test-NetConnection -ComputerName 127.0.0.1 -Port 7051 -InformationLevel Quiet -WarningAction SilentlyContinue) {
                $peerReady = $true; break
            }
            Start-Sleep -Seconds 1
        }
        if ($peerReady) {
            Write-Host "  Peer reachable - starting backend" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: peer not reachable after 30s; backend may start in DB-only mode" -ForegroundColor Yellow
        }
    }

    # Install deps if needed
    if (-not (Test-Path "$PROJECT_ROOT\backend\node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        Push-Location "$PROJECT_ROOT\backend"
        npm install --silent 2>$null
        Pop-Location
    }

    Write-Host "  Starting in new terminal (via WSL for reliable Fabric connectivity)..." -ForegroundColor Gray
    # Run the backend INSIDE WSL Ubuntu, NOT native Windows node. The Fabric
    # peer/orderer containers run in WSL's Docker; a Windows-native backend can
    # only reach them through Docker Desktop's port-forward, which is frequently
    # not ready at the exact moment the backend starts -> intermittent
    # "ECONNREFUSED 127.0.0.1:7051". From inside WSL the backend shares the same
    # localhost namespace as the containers, so the connection is reliable.
    # (start-backend-wsl.ps1 is the project's existing, known-good WSL launcher.)
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "& '$PROJECT_ROOT\start-backend-wsl.ps1'"
    )
    Write-Host "  Terminal opened in WSL (http://localhost:3000)" -ForegroundColor Green
}
Write-Host ""

# ─────────────────────────────────────────────
# Step 4: Frontend (Vite + Vue)
# ─────────────────────────────────────────────
Write-Host "[4/4] Frontend (Vite + Vue.js)" -ForegroundColor Yellow

if ($SkipFrontend) {
    Write-Host "  Skipped (-SkipFrontend flag)" -ForegroundColor Gray
} else {
    $portCheck5173 = netstat -ano 2>$null | Select-String ":5173.*LISTENING"
    if ($portCheck5173) {
        Write-Host "  Already running on port 5173" -ForegroundColor Green
    } else {
        # Install deps if needed
        if (-not (Test-Path "$PROJECT_ROOT\frontend\node_modules")) {
            Write-Host "  Installing dependencies..." -ForegroundColor Gray
            Push-Location "$PROJECT_ROOT\frontend"
            npm install --silent 2>$null
            Pop-Location
        }

        Write-Host "  Starting in new terminal..." -ForegroundColor Gray
        Start-Process powershell -ArgumentList @(
            "-NoExit", "-Command",
            "Set-Location '$PROJECT_ROOT\frontend'; " +
            "Write-Host '=== Prima Frontend ===' -ForegroundColor Green; " +
            "Write-Host 'URL: http://localhost:5173' -ForegroundColor Cyan; " +
            "Write-Host ''; " +
            "npm run dev"
        )
        Write-Host "  Terminal opened (http://localhost:5173)" -ForegroundColor Green
    }
}

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)

# Honest verification instead of an unconditional success banner.
$allOk = Invoke-SmokeTest

Write-Host ''
if ($allOk) {
    Write-Host '  ========================================' -ForegroundColor Green
    Write-Host '         All Services Started!           ' -ForegroundColor Green
    Write-Host '  ========================================' -ForegroundColor Green
} else {
    Write-Host '  ========================================' -ForegroundColor Yellow
    Write-Host '     Started WITH WARNINGS (see above)    ' -ForegroundColor Yellow
    Write-Host '  ========================================' -ForegroundColor Yellow
}
Write-Host ''
Write-Host '  Services:' -ForegroundColor White
Write-Host '    Database    : PostgreSQL (localhost:5434)' -ForegroundColor Gray
if (-not $SkipFabric) {
    Write-Host '    Blockchain  : Fabric Network (primachannel)' -ForegroundColor Gray
    Write-Host '    CouchDB     : http://localhost:5984/_utils' -ForegroundColor Gray
}
Write-Host '    Backend     : http://localhost:3000' -ForegroundColor Gray
Write-Host '    Swagger     : http://localhost:3000/api-docs' -ForegroundColor Gray
if (-not $SkipFrontend) {
    Write-Host '    Frontend    : http://localhost:5173' -ForegroundColor Gray
}
Write-Host ''
Write-Host "  Started in $elapsed seconds" -ForegroundColor DarkGray
Write-Host ''
Write-Host '  Tips:' -ForegroundColor DarkGray
Write-Host '    Stop all:  .\stop-all.ps1          (soft - keeps CouchDB data)' -ForegroundColor DarkGray
Write-Host '    Wipe all:  .\stop-all.ps1 -Hard    (removes ledger + CouchDB)' -ForegroundColor DarkGray
Write-Host '    Clean run: .\run.ps1 -Clean' -ForegroundColor DarkGray
Write-Host '    Re-check:  .\run.ps1 -Verify' -ForegroundColor DarkGray
Write-Host '    No fabric: .\run.ps1 -SkipFabric' -ForegroundColor DarkGray
Write-Host '    API only:  .\run.ps1 -SkipFrontend' -ForegroundColor DarkGray
Write-Host ''
