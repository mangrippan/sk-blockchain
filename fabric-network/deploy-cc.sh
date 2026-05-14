#!/bin/bash
set -e

TESTNET="/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/test-network"
CHAINCODE="/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/chaincode"
export FABRIC_CFG_PATH="$TESTNET/../config"
export PATH="$TESTNET/../bin:$PATH"

cd "$TESTNET"

echo "=== Deploying chaincode using ccaas ==="
./network.sh deployCCAAS -ccn chainrank -ccp "$CHAINCODE" -ccl javascript -c mychannel

echo "=== Done ==="
