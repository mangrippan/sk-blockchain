# ChainRank - Panduan Menjalankan Sistem

## Quick Start

```powershell
.\run.ps1
```

Satu perintah untuk menjalankan seluruh sistem:
- PostgreSQL Database
- Hyperledger Fabric Network + Chaincode
- Backend Server (Express.js)
- Frontend (Vue.js + Vite)

---

## Opsi Startup

| Perintah | Fungsi |
|----------|--------|
| `.\run.ps1` | Start semua service |
| `.\run.ps1 -Clean` | Bersihkan Fabric lalu start semua (gunakan jika ada error ledger) |
| `.\run.ps1 -SkipFabric` | Start tanpa blockchain (database-only mode) |
| `.\run.ps1 -SkipFrontend` | Start tanpa frontend (API only) |
| `.\run.ps1 -SkipFabric -SkipFrontend` | Backend + DB saja |

---

## URL Setelah Running

| Service | URL | Keterangan |
|---------|-----|------------|
| Backend API | http://localhost:3000 | REST API |
| Swagger UI | http://localhost:3000/api-docs | Dokumentasi API interaktif |
| Frontend | http://localhost:5173 | Web interface |
| CouchDB Org1 | http://localhost:5984/_utils | State database (admin/adminpw) |
| CouchDB Org2 | http://localhost:7984/_utils | State database (admin/adminpw) |

---

## Menghentikan Sistem

```powershell
.\stop-all.ps1
```

Atau manual:
```powershell
# Stop Fabric network
cd fabric-network
.\stop-network.ps1

# Stop database
docker stop chainrank_postgres_dev
```

---

## Troubleshooting

### Error: "ledger [skchannel] already exists"

```powershell
.\run.ps1 -Clean
```

Flag `-Clean` akan menghapus Docker volumes lama sebelum memulai network baru.

### Error: gRPC connection timeout saat backend startup

```
error: [ServiceEndpoint]: Failed to connect before the deadline on Endorser
```

**Ini normal.** Fabric SDK mencoba discovery ke berbagai endpoints. Selama muncul log `Connected to Fabric network as appUser`, koneksi berhasil.

### Port 3000 sudah terpakai

```powershell
# Cari proses yang pakai port 3000
netstat -ano | findstr :3000
# Kill prosesnya
taskkill /PID <PID> /F
```

### Backend gagal connect ke Fabric

1. Pastikan containers running:
   ```powershell
   docker ps --filter "name=peer0"
   ```
2. Jika tidak ada, restart:
   ```powershell
   .\run.ps1 -Clean
   ```

### Frontend tidak bisa akses API (CORS)

Pastikan backend sudah running di port 3000 sebelum frontend. Script `run.ps1` sudah mengatur urutan ini secara otomatis.

---

## Arsitektur Sistem

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────────────┐
│   Frontend      │────▶│   Backend        │────▶│   Hyperledger Fabric       │
│   Vue.js        │     │   Express.js     │     │   - peer0.org1             │
│   Port 5173     │     │   Port 3000      │     │   - peer0.org2             │
└─────────────────┘     └────────┬─────────┘     │   - orderer                │
                                 │               │   - chainrank (chaincode)   │
                        ┌────────▼─────────┐     └────────────────────────────┘
                        │   PostgreSQL     │
                        │   Port 5434      │
                        └──────────────────┘
```

---

## Script Reference

| Script | Lokasi | Fungsi |
|--------|--------|--------|
| `run.ps1` | Root | Start semua service (recommended) |
| `stop-all.ps1` | Root | Stop semua service |
| `start-network-ccaas.ps1` | `fabric-network/` | Start Fabric + deploy chaincode |
| `clean-network.ps1` | `fabric-network/` | Deep clean Fabric (hapus volumes) |
| `stop-network.ps1` | `fabric-network/` | Stop Fabric network |
| `enroll-wallet.js` | `backend/` | Enroll identitas ke wallet |
| `seed-users.js` | `backend/` | Seed user accounts |
| `seed-ref-data.js` | `backend/` | Seed reference data |

---

## Catatan

- Backend dan Frontend dibuka di **terminal terpisah** secara otomatis
- Script otomatis **skip** service yang sudah running
- Jika `node_modules` belum ada, dependencies akan di-install otomatis
- Fabric network membutuhkan **Docker Desktop** dengan WSL2 integration aktif
