#!/usr/bin/env bash

# Verification Script for LocalCloud Kit Setup
# Checks that all components are configured correctly

set -e

DOMAIN="app-local.localcloudkit.com"
MAILPIT_DOMAIN="mailpit.localcloudkit.com"
PGADMIN_DOMAIN="pgadmin.localcloudkit.com"
KEYCLOAK_DOMAIN="keycloak.localcloudkit.com"
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

# Check 2: Certificate subject and SANs
echo -e "${BLUE}✓ Checking certificate subject and SANs...${NC}"
if [ -f "$CERT_DIR/$DOMAIN.pem" ]; then
    SUBJECT=$(openssl x509 -in "$CERT_DIR/$DOMAIN.pem" -noout -subject 2>/dev/null | sed 's/subject=//')
    if echo "$SUBJECT" | grep -q "CN=$DOMAIN"; then
        echo -e "  ${GREEN}✓ Certificate subject: $SUBJECT${NC}"
    else
        echo -e "  ${YELLOW}⚠ Certificate subject: $SUBJECT${NC}"
        echo -e "    Expected: CN=$DOMAIN"
        echo -e "    Regenerate with: ${BLUE}rm $CERT_DIR/$DOMAIN* && ./scripts/setup-mkcert.sh${NC}"
    fi

    # Check that all subdomains are SANs in the certificate
    CERT_SANS=$(openssl x509 -in "$CERT_DIR/$DOMAIN.pem" -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 || true)
    SAN_ERRORS=0
    for SUBDOMAIN in "$MAILPIT_DOMAIN" "$PGADMIN_DOMAIN" "$KEYCLOAK_DOMAIN"; do
        if echo "$CERT_SANS" | grep -q "$SUBDOMAIN"; then
            echo -e "  ${GREEN}✓ Certificate covers $SUBDOMAIN${NC}"
        else
            echo -e "  ${RED}✗ Certificate does NOT cover $SUBDOMAIN${NC}"
            SAN_ERRORS=$((SAN_ERRORS + 1))
        fi
    done
    if [ $SAN_ERRORS -gt 0 ]; then
        echo -e "    SANs found: $CERT_SANS"
        echo -e "    Fix: ${BLUE}rm $CERT_DIR/$DOMAIN* && ./scripts/setup-mkcert.sh${NC}"
        ERRORS=$((ERRORS + SAN_ERRORS))
    fi
else
    echo -e "  ${RED}✗ Cannot check certificate (file not found)${NC}"
fi
echo ""

# Check 3: /etc/hosts entries (all subdomains)
echo -e "${BLUE}✓ Checking /etc/hosts entries...${NC}"
HOSTS_ERRORS=0
for HOST in "$DOMAIN" "$MAILPIT_DOMAIN" "$PGADMIN_DOMAIN" "$KEYCLOAK_DOMAIN"; do
    if grep -q "$HOST" /etc/hosts 2>/dev/null; then
        echo -e "  ${GREEN}✓ Entry found: $(grep "$HOST" /etc/hosts | head -1)${NC}"
    else
        echo -e "  ${RED}✗ Entry not found for $HOST${NC}"
        HOSTS_ERRORS=$((HOSTS_ERRORS + 1))
    fi
done
if [ $HOSTS_ERRORS -gt 0 ]; then
    echo -e "    Run: ${BLUE}sudo ./scripts/setup-hosts.sh${NC}"
    ERRORS=$((ERRORS + HOSTS_ERRORS))
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

# Check 6: HTTPS connectivity (main app)
echo -e "${BLUE}✓ Testing HTTPS connectivity (main app)...${NC}"
if curl -k -s -o /dev/null -w "%{http_code}" "https://$DOMAIN:3030/health" 2>/dev/null | grep -q "200"; then
    echo -e "  ${GREEN}✓ HTTPS is working for $DOMAIN${NC}"
else
    echo -e "  ${YELLOW}⚠ HTTPS test failed for $DOMAIN${NC}"
    echo -e "    Check if services are running: ${BLUE}docker compose ps${NC}"
fi
echo ""

# Check 7: Subdomain HTTPS connectivity (Mailpit, pgAdmin, Keycloak)
echo -e "${BLUE}✓ Testing HTTPS connectivity (subdomains)...${NC}"
for SERVICE_INFO in "Mailpit:$MAILPIT_DOMAIN:mailpit" "pgAdmin:$PGADMIN_DOMAIN:pgadmin" "Keycloak:$KEYCLOAK_DOMAIN:keycloak"; do
    SERVICE_NAME="${SERVICE_INFO%%:*}"
    REST="${SERVICE_INFO#*:}"
    SERVICE_HOST="${REST%%:*}"
    SERVICE_CONTAINER="${REST##*:}"
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "https://$SERVICE_HOST:3030" 2>/dev/null || true)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "  ${GREEN}✓ $SERVICE_NAME is reachable at https://$SERVICE_HOST:3030${NC}"
    elif [ -z "$HTTP_CODE" ] || [ "$HTTP_CODE" = "000" ]; then
        echo -e "  ${YELLOW}⚠ Cannot reach $SERVICE_HOST — services may not be running${NC}"
        echo -e "    Start services: ${BLUE}docker compose up -d${NC}"
    else
        echo -e "  ${YELLOW}⚠ $SERVICE_NAME returned HTTP $HTTP_CODE${NC}"
        echo -e "    Check service: ${BLUE}docker compose ps $SERVICE_CONTAINER${NC}"
    fi
done
echo ""

# Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Setup verification complete - All checks passed!${NC}"
    echo ""
    echo "Access your services at:"
    echo -e "  ${BLUE}https://$DOMAIN:3030${NC}       (main app)"
    echo -e "  ${BLUE}https://$MAILPIT_DOMAIN:3030${NC}  (Mailpit email testing)"
    echo -e "  ${BLUE}https://$PGADMIN_DOMAIN:3030${NC}  (pgAdmin database UI)"
    echo -e "  ${BLUE}https://$KEYCLOAK_DOMAIN:3030${NC}  (Keycloak identity & access)"
else
    echo -e "${YELLOW}⚠ Setup verification complete - Found $ERRORS issue(s)${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
    echo -e "  Re-run setup:      ${BLUE}./scripts/setup.sh${NC}"
    echo -e "  Regenerate certs:  ${BLUE}./scripts/setup-mkcert.sh${NC}"
    echo -e "  Fix hosts:         ${BLUE}sudo ./scripts/setup-hosts.sh${NC}"
fi
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

