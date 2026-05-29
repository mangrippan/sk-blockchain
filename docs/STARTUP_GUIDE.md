# ChainRank - Startup Guide

Panduan lengkap untuk menjalankan sistem blockchain dari awal.

## Prerequisites

- **Docker Desktop** (dengan WSL2 integration)
- **WSL Ubuntu** (distro terpasang)
- **Node.js 18+** (di Windows)
- **PostgreSQL** (via Docker container `chainrank_postgres_dev`)

## Arsitektur

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────────┐
│  Frontend   │────▶│  Backend (3000)  │────▶│  Fabric Network   │
│  (Vite)     │     │  Express + SDK   │     │  (Docker/WSL)     │
└─────────────┘     └────────┬────────┘     └───────────────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL DB  │
                    │  (port 5434)    │
                    └─────────────────┘
```

## Urutan Startup

### 1. Start Fabric Network (Sekali / Setelah Restart)

```powershell
cd fabric-network
.\start-network-ccaas.ps1
```

Script ini akan:
- Start Fabric containers (peers, orderer, CAs, CouchDB)
- Create channel `skchannel`
- Package & install chaincode `chainrank`
- Build & start chaincode Docker containers (CCAAS method)
- Approve & commit chaincode definition

**Durasi**: ~2-3 menit

### 2. Enroll Wallet (Sekali / Setelah Network Recreate)

```powershell
cd backend
node enroll-wallet.js
```

Mendaftarkan identitas `admin` dan `appUser` ke wallet (`fabric-config/wallet/`).

### 3. Start PostgreSQL (Jika Belum Running)

**Jika container sudah ada** (biasanya setelah pernah dibuat):
```powershell
docker start chainrank_postgres_dev
```

**Jika pertama kali / belum pernah dibuat**:
```powershell
docker-compose -f docker-compose.dev.yml up -d postgres
```

> Database otomatis ter-initialize dengan schema & seed data dari `database/`

### 4. Start Backend

```powershell
cd backend
node server.js
```

Server berjalan di `http://localhost:3000`. Akan otomatis connect ke Fabric network.

**Verifikasi**:
```powershell
curl http://localhost:3000/health
```

### 5. Start Frontend (Opsional)

```powershell
cd frontend
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

---

## Stop/Restart

### Stop Semua
```powershell
.\stop-all.ps1
```

### Restart Fabric Network (Tanpa Recreate)
```powershell
.\restart-fabric-ccaas.ps1
```

### Stop Fabric Network
```powershell
cd fabric-network
.\stop-network.ps1
```

---

## Script Reference

| Script | Lokasi | Fungsi |
|--------|--------|--------|
| `start-network-ccaas.ps1` | `fabric-network/` | Deploy Fabric network + chaincode (CCAAS) |
| `stop-network.ps1` | `fabric-network/` | Stop & cleanup Fabric network |
| `restart-fabric-ccaas.ps1` | `.` (root) | Restart Fabric tanpa full recreate |
| `start-all.ps1` | `.` (root) | Start semua service |
| `stop-all.ps1` | `.` (root) | Stop semua service |
| `start-backend-wsl.ps1` | `.` (root) | Start backend di WSL |
| `enroll-wallet.js` | `backend/` | Enroll Fabric identities ke wallet |
| `seed-users.js` | `backend/` | Seed user accounts ke DB |
| `seed-ref-data.js` | `backend/` | Seed reference data ke DB |
| `install-fabric.sh` | `fabric-network/` | Install Fabric binaries (one-time) |

---

## Troubleshooting

### Port 3000 sudah terpakai
Cek apakah ada proses lama di WSL:
```powershell
wsl -e bash -c "ss -tlnp | grep 3000"
# Jika ada, kill:
wsl -e bash -c "kill <PID>"
```

### Fabric connection gagal
1. Pastikan Docker containers running:
   ```powershell
   docker ps --filter "name=peer0\|orderer\|chainrank"
   ```
2. Pastikan wallet ter-enroll:
   ```powershell
   ls fabric-config/wallet/
   # Harus ada: admin/ dan appUser/
   ```
3. Pastikan TLS cert di connection profile masih valid:
   ```powershell
   # Jika network di-recreate, jalankan:
   node backend/enroll-wallet.js
   ```

### Chaincode containers not running
```powershell
docker ps --filter "name=chainrank"
# Jika tidak ada, restart network:
.\restart-fabric-ccaas.ps1
```

### Ledger already exists error
Jika muncul error saat startup network:
```
cannot create ledger from genesis block: ledger [skchannel] already exists with state [ACTIVE]
```

**Penyebab**: Docker volumes dari network sebelumnya masih ada  
**Solusi**: Deep clean network dan volumes

```powershell
cd fabric-network
.\clean-network.ps1
```

Script ini akan:
- Stop semua containers
- Hapus Docker volumes (tempat ledger data disimpan)
- Hapus chaincode packages & wallet
- Clean Docker artifacts

Setelah cleanup, start ulang dari awal:
```powershell
.\start-network-ccaas.ps1
cd ..\backend
node enroll-wallet.js
```

> **⚠️ Warning**: `clean-network.ps1` akan menghapus semua data blockchain. Hanya gunakan untuk development/testing.

---

## Environment Variables (backend/.env)

```env
FABRIC_ENABLED=true
FABRIC_CHANNEL=skchannel
FABRIC_CHAINCODE=chainrank
FABRIC_CONNECTION_PROFILE=../fabric-config/connection-org1-wsl.json
FABRIC_WALLET_PATH=../fabric-config/wallet
```

## Status Indicators (Server Startup)

| Log | Artinya |
|-----|---------|
| ✅ Connected to PostgreSQL database | DB OK |
| ✅ Connected to Fabric network as appUser | Blockchain OK |
| ⚠️ Fabric integration disabled | `FABRIC_ENABLED=false` |
| ❌ Failed to connect to Fabric network | Cek Docker/wallet |

### Normal Warnings saat Startup

Saat backend startup, mungkin muncul error gRPC seperti ini:
```
error: [ServiceEndpoint]: Failed to connect before the deadline on Endorser
error: [ServiceEndpoint]: waitForReady - Failed to connect to remote gRPC server
```

**Ini NORMAL** ✅ - Fabric SDK melakukan service discovery dengan mencoba berbagai endpoints. Beberapa connection attempt timeout, tapi SDK tetap berhasil connect.

**Tanda sukses:** Lihat log `✅ Connected to Fabric network as appUser` - ini artinya koneksi berhasil meskipun ada warning di atas.
