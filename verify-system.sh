#!/bin/bash

# 🔍 Veterinary Network - System Verification Script
# This script verifies that all system components are properly set up

echo "🔍 Veterinary Network System Verification"
echo "========================================="
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Function to print status
print_check() {
    echo -n "Checking $1... "
}

print_pass() {
    echo -e "${GREEN}✅ PASS${NC}"
    ((CHECKS_PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL${NC}"
    echo "  $1"
    ((CHECKS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    echo "  $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}"
    echo "  $1"
}

# Check Node.js installation
check_nodejs() {
    print_check "Node.js"
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_pass "Node.js $NODE_VERSION is installed"
    else
        print_fail "Node.js is not installed. Please install from https://nodejs.org/"
    fi
}

# Check npm installation
check_npm() {
    print_check "npm"
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_pass "npm $NPM_VERSION is installed"
    else
        print_fail "npm is not installed. Usually comes with Node.js"
    fi
}

# Check PostgreSQL installation
check_postgres() {
    print_check "PostgreSQL"
    if command -v psql &> /dev/null; then
        POSTGRES_VERSION=$(psql --version | awk '{print $3}')
        print_pass "PostgreSQL $POSTGRES_VERSION is installed"
    else
        print_fail "PostgreSQL is not installed. Please install from https://www.postgresql.org/download/"
    fi
}

# Check PostgreSQL service
check_postgres_service() {
    print_check "PostgreSQL Service"
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        print_pass "PostgreSQL service is running on port 5432"
    else
        print_fail "PostgreSQL service is not running. Start it with: sudo systemctl start postgresql"
    fi
}

# Check MongoDB installation
check_mongodb() {
    print_check "MongoDB"
    if command -v mongo &> /dev/null || command -v mongosh &> /dev/null; then
        if command -v mongosh &> /dev/null; then
            MONGO_VERSION=$(mongosh --version | head -n1 | awk '{print $4}')
            print_pass "MongoDB Shell $MONGO_VERSION is installed"
        else
            MONGO_VERSION=$(mongo --version | head -n1 | awk '{print $4}')
            print_pass "MongoDB Shell $MONGO_VERSION is installed"
        fi
    else
        print_fail "MongoDB is not installed. Please install from https://www.mongodb.com/try/download/community"
    fi
}

# Check MongoDB service
check_mongodb_service() {
    print_check "MongoDB Service"
    if mongo --eval "db.runCommand({ping: 1})" &> /dev/null; then
        print_pass "MongoDB service is running"
    else
        print_fail "MongoDB service is not running. Start it with: sudo systemctl start mongod"
    fi
}

# Check Redis (optional)
check_redis() {
    print_check "Redis (Optional)"
    if command -v redis-cli &> /dev/null; then
        REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
        if redis-cli ping &> /dev/null; then
            print_pass "Redis $REDIS_VERSION is installed and running"
        else
            print_warning "Redis $REDIS_VERSION is installed but not running. Start with: sudo systemctl start redis"
        fi
    else
        print_info "Redis is not installed (optional). Install from https://redis.io/download if needed"
    fi
}

# Check project dependencies
check_dependencies() {
    print_check "Project Dependencies"
    if [ -f package.json ]; then
        if [ -d node_modules ]; then
            print_pass "Main project dependencies are installed"
        else
            print_fail "Main project dependencies not installed. Run: npm install"
        fi
    else
        print_fail "package.json not found. Are you in the right directory?"
    fi
}

# Check server dependencies
check_server_dependencies() {
    print_check "Server Dependencies"
    if [ -f server/package.json ]; then
        if [ -d server/node_modules ]; then
            print_pass "Server dependencies are installed"
        else
            print_fail "Server dependencies not installed. Run: cd server && npm install"
        fi
    else
        print_fail "server/package.json not found"
    fi
}

# Check environment files
check_env_files() {
    print_check "Environment Files"
    
    if [ -f .env ]; then
        print_pass "Main .env file exists"
        
        # Check for required variables
        if grep -q "POSTGRES_URL" .env; then
            print_pass "POSTGRES_URL is configured"
        else
            print_fail "POSTGRES_URL is missing in .env"
        fi
        
        if grep -q "MONGODB_URI" .env; then
            print_pass "MONGODB_URI is configured"
        else
            print_fail "MONGODB_URI is missing in .env"
        fi
    else
        print_fail ".env file not found. Copy from .env.example: cp .env.example .env"
    fi
    
    if [ -f server/.env ]; then
        print_pass "Server .env file exists"
    else
        print_warning "server/.env file not found. Copy from server/.env.example"
    fi
}

# Check database setup
check_database_setup() {
    print_check "Database Setup"
    
    # Check if PostgreSQL database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw veterinary_db; then
        print_pass "PostgreSQL database 'veterinary_db' exists"
        
        # Check if tables exist
        table_count=$(psql -U postgres -d veterinary_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | xargs)
        if [ "$table_count" -gt 0 ]; then
            print_pass "PostgreSQL tables are set up ($table_count tables)"
        else
            print_fail "PostgreSQL tables are missing. Run: psql -U postgres -d veterinary_db -f database-setup.sql"
        fi
    else
        print_fail "PostgreSQL database 'veterinary_db' does not exist. Run the setup script"
    fi
    
    # Check MongoDB collections
    if mongo --eval "use veterinary_chat; db.getCollectionNames().length" &> /dev/null; then
        collection_count=$(mongo --eval "use veterinary_chat; db.getCollectionNames().length" --quiet)
        if [ "$collection_count" -gt 0 ]; then
            print_pass "MongoDB collections are set up ($collection_count collections)"
        else
            print_warning "MongoDB collections are missing. Run: mongo mongodb-setup.js"
        fi
    else
        print_fail "MongoDB database setup failed or service not running"
    fi
}

# Check build status
check_build() {
    print_check "Build Status"
    
    if [ -f tsconfig.json ]; then
        if npm run build &> /dev/null; then
            print_pass "Project builds successfully"
        else
            print_fail "Project build failed. Check TypeScript errors"
        fi
    else
        print_warning "tsconfig.json not found. Build check skipped"
    fi
}

# Check server status
check_server_status() {
    print_check "Server Status"
    
    if curl -s -f "http://localhost:4000/api/health" > /dev/null; then
        print_pass "Backend server is running on port 4000"
    else
        print_fail "Backend server is not running. Start with: cd server && npm run dev"
    fi
}

# Check frontend status
check_frontend_status() {
    print_check "Frontend Status"
    
    if curl -s -f "http://localhost:5173" > /dev/null; then
        print_pass "Frontend development server is running on port 5173"
    else
        print_warning "Frontend server is not running. Start with: npm run dev"
    fi
}

# Main verification function
main() {
    echo "Starting comprehensive system verification..."
    echo
    
    # Core dependencies
    check_nodejs
    check_npm
    echo
    
    # Database systems
    check_postgres
    check_postgres_service
    check_mongodb
    check_mongodb_service
    check_redis
    echo
    
    # Project setup
    check_dependencies
    check_server_dependencies
    check_env_files
    check_database_setup
    echo
    
    # Build and runtime
    check_build
    check_server_status
    check_frontend_status
    echo
    
    # Summary
    echo "========================================="
    echo "📊 Verification Summary:"
    echo -e "✅ ${GREEN}Checks Passed:${NC} $CHECKS_PASSED"
    echo -e "❌ ${RED}Checks Failed:${NC} $CHECKS_FAILED"
    echo -e "⚠️  ${YELLOW}Warnings:${NC} $WARNINGS"
    echo
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 System is ready for development!${NC}"
        echo
        echo "Next steps:"
        echo "1. Update .env files with your actual API keys"
        echo "2. Start development servers:"
        echo "   - Frontend: npm run dev"
        echo "   - Backend: cd server && npm run dev"
        echo
        echo "For detailed setup instructions, see DATABASE_SETUP_GUIDE.md"
        exit 0
    else
        echo -e "${RED}❌ System has issues that need to be resolved.${NC}"
        echo
        echo "Please fix the failed checks above before proceeding."
        echo "For help, see DATABASE_SETUP_GUIDE.md or run the setup scripts:"
        echo "- ./setup-databases.sh (Linux/Mac)"
        echo "- setup-databases.bat (Windows)"
        exit 1
    fi
}

# Run verification
main "$@"