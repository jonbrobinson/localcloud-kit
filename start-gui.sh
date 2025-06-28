#!/bin/bash

# LocalStack Manager Startup Script
# CloudStack Solutions - Enterprise AWS Development Tools

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 LocalStack Manager                    ║"
echo "║                                                              ║"
echo "║  💼 Powered by CloudStack Solutions                         ║"
echo "║  🏢 Enterprise AWS Development Tools                        ║"
echo "║  📦 LocalStack Manager v1.0.0                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm --version) detected"
}

# Install dependencies for GUI
install_gui_deps() {
    print_status "Installing GUI dependencies..."
    cd localstack-gui
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "GUI dependencies installed"
    else
        print_status "GUI dependencies already installed"
    fi
    cd ..
}

# Install dependencies for API
install_api_deps() {
    print_status "Installing API dependencies..."
    cd localstack-api
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "API dependencies installed"
    else
        print_status "API dependencies already installed"
    fi
    cd ..
}

# Start the API server
start_api() {
    print_status "Starting LocalStack Manager API server..."
    cd localstack-api
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Start the API server in background
    npm start > logs/api.log 2>&1 &
    API_PID=$!
    
    # Wait a moment for the server to start
    sleep 3
    
    # Check if the server is running
    if kill -0 $API_PID 2>/dev/null; then
        print_success "API server started (PID: $API_PID)"
        print_status "API logs: localstack-api/logs/api.log"
    else
        print_error "Failed to start API server"
        exit 1
    fi
    
    cd ..
}

# Start the GUI
start_gui() {
    print_status "Starting LocalStack Manager GUI..."
    cd localstack-gui
    
    # Start the GUI in background
    npm run dev > ../localstack-api/logs/gui.log 2>&1 &
    GUI_PID=$!
    
    # Wait a moment for the server to start
    sleep 5
    
    # Check if the server is running
    if kill -0 $GUI_PID 2>/dev/null; then
        print_success "GUI started (PID: $GUI_PID)"
        print_status "GUI logs: localstack-api/logs/gui.log"
    else
        print_error "Failed to start GUI"
        exit 1
    fi
    
    cd ..
}

# Function to handle cleanup on exit
cleanup() {
    print_status "Shutting down LocalStack Manager..."
    
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
        print_status "API server stopped"
    fi
    
    if [ ! -z "$GUI_PID" ]; then
        kill $GUI_PID 2>/dev/null || true
        print_status "GUI stopped"
    fi
    
    print_success "LocalStack Manager shutdown complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_status "Initializing LocalStack Manager..."
    
    # Check prerequisites
    check_node
    check_npm
    
    # Install dependencies
    install_gui_deps
    install_api_deps
    
    # Start services
    start_api
    start_gui
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 Startup Complete!                      ║"
    echo "║                                                              ║"
    echo "║  📊 Dashboard: http://localhost:3030                        ║"
    echo "║  🔧 API Server: http://localhost:3031                       ║"
    echo "║                                                              ║"
    echo "║  💼 Powered by CloudStack Solutions                         ║"
    echo "║  🏢 Enterprise AWS Development Tools                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    print_status "Press Ctrl+C to stop all services"
    
    # Keep the script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@" 