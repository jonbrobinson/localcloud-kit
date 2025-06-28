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
.PHONY: setup check-prerequisites

# Default target
help: ## Show this help message
	@echo "$(GREEN)LocalStack Template - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)LocalStack Management:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(start|stop|restart|status|logs|clean)"
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
	@echo "  make start                    # Start LocalStack"
	@echo "  make gui-start                # Start GUI system (Web + API)"
	@echo "  make shell-create ENV=dev     # Create resources with Shell scripts"
	@echo "  make clean                    # Clean up all resources"

# LocalStack Management
start: ## Start LocalStack container
	@echo "$(GREEN)Starting LocalStack...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Waiting for LocalStack to be ready...$(NC)"
	@until curl -s $(AWS_ENDPOINT) > /dev/null; do sleep 2; done
	@echo "$(GREEN)LocalStack is ready at $(AWS_ENDPOINT)$(NC)"

stop: ## Stop LocalStack container
	@echo "$(YELLOW)Stopping LocalStack...$(NC)"
	docker-compose down

restart: stop start ## Restart LocalStack container

status: ## Check LocalStack status
	@echo "$(YELLOW)LocalStack Status:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)LocalStack Health Check:$(NC)"
	@curl -s $(AWS_ENDPOINT) || echo "$(RED)LocalStack is not responding$(NC)"

logs: ## View LocalStack logs
	docker-compose logs -f localstack

clean: ## Clean up all resources and stop LocalStack
	@echo "$(YELLOW)Cleaning up all resources...$(NC)"
	@make shell-destroy ENV=dev || true
	@make shell-destroy ENV=uat || true
	@make shell-destroy ENV=prod || true
	@make gui-stop || true
	@make stop
	@echo "$(GREEN)Cleanup complete$(NC)"

# GUI Management
gui-start: ## Start the LocalStack Manager GUI system
	@echo "$(BLUE)Starting LocalStack Manager GUI...$(NC)"
	@echo "$(GREEN)Starting API Server...$(NC)"
	@cd localstack-api && npm install && npm start &
	@echo "$(GREEN)Starting Web GUI...$(NC)"
	@cd localstack-gui && npm install && npm run dev &
	@echo "$(GREEN)GUI System started!$(NC)"
	@echo "$(YELLOW)Web GUI: http://localhost:3030$(NC)"
	@echo "$(YELLOW)API Server: http://localhost:3031$(NC)"

gui-stop: ## Stop the LocalStack Manager GUI system
	@echo "$(YELLOW)Stopping LocalStack Manager GUI...$(NC)"
	@pkill -f "next dev" || true
	@pkill -f "node.*server.js" || true
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
	@chmod +x scripts/shell/*.sh
	@echo "$(GREEN)Setup complete$(NC)"

check-prerequisites: ## Check if prerequisites are installed
	@echo "$(YELLOW)Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Docker is required but not installed$(NC)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)Docker Compose is required but not installed$(NC)"; exit 1; }
	@command -v aws >/dev/null 2>&1 || { echo "$(RED)AWS CLI is required but not installed$(NC)"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Node.js is required but not installed$(NC)"; exit 1; }
	@echo "$(GREEN)Prerequisites check passed$(NC)" 