#!/bin/bash
set -e

export PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/config
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/test-network
source scripts/envVar.sh

PACKAGE_ID="chainrank_1.0:e8cdd08f02aad06a4e57f530afabfdd68b3629e2a9d33ed562aa71fb211d6639"
CHANNEL="skchannel"
CC_NAME="chainrank"
CC_VERSION="1.0"
SEQUENCE=1

echo "=== Step 1: Approve for Org1 ==="
setGlobals 1
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $SEQUENCE --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"
echo "Org1 approved!"

echo "=== Step 2: Approve for Org2 ==="
setGlobals 2
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL --name $CC_NAME --version $CC_VERSION --package-id $PACKAGE_ID --sequence $SEQUENCE --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"
echo "Org2 approved!"

echo "=== Step 3: Check commit readiness ==="
setGlobals 1
peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL --name $CC_NAME --version $CC_VERSION --sequence $SEQUENCE --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"

echo "=== Step 4: Commit chaincode ==="
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL --name $CC_NAME --version $CC_VERSION --sequence $SEQUENCE --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"
echo "Chaincode committed!"

echo "=== Step 5: Verify ==="
peer lifecycle chaincode querycommitted --channelID $CHANNEL --name $CC_NAME
echo ""
echo "=== DONE! Chaincode ready with OR policy ==="
