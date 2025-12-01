#!/usr/bin/env bash

# Install mkcert CA Certificate
# This script installs the mkcert CA to your system trust store

# Don't use set -e here - we want to handle errors gracefully

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

echo -e "${BLUE}=== Installing mkcert CA Certificate ===${NC}"
echo ""

# Find mkcert
MKCERT_CMD=""
if command -v mkcert &> /dev/null; then
    MKCERT_CMD=$(command -v mkcert)
elif [ -f "./scripts/bin/mkcert" ] && [ -x "./scripts/bin/mkcert" ]; then
    MKCERT_CMD="./scripts/bin/mkcert"
else
    echo -e "${RED}mkcert not found. Please run ./scripts/setup-mkcert.sh first${NC}"
    exit 1
fi

echo -e "${BLUE}Using: $MKCERT_CMD${NC}"
echo ""

# Check if CA is already installed
if [[ "$OSTYPE" == "darwin"* ]]; then
    if security find-certificate -c "mkcert" -a &>/dev/null || \
       security find-certificate -c "mkcert development CA" -a &>/dev/null; then
        echo -e "${GREEN}✓ mkcert CA is already installed in Keychain${NC}"
        echo ""
        echo "If you're still seeing certificate errors:"
        echo "  1. Completely quit Chrome (Cmd+Q)"
        echo "  2. Reopen Chrome"
        echo "  3. Navigate to https://localcloudkit.local"
        exit 0
    fi
fi

echo -e "${YELLOW}Installing mkcert CA to system trust store...${NC}"
echo ""
echo -e "${BLUE}This requires your administrator password${NC}"
echo ""

# Install CA
# Note: This script is typically called with sudo from setup.sh
# If already running as root, don't add another sudo
if [ "$EUID" -eq 0 ]; then
    # Already running as root (via sudo)
    if $MKCERT_CMD -install; then
    echo ""
    echo -e "${GREEN}✓ mkcert CA installed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. ${BLUE}Completely quit Chrome${NC} (Cmd+Q, don't just close tabs)"
    echo "  2. ${BLUE}Reopen Chrome${NC}"
    echo "  3. ${BLUE}Navigate to https://localcloudkit.local${NC}"
        echo ""
        echo -e "${GREEN}The certificate should now be trusted!${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}✗ Failed to install CA certificate${NC}"
        echo ""
        echo -e "${YELLOW}Manual installation (macOS):${NC}"
        echo "  1. Open Keychain Access (Applications → Utilities)"
        CA_ROOT=$($MKCERT_CMD -CAROOT 2>/dev/null || echo "~/.local/share/mkcert")
        echo "  2. Drag ${CA_ROOT}/rootCA.pem into the System keychain"
        echo "  3. Double-click the certificate"
        echo "  4. Expand 'Trust' section"
        echo "  5. Set 'When using this certificate' to 'Always Trust'"
        echo "  6. Close and enter your password"
        exit 1
    fi
else
    # Not running as root - need sudo
    echo -e "${YELLOW}This script requires sudo privileges${NC}"
    echo "Please run with: sudo ./scripts/install-ca.sh"
    exit 1
fi


