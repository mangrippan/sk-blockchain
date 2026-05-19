# 🚀 ChainRank - Panduan Startup Cepat

## ⚡ Menjalankan Semua Aplikasi

### Metode 1: Otomatis (Recommended)

Jalankan semua komponen dengan satu perintah:

```powershell
.\start-all.ps1
```

Script ini akan:
1. ✅ Start PostgreSQL Database (Docker)
2. ✅ Start Hyperledger Fabric Network
3. ✅ Start Backend Server (terminal baru)
4. ✅ Start Frontend Vue.js (terminal baru)

### Metode 2: Manual (Step by Step)

#### 1. Start Database
```powershell
docker compose -f docker-compose.dev.yml up -d
```

#### 2. Start Fabric Network
```powershell
cd fabric-network
.\start-network.ps1
cd ..
```

#### 3. Start Backend (Terminal Baru)
```powershell
cd backend
npm start
```

#### 4. Start Frontend (Terminal Baru)
```powershell
cd frontend
npm run dev
```

---

## 🛑 Menghentikan Semua Aplikasi

### Metode Otomatis
```powershell
.\stop-all.ps1
```

### Metode Manual
1. Tekan `Ctrl+C` di terminal Backend dan Frontend
2. Stop Fabric Network:
   ```powershell
   cd fabric-network
   .\stop-network.ps1
   cd ..
   ```
3. Stop Database:
   ```powershell
   docker compose -f docker-compose.dev.yml down
   ```

---

## 🌐 URL Akses

Setelah semua running:

| Service | URL | Deskripsi |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Aplikasi web utama |
| **Backend API** | http://localhost:3000 | REST API endpoint |
| **Swagger Docs** | http://localhost:3000/api-docs | API documentation |
| **Database** | localhost:5432 | PostgreSQL |

---

## 🔑 Login Credentials

### Admin
- **Email:** `admin@chainrank.test`
- **Password:** `password123`

### SDM (Kepegawaian)
- **Email:** `sdm@chainrank.test`
- **Password:** `password123`

### Dosen
- **Email:** `budi.santoso@chainrank.test`
- **Password:** `password123`

---

## ✅ Cara Verifikasi Semua Berjalan

### 1. Cek Database
```powershell
docker ps --filter "name=chainrank_postgres_dev"
```
Output harus menunjukkan container running.

### 2. Cek Fabric Network
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```
Harus ada containers:
- `peer0.org1.example.com`
- `peer0.org2.example.com`
- `orderer.example.com`
- `peer0org1_chainrank_ccaas`
- `peer0org2_chainrank_ccaas`

### 3. Cek Backend
Buka browser: http://localhost:3000/health

Response harus:
```json
{
  "status": "OK",
  "timestamp": "2024-..."
}
```

### 4. Cek Frontend
Buka browser: http://localhost:5173

Harus muncul halaman login ChainRank.

---

## 🔧 Troubleshooting

### ⚠️ Chaincode Deployment Error (Docker Build Broken Pipe)
Jika Fabric network error dengan pesan:
```
Error: chaincode install failed with status: 500 - failed to invoke backing 
implementation of 'InstallChaincode': could not build chaincode: docker build 
failed: docker image build failed: write unix @->/var/run/docker.sock: write: 
broken pipe
```

**Quick Fix:**
1. Restart Docker Desktop
2. Increase Docker resources (Settings → Resources → 6GB RAM, 4 CPUs)
3. Jalankan `.\restart-fabric.ps1`

**Detailed Troubleshooting:**
📖 Lihat [FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md](docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md) untuk:
- Root cause analysis
- Solusi step-by-step
- Alternative deployment methods (CCAAS)
- Development workarounds

### Database Tidak Start
```powershell
# Reset database
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Fabric Network Error (Umum)
```powershell
cd fabric-network
.\stop-network.ps1

# Hapus semua container dan volume
docker rm -f $(docker ps -aq)
docker volume prune -f

# Start ulang
.\start-network.ps1
```

### Backend Error "Cannot connect to database"
1. Pastikan database sudah running
2. Check `.env` file di folder `backend`
3. Pastikan password database sesuai

### Frontend Error "EADDRINUSE"
Port 5173 sudah digunakan. Kill proses:
```powershell
# Cari proses di port 5173
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess

# Kill proses (ganti <PID> dengan nomor yang muncul)
Stop-Process -Id <PID> -Force
```

### Port Backend (3000) Sudah Digunakan
```powershell
# Cari proses di port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill proses
Stop-Process -Id <PID> -Force
```

---

## 🗄️ Reset Database (Hapus Semua Data)

```powershell
# Stop dan hapus database beserta data
docker compose -f docker-compose.dev.yml down -v

# Start database baru (data fresh dari seed.sql)
docker compose -f docker-compose.dev.yml up -d
```

---

## 📦 Instalasi Dependencies Pertama Kali

Jika baru clone repository:

```powershell
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# Fabric Network
cd fabric-network
npm install
cd ..
```

Script `start-all.ps1` akan otomatis install jika belum ada `node_modules`.

---

## 🔄 Update Code dan Restart

Setelah edit code:

### Backend
Tekan `Ctrl+C` di terminal backend, lalu:
```powershell
npm start
```

### Frontend (Hot Reload Otomatis)
Vite akan otomatis reload, tidak perlu restart.

### Chaincode (Blockchain)
Jika edit chaincode di `chaincode/lib/kegiatanContract.js`:
```powershell
cd fabric-network
.\stop-network.ps1
.\start-network.ps1
```

---

## 📊 Monitoring Logs

### Database Logs
```powershell
docker logs -f chainrank_postgres_dev
```

### Fabric Peer Logs
```powershell
docker logs -f peer0.org1.example.com
```

### Chaincode Logs
```powershell
docker logs -f peer0org1_chainrank_ccaas
```

---

## 🎯 Quick Commands

```powershell
# Start semua
.\start-all.ps1

# Stop semua
.\stop-all.ps1

# Cek status containers
docker ps

# Cek semua containers (termasuk yang mati)
docker ps -a

# Hapus semua containers (HATI-HATI!)
docker rm -f $(docker ps -aq)

# Lihat logs backend real-time
# (Di terminal backend yang sudah dibuka oleh start-all.ps1)
```

---

## 📚 Dokumentasi Lengkap

- [README.md](README.md) - Overview project
- [DATABASE_QUICKSTART.md](DATABASE_QUICKSTART.md) - Database management
- [FABRIC_QUICKSTART.md](FABRIC_QUICKSTART.md) - Fabric network management
- [backend/QUICKSTART.md](backend/QUICKSTART.md) - Backend API reference

---

## 🎓 Development Workflow

1. **Start aplikasi:** `.\start-all.ps1`
2. **Edit code** di VS Code
3. **Test API** di Swagger: http://localhost:3000/api-docs
4. **Test UI** di browser: http://localhost:5173
5. **Commit changes** ke Git
6. **Stop aplikasi:** `.\stop-all.ps1`

---

**Selamat coding! 🚀**
