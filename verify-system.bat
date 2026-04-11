@echo off
REM 🔍 Veterinary Network - System Verification Script (Windows)
REM This script verifies that all system components are properly set up

echo 🔍 Veterinary Network System Verification
echo =========================================
echo.

REM Status counters
set CHECKS_PASSED=0
set CHECKS_FAILED=0
set WARNINGS=0

REM Function to print status
:print_check\echo|set /p="Checking %1... "
goto :eof

:print_pass
echo [PASS]
set /a CHECKS_PASSED+=1
goto :eof

:print_fail
echo [FAIL]
echo   %1
set /a CHECKS_FAILED+=1
goto :eof

:print_warning
echo [WARNING]
echo   %1
set /a WARNINGS+=1
goto :eof

:print_info
echo [INFO]
echo   %1
goto :eof

REM Check Node.js installation
:check_nodejs
call :print_check "Node.js"
node --version >nul 2>nul
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    call :print_pass "Node.js %NODE_VERSION% is installed"
) else (
    call :print_fail "Node.js is not installed. Please install from https://nodejs.org/"
)
goto :eof

REM Check npm installation
:check_npm
call :print_check "npm"
npm --version >nul 2>nul
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    call :print_pass "npm %NPM_VERSION% is installed"
) else (
    call :print_fail "npm is not installed. Usually comes with Node.js"
)
goto :eof

REM Check PostgreSQL installation
:check_postgres
call :print_check "PostgreSQL"
psql --version >nul 2>nul
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('psql --version') do set POSTGRES_VERSION=%%i
    call :print_pass "PostgreSQL is installed"
) else (
    call :print_fail "PostgreSQL is not installed. Please install from https://www.postgresql.org/download/"
)
goto :eof

REM Check PostgreSQL service
:check_postgres_service
call :print_check "PostgreSQL Service"
pg_isready -h localhost -p 5432 >nul 2>nul
if %errorLevel% equ 0 (
    call :print_pass "PostgreSQL service is running on port 5432"
) else (
    call :print_fail "PostgreSQL service is not running. Start it with: net start postgresql"
)
goto :eof

REM Check MongoDB installation
:check_mongodb
call :print_check "MongoDB"
mongo --version >nul 2>nul
if %errorLevel% equ 0 (
    call :print_pass "MongoDB Shell is installed"
) else (
    mongosh --version >nul 2>nul
    if %errorLevel% equ 0 (
        call :print_pass "MongoDB Shell is installed"
    ) else (
        call :print_fail "MongoDB is not installed. Please install from https://www.mongodb.com/try/download/community"
    )
)
goto :eof

REM Check MongoDB service
:check_mongodb_service
call :print_check "MongoDB Service"
mongo --eval "db.runCommand({ping: 1})" >nul 2>nul
if %errorLevel% equ 0 (
    call :print_pass "MongoDB service is running"
) else (
    call :print_fail "MongoDB service is not running. Start it with: net start mongodb"
)
goto :eof

REM Check Redis (optional)
:check_redis
call :print_check "Redis (Optional)"
redis-cli --version >nul 2>nul
if %errorLevel% equ 0 (
    redis-cli ping >nul 2>nul
    if %errorLevel% equ 0 (
        call :print_pass "Redis is installed and running"
    ) else (
        call :print_warning "Redis is installed but not running. Start with: net start redis"
    )
) else (
    call :print_info "Redis is not installed (optional). Install from https://redis.io/download if needed"
)
goto :eof

REM Check project dependencies
:check_dependencies
call :print_check "Project Dependencies"
if exist package.json (
    if exist node_modules (
        call :print_pass "Main project dependencies are installed"
    ) else (
        call :print_fail "Main project dependencies not installed. Run: npm install"
    )
) else (
    call :print_fail "package.json not found. Are you in the right directory?"
)
goto :eof

REM Check server dependencies
:check_server_dependencies
call :print_check "Server Dependencies"
if exist server\package.json (
    if exist server\node_modules (
        call :print_pass "Server dependencies are installed"
    ) else (
        call :print_fail "Server dependencies not installed. Run: cd server && npm install"
    )
) else (
    call :print_fail "server\package.json not found"
)
goto :eof

REM Check environment files
:check_env_files
call :print_check "Environment Files"

if exist .env (
    call :print_pass "Main .env file exists"
    
    REM Check for required variables
    findstr "POSTGRES_URL" .env >nul
    if %errorLevel% equ 0 (
        call :print_pass "POSTGRES_URL is configured"
    ) else (
        call :print_fail "POSTGRES_URL is missing in .env"
    )
    
    findstr "MONGODB_URI" .env >nul
    if %errorLevel% equ 0 (
        call :print_pass "MONGODB_URI is configured"
    ) else (
        call :print_fail "MONGODB_URI is missing in .env"
    )
) else (
    call :print_fail ".env file not found. Copy from .env.example: copy .env.example .env"
)

if exist server\.env (
    call :print_pass "Server .env file exists"
) else (
    call :print_warning "server\.env file not found. Copy from server\.env.example"
)
goto :eof

REM Check database setup
:check_database_setup
call :print_check "Database Setup"

REM Check if PostgreSQL database exists
psql -U postgres -l | findstr "veterinary_db" >nul
if %errorLevel% equ 0 (
    call :print_pass "PostgreSQL database 'veterinary_db' exists"
    
    REM Check if tables exist
    for /f "tokens=*" %%i in ('psql -U postgres -d veterinary_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"') do set table_count=%%i
    if !table_count! gtr 0 (
        call :print_pass "PostgreSQL tables are set up (!table_count! tables)"
    ) else (
        call :print_fail "PostgreSQL tables are missing. Run: psql -U postgres -d veterinary_db -f database-setup.sql"
    )
) else (
    call :print_fail "PostgreSQL database 'veterinary_db' does not exist. Run the setup script"
)
goto :eof

REM Check build status
:check_build
call :print_check "Build Status"

if exist tsconfig.json (
    npm run build >nul 2>nul
    if %errorLevel% equ 0 (
        call :print_pass "Project builds successfully"
    ) else (
        call :print_fail "Project build failed. Check TypeScript errors"
    )
) else (
    call :print_warning "tsconfig.json not found. Build check skipped"
)
goto :eof

REM Check server status
:check_server_status
call :print_check "Server Status"

curl -s -f "http://localhost:4000/api/health" >nul 2>nul
if %errorLevel% equ 0 (
    call :print_pass "Backend server is running on port 4000"
) else (
    call :print_fail "Backend server is not running. Start with: cd server && npm run dev"
)
goto :eof

REM Check frontend status
:check_frontend_status
call :print_check "Frontend Status"

curl -s -f "http://localhost:5173" >nul 2>nul
if %errorLevel% equ 0 (
    call :print_pass "Frontend development server is running on port 5173"
) else (
    call :print_warning "Frontend server is not running. Start with: npm run dev"
)
goto :eof

REM Main verification function
:main
echo Starting comprehensive system verification...
echo.

REM Core dependencies
call :check_nodejs
call :check_npm
echo.

REM Database systems
call :check_postgres
call :check_postgres_service
call :check_mongodb
call :check_mongodb_service
call :check_redis
echo.

REM Project setup
call :check_dependencies
call :check_server_dependencies
call :check_env_files
call :check_database_setup
echo.

REM Build and runtime
call :check_build
call :check_server_status
call :check_frontend_status
echo.

REM Summary
echo =========================================
echo 📊 Verification Summary:
echo [PASSED]: %CHECKS_PASSED%
echo [FAILED]: %CHECKS_FAILED%
echo [WARNINGS]: %WARNINGS%
echo.

if %CHECKS_FAILED% equ 0 (
    echo 🎉 System is ready for development!
    echo.
    echo Next steps:
    echo 1. Update .env files with your actual API keys
    echo 2. Start development servers:
    echo    - Frontend: npm run dev
    echo    - Backend: cd server && npm run dev
    echo.
    echo For detailed setup instructions, see DATABASE_SETUP_GUIDE.md
    pause
    exit /b 0
) else (
    echo ❌ System has issues that need to be resolved.
    echo.
    echo Please fix the failed checks above before proceeding.
    echo For help, see DATABASE_SETUP_GUIDE.md or run the setup scripts:
    echo - ./setup-databases.sh (Linux/Mac)
    echo - setup-databases.bat (Windows)
    pause
    exit /b 1
)

REM Run verification
call :main