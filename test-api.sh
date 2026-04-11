#!/bin/bash

# 🧪 Veterinary Network - API Testing Script
# This script tests all API endpoints to ensure they work correctly

API_URL="http://localhost:4000/api"
ECHO_API_URL="http://localhost:4000/api/echo"

echo "🧪 Starting API Testing for Veterinary Network"
echo "=============================================="
echo "Testing API endpoints at: $API_URL"
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Status: $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Function to check if server is running
check_server() {
    echo -n "Checking if API server is running... "
    
    if curl -s -f "$ECHO_API_URL" > /dev/null; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not responding${NC}"
        echo "Please start the server first with: npm run server:dev"
        exit 1
    fi
}

# Function to create test data
create_test_data() {
    echo "📝 Creating test data..."
    
    # Create test user
    test_user_response=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "testuser@example.com",
            "password": "TestPass123!",
            "fullName": "Test User",
            "role": "user"
        }')
    
    echo "Test user created"
}

# Main testing function
main() {
    # Check server
    check_server
    echo
    
    # Authentication Tests
    echo "🔐 Testing Authentication Endpoints"
    echo "------------------------------------"
    
    test_endpoint "POST" "/auth/register" \
        '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}' \
        "201" "User Registration"
    
    test_endpoint "POST" "/auth/login" \
        '{"email":"test@example.com","password":"Test123!"}' \
        "200" "User Login"
    
    test_endpoint "POST" "/auth/forgot-password" \
        '{"email":"test@example.com"}' \
        "200" "Forgot Password"
    
    echo
    
    # User Management Tests
    echo "👥 Testing User Management"
    echo "-------------------------"
    
    test_endpoint "GET" "/users/profile" \
        "" \
        "401" "Get Profile (Unauthenticated)"
    
    echo
    
    # Veterinary Tests
    echo "🏥 Testing Veterinary Endpoints"
    echo "--------------------------------"
    
    test_endpoint "GET" "/vets" \
        "" \
        "200" "Get All Vets"
    
    test_endpoint "GET" "/vets/countries" \
        "" \
        "200" "Get Vet Countries"
    
    test_endpoint "GET" "/vets/specializations" \
        "" \
        "200" "Get Specializations"
    
    echo
    
    # Appointment Tests
    echo "📅 Testing Appointment Endpoints"
    echo "---------------------------------"
    
    test_endpoint "GET" "/appointments" \
        "" \
        "401" "Get Appointments (Unauthenticated)"
    
    test_endpoint "POST" "/appointments" \
        '{"title":"Test Appointment","description":"Test","scheduledTime":"2024-12-31T10:00:00Z","duration":30}' \
        "401" "Create Appointment (Unauthenticated)"
    
    echo
    
    # Pet Records Tests
    echo "🐕 Testing Pet Records"
    echo "---------------------"
    
    test_endpoint "GET" "/records" \
        "" \
        "401" "Get Pet Records (Unauthenticated)"
    
    test_endpoint "POST" "/records" \
        '{"petName":"Buddy","species":"Dog","breed":"Golden Retriever","age":3,"weight":25.5}' \
        "401" "Create Pet Record (Unauthenticated)"
    
    echo
    
    # Review Tests
    echo "⭐ Testing Review Endpoints"
    echo "---------------------------"
    
    test_endpoint "GET" "/reviews" \
        "" \
        "200" "Get All Reviews"
    
    test_endpoint "GET" "/reviews/stats" \
        "" \
        "200" "Get Review Statistics"
    
    echo
    
    # Payment Tests
    echo "💳 Testing Payment Endpoints"
    echo "----------------------------"
    
    test_endpoint "GET" "/payments/config" \
        "" \
        "200" "Get Payment Config"
    
    echo
    
    # Upload Tests
    echo "📁 Testing Upload Endpoints"
    echo "--------------------------"
    
    test_endpoint "GET" "/uploads/config" \
        "" \
        "200" "Get Upload Config"
    
    echo
    
    # Admin Tests
    echo "🔧 Testing Admin Endpoints"
    echo "-------------------------"
    
    test_endpoint "GET" "/admin/dashboard" \
        "" \
        "401" "Admin Dashboard (Unauthenticated)"
    
    test_endpoint "GET" "/admin/stats" \
        "" \
        "401" "Admin Stats (Unauthenticated)"
    
    echo
    
    # Health Check
    echo "🏥 Testing Health Endpoints"
    echo "---------------------------"
    
    test_endpoint "GET" "/health" \
        "" \
        "200" "Health Check"
    
    test_endpoint "GET" "/health/database" \
        "" \
        "200" "Database Health"
    
    echo
    
    # Summary
    echo "=============================================="
    echo "📊 Test Summary:"
    echo -e "✅ ${GREEN}Passed:${NC} $PASSED"
    echo -e "❌ ${RED}Failed:${NC} $FAILED"
    echo -e "⚠️  ${YELLOW}Skipped:${NC} $SKIPPED"
    echo
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! API is working correctly.${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please check the server logs.${NC}"
        exit 1
    fi
}

# Run tests
main "$@"