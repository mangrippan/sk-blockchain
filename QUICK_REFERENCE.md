# ChainRank - Quick Reference

## Menjalankan Project

### Start Semua (Recommended)

```powershell
.\start-all.ps1
# Pilih opsi 1 (WSL) untuk full Fabric/blockchain integration
```

Script ini otomatis menjalankan:
1. PostgreSQL Database (Docker, port 5434)
2. Hyperledger Fabric Network (CCAAS)
3. Backend Server (WSL, port 3000)
4. Frontend Vue.js (port 5174)

### Post-Start: Deploy Chaincode & Refresh Wallet

Setelah `start-all.ps1` selesai, jalankan ini **sekali** agar blockchain berfungsi:

```powershell
# 1. Approve & commit chaincode
wsl -d Ubuntu -- bash -c "cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network && bash deploy-cc.sh"

# 2. Refresh wallet identity (wajib setiap network di-recreate)
wsl -d Ubuntu -- bash -c "cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend && node enroll-wallet.js"

# 3. Restart backend agar pakai wallet baru
wsl -d Ubuntu -- bash -c "cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend && pm2 restart chainrank-backend"
```

### Stop Semua

```powershell
.\stop-all.ps1
```

---

## Start Manual (Per Komponen)

### Database
```powershell
docker compose -f docker-compose.dev.yml up -d
```

### Fabric Network
```powershell
cd fabric-network
.\start-network-ccaas.ps1
```

### Backend (WSL + PM2)
```bash
# Di WSL Ubuntu terminal:
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
pm2 start server.js --name chainrank-backend
pm2 logs chainrank-backend
```

### Frontend
```powershell
cd frontend
npm run dev
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:3000 |
| Health Check | http://localhost:3000/health |
| PostgreSQL | localhost:5434 |

---

## Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@prima.ipb` | `admin123` | Superadmin |
| `budi.santoso@prima.ipb` | `admin123` | Dosen |
| `ani.wijaya@prima.ipb` | `admin123` | Dosen |
| `ahmad.dahlan@prima.ipb` | `admin123` | Pimpinan |
| `sdm@chainrank.test` | `admin123` | Admin SDM |

---

## Verifikasi Blockchain

### Cek via Database
```powershell
docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT id, tx_id_fabric, status FROM sk.kegiatan_dosen ORDER BY created_at DESC LIMIT 5;"
```

Jika `tx_id_fabric` terisi → blockchain recording berhasil.

### Cek via Chaincode CLI
```bash
# Di WSL
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network/fabric-samples/test-network
. scripts/envVar.sh && setGlobals 1
peer chaincode query -C skchannel -n chainrank -c '{"function":"KegiatanContract:GetAllKegiatan","Args":[]}'
```

### Test Direct (tanpa API)
```bash
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
node test-fabric-direct.js
```

---

## Troubleshooting

### Backend tidak konek ke Fabric
```bash
# Pastikan wallet sudah di-refresh setelah network restart:
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
node enroll-wallet.js
pm2 restart chainrank-backend
```

### Chaincode belum committed
```bash
# Jalankan deploy script:
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/fabric-network
bash deploy-cc.sh
```

### Database connection refused
```powershell
# Restart PostgreSQL container:
docker compose -f docker-compose.dev.yml up -d
```

---

## Arsitektur

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│  Frontend   │────▶│   Backend    │────▶│   PostgreSQL      │
│  (Vue.js)   │     │  (Express)   │     │   (port 5434)     │
│  port 5174  │     │  port 3000   │     └───────────────────┘
└─────────────┘     │              │
                    │   WSL/PM2    │────▶┌───────────────────┐
                    └──────────────┘     │ Hyperledger Fabric │
                                        │ peer0 (port 7051)  │
                                        │ orderer (port 7050)│
                                        └───────────────────┘
```

- **Channel:** skchannel
- **Chaincode:** chainrank (KegiatanContract)
- **Endorsement Policy:** OR('Org1MSP.peer','Org2MSP.peer')
- **State DB:** CouchDB
- **SDK:** fabric-network v2.2.20 (discovery disabled, static endorsement)
