# 🎬 Skenario Video Demo — Prima (Sistem Kenaikan Pangkat Dosen Berbasis Blockchain)

Tujuan: menampilkan **semua fitur utama** dalam satu alur cerita yang runtut, dengan
momen "show off" blockchain (immutability, hash integrity, tamper detection) di akhir.

Durasi target: **8–10 menit** (ada penanda ⏱️ per scene; bisa dipadatkan jadi ~4 menit
dengan melewati bagian bertanda *Opsional*).

---

## 0. Persiapan Sebelum Rekaman (jangan direkam)

### a. Pastikan semua service hidup
```powershell
.\start-all.ps1   # pilih mode WSL
```
Cek:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api/v1/health → pastikan `database: ok` dan `blockchain: ok`
- Swagger (opsional untuk diselipkan): http://localhost:3000/api-docs

> ⚠️ **Penting soal blockchain:** scene "Validate Blockchain" & "tamper detection" hanya
> tampil penuh jika **Fabric ENABLED dan terhubung** (`blockchain: ok` di health check).
> Jika jalan di fallback mode (`FABRIC_ENABLED=false`), TX ID tidak muncul — lewati
> Scene 7–8 atau jelaskan sebagai konsep.

### b. Akun demo (dari seed — README lama salah, pakai yang ini)

| Peran        | Email                      | Password   | Catatan |
|--------------|----------------------------|------------|---------|
| Superadmin   | `admin@prima.test`         | `admin123` | akses penuh |
| Admin SDM    | `sdm@prima.test`           | `admin123` | verifikasi + audit |
| **Dosen A**  | `ani.wijaya@prima.test`    | `dosen123` | Asisten Ahli → target **Lektor (200 KUM)** ⭐ tokoh utama |
| Dosen B      | `budi.santoso@prima.test`  | `dosen123` | Lektor → target Lektor Kepala (300 KUM) |
| Pimpinan     | `ahmad.dahlan@prima.test`  | `dosen123` | Dekan, verifikator |
| Auditor      | `auditor@prima.test`       | `dosen123` | hanya baca audit trail (hash sama dengan dosen123) |

### c. Siapkan "panggung KUM" untuk Dosen A (Ani Wijaya) — WAJIB
Dengan data seed, Ani baru punya **25 KUM** (1 jurnal SINTA 2), target Lektor = **200**.
Supaya alur usulan bisa didemokan, naikkan KUM-nya ke **±190** sebelum rekaman, lalu saat
demo kamu upload + verifikasi **1 kegiatan terakhir** yang mendorong tembus 200 — momen
progress bar berubah hijau dan tombol "Ajukan Usulan" terbuka. Ini visual paling kuat.

Cara cepat (pilih salah satu):
- **Lewat aplikasi (paling otentik):** login sebagai Ani, upload beberapa "Jurnal
  Internasional" (PENEL-01 @ 40 poin) → login admin → verifikasi semua. Ulangi sampai ±190.
- **Lewat SQL (lebih cepat):** tambahkan beberapa `kegiatan_dosen` status `verified`
  untuk `nip_nidn = '199601012021032001'` sampai total verified ±190 poin.

### d. Siapkan 2–3 file PDF dummy
- `jurnal_internasional.pdf` (untuk upload kegiatan saat demo)
- `sk_kenaikan_pangkat.pdf` (untuk terbitkan SK)
- (Opsional) satu file PDF "palsu" untuk demo tamper detection.

### e. Setting browser
Zoom 110–125%, mode incognito (biar bersih), siapkan 2 window/profile supaya bisa cepat
pindah antara akun **Dosen** dan **Admin** tanpa logout-login berulang.

---

## 1. Pembukaan & Login — RBAC ⏱️ ~40 dtk

**Tampilkan:** halaman Login.

**Narasi:**
> "Prima adalah sistem kenaikan pangkat dosen yang memadukan database PostgreSQL untuk
> kecepatan dengan Hyperledger Fabric sebagai blockchain untuk bukti yang tidak bisa diubah."

1. Login sebagai **Dosen A** (`ani.wijaya@prima.test`).
2. Tunjuk sidebar: dosen hanya melihat **Dashboard, Kegiatan, Usulan, Profil**.

**Show off RBAC:** sebutkan bahwa menu **Verifikasi** dan **Audit Trail** tidak muncul untuk
dosen — akan muncul nanti saat login admin/auditor. (Role-based access control.)

---

## 2. Dashboard & Tracking KUM ⏱️ ~40 dtk

**Tampilkan:** Dashboard Dosen A.

- Tunjuk 4 kartu statistik: **Total Kegiatan, Menunggu Verifikasi, Terverifikasi, Total Poin KUM**.
- Tunjuk daftar **Kegiatan Terbaru** dengan **status badge** (verified/unverified/rejected).

**Narasi:** "Setiap dosen memantau akumulasi angka kredit (KUM) secara real-time di sini."

---

## 3. Upload Kegiatan + Document Hashing ⏱️ ~70 dtk  ⭐ fitur inti

**Tampilkan:** menu **Kegiatan → Tambah Kegiatan**.

1. Pilih **Kategori KUM** → **Jenis Kegiatan** (mis. *Jurnal Internasional*, 40 poin).
   Tunjuk poin maksimal yang otomatis tampil.
2. Isi **Deskripsi**.
3. **Upload file** `jurnal_internasional.pdf` (komponen drag & drop, validasi tipe & ukuran).
4. Klik **Simpan**.

**Narasi (momen show off):**
> "Saat file diunggah, sistem menghitung **hash SHA-256** dari dokumen dan mencatatnya ke
> blockchain. Hash inilah sidik jari digital — kalau nanti ada 1 byte saja yang diubah,
> sistem langsung tahu dokumen sudah dipalsukan."

5. Buka **detail kegiatan** yang baru dibuat → tunjuk **file hash** dan **TX ID Fabric**
   (bukti tercatat di blockchain).

---

## 4. Verifikasi oleh Admin (Approve / Reject / Revisi) ⏱️ ~80 dtk

**Pindah ke window Admin** → login **Admin SDM** (`sdm@prima.test`). Tunjuk: sekarang menu
**Verifikasi** dan **Audit Trail** muncul (RBAC bekerja).

1. Buka **Verifikasi Kegiatan**. Tunjuk filter status (Belum Diverifikasi / Terverifikasi /
   Perlu Revisi / Ditolak).
2. Klik **Verifikasi** pada kegiatan Ani yang tadi diupload → modal menampilkan detail dosen,
   kategori, poin, dan **nama file bukti**.
3. **Show off jalur penolakan (singkat):** arahkan kursor ke **Tolak** → muncul field
   *Catatan wajib* + checkbox **"Izinkan dosen untuk revisi dan submit ulang"**.
   Jelaskan dua jalur: revisi vs tolak final. (Tidak perlu benar-benar menolak.)
4. Klik **Setujui** → toast "Kegiatan disetujui".

**Narasi:** "Persetujuan ini juga ditulis ke blockchain sebagai transaksi verifikasi
terpisah — jadi ada jejak siapa memverifikasi dan kapan."

5. **Momen kunci:** kembali login **Dosen A** → buka Dashboard. **Total Poin KUM kini ≥ 200**.
   (Inilah kegiatan yang mendorong tembus ambang batas — lihat Persiapan 0c.)

---

## 5. Ajukan Usulan Kenaikan Pangkat + Snapshot Hash ⏱️ ~80 dtk  ⭐

**Tampilkan (sebagai Dosen A):** menu **Usulan → Ajukan Usulan**.

1. Tunjuk kartu **Jabatan Saat Ini: Asisten Ahli → Jabatan Tujuan: Lektor** (otomatis naik 1 tingkat).
2. Tunjuk **Progress Bar KUM**: sebelumnya merah ("kurang X poin"), kini **hijau ✓ memenuhi syarat**.
   Tombol **Ajukan Usulan** yang tadinya terkunci kini aktif.
3. Isi catatan → klik **Ajukan Usulan**.

**Narasi (show off):**
> "Saat usulan diajukan, sistem membuat **snapshot** dari seluruh kegiatan yang dihitung,
> lalu menghitung **snapshot hash**. Daftar kegiatan ini terkunci — tidak bisa diubah-ubah
> setelah pengajuan."

4. Buka **detail usulan**. Tunjuk:
   - Tabel **Kegiatan yang Diajukan** lengkap dengan **TX Create** & **TX Verify** per kegiatan.
   - Kotak biru **Snapshot Hash**.

---

## 6. Proses Usulan & Terbitkan SK ⏱️ ~70 dtk

**Pindah ke Admin** (`sdm@prima.test`) → buka detail usulan Ani (lewat menu Usulan atau Audit Trail).

1. Bagian **Aksi Admin** → klik **Proses Usulan** (status: pending → diproses).
2. Muncul panel **Terbitkan SK**:
   - Isi **Nomor SK**, **Tanggal SK**.
   - Upload **Dokumen SK (PDF)** `sk_kenaikan_pangkat.pdf`.
   - Klik **Terbitkan SK** (status: diproses → **sk_issued**).

**Narasi:** "SK final juga di-hash dan dicatat di blockchain. Jadi dokumen resmi kenaikan
pangkat punya bukti keaslian yang permanen."

---

## 7. Audit Trail Blockchain ⏱️ ~70 dtk  ⭐ show off utama

**Tetap sebagai Admin** (atau login **Auditor** `auditor@prima.test` untuk menonjolkan peran
auditor read-only) → buka **detail usulan** yang sudah `sk_issued`, scroll ke **Audit Trail Lengkap**.

Tunjuk:
- Timeline lengkap dari awal sampai SK terbit, dengan **badge sumber**:
  **⛓️ Blockchain**, **📝 Kegiatan**, **📋 Usulan**.
- Setiap entri blockchain menampilkan **TX ID** dan timestamp.
- Tombol toggle urutan (terlama ↔ terbaru).

**Bonus — halaman Audit Trail global:** buka menu **Audit Trail**, cari dengan **email/NIP dosen**
→ tampilkan daftar usulan + ringkasan TX, lalu klik untuk masuk ke detail.

**Narasi:** "Untuk keperluan audit dan compliance, seluruh riwayat bisa ditelusuri dari
blockchain — immutable, tidak bisa dihapus atau dimanipulasi."

---

## 8. Blockchain Integrity & Tamper Detection ⏱️ ~80 dtk  ⭐⭐ KLIMAKS

> Hanya jika Fabric aktif. Inilah pembeda utama sistem blockchain — siapkan sebagai penutup.

**Di detail usulan `sk_issued`:**
1. Tunjuk panel **Blockchain Integrity Status**: ✅ **SK Document Hash: Valid** dan
   ✅ **Snapshot Hash: Valid**.
2. Klik tombol **🔍 Validate Blockchain** → tampilkan hasil validasi (checks centang hijau:
   hash cocok, data konsisten antara database & blockchain).

**Demo tamper (paling impresif — opsional tapi sangat direkomendasikan):**
> "Sekarang bayangkan ada yang mencoba mengubah dokumen SK secara diam-diam di server…"

3. Di luar aplikasi, ganti file SK di folder `backend/uploads/` dengan PDF berbeda
   (nama sama), **tanpa** mengubah catatan di blockchain.
4. Refresh halaman → klik **Validate Blockchain** lagi → muncul **⚠️ MISMATCH — Possible
   Tampering!** (merah).

**Narasi penutup:**
> "Karena hash asli sudah terkunci di blockchain, manipulasi sekecil apa pun langsung
> ketahuan. Inilah inti nilai sistem ini: data akademik yang bisa dipercaya dan terbukti
> keasliannya."

---

## 9. Penutup ⏱️ ~30 dtk

Ringkas alur yang baru ditampilkan:
**Upload → Hash → Verifikasi → Usulan (snapshot) → Proses → SK → Audit Trail → Validasi Integritas.**

Sebutkan arsitektur hybrid: **PostgreSQL (cepat) + Hyperledger Fabric (immutable) + CouchDB
(rich query)**, 2 peer (Org1 & Org2), channel `primachannel`, chaincode `prima`.

(Opsional) Tutup dengan sekilas **Swagger** (`/api-docs`) untuk menunjukkan API terdokumentasi.

---

## ✅ Checklist Fitur yang Tercakup

- [x] Autentikasi JWT & **RBAC** (menu beda per role) — Scene 1, 4
- [x] **Dashboard** + statistik + **Progress Bar KUM** real-time — Scene 2, 5
- [x] **Upload kegiatan** + **SHA-256 document hashing** + TX Fabric — Scene 3
- [x] **Verifikasi** approve / reject / **revisi** — Scene 4
- [x] **Status badge** & filter — Scene 2, 4
- [x] **Usulan** kenaikan pangkat + auto jabatan tujuan + **snapshot hash** — Scene 5
- [x] **Proses usulan** & **penerbitan SK** (upload PDF) — Scene 6
- [x] **Audit Trail** blockchain (multi-source timeline, TX ID) — Scene 7
- [x] Peran **Auditor** read-only — Scene 7
- [x] **Blockchain integrity** + **Validate Blockchain** + **tamper detection** — Scene 8
- [x] Arsitektur hybrid (PostgreSQL + Fabric + CouchDB) — Scene 9

---

## 🎙️ Tips Rekaman

- Gunakan 2 profil browser berdampingan (Dosen | Admin) supaya transisi mulus.
- Zoom hash/TX ID saat menyebut "hash" / "blockchain" agar penonton lihat detailnya.
- Simpan **demo tamper** sebagai klimaks penutup — itu momen paling "wow".
- Jika Fabric tidak stabil saat rekaman, rekam Scene 1–6 dulu; Scene 7–8 bisa diambil
  terpisah saat blockchain sudah `ok`.
</content>
</invoke>
