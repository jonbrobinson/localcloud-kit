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
echo "║  🐳 Containerized with Docker                               ║"
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    print_success "Docker $(docker --version) detected"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker Compose $(docker-compose --version) detected"
}

# Start services with Docker Compose
start_docker_services() {
    print_status "Starting LocalStack Manager with Docker Compose..."
    
    # Build and start services
    docker compose up --build -d
    
    print_success "Docker services started"
    print_status "Waiting for services to be ready..."
    
    # Wait for GUI to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3030/health > /dev/null 2>&1; then
            print_success "All services are ready!"
            break
        fi
        
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_warning "Services may still be starting up. Please check manually."
    fi
}

# Start services with traditional method (for development)
start_traditional_services() {
    print_status "Starting LocalStack Manager with traditional method..."
    
    # Check if Node.js is installed
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
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm --version) detected"
    
    # Install dependencies for GUI
    print_status "Installing GUI dependencies..."
    cd localstack-gui
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "GUI dependencies installed"
    else
        print_status "GUI dependencies already installed"
    fi
    cd ..
    
    # Install dependencies for API
    print_status "Installing API dependencies..."
    cd localstack-api
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "API dependencies installed"
    else
        print_status "API dependencies already installed"
    fi
    cd ..
    
    # Start the API server
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
    
    # Start the GUI
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
    
    # Check if Docker method is preferred
    if [ "$1" = "--docker" ] || [ "$1" = "-d" ]; then
        print_status "Using Docker method..."
        check_docker
        check_docker_compose
        start_docker_services
        
        echo ""
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║                    🎉 Docker Startup Complete!               ║"
        echo "║                                                              ║"
        echo "║  📊 Dashboard: http://localhost:3030                        ║"
        echo "║  🔧 API Server: http://localhost:3030/api                   ║"
        echo "║  🐳 LocalStack: http://localhost:4566                       ║"
        echo "║                                                              ║"
        echo "║  💼 Powered by CloudStack Solutions                         ║"
        echo "║  🏢 Enterprise AWS Development Tools                        ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo ""
        print_status "Use 'docker-compose down' to stop all services"
        print_status "Use 'docker-compose logs -f' to view logs"
        
    else
        print_status "Using traditional method (for development)..."
        print_warning "Docker method is recommended. Use './start-gui.sh --docker' for Docker setup."
        start_traditional_services
        
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
    fi
}

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "LocalStack Manager Startup Script"
    echo ""
    echo "Usage:"
    echo "  ./start-gui.sh              # Start with traditional method (development)"
    echo "  ./start-gui.sh --docker     # Start with Docker (recommended)"
    echo "  ./start-gui.sh -d           # Start with Docker (short form)"
    echo "  ./start-gui.sh --help       # Show this help"
    echo ""
    echo "Docker method is recommended for production and team environments."
    echo "Traditional method is useful for development and debugging."
    exit 0
fi

# Run main function
main "$@" 