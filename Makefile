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
NC := \033[0m # No Color

.PHONY: help start stop restart status logs clean
.PHONY: terraform-create terraform-destroy terraform-plan
.PHONY: python-create python-destroy python-list
.PHONY: shell-create shell-destroy shell-list
.PHONY: setup check-prerequisites

# Default target
help: ## Show this help message
	@echo "$(GREEN)LocalStack Template - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)LocalStack Management:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(start|stop|restart|status|logs|clean)"
	@echo ""
	@echo "$(YELLOW)Resource Creation (Terraform):$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "terraform"
	@echo ""
	@echo "$(YELLOW)Resource Creation (Python):$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "python"
	@echo ""
	@echo "$(YELLOW)Resource Creation (Shell):$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "shell"
	@echo ""
	@echo "$(YELLOW)Setup and Utilities:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(setup|check)"
	@echo ""
	@echo "$(YELLOW)Usage Examples:$(NC)"
	@echo "  make start                    # Start LocalStack"
	@echo "  make terraform-create ENV=dev # Create resources with Terraform"
	@echo "  make python-create ENV=dev    # Create resources with Python"
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
	@make terraform-destroy ENV=dev || true
	@make terraform-destroy ENV=uat || true
	@make terraform-destroy ENV=prod || true
	@make python-destroy ENV=dev || true
	@make python-destroy ENV=uat || true
	@make python-destroy ENV=prod || true
	@make shell-destroy ENV=dev || true
	@make shell-destroy ENV=uat || true
	@make shell-destroy ENV=prod || true
	@make stop
	@echo "$(GREEN)Cleanup complete$(NC)"

# Terraform Commands
terraform-create: check-prerequisites ## Create resources using Terraform
	@echo "$(GREEN)Creating resources with Terraform for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/terraform && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	terraform init && \
	terraform plan -var="project_name=$(PROJECT_NAME)" -var="environment=$(ENVIRONMENT)" && \
	terraform apply -auto-approve -var="project_name=$(PROJECT_NAME)" -var="environment=$(ENVIRONMENT)"

terraform-destroy: ## Destroy resources using Terraform
	@echo "$(YELLOW)Destroying resources with Terraform for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/terraform && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	terraform destroy -auto-approve -var="project_name=$(PROJECT_NAME)" -var="environment=$(ENVIRONMENT)"

terraform-plan: ## Plan Terraform changes
	@echo "$(YELLOW)Planning Terraform changes for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/terraform && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	terraform plan -var="project_name=$(PROJECT_NAME)" -var="environment=$(ENVIRONMENT)"

# Python Commands
python-create: check-prerequisites ## Create resources using Python scripts
	@echo "$(GREEN)Creating resources with Python for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/python && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	python create_resources.py

python-destroy: ## Destroy resources using Python scripts
	@echo "$(YELLOW)Destroying resources with Python for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/python && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	python destroy_resources.py

python-list: ## List resources using Python scripts
	@echo "$(YELLOW)Listing resources with Python for environment: $(ENVIRONMENT)$(NC)"
	@cd scripts/python && \
	export AWS_ENDPOINT_URL=$(AWS_ENDPOINT) && \
	export AWS_REGION=$(AWS_REGION) && \
	export PROJECT_NAME=$(PROJECT_NAME) && \
	export ENVIRONMENT=$(ENVIRONMENT) && \
	python list_resources.py

# Shell Commands
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
	@mkdir -p scripts/{python,shell,terraform}
	@mkdir -p config/{dev,uat,prod}
	@pip install -r requirements.txt 2>/dev/null || echo "$(YELLOW)Please install Python dependencies manually$(NC)"
	@echo "$(GREEN)Setup complete$(NC)"

check-prerequisites: ## Check if prerequisites are installed
	@echo "$(YELLOW)Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Docker is required but not installed$(NC)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)Docker Compose is required but not installed$(NC)"; exit 1; }
	@echo "$(GREEN)Prerequisites check passed$(NC)" 