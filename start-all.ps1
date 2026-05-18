# ============================================
# ChainRank - Start All Services
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ChainRank - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# 1. Start Database
Write-Host "[1/4] Starting PostgreSQL Database..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database started successfully" -ForegroundColor Green
    
    # Wait for database to be ready
    Write-Host "    Waiting for database to be ready (5 seconds)..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
} else {
    Write-Host "Failed to start database" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Start Fabric Network
Write-Host "[2/4] Starting Hyperledger Fabric Network..." -ForegroundColor Yellow
Set-Location -Path "fabric-network"

if (Test-Path ".\start-network.ps1") {
    .\start-network.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Fabric network started successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to start Fabric network" -ForegroundColor Red
        Set-Location -Path ".."
        exit 1
    }
} else {
    Write-Host "start-network.ps1 not found in fabric-network folder" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

Set-Location -Path ".."
Write-Host ""

# 3. Start Backend Server (in new terminal)
Write-Host "[3/4] Starting Backend Server..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "    Installing backend dependencies..." -ForegroundColor Gray
    Set-Location -Path "backend"
    npm install
    Set-Location -Path ".."
}

Write-Host "    Starting backend server in new terminal..." -ForegroundColor Gray
Write-Host "    Backend will run at: http://localhost:3000" -ForegroundColor Cyan

# Start backend in new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'ChainRank Backend Server' -ForegroundColor Green; Write-Host 'API: http://localhost:3000' -ForegroundColor Cyan; Write-Host 'Swagger: http://localhost:3000/api-docs' -ForegroundColor Cyan; Write-Host ''; npm start"

Write-Host "Backend terminal opened" -ForegroundColor Green
Start-Sleep -Seconds 3

Write-Host ""

# 4. Start Frontend (in new terminal)
Write-Host "[4/4] Starting Frontend (Vue.js)..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path ".\frontend\node_modules")) {
    Write-Host "    Installing frontend dependencies..." -ForegroundColor Gray
    Set-Location -Path "frontend"
    npm install
    Set-Location -Path ".."
}

Write-Host "    Starting frontend server in new terminal..." -ForegroundColor Gray
Write-Host "    Frontend will run at: http://localhost:5173" -ForegroundColor Cyan

# Start frontend in new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'ChainRank Frontend (Vue.js)' -ForegroundColor Green; Write-Host 'URL: http://localhost:5173' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host "Frontend terminal opened" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services Running:" -ForegroundColor White
Write-Host "  - Database:   http://localhost:5432" -ForegroundColor Gray
Write-Host "  - Backend:    http://localhost:3000" -ForegroundColor Gray
Write-Host "  - Swagger:    http://localhost:3000/api-docs" -ForegroundColor Gray
Write-Host "  - Frontend:   http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Default Login:" -ForegroundColor White
Write-Host "  - Email:      admin@chainrank.test" -ForegroundColor Gray
Write-Host "  - Password:   password123" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services, run: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host ""
