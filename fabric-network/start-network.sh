#!/bin/bash
# ============================================================
# Start Fabric Network + Deploy Chaincode
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHAINCODE_PATH="$PROJECT_ROOT/chaincode"
CHANNEL_NAME="mychannel"
CHAINCODE_NAME="chainrank"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"

export PATH=$SCRIPT_DIR/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=$SCRIPT_DIR/fabric-samples/config/

echo "============================================"
echo "  Starting Fabric Network"
echo "============================================"
echo ""

# Check fabric-samples exists
if [ ! -d "$SCRIPT_DIR/fabric-samples" ]; then
    echo "❌ fabric-samples not found. Run ./setup.sh first."
    exit 1
fi

cd "$SCRIPT_DIR/fabric-samples/test-network"

# Bring down any existing network
./network.sh down 2>/dev/null || true

echo "🚀 Starting test-network with CA..."
./network.sh up createChannel -c $CHANNEL_NAME -ca

echo ""
echo "✅ Network is up! Channel '$CHANNEL_NAME' created."
echo ""

# Deploy chaincode
echo "📦 Deploying chaincode '$CHAINCODE_NAME'..."
echo "   Chaincode path: $CHAINCODE_PATH"
echo ""

./network.sh deployCC \
    -ccn $CHAINCODE_NAME \
    -ccp "$CHAINCODE_PATH" \
    -ccl javascript \
    -c $CHANNEL_NAME

echo ""
echo "✅ Chaincode '$CHAINCODE_NAME' deployed successfully!"
echo ""

# Create connection profile for backend
echo "📋 Generating connection profile for backend..."

CONN_PROFILE_DIR="$PROJECT_ROOT/fabric-config"
mkdir -p "$CONN_PROFILE_DIR"

# Copy connection profile from test-network
cp "$SCRIPT_DIR/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json" \
   "$CONN_PROFILE_DIR/connection-org1.json"

echo "✅ Connection profile saved to fabric-config/connection-org1.json"

# Enroll appUser
echo ""
echo "👤 Registering and enrolling appUser..."
echo ""

node "$SCRIPT_DIR/enrollUser.js"

echo ""
echo "============================================"
echo "  ✅ Fabric Network Ready!"
echo "============================================"
echo ""
echo "  Network:    test-network (1 Org, 1 Peer, 1 Orderer)"
echo "  Channel:    $CHANNEL_NAME"
echo "  Chaincode:  $CHAINCODE_NAME"
echo "  Profile:    fabric-config/connection-org1.json"
echo "  Wallet:     fabric-config/wallet/"
echo ""
echo "  To use with backend, set in .env:"
echo "    FABRIC_ENABLED=true"
echo ""
