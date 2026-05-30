# ============================================================
# ChainRank - Run All Services (Non-Interactive)
# Starts: PostgreSQL, Fabric Network, Backend, Frontend
# Usage: .\run.ps1 [-SkipFabric] [-SkipFrontend] [-Clean]
# ============================================================

param(
    [switch]$SkipFabric,
    [switch]$SkipFrontend,
    [switch]$Clean
)

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = $PSScriptRoot

Write-Host ''
Write-Host '  ========================================' -ForegroundColor Cyan
Write-Host '    ChainRank - Starting All Services    ' -ForegroundColor Cyan
Write-Host '  ========================================' -ForegroundColor Cyan
Write-Host ''

$startTime = Get-Date

# ─────────────────────────────────────────────
# Step 1: PostgreSQL Database
# ─────────────────────────────────────────────
Write-Host "[1/4] PostgreSQL Database" -ForegroundColor Yellow

$pgRunning = docker ps --filter "name=chainrank_postgres_dev" --format "{{.Status}}" 2>$null
if ($pgRunning -match "Up") {
    Write-Host "  Already running" -ForegroundColor Green
} else {
    Write-Host "  Starting..." -ForegroundColor Gray
    docker start chainrank_postgres_dev 2>$null
    if ($LASTEXITCODE -ne 0) {
        docker compose -f "$PROJECT_ROOT\docker-compose.dev.yml" up -d postgres
    }
    # Wait for healthy
    $attempts = 0
    do {
        Start-Sleep -Seconds 2
        $attempts++
        $health = docker inspect --format "{{.State.Health.Status}}" chainrank_postgres_dev 2>$null
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
    # Check if already running
    $peerRunning = docker ps --filter "name=peer0.org1.example.com" --format "{{.Status}}" 2>$null
    $chaincodeRunning = docker ps --filter "name=chainrank.org1.example.com" --format "{{.Status}}" 2>$null

    if (($peerRunning -match "Up") -and ($chaincodeRunning -match "Up")) {
        Write-Host "  Already running (peer + chaincode)" -ForegroundColor Green
    } else {
        if ($Clean) {
            Write-Host "  Cleaning previous network (-Clean flag)..." -ForegroundColor Gray
            & "$PROJECT_ROOT\fabric-network\clean-network.ps1"
            Write-Host ""
        }

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
    # Install deps if needed
    if (-not (Test-Path "$PROJECT_ROOT\backend\node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        Push-Location "$PROJECT_ROOT\backend"
        npm install --silent 2>$null
        Pop-Location
    }

    Write-Host "  Starting in new terminal..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$PROJECT_ROOT\backend'; " +
        "Write-Host '=== ChainRank Backend ===' -ForegroundColor Green; " +
        "Write-Host 'API:     http://localhost:3000' -ForegroundColor Cyan; " +
        "Write-Host 'Swagger: http://localhost:3000/api-docs' -ForegroundColor Cyan; " +
        "Write-Host ''; " +
        "node server.js"
    )
    Write-Host "  Terminal opened (http://localhost:3000)" -ForegroundColor Green
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
            "Write-Host '=== ChainRank Frontend ===' -ForegroundColor Green; " +
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

Write-Host ''
Write-Host '  ========================================' -ForegroundColor Green
Write-Host '         All Services Started!           ' -ForegroundColor Green
Write-Host '  ========================================' -ForegroundColor Green
Write-Host ''
Write-Host '  Services:' -ForegroundColor White
Write-Host '    Database    : PostgreSQL (localhost:5434)' -ForegroundColor Gray
if (-not $SkipFabric) {
    Write-Host '    Blockchain  : Fabric Network (skchannel)' -ForegroundColor Gray
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
Write-Host '    Stop all:  .\stop-all.ps1' -ForegroundColor DarkGray
Write-Host '    Clean run: .\run.ps1 -Clean' -ForegroundColor DarkGray
Write-Host '    No fabric: .\run.ps1 -SkipFabric' -ForegroundColor DarkGray
Write-Host '    API only:  .\run.ps1 -SkipFrontend' -ForegroundColor DarkGray
Write-Host ''
