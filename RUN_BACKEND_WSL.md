# 🚀 Cara Menjalankan Backend di WSL (Blockchain Aktif)

## Langkah-langkah:

### 1. Buka WSL Terminal Baru di VS Code
- Klik menu **Terminal** > **New Terminal**
- Di dropdown terminal (kanan atas), pilih **Ubuntu (WSL)**
- Atau tekan **Ctrl + Shift + `** lalu pilih WSL

### 2. Navigate ke Backend Directory
```bash
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
```

### 3. Jalankan Backend
```bash
npm start
```

### 4. Verifikasi Backend Running
Di terminal PowerShell lain, test:
```powershell
Invoke-RestMethod http://localhost:3000/health
```

## ✅ Hasil Expected:
- Backend running di port 3000
- Database: Connected ✅  
- Fabric Network: Connected ✅
- **Blockchain recording: AKTIF** 🎉

## 📝 Catatan:
- **Jangan tutup WSL terminal** selama backend harus running
- Backend di WSL bisa connect ke Fabric peer tanpa TLS error
- Kegiatan yang dibuat akan otomatis tercatat ke blockchain
- Field `tx_id_fabric` akan terisi dengan transaction ID

## 🛑 Cara Stop Backend:
Tekan **Ctrl + C** di WSL terminal

---

## Troubleshooting:
Jika error "command not found: npm", install Node.js di WSL:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```
