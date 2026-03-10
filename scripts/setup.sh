#!/usr/bin/env bash

# Master Setup Script for LocalCloud Kit
# Runs all setup steps in the correct order for a complete setup
# Individual scripts are still available for one-off operations

set -e

DOMAIN="app-local.localcloudkit.com"
MAILPIT_DOMAIN="mailpit.localcloudkit.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output (only if terminal supports it)
if [ -t 1 ] && [ "$TERM" != "dumb" ]; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m' # No Color
else
    GREEN=''
    YELLOW=''
    RED=''
    BLUE=''
    CYAN=''
    NC=''
fi

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     LocalCloud Kit - Complete Setup Script             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}This script will:${NC}"
echo "  1. Install mkcert (if needed)"
echo "  2. Install mkcert CA certificate"
echo "  3. Generate SSL certificates for $DOMAIN and $MAILPIT_DOMAIN"
echo "  4. Add $DOMAIN and $MAILPIT_DOMAIN to /etc/hosts (if needed)"
echo ""
echo -e "${YELLOW}Individual scripts are available for one-off operations:${NC}"
echo "  - ${BLUE}./scripts/setup-mkcert.sh${NC} - Generate certificates only"
echo "  - ${BLUE}./scripts/install-ca.sh${NC} - Install CA only"
echo "  - ${BLUE}./scripts/setup-hosts.sh${NC} - Setup /etc/hosts only"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1/4: Setting up mkcert${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT_ROOT"
if [ -f "$SCRIPT_DIR/setup-mkcert.sh" ]; then
    # Run setup-mkcert.sh but skip CA installation (we'll do that in step 2)
    # We'll extract just the mkcert installation and certificate generation parts
    "$SCRIPT_DIR/setup-mkcert.sh" || {
        echo -e "${RED}✗ Failed to setup mkcert${NC}"
        exit 1
    }
else
    echo -e "${RED}Error: setup-mkcert.sh not found${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2/4: Installing mkcert CA certificate${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 2: Install CA certificate (REQUIRED for browser trust)
if [ -f "$SCRIPT_DIR/install-ca.sh" ]; then
    # Check if CA is already installed
    MKCERT_CMD=""
    if command -v mkcert &> /dev/null; then
        MKCERT_CMD=$(command -v mkcert)
    elif [ -f "$SCRIPT_DIR/bin/mkcert" ] && [ -x "$SCRIPT_DIR/bin/mkcert" ]; then
        MKCERT_CMD="$SCRIPT_DIR/bin/mkcert"
    fi
    
    CA_ALREADY_INSTALLED=false
    if [ -n "$MKCERT_CMD" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if security find-certificate -c "mkcert" -a &>/dev/null || \
               security find-certificate -c "mkcert development CA" -a &>/dev/null; then
                CA_ALREADY_INSTALLED=true
                echo -e "${GREEN}✓ mkcert CA is already installed${NC}"
            fi
        fi
    fi
    
    if [ "$CA_ALREADY_INSTALLED" = false ]; then
        # Check if we need sudo for CA installation
        # install-ca.sh handles sudo internally, so just call it directly
        if "$SCRIPT_DIR/install-ca.sh"; then
            echo -e "${GREEN}✓ CA installation completed${NC}"
        else
            echo -e "${RED}✗ CA installation failed${NC}"
            echo -e "${YELLOW}This is required for browser trust. Please run manually:${NC}"
            echo -e "  ${BLUE}sudo ./scripts/install-ca.sh${NC}"
            echo ""
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}Setup cancelled. Please install CA and run setup again.${NC}"
                exit 1
            fi
        fi
    fi
else
    echo -e "${RED}✗ install-ca.sh not found${NC}"
    echo -e "${YELLOW}This is required for browser trust.${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3/4: Verifying certificates${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CERT_DIR="$PROJECT_ROOT/traefik/certs"
if [ -f "$CERT_DIR/$DOMAIN.pem" ] && [ -f "$CERT_DIR/$DOMAIN-key.pem" ]; then
    echo -e "${GREEN}✓ Certificate files found${NC}"
    ls -lh "$CERT_DIR/$DOMAIN"* | sed 's/^/  /'
    echo ""

    # Verify the Mailpit subdomain is covered by the certificate SAN
    echo -e "${BLUE}Checking certificate covers Mailpit subdomain ($MAILPIT_DOMAIN)...${NC}"
    if command -v openssl &>/dev/null; then
        CERT_SANS=$(openssl x509 -in "$CERT_DIR/$DOMAIN.pem" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 || true)
        if echo "$CERT_SANS" | grep -q "$MAILPIT_DOMAIN"; then
            echo -e "${GREEN}✓ Certificate includes $MAILPIT_DOMAIN as a SAN${NC}"
        else
            echo -e "${YELLOW}⚠ Certificate does not include $MAILPIT_DOMAIN as a SAN${NC}"
            echo -e "${YELLOW}  Current SANs: $CERT_SANS${NC}"
            echo -e "${YELLOW}  Regenerating certificate to include Mailpit subdomain...${NC}"
            rm -f "$CERT_DIR/$DOMAIN.pem" "$CERT_DIR/$DOMAIN-key.pem"
            "$SCRIPT_DIR/setup-mkcert.sh" || {
                echo -e "${RED}✗ Failed to regenerate certificate${NC}"
                exit 1
            }
            # Re-verify after regeneration
            CERT_SANS=$(openssl x509 -in "$CERT_DIR/$DOMAIN.pem" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 || true)
            if echo "$CERT_SANS" | grep -q "$MAILPIT_DOMAIN"; then
                echo -e "${GREEN}✓ Certificate now includes $MAILPIT_DOMAIN as a SAN${NC}"
            else
                echo -e "${RED}✗ Certificate still missing $MAILPIT_DOMAIN SAN${NC}"
                exit 1
            fi
        fi
    else
        echo -e "${YELLOW}⚠ openssl not available — cannot verify Mailpit SAN${NC}"
    fi
else
    echo -e "${RED}✗ Certificates not found${NC}"
    echo "Expected:"
    echo "  $CERT_DIR/$DOMAIN.pem"
    echo "  $CERT_DIR/$DOMAIN-key.pem"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4/4: Setting up /etc/hosts entry${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "$SCRIPT_DIR/setup-hosts.sh" ]; then
    # Check if both entries already exist (read-only check)
    MAIN_EXISTS=false
    MAILPIT_EXISTS=false
    grep -q "$DOMAIN" /etc/hosts 2>/dev/null && MAIN_EXISTS=true
    grep -q "$MAILPIT_DOMAIN" /etc/hosts 2>/dev/null && MAILPIT_EXISTS=true

    if [ "$MAIN_EXISTS" = true ] && [ "$MAILPIT_EXISTS" = true ]; then
        echo -e "${GREEN}✓ Entries for $DOMAIN and $MAILPIT_DOMAIN already exist in /etc/hosts${NC}"
    else
        [ "$MAIN_EXISTS" = false ] && echo -e "${YELLOW}Missing /etc/hosts entry: $DOMAIN${NC}"
        [ "$MAILPIT_EXISTS" = false ] && echo -e "${YELLOW}Missing /etc/hosts entry: $MAILPIT_DOMAIN${NC}"
        echo ""
        if [ "$EUID" -ne 0 ]; then
            echo -e "${YELLOW}Adding /etc/hosts entries requires sudo privileges${NC}"
            echo "Please enter your password when prompted:"
            echo ""
            sudo "$SCRIPT_DIR/setup-hosts.sh" || {
                echo -e "${YELLOW}⚠ Failed to add /etc/hosts entries${NC}"
                echo -e "${YELLOW}You can add them manually or run: sudo ./scripts/setup-hosts.sh${NC}"
            }
        else
            "$SCRIPT_DIR/setup-hosts.sh" || {
                echo -e "${YELLOW}⚠ Failed to add /etc/hosts entries${NC}"
            }
        fi
    fi
else
    echo -e "${YELLOW}⚠ setup-hosts.sh not found, skipping /etc/hosts setup${NC}"
    echo -e "${YELLOW}Add manually:${NC}"
    echo -e "${YELLOW}  127.0.0.1 $DOMAIN${NC}"
    echo -e "${YELLOW}  127.0.0.1 $MAILPIT_DOMAIN${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Start Docker services:"
echo -e "   ${CYAN}docker compose down && docker compose up -d${NC}"
echo "   or"
echo -e "   ${CYAN}make start${NC}"
echo ""
echo "2. Open in your browser:"
echo -e "   ${CYAN}https://$DOMAIN:3030${NC}       (main app)"
echo -e "   ${CYAN}https://$MAILPIT_DOMAIN:3030${NC}  (Mailpit email testing)"
echo ""
echo -e "${YELLOW}Note:${NC} If you see certificate warnings:"
echo "  - Make sure the CA is installed: ${BLUE}sudo ./scripts/install-ca.sh${NC}"
echo "  - Completely quit and restart your browser"
echo "  - Run ${BLUE}./scripts/verify-setup.sh${NC} to diagnose any issues"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""

