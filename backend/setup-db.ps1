# PostgreSQL Database Setup Script
# Simple version without emojis

param(
    [string]$Password = "postgres123"
)

Write-Host "[SETUP] Setting up PostgreSQL database..." -ForegroundColor Cyan

# PostgreSQL configuration
$PG_BIN = "C:\Program Files\PostgreSQL\15\bin"
$env:PATH = "$PG_BIN;$env:PATH"
$env:PGPASSWORD = $Password
$PG_PORT = "5434"

# Wait and test connection
Write-Host "[TEST] Testing PostgreSQL connection..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

$testResult = & "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] PostgreSQL connection failed!" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
    Get-Service -Name "postgresql*" | Format-Table
    exit 1
}

Write-Host "[OK] PostgreSQL is running!" -ForegroundColor Green

# Drop and create database
Write-Host "[DB] Creating database 'prima_db'..." -ForegroundColor Cyan
& "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -c "DROP DATABASE IF EXISTS prima_db;" 2>&1 | Out-Null
& "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -c "CREATE DATABASE prima_db;" 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Database creation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Database created successfully!" -ForegroundColor Green

# Run schema script
Write-Host "[SCHEMA] Running schema setup..." -ForegroundColor Cyan
$schemaPath = Join-Path $PSScriptRoot "..\database\schema-hybrid.sql"

if (!(Test-Path $schemaPath)) {
    Write-Host "[ERROR] Schema file not found: $schemaPath" -ForegroundColor Red
    exit 1
}

& "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -d prima_db -f $schemaPath 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Schema setup failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Schema loaded successfully!" -ForegroundColor Green

# Run seed script
Write-Host "[SEED] Loading seed data..." -ForegroundColor Cyan
$seedPath = Join-Path $PSScriptRoot "..\database\seed.sql"

if (!(Test-Path $seedPath)) {
    Write-Host "[ERROR] Seed file not found: $seedPath" -ForegroundColor Red
    exit 1
}

& "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -d prima_db -f $seedPath 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Seed data failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Seed data loaded successfully!" -ForegroundColor Green

# Run migrations (in order) - schema-hybrid.sql does NOT include these changes
Write-Host "[MIGRATE] Applying migrations..." -ForegroundColor Cyan
$migrations = @(
    "migration-add-snapshot.sql",
    "migration-revision-workflow.sql",
    "migration-jabatan-hierarchy.sql"
)
foreach ($m in $migrations) {
    $migPath = Join-Path $PSScriptRoot "..\database\$m"
    if (!(Test-Path $migPath)) {
        Write-Host "[ERROR] Migration file not found: $migPath" -ForegroundColor Red
        exit 1
    }
    Write-Host "  - $m" -ForegroundColor Gray
    & "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -d prima_db -v ON_ERROR_STOP=1 -f $migPath 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Migration failed: $m" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] Migrations applied successfully!" -ForegroundColor Green

# Verify setup
Write-Host "`n[VERIFY] Checking database..." -ForegroundColor Cyan
& "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -d prima_db -c "\dt sk.*"

Write-Host "`n[VERIFY] Checking users..." -ForegroundColor Cyan
& "$PG_BIN\psql.exe" -U postgres -p $PG_PORT -d prima_db -c "SET search_path TO sk; SELECT COUNT(*) as user_count FROM users;"

Write-Host "`n[SUCCESS] PostgreSQL setup completed!" -ForegroundColor Green
Write-Host "Database: prima_db" -ForegroundColor White
Write-Host "User: postgres" -ForegroundColor White
Write-Host "Password: $Password" -ForegroundColor White
Write-Host "Host: localhost" -ForegroundColor White
Write-Host "Port: $PG_PORT" -ForegroundColor White
Write-Host "`nNext step: node test-db.js" -ForegroundColor Cyan
