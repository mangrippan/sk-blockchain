# Fabric Network Quick Reference

## 🚀 Network Status

**Current Status:** ✅ **RUNNING**

- **Channel:** `mychannel`
- **Chaincode:** `chainrank` (version 1.0, sequence 1)
- **Organizations:** Org1MSP, Org2MSP
- **Peers:** 2 (peer0.org1, peer0.org2)
- **Orderer:** 1 (orderer.example.com)
- **CAs:** 3 (ca_org1, ca_org2, ca_orderer)

## 📦 Running Containers

```powershell
# Check running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Expected containers:
# - peer0org1_chainrank_ccaas
# - peer0org2_chainrank_ccaas
# - peer0.org1.example.com
# - peer0.org2.example.com
# - orderer.example.com
# - ca_org1, ca_org2, ca_orderer
```

## 🎮 Network Management Commands

### Start Network (First Time or After Restart)
```powershell
cd fabric-network
.\start-network.ps1
```

### Stop Network
```powershell
cd fabric-network
.\stop-network.ps1
```

### View Network Logs
```powershell
# View peer logs
docker logs peer0.org1.example.com

# View orderer logs
docker logs orderer.example.com

# View chaincode logs
docker logs peer0org1_chainrank_ccaas
```

### Check Chaincode Status
```powershell
cd fabric-network\fabric-samples\test-network

# Query committed chaincode
wsl -d Ubuntu -- bash -c "cd $(pwd -P | sed 's|^/mnt/c|/mnt/c|') && peer lifecycle chaincode querycommitted --channelID mychannel --name chainrank"
```

## 🧪 Test Chaincode

### Via Peer CLI (in WSL)
```bash
cd fabric-network/fabric-samples/test-network

# Set environment for Org1
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Test invoke - CatatKegiatan
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n chainrank \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"CatatKegiatan","Args":["KEG-TEST-001","hash_nip_123","hash_dokumen_abc","15.5",""]}'

# Test query - GetAset
peer chaincode query \
  -C mychannel \
  -n chainrank \
  -c '{"function":"GetAset","Args":["KEGIATAN_KEG-TEST-001"]}'
```

## 📂 Important Paths

### Connection Profile
```
fabric-config/connection-org1.json
```

### Wallet (Admin & appUser)
```
fabric-config/wallet/
  ├── admin.id
  └── appUser.id
```

### Chaincode Source
```
chaincode/
  ├── index.js
  ├── package.json
  └── lib/
      └── kegiatanContract.js
```

## 🔧 Troubleshooting

### Network Won't Start
```powershell
# Clean everything and restart
cd fabric-network\fabric-samples\test-network
wsl -d Ubuntu -- bash -c "cd $(pwd -P | sed 's|^/mnt/c|/mnt/c|') && ./network.sh down"
docker system prune -f
cd ..\..\..\
.\start-network.ps1
```

### Chaincode Not Responding
```powershell
# Check chaincode container logs
docker logs peer0org1_chainrank_ccaas

# Restart chaincode containers
docker restart peer0org1_chainrank_ccaas peer0org2_chainrank_ccaas
```

### Docker Space Issues
```powershell
# Clean up Docker
docker system prune -a --volumes
```

## 📊 Network Endpoints

| Service | Port | URL |
|---------|------|-----|
| Peer0 Org1 | 7051 | localhost:7051 |
| Peer0 Org2 | 9051 | localhost:9051 |
| Orderer | 7050 | localhost:7050 |
| CA Org1 | 7054 | localhost:7054 |
| CA Org2 | 8054 | localhost:8054 |
| CA Orderer | 9054 | localhost:9054 |

## 🔐 Credentials

### Admin User
- **Username:** admin
- **Password:** adminpw

### App User
- **Username:** appUser
- **Enrolled:** ✅ Yes
- **MSP ID:** Org1MSP

## 🚀 Next Steps

1. **Test chaincode** dengan peer CLI commands
2. **Integrate backend** - gunakan fabric-network SDK di `backend/utils/fabricClient.js`
3. **Set environment variable:** `FABRIC_ENABLED=true` di `backend/.env`
4. **Test API endpoints** yang connect ke blockchain

## 📚 Documentation

- [Hyperledger Fabric Docs](https://hyperledger-fabric.readthedocs.io/)
- [Chaincode Contract](chaincode/lib/kegiatanContract.js)
- [Backend Integration](backend/utils/fabricClient.js)

---

**Last Updated:** May 17, 2026  
**Network Version:** Fabric 2.5.4  
**Status:** ✅ Operational
