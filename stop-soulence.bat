@echo off
echo ========================================
echo    🛑 Stopping Soulence Platform
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo Stopping Docker services...
docker-compose down --remove-orphans

echo.
echo Stopping frontend and ngrok processes...

REM Kill Node.js processes (frontend)
taskkill /f /im node.exe >nul 2>&1

REM Kill ngrok processes
taskkill /f /im ngrok.exe >nul 2>&1

echo.
echo ✅ All Soulence services stopped
echo.
echo To restart, run: start-soulence.bat
echo.
pause