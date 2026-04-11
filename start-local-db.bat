@echo off
echo Starting MongoDB Service...
net start mongodb
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start MongoDB service.
    echo Please right-click this file and select "Run as administrator".
    pause
    exit /b 1
)
echo.
echo ✅ MongoDB Service started successfully!
pause
