# 📖 User Manual - Sistem Usulan Kenaikan Pangkat Blockchain

> **Panduan Lengkap Penggunaan Sistem untuk Semua Pengguna**  
> Version 2.0 | Last Updated: May 30, 2026

---

## 📑 Daftar Isi

1. [Pengenalan Sistem](#pengenalan-sistem)
2. [Login & Akses Sistem](#login--akses-sistem)
3. [Panduan Dosen](#panduan-dosen)
4. [Panduan Admin SDM](#panduan-admin-sdm)
5. [Panduan Pimpinan](#panduan-pimpinan)
6. [FAQ (Pertanyaan Umum)](#faq)
7. [Troubleshooting](#troubleshooting)
8. [Kontak Support](#kontak-support)

---

## 🎯 Pengenalan Sistem

### Apa itu Sistem Usulan Kenaikan Pangkat Blockchain?

Sistem ini adalah platform digital untuk mengelola proses kenaikan pangkat dosen dengan teknologi **blockchain** yang menjamin:
- ✅ **Transparansi**: Semua proses tercatat dan dapat dilacak
- ✅ **Keamanan**: Data tidak dapat dimanipulasi setelah diverifikasi
- ✅ **Efisiensi**: Proses digital yang lebih cepat
- ✅ **Akuntabilitas**: Audit trail lengkap

### Siapa yang Menggunakan Sistem Ini?

| Role | Deskripsi |
|------|-----------|
| **Dosen** | Mengajukan kegiatan KUM dan usulan kenaikan pangkat |
| **Admin SDM** | Memverifikasi kegiatan dan memproses usulan |
| **Pimpinan** | Menyetujui usulan dan menerbitkan SK |
| **Auditor** | Melihat audit trail dan laporan (read-only) |

---

## 🔐 Login & Akses Sistem

### Langkah 1: Membuka Sistem

1. Buka browser (Chrome, Firefox, atau Edge)
2. Akses URL: `http://localhost:5173` (atau URL yang diberikan admin)
3. Anda akan melihat halaman login

### Langkah 2: Login

```
📧 Email/Username: [Email institusi Anda]
🔑 Password: [Password yang diberikan]
```

**Contoh:**
```
Email: dosen@example.com
Password: ********
```

4. Klik tombol **"Login"**
5. Jika berhasil, Anda akan masuk ke Dashboard sesuai role Anda

### Langkah 3: Ganti Password (Pertama Kali)

**Sangat direkomendasikan untuk mengganti password default!**

1. Klik **icon profil** di pojok kanan atas
2. Pilih **"Profil"**
3. Klik **"Ubah Password"**
4. Masukkan:
   - Password lama
   - Password baru
   - Konfirmasi password baru
5. Klik **"Simpan"**

---

## 👨‍🏫 Panduan Dosen

### A. Dashboard Dosen

Setelah login, Anda akan melihat:
- **Total Kegiatan**: Jumlah kegiatan yang sudah diajukan
- **Menunggu Verifikasi**: Kegiatan yang belum diverifikasi
- **Terverifikasi**: Kegiatan yang sudah disetujui
- **Total Poin KUM**: Akumulasi poin dari kegiatan terverifikasi
- **Kegiatan Terbaru**: 5 kegiatan terakhir Anda

---

### B. Menambah Kegiatan KUM

#### Langkah-langkah:

**1. Buka Menu Kegiatan**
- Klik **"Kegiatan"** di sidebar kiri
- Klik tombol **"+ Tambah Kegiatan"**

**2. Isi Form Kegiatan**

| Field | Deskripsi | Contoh |
|-------|-----------|--------|
| **Kategori** | Pilih kategori kegiatan | Pendidikan & Pengajaran |
| **Jenis Kegiatan** | Pilih jenis spesifik | Melaksanakan perkuliahan |
| **Deskripsi** | Penjelasan singkat (opsional) | "Mengajar Pemrograman Web semester genap" |
| **Dokumen Bukti** | Upload file (PDF/JPG/PNG, max 5MB) | sertifikat_mengajar.pdf |

**3. Upload Dokumen**
- Klik **"Pilih File"** atau drag & drop
- File yang diperbolehkan: **PDF, JPG, JPEG, PNG**
- Ukuran maksimal: **5 MB**

**4. Submit**
- Klik tombol **"Submit Kegiatan"**
- Tunggu konfirmasi sukses
- Kegiatan akan masuk status **"Belum Diverifikasi"**

#### ⚠️ Catatan Penting:
- Poin KUM **otomatis** diisi sesuai jenis kegiatan
- Dokumen bukti **wajib** diunggah
- Setelah submit, kegiatan **tidak bisa diedit**
- Jika ditolak, Anda harus **buat kegiatan baru** (tidak bisa revisi)

---

### C. Melihat Status Kegiatan

**1. Filter Status**
Gunakan dropdown filter untuk melihat kegiatan berdasarkan status:
- **Belum Diverifikasi** (kuning): Menunggu review admin
- **Terverifikasi** (hijau): Sudah disetujui, bisa dipakai untuk usulan
- **Ditolak** (merah): Tidak memenuhi syarat

**2. Detail Kegiatan**
Klik pada baris kegiatan untuk melihat:
- Informasi lengkap kegiatan
- Dokumen bukti yang diupload
- Hash SHA-256 dokumen (untuk verifikasi)
- Blockchain TX ID (jika sudah terverifikasi)
- Audit trail (riwayat perubahan)

**3. Download Dokumen**
- Buka detail kegiatan
- Klik tombol **"Download"** pada bagian dokumen bukti

---

### D. Membuat Usulan Kenaikan Pangkat

#### Prasyarat:
✅ Memiliki kegiatan **terverifikasi**  
✅ Total KUM mencukupi untuk jabatan tujuan  
✅ Kegiatan belum digunakan di usulan lain  

#### Langkah-langkah:

**1. Buka Menu Usulan**
- Klik **"Usulan"** di sidebar
- Klik tombol **"+ Buat Usulan"**

**2. Pilih Jabatan Tujuan**
Sistem akan menampilkan:
- Jabatan Anda saat ini
- Opsi jabatan yang bisa diajukan (berdasarkan hierarki)
- Minimal KUM yang dibutuhkan

**Contoh:**
```
Jabatan Saat Ini: Asisten Ahli
Jabatan Tujuan: Lektor
Minimal KUM: 150 poin
KUM Anda: 175 poin ✅
```

**3. Isi Periode Penilaian**
- **Periode Mulai**: Tanggal awal periode (opsional)
- **Periode Selesai**: Tanggal akhir periode (opsional)

**4. Review Kegiatan**
Sistem akan menampilkan:
- **Semua kegiatan terverifikasi** yang belum dipakai
- Total poin KUM
- Status memenuhi syarat atau tidak

**5. Submit Usulan**
- Pastikan total KUM mencukupi
- Klik tombol **"Submit Usulan"**
- Usulan akan masuk status **"Pending"** (menunggu review admin)

#### ⚠️ Catatan Penting:
- Setelah usulan disubmit, **kegiatan akan terkunci**
- Kegiatan yang sudah dipakai **tidak bisa dipakai lagi**
- Jika usulan ditolak, kegiatan akan **di-unlock** dan bisa dipakai lagi
- Usulan yang sudah di-submit **tidak bisa dibatalkan** oleh dosen

---

### E. Tracking Status Usulan

**Status Usulan:**

| Status | Icon | Deskripsi | Tindakan Dosen |
|--------|------|-----------|----------------|
| **Pending** | 🟡 | Menunggu review Admin SDM | Tunggu |
| **Diproses** | 🔵 | Sedang diproses Admin | Tunggu |
| **Ditolak** | 🔴 | Tidak memenuhi syarat | Buat usulan baru |
| **SK Terbit** | 🟢 | SK sudah diterbitkan | Selesai ✅ |

**Melihat Detail Usulan:**
1. Klik **"Usulan"** di sidebar
2. Klik pada usulan untuk melihat detail:
   - Informasi usulan
   - Kegiatan yang diajukan (snapshot)
   - Catatan penolakan (jika ditolak)
   - Dokumen SK (jika sudah terbit)
   - Blockchain TX ID (jika sudah terbit)

---

### F. Download Dokumen SK

**Setelah SK Terbit:**
1. Buka detail usulan dengan status **"SK Terbit"**
2. Scroll ke bagian **"Dokumen SK"**
3. Klik tombol **"Download SK"**
4. File SK akan terunduh dalam format PDF

**Verifikasi Keaslian SK:**
- SK memiliki **Hash SHA-256** yang tercatat di blockchain
- Bisa diverifikasi keasliannya melalui sistem
- Blockchain TX ID membuktikan SK tidak bisa diubah

---

## 👔 Panduan Admin SDM

### A. Dashboard Admin SDM

Dashboard menampilkan:
- **Total Kegiatan** dari semua dosen
- **Menunggu Verifikasi**: Kegiatan yang perlu direview
- **Usulan Pending**: Usulan yang perlu diproses
- **Statistik Approval Rate**

---

### B. Verifikasi Kegiatan

#### Langkah-langkah:

**1. Buka Menu Verifikasi**
- Klik **"Verifikasi"** di sidebar
- Akan muncul tab **"Kegiatan"** dan **"Usulan"**

**2. Filter Kegiatan Belum Diverifikasi**
- Status: **"Belum Diverifikasi"**
- Lihat daftar kegiatan yang perlu direview

**3. Review Kegiatan**
Klik pada kegiatan untuk melihat:
- Detail kegiatan
- Dokumen bukti
- Data dosen

**4. Verifikasi Dokumen**
- Klik tombol **"Preview"** untuk melihat dokumen
- Pastikan dokumen sesuai dengan:
  - Jenis kegiatan yang diajukan
  - Kriteria poin KUM
  - Keaslian dokumen

**5. Keputusan Verifikasi**

**JIKA DISETUJUI:**
- Klik tombol **"Verify"** (hijau)
- Kegiatan akan berstatus **"Terverifikasi"**
- **Otomatis tercatat di Blockchain** 🔗
- Dosen bisa menggunakan untuk usulan

**JIKA DITOLAK:**
- Klik tombol **"Reject"** (merah)
- Masukkan **alasan penolakan** (wajib)
- Kegiatan akan berstatus **"Ditolak"**
- **TIDAK** tercatat di blockchain
- Dosen harus mengajukan kegiatan baru

#### ⚠️ Catatan Penting:
- Keputusan verifikasi **tidak bisa dibatalkan**
- Kegiatan yang sudah verified tercatat **permanent di blockchain**
- Berikan alasan penolakan yang jelas agar dosen mengerti

---

### C. Memproses Usulan

#### Langkah-langkah:

**1. Buka Tab Usulan di Menu Verifikasi**
- Klik **"Verifikasi"** → Tab **"Usulan"**
- Filter status: **"Pending"**

**2. Review Usulan**
Klik pada usulan untuk melihat:
- Data dosen
- Jabatan asal & tujuan
- Total KUM
- Daftar kegiatan yang diajukan (snapshot)
- Validasi KUM mencukupi atau tidak

**3. Validasi Kelengkapan**
Pastikan:
- ✅ Total KUM memenuhi minimal jabatan tujuan
- ✅ Semua kegiatan valid dan terverifikasi
- ✅ Tidak ada duplikasi kegiatan
- ✅ Periode penilaian sesuai

**4. Keputusan**

**JIKA DISETUJUI:**
- Klik tombol **"Proses Usulan"**
- Status berubah menjadi **"Diproses"**
- Kegiatan akan **terkunci permanent**
- Menunggu pimpinan menerbitkan SK

**JIKA DITOLAK:**
- Klik tombol **"Tolak Usulan"**
- Masukkan **catatan penolakan** (wajib)
- Status berubah menjadi **"Ditolak"**
- Kegiatan akan **di-unlock** (bisa dipakai lagi)
- **TIDAK** tercatat di blockchain

#### ⚠️ Catatan Penting:
- Usulan yang sudah diproses **menunggu SK dari pimpinan**
- Admin SDM **tidak bisa** menerbitkan SK (hanya pimpinan)
- Usulan yang ditolak **tidak masuk blockchain**

---

### D. Melihat Audit Trail

**Untuk Transparansi & Akuntabilitas:**

1. Buka detail kegiatan atau usulan
2. Scroll ke bagian **"Audit Trail"**
3. Lihat riwayat lengkap:
   - Siapa yang melakukan aksi
   - Kapan dilakukan
   - Aksi apa yang dilakukan
   - Perubahan data (jika ada)

**Contoh Audit Trail:**
```
[2026-05-30 10:15:23] CREATE - Kegiatan dibuat oleh Dr. John Doe
[2026-05-30 14:30:45] VERIFY - Diverifikasi oleh Admin SDM (user123)
```

---

## 👨‍💼 Panduan Pimpinan

### A. Dashboard Pimpinan

Dashboard menampilkan:
- **Total Usulan** yang perlu ditindaklanjuti
- **Usulan Diproses**: Siap untuk penerbitan SK
- **SK Terbit**: Usulan yang sudah selesai

---

### B. Menerbitkan SK Kenaikan Pangkat

#### Prasyarat:
✅ Usulan sudah diproses oleh Admin SDM  
✅ Validasi final sudah dilakukan  
✅ SK sudah disiapkan (file PDF)  

#### Langkah-langkah:

**1. Buka Menu Usulan**
- Filter status: **"Diproses"**
- Pilih usulan yang akan diterbitkan SK-nya

**2. Review Usulan**
Pastikan:
- Data dosen benar
- Jabatan tujuan sesuai
- Total KUM mencukupi
- Kegiatan snapshot valid

**3. Isi Form SK**

| Field | Deskripsi | Contoh |
|-------|-----------|--------|
| **Nomor SK** | Nomor surat keputusan | SK/001/2026 |
| **Tanggal SK** | Tanggal penerbitan | 30 Mei 2026 |
| **Upload Dokumen SK** | File PDF SK (max 5MB) | sk_kenaikan_pangkat.pdf |

**4. Upload Dokumen SK**
- File **wajib** format PDF
- Maksimal ukuran: **5 MB**
- Pastikan SK sudah ditandatangani dan di-scan

**5. Terbitkan SK**
- Klik tombol **"Terbitkan SK"**
- Konfirmasi tindakan
- SK akan diterbitkan dengan efek:

**Otomatis Terjadi:**
- ✅ Status usulan → **"SK Terbit"**
- ✅ **Jabatan dosen diupdate** ke jabatan tujuan
- ✅ Hash SK dicatat di **Blockchain** 🔗
- ✅ Kegiatan tetap **terkunci** (permanent)
- ✅ Dosen bisa download SK

#### ⚠️ Catatan Penting:
- SK yang sudah terbit **tidak bisa dibatalkan**
- Hash SK tercatat di blockchain untuk **verifikasi keaslian**
- Jabatan dosen otomatis berubah di sistem
- Ini adalah **satu-satunya transaksi blockchain untuk usulan**

---

### C. Verifikasi Keaslian SK di Blockchain

**Untuk memverifikasi SK:**

1. Buka detail usulan dengan status **"SK Terbit"**
2. Lihat bagian **"Blockchain TX ID"**
3. Hash dokumen SK akan tercatat di blockchain

**Cara Manual Verifikasi:**
- Download SK
- Hitung hash SHA-256 dari file
- Bandingkan dengan hash yang tercatat di blockchain
- Jika sama = SK asli & tidak diubah ✅

---

## ❓ FAQ (Frequently Asked Questions)

### Untuk Dosen:

**Q: Kegiatan saya ditolak, apa yang harus dilakukan?**  
A: Lihat alasan penolakan di detail kegiatan. Perbaiki dokumen/data sesuai catatan, lalu submit **kegiatan baru**. Kegiatan yang ditolak tidak bisa direvisi.

**Q: Berapa lama waktu verifikasi kegiatan?**  
A: Tergantung kebijakan institusi, biasanya 3-7 hari kerja.

**Q: Apakah bisa membatalkan usulan yang sudah disubmit?**  
A: Tidak. Setelah submit, hanya admin yang bisa reject. Pastikan data sudah benar sebelum submit.

**Q: Kegiatan sudah diverifikasi tapi tidak muncul saat buat usulan?**  
A: Kemungkinan kegiatan sudah dipakai di usulan lain. Satu kegiatan hanya bisa dipakai sekali.

**Q: Total KUM saya cukup tapi tidak bisa submit usulan?**  
A: Pastikan jabatan tujuan sesuai hierarki. Tidak bisa loncat jabatan (mis: Asisten Ahli → Lektor Kepala).

---

### Untuk Admin SDM:

**Q: Apakah bisa membatalkan verifikasi yang sudah disetujui?**  
A: Tidak. Kegiatan yang sudah verified tercatat di blockchain dan bersifat immutable.

**Q: Kegiatan sudah verified tapi belum tercatat di blockchain?**  
A: Tunggu beberapa saat. Jika masih belum, cek koneksi blockchain. Hubungi IT Support jika masalah berlanjut.

**Q: Apakah bisa mengubah poin KUM kegiatan yang sudah verified?**  
A: Tidak. Poin KUM otomatis sesuai jenis kegiatan dan tidak bisa diubah setelah verified.

---

### Untuk Pimpinan:

**Q: SK sudah terbit, tapi ada kesalahan. Bagaimana?**  
A: SK yang sudah terbit di blockchain tidak bisa dibatalkan. Jika ada kesalahan kritis, hubungi IT Support untuk prosedur khusus.

**Q: Apakah bisa menerbitkan SK tanpa upload dokumen?**  
A: Tidak. Dokumen SK wajib diunggah untuk tercatat hash-nya di blockchain.

---

### Umum:

**Q: Apa itu Blockchain TX ID?**  
A: ID unik transaksi di blockchain yang membuktikan data sudah tercatat secara immutable (tidak bisa diubah).

**Q: Apa itu Hash SHA-256?**  
A: Kode unik dari file/data yang seperti "sidik jari digital". Jika file berubah sedikit saja, hash-nya akan berbeda total.

**Q: Apakah data pribadi saya tersimpan di blockchain?**  
A: Tidak. Yang tersimpan di blockchain hanya hash dokumen dan metadata. Data pribadi (NIP, nama) hanya di database yang terenkripsi.

**Q: Bagaimana jika lupa password?**  
A: Hubungi Admin SDM untuk reset password. Jangan share password ke siapapun.

---

## 🔧 Troubleshooting

### Masalah Login

**Problem:** Tidak bisa login / password salah  
**Solusi:**
1. Pastikan email dan password benar (case sensitive)
2. Clear cache browser (Ctrl+Shift+Del)
3. Coba browser lain (Chrome/Firefox)
4. Jika masih gagal, hubungi admin untuk reset password

---

### Masalah Upload File

**Problem:** File tidak bisa diupload  
**Solusi:**
1. Pastikan format file: PDF, JPG, JPEG, atau PNG
2. Ukuran file maksimal: **5 MB**
3. Compress file jika terlalu besar
4. Pastikan koneksi internet stabil
5. Coba browser lain

**Problem:** Upload sukses tapi file corrupt  
**Solusi:**
1. Re-upload file
2. Pastikan file asli tidak rusak
3. Scan file dengan antivirus

---

### Masalah Blockchain

**Problem:** Blockchain TX ID kosong padahal sudah verified  
**Solusi:**
1. Tunggu 1-2 menit (proses blockchain membutuhkan waktu)
2. Refresh halaman
3. Jika masih kosong setelah 5 menit, hubungi IT Support

**Problem:** Hash tidak cocok saat verifikasi  
**Solusi:**
1. Pastikan file yang didownload sama dengan yang diupload
2. Jangan edit file setelah download
3. Gunakan tool hash checker yang sama

---

### Masalah Performance

**Problem:** Sistem lambat  
**Solusi:**
1. Clear cache browser
2. Tutup tab browser yang tidak dipakai
3. Check koneksi internet
4. Gunakan browser terbaru (Chrome/Firefox)
5. Hindari jam sibuk (8-9 pagi, 1-2 siang)

**Problem:** Halaman blank / error  
**Solusi:**
1. Refresh halaman (F5)
2. Clear cache (Ctrl+Shift+Del)
3. Logout dan login kembali
4. Coba browser lain
5. Screenshot error dan laporkan ke IT Support

---

## 📞 Kontak Support

### IT Support
📧 **Email:** support@institusi.ac.id  
📱 **WhatsApp:** +62 812-3456-7890  
⏰ **Jam Kerja:** Senin-Jumat, 08:00-16:00 WIB

### Admin SDM
📧 **Email:** sdm@institusi.ac.id  
📱 **Telp:** (021) 1234-5678 ext. 123

### Emergency Contact
Untuk masalah urgent di luar jam kerja:  
📱 **On-Call:** +62 813-7890-1234

---

## 📊 Tips & Best Practices

### Untuk Dosen:
✅ Upload dokumen berkualitas baik (jelas, tidak blur)  
✅ Simpan backup dokumen asli di tempat aman  
✅ Submit kegiatan secara berkala, jangan tunggu menumpuk  
✅ Periksa status kegiatan secara rutin  
✅ Siapkan kegiatan jauh-jauh hari sebelum mengajukan usulan  

### Untuk Admin SDM:
✅ Review kegiatan secara teliti dan objektif  
✅ Berikan alasan penolakan yang jelas dan konstruktif  
✅ Verifikasi dalam waktu yang wajar (SLA 3-7 hari)  
✅ Dokumentasikan keputusan verifikasi  
✅ Komunikasi dengan dosen jika ada dokumen yang kurang jelas  

### Untuk Pimpinan:
✅ Pastikan SK sudah final sebelum diterbitkan  
✅ Upload SK yang sudah ditandatangani (scan berkualitas baik)  
✅ Double-check nomor SK dan tanggal  
✅ Koordinasi dengan Admin SDM untuk usulan yang kompleks  

---

## 📚 Referensi Dokumen Lain

- **[API Testing Guide](API_TESTING_GUIDE.md)** - Untuk developer
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Untuk IT Operations
- **[Offchain/Onchain Data](OFFCHAIN_ONCHAIN_DATA.md)** - Arsitektur data
- **[Security Implementation](SECURITY_IMPLEMENTATION_SUMMARY.md)** - Keamanan sistem

---

## 📝 Catatan Versi

| Version | Tanggal | Perubahan |
|---------|---------|-----------|
| 2.0 | 2026-05-30 | Update: Hapus fitur revisi kegiatan, blockchain hanya untuk verified |
| 1.5 | 2026-05-15 | Penambahan fitur snapshot usulan |
| 1.0 | 2026-04-01 | Rilis pertama |

---

## 🎓 Penutup

Terima kasih telah menggunakan Sistem Usulan Kenaikan Pangkat Blockchain!

Sistem ini dirancang untuk:
- Meningkatkan **transparansi** proses kenaikan pangkat
- Menjamin **integritas** data dengan blockchain
- Mempercepat **efisiensi** administrasi
- Memberikan **akuntabilitas** yang jelas

Jika ada pertanyaan, saran, atau masalah, jangan ragu untuk menghubungi **IT Support**.

---

**Selamat menggunakan sistem! 🚀**

*"Blockchain for Transparency, Trust, and Truth"*
