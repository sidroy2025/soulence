@echo off
echo ========================================
echo    📝 Git Commit Helper
echo ========================================
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Show current git status
echo Current status:
echo ---------------
git status --short
echo.

REM Check if there are changes to commit
git diff --quiet
if %errorlevel% equ 0 (
    git diff --cached --quiet
    if %errorlevel% equ 0 (
        echo ✅ No changes to commit - working tree clean
        pause
        exit /b 0
    )
)

echo ========================================
echo    📋 Recent Changes Summary
echo ========================================
echo.
echo Major updates in this commit:
echo - Added public access via Ngrok with OAuth configuration
echo - Fixed startup script syntax errors
echo - Removed debug info box for cleaner UI
echo - Updated STATUS.md with latest achievements
echo - Configured Google OAuth for ngrok URLs
echo - Sleep data persisting correctly in PostgreSQL
echo.

REM Add all changes
echo Adding all changes...
git add .

REM Show what will be committed
echo.
echo Files to be committed:
echo ----------------------
git diff --cached --name-status
echo.

REM Create commit message
set /p continue="Do you want to commit these changes? (y/n): "
if /i "%continue%" neq "y" (
    echo Commit cancelled.
    git reset
    pause
    exit /b 0
)

echo.
echo Committing changes...

REM Create temporary file for commit message
echo feat: Complete Phase 2B - Sleep monitoring with public access > commit_msg.tmp
echo. >> commit_msg.tmp
echo - Implemented Google Fit integration with OAuth 2.0 >> commit_msg.tmp
echo - Added persistent PostgreSQL storage for sleep data >> commit_msg.tmp
echo - Created automated startup scripts (start-soulence.bat) >> commit_msg.tmp
echo - Fixed ngrok integration with Google OAuth >> commit_msg.tmp
echo - Removed debug UI elements for production readiness >> commit_msg.tmp
echo - Updated STATUS.md with latest achievements >> commit_msg.tmp
echo. >> commit_msg.tmp
echo Key features: >> commit_msg.tmp
echo - Real-time sleep data sync from Google Fit (7 sessions synced) >> commit_msg.tmp
echo - Public access via ngrok tunnel with authentication >> commit_msg.tmp
echo - One-click deployment with health checks >> commit_msg.tmp
echo - Professional UI ready for demonstrations >> commit_msg.tmp
echo. >> commit_msg.tmp
echo 🤖 Generated with [Claude Code](https://claude.ai/code) >> commit_msg.tmp
echo. >> commit_msg.tmp
echo Co-Authored-By: Claude ^<noreply@anthropic.com^> >> commit_msg.tmp

git commit -F commit_msg.tmp
set commit_result=%errorlevel%

REM Clean up temp file
del commit_msg.tmp

if %commit_result% equ 0 (
    echo.
    echo ✅ Commit successful!
    echo.
    echo Current branch status:
    git status --short --branch
    echo.
    echo Next steps:
    echo - To push to remote: git push
    echo - To view commit: git log --oneline -1
) else (
    echo.
    echo ❌ Commit failed!
)

echo.
pause