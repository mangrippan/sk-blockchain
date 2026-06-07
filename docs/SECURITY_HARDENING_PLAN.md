# Security Hardening Plan

## Daftar Celah Keamanan & Rencana Perbaikan

Berdasarkan audit keamanan proyek Usulan Kenaikan Pangkat Blockchain.

---

## FASE 1 — CRITICAL: Access Control & Privilege Escalation

### 1.1 Role Escalation pada Registrasi
**File:** `backend/routes/v1/auth.js`  
**Masalah:** User bisa mengirim `role` saat register (mis. `"role": "superadmin"`) dan langsung mendapat privilege tertinggi.  
**Dampak:** Siapa saja bisa menjadi admin dan mengendalikan seluruh sistem.  
**Perbaikan:**
- Hapus penerimaan field `role` dari request body di endpoint `/register`
- Default role selalu `dosen` untuk public signup
- Buat endpoint terpisah `POST /admin/users` (hanya superadmin) untuk assign role

### 1.2 Chaincode Tanpa Identity Check
**File:** `chaincode/lib/kegiatanContract.js`  
**Masalah:** Semua fungsi write (`CreateKegiatan`, `VerifyKegiatan`, `TerbitkanSkKenaikanPangkat`, dll.) tidak memvalidasi siapa yang memanggil.  
**Dampak:** Enrolled identity manapun bisa memverifikasi, menolak, atau menerbitkan SK.  
**Perbaikan:**
- Tambahkan helper `_checkRole(ctx, allowedRoles)` menggunakan `ctx.clientIdentity`
- Enforce per-fungsi:
  - `CreateKegiatan` → role `dosen` atau `app`
  - `VerifyKegiatan` → role `admin_sdm` / `pimpinan`
  - `ProsesUsulanKenaikanPangkat` → role `admin_sdm` / `pimpinan`
  - `TolakUsulanKenaikanPangkat` → role `admin_sdm` / `pimpinan`
  - `TerbitkanSkKenaikanPangkat` → role `admin_sdm` / `pimpinan`
  - `ReadKegiatan`, `GetHistory` → semua authenticated identity

### 1.3 Private Key di Repository
**File:** `fabric-config/wallet/admin.id`, `fabric-config/wallet/appUser.id`  
**Masalah:** Private key signing tersimpan di Git. Jika repo bocor, penyerang bisa sign transaksi blockchain.  
**Perbaikan:**
- Tambahkan ke `.gitignore`: `fabric-config/wallet/*.id`
- Rotate semua identity/certificate yang sudah exposed
- Dokumentasikan enrollment flow untuk developer baru

---

## FASE 2 — HIGH: Authorization & Exposure

### 2.1 Uploaded Files Publicly Accessible
**File:** `backend/server.js` (static serving `/uploads`)  
**Masalah:** Dokumen SK dan bukti kegiatan bisa diakses tanpa auth jika URL diketahui/brute-forced.  
**Dampak:** Dokumen rahasia kenaikan pangkat terekspos.  
**Perbaikan:**
- Hapus `express.static` untuk folder `uploads/`
- Buat endpoint download dengan auth + ownership check:
  ```
  GET /api/v1/files/:fileId → auth + (owner || admin)
  ```
- Serve file via `res.sendFile()` setelah validasi

### 2.2 Missing Rate Limiting
**File:** `backend/server.js`, `backend/routes/v1/auth.js`  
**Masalah:** Tidak ada rate limit → brute-force login, credential stuffing, DoS.  
**Perbaikan:**
- Install `express-rate-limit`
- Global: 100 req/15 menit per IP
- Login endpoint: 5 attempts/15 menit per IP+account
- Register endpoint: 3 attempts/jam per IP

### 2.3 IDOR pada Endpoint Data
**File:** `backend/routes/v1/kegiatan.js`, `backend/routes/v1/ref.js`  
**Masalah:** Endpoint cek jabatan berikutnya (`/ref/jabatan-next/:userId`) bisa diakses untuk user lain.  
**Perbaikan:**
- Validasi `req.params.userId === req.user.id` kecuali role admin/pimpinan

### 2.4 Hardcoded Secrets
**File:** `docker-compose.yml`, `.env`, `backend/.env`  
**Masalah:** JWT secret dan DB password plaintext di file config.  
**Perbaikan:**
- Gunakan Docker secrets atau env injection dari CI/CD
- Fail startup jika `JWT_SECRET` masih default/weak (< 32 chars)
- Jangan commit `.env` ke repo (tambahkan `.env.example` saja)

---

## FASE 3 — MEDIUM: Hardening

### 3.1 JWT Hardening
**File:** `backend/middleware/auth.js`  
**Masalah:** `jwt.verify()` tanpa constraint algorithm, issuer, audience.  
**Perbaikan:**
```javascript
jwt.verify(token, secret, {
  algorithms: ['HS256'],
  issuer: 'prima-api',
  audience: 'prima-app',
});
```

### 3.2 File Upload Magic Byte Validation
**File:** `backend/routes/v1/kegiatan.js`, `backend/routes/v1/usulan.js`  
**Masalah:** Hanya cek extension + mimetype (client-controlled). Bisa upload executable yang di-rename jadi .pdf.  
**Perbaikan:**
- Install `file-type` package
- Validasi magic bytes setelah upload sebelum simpan permanen
- Reject jika mismatch

### 3.3 Error Message Leakage
**File:** Semua routes + `backend/server.js`  
**Masalah:** `error.message` dikirim ke client → ekspos internal detail (nama tabel, path, dll).  
**Perbaikan:**
- Production: return generic error + correlation ID
- Development: boleh return detail
- Pattern:
  ```javascript
  res.status(500).json({
    error: 'Internal server error',
    correlationId: uuid(),
    ...(isDev && { detail: error.message })
  });
  ```

### 3.4 Unbounded Pagination
**File:** `backend/routes/v1/kegiatan.js`, `backend/routes/v1/usulan.js`  
**Masalah:** User bisa kirim `limit=999999` → query berat, DoS.  
**Perbaikan:**
```javascript
const MAX_LIMIT = 100;
const limit = Math.min(parseInt(req.query.limit) || 20, MAX_LIMIT);
```

### 3.5 DB SSL Verification
**File:** `backend/config/database.js`  
**Masalah:** `rejectUnauthorized: false` → rentan MITM.  
**Perbaikan:**
- Production: set `rejectUnauthorized: true` + provide CA cert
- Local dev: boleh false

### 3.6 Over-Privileged Blockchain Identity
**File:** `backend/utils/fabricClient.js`  
**Masalah:** Aplikasi pakai identity `admin` untuk semua operasi.  
**Perbaikan:**
- Gunakan `appUser` identity untuk operasi normal
- `admin` hanya untuk enrollment/maintenance

---

## FASE 4 — LOW: Informational

### 4.1 Health Endpoint Exposure
**File:** `backend/server.js`  
**Perbaikan:** Hapus informasi environment/version di production

### 4.2 Model SELECT * Pattern
**File:** `backend/models/*.js`  
**Perbaikan:** Gunakan explicit column list, jangan return `password_hash` atau internal path

---

## Implementation Checklist

| # | Task | Priority | Effort | Status |
|---|------|----------|--------|--------|
| 1 | Fix role escalation di registrasi | 🔴 Critical | 30 min | ⬜ |
| 2 | Tambah ACL helper di chaincode | 🔴 Critical | 2-3 jam | ⬜ |
| 3 | Remove wallet files dari git | 🔴 Critical | 15 min | ⬜ |
| 4 | Secure file download endpoint | 🟠 High | 1-2 jam | ⬜ |
| 5 | Add rate limiting | 🟠 High | 1 jam | ⬜ |
| 6 | Fix IDOR pada ref endpoint | 🟠 High | 30 min | ⬜ |
| 7 | Secure secrets management | 🟠 High | 1 jam | ⬜ |
| 8 | JWT hardening (algorithm pin) | 🟡 Medium | 30 min | ⬜ |
| 9 | Magic byte file validation | 🟡 Medium | 1 jam | ⬜ |
| 10 | Safe error responses | 🟡 Medium | 1-2 jam | ⬜ |
| 11 | Bounded pagination | 🟡 Medium | 30 min | ⬜ |
| 12 | DB SSL fix | 🟡 Medium | 15 min | ⬜ |
| 13 | Least-privilege fabric identity | 🟡 Medium | 30 min | ⬜ |
| 14 | Health endpoint cleanup | 🟢 Low | 15 min | ⬜ |
| 15 | Model response sanitization | 🟢 Low | 1 jam | ⬜ |

---

## Role-Based Access Control Matrix

### Definisi Role
| Role | Deskripsi |
|------|-----------|
| `dosen` | Dosen biasa, submit kegiatan & usulan |
| `admin_sdm` | Admin SDM, verifikasi & proses usulan |
| `pimpinan` | Pimpinan, approval akhir & terbitkan SK |
| `superadmin` | Superadmin, kelola user & konfigurasi |

### Backend API Authorization Matrix

| Endpoint | dosen | admin_sdm | pimpinan | superadmin |
|----------|-------|-----------|----------|------------|
| `POST /auth/register` | ✅ (role forced dosen) | — | — | — |
| `POST /admin/users` (assign role) | ❌ | ❌ | ❌ | ✅ |
| `GET /kegiatan` | ✅ (own only) | ✅ (all) | ✅ (all) | ✅ (all) |
| `POST /kegiatan` | ✅ | ❌ | ❌ | ❌ |
| `PUT /kegiatan/:id` | ✅ (own only) | ❌ | ❌ | ❌ |
| `DELETE /kegiatan/:id` | ✅ (own, unverified) | ❌ | ❌ | ✅ |
| `PUT /kegiatan/:id/verify` | ❌ | ✅ | ✅ | ✅ |
| `GET /usulan` | ✅ (own only) | ✅ (all) | ✅ (all) | ✅ (all) |
| `POST /usulan` | ✅ | ❌ | ❌ | ❌ |
| `PUT /usulan/:id/proses` | ❌ | ✅ | ✅ | ✅ |
| `PUT /usulan/:id/tolak` | ❌ | ✅ | ✅ | ✅ |
| `PUT /usulan/:id/terbitkan-sk` | ❌ | ✅ | ✅ | ✅ |
| `GET /files/:id` (download) | ✅ (own) | ✅ | ✅ | ✅ |
| `GET /ref/*` | ✅ | ✅ | ✅ | ✅ |
| `GET /ref/jabatan-next/:userId` | ✅ (self only) | ✅ | ✅ | ✅ |

### Chaincode Access Control Matrix

| Function | dosen/app | admin_sdm | pimpinan | Unrestricted |
|----------|-----------|-----------|----------|--------------|
| `CreateKegiatan` | ✅ | ✅ | ❌ | — |
| `ReadKegiatan` | — | — | — | ✅ |
| `VerifyKegiatan` | ❌ | ✅ | ✅ | — |
| `GetHistory` | — | — | — | ✅ |
| `VerifyDocumentHash` | — | — | — | ✅ |
| `GetAllKegiatan` | ❌ | ✅ | ✅ | — |
| `AjukanUsulanKenaikanPangkat` | ✅ | ❌ | ❌ | — |
| `ProsesUsulanKenaikanPangkat` | ❌ | ✅ | ✅ | — |
| `TolakUsulanKenaikanPangkat` | ❌ | ✅ | ✅ | — |
| `TerbitkanSkKenaikanPangkat` | ❌ | ✅ | ✅ | — |

---

## Urutan Implementasi yang Disarankan

```
Week 1: FASE 1 (Critical)
  ├── Fix role escalation
  ├── Add chaincode ACL
  └── Remove secrets from git

Week 2: FASE 2 (High)  
  ├── Secure file serving
  ├── Rate limiting
  ├── Fix IDOR
  └── Secret management

Week 3: FASE 3 (Medium)
  ├── JWT hardening
  ├── File validation
  ├── Error sanitization
  ├── Pagination bounds
  └── DB SSL + fabric identity

Week 4: FASE 4 (Low) + Testing
  ├── Health endpoint
  ├── Model sanitization
  └── Security regression tests
```
