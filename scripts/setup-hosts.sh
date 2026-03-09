#!/usr/bin/env bash

# Setup Script for LocalCloud Kit
# Adds app-local.localcloudkit.com to /etc/hosts if not present

set -e

HOSTNAME="app-local.localcloudkit.com"
MAILPIT_HOSTNAME="mailpit.localcloudkit.com"
IP="127.0.0.1"
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

echo -e "${BLUE}=== LocalCloud Kit /etc/hosts Setup ===${NC}"
echo ""

# Check if /etc/hosts exists
if [ ! -f "$HOSTS_FILE" ]; then
    echo -e "${RED}Error: $HOSTS_FILE not found${NC}"
    exit 1
fi

# Check which entries are missing
MAIN_EXISTS=false
MAILPIT_EXISTS=false

if grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
    MAIN_EXISTS=true
fi
if grep -q "$MAILPIT_HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
    MAILPIT_EXISTS=true
fi

if [ "$MAIN_EXISTS" = true ] && [ "$MAILPIT_EXISTS" = true ]; then
    echo -e "${GREEN}✓ All entries already exist in $HOSTS_FILE${NC}"
    echo ""
    echo "Current entries:"
    grep -E "$HOSTNAME|$MAILPIT_HOSTNAME" "$HOSTS_FILE" | sed 's/^/  /'
    echo ""
    echo -e "${GREEN}No changes needed!${NC}"
    exit 0
fi

# Need sudo to modify /etc/hosts
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Missing entries in $HOSTS_FILE${NC}"
    echo ""
    echo "This script needs to add the following entries:"
    [ "$MAIN_EXISTS" = false ] && echo "  ${BLUE}$IP $HOSTNAME${NC}"
    [ "$MAILPIT_EXISTS" = false ] && echo "  ${BLUE}$IP $MAILPIT_HOSTNAME${NC}"
    echo ""
    echo -e "${YELLOW}This requires sudo privileges to modify /etc/hosts${NC}"
    echo ""
    echo "Please run with:"
    echo -e "  ${BLUE}sudo ./scripts/setup-hosts.sh${NC}"
    echo ""
    exit 1
fi

# Create backup
echo -e "${BLUE}Creating backup: $BACKUP_FILE${NC}"
cp "$HOSTS_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# Add missing entries
if [ "$MAIN_EXISTS" = false ]; then
    echo -e "${YELLOW}Adding entry: $IP $HOSTNAME${NC}"
    echo "$IP $HOSTNAME" >> "$HOSTS_FILE"
fi
if [ "$MAILPIT_EXISTS" = false ]; then
    echo -e "${YELLOW}Adding entry: $IP $MAILPIT_HOSTNAME${NC}"
    echo "$IP $MAILPIT_HOSTNAME" >> "$HOSTS_FILE"
fi

# Verify additions
if grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null && grep -q "$MAILPIT_HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Entries added successfully${NC}"
    echo ""
    echo "Current entries:"
    grep -E "$HOSTNAME|$MAILPIT_HOSTNAME" "$HOSTS_FILE" | sed 's/^/  /'
    echo ""
    echo -e "${GREEN}=== Setup Complete ===${NC}"
    echo ""
    echo "Backup saved at: $BACKUP_FILE"
    echo ""
    echo "You can now access:"
    echo "  ${BLUE}https://$HOSTNAME:3030${NC}"
    echo "  ${BLUE}https://$MAILPIT_HOSTNAME:3030${NC}"
    echo ""
else
    echo -e "${RED}✗ Failed to add entries${NC}"
    echo ""
    echo "Restoring from backup..."
    cp "$BACKUP_FILE" "$HOSTS_FILE"
    exit 1
fi

