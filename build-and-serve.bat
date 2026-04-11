@echo off
echo Building Veterinary Network Platform for production...
echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building for production...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo Starting preview server...
echo The website will open automatically in your browser
echo.
echo Press Ctrl+C to stop the server
echo.
timeout /t 2 >nul
start http://localhost:4173
call npm run preview








