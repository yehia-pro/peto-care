@echo off
REM 🧪 Veterinary Network - API Testing Script (Windows)
REM This script tests all API endpoints to ensure they work correctly

set API_URL=http://localhost:4000/api
set ECHO_API_URL=http://localhost:4000/api/echo

echo 🧪 Starting API Testing for Veterinary Network
echo ==============================================
echo Testing API endpoints at: %API_URL%
echo.

REM Test counters
set PASSED=0
set FAILED=0
set SKIPPED=0

REM Function to test an endpoint (simplified for Windows)
:test_endpoint
set method=%1
set endpoint=%2
set data=%3
set expected_status=%4
set description=%5

echo|set /p="Testing %description%... "

if "%method%"=="GET" (
    curl -s -w "
%%{http_code}" -X GET "%API_URL%%endpoint%" > temp_response.txt
)
if "%method%"=="POST" (
    curl -s -w "
%%{http_code}" -X POST "%API_URL%%endpoint%" -H "Content-Type: application/json" -d "%data%" > temp_response.txt
)
if "%method%"=="PUT" (
    curl -s -w "
%%{http_code}" -X PUT "%API_URL%%endpoint%" -H "Content-Type: application/json" -d "%data%" > temp_response.txt
)
if "%method%"=="DELETE" (
    curl -s -w "
%%{http_code}" -X DELETE "%API_URL%%endpoint%" > temp_response.txt
)

REM Read the last line (HTTP status code)
setlocal enabledelayedexpansion
set "http_code="
for /f "delims=" %%i in (temp_response.txt) do (
    set "line=%%i"
    if "!line:~0,1!"=="" set "http_code=!line!"
)

if "%http_code%"=="%expected_status%" (
    echo [PASSED] (Status: %http_code%)
    set /a PASSED+=1
) else (
    echo [FAILED] (Expected: %expected_status%, Got: %http_code%)
    type temp_response.txt
    set /a FAILED+=1
)
endlocal
goto :eof

REM Function to check if server is running
:check_server
echo|set /p="Checking if API server is running... "

curl -s -f "%ECHO_API_URL%" >nul 2>nul
if %errorLevel% equ 0 (
    echo [INFO] Server is running
    goto :eof
) else (
    echo [ERROR] Server is not responding
    echo Please start the server first with: npm run server:dev
    pause
    exit /b 1
)

REM Main testing function
:main
REM Check server
call :check_server
echo.

REM Authentication Tests
echo 🔐 Testing Authentication Endpoints
echo ------------------------------------

call :test_endpoint "POST" "/auth/register" "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"fullName\":\"Test User\"}" "201" "User Registration"

call :test_endpoint "POST" "/auth/login" "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}" "200" "User Login"

call :test_endpoint "POST" "/auth/forgot-password" "{\"email\":\"test@example.com\"}" "200" "Forgot Password"

echo.

REM User Management Tests
echo 👥 Testing User Management
echo -------------------------

call :test_endpoint "GET" "/users/profile" "" "401" "Get Profile (Unauthenticated)"

echo.

REM Veterinary Tests
echo 🏥 Testing Veterinary Endpoints
echo --------------------------------

call :test_endpoint "GET" "/vets" "" "200" "Get All Vets"

call :test_endpoint "GET" "/vets/countries" "" "200" "Get Vet Countries"

call :test_endpoint "GET" "/vets/specializations" "" "200" "Get Specializations"

echo.

REM Appointment Tests
echo 📅 Testing Appointment Endpoints
echo ---------------------------------

call :test_endpoint "GET" "/appointments" "" "401" "Get Appointments (Unauthenticated)"

call :test_endpoint "POST" "/appointments" "{\"title\":\"Test Appointment\",\"description\":\"Test\",\"scheduledTime\":\"2024-12-31T10:00:00Z\",\"duration\":30}" "401" "Create Appointment (Unauthenticated)"

echo.

REM Pet Records Tests
echo 🐕 Testing Pet Records
echo ---------------------

call :test_endpoint "GET" "/records" "" "401" "Get Pet Records (Unauthenticated)"

call :test_endpoint "POST" "/records" "{\"petName\":\"Buddy\",\"species\":\"Dog\",\"breed\":\"Golden Retriever\",\"age\":3,\"weight\":25.5}" "401" "Create Pet Record (Unauthenticated)"

echo.

REM Review Tests
echo ⭐ Testing Review Endpoints
echo ---------------------------

call :test_endpoint "GET" "/reviews" "" "200" "Get All Reviews"

call :test_endpoint "GET" "/reviews/stats" "" "200" "Get Review Statistics"

echo.

REM Payment Tests
echo 💳 Testing Payment Endpoints
echo ----------------------------

call :test_endpoint "GET" "/payments/config" "" "200" "Get Payment Config"

echo.

REM Upload Tests
echo 📁 Testing Upload Endpoints
echo --------------------------

call :test_endpoint "GET" "/uploads/config" "" "200" "Get Upload Config"

echo.

REM Admin Tests
echo 🔧 Testing Admin Endpoints
echo -------------------------

call :test_endpoint "GET" "/admin/dashboard" "" "401" "Admin Dashboard (Unauthenticated)"

call :test_endpoint "GET" "/admin/stats" "" "401" "Admin Stats (Unauthenticated)"

echo.

REM Health Check
echo 🏥 Testing Health Endpoints
echo ---------------------------

call :test_endpoint "GET" "/health" "" "200" "Health Check"

call :test_endpoint "GET" "/health/database" "" "200" "Database Health"

echo.

REM Summary
echo ==============================================
echo 📊 Test Summary:
echo [PASSED]: %PASSED%
echo [FAILED]: %FAILED%
echo [SKIPPED]: %SKIPPED%
echo.

if %FAILED% equ 0 (
    echo 🎉 All tests passed! API is working correctly.
    del temp_response.txt 2>nul
    pause
    exit /b 0
) else (
    echo ❌ Some tests failed. Please check the server logs.
    del temp_response.txt 2>nul
    pause
    exit /b 1
)

REM Run tests
call :main

REM Cleanup
del temp_response.txt 2>nul