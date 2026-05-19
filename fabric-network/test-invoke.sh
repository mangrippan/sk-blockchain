#!/bin/bash

SCRIPT_DIR="/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network"
TEST_NETWORK_DIR="$SCRIPT_DIR/fabric-samples/test-network"

export PATH="$SCRIPT_DIR/fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$SCRIPT_DIR/fabric-samples/config"

cd "$TEST_NETWORK_DIR"
. scripts/envVar.sh
setGlobals 1

echo "Testing chaincode invocation..."
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile $ORDERER_CA \
  -C skchannel \
  -n chainrank \
  -c '{"function":"CreateKegiatan","Args":["test-001","1","hash123abc","1","5","2026-05-19T00:00:00Z"]}' \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles $PEER0_ORG1_CA

echo ""
echo "Testing chaincode query..."
peer chaincode query \
  -C skchannel \
  -n chainrank \
  -c '{"function":"GetKegiatan","Args":["test-001"]}'
