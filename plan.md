# Rencana Pengembangan Proyek ChainRank - MVP
## Sistem Pencatatan & Verifikasi Kenaikan Pangkat Dosen Berbasis Blockchain Hybrid
## 🎓 **VERSION: Tugas Kuliah (1 Bulan)**

> **Note:** Ini adalah versi **Minimum Viable Product (POC)** untuk tugas kuliah. Untuk plan lengkap production-ready, lihat [plan-full.md](plan-full.md).

---

## 🎯 Tujuan MVP
Membuat **Proof of Concept** sistem hybrid yang mendemonstrasikan:
1. ✅ Pencatatan kegiatan dosen ke database PostgreSQL
2. ✅ Hashing dokumen & penyimpanan hash ke Hyperledger Fabric blockchain
3. ✅ Verifikasi integritas dokumen melalui hash comparison
4. ✅ Audit trail sederhana dari blockchain history
5. ✅ Interface web untuk upload & view data

---

## 📅 Timeline 1 Bulan (4 Minggu)

### **Minggu 1: Setup Infrastruktur & Persiapan** ⚙️
**Target:** Semua tools & environment siap digunakan

#### Checklist:
* [x] **1.1 Setup Repository** ✅
  - Inisialisasi Git repository
  - Struktur folder: `/backend`, `/frontend`, `/chaincode`, `/docs`
  - README.md dengan instruksi setup

* [x] **1.2 Install & Setup Tools** ✅
  - Node.js v18+ & npm
  - PostgreSQL 15 (Docker)
  - Docker & Docker Compose
  - VS Code dengan extension (Prettier, ESLint)
  - Postman untuk testing API

* [x] **1.3 Database Setup** ✅
  - Install PostgreSQL (via Docker)
  - Buat database: `chainrank_db`
  - **Gunakan `database/schema.sql` sebagai schema canonical**
  - Schema sudah dibuat dengan 3 tabel: users, kegiatan_dosen, audit_logs
  - Seed data sudah di-load (6 users, 8 kegiatan sample)

* [ ] **1.4 Hyperledger Fabric Network** ⏳ NEXT
  - Clone Fabric Samples: `git clone https://github.com/hyperledger/fabric-samples.git`
  - Download Fabric binaries & Docker images
  - Start test-network:
    ```bash
    cd fabric-samples/test-network
    ./network.sh up createChannel -c mychannel -ca
    ```
  - Pastikan network berjalan dengan benar

* [x] **1.5 Docker Compose untuk Development** ✅
  - Buat `docker-compose.dev.yml` minimal dengan PostgreSQL ✅
  - Container running: `chainrank_postgres_dev` ✅
  - Auto-initialize schema & seed data on startup ✅
  - Health check configured ✅

* [x] **1.6 Seed Data Script** ✅
  - Buat `database/seed.sql` ✅
  - 6 users (1 admin, 3 dosen, 1 pimpinan, 1 test dosen) ✅
  - 8 kegiatan sample (4 verified, 3 pending, 1 rejected) ✅
  - 3 audit log entries ✅
  - Default password: `password123` ✅
  - **Database siap untuk development!** ✅

**📊 Minggu 1 Status: 80% Complete** (Tinggal Hyperledger Fabric setup)

Lihat progress lengkap di: [docs/WEEK1_PROGRESS.md](docs/WEEK1_PROGRESS.md)
Quick reference database: [DATABASE_QUICKSTART.md](DATABASE_QUICKSTART.md)

---

### **Minggu 2: Backend Development** 💻

#### **2.1 Express.js Backend Setup**
* [x] Initialize project: `npm init -y`
* [ ] Install dependencies:
  ```bash
  npm install express cors dotenv pg bcrypt jsonwebtoken multer crypto
  npm install --save-dev nodemon
  ```
* [ ] Struktur folder backend:
  ```
  /backend
    /config       # Database & Fabric connection config
    /controllers  # Request/response handling (thin)
    /services     # Business logic (thick) ← PENTING!
    /models       # Database models/schemas
    /routes       # API routes
    /middleware   # Auth middleware
    /utils        # Helper functions (hash, fabric client)
    /validators   # Input validation
    server.js     # Entry point
  ```

* [x] **Environment Variable Validation** di `server.js`:
  ```javascript
  const required = ['DB_HOST', 'DB_PASSWORD', 'JWT_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Missing required env: ${key}`);
      process.exit(1);
    }
  }
  ```

* [x] **Graceful Shutdown**:
  ```javascript
  process.on('SIGTERM', async () => {
    await pool.end();           // Close DB connections
    await gateway.disconnect(); // Close Fabric gateway
    process.exit(0);
  });
  ```

#### **2.2 Core Features Backend**
* [x] **Authentication (Sederhana)**
  - Register endpoint (hash password dengan bcrypt)
  - Login endpoint (generate JWT token)
  - Auth middleware untuk protect routes

* [x] **API Endpoints (Minimal 5)** — gunakan versioned path `/api/v1/`
  - `POST /api/v1/kegiatan` - Upload kegiatan + file
  - `GET /api/v1/kegiatan` - List semua kegiatan user
  - `GET /api/v1/kegiatan/:id` - Detail kegiatan
  - `GET /api/v1/kegiatan/:id/audit` - Audit trail dari blockchain
  - `GET /api/v1/health` - **Health check** (status DB, Fabric, uptime)
    ```javascript
    // Response:
    { "status": "ok", "database": "connected", "blockchain": "connected", "uptime": "..." }
    ```
    > Penting untuk demo — dosen penguji bisa langsung lihat status semua komponen

* [x] **File Upload Handler**
  - Multer config untuk accept PDF (max 5MB)
  - Validasi file type via extension + mimetype
  - Simpan file di `/uploads` folder
  - Generate SHA-256 hash dari file

* [x] **Database Connection**
  - Setup PostgreSQL connection pool (pg)
  - CRUD operations untuk kegiatan

#### **2.3 Chaincode Development**
* [x] **Buat chaincode sederhana** (`/chaincode/lib/kegiatanContract.js`):
  ```javascript
  // Minimal 3 fungsi:
  // 1. CreateKegiatan(id, hash, metadata)
  // 2. ReadKegiatan(id)
  // 3. GetHistory(id) - untuk audit trail
  ```

* [ ] **Deploy chaincode ke test-network** ⏳
  ```bash
  # Package
  peer lifecycle chaincode package kegiatan.tar.gz --path ./chaincode --lang node
  
  # Install, approve, commit (ikuti Fabric tutorial)
  ```

* [ ] **Test chaincode** dengan peer CLI commands

#### **2.4 Fabric SDK Integration**
* [x] Install Fabric SDK: `npm install fabric-network`
* [x] Buat utility function untuk:
  - Connect ke Fabric gateway
  - Submit transaction (untuk write)
  - Evaluate transaction (untuk read)
  - Get transaction history

* [ ] **Implement Double-Commit Pattern**
  ```javascript
  // Pseudocode:
  async function createKegiatan(data) {
    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');
      
      // 1. Insert to PostgreSQL
      const result = await dbClient.query('INSERT INTO kegiatan...');
      
      // 2. Submit to Blockchain
      const txId = await fabricClient.submitTransaction('CreateKegiatan', ...);
      
      // 3. Update txId in database
      await dbClient.query('UPDATE kegiatan SET blockchain_tx_id = $1...', [txId]);
      
      await dbClient.query('COMMIT');
      return result;
    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }
  }
  ```

* [ ] **Fabric Compensation Mechanism** ⚠️ PENTING
  > Jika Fabric berhasil tapi UPDATE txId ke PostgreSQL gagal, data menjadi inkonsisten.
  
  Solusi: Buat tabel `pending_blockchain_sync` untuk retry:
  ```sql
  CREATE TABLE pending_blockchain_sync (
    id SERIAL PRIMARY KEY,
    kegiatan_id INTEGER,
    blockchain_tx_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- pending, synced, failed
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
  - Jika DB update gagal setelah Fabric sukses → log ke tabel ini
  - Background job atau manual retry untuk sinkronisasi ulang

* [x] **Fallback Mode (Database-Only)** 🛡️
  - Jika Fabric network down saat demo, backend tetap bisa jalan
  - Set `FABRIC_ENABLED=false` untuk skip blockchain
  - Safety net yang penting agar demo tidak gagal total

---

### **Minggu 3: Frontend Development** 🎨

#### **3.1 Vue.js Setup**
* [x] Create Vue project:
  ```bash
  npm create vue@latest
  # Select: TypeScript (No), Pinia (Yes), Router (Yes)
  ```
* [x] Install dependencies:
  ```bash
  npm install axios tailwindcss @tailwindcss/forms
  ```
* [x] Configure Tailwind CSS

#### **3.2 Pages (Minimal 3)**
* [x] **Login Page** (`/login`)
  - Form login sederhana
  - Simpan JWT token di localStorage

* [x] **Dashboard Dosen** (`/dashboard`)
  - Form upload kegiatan:
    - Input: Jenis Kegiatan (dropdown)
    - Input: Deskripsi (textarea)
    - Input: Poin KUM (number)
    - Upload File PDF
    - Button Submit
  - Tabel list kegiatan dengan kolom:
    - Jenis Kegiatan, Poin, Status, Tanggal
    - Action: View Detail

* [x] **Detail Kegiatan** (`/kegiatan/:id`)
  - Info kegiatan lengkap
  - File PDF preview (atau download link)
  - **Hash Verification Section:**
    - Display: Hash Tersimpan
    - Display: Hash dari Blockchain
    - Status: ✅ Valid / ❌ Tampered
  - **Audit Trail Timeline:**
    - Tampilkan history dari blockchain
    - Format: Timestamp, Action, User

#### **3.3 Components**
* [x] `Navbar.vue` - Simple navigation
* [x] `UploadForm.vue` - Reusable upload form
* [x] `KegiatanTable.vue` - Tabel kegiatan
* [x] `AuditTrail.vue` - Timeline component untuk history

#### **3.4 State Management (Pinia)**
* [x] Store untuk authentication (`auth.store.js`)
* [x] Store untuk kegiatan data (`kegiatan.store.js`)

#### **3.5 Integration**
* [x] Axios interceptor untuk JWT token
* [x] API calls ke backend
* [x] Error handling & loading states

---

### **Minggu 4: Testing, Documentation & Finalisasi** 📝

#### **4.1 Manual Testing**
* [ ] **Test Flow Lengkap:**
  1. Register user baru
  2. Login
  3. Upload kegiatan dengan file PDF
  4. Cek data masuk ke PostgreSQL
  5. Cek hash tersimpan di blockchain (via peer CLI atau API)
  6. View audit trail
  7. Simulasi: Edit file PDF manual → verify hash → detect tampering

* [ ] **Test Edge Cases:**
  - Upload file non-PDF (harus ditolak)
  - Upload file >5MB (harus ditolak)
  - Login dengan password salah
  - Akses endpoint tanpa token

#### **4.2 Bug Fixing**
* [ ] Fix critical bugs yang ditemukan saat testing
* [ ] Improve error messages
* [ ] Handle edge cases

#### **4.3 Code Cleanup**
* [ ] Hapus console.log() yang tidak perlu
* [ ] Format code dengan Prettier
* [ ] Add comments untuk code yang kompleks

#### **4.4 Documentation**

* [ ] **README.md** dengan:
  - Deskripsi proyek
  - Architecture diagram (simple)
  - Prerequisites & Installation steps
  - How to run (step-by-step)
  - API documentation (endpoint list)
  - Screenshots

* [ ] **Dokumentasi Tugas:**
  - Laporan (Word/PDF):
    - Pendahuluan & Latar Belakang
    - Landasan Teori (Blockchain, Hyperledger Fabric)
    - Arsitektur Sistem (diagram)
    - Implementasi (dengan code snippets)
    - Testing & Hasil
    - Kesimpulan & Saran
  - Slide Presentasi (PPT):
    - 10-15 slides
    - Fokus pada konsep & demo

* [ ] **Video Demo (5-10 menit):**
  - Screen recording demo aplikasi
  - Narasi menjelaskan fitur
  - Tunjukkan audit trail & hash verification

* [ ] **Demo Script** (ikuti urutan ini saat presentasi):
  1. Tunjukkan architecture diagram (30 detik)
  2. Tunjukkan health check endpoint — semua komponen connected (30 detik)
  3. Register & Login sebagai dosen (1 menit)
  4. Upload kegiatan dengan PDF (2 menit)
  5. Tunjukkan data di PostgreSQL via psql query (1 menit)
  6. Tunjukkan hash di blockchain via peer CLI (1 menit)
  7. **Tampering demo:** edit file PDF manual → verify → detect hash mismatch (2 menit)
  8. Tunjukkan audit trail timeline (1 menit)
  9. Closing: architecture recap & kesimpulan (30 detik)
  > **Tip:** Record demo video dari awal pengerjaan, jadi ada backup jika ada bug mendadak

#### **4.5 Deployment & Reproducibility**
* [x] Docker Compose untuk development ← **dipindah ke Minggu 1** (lihat 1.5)
* [ ] Docker Compose untuk full stack (backend + frontend + postgres):
  ```yaml
  # docker-compose.yml
  services:
    postgres:
      image: postgres:15
      # ... config
    
    backend:
      build: ./backend
      # ... config
    
    frontend:
      build: ./frontend
      # ... config
  ```
* [ ] `.env.example` untuk environment variables
* [ ] Postman Collection (`docs/ChainRank.postman_collection.json`)
* [ ] Deployment instructions

---

## 🛠️ Tech Stack (Simplified)

### Frontend
* Vue.js 3 (Composition API)
* Pinia (state management)
* Tailwind CSS
* Axios

### Backend
* Node.js + Express.js
* PostgreSQL (dengan pg driver)
* Multer (file upload)
* JWT (authentication)
* bcrypt (password hashing)

### Blockchain
* Hyperledger Fabric (test-network dari fabric-samples)
* Fabric SDK for Node.js
* Chaincode: Node.js
* 1 Channel, 1 Peer, 1 Orderer (cukup untuk POC)

### Development Tools
* Git & GitHub
* Postman (API testing)
* VS Code
* Docker

---

## 📊 Minimal Features Checklist

### Must Have (P0) - Wajib ada untuk lulus
- [x] Database PostgreSQL dengan minimal 2 tabel
- [x] Backend API dengan minimal 4 endpoints
- [x] File upload & SHA-256 hashing
- [x] Integration dengan Hyperledger Fabric (submit & read)
- [x] Frontend web dengan minimal 3 halaman
- [x] Authentication sederhana (login/register)
- [x] Audit trail dari blockchain
- [x] Hash verification demo

### Nice to Have (P1) - Nilai tambah
- [ ] Pretty UI/UX dengan Tailwind
- [ ] Real-time notification
- [ ] Export data ke PDF/Excel
- [ ] Advanced filtering & search
- [ ] Dashboard statistics (chart)

### Should Have (P1.5) - Minimal security untuk demo aman
- [ ] Input sanitization (cegah XSS/SQL injection di demo)
- [ ] File magic bytes validation (bukan hanya extension check)
- [ ] JWT secret strength validation
- [ ] Health check endpoint

### Can Skip (P2) - Tidak perlu untuk tugas kuliah
- [ ] Multiple user roles dengan permission
- [ ] Email notification
- [ ] Production deployment
- [ ] Rate limiting, CSRF protection
- [ ] Monitoring & logging
- [ ] CI/CD pipeline

---

## 🎯 Success Criteria

Tugas kuliah dianggap **berhasil** jika:

1. ✅ Aplikasi bisa running (frontend + backend + blockchain)
2. ✅ User bisa upload kegiatan dengan file PDF
3. ✅ Hash file tersimpan di blockchain (bisa dibuktikan)
4. ✅ Bisa menampilkan audit trail dari blockchain
5. ✅ Bisa detect jika file sudah diubah (hash berbeda)
6. ✅ Ada dokumentasi lengkap (laporan + slide + demo video)
7. ✅ Code di-push ke GitHub repository

---

## 💡 Tips Pengerjaan

### Week 1
- **Jangan stuck di setup terlalu lama!** Jika Fabric susah, gunakan `fabric-samples/test-network` as-is
- Prioritas: Setup environment dulu baru coding

### Week 2
- **Backend dulu, frontend kemudian.** Test API dengan Postman dulu sebelum bikin UI
- **Chaincode sesederhana mungkin.** 3 fungsi cukup: Create, Read, GetHistory
- Gunakan template/boilerplate jika ada untuk save time

### Week 3
- **UI tidak perlu fancy.** Tailwind basic components sudah cukup
- Focus on functionality, bukan design
- Copy-paste component dari template jika perlu (credit the source)

### Week 4
- **Testing & documentation sama pentingnya dengan coding!**
- Record demo video dari awal, jadi ada backup jika ada bug mendadak
- Prepare laporan sambil coding (jangan di minggu terakhir)

### General
- **Commit & push code setiap hari** ke GitHub (backup + proof of work)
- **Ask for help early** jika stuck >2 jam di satu masalah
- **Focus on MVP** - fitur tambahan nanti saja kalau ada waktu
- **Pair programming** dengan teman jika memungkinkan

---

## � Migration Strategy: MVP → Production

### **Design Principles untuk Future-Proofing** ⚠️ PENTING!

Agar bisa smooth transition dari MVP ke production, **ikuti principles ini sejak awal:**

#### **1. Modular Architecture**
```
/backend
  /config        # All configurations (DB, Fabric, etc)
  /controllers   # Business logic (thin controllers)
  /services      # Core logic (thick services) ← PENTING!
  /models        # Database models/schemas
  /routes        # API routes
  /middleware    # Reusable middleware
  /utils         # Helper functions
  /validators    # Input validation
```

**✅ DO:**
- Pisahkan business logic ke `/services`
- Controllers hanya handle request/response
- Services bisa dipanggil dari mana saja (reusable)

**❌ DON'T:**
- Campur business logic di controller
- Hardcode values (gunakan config/env)
- Buat spaghetti code

#### **2. Database Schema - Extensible Design**

**✅ Tambahkan kolom ini SEJAK AWAL** (walaupun belum dipakai):
```sql
-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nip VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(200) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'dosen',
  
  -- Columns untuk future (isi NULL dulu ok)
  department VARCHAR(100),
  jabatan VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP  -- Soft delete
);

-- kegiatan_dosen table
CREATE TABLE kegiatan_dosen (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  jenis_kegiatan VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  poin_kum DECIMAL(5,2) NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(500),  -- Full path to file
  file_hash VARCHAR(64) NOT NULL,
  blockchain_tx_id VARCHAR(100),
  
  status VARCHAR(20) DEFAULT 'pending',
  verified_by INTEGER REFERENCES users(id),  -- Siapa yang verify
  verified_at TIMESTAMP,
  rejection_reason TEXT,  -- Jika ditolak
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Audit logs table (tambahkan sejak awal!)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE', 'VERIFY'
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk performance (wajib!)
CREATE INDEX idx_kegiatan_user_id ON kegiatan_dosen(user_id);
CREATE INDEX idx_kegiatan_status ON kegiatan_dosen(status);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
```

#### **3. Configuration Management**

**✅ Gunakan Environment Variables sejak awal:**
```javascript
// config/database.js
module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chainrank_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: process.env.DB_POOL_SIZE || 10  // Connection pool
};

// config/fabric.js
module.exports = {
  channelName: process.env.FABRIC_CHANNEL || 'mychannel',
  chaincodeName: process.env.FABRIC_CHAINCODE || 'kegiatan',
  mspId: process.env.FABRIC_MSP_ID || 'Org1MSP',
  // ... etc
};
```

**File `.env`:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chainrank_db
DB_USER=postgres
DB_PASSWORD=yourpassword

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_DIR=./uploads

# Fabric
FABRIC_CHANNEL=mychannel
FABRIC_CHAINCODE=kegiatan

# Server
PORT=3000
NODE_ENV=development
```

#### **4. API Design - RESTful & Versioned**

**✅ Gunakan API versioning sejak awal:**
```javascript
// routes/index.js
const express = require('express');
const router = express.Router();

// Version 1 routes
router.use('/api/v1/auth', require('./v1/auth'));
router.use('/api/v1/kegiatan', require('./v1/kegiatan'));
router.use('/api/v1/users', require('./v1/users'));

module.exports = router;
```

**Konsisten dengan naming:**
- `GET /api/v1/kegiatan` - List all
- `GET /api/v1/kegiatan/:id` - Get one
- `POST /api/v1/kegiatan` - Create
- `PUT /api/v1/kegiatan/:id` - Update
- `DELETE /api/v1/kegiatan/:id` - Delete
- `GET /api/v1/kegiatan/:id/audit` - Audit trail

#### **5. Error Handling - Centralized**

**✅ Buat error handler dari awal:**
```javascript
// utils/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production - don't leak error details
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
};
```

#### **6. Chaincode - Extensible Functions**

**✅ Structure chaincode dengan baik:**
```javascript
// chaincode/lib/kegiatan.js
class KegiatanContract extends Contract {
  
  // CRUD operations
  async createKegiatan(ctx, id, data) { }
  async readKegiatan(ctx, id) { }
  async updateKegiatan(ctx, id, data) { }
  async deleteKegiatan(ctx, id) { }
  
  // Query operations
  async queryKegiatanByUser(ctx, userId) { }
  async queryKegiatanByStatus(ctx, status) { }
  
  // Audit
  async getHistory(ctx, id) { }
  
  // Future: Access control
  async _checkPermission(ctx, action, resourceId) {
    // Implement later
    return true;
  }
}
```

#### **7. Frontend - Component-Based**

**✅ Buat reusable components:**
```
/frontend/src
  /components
    /common
      Button.vue
      Input.vue
      Modal.vue
      Table.vue
    /kegiatan
      KegiatanForm.vue
      KegiatanTable.vue
      KegiatanDetail.vue
    /audit
      AuditTrail.vue
  /views
    Dashboard.vue
    KegiatanList.vue
    KegiatanDetail.vue
  /stores
    auth.js
    kegiatan.js
  /services
    api.js  ← Centralized API calls
  /utils
    validators.js
    formatters.js
```

---

### **Migration Path: MVP → Full Production**

Ketika MVP selesai dan mau scale up, ikuti step ini:

#### **Phase 1: Security Enhancement** (Week 1-2)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement RBAC (role-based access control)
- [ ] Add CSRF protection
- [ ] Setup HTTPS/SSL
- [ ] Add input sanitization
- [ ] Implement refresh token mechanism

#### **Phase 2: Scalability** (Week 3-4)
- [ ] Scale Fabric network (3 peers, 3 orderers)
- [ ] Setup PostgreSQL replication
- [ ] Add Redis for caching & sessions
- [ ] Implement load balancer (Nginx)
- [ ] Setup CDN untuk static files

#### **Phase 3: Observability** (Week 5-6)
- [ ] Add Prometheus + Grafana
- [ ] Centralized logging (Winston + Loki)
- [ ] Error tracking (Sentry)
- [ ] Add health check endpoints
- [ ] Setup alerting rules

#### **Phase 4: Advanced Features** (Week 7-8)
- [ ] Multiple user roles dengan permissions
- [ ] Email notifications (Nodemailer)
- [ ] Real-time updates (WebSocket)
- [ ] Export to PDF/Excel
- [ ] Advanced search & filtering

#### **Phase 5: DevOps** (Week 9-10)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker Compose production setup
- [ ] Kubernetes manifests
- [ ] Automated testing in pipeline
- [ ] Blue-green deployment

---

### **What NOT to Do in MVP** ❌

Jangan lakukan ini karena akan **SULIT untuk migrate** nanti:

1. **❌ Hardcode credentials** di code
   - ✅ Selalu gunakan `.env`

2. **❌ Campur concerns** (business logic di controller)
   - ✅ Pisahkan ke services layer

3. **❌ Skip database indexes**
   - ✅ Tambahkan index sejak awal

4. **❌ Buat tight coupling** antara components
   - ✅ Dependency injection & interfaces

5. **❌ Ignore error handling**
   - ✅ Centralized error handler

6. **❌ Buat monolithic functions** (1 function 500 lines)
   - ✅ Small, focused functions

7. **❌ Skip git commits**
   - ✅ Commit setiap fitur selesai

8. **❌ No documentation**
   - ✅ Comment code yang kompleks, update README

---

### **Quality Checklist Before Migration** ✅

Sebelum migrate ke production, pastikan MVP punya:

**Code Quality:**
- [ ] No console.log() in production code (use logger)
- [ ] All secrets in .env, not hardcoded
- [ ] Error handling di semua async functions
- [ ] Input validation di semua endpoints
- [ ] SQL injection prevention (parameterized queries)

**Architecture:**
- [ ] Clear separation of concerns (MVC/Service pattern)
- [ ] Reusable components/functions
- [ ] Config-driven, not code-driven
- [ ] Database migrations (bukan manual ALTER TABLE)

**Testing:**
- [ ] Minimal manual testing checklist documented
- [ ] Happy path tested
- [ ] Error scenarios tested
- [ ] Edge cases identified (even if not all tested)

**Documentation:**
- [ ] README with setup instructions
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] `.env.example` file exists

**Security Basics:**
- [ ] Passwords hashed (bcrypt)
- [ ] JWT tokens untuk auth
- [ ] File upload validation (type, size)
- [ ] No sensitive data in logs

---

## 🚀 Next Steps (Setelah Tugas Selesai)

Jika ingin lanjutkan jadi production app, lihat [plan-full.md](plan-full.md) untuk:
- Security hardening
- Scalability (multiple peers, load balancing)
- Advanced features (multiple roles, notifications, etc)
- Monitoring & observability
- Deployment strategy
- Dan masih banyak lagi...

**Dengan mengikuti design principles di atas, migration akan 10x lebih mudah!** 🎯

---

## 📚 Resources & Learning Materials

### Hyperledger Fabric
- [Official Fabric Docs](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Samples GitHub](https://github.com/hyperledger/fabric-samples)
- Tutorial: "Writing Your First Application" (wajib dibaca!)

### Node.js & Express
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Vue.js
- [Vue 3 Official Docs](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)

### PostgreSQL
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

---

## ⚠️ Common Pitfalls & How to Avoid

1. **Fabric network tidak start**
   - Pastikan Docker running
   - Check Docker memory allocation (min 4GB)
   - Baca error log dengan teliti

2. **CORS error di frontend**
   - Install `cors` package di backend
   - Configure properly: `app.use(cors())`

3. **JWT token tidak terkirim**
   - Check axios interceptor
   - Verify header format: `Authorization: Bearer <token>`

4. **File upload failed**
   - Check Multer configuration
   - Verify frontend sends `FormData`, bukan JSON

5. **Blockchain transaction failed**
   - Check chaincode installed & approved
   - Verify channel name & chaincode name match
   - Check Fabric connection profile

---

*Dokumen ini adalah versi simplified untuk tugas kuliah 1 bulan.*  
*Untuk production planning, refer to [plan-full.md](plan-full.md)*  
*Audit & rekomendasi: lihat [docs/AUDIT_PLAN.md](docs/AUDIT_PLAN.md)*  
*Last Updated: April 29, 2026*  
*Version: MVP 1.1 — Updated based on audit recommendations*
