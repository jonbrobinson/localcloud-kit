#!/usr/bin/env bash

# Master Setup Script for LocalCloud Kit
# Runs all setup steps in the correct order for a complete setup
# Individual scripts are still available for one-off operations

set -e

DOMAIN="app-local.localcloudkit.com"
MAILPIT_DOMAIN="mailpit.localcloudkit.com"
PGADMIN_DOMAIN="pgadmin.localcloudkit.com"
KEYCLOAK_DOMAIN="keycloak.localcloudkit.com"
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
echo "  3. Generate SSL certificates for all LocalCloud Kit subdomains"
echo "  4. Add all subdomains to /etc/hosts (if needed)"
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

    # Verify all subdomains are covered by the certificate SAN
    echo -e "${BLUE}Checking certificate covers all subdomains...${NC}"
    if command -v openssl &>/dev/null; then
        CERT_SANS=$(openssl x509 -in "$CERT_DIR/$DOMAIN.pem" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 || true)
        MISSING_SANS=()
        for SUBDOMAIN in "$MAILPIT_DOMAIN" "$PGADMIN_DOMAIN" "$KEYCLOAK_DOMAIN"; do
            if echo "$CERT_SANS" | grep -q "$SUBDOMAIN"; then
                echo -e "${GREEN}✓ Certificate includes $SUBDOMAIN${NC}"
            else
                echo -e "${YELLOW}⚠ Certificate missing: $SUBDOMAIN${NC}"
                MISSING_SANS+=("$SUBDOMAIN")
            fi
        done
        if [ ${#MISSING_SANS[@]} -gt 0 ]; then
            echo -e "${YELLOW}  Current SANs: $CERT_SANS${NC}"
            echo -e "${YELLOW}  Regenerating certificate to include all subdomains...${NC}"
            rm -f "$CERT_DIR/$DOMAIN.pem" "$CERT_DIR/$DOMAIN-key.pem"
            "$SCRIPT_DIR/setup-mkcert.sh" || {
                echo -e "${RED}✗ Failed to regenerate certificate${NC}"
                exit 1
            }
            # Re-verify after regeneration
            CERT_SANS=$(openssl x509 -in "$CERT_DIR/$DOMAIN.pem" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 || true)
            ALL_OK=true
            for SUBDOMAIN in "$MAILPIT_DOMAIN" "$PGADMIN_DOMAIN" "$KEYCLOAK_DOMAIN"; do
                if echo "$CERT_SANS" | grep -q "$SUBDOMAIN"; then
                    echo -e "${GREEN}✓ Certificate now includes $SUBDOMAIN${NC}"
                else
                    echo -e "${RED}✗ Certificate still missing $SUBDOMAIN SAN${NC}"
                    ALL_OK=false
                fi
            done
            [ "$ALL_OK" = false ] && exit 1
        fi
    else
        echo -e "${YELLOW}⚠ openssl not available — cannot verify subdomain SANs${NC}"
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
    # Check if all entries already exist (read-only check)
    MISSING_HOSTS=()
    for HOST in "$DOMAIN" "$MAILPIT_DOMAIN" "$PGADMIN_DOMAIN" "$KEYCLOAK_DOMAIN"; do
        grep -q "$HOST" /etc/hosts 2>/dev/null || MISSING_HOSTS+=("$HOST")
    done

    if [ ${#MISSING_HOSTS[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ All subdomains already exist in /etc/hosts${NC}"
    else
        for HOST in "${MISSING_HOSTS[@]}"; do
            echo -e "${YELLOW}Missing /etc/hosts entry: $HOST${NC}"
        done
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
    echo -e "${YELLOW}  127.0.0.1 $PGADMIN_DOMAIN${NC}"
    echo -e "${YELLOW}  127.0.0.1 $KEYCLOAK_DOMAIN${NC}"
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
echo -e "   ${CYAN}https://$PGADMIN_DOMAIN:3030${NC}  (pgAdmin database UI)"
echo -e "   ${CYAN}https://$KEYCLOAK_DOMAIN:3030${NC}  (Keycloak identity & access)"
echo ""
echo -e "${YELLOW}Note:${NC} If you see certificate warnings:"
echo "  - Make sure the CA is installed: ${BLUE}sudo ./scripts/install-ca.sh${NC}"
echo "  - Completely quit and restart your browser"
echo "  - Run ${BLUE}./scripts/verify-setup.sh${NC} to diagnose any issues"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""

