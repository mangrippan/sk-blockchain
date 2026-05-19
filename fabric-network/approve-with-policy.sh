#!/bin/bash

# Approve chaincode with signature policy OR
PACKAGE_ID="chainrank_1.0:76b872d97853336a7e824b208be9051bbc45817f9b96190ee384623b8a619766"
CHANNEL_NAME="skchannel"
CHAINCODE_NAME="chainrank"
CHAINCODE_VERSION="1.0"

SCRIPT_DIR="/mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network"
TEST_NETWORK_DIR="$SCRIPT_DIR/fabric-samples/test-network"

export PATH="$SCRIPT_DIR/fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$SCRIPT_DIR/fabric-samples/config"

cd "$TEST_NETWORK_DIR"
. scripts/envVar.sh

echo "Approving chaincode for Org1 with signature policy OR..."
setGlobals 1
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $PACKAGE_ID \
  --sequence 1 \
  --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"

if [ $? -ne 0 ]; then
  echo "Failed to approve for Org1"
  exit 1
fi

echo ""
echo "Approving chaincode for Org2 with signature policy OR..."
setGlobals 2
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $PACKAGE_ID \
  --sequence 1 \
  --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"

if [ $? -ne 0 ]; then
  echo "Failed to approve for Org2"
  exit 1
fi

echo ""
echo "Committing chaincode definition with signature policy OR..."
setGlobals 1
peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile $ORDERER_CA \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence 1 \
  --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles $PEER0_ORG1_CA \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles $PEER0_ORG2_CA

if [ $? -ne 0 ]; then
  echo "Failed to commit chaincode"
  exit 1
fi

echo ""
echo "✅ Chaincode approved and committed successfully with OR policy!"
