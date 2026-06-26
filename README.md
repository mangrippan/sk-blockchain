# Prima — Sistem Usulan Kenaikan Pangkat Dosen Berbasis Blockchain

Sistem **hybrid** untuk pencatatan dan verifikasi kenaikan pangkat dosen:
**PostgreSQL** menyimpan data operasional (off-chain), **Hyperledger Fabric** menyimpan
hash & jejak audit yang immutable (on-chain).

| Komponen   | Teknologi                                  | Port               |
| ---------- | ------------------------------------------ | ------------------ |
| Frontend   | Vue 3 + Vite + Tailwind + Pinia            | `5173`             |
| Backend    | Node.js + Express + JWT                    | `3000`             |
| Database   | PostgreSQL 15 (Docker)                     | `5434`             |
| Blockchain | Hyperledger Fabric (test-network, CCAAS)   | peer `7051`        |
| State DB   | CouchDB (Org1 / Org2)                       | `5984` / `7984`    |

> Channel: **primachannel** · Chaincode: **prima**

---

## 1. Prasyarat (Prerequisites)

Aplikasi ini dikembangkan dan dijalankan di **Windows 11 + WSL2 + Docker Desktop**.
Backend sengaja dijalankan **di dalam WSL** agar bisa terhubung andal ke container
Fabric yang juga berjalan di Docker WSL (menghindari error `ECONNREFUSED 127.0.0.1:7051`).

Pastikan terpasang:

1. **Windows 10/11**
2. **WSL2** dengan distro **Ubuntu**
   ```powershell
   wsl --install -d Ubuntu
   ```
3. **Docker Desktop** — aktifkan **WSL2 integration** untuk distro Ubuntu
   (Settings → Resources → WSL Integration). Alokasikan minimal **6 GB RAM / 4 CPU**.
4. **Node.js 18+ & npm di Windows** (untuk menjalankan frontend) — <https://nodejs.org>
5. **Node.js 18+ di WSL Ubuntu** (untuk menjalankan backend) — lihat langkah setup di bawah
6. **Git**

---

## 2. Instalasi (Sekali Saja)

### 2.1 Clone repository
```powershell
git clone <repo-url>
cd UsulanKenaikanPangkatBlockchain
```

### 2.2 Install Node.js di WSL
```powershell
.\setup-nodejs-wsl.ps1
```
Script ini memasang Node.js 18 LTS di Ubuntu (dibutuhkan agar backend bisa konek ke Fabric).

### 2.3 Install dependency
```powershell
# Backend
cd backend;  npm install;  cd ..
# Frontend
cd frontend; npm install;  cd ..
# Fabric helper (enroll wallet, dll.)
cd fabric-network; npm install; cd ..
```
> Catatan: `.\run.ps1` akan otomatis menjalankan `npm install` jika folder
> `node_modules` belum ada, jadi langkah ini opsional.

### 2.4 Pasang binary Hyperledger Fabric (untuk fitur blockchain)
Folder `fabric-network/fabric-samples/` (berisi `bin/` dan `test-network/`) harus tersedia.
Jika belum ada, jalankan installer resmi Fabric di dalam WSL:
```powershell
wsl -d Ubuntu -- bash fabric-network/install-fabric.sh
```
> Lewati langkah ini jika ingin menjalankan **mode database-saja** (tanpa blockchain).
> Lihat bagian [Mode tanpa blockchain](#mode-tanpa-blockchain).

### 2.5 Konfigurasi environment variables

**Backend** — salin contoh lalu sesuaikan:
```powershell
Copy-Item backend\.env.example backend\.env
```
Edit `backend\.env`, pastikan nilai berikut **cocok dengan Docker PostgreSQL**:
```ini
DB_HOST=localhost
DB_PORT=5434
DB_NAME=prima_db
DB_USER=postgres
DB_PASSWORD=postgres123        # <-- WAJIB: password container Docker
DB_SCHEMA=sk

JWT_SECRET=<isi minimal 32 karakter acak>   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

FABRIC_ENABLED=true            # set 'false' untuk mode database-saja
FABRIC_CHANNEL=primachannel
FABRIC_CHAINCODE=prima
```

**Frontend** — `frontend\.env` sudah berisi nilai default yang benar
(`VITE_API_URL=/api/v1`, lewat proxy Vite, jadi tidak perlu diubah untuk dev lokal).

---

## 3. Menjalankan Aplikasi (Cara Cepat)

Satu perintah untuk menyalakan **semua** layanan (PostgreSQL → Fabric → Backend → Frontend):

```powershell
.\run.ps1
```

Pada run pertama, Fabric dibangun dari nol (~2–3 menit) — schema database & data awal
ter-load otomatis dari `docker-compose.dev.yml`, dan wallet Fabric (identitas admin)
di-enroll otomatis. Di akhir, script menjalankan **health check** dan melaporkan status
tiap komponen secara jujur (OK / FAIL).

**Flag yang tersedia:**

| Perintah                     | Fungsi                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| `.\run.ps1`                  | Start semua layanan                                          |
| `.\run.ps1 -Clean`           | Hard reset Fabric (wipe ledger + CouchDB), build ulang penuh |
| `.\run.ps1 -SkipFabric`      | Jalankan tanpa blockchain (DB + backend + frontend saja)     |
| `.\run.ps1 -SkipFrontend`    | Jalankan backend/API saja (tanpa frontend)                   |
| `.\run.ps1 -Verify`          | Hanya cek kesehatan layanan, tidak menyalakan apa pun        |

---

## 4. Mengakses Aplikasi

| Layanan          | URL                                              |
| ---------------- | ------------------------------------------------ |
| Frontend         | <http://localhost:5173>                          |
| Backend API      | <http://localhost:3000>                          |
| Health check     | <http://localhost:3000/health>                   |
| Swagger / Docs   | <http://localhost:3000/api-docs>                 |
| CouchDB (Org1)   | <http://localhost:5984/_utils> (`admin` / `adminpw`) |

### Akun bawaan (seed data)

| Role        | Email                      | Password   |
| ----------- | -------------------------- | ---------- |
| Superadmin  | `admin@prima.test`         | `admin123` |
| Admin SDM   | `sdm@prima.test`           | `admin123` |
| Dosen       | `budi.santoso@prima.test`  | `dosen123` |
| Dosen       | `ani.wijaya@prima.test`    | `dosen123` |
| Pimpinan    | `ahmad.dahlan@prima.test`  | `dosen123` |
| Auditor     | `auditor@prima.test`       | `dosen123` |

> Hanya untuk pengembangan lokal — jangan dipakai di produksi.

---

## 5. Menghentikan Aplikasi

```powershell
.\stop-all.ps1          # SOFT stop — data ledger + CouchDB DIPERTAHANKAN
.\stop-all.ps1 -Hard    # HARD stop — hapus volume, wipe ledger + CouchDB
```
Soft stop mematikan backend (proses WSL) & frontend, lalu mem-*pause* container Fabric.
Saat dinyalakan lagi dengan `.\run.ps1`, jaringan **di-resume** tanpa kehilangan data.

---

## 6. Menjalankan per Komponen (Manual / Alternatif)

Berguna saat development satu bagian saja.

**PostgreSQL** (Docker):
```powershell
docker compose -f docker-compose.dev.yml up -d
# DB prima_db di localhost:5434 (postgres / postgres123), schema & seed auto-load saat pertama kali
```

**Fabric network** (Windows PowerShell):
```powershell
.\fabric-network\start-network-ccaas.ps1   # build network + deploy chaincode + enroll wallet
```

**Backend** (di dalam WSL, agar konek ke Fabric):
```powershell
.\start-backend-wsl.ps1
```

**Frontend** (Windows):
```powershell
cd frontend
npm run dev      # http://localhost:5173
```

---

## <a name="mode-tanpa-blockchain"></a>7. Mode Tanpa Blockchain (Database-Saja)

Untuk demo cepat tanpa menyalakan Fabric:

1. Set `FABRIC_ENABLED=false` di `backend\.env`, **atau**
2. Jalankan `.\run.ps1 -SkipFabric`

Backend tetap melayani semua endpoint; fitur pencatatan/verifikasi on-chain
dinonaktifkan (fallback ke PostgreSQL saja).

---

## 8. Troubleshooting

**Backend tidak konek ke Fabric / "Blockchain tidak terhubung"**
- Pastikan peer aktif: `.\run.ps1 -Verify` (cek port `7051` & container chaincode).
- Backend **harus** berjalan di WSL (`.\start-backend-wsl.ps1`), bukan native Windows.
- Jika rusak total, build ulang bersih: `.\run.ps1 -Clean`.

**Wallet kosong / error identitas Fabric**
```powershell
cd fabric-network; node enrollUser.js; cd ..
# atau enroll identitas admin yang dipakai backend:
cd backend; node enroll-wallet.js; cd ..
```

**Gagal konek database**
```powershell
docker ps                       # pastikan prima_postgres_dev "Up (healthy)"
docker logs prima_postgres_dev
docker restart prima_postgres_dev
```
Pastikan juga `DB_PASSWORD=postgres123` di `backend\.env`.

**Port 3000 / 5173 sudah dipakai**
```powershell
.\stop-all.ps1                  # mematikan proses di port 3000 & 5173 (termasuk node WSL)
```

**Build chaincode gagal (broken pipe / docker.sock)**
- Restart Docker Desktop, naikkan resource (≥6 GB RAM / 4 CPU), lalu `.\run.ps1 -Clean`.

**Schema database berubah** (mis. menarik commit dengan migrasi baru)
- Cara termudah: `docker compose -f docker-compose.dev.yml down -v` lalu `up -d`
  (schema + seed + migrasi akan di-load ulang dari nol).

---

## 9. Pengujian

```powershell
# Unit test chaincode
cd chaincode; npm test; cd ..

# Unit/integration test backend
cd backend; npm test; cd ..
```

Pengujian API manual: import koleksi Postman
[`docs/Prima.postman_collection.json`](docs/Prima.postman_collection.json), atau lihat
[`docs/API_TESTING_GUIDE.md`](docs/API_TESTING_GUIDE.md).

---

## 10. Struktur Proyek

```
UsulanKenaikanPangkatBlockchain/
├── backend/             # API Express.js (jalan di WSL)
│   ├── routes/v1/       # Endpoint API (auth, kegiatan, usulan, dll.)
│   ├── middleware/      # Auth JWT + RBAC
│   ├── utils/           # fabricClient.js (SDK Fabric), helper
│   └── server.js        # Entry point
├── frontend/            # Aplikasi Vue 3 + Vite
│   └── src/{views,components,stores,router,api}
├── chaincode/           # Smart contract (chaincode "prima")
│   └── lib/             # kegiatanContract.js, dll.
├── fabric-network/      # Script jaringan Fabric (CCAAS) + fabric-samples
├── fabric-config/       # Connection profile + wallet identitas
├── database/            # schema-hybrid.sql, seed.sql, migrasi
├── docs/                # Panduan, laporan, koleksi Postman
├── docker-compose.dev.yml   # PostgreSQL (dev)
├── run.ps1              # ▶ Start semua layanan
└── stop-all.ps1         # ■ Stop semua layanan
```

---

**Catatan:** README ini fokus pada instalasi & menjalankan secara lokal di lingkungan
Windows + WSL2. Untuk dokumentasi fungsional & teknis lengkap, lihat folder
[`docs/`](docs/) (a.l. SKPL, DPPL, panduan testing, dan skenario demo).
</content>
</invoke>
