@echo off
REM 🏥 Veterinary Network - Database Setup Script (Windows)
REM This script automatically sets up PostgreSQL and MongoDB databases

echo 🚀 Starting Veterinary Network Database Setup...
echo =================================================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [WARNING] Running as administrator - this is not recommended for database setup
)

REM Function to print colored output (simplified for Windows)
echo [INFO] Checking dependencies...

REM Check PostgreSQL
where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] PostgreSQL (psql) is not installed or not in PATH
    echo Please install PostgreSQL from: https://www.postgresql.org/download/
    pause
    exit /b 1
)

REM Check MongoDB
where mongo >nul 2>&1
if %errorLevel% neq 0 (
    where mongosh >nul 2>&1
    if %errorLevel% neq 0 (
        echo [ERROR] MongoDB client is not installed or not in PATH
        echo Please install MongoDB from: https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )
)

echo [INFO] All dependencies are available

REM Setup PostgreSQL
echo [INFO] Setting up PostgreSQL database...

REM Check if database exists
psql -U postgres -l | findstr "veterinary_db" >nul
if %errorLevel% equ 0 (
    echo [WARNING] Database 'veterinary_db' already exists
    set /p drop_db=Do you want to drop and recreate it? (y/N): 
    if /i "%drop_db%"=="y" (
        echo [INFO] Dropping existing database...
        psql -U postgres -c "DROP DATABASE veterinary_db;"
    ) else (
        echo [INFO] Using existing database
        goto :mongodb_setup
    )
)

REM Create database
echo [INFO] Creating PostgreSQL database...
psql -U postgres -c "CREATE DATABASE veterinary_db;"
if %errorLevel% neq 0 (
    echo [ERROR] Failed to create database
    pause
    exit /b 1
)

REM Run setup script
echo [INFO] Running PostgreSQL setup script...
psql -U postgres -d veterinary_db -f database-setup.sql
if %errorLevel% neq 0 (
    echo [ERROR] Failed to run PostgreSQL setup script
    pause
    exit /b 1
)

echo [INFO] PostgreSQL setup completed successfully

:mongodb_setup
REM Setup MongoDB
echo [INFO] Setting up MongoDB database...

REM Check if MongoDB is running
mongo --eval "db.runCommand({ping: 1})" >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] MongoDB is not running. Please start MongoDB service first.
    echo On Windows: net start MongoDB
    pause
    exit /b 1
)

REM Run MongoDB setup script
echo [INFO] Running MongoDB setup script...
mongo mongodb-setup.js
if %errorLevel% neq 0 (
    echo [ERROR] Failed to run MongoDB setup script
    pause
    exit /b 1
)

echo [INFO] MongoDB setup completed successfully

REM Create environment files
echo [INFO] Creating environment files...

if not exist .env (
    copy .env.example .env
    echo [INFO] Created main .env file from template
) else (
    echo [WARNING] Main .env file already exists
)

if not exist server\.env (
    copy server\.env.example server\.env >nul 2>&1
    echo [INFO] Created server .env file
) else (
    echo [WARNING] Server .env file already exists
)

REM Install dependencies
echo [INFO] Installing dependencies...

if exist package.json (
    echo [INFO] Installing main project dependencies...
    npm install
)

if exist server\package.json (
    echo [INFO] Installing server dependencies...
    cd server
    npm install
    cd ..
)

REM Test database connections
echo [INFO] Testing database connections...

echo [INFO] Testing PostgreSQL connection...
psql -U postgres -d veterinary_db -c "SELECT current_database();" >nul 2>&1
if %errorLevel% equ 0 (
    echo [INFO] ✅ PostgreSQL connection successful
) else (
    echo [ERROR] ❌ PostgreSQL connection failed
    pause
    exit /b 1
)

echo [INFO] Testing MongoDB connection...
mongo --eval "use veterinary_chat; db.runCommand({ping: 1});" >nul 2>&1
if %errorLevel% equ 0 (
    echo [INFO] ✅ MongoDB connection successful
) else (
    echo [ERROR] ❌ MongoDB connection failed
    pause
    exit /b 1
)

echo.
echo 🎉 Database setup completed successfully!
echo.
echo Next steps:
echo 1. Update the .env files with your actual API keys and credentials
echo 2. Start the development servers:
echo    - Frontend: npm run dev
echo    - Backend: npm run server:dev
echo.
echo 📖 For detailed instructions, see DATABASE_SETUP_GUIDE.md
echo.
pause