# ⚡ Quick Start Guide

## 🎯 Start Aplikasi Lengkap

### **1. Start Database & Fabric Network**
```powershell
.\start-all.ps1
```

Tunggu sampai selesai (~2 menit). Akan otomatis:
- ✅ Start PostgreSQL (port 5434)
- ✅ Start Fabric Network
- ✅ Deploy Chaincode

---

### **2. Start Backend (Manual di WSL)**

**Opsi A: Via VS Code Terminal**
1. Buka WSL terminal: `Terminal > New Terminal` > Pilih **Ubuntu (WSL)**
2. Jalankan:
```bash
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
npm start
```

**Opsi B: Via Script**
```powershell
.\open-backend-wsl.ps1
```
Lalu di WSL terminal yang terbuka, ketik:
```bash
npm start
```

**Expected Output:**
```
✅ Connected to PostgreSQL database
✅ Connected to Fabric network as admin
🚀 ChainRank Backend Server
📡 Running on: http://localhost:3000
```

---

### **3. Start Frontend**
```powershell
cd frontend
npm run dev
```

Frontend akan running di: **http://localhost:5173**

---

## 🧪 **Test Blockchain Recording**

1. Buka aplikasi: http://localhost:5173
2. Login
3. Buat kegiatan baru
4. Cek database:
```powershell
docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT id, tx_id_fabric, created_at FROM sk.kegiatan_dosen ORDER BY created_at DESC LIMIT 1;"
```

Jika `tx_id_fabric` **terisi** → ✅ **Blockchain recording BERHASIL!**

---

## 🛑 **Stop Semua Services**

```powershell
.\stop-all.ps1
```

Lalu **Ctrl+C** di terminal backend & frontend.

---

## 📚 **Dokumentasi Lengkap**

- [START_BACKEND_MANUAL.md](START_BACKEND_MANUAL.md) - Panduan start backend WSL
- [CEK_BLOCKCHAIN.md](CEK_BLOCKCHAIN.md) - Cara cek data blockchain
- [STARTUP_GUIDE.md](STARTUP_GUIDE.md) - Panduan startup lengkap

---

## 🔧 **Troubleshooting**

### Backend tidak connect ke blockchain:
- Pastikan backend running di **WSL terminal** (bukan PowerShell)
- Cek `.env` sudah ada `FABRIC_CONNECTION_PROFILE=../fabric-config/connection-org1-wsl.json`

### Port sudah dipakai:
```powershell
# Cek port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Cek port 5173
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
```

### Fabric network error:
```powershell
# Restart Fabric network
cd fabric-network
.\stop-network.ps1
.\start-network-ccaas.ps1
```

---

## 🎯 **Service Status Checklist**

Sebelum test, pastikan semua running:

- [ ] Database (port 5434): `docker ps | grep postgres`
- [ ] Fabric Network: `docker ps | grep -E "peer|orderer"`
- [ ] Chaincode: `docker ps | grep chainrank`
- [ ] Backend (port 3000): `curl http://localhost:3000/health`
- [ ] Frontend (port 5173): Browser http://localhost:5173

---

**Happy Coding!** 🚀
