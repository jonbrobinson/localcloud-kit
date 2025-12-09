#!/usr/bin/env bash

# Verification Script for LocalCloud Kit Setup
# Checks that all components are configured correctly

set -e

DOMAIN="app-local.localcloudkit.com"
CERT_DIR="./traefik/certs"

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
echo -e "${CYAN}║     LocalCloud Kit - Setup Verification                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0

# Check 1: Certificate files exist
echo -e "${BLUE}✓ Checking certificate files...${NC}"
if [ -f "$CERT_DIR/$DOMAIN.pem" ] && [ -f "$CERT_DIR/$DOMAIN-key.pem" ]; then
    echo -e "  ${GREEN}✓ Certificate files found${NC}"
    ls -lh "$CERT_DIR/$DOMAIN"*.pem | sed 's/^/    /'
else
    echo -e "  ${RED}✗ Certificate files not found${NC}"
    echo -e "    Run: ${BLUE}./scripts/setup-mkcert.sh${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Certificate subject
echo -e "${BLUE}✓ Checking certificate subject...${NC}"
if [ -f "$CERT_DIR/$DOMAIN.pem" ]; then
    SUBJECT=$(openssl x509 -in "$CERT_DIR/$DOMAIN.pem" -noout -subject 2>/dev/null | sed 's/subject=//')
    if echo "$SUBJECT" | grep -q "CN=$DOMAIN"; then
        echo -e "  ${GREEN}✓ Certificate subject: $SUBJECT${NC}"
    else
        echo -e "  ${YELLOW}⚠ Certificate subject: $SUBJECT${NC}"
        echo -e "    Expected: CN=$DOMAIN"
        echo -e "    Regenerate with: ${BLUE}rm $CERT_DIR/$DOMAIN* && ./scripts/setup-mkcert.sh${NC}"
    fi
else
    echo -e "  ${RED}✗ Cannot check certificate subject (file not found)${NC}"
fi
echo ""

# Check 3: /etc/hosts entry
echo -e "${BLUE}✓ Checking /etc/hosts entry...${NC}"
if grep -q "$DOMAIN" /etc/hosts 2>/dev/null; then
    echo -e "  ${GREEN}✓ Entry found in /etc/hosts${NC}"
    grep "$DOMAIN" /etc/hosts | sed 's/^/    /'
else
    echo -e "  ${YELLOW}⚠ Entry not found in /etc/hosts${NC}"
    echo -e "    Run: ${BLUE}sudo ./scripts/setup-hosts.sh${NC}"
    echo -e "    Or add manually: ${BLUE}127.0.0.1 $DOMAIN${NC}"
fi
echo ""

# Check 4: mkcert CA installation
echo -e "${BLUE}✓ Checking mkcert CA installation...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    if security find-certificate -c "mkcert" -a &>/dev/null || \
       security find-certificate -c "mkcert development CA" -a &>/dev/null; then
        echo -e "  ${GREEN}✓ mkcert CA is installed in Keychain${NC}"
    else
        echo -e "  ${YELLOW}⚠ mkcert CA not found in Keychain${NC}"
        echo -e "    Run: ${BLUE}sudo ./scripts/install-ca.sh${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ CA check skipped (not macOS)${NC}"
fi
echo ""

# Check 5: Docker services
echo -e "${BLUE}✓ Checking Docker services...${NC}"
if command -v docker &> /dev/null && docker compose ps traefik &>/dev/null; then
    if docker compose ps traefik | grep -q "Up"; then
        echo -e "  ${GREEN}✓ Traefik is running${NC}"
        
        # Check if certificates are accessible in Traefik container
        if docker compose exec -T traefik test -f "/certs/$DOMAIN.pem" 2>/dev/null; then
            echo -e "  ${GREEN}✓ Certificates accessible in Traefik container${NC}"
        else
            echo -e "  ${RED}✗ Certificates not accessible in Traefik container${NC}"
            echo -e "    Restart Traefik: ${BLUE}docker compose restart traefik${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "  ${RED}✗ Traefik is not running${NC}"
        echo -e "    Start services: ${BLUE}docker compose up -d${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${YELLOW}⚠ Docker not available or services not started${NC}"
fi
echo ""

# Check 6: HTTPS connectivity
echo -e "${BLUE}✓ Testing HTTPS connectivity...${NC}"
if curl -k -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" 2>/dev/null | grep -q "200"; then
    echo -e "  ${GREEN}✓ HTTPS is working${NC}"
    CERT_INFO=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null || echo "")
    if [ -n "$CERT_INFO" ]; then
        echo "$CERT_INFO" | sed 's/^/    /'
    fi
else
    echo -e "  ${YELLOW}⚠ HTTPS test failed${NC}"
    echo -e "    Check if services are running: ${BLUE}docker compose ps${NC}"
fi
echo ""

# Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Setup verification complete - All checks passed!${NC}"
    echo ""
    echo "Access your application at:"
    echo -e "  ${BLUE}https://$DOMAIN${NC}"
else
    echo -e "${YELLOW}⚠ Setup verification complete - Found $ERRORS issue(s)${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
fi
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

