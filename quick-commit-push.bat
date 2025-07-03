@echo off
echo ========================================
echo    🚀 Quick Git Commit & Push
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check git status
git status --short
if %errorlevel% neq 0 (
    echo ❌ Not a git repository!
    pause
    exit /b 1
)

REM Add all changes
echo.
echo Adding all changes...
git add .

REM Create commit
echo.
echo Creating commit...
git commit -m "feat: Complete Phase 2B - Sleep monitoring with public access" -m "- Google Fit integration with real data sync" -m "- PostgreSQL persistent storage" -m "- Public access via ngrok with OAuth" -m "- Automated deployment scripts" -m "- Production-ready UI"

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  No changes to commit or commit failed
    pause
    exit /b 1
)

REM Push to remote
echo.
echo Pushing to GitHub...
git push

if %errorlevel% equ 0 (
    echo.
    echo ✅ Successfully committed and pushed to GitHub!
    echo.
    echo View your changes at: https://github.com/sidroy2025/soulence
) else (
    echo.
    echo ❌ Push failed! Check your GitHub credentials
)

echo.
pause