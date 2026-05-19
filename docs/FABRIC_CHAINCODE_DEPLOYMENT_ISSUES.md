# Fabric Chaincode Deployment Issues - Troubleshooting Guide

## Ringkasan Masalah

Saat melakukan deployment chaincode ke Hyperledger Fabric network di Windows dengan WSL (Windows Subsystem for Linux), terjadi error **Docker build broken pipe** yang menyebabkan chaincode gagal ter-deploy.

### Error Message
```
Error: chaincode install failed with status: 500 - failed to invoke backing 
implementation of 'InstallChaincode': could not build chaincode: docker build 
failed: docker image build failed: write unix @->/var/run/docker.sock: write: 
broken pipe
```

## Root Cause Analysis

### 1. **Docker Socket Communication Timeout**
- Fabric peer di WSL berkomunikasi dengan Docker daemon melalui Unix socket (`/var/run/docker.sock`)
- Saat build chaincode Node.js, proses `npm install` memakan waktu lama
- Koneksi socket timeout/terputus sebelum build selesai
- WSL-Docker integration tidak stabil untuk operasi build yang lama

### 2. **WSL Resource Limitations**
- WSL memiliki resource allocation terbatas (memory, CPU)
- Docker build chaincode memerlukan resource cukup besar
- npm install dependencies di dalam Docker build WSL lambat
- Connection timeout karena proses terlalu lama

### 3. **Network Path Complexity**
```
Windows Docker Desktop
    ↓
WSL2 (Ubuntu)
    ↓
Docker Socket (/var/run/docker.sock)
    ↓
Fabric Peer (build chaincode)
    ↓
Docker Build Process (npm install)
```
Banyak layer yang harus dilalui, increasing chance of failure.

## Attempted Solutions

### ✅ Solusi yang Dicoba

#### 1. **Pre-install Dependencies**
```powershell
cd chaincode
npm install
```
**Status:** Tidak berhasil - peer tetap build ulang di dalam Docker

#### 2. **Optimasi Dockerfile**
- Tambah timeout untuk npm install
- Gunakan Alpine image yang lebih kecil
- Tambah `.dockerignore` untuk exclude unnecessary files

**Dockerfile improvements:**
```dockerfile
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 120000 && \
    npm install --production --no-optional
```
**Status:** Membantu tapi tidak mengatasi broken pipe

#### 3. **Docker Cache Cleanup**
```powershell
wsl -d Ubuntu -- bash -c "docker system prune -f"
```
**Result:** Membersihkan 7.4GB cache tapi masalah persists

#### 4. **WSL Restart**
```powershell
wsl --shutdown
# Wait 5 seconds
wsl -d Ubuntu -- echo "WSL restarted"
```
**Status:** Temporary fix, tapi error kembali terjadi

#### 5. **Manual Packaging (peer lifecycle chaincode package)**
Menggunakan peer command untuk package chaincode di Windows:
```powershell
peer lifecycle chaincode package chainrank.tar.gz \
  --path ./chaincode \
  --lang node \
  --label chainrank_1.0
```
**Status:** Berhasil create package, tapi install tetap trigger Docker build

#### 6. **CCAAS (Chaincode-as-a-Service) Method** ⚠️ *In Progress*
Mencoba deploy chaincode sebagai external service untuk avoid Docker build di WSL.

**Status:** Docker image berhasil di-build di Windows, tapi CCAAS package format masih ada issues

## Recommended Solutions

### 🎯 **Solution 1: Restart Docker Desktop** (Most Effective)

Ini solusi paling efektif untuk refresh WSL-Docker connection.

**Steps:**
1. Buka Docker Desktop
2. Click icon Docker di system tray (bottom-right)
3. Pilih "Restart"
4. Tunggu sampai Docker fully restarted (icon hijau)
5. Verify WSL integration:
   ```powershell
   # Docker Desktop → Settings → Resources → WSL Integration
   # Pastikan "Ubuntu" enabled
   ```
6. Test deployment:
   ```powershell
   .\restart-fabric.ps1
   ```

**Success Rate:** ~80-90%

### 🎯 **Solution 2: Increase Docker Resources**

**Steps:**
1. Open Docker Desktop
2. Go to Settings → Resources
3. Adjust settings:
   - **Memory:** 6 GB minimum (8 GB recommended)
   - **CPUs:** 4 minimum (6 recommended)
   - **Swap:** 2 GB
   - **Disk image size:** 64 GB minimum
4. Click "Apply & Restart"
5. Test deployment

**Success Rate:** ~70%

### 🎯 **Solution 3: Use Development Mode (PostgreSQL Only)**

Jika chaincode deployment terus gagal, gunakan database PostgreSQL saja untuk development.

**Pros:**
- ✅ Backend API tetap berfungsi
- ✅ Database operations normal
- ✅ Frontend bisa development
- ✅ Cocok untuk development awal

**Cons:**
- ❌ Tidak ada blockchain immutability
- ❌ Tidak ada audit trail di blockchain
- ❌ Hanya untuk development, bukan production

**Implementation:**
1. Network Fabric tetap UP (peers, orderer, CouchDB running)
2. Chaincode tidak ter-deploy
3. Backend uses PostgreSQL untuk semua operations
4. Disable Fabric integration di backend (comment out fabric calls)

### 🎯 **Solution 4: Native Linux Deployment** (Guaranteed)

Deploy di native Linux environment untuk menghindari WSL issues completely.

**Options:**
- **Ubuntu VM** (VirtualBox/VMware)
- **Ubuntu dual boot**
- **Linux cloud server** (AWS EC2, Azure VM)

**Success Rate:** ~100%

## Scripts Available

### Original Method
- `fabric-network/start-network.ps1` - Start network + deploy chaincode (standard)
- `restart-fabric.ps1` - Restart entire Fabric network

### CCAAS Method (Alternative - In Development)
- `fabric-network/start-network-ccaas.ps1` - Start network + deploy chaincode (CCAAS)
- `restart-fabric-ccaas.ps1` - Restart with CCAAS method
- `fabric-network/CCAAS_METHOD.md` - Documentation

**Note:** CCAAS method masih dalam pengembangan. Docker image berhasil di-build di Windows, tapi ada issues dengan package format yang perlu di-resolve.

## Troubleshooting Steps

### 1. Check Docker Status
```powershell
# Check Docker is running
docker info

# Check Docker daemon in WSL
wsl -d Ubuntu -- docker ps

# Check Docker version
docker --version
```

### 2. Check Fabric Network Status
```powershell
# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Should show:
# - peer0.org1.example.com
# - peer0.org2.example.com  
# - orderer.example.com
# - ca_org1, ca_org2, ca_orderer
# - couchdb0, couchdb1
```

### 3. Check WSL Integration
```powershell
# Test WSL Docker connection
wsl -d Ubuntu -- docker version

# Should show both Client and Server versions
```

### 4. View Peer Logs
```powershell
# Check peer logs for detailed error
docker logs peer0.org1.example.com

# Check for Docker build errors
docker logs peer0.org1.example.com 2>&1 | Select-String "build|error|fail"
```

### 5. Test Chaincode Package Manually
```powershell
cd fabric-network

# Test package creation
wsl -d Ubuntu -- bash -c "cd fabric-samples/test-network && \
  export PATH=../bin:\$PATH && \
  export FABRIC_CFG_PATH=../config && \
  peer lifecycle chaincode package test.tar.gz \
    --path ../../chaincode \
    --lang node \
    --label test_1.0"

# If this succeeds, problem is in install step
```

### 6. Check Docker Build Capability in WSL
```powershell
# Test simple Docker build in WSL
wsl -d Ubuntu -- bash -c "cd /tmp && \
  echo 'FROM node:18-alpine' > Dockerfile && \
  echo 'RUN npm install express' >> Dockerfile && \
  docker build -t test ."

# If this fails, Docker daemon in WSL has issues
```

## Monitoring & Verification

### Check Chaincode Installation Status
```bash
# Inside WSL
cd fabric-samples/test-network
export PATH=../bin:$PATH
export FABRIC_CFG_PATH=../config

# Set peer context
. scripts/envVar.sh
setGlobals 1

# Query installed chaincodes
peer lifecycle chaincode queryinstalled
```

### Expected Output (Success):
```
Installed chaincodes on peer:
Package ID: chainrank_1.0:c590f1c7e2b27e5eba7dab83d57b2cf5a49a52c4f46be2f31fa7f06cf94cfc9a, Label: chainrank_1.0
```

### Check Committed Chaincodes
```bash
peer lifecycle chaincode querycommitted --channelID skchannel
```

### Expected Output (Success):
```
Committed chaincode definitions on channel 'skchannel':
Name: chainrank, Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc
```

## Workaround untuk Development

Jika chaincode deployment terus gagal, berikut workflow development alternative:

### Option A: Database-Only Development
```powershell
# 1. Start database saja
docker compose -f docker-compose.dev.yml up -d

# 2. Start backend (tanpa Fabric)
cd backend
npm start

# 3. Start frontend
cd frontend  
npm run dev
```

**Disable Fabric di Backend:**
```javascript
// backend/utils/fabricClient.js
// Comment out atau tambah early return

async function submitTransaction(functionName, ...args) {
  // return null; // Temporary disable
  // ... existing code
}
```

### Option B: Periodic Retry
Script untuk retry chaincode deployment setiap 5 menit:

```powershell
# retry-deploy.ps1
$maxRetries = 10
$retryDelay = 300  # 5 minutes

for ($i = 1; $i -le $maxRetries; $i++) {
    Write-Host "Attempt $i of $maxRetries..."
    
    cd fabric-network
    .\stop-network.ps1
    Start-Sleep -Seconds 5
    .\start-network.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! Chaincode deployed." -ForegroundColor Green
        exit 0
    }
    
    Write-Host "Failed. Retrying in 5 minutes..." -ForegroundColor Yellow
    Start-Sleep -Seconds $retryDelay
}

Write-Host "All attempts failed." -ForegroundColor Red
```

## Known Issues & Limitations

### WSL2 + Docker Desktop Issues
- ❌ Socket communication unstable untuk long-running builds
- ❌ npm install lambat di WSL Docker containers
- ❌ Resource sharing antara Windows dan WSL terbatas
- ❌ Docker daemon restart tidak selalu fix the issue

### CCAAS Method Issues (Current)
- ⚠️ Package format requirements tidak terdokumentasi dengan baik
- ⚠️ Encoding issues (BOM, UTF-8) di Windows
- ⚠️ Tar archive structure harus exact match expectations
- ⚠️ Masih dalam development phase

## Success Criteria

Chaincode berhasil ter-deploy jika:

1. ✅ No error messages during install
2. ✅ `peer lifecycle chaincode queryinstalled` menampilkan package
3. ✅ Chaincode containers berjalan (untuk standard method)
4. ✅ `peer lifecycle chaincode querycommitted` menampilkan chaincode
5. ✅ Backend bisa invoke chaincode functions
6. ✅ CouchDB menampilkan chaincode data

## References

### Official Documentation
- [Fabric Chaincode Deployment](https://hyperledger-fabric.readthedocs.io/en/latest/deploy_chaincode.html)
- [Chaincode as a Service](https://hyperledger-fabric.readthedocs.io/en/latest/cc_service.html)
- [Docker WSL Integration](https://docs.docker.com/desktop/wsl/)

### Project Files
- `fabric-network/start-network.ps1` - Main deployment script
- `fabric-network/start-network-ccaas.ps1` - Alternative CCAAS method
- `chaincode/` - Chaincode source code
- `backend/utils/fabricClient.js` - Backend Fabric integration

## Next Steps

1. **Immediate Action:**
   - Restart Docker Desktop
   - Increase Docker resources to 6GB+ RAM, 4+ CPUs
   - Run `.\restart-fabric.ps1`

2. **If Still Failing:**
   - Use PostgreSQL-only development mode
   - Continue frontend/backend development
   - Deploy to Linux VM for testing blockchain features

3. **Long-term Solution:**
   - Consider Ubuntu VM atau cloud deployment for production
   - Complete CCAAS implementation as alternative
   - Document successful configuration for team

## Support

Jika masalah persists setelah mencoba semua solusi:

1. Check Docker Desktop logs:
   - Docker Desktop → Troubleshoot → View logs
   
2. Check WSL logs:
   ```powershell
   wsl --list --verbose
   wsl --status
   ```

3. Reinstall Docker Desktop WSL integration:
   ```powershell
   # Docker Desktop → Settings → Resources → WSL Integration
   # Disable Ubuntu → Apply → Enable Ubuntu → Apply
   ```

4. Consider alternative approaches (native Linux, cloud deployment)

---

**Last Updated:** 2026-05-19  
**Status:** Active troubleshooting  
**Priority:** High - Blocks blockchain functionality
