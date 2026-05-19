# ChainRank Quick Reference

## 🚀 Quick Start

### Option 1: Full Stack (Recommended)
```powershell
# First time only: Setup Node.js in WSL
.\setup-nodejs-wsl.ps1

# Start everything
.\start-all.ps1
# Choose: 1) WSL mode for full Fabric integration
```

### Option 2: Database Only (No Blockchain)
```powershell
.\start-all.ps1
# Choose: 2) Windows mode (Fabric disabled)
```

## 🛑 Stop Services

```powershell
.\stop-all.ps1
```

## 🔧 Individual Services

### Database Only
```powershell
docker compose -f docker-compose.dev.yml up -d
```

### Fabric Network (CCAAS)
```powershell
.\restart-fabric-ccaas.ps1
```

### Backend (WSL Mode)
```powershell
.\start-backend-wsl.ps1
```

## 📋 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend API | http://localhost:3000 | - |
| Swagger Docs | http://localhost:3000/api-docs | - |
| CouchDB Org1 | http://localhost:5984/_utils | admin/adminpw |
| CouchDB Org2 | http://localhost:7984/_utils | admin/adminpw |
| PostgreSQL | localhost:5433 | postgres/postgres123 |

**Default Login:**
- Email: `admin@chainrank.test`
- Password: `password123`

## 🔍 Verification

### Check All Services
```powershell
# Fabric containers
docker ps --filter "name=peer\|orderer\|chainrank"

# Database
docker ps --filter "name=postgres"

# Test Fabric (from WSL)
wsl -d Ubuntu -- bash -c "cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend && node test-fabric-connection.js"
```

### Test Chaincode (CLI)
```bash
wsl -d Ubuntu
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/test-network

# Load environment
. scripts/envVar.sh && setGlobals 1

# Test invoke
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA -C skchannel -n chainrank \
  -c '{"function":"InitLedger","Args":[]}' \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA

# Query
peer chaincode query -C skchannel -n chainrank -c '{"function":"GetAllKegiatan","Args":[]}'
```

## 📚 Detailed Guides

- **Backend WSL Setup**: [BACKEND_WSL_GUIDE.md](BACKEND_WSL_GUIDE.md)
- **Fabric CCAAS Method**: [fabric-network/CCAAS_METHOD.md](fabric-network/CCAAS_METHOD.md)
- **Quick Chaincode Fix**: [QUICK_FIX_CHAINCODE.md](QUICK_FIX_CHAINCODE.md)
- **Deployment Issues**: [docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md](docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md)
- **Known SDK Issue**: [docs/FABRIC_SDK_KNOWN_ISSUE.md](docs/FABRIC_SDK_KNOWN_ISSUE.md)

## 🐛 Troubleshooting

### Fabric Network Issues
```powershell
# Restart Fabric with CCAAS
.\restart-fabric-ccaas.ps1
```

### Backend Can't Connect to Fabric
**Solution**: Run backend in WSL mode
```powershell
.\start-backend-wsl.ps1
```

### Port Already in Use
```powershell
# Find process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select OwningProcess

# Kill process (replace PID)
Stop-Process -Id <PID> -Force
```

### Database Connection Failed
```powershell
# Restart database
docker compose -f docker-compose.dev.yml restart
```

## 🏗️ Architecture

### WSL Mode (Full Integration)
```
┌─────────────────────────────────────┐
│  Windows                            │
│  ┌──────────┐                       │
│  │ Frontend │ (Vue.js port 5173)    │
│  │ Browser  │                       │
│  └────┬─────┘                       │
└───────┼─────────────────────────────┘
        │ HTTP
        ↓
┌─────────────────────────────────────┐
│  WSL2 (Ubuntu)                      │
│                                     │
│  ┌─────────┐      ┌──────────────┐ │
│  │ Backend │━━━━━━│ Fabric       │ │
│  │ Node.js │      │ Network      │ │
│  │  :3000  │      │ (CCAAS)      │ │
│  └────┬────┘      └──────────────┘ │
│       │                             │
│       ↓                             │
│  ┌─────────┐                        │
│  │PostgreSQL│ (port 5433)          │
│  └─────────┘                        │
└─────────────────────────────────────┘
```

## ✅ Features

### Blockchain (Fabric + CCAAS)
- ✅ Immutable audit trail
- ✅ Document hash verification
- ✅ Tamper-proof records
- ✅ CouchDB rich queries
- ✅ External chaincode containers

### Backend (Node.js + Express)
- ✅ RESTful API
- ✅ JWT authentication
- ✅ File upload handling
- ✅ Hybrid storage (PostgreSQL + Blockchain)
- ✅ Swagger documentation

### Frontend (Vue.js)
- ✅ Responsive UI
- ✅ Role-based access
- ✅ Document management
- ✅ Promotion workflow

## 📦 Scripts

| Script | Purpose |
|--------|---------|
| `start-all.ps1` | Start all services (interactive) |
| `stop-all.ps1` | Stop all services |
| `restart-fabric-ccaas.ps1` | Restart Fabric with CCAAS |
| `start-backend-wsl.ps1` | Start backend in WSL |
| `setup-nodejs-wsl.ps1` | Install Node.js in WSL (once) |

---

**Last Updated**: 2026-05-19  
**Status**: ✅ CCAAS Fixed | ✅ WSL Integration Ready
