#!/bin/bash
# ============================================================
# Hyperledger Fabric Network Setup Script
# Downloads fabric-samples, binaries, and Docker images
# ============================================================

set -e

FABRIC_VERSION="2.5.4"
CA_VERSION="1.5.7"

echo "============================================"
echo "  ChainRank - Fabric Network Setup"
echo "============================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Download Fabric samples if not present
if [ ! -d "fabric-samples" ]; then
    echo ""
    echo "📦 Downloading Hyperledger Fabric samples, binaries, and Docker images..."
    echo "   This may take a few minutes..."
    echo ""
    curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
    chmod +x install-fabric.sh
    ./install-fabric.sh --fabric-version $FABRIC_VERSION --ca-version $CA_VERSION
    rm -f install-fabric.sh
else
    echo "✅ fabric-samples already exists"
fi

# Add Fabric binaries to PATH
export PATH=$PWD/fabric-samples/bin:$PATH

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: ./start-network.sh"
echo "  2. This will start the network and deploy chaincode"
echo ""
