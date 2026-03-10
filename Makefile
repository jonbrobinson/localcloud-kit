# LocalStack Template Makefile
# Provides automation for LocalStack resource management

# Default values
PROJECT_NAME ?= localstack-template
ENVIRONMENT ?= dev
AWS_ENDPOINT ?= http://localhost:4566
AWS_REGION ?= us-east-1
LOCALSTACK_VERSION ?= latest

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help start start-legacy stop restart status logs clean
.PHONY: shell-create shell-destroy shell-list
.PHONY: gui-start gui-stop gui-restart
.PHONY: setup check-prerequisites docker-build docker-logs
.PHONY: reset clean-volumes clean-all reset-env
.PHONY: mailpit-logs mailpit-clear
.PHONY: postgres-logs keycloak-logs pgadmin-logs

# Default target
help: ## Show this help message
	@echo "$(GREEN)LocalStack Template - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Management:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(start|stop|restart|status|logs|clean|docker|reset)"
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
	@echo "  make start                              # Start with LocalStack latest"
	@echo "  make start LOCALSTACK_VERSION=4.12      # Start with a specific LocalStack version"
	@echo "  make start-legacy                       # Start with LocalStack 4.12 (community legacy)"
	@echo "  make gui-start                          # Start GUI system with Docker"
	@echo "  make shell-create ENV=dev               # Create resources with Shell scripts"
	@echo "  make clean                              # Clean up all resources"
	@echo "  make reset                              # Reset Docker environment (stop + clean volumes)"
	@echo "  make reset-env                          # Full environment reset (stop + clean all + volumes)"

# Docker Management
start: ## Start all services with Docker Compose (LOCALSTACK_VERSION=latest by default)
	@echo "$(GREEN)Starting LocalStack Template with Docker...$(NC)"
	@echo "$(YELLOW)Using LocalStack version: $(LOCALSTACK_VERSION)$(NC)"
	@mkdir -p volume/cache volume/lib volume/logs volume/tmp
	LOCALSTACK_VERSION=$(LOCALSTACK_VERSION) docker compose up --build -d
	@echo "$(GREEN)Waiting for services to be ready...$(NC)"
	@until curl -s -k https://app-local.localcloudkit.com:3030/health > /dev/null 2>&1 || curl -s http://localhost/health > /dev/null 2>&1; do sleep 2; done
	@echo "$(GREEN)All services are ready!$(NC)"
	@echo ""
	@echo "$(GREEN)--- App URLs (via Traefik, TLS) ---$(NC)"
	@echo "$(YELLOW)  GUI:            https://app-local.localcloudkit.com:3030$(NC)"
	@echo "$(YELLOW)  API:            https://app-local.localcloudkit.com:3030/api$(NC)"
	@echo "$(YELLOW)  Mailpit (mail): https://mailpit.localcloudkit.com:3030$(NC)"
	@echo "$(YELLOW)  Keycloak:       https://keycloak.localcloudkit.com:3030$(NC)"
	@echo "$(YELLOW)  pgAdmin:        https://pgadmin.localcloudkit.com:3030$(NC)"
	@echo ""
	@echo "$(GREEN)--- Direct localhost URLs (no TLS) ---$(NC)"
	@echo "$(YELLOW)  LocalStack:     http://localhost:4566$(NC)"
	@echo "$(YELLOW)  Express API:    http://localhost:3031$(NC)"
	@echo "$(YELLOW)  Mailpit UI:     http://localhost:8025$(NC)"
	@echo "$(YELLOW)  Mailpit SMTP:   localhost:1025$(NC)"
	@echo "$(YELLOW)  Keycloak:       http://localhost:8080$(NC)"
	@echo "$(YELLOW)  pgAdmin:        http://localhost:5050$(NC)"
	@echo ""

start-legacy: ## Start all services using LocalStack 4.12 (community legacy)
	@$(MAKE) start LOCALSTACK_VERSION=4.12

stop: ## Stop all Docker services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker compose down

restart: stop start ## Restart all Docker services

status: ## Check Docker services status
	@echo "$(YELLOW)Docker Services Status:$(NC)"
	@docker compose ps
	@echo ""
	@echo "$(YELLOW)Health Checks:$(NC)"
	@curl -s -k https://app-local.localcloudkit.com:3030/health > /dev/null 2>&1 && echo "$(GREEN)  GUI/API:   https://app-local.localcloudkit.com:3030  ✓$(NC)" || echo "$(RED)  GUI/API:   not responding$(NC)"
	@curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1 && echo "$(GREEN)  LocalStack: http://localhost:4566  ✓$(NC)" || echo "$(RED)  LocalStack: not responding$(NC)"
	@curl -s http://localhost:8025/api/v1/info > /dev/null 2>&1 && echo "$(GREEN)  Mailpit:   http://localhost:8025  ✓$(NC)" || echo "$(YELLOW)  Mailpit:   not responding (may not be running)$(NC)"

logs: ## View Docker services logs
	docker compose logs -f

docker-logs: ## View specific service logs
	@echo "$(YELLOW)Available services: gui, api, nginx, localstack$(NC)"
	@echo "$(YELLOW)Usage: make docker-logs SERVICE=gui$(NC)"
	@if [ "$(SERVICE)" != "" ]; then docker compose logs -f $(SERVICE); fi

docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker compose build

clean: ## Clean up all resources and stop services
	@echo "$(YELLOW)Cleaning up all resources...$(NC)"
	@make shell-destroy ENV=dev || true
	@make shell-destroy ENV=uat || true
	@make shell-destroy ENV=prod || true
	@make stop
	@echo "$(GREEN)Cleanup complete$(NC)"

clean-volumes: ## Clean up Docker volumes (removes all data)
	@echo "$(YELLOW)Cleaning up Docker volumes...$(NC)"
	@echo "$(RED)WARNING: This will remove all Docker volumes and data!$(NC)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker compose down -v
	@docker volume prune -f
	@echo "$(GREEN)Docker volumes cleaned$(NC)"

clean-all: ## Clean up everything including images and containers
	@echo "$(YELLOW)Cleaning up all Docker resources...$(NC)"
	@echo "$(RED)WARNING: This will remove all containers, images, and volumes!$(NC)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker compose down -v --rmi all
	@docker system prune -af --volumes
	@echo "$(GREEN)All Docker resources cleaned$(NC)"

reset: stop clean-volumes ## Reset Docker environment (stop services and clean volumes)
	@echo "$(GREEN)Docker environment reset complete$(NC)"

reset-env: clean clean-all ## Full environment reset (clean resources, stop services, and clean all Docker resources)
	@echo "$(GREEN)Full environment reset complete$(NC)"

# GUI Management
gui-start: ## Start the LocalCloud Kit GUI system with Docker
	@echo "$(BLUE)Starting LocalCloud Kit GUI with Docker...$(NC)"
	@docker compose up -d localcloud-gui localcloud-api nginx
	@echo "$(GREEN)LocalCloud Kit GUI is running at https://app-local.localcloudkit.com:3030$(NC)"

gui-stop: ## Stop the LocalCloud Kit GUI system
	@echo "$(YELLOW)Stopping LocalCloud Kit GUI...$(NC)"
	@docker compose stop localcloud-gui localcloud-api nginx

gui-restart: gui-stop gui-start ## Restart the LocalCloud Kit GUI system

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

# Mailpit Email Testing
mailpit-logs: ## View Mailpit container logs
	docker compose logs -f mailpit

mailpit-clear: ## Clear all Mailpit messages via its API
	@curl -s -X DELETE http://localhost:8025/api/v1/messages \
		&& echo "$(GREEN)All Mailpit messages cleared$(NC)" \
		|| echo "$(RED)Failed to clear messages (is Mailpit running?)$(NC)"

# PostgreSQL / pgAdmin
postgres-logs: ## View PostgreSQL container logs
	docker compose logs -f postgres

pgadmin-logs: ## View pgAdmin container logs
	docker compose logs -f pgadmin

# Keycloak
keycloak-logs: ## View Keycloak container logs
	docker compose logs -f keycloak

# Setup and Utilities
setup: ## Initial setup - create directories and install dependencies
	@echo "$(GREEN)Setting up LocalStack template...$(NC)"
	@mkdir -p scripts/shell
	@mkdir -p logs
	@mkdir -p volume
	@chmod +x scripts/shell/*.sh
	@echo "$(GREEN)Setup complete$(NC)"

check-prerequisites: ## Check if prerequisites are installed
	@echo "$(YELLOW)Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Docker is required but not installed$(NC)"; exit 1; }
	@command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || { echo "$(RED)Docker Compose is required but not installed$(NC)"; exit 1; }
	@echo "$(GREEN)Prerequisites check passed$(NC)" 