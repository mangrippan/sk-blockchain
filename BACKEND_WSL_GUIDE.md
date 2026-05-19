# Quick Start: Backend dengan Fabric (WSL Mode)

## Kenapa Perlu WSL?

Backend yang berjalan di **Windows** tidak bisa connect ke Fabric network yang running di **WSL Docker** karena networking issue. Solusinya: jalankan backend di **WSL** juga!

## Prerequisites

### 1. Setup Node.js di WSL (First Time Only)

Jalankan installer otomatis:

```powershell
.\setup-nodejs-wsl.ps1
```

Atau manual:
```bash
# Di WSL terminal
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify:
```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

## Cara 1: Automatic (via start-all.ps1)

```powershell
.\start-all.ps1
```

Saat diminta pilih runtime backend:
```
Choose backend runtime:
  1) WSL (Recommended - better Fabric connectivity)  ← PILIH INI
  2) Windows (Database-only mode, no Fabric)

Enter choice (1 or 2, default: 1): 1
```

## Cara 2: Manual Start Backend di WSL

### Option A: Via PowerShell Wrapper

```powershell
.\start-backend-wsl.ps1
```

### Option B: Direct di WSL Terminal

```bash
# Buka WSL terminal
wsl -d Ubuntu

# Jalankan backend
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
npm start
```

## Verification

### 1. Check Backend Running

Browser: http://localhost:3000/api/v1/health

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 2. Test Fabric Connection

Di WSL terminal (saat backend running):

```bash
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
node test-fabric-connection.js
```

Expected:
```
✅ Connected to Fabric network
✅ Transaction submitted successfully
```

### 3. Test API via Swagger

Browser: http://localhost:3000/api-docs

Try endpoint:
- POST `/api/v1/auth/login`
- GET `/api/v1/ref/jabatan`

## Architecture (WSL Mode)

```
┌─────────────────────────────────────────┐
│         WSL2 (Ubuntu)                   │
│                                         │
│  ┌──────────────┐   ┌───────────────┐ │
│  │   Backend    │   │ Fabric Network│ │
│  │  (Node.js)   │━━━│ (Peers/Orderer│ │
│  │  port 3000   │   │  Chaincode)   │ │
│  └──────────────┘   └───────────────┘ │
│         │                              │
└─────────│──────────────────────────────┘
          │ (localhost:3000)
          ↓
    Windows Browser
    Frontend (Vue.js)
```

## Troubleshooting

### Backend tidak start di WSL

**Error**: `npm: command not found`

**Solution**: Install Node.js di WSL
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Port 3000 already in use

**Solution**: Stop backend yang running di Windows
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select OwningProcess
# Kill the process (replace PID)
Stop-Process -Id <PID> -Force
```

### Fabric connection still fails

**Solution**: Verify Fabric network running
```bash
docker ps --filter "name=peer\|orderer\|chainrank"
```

Should show:
- peer0.org1.example.com
- peer0.org2.example.com
- orderer.example.com
- chainrank.org1.example.com
- chainrank.org2.example.com

If not running:
```powershell
.\restart-fabric-ccaas.ps1
```

## Environment Variables

Backend `.env` for WSL mode:

```env
# Database (Docker container accessible from WSL)
DB_HOST=localhost
DB_PORT=5434

# Fabric (WSL mode - all working!)
FABRIC_ENABLED=true
FABRIC_CHANNEL=skchannel
FABRIC_CHAINCODE=chainrank
```

## Benefits WSL Mode

✅ **Fabric integration works** (no networking issues)
✅ **Blockchain features enabled** (immutability, audit trail)
✅ **CouchDB queries** dapat digunakan
✅ **Same environment as production** (Linux-based)

## Alternative: Windows Mode (Database Only)

Jika hanya perlu development tanpa Fabric:

```env
FABRIC_ENABLED=false
```

Lalu jalankan backend di Windows seperti biasa:
```powershell
cd backend
npm start
```

✅ Database CRUD works
❌ Blockchain features disabled

---

**Recommended**: Gunakan WSL mode untuk development lengkap dengan Fabric!
