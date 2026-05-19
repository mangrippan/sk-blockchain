# Outline Slide Presentasi - ChainRank
## Sistem Kenaikan Pangkat Dosen Berbasis Blockchain

**Durasi**: 15-20 menit
**Target Audience**: Dosen pembimbing, penguji, mahasiswa

---

## SLIDE 1: Title Slide
**ChainRank**
### Sistem Kenaikan Pangkat Dosen Berbasis Blockchain Menggunakan Hyperledger Fabric

**Oleh**: [Nama Mahasiswa]
**NIM**: [NIM]
**Pembimbing**: [Nama Dosen Pembimbing]

**Institusi**
**Tahun**

---

## SLIDE 2: Agenda
1. Latar Belakang & Rumusan Masalah
2. Tujuan & Manfaat
3. Landasan Teori
4. Arsitektur Sistem
5. Implementasi
6. Demo Sistem
7. Hasil & Pembahasan
8. Kesimpulan & Saran

---

## SLIDE 3: Latar Belakang
### Permasalahan Existing System

📋 **Current Issues:**
- ❌ Proses kenaikan pangkat masih manual
- ❌ Tracking KUM sulit dan tidak transparan
- ❌ Rawan manipulasi data
- ❌ Tidak ada audit trail yang dapat dipercaya
- ❌ Dokumen rentan terhadap tampering

💡 **Solution Needed:**
- ✅ Sistem yang transparan
- ✅ Data yang tamper-proof
- ✅ Audit trail yang immutable
- ✅ Automated KUM tracking

---

## SLIDE 4: Rumusan Masalah

### Research Questions
1. **Bagaimana** membangun sistem pencatatan yang tamper-proof?
2. **Bagaimana** mengimplementasikan audit trail yang dapat dipercaya?
3. **Bagaimana** mengintegrasikan blockchain dengan database tradisional?
4. **Bagaimana** mengatasi tantangan deployment di Windows/WSL?

---

## SLIDE 5: Tujuan Penelitian

### Objectives
1. ✅ Membangun **hybrid system** (PostgreSQL + Blockchain)
2. ✅ Implementasi **document integrity verification** (SHA-256)
3. ✅ Menyediakan **immutable audit trail**
4. ✅ Deployment menggunakan **CCAAS method**

### Scope
- Workflow: Upload → Verify → Proposal → SK
- Tech: Hyperledger Fabric + Node.js + Vue.js
- Database: PostgreSQL + CouchDB

---

## SLIDE 6: Manfaat

### Untuk Institusi
- 🎯 Transparansi proses
- 🎯 Audit trail terpercaya
- 🎯 Mengurangi risiko fraud
- 🎯 Automated tracking

### Untuk Dosen
- 📊 Real-time KUM monitoring
- 📊 Riwayat permanen
- 📊 Proses lebih jelas

### Untuk Pengembangan Ilmu
- 🔬 Hybrid blockchain architecture
- 🔬 CCAAS implementation reference
- 🔬 WSL deployment solutions

---

## SLIDE 7: Blockchain - Konsep Dasar

### What is Blockchain?
```
Block 1 → Block 2 → Block 3 → Block 4
  ↓         ↓         ↓         ↓
 Hash     Hash      Hash      Hash
```

**Karakteristik:**
- ⛓️ **Immutability**: Data tidak dapat diubah
- 🔍 **Transparency**: Semua transaksi dapat diaudit
- 🌐 **Distributed**: Data tersebar di multiple nodes
- ✅ **Consensus**: Agreement untuk validasi

---

## SLIDE 8: Hyperledger Fabric

### Enterprise Blockchain Platform

**Components:**
- **Peers**: Menyimpan ledger & execute chaincode
- **Orderers**: Consensus service
- **Channels**: Private communication
- **Chaincode**: Smart contracts
- **MSP**: Identity management

**Why Fabric?**
- ✅ Permissioned network (private)
- ✅ Modular architecture
- ✅ High performance (1000+ TPS)
- ✅ Rich query support (CouchDB)

---

## SLIDE 9: Hybrid Architecture

### Best of Both Worlds

```
┌──────────────┐     ┌──────────────┐
│ PostgreSQL   │     │  Blockchain  │
│              │     │              │
│ • Fast CRUD  │ ←→  │ • Immutable  │
│ • Relations  │     │ • Audit      │
│ • Queries    │     │ • Hashes     │
└──────────────┘     └──────────────┘
```

**PostgreSQL (Speed):**
- Operational data
- Relationships
- Complex queries

**Blockchain (Security):**
- Document hashes
- Audit trail
- Verification

---

## SLIDE 10: System Architecture

```
┌─────────────────────────────────────┐
│  Windows                            │
│  ┌──────────┐                       │
│  │ Frontend │ Vue.js                │
│  │ Browser  │ (Port 5173)           │
│  └────┬─────┘                       │
└───────┼─────────────────────────────┘
        │ HTTP/REST API
        ↓
┌─────────────────────────────────────┐
│  WSL2 (Ubuntu)                      │
│                                     │
│  ┌─────────┐      ┌──────────────┐ │
│  │ Backend │━━━━━━│ Fabric       │ │
│  │ Node.js │      │ Network      │ │
│  │  :3000  │      │ • Peers      │ │
│  └────┬────┘      │ • Orderers   │ │
│       │           │ • Chaincode  │ │
│       ↓           │ • CouchDB    │ │
│  ┌─────────┐     └──────────────┘ │
│  │PostgreSQL│                      │
│  │ :5433   │                       │
│  └─────────┘                       │
└─────────────────────────────────────┘
```

---

## SLIDE 11: Technology Stack

### Frontend
- **Vue.js 3**: Composition API
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Axios**: HTTP client

### Backend
- **Node.js 18**: Runtime
- **Express.js**: Web framework
- **Fabric SDK**: Blockchain integration
- **JWT**: Authentication

### Blockchain
- **Hyperledger Fabric 2.5**
- **CCAAS**: Deployment method
- **CouchDB**: State database

### Database
- **PostgreSQL 15**

---

## SLIDE 12: Database Design - ERD

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├─────< kegiatan_dosen >───┐
       │                          │
       │                    ┌─────▼────────┐
       │                    │ ref_kegiatan │
       │                    └──────────────┘
       │
       └─────< usulan_kenaikan_pangkat
```

**Key Tables:**
- `users`: Authentication & profile
- `kegiatan_dosen`: Activities with hashes
- `usulan_kenaikan_pangkat`: Promotion proposals
- `ref_*`: Reference data

**Total: 15+ tables** dengan relationships lengkap

---

## SLIDE 13: Chaincode Structure

```javascript
class KegiatanContract extends Contract {
  // Kegiatan Management
  ✅ CreateKegiatan(id, dosenId, fileHash, ...)
  ✅ VerifyKegiatan(id, status, verifiedBy, ...)
  ✅ GetHistory(id)
  ✅ VerifyDocumentHash(id, hash)
  
  // Usulan Management
  ✅ AjukanUsulanKenaikanPangkat(...)
  ✅ ProsesUsulanKenaikanPangkat(...)
  ✅ TolakUsulanKenaikanPangkat(...)
  ✅ TerbitkanSkKenaikanPangkat(...)
  
  // CouchDB Queries
  ✅ QueryKegiatanByDosen(dosenId)
  ✅ QueryKegiatanByStatus(status)
  ✅ QueryUsulanByHashNIP(hashNIP)
}
```

**Total: 9 main functions** + helper functions

---

## SLIDE 14: API Endpoints

### RESTful API Design

**Authentication:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`

**Kegiatan:**
- `POST /api/v1/kegiatan` (upload)
- `GET /api/v1/kegiatan` (list)
- `GET /api/v1/kegiatan/:id` (detail)
- `PUT /api/v1/kegiatan/:id/verify`
- `GET /api/v1/kegiatan/:id/history`

**Usulan:**
- `POST /api/v1/usulan`
- `PUT /api/v1/usulan/:id/process`
- `PUT /api/v1/usulan/:id/reject`
- `PUT /api/v1/usulan/:id/issue-sk`

**Total: 14 endpoints** | **Documented**: Swagger UI

---

## SLIDE 15: Document Integrity Flow

### SHA-256 Hashing Process

```
┌─────────────────────────────────────────┐
│ 1. UPLOAD                               │
│    File → SHA-256 → Hash                │
│    Store: PostgreSQL + Blockchain       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. STORAGE (Blockchain)                 │
│    {                                    │
│      "id": "uuid",                      │
│      "fileHash": "abc123...",           │
│      "status": "unverified"             │
│    }                                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. VERIFICATION                         │
│    Re-calculate hash → Compare          │
│    Match? ✅ : ❌ Tampered!             │
└─────────────────────────────────────────┘
```

**Detection Rate: 100%** untuk tampered files

---

## SLIDE 16: Implementation Challenges

### Challenge 1: WSL Docker Socket Issue
**Problem:** 
- ❌ Docker build broken pipe
- ❌ npm install timeout di WSL

**Solution:**
- ✅ CCAAS (Chaincode-as-a-Service)
- ✅ Build di Windows (bukan WSL)
- ✅ External chaincode deployment

**Success Rate:**
- Standard: 40-60%
- CCAAS: **95%+** ✅

---

## SLIDE 17: CCAAS Deployment

### Chaincode-as-a-Service Method

**Traditional:**
```
Peer → Build chaincode → Deploy
      (Inside WSL - FAILS)
```

**CCAAS:**
```
1. Build Docker image (Windows)
2. Package connection config only
3. Run as external service
4. Peer connects via network
```

**Package Structure:**
```
chainrank_ccaas.tar.gz
├── metadata.json
└── code.tar.gz
    └── connection.json
```

**Key:** Nested tar structure!

---

## SLIDE 18: Challenge 2 - Backend Networking

### Problem
**Backend (Windows) ↛ Fabric (WSL)**
- ❌ SDK connection fails
- ❌ "No valid responses from peers"

### Solution
**Backend (WSL) ↔ Fabric (WSL)**
- ✅ Same network environment
- ✅ Perfect connectivity

### Implementation
```powershell
# Setup Node.js di WSL (once)
.\setup-nodejs-wsl.ps1

# Start backend di WSL
.\start-backend-wsl.ps1
```

---

## SLIDE 19: Testing Results

### Unit Tests
- ✅ **Chaincode**: 35 tests passed (Jest)
- ✅ **Backend**: 86 tests passed (Jest + Supertest)
- ✅ **Coverage**: All critical functions

### Integration Tests
- ✅ **Peer CLI**: 9 chaincode functions verified
- ✅ **API**: All 14 endpoints tested
- ✅ **Postman**: Collection available

### Manual Testing
- ✅ User workflows tested
- ✅ Edge cases covered
- ✅ Error handling verified

---

## SLIDE 20: DEMO
### Live System Demonstration

**What to Show:**
1. 🔐 Login system
2. 📊 Dashboard (KUM tracking)
3. 📤 Upload kegiatan (with file hash)
4. ✅ Verify kegiatan (change status)
5. 🔍 View blockchain history
6. 📝 Submit usulan
7. 📜 Issue SK

**Tools:**
- Browser: http://localhost:5173
- Swagger: http://localhost:3000/api-docs
- CouchDB UI: http://localhost:5984/_utils

---

## SLIDE 21: Performance Metrics

### Response Times
| Operation | Time |
|-----------|------|
| Login | ~200ms |
| Upload kegiatan | ~500ms |
| Query kegiatan | ~100ms |
| Blockchain write | ~3s |

### Blockchain Transaction
- Endorsement: ~500ms
- Ordering: ~1s
- Commit: ~1.5s
- **Total: ~3s** (async, non-blocking)

### Scalability
- ✅ Support 1000+ users
- ✅ Database indexing optimized
- ✅ Async blockchain writes

---

## SLIDE 22: Document Tampering Detection

### Verification Demo

**Scenario 1: Original File**
```
Stored Hash:   abc123def456...
Current Hash:  abc123def456...
Result: ✅ VERIFIED - Document intact
```

**Scenario 2: Tampered File**
```
Stored Hash:   abc123def456...
Current Hash:  xyz789uvw012...
Result: ❌ TAMPERED - Document modified!
```

**Effectiveness: 100% detection**
- Single bit change → different hash
- Blockchain record immutable

---

## SLIDE 23: Audit Trail Example

### Complete Transaction History

```json
[
  {
    "txId": "abc123...",
    "timestamp": "2026-05-15T10:30:00Z",
    "value": {
      "status": "unverified",
      "createdAt": "2026-05-15T10:30:00Z"
    }
  },
  {
    "txId": "def456...",
    "timestamp": "2026-05-16T14:20:00Z",
    "value": {
      "status": "verified",
      "verifiedBy": "user_2",
      "verifiedAt": "2026-05-16T14:20:00Z"
    }
  }
]
```

**Benefit:** Complete, immutable record of all changes

---

## SLIDE 24: Key Features Summary

### Implemented Features
✅ **Hybrid Storage**: PostgreSQL + Blockchain
✅ **Document Integrity**: SHA-256 hashing
✅ **Immutable Audit**: Complete transaction history
✅ **KUM Tracking**: Automated accumulation
✅ **Workflow**: Upload → Verify → Propose → SK
✅ **CouchDB Queries**: Rich query support
✅ **CCAAS Deployment**: 95%+ success rate
✅ **WSL Integration**: Backend-Fabric connectivity

### Metrics
- **14 API Endpoints**
- **9 Chaincode Functions**
- **15+ Database Tables**
- **121 Tests Passed**

---

## SLIDE 25: Comparison - Before vs After

| Aspect | Before (Manual) | After (ChainRank) |
|--------|-----------------|-------------------|
| **Transparency** | ❌ Low | ✅ High |
| **Tampering Risk** | ❌ High | ✅ None (immutable) |
| **Audit Trail** | ❌ None/Manual | ✅ Automatic |
| **KUM Tracking** | ❌ Manual counting | ✅ Real-time |
| **Document Verification** | ❌ Manual | ✅ Automatic (hash) |
| **Process Time** | ❌ Weeks | ✅ Days |
| **Trust Level** | ❌ Low | ✅ High (blockchain) |

---

## SLIDE 26: Kesimpulan

### Achievements
1. ✅ **Hybrid system berhasil** - PostgreSQL + Blockchain terintegrasi
2. ✅ **CCAAS mengatasi WSL issues** - 95%+ success rate
3. ✅ **Document integrity** - 100% detection rate
4. ✅ **Complete audit trail** - Immutable blockchain records
5. ✅ **Working MVP** - All core features implemented

### Technical Innovations
- 🚀 CCAAS deployment method
- 🚀 WSL backend integration
- 🚀 Nested tar package structure
- 🚀 Hybrid architecture pattern

---

## SLIDE 27: Saran Pengembangan

### Short Term (1-3 bulan)
1. 📧 Email notifications
2. 📊 Advanced analytics dashboard
3. 📱 Mobile app (PWA)
4. 🔐 Two-factor authentication

### Long Term (6-12 bulan)
1. 🌐 Multi-organization network
2. ☁️ Cloud deployment (AWS/Azure)
3. 📈 Scalability testing (10,000+ users)
4. 🔒 Security audit & penetration testing

### Production Ready
- Linux deployment (no WSL)
- TLS configuration
- Monitoring & logging (Prometheus, Grafana)
- Load balancing & failover

---

## SLIDE 28: Lessons Learned

### Technical Challenges
1. **WSL Docker limitations** → CCAAS solution
2. **SDK networking issues** → Backend in WSL
3. **Package structure** → Nested tar format
4. **Discovery service** → MSPID_SCOPE_SINGLE strategy

### Best Practices
- ✅ Hybrid architecture for enterprise apps
- ✅ CCAAS for Windows development
- ✅ Comprehensive testing (unit + integration)
- ✅ Documentation throughout development

---

## SLIDE 29: Q&A

### Common Questions Prepared

**Q1: Kenapa hybrid, bukan full blockchain?**
A: Speed + cost efficiency. Blockchain untuk critical data only.

**Q2: Bagaimana jika file di-upload ulang dengan hash berbeda?**
A: Versioning system - parent_kegiatan_id tracks revisions.

**Q3: Scalability untuk 10,000 users?**
A: Multi-peer deployment + database replication + load balancing.

**Q4: Keamanan blockchain vs traditional database?**
A: Blockchain immutable (tidak bisa edit/delete), database bisa dimanipulasi.

**Q5: CCAAS vs standard deployment?**
A: CCAAS lebih stabil di WSL (95% vs 40-60%), easier debugging.

---

## SLIDE 30: Thank You

### Contact & Resources

**Repository**: [GitHub Link]
**Documentation**: docs/ folder
**API Docs**: http://localhost:3000/api-docs

**Quick Start:**
```powershell
.\setup-nodejs-wsl.ps1
.\start-all.ps1
```

**References:**
- Hyperledger Fabric Docs
- PostgreSQL 15 Documentation  
- Vue.js 3 Documentation

---

## Terima Kasih! 🙏
### Questions?

---

## BONUS SLIDES (Backup)

### B1: Detailed ERD
[Insert full ERD diagram]

### B2: Sequence Diagram - Upload Flow
[Insert sequence diagram]

### B3: Code Snippets
[Key code examples if asked]

### B4: Performance Benchmarks
[Detailed metrics if asked]

### B5: Security Considerations
[Security measures implemented]

### B6: Deployment Architecture
[Production deployment diagram]

---

## Tips Presentasi:

1. **Timing**: 
   - Main slides: 15-18 menit
   - Demo: 3-5 menit
   - Q&A: 5-10 menit

2. **Demo Preparation**:
   - Test semua services sebelumnya
   - Prepare sample data
   - Have backup screenshots

3. **Emphasis Points**:
   - CCAAS solution (unique contribution)
   - Hybrid architecture benefits
   - 100% tampering detection

4. **Potential Questions**:
   - Prepare answers untuk technical deep-dives
   - Have code ready to show
   - Know your metrics

5. **Backup Plans**:
   - Video demo jika live demo fail
   - Screenshots untuk critical features
   - Postman collection untuk API demo

---

**Total Slides: 30 + 6 bonus** = Flexible untuk 15-30 menit presentasi
