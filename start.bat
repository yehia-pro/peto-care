@echo off
echo Starting Veterinary Network Platform...
echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting development server...
echo The website will open automatically in your browser at http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.
start http://localhost:5173
call npm run dev








