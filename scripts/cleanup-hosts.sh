#!/usr/bin/env bash

# Cleanup Script for LocalCloud Kit
# Removes /etc/hosts entries for app-local.localcloudkit.com (if they exist)

set -e

HOSTNAME="app-local.localcloudkit.com"
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

# Check if hostname entry exists (read-only, no sudo needed)
if ! grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ No entries found for $HOSTNAME in $HOSTS_FILE${NC}"
    echo ""
    echo "Note: The .local domain uses mDNS/Bonjour. If it doesn't resolve,"
    echo "you may need to add to /etc/hosts: 127.0.0.1 app-local.localcloudkit.com"
    echo ""
    exit 0
fi

# If we get here, entries exist - need sudo to remove them
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Found entries for $HOSTNAME in $HOSTS_FILE${NC}"
    echo ""
    echo "Current entries:"
    grep "$HOSTNAME" "$HOSTS_FILE" | sed 's/^/  /'
    echo ""
    echo -e "${YELLOW}This script requires sudo privileges to modify /etc/hosts${NC}"
    echo ""
    echo "Please run with:"
    echo -e "  ${BLUE}sudo ./scripts/cleanup-hosts.sh${NC}"
    echo ""
    exit 1
fi

# Check if hostname entry exists (double-check after sudo)
if grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
    echo -e "${YELLOW}Found entries for $HOSTNAME in $HOSTS_FILE${NC}"
    echo ""
    echo "Current entries:"
    grep "$HOSTNAME" "$HOSTS_FILE" | sed 's/^/  /'
    echo ""
    
    # Create backup
    echo -e "${BLUE}Creating backup: $BACKUP_FILE${NC}"
    cp "$HOSTS_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup created${NC}"
    echo ""
    
    # Remove entries (handles multiple entries)
    echo -e "${YELLOW}Removing entries for $HOSTNAME...${NC}"
    
    # Use sed to remove lines containing the hostname
    # -i '' for macOS, -i for Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "/$HOSTNAME/d" "$HOSTS_FILE"
    else
        sed -i "/$HOSTNAME/d" "$HOSTS_FILE"
    fi
    
    # Verify removal
    if grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
        echo -e "${RED}✗ Failed to remove all entries${NC}"
        echo ""
        echo "Restoring from backup..."
        cp "$BACKUP_FILE" "$HOSTS_FILE"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Entries removed successfully${NC}"
    echo ""
    echo -e "${GREEN}=== Cleanup Complete ===${NC}"
    echo ""
    echo "Backup saved at: $BACKUP_FILE"
    echo ""
    echo "Note: The .local domain uses mDNS/Bonjour. If it doesn't resolve,"
    echo "you may need to add to /etc/hosts: 127.0.0.1 app-local.localcloudkit.com"
    echo ""
fi

