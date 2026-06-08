# ============================================
# Open WSL Terminal for Backend
# ============================================
# This script opens a WSL terminal at backend directory
# You will manually run: npm start

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Opening WSL Terminal for Backend" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Terminal akan terbuka di folder backend" -ForegroundColor Yellow
Write-Host "🔧 Silakan jalankan:" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Green
Write-Host ""
Write-Host "⏱️  Opening WSL terminal in 2 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Open WSL terminal at backend directory
wsl -d Ubuntu --cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
