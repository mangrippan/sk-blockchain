# Stop Fabric Network (Windows PowerShell)

$SCRIPT_DIR = $PSScriptRoot
$testNetworkDir = "$SCRIPT_DIR\fabric-samples\test-network"

$shell = if (Get-Command wsl -ErrorAction SilentlyContinue) { "wsl" } else { "bash" }
$wslPath = if ($shell -eq "wsl") {
    $testNetworkDir -replace '\\','/' -replace 'C:','/mnt/c'
} else {
    $testNetworkDir -replace '\\','/'
}

Write-Host "🛑 Stopping Fabric network..." -ForegroundColor Yellow
& $shell -c "cd '$wslPath' && ./network.sh down"
Write-Host "✅ Network stopped." -ForegroundColor Green
