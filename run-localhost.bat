@echo off
title Skilytics Localhost Launcher
echo ==========================================================
echo            Memulakan Skilytics (Localhost)
echo ==========================================================
cd /d "%~dp0src"

if not exist ".env" (
    echo [RALAT] Fail .env tidak dijumpai di folder src!
    pause
    exit /b 1
)

echo [OK] Fail .env dikesan.
echo [*] Memulakan API Server (Port 5000)...
start "Skilytics API Server" cmd /k "npx pnpm run dev:api"

echo [*] Memulakan Frontend Web (Port 3000)...
start "Skilytics Frontend Web" cmd /k "npx pnpm run dev"

echo.
echo ==========================================================
echo Kedua-dua perkhidmatan sedang dimulakan:
echo - Frontend: http://localhost:3000
echo - API:      http://localhost:5000
echo ==========================================================
