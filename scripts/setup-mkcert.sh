#!/usr/bin/env bash

# mkcert Setup Script for LocalCloud Kit
# Generates trusted local certificates for localcloudkit.localhost
# Automatically installs mkcert if not found

set -e

DOMAIN="localcloudkit.localhost"
CERT_DIR="./traefik/certs"
MKCERT_BIN_DIR="./scripts/bin"
MKCERT_BIN="$MKCERT_BIN_DIR/mkcert"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if mkcert CA is installed
if ! $MKCERT_CMD -CAROOT &> /dev/null; then
    echo -e "${YELLOW}Installing mkcert trust store (first-time only)...${NC}"
    echo -e "${YELLOW}This requires sudo privileges to install the CA certificate${NC}"
    
    # Check if we can run with sudo
    if [ "$EUID" -eq 0 ]; then
        $MKCERT_CMD -install
        echo -e "${GREEN}✓ mkcert CA installed${NC}"
    else
        echo -e "${YELLOW}Attempting to install CA (may prompt for password)...${NC}"
        if sudo $MKCERT_CMD -install 2>/dev/null; then
            echo -e "${GREEN}✓ mkcert CA installed${NC}"
        else
            echo -e "${RED}✗ Failed to install CA. You may need to run:${NC}"
            echo "  ${BLUE}sudo $MKCERT_CMD -install${NC}"
            echo ""
            echo -e "${YELLOW}Continuing without CA installation (certificates may show warnings)${NC}"
        fi
    fi
else
    echo -e "${GREEN}✓ mkcert CA already installed${NC}"
fi
echo ""

# Create cert directory
mkdir -p "$CERT_DIR"
echo -e "${BLUE}Certificate directory: $CERT_DIR${NC}"
echo ""

# Generate certificate
echo -e "${YELLOW}Generating certificate for $DOMAIN ...${NC}"
$MKCERT_CMD -cert-file "$CERT_DIR/$DOMAIN.pem" \
           -key-file  "$CERT_DIR/$DOMAIN-key.pem" \
           "$DOMAIN"

echo ""
echo -e "${GREEN}✓ Certificates generated successfully!${NC}"
echo ""
echo "Generated files:"
ls -lh "$CERT_DIR/$DOMAIN"*

echo ""
echo -e "${GREEN}=== Next Steps ===${NC}"
echo ""
echo "1. Restart Docker services:"
echo "   ${BLUE}docker compose down && docker compose up -d${NC}"
echo ""
echo "2. Open in your browser:"
echo "   ${BLUE}https://$DOMAIN${NC}"
echo ""
echo -e "${GREEN}Both Chrome and Safari will trust these certificates automatically!${NC}"
echo ""

