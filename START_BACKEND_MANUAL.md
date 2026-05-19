# 🚀 Panduan Start Backend di WSL (Manual)

## 📋 Langkah-langkah:

### **1. Buka WSL Terminal di VS Code**

Ada 2 cara:

**Cara A: Via Terminal Menu**
1. Klik menu **Terminal** > **New Terminal** (atau tekan `Ctrl + Shift + `` ` ``)
2. Di dropdown terminal (pojok kanan atas), klik **panah kebawah** ▼
3. Pilih **"Ubuntu (WSL)"** atau **"Ubuntu"**

**Cara B: Via Command Palette**
1. Tekan `Ctrl + Shift + P`
2. Ketik: `Terminal: Select Default Profile`
3. Pilih **Ubuntu (WSL)**
4. Buka terminal baru dengan `Ctrl + Shift + `` ` ``

---

### **2. Jalankan Backend**

Di WSL terminal, copy-paste command ini:

```bash
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
bash start-wsl.sh
```

**ATAU** langsung dengan npm:

```bash
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
npm start
```

---

### **3. Verifikasi Backend Running**

Backend akan menampilkan:
```
==================================================
🚀 ChainRank Backend Server
📡 Running on: http://localhost:3000
🌍 Environment: development
🗄️  Database: localhost:5434/chainrank_db
==================================================
```

**Test di browser atau PowerShell:**
```powershell
# Di PowerShell terminal lain (jangan tutup WSL terminal!)
Invoke-RestMethod http://localhost:3000/health
```

---

## ✅ **Expected Output:**

```
✅ Connected to PostgreSQL database
✅ Schema "sk" is accessible
✅ Connected to Fabric network as admin
🚀 ChainRank Backend Server
📡 Running on: http://localhost:3000
```

---

## 🛑 **Cara Stop Backend:**

Tekan **Ctrl + C** di WSL terminal

---

## 📊 **Status Services:**

| Service | Status | URL/Port |
|---------|--------|----------|
| **Fabric Network** | ✅ Running | Peer: 7051, 9051 |
| **Database** | ✅ Running | Port 5434 |
| **Frontend** | ✅ Running | http://localhost:5173 |
| **Backend (WSL)** | 🔵 **Anda Start Manual** | http://localhost:3000 |

---

## 🎯 **Test Blockchain Recording:**

Setelah backend running:

1. **Buka aplikasi:** http://localhost:5173
2. **Login** dengan user Anda
3. **Buat kegiatan baru**
4. **Cek tx_id_fabric** di database:

```powershell
docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT id, ref_kegiatan_id, tx_id_fabric, created_at FROM sk.kegiatan_dosen ORDER BY created_at DESC LIMIT 1;"
```

Jika `tx_id_fabric` **terisi** → 🎉 **BLOCKCHAIN RECORDING BERHASIL!**

---

## 🔍 **Troubleshooting:**

### Backend tidak bisa connect ke Fabric:
```bash
# Cek Fabric network running
docker ps | grep -E "peer|orderer|chainrank"
```

### Port 3000 sudah dipakai:
```bash
# Cari process yang pakai port 3000
lsof -i :3000
# Atau di PowerShell:
Get-NetTCPConnection -LocalPort 3000
```

### Database tidak connect:
```bash
# Cek PostgreSQL running
docker ps | grep postgres
```

---

## 💡 **Tips:**

1. **Jangan tutup WSL terminal** selama backend harus running
2. **Split terminal** (klik icon split) jika perlu terminal lain
3. **Monitor logs** di WSL terminal untuk debug
4. **Backend auto-reload** jika ada perubahan code (via nodemon)

---

## 📝 **Quick Reference:**

**Start Backend:**
```bash
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
npm start
```

**Check Health:**
```bash
curl http://localhost:3000/health
```

**Stop Backend:**
```
Ctrl + C
```

**Restart Backend:**
```bash
npm start
```

---

**Semua ready!** Tinggal Anda buka WSL terminal dan run `npm start` 🚀
