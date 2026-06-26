# Prima - Sistem Kenaikan Pangkat Dosen Berbasis Blockchain 🎓

> **Hybrid Blockchain System** untuk pencatatan dan verifikasi kenaikan pangkat dosen menggunakan **PostgreSQL** (database) + **Hyperledger Fabric** (blockchain).

[![Status](https://img.shields.io/badge/Status-MVP%20Complete-success)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-brightgreen)]()
[![Frontend](https://img.shields.io/badge/Frontend-Vue.js%203-42b883)]()
[![Blockchain](https://img.shields.io/badge/Blockchain-Hyperledger%20Fabric-blue)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-blue)]()

---

## ⚡ Quick Start

**First time setup:**
```powershell
# 1. Setup Node.js in WSL (once)
.\setup-nodejs-wsl.ps1

# 2. Start all services
.\start-all.ps1
# Choose: 1) WSL mode (recommended)
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

**📖 Full Reference:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 🌟 Highlights

- ✅ **Blockchain Integration:** Semua kegiatan & usulan dicatat di Hyperledger Fabric untuk immutable audit trail
- ✅ **CouchDB State Database:** Rich queries untuk blockchain state (query by status, dosenId, date range)
- ✅ **Document Integrity:** SHA-256 hashing untuk detect file tampering
- ✅ **Hybrid Architecture:** Speed dari PostgreSQL + Security dari Blockchain
- ✅ **Real-time KUM Tracking:** Progress bar monitoring akumulasi poin dosen
- ✅ **Complete Workflow:** Upload → Verify → Proposal → SK Issuance
- ✅ **Audit Trail:** Full history tracking dari blockchain
- ✅ **14 API Endpoints:** Fully tested and documented

---

## 📚 Documentation Structure

Project ini memiliki **2 roadmap** berbeda sesuai kebutuhan:

### 1️⃣ [plan.md](plan.md) - **MVP untuk Tugas Kuliah** ✅ **CURRENT**
- ⏱️ **Timeline:** 1 bulan (4 minggu)
- 🎯 **Tujuan:** Proof of Concept untuk tugas kuliah
- 👥 **Resource:** 1-2 orang
- 📦 **Scope:** Core features only (upload, hash, verify, audit trail)
- ✅ **Deliverable:** Working demo + dokumentasi + video
- 📊 **Progress:** Week 1 ✅ | Week 2 ✅ | Week 3 🔄 | Week 4 ⏳

**Mulai dari sini jika:**
- Ini untuk tugas kuliah/akademik
- Timeline kamu terbatas (1-2 bulan)
- Butuh demo yang bisa jalan dengan fitur essential

### 2️⃣ [plan-full.md](plan-full.md) - **Production Roadmap**
- ⏱️ **Timeline:** 7-8 bulan
- 🎯 **Tujuan:** Production-ready enterprise system
- 👥 **Resource:** 10-12 orang (backend, frontend, DevOps, QA, security)
- 📦 **Scope:** Full features dengan security, scalability, monitoring, dll
- ✅ **Deliverable:** Deployed production app dengan 99.9% uptime

**Gunakan ini jika:**
- Mau develop untuk production/real deployment
- Ada budget & team untuk long-term development
- Butuh enterprise-grade system

---

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐
│   Vue.js    │◄───────►│  Express.js │◄───────►│   PostgreSQL     │
│  Frontend   │  HTTP   │   Backend   │  SQL    │   (Off-chain)    │
└─────────────┘         └──────┬──────┘         └──────────────────┘
                               │
                               │ Fabric SDK
                               ▼
                        ┌──────────────┐         ┌──────────────────┐
                        │  Hyperledger │◄───────►│   CouchDB x2     │
                        │    Fabric    │  State  │  (State DB)      │
                        │ (On-chain)   │         │  Org1 + Org2     │
                        └──────────────┘         └──────────────────┘
                        - 2 Peers (Org1, Org2)
                        - 1 Orderer
                        - Channel: primachannel
                        - Chaincode: prima
                        - CouchDB: Rich queries
```

### Data Flow
1. **Upload Kegiatan:** Frontend → Backend → PostgreSQL (data) → Fabric (hash) → CouchDB (state)
2. **Verify:** Admin verifikasi → Status update di PostgreSQL + Fabric → CouchDB state updated
3. **Audit Trail:** Query blockchain history → Tampilkan timeline di frontend
4. **Rich Queries:** Query CouchDB for filtering (by status, dosenId, date range)

---

## 🔄 Migration Path

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT JOURNEY                      │
└─────────────────────────────────────────────────────────────┘

  START HERE (Week 1-4)          CONTINUE HERE (Month 2-8)
┌──────────────────┐          ┌───────────────────────────┐
│                  │          │                           │
│   plan.md        │  ====>   │    plan-full.md           │
│   (MVP/POC)      │          │    (Production)           │
│                  │          │                           │
│ ✅ Core features │          │ ✅ Security hardening     │
│ ✅ Basic UI      │          │ ✅ Scalability            │
│ ✅ 1 peer        │          │ ✅ Monitoring             │
│ ✅ Simple auth   │          │ ✅ CI/CD                  │
│ ✅ Manual test   │          │ ✅ Advanced features      │
│                  │          │ ✅ Multiple environments  │
└──────────────────┘          └───────────────────────────┘
        ↓                                  ↓
   DEMO READY                      PRODUCTION READY
 (Tugas selesai!)                 (Real deployment)
```

**Kunci sukses migration:** Ikuti **Design Principles** di [plan.md](plan.md) sejak awal!

---

## � Quick Start

### Prerequisites
- **Node.js** v18+ & npm
- **PostgreSQL** 15+ (atau Docker)
- **Docker** & Docker Compose
- **Git**

### Installation

#### 1. Clone Repository
```bash
git clone <repo-url>
cd UsulanKenaikanPangkatBlockchain
```

#### 2. Setup Database
```bash
# Using Docker (Recommended)
docker-compose -f docker-compose.dev.yml up -d

# Database akan running di port 5434
# Credentials: postgres/postgres123
# Database: prima_db
```

#### 3. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Jalankan server
npm start

# Server akan running di http://localhost:3000
```

#### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev

# Frontend akan running di http://localhost:5173
```

#### 5. Setup Hyperledger Fabric (Optional - untuk blockchain features)
```bash
cd fabric-network

# Start Fabric network with CouchDB state database
.\start-network.ps1   # Windows PowerShell
# atau
./start-network.sh    # Linux/Mac

# Network includes:
# - 2 Peers (Org1, Org2)
# - 1 Orderer
# - 2 CouchDB instances (for rich queries)
# - Chaincode deployed automatically

# Verify CouchDB running:
docker ps | grep couchdb

# Access CouchDB Web UI (Fauxton):
# Org1: http://localhost:5984/_utils (admin/adminpw)
# Org2: http://localhost:7984/_utils (admin/adminpw)
```

**CouchDB State Database:**
- Enables rich queries (query by status, dosenId, date range)
- Web UI for inspecting blockchain state data
- Database: `primachannel_prima`
- Automatic index deployment from chaincode

### First Login

**Admin SDM:**
- Email: `dewi.lestari@prima.test`
- Password: `password123`

**Dosen:**
- Email: `budi.santoso@prima.test`
- Password: `password123`

**Superadmin:**
- Email: `admin@prima.test`
- Password: `password123`

---

## 📖 API Documentation

### Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register user baru
- `POST /api/v1/auth/login` - Login & get JWT token
- `GET /api/v1/auth/me` - Get current user profile

#### Reference Data
- `GET /api/v1/ref/kegiatan` - List semua jenis kegiatan
- `GET /api/v1/ref/kategori` - List kategori KUM

#### Kegiatan
- `POST /api/v1/kegiatan` - Upload kegiatan baru (with file)
- `GET /api/v1/kegiatan` - List kegiatan user
- `GET /api/v1/kegiatan/:id` - Detail kegiatan
- `PUT /api/v1/kegiatan/:id/verify` - Admin: Verify/Reject kegiatan
- `GET /api/v1/kegiatan/stats/dashboard` - Dashboard statistics

#### Usulan Kenaikan Pangkat
- `POST /api/v1/usulan` - Ajukan usulan kenaikan pangkat
- `GET /api/v1/usulan` - List usulan (filtered by role)
- `GET /api/v1/usulan/:id` - Detail usulan
- `PUT /api/v1/usulan/:id/proses` - Admin: Process usulan
- `PUT /api/v1/usulan/:id/tolak` - Admin: Reject usulan
- `PUT /api/v1/usulan/:id/terbitkan-sk` - Admin: Issue SK
- `GET /api/v1/usulan/:id/audit` - Get audit trail

#### System
- `GET /api/v1/health` - Health check (database, blockchain, uptime)

**Dokumentasi lengkap:** Lihat [docs/API_TESTING_GUIDE.md](docs/API_TESTING_GUIDE.md) atau import [docs/Prima.postman_collection.json](docs/Prima.postman_collection.json) ke Postman.

---

## 🎯 Features

### ✅ Completed (Week 1-2)
- [x] Database setup dengan schema hybrid (8 tables)
- [x] Hyperledger Fabric network running (2 peers, 1 orderer)
- [x] Chaincode deployed (`prima` v1.0)
- [x] Backend API (14 endpoints, 100% tested)
- [x] Authentication & Authorization (JWT + RBAC)
- [x] File upload & SHA-256 hashing
- [x] Blockchain integration (with fallback mode)
- [x] Audit trail logging
- [x] Postman collection & API documentation
- [x] Vue.js frontend with Tailwind CSS
- [x] Login & Dashboard pages
- [x] Kegiatan management (create, list, detail)
- [x] Usulan management (create, list, detail)
- [x] State management (Pinia)
- [x] Progress bar KUM tracking
- [x] Status badges
- [x] File upload component

### 🔄 In Progress (Week 3)
- [ ] Verifikasi page for Admin SDM
- [ ] Audit trail timeline component
- [ ] Document hash verification UI
- [ ] SK issuance workflow
- [ ] Complete responsive design

### ⏳ Planned (Week 4)
- [ ] End-to-end testing
- [ ] Video demo recording
- [ ] Laporan documentation
- [ ] Docker Compose full stack
- [ ] Deployment guide

---

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Test all endpoints
node test-all-endpoints.js

# Test specific module
node test-api-kegiatan.js
```

### Using Postman
1. Import [docs/Prima.postman_collection.json](docs/Prima.postman_collection.json)
2. Login dengan user test → Copy token
3. Set token di Authorization header
4. Test endpoints sesuai kebutuhan

---

## 🐛 Troubleshooting

### ⚠️ Chaincode Deployment Error (Broken Pipe)
**Symptoms:** Error saat `.\start-network.ps1`:
```
Error: docker build failed: write unix @->/var/run/docker.sock: write: broken pipe
```

**Quick Fix:** 
1. Restart Docker Desktop
2. Increase Docker resources (6GB RAM, 4 CPUs)
3. Run `.\restart-fabric.ps1`

📖 **Detailed Guide:** [QUICK_FIX_CHAINCODE.md](QUICK_FIX_CHAINCODE.md)  
📖 **Full Analysis:** [docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md](docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md)

### Database Connection Failed
```bash
# Check PostgreSQL container
docker ps | grep postgres

# Restart container jika perlu
docker restart prima_postgres_dev

# Check logs
docker logs prima_postgres_dev
```

### Backend Port Already in Use
```bash
# Kill process di port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Fabric Network Issues (General)
- **Quick troubleshooting:** [FABRIC_ISSUES.md](FABRIC_ISSUES.md)
- **Chaincode deployment:** [docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md](docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md)
- **Fallback mode:** Set `FABRIC_ENABLED=false` di `.env`
- Backend tetap bisa jalan tanpa blockchain (database-only mode)

### Frontend Cannot Connect to Backend
- Pastikan backend running di port 3000
- Check CORS settings di `backend/server.js`
- Verify axios baseURL di `frontend/src/api/config.js`

---

## 📁 Project Structure

```
UsulanKenaikanPangkatBlockchain/
├── backend/               # Express.js Backend
│   ├── config/           # Database & configuration
│   ├── controllers/      # (Optional - currently logic in routes)
│   ├── middleware/       # Auth middleware
│   ├── models/           # Database models
│   ├── routes/v1/        # API routes (versioned)
│   ├── services/         # (Future: business logic)
│   ├── uploads/          # Uploaded files
│   ├── utils/            # Helper functions
│   ├── validators/       # (Future: input validation)
│   └── server.js         # Entry point
│
├── chaincode/            # Hyperledger Fabric Chaincode
│   └── lib/
│       └── kegiatanContract.js  # Smart contract
│
├── database/             # Database schema & seeds
│   ├── schema-hybrid.sql       # Main schema (CANONICAL)
│   ├── seed.sql                # Sample data
│   └── setup-database.js       # Setup script
│
├── fabric-config/        # Fabric connection profiles
│   ├── connection-org1.json    # Connection profile
│   └── wallet/                 # Identity wallet
│
├── fabric-network/       # Fabric network scripts
│   ├── start-network.ps1       # Start Fabric (Windows)
│   ├── start-network.sh        # Start Fabric (Linux/Mac)
│   └── stop-network.ps1        # Stop Fabric
│
├── frontend/             # Vue.js Frontend
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # Reusable components
│   │   ├── router/       # Vue Router
│   │   ├── stores/       # Pinia stores
│   │   ├── views/        # Page components
│   │   └── App.vue       # Root component
│   └── package.json
│
├── docs/                 # Documentation
│   ├── API_TESTING_GUIDE.md
│   ├── Prima.postman_collection.json
│   ├── FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md  # Troubleshooting chaincode
│   ├── WEEK1_PROGRESS.md
│   └── WEEK2_COMPLETION_SUMMARY.md
│
├── docker-compose.dev.yml      # Docker Compose (PostgreSQL only)
├── plan.md                      # MVP Roadmap (1 month)
├── plan-full.md                 # Production Roadmap (7-8 months)
├── FABRIC_ISSUES.md            # Fabric troubleshooting (general)
├── QUICK_FIX_CHAINCODE.md      # Quick fix for chaincode deployment
└── README.md                    # This file
```

---

## 🔗 Useful Links

### Getting Started
- **Plan MVP:** [plan.md](plan.md)
- **Plan Production:** [plan-full.md](plan-full.md)
- **Database Quick Start:** [DATABASE_QUICKSTART.md](DATABASE_QUICKSTART.md)
- **Fabric Quick Start:** [FABRIC_QUICKSTART.md](FABRIC_QUICKSTART.md)

### API & Testing
- **API Testing Guide:** [docs/API_TESTING_GUIDE.md](docs/API_TESTING_GUIDE.md)
- **Postman Collection:** [docs/Prima.postman_collection.json](docs/Prima.postman_collection.json)

### Troubleshooting
- **🔥 Chaincode Quick Fix:** [QUICK_FIX_CHAINCODE.md](QUICK_FIX_CHAINCODE.md) ← Start here!
- **📖 Chaincode Deployment Issues:** [docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md](docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md)
- **Fabric Issues (General):** [FABRIC_ISSUES.md](FABRIC_ISSUES.md)

### Progress Reports
- **Week 1 Progress:** [docs/WEEK1_PROGRESS.md](docs/WEEK1_PROGRESS.md)
- **Week 2 Summary:** [docs/WEEK2_COMPLETION_SUMMARY.md](docs/WEEK2_COMPLETION_SUMMARY.md)

---

---

## 🛠️ Tech Stack

### Core Technologies
- **Frontend:** Vue.js 3, Pinia, Tailwind CSS, Axios
- **Backend:** Node.js, Express.js, multer, bcrypt, JWT
- **Blockchain:** Hyperledger Fabric v2.5+
- **Database:** PostgreSQL 15+
- **Containerization:** Docker, Docker Compose

### Additional (Production - see plan-full.md)
- **Caching:** Redis
- **Storage:** MinIO / AWS S3
- **Monitoring:** Prometheus + Grafana
- **Logging:** Loki / ELK Stack
- **Orchestration:** Kubernetes
- **CI/CD:** GitHub Actions

---

## 🔄 Migration Path

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT JOURNEY                      │
└─────────────────────────────────────────────────────────────┘

  START HERE (Week 1-4)          CONTINUE HERE (Month 2-8)
┌──────────────────┐          ┌───────────────────────────┐
│                  │          │                           │
│   plan.md        │  ====>   │    plan-full.md           │
│   (MVP/POC)      │          │    (Production)           │
│                  │          │                           │
│ ✅ Core features │          │ ✅ Security hardening     │
│ ✅ Basic UI      │          │ ✅ Scalability            │
│ ✅ 1 channel     │          │ ✅ Monitoring             │
│ ✅ Simple auth   │          │ ✅ CI/CD                  │
│ ✅ Manual test   │          │ ✅ Advanced features      │
│                  │          │ ✅ Multiple orgs          │
└──────────────────┘          └───────────────────────────┘
        ↓                                  ↓
   DEMO READY                      PRODUCTION READY
 (Tugas selesai!)                 (Real deployment)
```

**Kunci sukses migration:** Ikuti **Design Principles** di [plan.md](plan.md) sejak awal!

---

## 📋 Project Status

- [x] **Week 1:** Infrastructure Setup (100%)
- [x] **Week 2:** Backend API Development (100%)
- [x] **Week 3:** Frontend Development (85%)
- [ ] **Week 4:** Testing, Documentation & Finalisasi (40%)

**Current Phase:** MVP Development (Tugas Kuliah)  
**Next Milestone:** Complete Week 4 → Demo Ready

---

## 🤝 Contributing

Untuk development guidelines dan best practices, lihat:
- [plan.md](plan.md) - Section "Design Principles untuk Future-Proofing"
- [plan-full.md](plan-full.md) - Section "Compliance & Legal Considerations"

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Team

**Developer:** [Your Name]  
**Supervisor:** [Supervisor Name]  
**Institution:** [University Name]

---

## 📞 Support

Jika menemukan issues atau butuh bantuan:
1. Check [FABRIC_ISSUES.md](FABRIC_ISSUES.md) untuk troubleshooting Fabric
2. Check [DATABASE_QUICKSTART.md](DATABASE_QUICKSTART.md) untuk database issues
3. Create an issue di GitHub repository
4. Contact: [your-email@example.com]

---

**Last Updated:** Januari 2025  
**Version:** 1.0.0-mvp  
**Status:** ✅ Week 1-2 Complete | 🔄 Week 3 In Progress | ⏳ Week 4 Planned
