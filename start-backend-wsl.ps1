# ============================================
# Start Backend in WSL (Wrapper Script)
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Starting Backend in WSL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Why WSL? Backend in WSL can properly connect to Fabric network" -ForegroundColor Yellow
Write-Host "running in WSL Docker containers (no networking issues)." -ForegroundColor Yellow
Write-Host ""

# Make script executable
wsl -d Ubuntu -- chmod +x /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/start-backend-wsl.sh

# Run backend in WSL
wsl -d Ubuntu -- bash /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/start-backend-wsl.sh
