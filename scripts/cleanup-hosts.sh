#!/usr/bin/env bash

# Cleanup Script for LocalCloud Kit
# Removes /etc/hosts entries for LocalCloud Kit domains (with confirmation)

set -e

# Array of previous domain names to clean up
PREVIOUS_DOMAINS=(
    "localcloudkit.local"
    "app-local.localcloudkit.com"
)

CURRENT_DOMAIN="app-local.localcloudkit.com"
HOSTS_FILE="/etc/hosts"
BACKUP_FILE="/etc/hosts.localcloudkit.backup"

# Colors for output (only if terminal supports it)
if [ -t 1 ] && [ "$TERM" != "dumb" ]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    GREEN=''
    YELLOW=''
    RED=''
    BLUE=''
    NC=''
fi

echo -e "${BLUE}=== LocalCloud Kit /etc/hosts Cleanup ===${NC}"
echo ""

# Check if /etc/hosts exists
if [ ! -f "$HOSTS_FILE" ]; then
    echo -e "${RED}Error: $HOSTS_FILE not found${NC}"
    exit 1
fi

# Find all LocalCloud Kit domain entries
FOUND_DOMAINS=()
FOUND_ENTRIES=()

for domain in "${PREVIOUS_DOMAINS[@]}"; do
    if grep -q "$domain" "$HOSTS_FILE" 2>/dev/null; then
        FOUND_DOMAINS+=("$domain")
        while IFS= read -r line; do
            if [[ "$line" == *"$domain"* ]]; then
                FOUND_ENTRIES+=("$line")
            fi
        done < <(grep "$domain" "$HOSTS_FILE" 2>/dev/null || true)
    fi
done

# If no entries found, exit
if [ ${#FOUND_DOMAINS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ No LocalCloud Kit entries found in $HOSTS_FILE${NC}"
    echo ""
    echo "No cleanup needed. Current domain: $CURRENT_DOMAIN"
    echo ""
    exit 0
fi

# Show found entries
echo -e "${YELLOW}Found LocalCloud Kit domain entries in $HOSTS_FILE:${NC}"
echo ""
for domain in "${FOUND_DOMAINS[@]}"; do
    echo -e "${BLUE}Domain: $domain${NC}"
    grep "$domain" "$HOSTS_FILE" 2>/dev/null | sed 's/^/  /'
    echo ""
done

# Check if we need sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}This script requires sudo privileges to modify /etc/hosts${NC}"
    echo ""
    echo "Please run with:"
    echo -e "  ${BLUE}sudo ./scripts/cleanup-hosts.sh${NC}"
    echo ""
    exit 1
fi

# Create backup
echo -e "${BLUE}Creating backup: $BACKUP_FILE${NC}"
cp "$HOSTS_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# Ask for confirmation for each domain
DOMAINS_TO_REMOVE=()
DOMAINS_TO_KEEP=()

for domain in "${FOUND_DOMAINS[@]}"; do
    echo -e "${YELLOW}Found entries for: ${BLUE}$domain${NC}"
    grep "$domain" "$HOSTS_FILE" 2>/dev/null | sed 's/^/  /'
    echo ""
    
    # Ask user if they want to remove this domain
    read -p "Remove entries for $domain? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        DOMAINS_TO_REMOVE+=("$domain")
        echo -e "${GREEN}✓ Will remove $domain${NC}"
    else
        DOMAINS_TO_KEEP+=("$domain")
        echo -e "${YELLOW}⚠ Keeping $domain${NC}"
    fi
    echo ""
done

# If nothing to remove, exit
if [ ${#DOMAINS_TO_REMOVE[@]} -eq 0 ]; then
    echo -e "${YELLOW}No domains selected for removal. Exiting.${NC}"
    echo ""
    exit 0
fi

# Confirm before proceeding
echo -e "${YELLOW}The following domains will be removed:${NC}"
for domain in "${DOMAINS_TO_REMOVE[@]}"; do
    echo -e "  ${RED}- $domain${NC}"
done
echo ""

if [ ${#DOMAINS_TO_KEEP[@]} -gt 0 ]; then
    echo -e "${GREEN}The following domains will be kept:${NC}"
    for domain in "${DOMAINS_TO_KEEP[@]}"; do
        echo -e "  ${GREEN}- $domain${NC}"
    done
    echo ""
fi

read -p "Proceed with removal? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled. No changes made.${NC}"
    echo ""
    exit 0
fi

# Remove entries for selected domains
echo -e "${YELLOW}Removing entries...${NC}"

for domain in "${DOMAINS_TO_REMOVE[@]}"; do
    echo -e "${BLUE}Removing: $domain${NC}"
    
    # Use sed to remove lines containing the domain
    # -i '' for macOS, -i for Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "/$domain/d" "$HOSTS_FILE"
    else
        sed -i "/$domain/d" "$HOSTS_FILE"
    fi
    
    # Verify removal
    if grep -q "$domain" "$HOSTS_FILE" 2>/dev/null; then
        echo -e "${RED}✗ Failed to remove all entries for $domain${NC}"
    else
        echo -e "${GREEN}✓ Removed $domain${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== Cleanup Complete ===${NC}"
echo ""
echo "Backup saved at: $BACKUP_FILE"
echo ""

if [ ${#DOMAINS_TO_KEEP[@]} -gt 0 ]; then
    echo -e "${YELLOW}Note: The following domains were kept:${NC}"
    for domain in "${DOMAINS_TO_KEEP[@]}"; do
        echo -e "  - $domain"
    done
    echo ""
fi

echo "To add the current domain, run:"
echo -e "  ${BLUE}sudo ./scripts/setup-hosts.sh${NC}"
echo ""

