#!/bin/bash
# Test chaincode on running Fabric network

cd "$(dirname "$0")/fabric-samples/test-network"

export PATH=$PWD/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

ORDERER_CA=$PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
PEER0_ORG1_CA=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
PEER0_ORG2_CA=$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

echo "=== Testing CreateKegiatan ==="
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_CA" \
  -C skchannel -n chainrank \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" \
  -c '{"function":"CreateKegiatan","Args":["kg-test-001","dosen-1","abc123hash","ref-1","10","2026-05-15T00:00:00Z"]}'

sleep 2

echo ""
echo "=== Testing ReadKegiatan ==="
peer chaincode query -C skchannel -n chainrank \
  -c '{"function":"ReadKegiatan","Args":["kg-test-001"]}'

echo ""
echo "=== Testing VerifyDocumentHash (valid) ==="
peer chaincode query -C skchannel -n chainrank \
  -c '{"function":"VerifyDocumentHash","Args":["kg-test-001","abc123hash"]}'

echo ""
echo "=== Testing VerifyDocumentHash (tampered) ==="
peer chaincode query -C skchannel -n chainrank \
  -c '{"function":"VerifyDocumentHash","Args":["kg-test-001","tampered-hash"]}'

echo ""
echo "=== Testing AjukanUsulanKenaikanPangkat ==="
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "$ORDERER_CA" \
  -C skchannel -n chainrank \
  --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" \
  --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" \
  -c '{"function":"AjukanUsulanKenaikanPangkat","Args":["usl-test-001","hashNIP123","250","Lektor","null","2026-05-15T00:00:00Z"]}'

sleep 2

echo ""
echo "=== Testing GetUsulan ==="
peer chaincode query -C skchannel -n chainrank \
  -c '{"function":"GetUsulan","Args":["usl-test-001"]}'

echo ""
echo "=== All tests complete! ==="
