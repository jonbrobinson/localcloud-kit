#!/usr/bin/env bash

# mkcert Setup Script for LocalCloud Kit
# Generates trusted local certificates for localcloudkit.local
# Automatically installs mkcert if not found

set -e

DOMAIN="localcloudkit.local"
CERT_DIR="./traefik/certs"
MKCERT_BIN_DIR="./scripts/bin"
MKCERT_BIN="$MKCERT_BIN_DIR/mkcert"

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

echo -e "${BLUE}=== LocalCloud Kit mkcert Certificate Setup ===${NC}"
echo ""

# Function to find mkcert binary (system or local)
find_mkcert() {
    if command -v mkcert &> /dev/null; then
        command -v mkcert
    elif [ -f "$MKCERT_BIN" ] && [ -x "$MKCERT_BIN" ]; then
        echo "$MKCERT_BIN"
    else
        return 1
    fi
}

# Function to download and install mkcert
install_mkcert() {
    local OS="$(uname -s)"
    local ARCH="$(uname -m)"
    local DOWNLOAD_URL=""
    local BINARY_NAME=""
    local INSTALL_DIR="$MKCERT_BIN_DIR"
    
    echo -e "${YELLOW}mkcert not found. Installing automatically...${NC}"
    echo ""
    
    # Create bin directory
    mkdir -p "$INSTALL_DIR"
    
    # Detect OS and architecture
    case "${OS}" in
        Linux*)
            echo -e "${BLUE}Detected: Linux${NC}"
            if [ "$ARCH" = "x86_64" ]; then
                DOWNLOAD_URL="https://dl.filippo.io/mkcert/latest?for=linux/amd64"
                BINARY_NAME="mkcert-v*-linux-amd64"
            elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
                DOWNLOAD_URL="https://dl.filippo.io/mkcert/latest?for=linux/arm64"
                BINARY_NAME="mkcert-v*-linux-arm64"
            else
                echo -e "${RED}Unsupported architecture: $ARCH${NC}"
                exit 1
            fi
            
            # Check for certutil (required for Linux)
            if ! command -v certutil &> /dev/null; then
                echo -e "${YELLOW}certutil not found. Installing dependencies...${NC}"
                if command -v apt-get &> /dev/null; then
                    echo "Please run: ${BLUE}sudo apt-get install -y libnss3-tools${NC}"
                    echo "Or the script will attempt to continue (may fail during CA installation)"
                elif command -v yum &> /dev/null; then
                    echo "Please run: ${BLUE}sudo yum install -y nss-tools${NC}"
                    echo "Or the script will attempt to continue (may fail during CA installation)"
                fi
            fi
            ;;
        Darwin*)
            echo -e "${BLUE}Detected: macOS${NC}"
            if [ "$ARCH" = "x86_64" ]; then
                DOWNLOAD_URL="https://dl.filippo.io/mkcert/latest?for=darwin/amd64"
                BINARY_NAME="mkcert-v*-darwin-amd64"
            elif [ "$ARCH" = "arm64" ]; then
                DOWNLOAD_URL="https://dl.filippo.io/mkcert/latest?for=darwin/arm64"
                BINARY_NAME="mkcert-v*-darwin-arm64"
            else
                echo -e "${RED}Unsupported architecture: $ARCH${NC}"
                exit 1
            fi
            
            # Try Homebrew first (faster, but optional)
            if command -v brew &> /dev/null; then
                echo -e "${BLUE}Homebrew detected. Installing via Homebrew...${NC}"
                if brew install mkcert 2>/dev/null; then
                    echo -e "${GREEN}✓ mkcert installed via Homebrew${NC}"
                    return 0
                fi
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo -e "${BLUE}Detected: Windows${NC}"
            DOWNLOAD_URL="https://dl.filippo.io/mkcert/latest?for=windows/amd64"
            BINARY_NAME="mkcert-v*-windows-amd64.exe"
            ;;
        *)
            echo -e "${RED}Unsupported operating system: $OS${NC}"
            echo "Please install mkcert manually: https://github.com/FiloSottile/mkcert#installation"
            exit 1
            ;;
    esac
    
    # Download mkcert
    echo -e "${BLUE}Downloading mkcert...${NC}"
    cd "$INSTALL_DIR"
    
    if command -v curl &> /dev/null; then
        curl -JLO "$DOWNLOAD_URL" || {
            echo -e "${RED}Download failed. Please check your internet connection.${NC}"
            exit 1
        }
    elif command -v wget &> /dev/null; then
        wget --content-disposition "$DOWNLOAD_URL" || {
            echo -e "${RED}Download failed. Please check your internet connection.${NC}"
            exit 1
        }
    else
        echo -e "${RED}Neither curl nor wget found. Please install one of them.${NC}"
        exit 1
    fi
    
    # Find the downloaded file
    local DOWNLOADED_FILE=$(ls -t $BINARY_NAME 2>/dev/null | head -1)
    
    if [ -z "$DOWNLOADED_FILE" ]; then
        echo -e "${RED}Downloaded file not found${NC}"
        exit 1
    fi
    
    # Make executable and rename
    chmod +x "$DOWNLOADED_FILE"
    mv "$DOWNLOADED_FILE" mkcert
    
    cd - > /dev/null
    
    echo -e "${GREEN}✓ mkcert downloaded and installed to $MKCERT_BIN${NC}"
    echo ""
}

# Check if mkcert is installed, install if not
MKCERT_CMD=$(find_mkcert 2>/dev/null || true)

if [ -z "$MKCERT_CMD" ]; then
    install_mkcert
    MKCERT_CMD=$(find_mkcert 2>/dev/null || true)
    
    if [ -z "$MKCERT_CMD" ]; then
        echo -e "${RED}Failed to install mkcert${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ mkcert is available${NC}"
$MKCERT_CMD --version
echo ""

# Check if mkcert CA is installed in system trust store
CA_ROOT=$($MKCERT_CMD -CAROOT 2>/dev/null)
CA_INSTALLED=false

if [ -n "$CA_ROOT" ] && [ -f "$CA_ROOT/rootCA.pem" ]; then
    # On macOS, check if CA is in Keychain
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Try to find the CA in Keychain
        if security find-certificate -c "mkcert" -a &>/dev/null || \
           security find-certificate -c "mkcert development CA" -a &>/dev/null; then
            CA_INSTALLED=true
            echo -e "${GREEN}✓ mkcert CA is installed in system trust store${NC}"
        else
            echo -e "${YELLOW}mkcert CA files exist but not in system trust store${NC}"
            echo -e "${YELLOW}Installing mkcert CA to system trust store...${NC}"
            echo ""
            echo -e "${BLUE}This requires your password to install the CA certificate${NC}"
            echo ""
            # Don't suppress errors - let user see what's happening
            if sudo $MKCERT_CMD -install; then
                CA_INSTALLED=true
                echo -e "${GREEN}✓ mkcert CA installed successfully${NC}"
            else
                echo -e "${YELLOW}⚠ CA installation failed or was cancelled${NC}"
                echo -e "${YELLOW}   This is OK - the master setup script will install it in the next step${NC}"
                CA_INSTALLED=false
            fi
        fi
    else
        # On Linux, just check if -install was run
        if $MKCERT_CMD -install -noprompt &>/dev/null 2>&1; then
            CA_INSTALLED=true
            echo -e "${GREEN}✓ mkcert CA is installed${NC}"
        else
            echo -e "${YELLOW}Installing mkcert CA to system trust store...${NC}"
            if sudo $MKCERT_CMD -install; then
                CA_INSTALLED=true
                echo -e "${GREEN}✓ mkcert CA installed successfully${NC}"
            else
                echo -e "${YELLOW}⚠ CA installation failed or was cancelled${NC}"
                echo -e "${YELLOW}   This is OK - the master setup script will install it in the next step${NC}"
                CA_INSTALLED=false
            fi
        fi
    fi
else
    echo -e "${YELLOW}Installing mkcert trust store (first-time only)...${NC}"
    echo -e "${YELLOW}This requires sudo privileges to install the CA certificate${NC}"
    echo ""
    if sudo $MKCERT_CMD -install; then
        CA_INSTALLED=true
        echo -e "${GREEN}✓ mkcert CA installed${NC}"
    else
        echo -e "${YELLOW}⚠ CA installation failed or was cancelled${NC}"
        echo -e "${YELLOW}   This is OK - the master setup script will install it in the next step${NC}"
        CA_INSTALLED=false
    fi
fi

if [ "$CA_INSTALLED" = false ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: mkcert CA is not installed in system trust store${NC}"
    echo -e "${YELLOW}   Your browser will show the certificate as 'Not Secure'${NC}"
    echo ""
fi
echo ""

# Create cert directory and check permissions
echo -e "${BLUE}Certificate directory: $CERT_DIR${NC}"
if ! mkdir -p "$CERT_DIR" 2>/dev/null; then
    echo -e "${RED}✗ Failed to create certificate directory: $CERT_DIR${NC}"
    exit 1
fi

# Check if directory is writable
if [ ! -w "$CERT_DIR" ]; then
    echo -e "${RED}✗ Certificate directory is not writable: $CERT_DIR${NC}"
    echo -e "${YELLOW}Please check permissions or run with appropriate privileges${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Certificate directory is ready${NC}"
echo ""

# Generate certificate with custom subject (CN=localcloudkit.local only)
echo -e "${YELLOW}Generating certificate for $DOMAIN with custom subject...${NC}"

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}✗ openssl not found. Please install openssl${NC}"
    echo -e "${YELLOW}On macOS: openssl is usually pre-installed${NC}"
    echo -e "${YELLOW}On Linux: sudo apt install openssl${NC}"
    exit 1
fi

# Get mkcert CA root directory
CA_ROOT=$($MKCERT_CMD -CAROOT 2>/dev/null)
if [ -z "$CA_ROOT" ]; then
    echo -e "${RED}✗ mkcert CA root not found${NC}"
    echo -e "${YELLOW}Please run: ${BLUE}$MKCERT_CMD -install${NC}"
    exit 1
fi

if [ ! -f "$CA_ROOT/rootCA.pem" ]; then
    echo -e "${RED}✗ mkcert CA certificate not found at: $CA_ROOT/rootCA.pem${NC}"
    echo -e "${YELLOW}Please run: ${BLUE}$MKCERT_CMD -install${NC}"
    exit 1
fi

if [ ! -f "$CA_ROOT/rootCA-key.pem" ]; then
    echo -e "${RED}✗ mkcert CA key not found at: $CA_ROOT/rootCA-key.pem${NC}"
    echo -e "${YELLOW}Please run: ${BLUE}$MKCERT_CMD -install${NC}"
    exit 1
fi

# Check if CA files are readable (they may be owned by root)
if [ ! -r "$CA_ROOT/rootCA.pem" ] || [ ! -r "$CA_ROOT/rootCA-key.pem" ]; then
    echo -e "${YELLOW}⚠ CA files are not readable (may be owned by root)${NC}"
    echo -e "${BLUE}Attempting to fix permissions or use sudo...${NC}"
    
    # Try to fix permissions if we have access
    if [ -w "$CA_ROOT" ] 2>/dev/null; then
        echo -e "${BLUE}Fixing CA file permissions...${NC}"
        chmod 644 "$CA_ROOT/rootCA.pem" 2>/dev/null || true
        chmod 600 "$CA_ROOT/rootCA-key.pem" 2>/dev/null || true
    fi
    
    # Check again after permission fix attempt
    if [ ! -r "$CA_ROOT/rootCA.pem" ] || [ ! -r "$CA_ROOT/rootCA-key.pem" ]; then
        echo -e "${YELLOW}CA files still not readable. Will use sudo for certificate signing.${NC}"
        USE_SUDO_FOR_SIGNING=true
    else
        USE_SUDO_FOR_SIGNING=false
        echo -e "${GREEN}✓ CA file permissions fixed${NC}"
    fi
else
    USE_SUDO_FOR_SIGNING=false
fi

echo -e "${GREEN}✓ mkcert CA found at: $CA_ROOT${NC}"

# Create temporary config file for extensions
# Include both base domain and wildcard for subdomain support
TMP_EXT_FILE=$(mktemp)
cat > "$TMP_EXT_FILE" <<EOF
[v3_req]
subjectAltName = DNS:$DOMAIN, DNS:*.$DOMAIN
EOF

# Generate private key (show errors for debugging)
echo -e "${BLUE}Generating private key...${NC}"
if ! openssl genrsa -out "$CERT_DIR/$DOMAIN-key.pem" 2048 2>&1; then
    rm -f "$TMP_EXT_FILE"
    echo -e "${RED}✗ Failed to generate private key${NC}"
    echo -e "${YELLOW}Check directory permissions: $CERT_DIR${NC}"
    exit 1
fi

# Create certificate signing request with custom subject (CN only, no user info)
echo -e "${BLUE}Creating certificate signing request...${NC}"
if ! openssl req -new -key "$CERT_DIR/$DOMAIN-key.pem" \
    -out "$CERT_DIR/$DOMAIN.csr" \
    -subj "/CN=$DOMAIN" 2>&1; then
    rm -f "$TMP_EXT_FILE" "$CERT_DIR/$DOMAIN-key.pem"
    echo -e "${RED}✗ Failed to create certificate signing request${NC}"
    exit 1
fi

# Sign certificate with mkcert CA (valid for 825 days, matching mkcert default)
echo -e "${BLUE}Signing certificate with mkcert CA...${NC}"

# Use sudo if CA files are not readable
if [ "$USE_SUDO_FOR_SIGNING" = true ]; then
    echo -e "${YELLOW}Using sudo to access root-owned CA files...${NC}"
    echo -e "${YELLOW}You may be prompted for your password${NC}"
    
    # Use sudo to sign the certificate
    if ! sudo openssl x509 -req -in "$CERT_DIR/$DOMAIN.csr" \
        -CA "$CA_ROOT/rootCA.pem" \
        -CAkey "$CA_ROOT/rootCA-key.pem" \
        -CAcreateserial \
        -out "$CERT_DIR/$DOMAIN.pem" \
        -days 825 \
        -extensions v3_req \
        -extfile "$TMP_EXT_FILE" 2>&1; then
        rm -f "$TMP_EXT_FILE" "$CERT_DIR/$DOMAIN.csr" "$CERT_DIR/$DOMAIN-key.pem"
        echo -e "${RED}✗ Failed to sign certificate${NC}"
        echo ""
        echo -e "${YELLOW}Troubleshooting:${NC}"
        echo "  1. CA files are owned by root. Try fixing permissions:"
        echo "     ${BLUE}sudo chmod 644 $CA_ROOT/rootCA.pem${NC}"
        echo "     ${BLUE}sudo chmod 600 $CA_ROOT/rootCA-key.pem${NC}"
        echo "  2. Or ensure you have sudo access for certificate signing"
        echo "  3. Verify mkcert CA is installed: ${BLUE}$MKCERT_CMD -install${NC}"
        echo "  4. Check directory permissions: ${BLUE}$CERT_DIR${NC}"
        exit 1
    fi
else
    if ! openssl x509 -req -in "$CERT_DIR/$DOMAIN.csr" \
        -CA "$CA_ROOT/rootCA.pem" \
        -CAkey "$CA_ROOT/rootCA-key.pem" \
        -CAcreateserial \
        -out "$CERT_DIR/$DOMAIN.pem" \
        -days 825 \
        -extensions v3_req \
        -extfile "$TMP_EXT_FILE" 2>&1; then
        rm -f "$TMP_EXT_FILE" "$CERT_DIR/$DOMAIN.csr" "$CERT_DIR/$DOMAIN-key.pem"
        echo -e "${RED}✗ Failed to sign certificate${NC}"
        echo ""
        echo -e "${YELLOW}Troubleshooting:${NC}"
        echo "  1. Verify mkcert CA is installed: ${BLUE}$MKCERT_CMD -install${NC}"
        echo "  2. Check CA files exist and are readable:"
        echo "     - ${BLUE}$CA_ROOT/rootCA.pem${NC}"
        echo "     - ${BLUE}$CA_ROOT/rootCA-key.pem${NC}"
        echo "  3. If files are root-owned, the script will use sudo automatically"
        echo "  4. Check directory permissions: ${BLUE}$CERT_DIR${NC}"
        echo "  5. Verify openssl version: ${BLUE}openssl version${NC}"
        exit 1
    fi
fi

# Clean up temporary files
rm -f "$CERT_DIR/$DOMAIN.csr" "$TMP_EXT_FILE"

echo ""
echo -e "${GREEN}✓ Certificates generated successfully!${NC}"
echo ""
echo "Generated files:"
ls -lh "$CERT_DIR/$DOMAIN"*

echo ""
echo -e "${GREEN}=== Next Steps ===${NC}"
echo ""

if [ "$CA_INSTALLED" = false ]; then
    echo -e "${YELLOW}⚠️  IMPORTANT: Install the CA certificate first!${NC}"
    echo ""
    echo "Run this command to install the CA:"
    echo "  ${BLUE}./scripts/install-ca.sh${NC}"
    echo ""
    echo "Or manually:"
    echo "  ${BLUE}sudo $MKCERT_CMD -install${NC}"
    echo ""
    echo "After installing, completely quit and restart your browser."
    echo ""
fi

echo "1. Restart Docker services:"
echo "   ${BLUE}docker compose down && docker compose up -d${NC}"
echo ""
echo "2. Open in your browser:"
echo "   ${BLUE}https://$DOMAIN${NC}"
echo ""

if [ "$CA_INSTALLED" = true ]; then
    echo -e "${GREEN}Both Chrome and Safari will trust these certificates automatically!${NC}"
else
    echo -e "${YELLOW}⚠️  Remember to install the CA certificate first (see above)${NC}"
fi
echo ""

