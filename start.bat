@echo off
title SmartBank Management System
echo ===================================================
echo   Starting SmartBank Management System
echo ===================================================
echo.

:: Auto-launch browser after brief server initialization delay
start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"

cd /d "%~dp0"
node dev.js
pause
