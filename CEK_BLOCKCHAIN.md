# 🔍 Cara Cek Data Blockchain

## 📊 **Metode 1: Cek via Database (Paling Mudah)**

Cek field `tx_id_fabric` di tabel kegiatan:

```powershell
docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT id, ref_kegiatan_id, tx_id_fabric, created_at FROM sk.kegiatan_dosen ORDER BY created_at DESC LIMIT 10;"
```

**Hasil yang diharapkan:**
- Jika `tx_id_fabric` **terisi** → ✅ Berhasil tercatat di blockchain
- Jika `tx_id_fabric` **NULL** → ❌ Tidak tercatat (backend error)

---

## 🧪 **Metode 2: Query Blockchain Langsung (Advanced)**

Query data langsung dari blockchain menggunakan chaincode:

### Cek semua kegiatan ID di blockchain:
```bash
cd fabric-network/fabric-samples/test-network
. scripts/envVar.sh
setGlobals 1
peer chaincode query -C skchannel -n chainrank -c '{"function":"GetAllKegiatanIds","Args":[]}'
```

### Cek detail kegiatan tertentu:
```bash
peer chaincode query -C skchannel -n chainrank -c '{"function":"ReadKegiatan","Args":["KEGIATAN_ID_DI_SINI"]}'
```

---

## 🎯 **Metode 3: Monitor Backend Logs (Real-time)**

Saat membuat kegiatan baru, perhatikan log backend WSL:

**✅ Blockchain berhasil:**
```
POST /api/v1/kegiatan
✅ Fabric submitTransaction(CreateKegiatan) successful: txId
```

**❌ Blockchain gagal:**
```
POST /api/v1/kegiatan
❌ Fabric submitTransaction(CreateKegiatan) failed: No valid responses from any peers
⚠️  Blockchain recording failed (continuing without)
```

---

## 🧪 **Test Sekarang: Buat Kegiatan Baru**

### **Langkah Test:**

1. **Login ke aplikasi**: http://localhost:5173

2. **Buat kegiatan baru** dengan data apapun

3. **Cek backend logs** di terminal WSL - lihat apakah ada error

4. **Query database** untuk cek tx_id_fabric:
   ```powershell
   docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT id, ref_kegiatan_id, tx_id_fabric, created_at FROM sk.kegiatan_dosen ORDER BY created_at DESC LIMIT 1;"
   ```

5. **Jika tx_id_fabric terisi** → 🎉 **Blockchain recording BERHASIL!**

---

## 📝 **Status Kegiatan yang Ada Sekarang**

Kegiatan yang dibuat **SEBELUM backend WSL running** (sebelum jam 11:45):
- ❌ **tx_id_fabric = NULL** 
- ❌ Tidak tercatat di blockchain
- ✅ Data tetap ada di database

**Mengapa?**
- Dibuat saat backend Windows yang **gagal connect ke blockchain**
- Backend fallback: data masuk database saja

---

## 🚀 **Solusi:**

**Buat kegiatan BARU sekarang** (setelah backend WSL running) untuk test blockchain recording yang sudah bekerja dengan baik.

Kegiatan lama yang tx_id_fabric-nya NULL **tidak bisa di-update** karena blockchain bersifat immutable. Tapi tidak masalah - aplikasi tetap berfungsi normal.

---

## 🔍 **Cara Cek Detail Transaksi Blockchain:**

Jika sudah ada tx_id_fabric, bisa cek detail transaksi:

```bash
cd fabric-network/fabric-samples/test-network
. scripts/envVar.sh  
setGlobals 1

# Ganti TX_ID dengan nilai dari database
peer chaincode query -C skchannel -n chainrank -c '{"function":"GetTransactionByID","Args":["TX_ID"]}'
```

---

## 📊 **Monitoring Blockchain Health:**

Cek apakah chaincode masih running:
```powershell
docker ps --filter "name=chainrank"
```

Expected output:
```
chainrank.org1.example.com   Up X minutes
chainrank.org2.example.com   Up X minutes
```
