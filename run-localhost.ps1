# Skilytics Localhost Launcher (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "            Memulakan Skilytics (Localhost)               " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$srcPath = Join-Path $PSScriptRoot "src"
Set-Location -Path $srcPath

if (-not (Test-Path ".env")) {
    Write-Host "[RALAT] Fail .env tidak dijumpai di folder src!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[OK] Fail .env dikesan." -ForegroundColor Green
Write-Host "[*] Memulakan API Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$srcPath'; npx pnpm run dev:api"

Write-Host "[*] Memulakan Frontend Web (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$srcPath'; npx pnpm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Kedua-dua perkhidmatan sedang dimulakan:" -ForegroundColor Green
Write-Host "- Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "- API      : http://localhost:5000" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
