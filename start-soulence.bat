@echo off
echo ========================================
echo    🚀 Soulence Platform Startup
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ========================================
echo [1/4] 🐳 Starting Backend Services
echo ========================================

REM Stop any existing containers
echo Stopping existing containers...
docker-compose down --remove-orphans

REM Start PostgreSQL first
echo Starting PostgreSQL database...
docker-compose up -d postgres
timeout /t 5 /nobreak >nul

REM Start Sleep Service
echo Starting Sleep Service...
docker-compose up -d sleep-service
timeout /t 3 /nobreak >nul

echo ✅ Backend services started

echo ========================================
echo [2/4] 🌐 Starting Frontend
echo ========================================

REM Start frontend in a new window
echo Starting React frontend...
start "Soulence Frontend" cmd /k "cd /d %~dp0frontend\web && npm run dev"

REM Wait for frontend to start
echo Waiting for frontend to initialize...
timeout /t 15 /nobreak >nul

REM Check if frontend is responding
echo Checking if frontend is ready...
:frontend_check
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ Frontend still starting... waiting 5 more seconds
    timeout /t 5 /nobreak >nul
    goto frontend_check
)

echo ✅ Frontend is responding at http://localhost:3000

echo ========================================
echo [3/4] 🔗 Starting Ngrok Tunnel
echo ========================================

REM Check if ngrok is installed
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ WARNING: Ngrok is not installed!
    echo Skipping ngrok tunnel setup
    goto skip_ngrok
)

REM Now that frontend is confirmed running, start ngrok
echo Frontend confirmed running, starting ngrok tunnel...
start "Soulence Ngrok" cmd /k "ngrok http 3000"
timeout /t 5 /nobreak >nul
echo ✅ Ngrok tunnel started in new window

:skip_ngrok

echo ========================================
echo 🎉 Soulence Platform Ready!
echo ========================================
echo.
echo Local Access:
echo 🌐 Frontend:      http://localhost:3000
echo 🔧 Sleep API:     http://localhost:3006
echo 🔍 Health Check:  http://localhost:3006/health
echo.
echo Services Running:
docker-compose ps
echo.
echo Demo Login:
echo   Email: demo@student.com
echo   Password: (any password works)
echo.
echo ✨ Ready for Google Fit sleep tracking!
echo.
pause