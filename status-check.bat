@echo off
echo ========================================
echo    📊 Soulence Platform Status
echo ========================================
echo.

cd /d "%~dp0"

echo [Docker Services]
docker-compose ps
echo.

echo [Service Health Checks]
echo.

echo Checking Sleep Service...
curl -s http://localhost:3006/health 2>nul | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo ✅ Sleep Service: HEALTHY
) else (
    echo ❌ Sleep Service: NOT RESPONDING
)

echo.
echo Checking Frontend...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: RUNNING
) else (
    echo ❌ Frontend: NOT RUNNING
)

echo.
echo Checking Database...
docker exec soulence-postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL: HEALTHY
) else (
    echo ❌ PostgreSQL: NOT READY
)

echo.
echo [Sleep Data Summary]
docker exec -it soulence-postgres psql -U postgres -d soulence -c "SELECT COUNT(*) as total_sessions FROM sleep_sessions;" 2>nul

echo.
echo [Process Status]
echo.
echo Node.js processes (Frontend):
tasklist /fi "imagename eq node.exe" /fo table 2>nul | findstr "node.exe" || echo No Node.js processes running

echo.
echo Ngrok processes:
tasklist /fi "imagename eq ngrok.exe" /fo table 2>nul | findstr "ngrok.exe" || echo No Ngrok processes running

echo.
echo ========================================
echo.
pause