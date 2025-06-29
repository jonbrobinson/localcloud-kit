# LocalStack Template Makefile
# Provides automation for LocalStack resource management

# Default values
PROJECT_NAME ?= localstack-template
ENVIRONMENT ?= dev
AWS_ENDPOINT ?= http://localhost:4566
AWS_REGION ?= us-east-1

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help start stop restart status logs clean
.PHONY: shell-create shell-destroy shell-list
.PHONY: gui-start gui-stop gui-restart
.PHONY: setup check-prerequisites docker-build docker-logs

# Default target
help: ## Show this help message
	@echo "$(GREEN)LocalStack Template - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Management:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(start|stop|restart|status|logs|clean|docker)"
	@echo ""
	@echo "$(YELLOW)GUI Management:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "gui"
	@echo ""
	@echo "$(YELLOW)Resource Creation (Shell Scripts):$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "shell"
	@echo ""
	@echo "$(YELLOW)Setup and Utilities:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(setup|check)"
	@echo ""
	@echo "$(YELLOW)Usage Examples:$(NC)"
	@echo "  make start                    # Start all services with Docker"
	@echo "  make gui-start                # Start GUI system with Docker"
	@echo "  make shell-create ENV=dev     # Create resources with Shell scripts"
	@echo "  make clean                    # Clean up all resources"

# Docker Management
start: ## Start all services with Docker Compose
	@echo "$(GREEN)Starting LocalStack Template with Docker...$(NC)"
	docker-compose up --build -d
	@echo "$(GREEN)Waiting for services to be ready...$(NC)"
	@until curl -s http://localhost:3030/health > /dev/null; do sleep 2; done
	@echo "$(GREEN)All services are ready!$(NC)"
	@echo "$(YELLOW)GUI: http://localhost:3030$(NC)"
	@echo "$(YELLOW)API: http://localhost:3030/api$(NC)"
	@echo "$(YELLOW)LocalStack: http://localhost:4566$(NC)"

stop: ## Stop all Docker services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose down

restart: stop start ## Restart all Docker services

status: ## Check Docker services status
	@echo "$(YELLOW)Docker Services Status:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)Health Checks:$(NC)"
	@curl -s http://localhost:3030/health || echo "$(RED)GUI/API not responding$(NC)"
	@curl -s http://localhost:4566/_localstack/health || echo "$(RED)LocalStack not responding$(NC)"

logs: ## View Docker services logs
	docker-compose logs -f

docker-logs: ## View specific service logs
	@echo "$(YELLOW)Available services: gui, api, nginx, localstack$(NC)"
	@echo "$(YELLOW)Usage: make docker-logs SERVICE=gui$(NC)"
	@if [ "$(SERVICE)" != "" ]; then docker-compose logs -f $(SERVICE); fi

docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build

clean: ## Clean up all resources and stop services
	@echo "$(YELLOW)Cleaning up all resources...$(NC)"
	@make shell-destroy ENV=dev || true
	@make shell-destroy ENV=uat || true
	@make shell-destroy ENV=prod || true
	@make stop
	@echo "$(GREEN)Cleanup complete$(NC)"

# GUI Management
gui-start: ## Start the LocalStack Manager GUI system with Docker
	@echo "$(BLUE)Starting LocalStack Manager GUI with Docker...$(NC)"
	docker-compose up --build -d gui api nginx
	@echo "$(GREEN)GUI System started!$(NC)"
	@echo "$(YELLOW)Web GUI: http://localhost:3030$(NC)"
	@echo "$(YELLOW)API Server: http://localhost:3030/api$(NC)"

gui-stop: ## Stop the LocalStack Manager GUI system
	@echo "$(YELLOW)Stopping LocalStack Manager GUI...$(NC)"
	docker-compose stop gui api nginx
	@echo "$(GREEN)GUI System stopped$(NC)"

gui-restart: gui-stop gui-start ## Restart the LocalStack Manager GUI system

# Shell Commands (Standard Automation)
shell-create: check-prerequisites ## Create resources using Shell scripts
	@echo "$(GREEN)Creating resources with Shell scripts for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/shell && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	./create_resources.sh

shell-destroy: ## Destroy resources using Shell scripts
	@echo "$(YELLOW)Destroying resources with Shell scripts for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/shell && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	./destroy_resources.sh

shell-list: ## List resources using Shell scripts
	@echo "$(YELLOW)Listing resources with Shell scripts for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/shell && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	./list_resources.sh

# Setup and Utilities
setup: ## Initial setup - create directories and install dependencies
	@echo "$(GREEN)Setting up LocalStack template...$(NC)"
	@mkdir -p scripts/shell
	@mkdir -p config/{dev,uat,prod}
	@mkdir -p logs
	@mkdir -p volume
	@chmod +x scripts/shell/*.sh
	@echo "$(GREEN)Setup complete$(NC)"

check-prerequisites: ## Check if prerequisites are installed
	@echo "$(YELLOW)Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Docker is required but not installed$(NC)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)Docker Compose is required but not installed$(NC)"; exit 1; }
	@command -v aws >/dev/null 2>&1 || { echo "$(YELLOW)AWS CLI is not installed (optional for local development)$(NC)"; }
	@echo "$(GREEN)Prerequisites check passed$(NC)" 