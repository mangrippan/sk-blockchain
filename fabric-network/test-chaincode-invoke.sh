#!/bin/bash
set -e

export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/test-network
source scripts/envVar.sh
setGlobals 1

echo "=== Test 1: Invoke CreateKegiatan with namespace ==="
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C skchannel -n chainrank \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
  -c '{"function":"KegiatanContract:CreateKegiatan","Args":["test-cli-001","user-001","hash123abc","1","4.0","Test from CLI"]}'

echo ""
echo "=== Test 2: Query the record ==="
peer chaincode query \
  -C skchannel -n chainrank \
  -c '{"function":"KegiatanContract:GetKegiatan","Args":["test-cli-001"]}'
