# ============================================================
# Prima Quick Start Script
# Menjalankan semua komponen sistem secara otomatis
# ============================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Prima Quick Start" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ROOT = $PSScriptRoot

# ============================================
# Step 1: Start PostgreSQL
# ============================================
Write-Host "[1/5] Starting PostgreSQL..." -ForegroundColor Yellow

$pgContainer = docker ps -a --filter "name=prima_postgres_dev" --format "{{.Names}}"
if ($pgContainer) {
    $pgStatus = docker ps --filter "name=prima_postgres_dev" --format "{{.Status}}"
    if ($pgStatus) {
        Write-Host "  ✅ PostgreSQL already running" -ForegroundColor Green
    } else {
        docker start prima_postgres_dev | Out-Null
        Start-Sleep -Seconds 3
        Write-Host "  ✅ PostgreSQL started" -ForegroundColor Green
    }
} else {
    Write-Host "  Creating PostgreSQL container..." -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml up -d postgres
    Start-Sleep -Seconds 5
    Write-Host "  ✅ PostgreSQL created and started" -ForegroundColor Green
}

# ============================================
# Step 2: Check & Fix .env file
# ============================================
Write-Host "[2/5] Checking backend configuration..." -ForegroundColor Yellow

$envFile = Join-Path $PROJECT_ROOT "backend\.env"
if (!(Test-Path $envFile)) {
    Write-Host "  Creating .env from .env.example..." -ForegroundColor Cyan
    Copy-Item (Join-Path $PROJECT_ROOT "backend\.env.example") $envFile
}

# Fix localhost to 127.0.0.1 for IPv4
$envContent = Get-Content $envFile -Raw
if ($envContent -match "DB_HOST=localhost") {
    Write-Host "  Fixing DB_HOST to use IPv4..." -ForegroundColor Cyan
    (Get-Content $envFile) -replace 'DB_HOST=localhost', 'DB_HOST=127.0.0.1' | Set-Content $envFile
    Write-Host "  ✅ .env configured" -ForegroundColor Green
} else {
    Write-Host "  ✅ .env already configured" -ForegroundColor Green
}

# ============================================
# Step 3: Start Fabric Network
# ============================================
Write-Host "[3/5] Checking Fabric Network..." -ForegroundColor Yellow

$peerRunning = docker ps --filter "name=peer0.org1.example.com" --format "{{.Names}}"
if ($peerRunning) {
    Write-Host "  ✅ Fabric Network already running" -ForegroundColor Green
} else {
    Write-Host "  Starting Fabric Network (this may take 2-3 minutes)..." -ForegroundColor Cyan
    Push-Location (Join-Path $PROJECT_ROOT "fabric-network")
    .\start-network-ccaas.ps1
    Pop-Location
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to start Fabric Network" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Fabric Network started" -ForegroundColor Green
}

# ============================================
# Step 4: Enroll Wallet
# ============================================
Write-Host "[4/5] Checking Fabric wallet..." -ForegroundColor Yellow

$walletAdmin = Join-Path $PROJECT_ROOT "fabric-config\wallet\admin"
$walletAppUser = Join-Path $PROJECT_ROOT "fabric-config\wallet\appUser"

if ((Test-Path $walletAdmin) -and (Test-Path $walletAppUser)) {
    Write-Host "  ✅ Wallet already enrolled" -ForegroundColor Green
} else {
    Write-Host "  Enrolling wallet identities..." -ForegroundColor Cyan
    Push-Location (Join-Path $PROJECT_ROOT "backend")
    node enroll-wallet.js
    Pop-Location
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to enroll wallet" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Wallet enrolled" -ForegroundColor Green
}

# ============================================
# Step 5: Start Backend Server (Background)
# ============================================
Write-Host "[5/6] Starting backend server..." -ForegroundColor Yellow

# Check if backend already running
$backendRunning = netstat -ano | Select-String ":3000 " | Select-String "LISTENING"
if ($backendRunning) {
    Write-Host "  ✅ Backend already running on port 3000" -ForegroundColor Green
} else {
    Write-Host "  Starting backend in new window..." -ForegroundColor Cyan
    $backendPath = Join-Path $PROJECT_ROOT "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; node server.js" -WindowStyle Normal
    
    # Wait for backend to be ready
    Write-Host "  Waiting for backend to start..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    $healthCheck = $null
    try {
        $healthCheck = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    } catch {}
    
    if ($healthCheck -and $healthCheck.StatusCode -eq 200) {
        Write-Host "  ✅ Backend started successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Backend may still be starting..." -ForegroundColor Yellow
    }
}

# ============================================
# Step 6: Start Frontend (Optional)
# ============================================
Write-Host "[6/6] Starting frontend..." -ForegroundColor Yellow

# Check if frontend already running
$frontendRunning = netstat -ano | Select-String ":5173 " | Select-String "LISTENING"
if ($frontendRunning) {
    Write-Host "  ✅ Frontend already running on port 5173" -ForegroundColor Green
} else {
    Write-Host "  Starting frontend dev server in new window..." -ForegroundColor Cyan
    $frontendPath = Join-Path $PROJECT_ROOT "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal
    Write-Host "  ✅ Frontend starting (check new window)" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  🗄️  PostgreSQL: docker container prima_postgres_dev" -ForegroundColor White
Write-Host "  ⛓️  Fabric Network: peers + orderer + chaincode" -ForegroundColor White
Write-Host "  🔧 Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "  🎨 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Open http://localhost:5173 in browser" -ForegroundColor Gray
Write-Host "  - Check API docs: http://localhost:3000/api-docs" -ForegroundColor Gray
Write-Host "  - View logs in the opened PowerShell windows" -ForegroundColor Gray
Write-Host ""
