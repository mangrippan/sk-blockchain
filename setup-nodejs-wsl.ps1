# ============================================
# Setup Node.js di WSL
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Node.js in WSL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will install Node.js 18.x LTS in your WSL Ubuntu." -ForegroundColor Yellow
Write-Host "Required to run backend in WSL mode for Fabric connectivity." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continue? (Y/n)"
if ($confirmation -eq 'n' -or $confirmation -eq 'N') {
    Write-Host "Setup cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running installer in WSL..." -ForegroundColor Cyan
Write-Host ""

# Make script executable and run
wsl -d Ubuntu -- chmod +x /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/setup-nodejs-wsl.sh
wsl -d Ubuntu -- bash /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/setup-nodejs-wsl.sh

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\start-backend-wsl.ps1" -ForegroundColor Gray
    Write-Host "  2. Or: .\start-all.ps1 (choose WSL mode)" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Setup failed. Please check the errors above." -ForegroundColor Red
}
