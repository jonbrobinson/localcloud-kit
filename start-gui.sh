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

# Main execution
main() {
    print_status "Initializing LocalStack Manager..."
    
    # Check prerequisites
        check_docker
        check_docker_compose
    
    # Start services
        start_docker_services
        
    # Display success message
        echo ""
    print_success "LocalStack Manager is now running!"
        echo ""
        echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                        🌐 Access URLs                        ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  🖥️  Web GUI:     http://localhost:3030                     ║"
    echo "║  🔌 API Server:  http://localhost:3030/api                  ║"
    echo "║  🐳 LocalStack:  http://localhost:4566                      ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    print_status "Use 'docker compose logs -f' to view logs"
    print_status "Containers are running in the background"
    echo ""
    print_success "Startup complete! Services will continue running in background."
    print_status "Use 'docker compose down' to stop all services"
    exit 0
}

# Run main function
main "$@" 