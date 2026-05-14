#!/bin/bash
set -e

export DOCKER_BUILDKIT=0
TESTNET="/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/test-network"
export FABRIC_CFG_PATH="$TESTNET/../config"
export PATH="$TESTNET/../bin:$PATH"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="$TESTNET/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="$TESTNET/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051

cd "$TESTNET"

echo "=== Installing chaincode on peer0.org1 ==="
peer lifecycle chaincode install chainrank.tar.gz

echo "=== Querying installed chaincodes ==="
peer lifecycle chaincode queryinstalled

echo "=== Done ==="
