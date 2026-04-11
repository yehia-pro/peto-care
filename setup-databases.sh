#!/bin/bash

# 🏥 Veterinary Network - Database Setup Script
# This script automatically sets up PostgreSQL and MongoDB databases

echo "🚀 Starting Veterinary Network Database Setup..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL (psql) is not installed or not in PATH"
        exit 1
    fi
    
    # Check MongoDB
    if ! command -v mongo &> /dev/null && ! command -v mongosh &> /dev/null; then
        print_error "MongoDB client is not installed or not in PATH"
        exit 1
    fi
    
    print_status "All dependencies are available"
}

# Setup PostgreSQL
setup_postgres() {
    print_status "Setting up PostgreSQL database..."
    
    # Check if database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw veterinary_db; then
        print_warning "Database 'veterinary_db' already exists"
        read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Dropping existing database..."
            psql -U postgres -c "DROP DATABASE veterinary_db;"
        else
            print_status "Using existing database"
            return 0
        fi
    fi
    
    # Create database
    print_status "Creating PostgreSQL database..."
    if psql -U postgres -c "CREATE DATABASE veterinary_db;"; then
        print_status "Database created successfully"
    else
        print_error "Failed to create database"
        exit 1
    fi
    
    # Run setup script
    print_status "Running PostgreSQL setup script..."
    if psql -U postgres -d veterinary_db -f database-setup.sql; then
        print_status "PostgreSQL setup completed successfully"
    else
        print_error "Failed to run PostgreSQL setup script"
        exit 1
    fi
}

# Setup MongoDB
setup_mongodb() {
    print_status "Setting up MongoDB database..."
    
    # Check if MongoDB is running
    if ! mongo --eval "db.runCommand({ping: 1})" &> /dev/null; then
        print_error "MongoDB is not running. Please start MongoDB service first."
        print_warning "On Windows: net start MongoDB"
        print_warning "On macOS/Linux: sudo systemctl start mongod"
        exit 1
    fi
    
    # Run MongoDB setup script
    print_status "Running MongoDB setup script..."
    if mongo mongodb-setup.js; then
        print_status "MongoDB setup completed successfully"
    else
        print_error "Failed to run MongoDB setup script"
        exit 1
    fi
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Check if main .env exists
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Created main .env file from template"
    else
        print_warning "Main .env file already exists"
    fi
    
    # Check if server .env exists
    if [ ! -f server/.env ]; then
        cp server/.env.example server/.env 2>/dev/null || true
        print_status "Created server .env file"
    else
        print_warning "Server .env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install main dependencies
    if [ -f package.json ]; then
        print_status "Installing main project dependencies..."
        npm install
    fi
    
    # Install server dependencies
    if [ -f server/package.json ]; then
        print_status "Installing server dependencies..."
        cd server && npm install && cd ..
    fi
}

# Test database connections
test_connections() {
    print_status "Testing database connections..."
    
    # Test PostgreSQL connection
    print_status "Testing PostgreSQL connection..."
    if psql -U postgres -d veterinary_db -c "SELECT current_database();" &> /dev/null; then
        print_status "✅ PostgreSQL connection successful"
    else
        print_error "❌ PostgreSQL connection failed"
        exit 1
    fi
    
    # Test MongoDB connection
    print_status "Testing MongoDB connection..."
    if mongo --eval "use veterinary_chat; db.runCommand({ping: 1});" &> /dev/null; then
        print_status "✅ MongoDB connection successful"
    else
        print_error "❌ MongoDB connection failed"
        exit 1
    fi
}

# Main execution
main() {
    echo "🏥 Veterinary Network Database Setup"
    echo "====================================="
    echo
    
    # Check if running as root (not recommended)
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root is not recommended for database setup"
    fi
    
    # Check dependencies
    check_dependencies
    
    # Create environment files
    create_env_files
    
    # Setup databases
    setup_postgres
    setup_mongodb
    
    # Install dependencies
    install_dependencies
    
    # Test connections
    test_connections
    
    echo
    print_status "🎉 Database setup completed successfully!"
    echo
    print_status "Next steps:"
    echo "1. Update the .env files with your actual API keys and credentials"
    echo "2. Start the development servers:"
    echo "   - Frontend: npm run dev"
    echo "   - Backend: npm run server:dev"
    echo
    print_status "📖 For detailed instructions, see DATABASE_SETUP_GUIDE.md"
}

# Run main function
main "$@"