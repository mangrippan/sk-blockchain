#!/bin/bash
# ============================================================
# Stop Fabric Network
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export PATH=$SCRIPT_DIR/fabric-samples/bin:$PATH

echo "🛑 Stopping Fabric network..."

cd "$SCRIPT_DIR/fabric-samples/test-network"
./network.sh down

echo "✅ Network stopped."
