# Week 1 Progress: Setup Infrastruktur

## ✅ Completed

### 1.1 Repository Structure
```
UsulanKenaikanPangkatBlockchain/
├── .git/
├── .vscode/
│   ├── extensions.json    # VS Code extensions recommendations
│   └── settings.json       # Editor settings (Prettier, ESLint)
├── backend/
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers (thin)
│   ├── services/          # Business logic (thick)
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Helper functions
│   ├── models/            # Database models
│   └── validators/        # Input validation
├── frontend/              # Vue.js app (empty for now)
├── chaincode/             # Hyperledger Fabric chaincode
├── docs/                  # Additional documentation
├── uploads/               # File storage (development only)
│   └── .gitkeep
├── .env                   # Environment variables (NOT in git)
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── README.md              # Project overview
├── plan.md                # MVP roadmap
├── plan-full.md           # Production roadmap
└── MIGRATION.md           # Migration guide
```

### 1.2 Tools Verification

#### ✅ All Tools Installed:
- **Git:** v2.45.1 ✅
- **Node.js:** v23.1.0 ✅
- **npm:** v10.9.0 ✅ (execution policy fixed)
- **Docker:** v29.4.0 ✅
- **Docker Compose:** v5.1.2 ✅
- **PostgreSQL:** Running in Docker container ✅

### 1.3 Database Setup ✅ COMPLETED

#### PostgreSQL Docker Container
- Container name: `chainrank_postgres_dev`
- Image: `postgres:15-alpine`
- Port: `5432` (mapped to localhost)
- Database: `chainrank_db`
- User: `postgres`
- Password: `postgres123`

#### Database Schema
Schema berhasil dibuat dengan 3 tabel:
1. **users** - User authentication & profile
2. **kegiatan_dosen** - Dosen activities/achievements
3. **audit_logs** - Audit trail untuk semua perubahan

#### Seed Data
Data sample berhasil di-load:
- **6 users** (1 admin, 3 dosen, 1 pimpinan, 1 test dosen)
- **8 kegiatan** (4 verified, 3 pending, 1 rejected)
- Default password untuk semua user: `password123`

#### Quick Access Commands
```powershell
# Start database
docker compose -f docker-compose.dev.yml up -d

# Stop database
docker compose -f docker-compose.dev.yml down

# Access PostgreSQL CLI
docker exec -it chainrank_postgres_dev psql -U postgres -d chainrank_db

# Reset database (delete all data)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

Lihat [DATABASE_QUICKSTART.md](../DATABASE_QUICKSTART.md) untuk detail lengkap.

### 1.4 Environment Variables ✅ COMPLETED

File `.env` berhasil dibuat di folder `backend/` dengan konfigurasi:
- Database connection (host, port, credentials)
- JWT secrets
- Server configuration
- CORS settings

---

## 🎯 Week 1 Progress Summary

### Completed Tasks (Updated April 30, 2026)

- [x] **1.1 Repository Structure** - Full folder structure created
- [x] **1.2 Install Tools** - All tools verified working
- [x] **1.3 Database Setup** - PostgreSQL running in Docker with schema + seed data
- [x] **1.4 Environment Variables** - .env configured
- [ ] **1.5 Hyperledger Fabric Network** - NOT STARTED YET
- [ ] **1.6 Docker Compose Full Stack** - Partially done (only DB for now)

### What's Next

#### Immediate Next Steps:
1. **Setup Hyperledger Fabric test-network** (Task 1.5)
   - Clone fabric-samples
   - Download Fabric binaries
   - Start test-network
   - Test chaincode deployment

2. **Backend Development** (Start Week 2)
   - Install npm dependencies in backend folder
   - Create database connection module
   - Build basic API endpoints
   - Test database connectivity from Node.js

---

## 🔧 Next Steps: Install Missing Tools

**CATATAN:** Section ini sudah tidak relevan karena semua tools sudah terinstall.
Lihat section "What's Next" di atas untuk langkah selanjutnya.

<details>
<summary>Arsip: Installation Instructions (Sudah selesai)</summary>

### Step 1: Fix npm Execution Policy (PowerShell Issue)

**Problem:** PowerShell execution policy blocking npm

**Solution:** Run PowerShell as Administrator, then:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Verify:**
```powershell
npm --version
```

### Step 2: Install Docker Desktop for Windows

**Download:** https://www.docker.com/products/docker-desktop/

**Installation:**
1. Download Docker Desktop installer
2. Run installer
3. Restart computer if required
4. Open Docker Desktop
5. Wait until "Docker Desktop is running"

**Verify:**
```powershell
docker --version
docker compose version
```

**Important for Hyperledger Fabric:**
- Docker Desktop Settings → Resources:
  - CPUs: Minimum 2, Recommended 4
  - Memory: Minimum 4GB, Recommended 8GB
  - Disk: Minimum 20GB free space

### Step 3: Install PostgreSQL 15

**Option A: Official Installer (Recommended)**
1. Download: https://www.postgresql.org/download/windows/
2. Run installer
3. During installation:
   - Port: `5432` (default)
   - Password: Set strong password (note it down!)
   - Locale: Default
4. Add to PATH (installer should do this automatically)

**Option B: Using Chocolatey (if you have it)**
```powershell
choco install postgresql15
```

**Verify:**
```powershell
psql --version
```

**Setup:**
```powershell
# Connect to PostgreSQL
psql -U postgres

# You'll be prompted for password
# Then in psql prompt:
CREATE DATABASE chainrank_db;
\q
```

### Step 4: Update .env with PostgreSQL Password

Edit `.env` file:
```env
DB_PASSWORD=your_actual_postgres_password_here
```

</details>

---

## ✅ Installation Checklist (COMPLETED)

- [x] Fix npm execution policy ✅
- [x] Verify `npm --version` works ✅
- [x] Install Docker Desktop ✅
- [x] Verify Docker is running ✅
- [x] Configure Docker resources (4GB RAM minimum) ✅
- [x] PostgreSQL running in Docker ✅
- [x] Database `chainrank_db` created ✅
- [x] Schema tables created ✅
- [x] Seed data loaded ✅
- [x] `.env` configured ✅

---

## 📌 Important Resources

- **Database Quick Reference:** See [DATABASE_QUICKSTART.md](../DATABASE_QUICKSTART.md)
- **Schema File:** [database/schema.sql](../database/schema.sql)
- **Seed Data:** [database/seed.sql](../database/seed.sql)
- **Docker Compose:** [docker-compose.dev.yml](../docker-compose.dev.yml)

---

**Current Status:** Week 1 - 80% Complete | Database ✅ | Fabric ⏳ | Ready for Backend Development

