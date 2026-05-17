# Laporan Tugas - ChainRank Outline

**Judul:** Sistem Kenaikan Pangkat Dosen Berbasis Blockchain Menggunakan Hyperledger Fabric  
**Penulis:** [Nama Anda]  
**NIM:** [NIM Anda]  
**Mata Kuliah:** [Nama Mata Kuliah]  
**Dosen Pembimbing:** [Nama Dosen]  
**Tanggal:** [Tanggal Submission]

---

## Format Laporan

- **Font:** Times New Roman 12pt
- **Spacing:** 1.5 lines
- **Margins:** 2.5cm (all sides)
- **Pages:** 15-25 halaman (excluding appendix)
- **Format:** PDF

---

## BAB I: PENDAHULUAN

### 1.1 Latar Belakang (1-2 halaman)

**Poin-poin yang harus dicakup:**

1. **Konteks Masalah:**
   - Proses kenaikan pangkat dosen di Indonesia membutuhkan akumulasi poin Kredit Unit Mutu (KUM)
   - Dokumen pendukung (SK, bukti kegiatan) rawan manipulasi dan kehilangan
   - Sulitnya tracking history dan verifikasi keaslian dokumen

2. **Motivasi Blockchain:**
   - Blockchain menawarkan immutability (data tidak bisa diubah)
   - Distributed ledger memastikan transparency
   - Smart contracts untuk automasi proses

3. **Mengapa Hyperledger Fabric:**
   - Permissioned blockchain (cocok untuk institusi)
   - Support for identity management & privacy
   - Modular architecture untuk enterprise

**Contoh Paragraf:**
```
Proses kenaikan pangkat dosen di perguruan tinggi Indonesia diatur oleh 
sistem Kredit Unit Mutu (KUM) yang mensyaratkan akumulasi poin dari berbagai 
kegiatan akademik. Namun, sistem konvensional berbasis dokumen fisik dan 
spreadsheet memiliki beberapa kelemahan, antara lain: rawan manipulasi data, 
kesulitan tracking history perubahan, dan tidak adanya mekanisme verifikasi 
keaslian dokumen. Teknologi blockchain, khususnya Hyperledger Fabric, 
menawarkan solusi dengan sifat immutability dan transparency yang dapat 
meningkatkan integritas dan akuntabilitas proses kenaikan pangkat.
```

### 1.2 Rumusan Masalah (½ halaman)

**Format:**
1. Bagaimana merancang sistem pencatatan kegiatan dosen yang tidak dapat dimanipulasi?
2. Bagaimana mengintegrasikan blockchain dengan database tradisional untuk performa optimal?
3. Bagaimana memvalidasi integritas dokumen pendukung menggunakan hashing?
4. Bagaimana menyediakan audit trail yang transparan dan tidak dapat diubah?

### 1.3 Tujuan Penelitian (½ halaman)

**Format:**
1. Merancang dan mengimplementasikan sistem hybrid (PostgreSQL + Hyperledger Fabric) untuk kenaikan pangkat dosen
2. Mengimplementasikan smart contract untuk automasi validasi dan state transition
3. Mengimplementasikan hashing SHA-256 untuk verifikasi integritas dokumen
4. Menyediakan audit trail berbasis blockchain untuk transparency

### 1.4 Batasan Masalah (½ halaman)

**Poin:**
- Sistem berfokus pada proof of concept (MVP), bukan production-ready
- Fabric network menggunakan test-network (single channel, 2 organizations)
- Tidak mencakup aspek legal dan compliance detail
- Authentication sederhana (JWT), tidak full SSO/LDAP
- File storage lokal, belum distributed (MinIO/S3)

### 1.5 Manfaat Penelitian (½ halaman)

**Untuk Institusi:**
- Meningkatkan integritas data kenaikan pangkat
- Mengurangi fraud dan manipulasi dokumen
- Mempermudah audit dan compliance

**Untuk Dosen:**
- Transparansi proses kenaikan pangkat
- Real-time tracking progress KUM
- Riwayat kegiatan terdokumentasi permanen

**Untuk Peneliti:**
- Studi kasus implementasi Hyperledger Fabric
- Reference architecture hybrid blockchain

### 1.6 Sistematika Penulisan (½ halaman)

**Daftar isi:**
- BAB I: Pendahuluan
- BAB II: Landasan Teori
- BAB III: Analisis dan Perancangan Sistem
- BAB IV: Implementasi
- BAB V: Pengujian dan Hasil
- BAB VI: Kesimpulan dan Saran

---

## BAB II: LANDASAN TEORI

### 2.1 Sistem Kenaikan Pangkat Dosen (1 halaman)

**Sub-topik:**
- Definisi jabatan fungsional dosen
- Kredit Unit Mutu (KUM)
- Syarat kenaikan pangkat (Permenpan RB)
- Kategori kegiatan: Pendidikan, Penelitian, Pengabdian, Penunjang

**Referensi:** Permenpan RB tentang Jabatan Fungsional Dosen

### 2.2 Blockchain Technology (2 halaman)

#### 2.2.1 Definisi Blockchain
- Distributed ledger technology
- Decentralization & immutability
- Consensus mechanism

#### 2.2.2 Komponen Blockchain
- Block structure (header, body)
- Hash & cryptographic linkage
- Merkle tree
- Smart contracts

#### 2.2.3 Jenis Blockchain
- Public vs Private
- Permissionless vs Permissioned

**Referensi:** Nakamoto (Bitcoin whitepaper), Hyperledger documentation

### 2.3 Hyperledger Fabric (2-3 halaman)

#### 2.3.1 Arsitektur Hyperledger Fabric
- Peers (endorsing, committing)
- Orderer (consensus)
- Certificate Authority (CA)
- Channels (privacy)
- Chaincode (smart contract)

#### 2.3.2 Transaction Flow
1. Client proposes transaction
2. Endorsing peers execute & endorse
3. Client collects endorsements
4. Submit to orderer
5. Orderer creates block
6. Peers validate & commit

#### 2.3.3 Keunggulan Fabric untuk Enterprise
- Modular architecture
- Pluggable consensus
- Identity management (MSP)
- Private data collections
- Performance (1000+ TPS)

**Referensi:** Hyperledger Fabric documentation, Androulaki et al. (2018)

### 2.4 Database Hybrid Architecture (1 halaman)

**Konsep:**
- On-chain: Immutable audit trail, hash, metadata
- Off-chain: Large data, files, fast queries
- Best of both worlds: Security + Performance

**Contoh Implementasi:**
- Ethereum + IPFS
- Fabric + PostgreSQL/MongoDB

### 2.5 Cryptographic Hashing (1 halaman)

#### 2.5.1 SHA-256
- Definisi & properties (deterministic, collision-resistant)
- Use cases: File integrity, digital signature

#### 2.5.2 Document Integrity Verification
- Hash original document → store on blockchain
- Re-hash later → compare with blockchain
- Detect tampering if hash mismatch

**Referensi:** NIST standards on cryptographic hashing

### 2.6 Teknologi Pendukung (1 halaman)

#### 2.6.1 PostgreSQL
- Relational database
- ACID properties
- Schema design

#### 2.6.2 Node.js & Express.js
- Backend framework
- RESTful API

#### 2.6.3 Vue.js
- Frontend framework
- Reactive programming

**Referensi:** Official documentation masing-masing teknologi

---

## BAB III: ANALISIS DAN PERANCANGAN SISTEM

### 3.1 Analisis Kebutuhan (1-2 halaman)

#### 3.1.1 Kebutuhan Fungsional
1. User dapat register dan login
2. Dosen dapat upload kegiatan dengan file PDF
3. Admin dapat memverifikasi/menolak kegiatan
4. Sistem menghitung akumulasi KUM
5. Dosen dapat mengajukan usulan kenaikan pangkat
6. Admin dapat memproses usulan dan menerbitkan SK
7. Sistem menyimpan audit trail di blockchain
8. Sistem dapat memverifikasi integritas dokumen

#### 3.1.2 Kebutuhan Non-Fungsional
1. **Security:** JWT authentication, RBAC
2. **Performance:** Response time <2s
3. **Scalability:** Support 100+ users (MVP)
4. **Usability:** User-friendly UI
5. **Reliability:** 99% uptime (development)
6. **Maintainability:** Modular code architecture

### 3.2 Arsitektur Sistem (2-3 halaman)

#### 3.2.1 Arsitektur Umum (High-Level)

**Diagram:**
```
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐
│   Vue.js    │◄───────►│  Express.js │◄───────►│   PostgreSQL     │
│  Frontend   │  HTTP   │   Backend   │  SQL    │   (Off-chain)    │
└─────────────┘         └──────┬──────┘         └──────────────────┘
                               │
                               │ Fabric SDK
                               ▼
                        ┌──────────────┐
                        │  Hyperledger │
                        │    Fabric    │
                        │ (On-chain)   │
                        └──────────────┘
```

**Penjelasan:**
- Frontend: User interface (browser-based)
- Backend: Business logic, API gateway
- PostgreSQL: Fast queries, structured data
- Hyperledger Fabric: Immutable audit trail, hashes

#### 3.2.2 Arsitektur Blockchain (Fabric Network)

**Diagram:**
```
┌──────────────┐       ┌──────────────┐
│   Org1MSP    │       │   Org2MSP    │
│  (University)│       │  (Verifier)  │
├──────────────┤       ├──────────────┤
│  Peer0.org1  │       │  Peer0.org2  │
│  (Endorser)  │       │  (Endorser)  │
└──────┬───────┘       └──────┬───────┘
       │                      │
       └──────────┬───────────┘
                  │
           ┌──────▼───────┐
           │   Orderer    │
           │  (Solo/Raft) │
           └──────────────┘
```

**Komponen:**
- 2 Organizations: Org1 (University), Org2 (External Verifier)
- 2 Peers: peer0.org1, peer0.org2
- 1 Orderer: orderer.example.com
- 1 Channel: mychannel
- Chaincode: chainrank

#### 3.2.3 Data Flow Architecture

**On-chain vs Off-chain:**

| Data | Storage | Reason |
|------|---------|--------|
| File PDF | Off-chain (local/S3) | Size >1MB, not blockchain-suitable |
| File Hash | On-chain (Fabric) | Small (64 char), immutable |
| User credentials | Off-chain (PostgreSQL) | Privacy, fast auth |
| Kegiatan metadata | Off-chain (PostgreSQL) | Fast queries, joins |
| State transitions | On-chain (Fabric) | Audit trail, immutability |
| SK issuance | Both | Hash on-chain, file off-chain |

### 3.3 Perancangan Database (2 halaman)

#### 3.3.1 Entity Relationship Diagram (ERD)

**[Insert ERD Diagram Here]**

**Entities:**
- users (id, email, password_hash, role)
- kegiatan_dosen (id, user_id, ref_kegiatan_id, deskripsi, file_path, file_hash, status, poin_kum, tx_id_fabric)
- usulan_kenaikan_pangkat (id, user_id, jabatan_tujuan, total_kum, status, sk_file_path, sk_file_hash, tx_id_fabric)
- ref_kegiatan_kum (id, kategori_id, nama_kegiatan, poin_kum_default)
- ref_kategori_kum (id, nama_kategori, deskripsi)

#### 3.3.2 Schema PostgreSQL

**Highlights dari schema-hybrid.sql:**
- 8 tables in `sk` schema
- Foreign key constraints untuk referential integrity
- Indexes pada user_id, status untuk fast queries
- tx_id_fabric VARCHAR(100) untuk blockchain integration

### 3.4 Perancangan Smart Contract (2 halaman)

#### 3.4.1 Chaincode Functions

**9 Main Functions:**

1. **CreateKegiatan(kegiatanId, dosenId, fileHash, poinKum, deskripsi)**
   - Input: Kegiatan data
   - Output: Success/Error
   - Logic: Create state, emit event

2. **VerifyKegiatan(kegiatanId, verifiedBy, isApproved, catatan)**
   - Input: Verification decision
   - Output: Success/Error
   - Logic: Update status, record verifier

3. **GetKegiatanHistory(kegiatanId)**
   - Input: Kegiatan ID
   - Output: Array of history records
   - Logic: Query ledger history

4. **AjukanUsulanKenaikanPangkat(usulanId, dosenId, totalKum, jabatanTujuan)**
   - Input: Usulan data
   - Output: Success/Error (with kumMeetRequirement flag)
   - Logic: Create usulan state

5. **ProsesUsulanKenaikanPangkat(usulanId, processedBy)**
   - Input: Usulan ID, processor
   - Output: Success/Error
   - Logic: Change status to "diproses"

6. **TolakUsulanKenaikanPangkat(usulanId, rejectedBy, catatan)**
   - Input: Rejection data
   - Output: Success/Error
   - Logic: Change status, record reason

7. **TerbitkanSkKenaikanPangkat(usulanId, skFileHash, nomorSk, tanggalSk, issuedBy)**
   - Input: SK data
   - Output: Success/Error
   - Logic: Record SK, change status

8. **GetUsulan(usulanId)**
   - Input: Usulan ID
   - Output: Usulan state
   - Logic: Query current state

9. **GetHistoriUsulan(usulanId)**
   - Input: Usulan ID
   - Output: Array of history
   - Logic: Query ledger history

#### 3.4.2 State Model

**Kegiatan State:**
```javascript
{
  id: string,
  dosenId: string,
  fileHash: string,
  poinKum: number,
  deskripsi: string,
  status: "unverified" | "verified" | "rejected",
  verifiedBy: string,
  catatan: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Usulan State:**
```javascript
{
  id: string,
  dosenId: string,
  totalKum: number,
  jabatanTujuan: string,
  status: "pending" | "diproses" | "sk_issued" | "rejected",
  skFileHash: string,
  nomorSk: string,
  tanggalSk: string,
  kumMeetRequirement: boolean,
  processedBy: string,
  issuedBy: string,
  catatan: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3.5 Perancangan API (1-2 halaman)

#### 3.5.1 RESTful API Endpoints

**Authentication:**
- POST `/api/v1/auth/register` - Register user
- POST `/api/v1/auth/login` - Login & get JWT
- GET `/api/v1/auth/me` - Get current user

**Kegiatan:**
- POST `/api/v1/kegiatan` - Create kegiatan (with file)
- GET `/api/v1/kegiatan` - List kegiatan
- GET `/api/v1/kegiatan/:id` - Get detail
- PUT `/api/v1/kegiatan/:id/verify` - Verify/reject (admin only)

**Usulan:**
- POST `/api/v1/usulan` - Create usulan
- GET `/api/v1/usulan` - List usulan
- GET `/api/v1/usulan/:id` - Get detail
- PUT `/api/v1/usulan/:id/proses` - Process (admin only)
- PUT `/api/v1/usulan/:id/tolak` - Reject (admin only)
- PUT `/api/v1/usulan/:id/terbitkan-sk` - Issue SK (admin only)
- GET `/api/v1/usulan/:id/audit` - Get audit trail

**Reference Data:**
- GET `/api/v1/ref/kegiatan` - List jenis kegiatan
- GET `/api/v1/ref/kategori` - List kategori KUM

**System:**
- GET `/api/v1/health` - Health check

#### 3.5.2 API Request/Response Example

**Example: Create Kegiatan**

Request:
```http
POST /api/v1/kegiatan
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

{
  "ref_kegiatan_id": 1,
  "deskripsi": "Membimbing 5 mahasiswa S1",
  "file": <PDF file>
}
```

Response:
```json
{
  "success": true,
  "message": "Kegiatan created successfully",
  "data": {
    "id": 123,
    "deskripsi": "Membimbing 5 mahasiswa S1",
    "status": "unverified",
    "poin_kum": 15,
    "tx_id_fabric": "abc123...def",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### 3.6 Perancangan User Interface (1 halaman)

#### 3.6.1 Use Case Diagram

**[Insert Use Case Diagram Here]**

**Actors:**
- Dosen
- Admin SDM
- Superadmin (optional)

**Use Cases:**
- Login
- Upload Kegiatan
- View Progress KUM
- Ajukan Usulan
- Verifikasi Kegiatan (Admin)
- Proses Usulan (Admin)
- Terbitkan SK (Admin)
- View Audit Trail

#### 3.6.2 Wireframes/Mockups

**Key Pages:**
1. Login Page
2. Dashboard Dosen (with progress bar)
3. Kegiatan List & Form
4. Kegiatan Detail (with audit trail)
5. Usulan List & Form
6. Verifikasi Page (Admin)

**[Insert Wireframes/Screenshots Here]**

---

## BAB IV: IMPLEMENTASI

### 4.1 Implementasi Blockchain (2-3 halaman)

#### 4.1.1 Setup Hyperledger Fabric Network

**Network Configuration:**
- Fabric version: 2.5+
- Network: test-network (from fabric-samples)
- Channel: mychannel
- Organizations: Org1, Org2
- Peers: peer0.org1.example.com, peer0.org2.example.com
- Orderer: orderer.example.com (Solo/Raft)
- CAs: ca.org1, ca.org2

**Deployment Steps:**
```bash
cd fabric-network
./start-network.sh
```

#### 4.1.2 Chaincode Implementation

**Technology:** Node.js with fabric-contract-api

**Code Snippet - CreateKegiatan:**
```javascript
async CreateKegiatan(ctx, kegiatanId, dosenId, fileHash, poinKum, deskripsi) {
  const kegiatan = {
    id: kegiatanId,
    dosenId,
    fileHash,
    poinKum: parseInt(poinKum),
    deskripsi,
    status: 'unverified',
    createdAt: new Date().toISOString(),
  };
  
  await ctx.stub.putState(kegiatanId, Buffer.from(JSON.stringify(kegiatan)));
  
  ctx.stub.setEvent('KegiatanCreated', Buffer.from(JSON.stringify(kegiatan)));
  
  return JSON.stringify(kegiatan);
}
```

**Penjelasan:**
- `ctx.stub.putState()` untuk menyimpan state di ledger
- `ctx.stub.setEvent()` untuk emit event
- Return JSON string sebagai transaction result

### 4.2 Implementasi Backend (2-3 halaman)

#### 4.2.1 Setup Express.js Server

**Project Structure:**
```
backend/
├── config/       # Database, Fabric config
├── middleware/   # Auth, error handling
├── models/       # Database models
├── routes/       # API routes
├── utils/        # fabricClient, hashUtils
└── server.js     # Entry point
```

#### 4.2.2 Fabric SDK Integration

**Code Snippet - fabricClient.js:**
```javascript
async function submitTransaction(functionName, ...args) {
  const gateway = new Gateway();
  await gateway.connect(connectionProfile, gatewayOptions);
  
  const network = await gateway.getNetwork(CHANNEL_NAME);
  const contract = network.getContract(CHAINCODE_NAME);
  
  const transaction = contract.createTransaction(functionName);
  const txId = transaction.getTransactionId();
  const result = await transaction.submit(...args);
  
  await gateway.disconnect();
  
  return { txId, result: result.toString() };
}
```

**Penjelasan:**
- Connect to Fabric via Gateway
- Create transaction & get transaction ID
- Submit transaction & return both txId and result

#### 4.2.3 Database Integration

**Code Snippet - Create Kegiatan Route:**
```javascript
router.post('/kegiatan', authenticate, upload.single('file'), async (req, res) => {
  const { ref_kegiatan_id, deskripsi } = req.body;
  const file = req.file;
  const userId = req.user.id;
  
  // Calculate file hash
  const fileHash = await hashUtils.calculateFileHash(file.path);
  
  // Get poin KUM from reference
  const { rows } = await pool.query(
    'SELECT poin_kum_default FROM sk.ref_kegiatan_kum WHERE id = $1',
    [ref_kegiatan_id]
  );
  const poinKum = rows[0].poin_kum_default;
  
  // Save to blockchain
  const { txId } = await fabricClient.recordKegiatanCreation(
    kegiatanId, userId, fileHash, poinKum, deskripsi
  );
  
  // Save to database
  const result = await pool.query(
    `INSERT INTO sk.kegiatan_dosen 
     (user_id, ref_kegiatan_id, deskripsi, file_path, file_hash, poin_kum, tx_id_fabric) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, ref_kegiatan_id, deskripsi, file.path, fileHash, poinKum, txId]
  );
  
  res.json({ success: true, data: result.rows[0] });
});
```

#### 4.2.4 Authentication & Authorization

**JWT Middleware:**
```javascript
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 4.3 Implementasi Frontend (2 halaman)

#### 4.3.1 Setup Vue.js Project

**Tech Stack:**
- Vue.js 3 (Composition API)
- Vue Router (routing)
- Pinia (state management)
- Tailwind CSS (styling)
- Axios (HTTP client)

#### 4.3.2 State Management with Pinia

**Code Snippet - auth.store.js:**
```javascript
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token'));
  
  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
  }
  
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }
  
  return { user, token, login, logout };
});
```

#### 4.3.3 Key Components

**Progress Bar KUM Component:**
```vue
<template>
  <div>
    <div class="flex justify-between text-sm mb-1">
      <span>Progress KUM</span>
      <span>{{ percentage }}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-3">
      <div 
        class="h-3 rounded-full bg-blue-500" 
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  current: Number,
  target: Number,
});

const percentage = computed(() => {
  return Math.round((props.current / props.target) * 100);
});
</script>
```

### 4.4 Implementasi File Hashing (1 halaman)

#### 4.4.1 SHA-256 Hashing

**Code Snippet - hashUtils.js:**
```javascript
const crypto = require('crypto');
const fs = require('fs');

function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
```

**Usage:**
1. Upload file → calculate hash
2. Store hash in PostgreSQL & blockchain
3. Later: Re-calculate hash → compare with blockchain
4. If match → File integrity valid ✅
5. If mismatch → File tampered ❌

---

## BAB V: PENGUJIAN DAN HASIL

### 5.1 Pengujian Fungsional (2-3 halaman)

#### 5.1.1 Test Case Template

| ID | Scenario | Input | Expected Output | Actual Output | Status |
|----|----------|-------|-----------------|---------------|--------|
| TC-01 | Login valid | email: budi@..., password: password123 | Redirect to dashboard, token saved | As expected | ✅ Pass |
| TC-02 | Login invalid | email: budi@..., password: wrong | Error message shown | As expected | ✅ Pass |
| TC-03 | Upload kegiatan | Valid PDF file <5MB | Kegiatan created, tx_id saved | As expected | ✅ Pass |
| ... | ... | ... | ... | ... | ... |

**Total Test Cases:** 20-30

#### 5.1.2 Test Results Summary

| Module | Total Tests | Passed | Failed | Pass Rate |
|--------|-------------|--------|--------|-----------|
| Authentication | 4 | 4 | 0 | 100% |
| Kegiatan Upload | 6 | 6 | 0 | 100% |
| Kegiatan Verification | 4 | 4 | 0 | 100% |
| Usulan Workflow | 8 | 8 | 0 | 100% |
| Audit Trail | 3 | 3 | 0 | 100% |
| File Validation | 5 | 5 | 0 | 100% |
| **TOTAL** | **30** | **30** | **0** | **100%** |

### 5.2 Pengujian Blockchain Integration (1-2 halaman)

#### 5.2.1 Transaction ID Verification

**Test:** Verify all kegiatan & usulan have valid tx_id_fabric

**Query:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(tx_id_fabric) as with_txid,
  COUNT(*) - COUNT(tx_id_fabric) as without_txid
FROM sk.kegiatan_dosen
WHERE status = 'verified';
```

**Result:**
- Total verified: 15
- With tx_id: 15
- Without tx_id: 0
- **✅ 100% have blockchain tx_id**

#### 5.2.2 Audit Trail Retrieval

**Test:** Query blockchain history for kegiatan

**Command:**
```bash
peer chaincode query \
  -C mychannel \
  -n chainrank \
  -c '{"function":"GetKegiatanHistory","Args":["kegiatan-123"]}'
```

**Result:**
```json
[
  {
    "txId": "abc123...def",
    "timestamp": "2025-01-15T10:30:00Z",
    "value": { "id": "kegiatan-123", "status": "unverified", ... },
    "isDelete": false
  },
  {
    "txId": "def456...ghi",
    "timestamp": "2025-01-15T14:20:00Z",
    "value": { "id": "kegiatan-123", "status": "verified", ... },
    "isDelete": false
  }
]
```

**✅ Complete history retrieved from blockchain**

### 5.3 Pengujian Performa (1 halaman)

#### 5.3.1 Response Time Test

**Tool:** Apache Bench (ab)

**Test Command:**
```bash
ab -n 100 -c 10 -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/kegiatan
```

**Results:**

| Endpoint | Requests | Concurrency | Avg Response Time | Success Rate |
|----------|----------|-------------|-------------------|--------------|
| GET /kegiatan | 100 | 10 | 145ms | 100% |
| POST /kegiatan | 50 | 5 | 850ms | 100% |
| GET /usulan | 100 | 10 | 120ms | 100% |
| Health check | 1000 | 50 | 25ms | 100% |

**✅ All response times <2s (meeting requirement)**

#### 5.3.2 Blockchain Performance

**Chaincode Invocation Time:**
- CreateKegiatan: ~300ms
- VerifyKegiatan: ~280ms
- GetKegiatanHistory: ~150ms

**✅ Acceptable for MVP (not high-throughput scenario)**

### 5.4 Hasil Implementasi (1-2 halaman)

#### 5.4.1 Screenshots

**[Insert Screenshots Here]**
1. Login Page
2. Dashboard with Progress Bar
3. Kegiatan List
4. Kegiatan Detail with Audit Trail
5. Usulan Workflow
6. Admin Verifikasi Page
7. Health Check Response

#### 5.4.2 Metrics

**Development Metrics:**
- Total development time: 4 weeks (160 hours)
- Lines of code:
  - Backend: ~2,500 LOC
  - Frontend: ~3,000 LOC
  - Chaincode: ~500 LOC
- API endpoints: 14
- Database tables: 8
- Frontend pages: 8
- Chaincode functions: 9

**System Metrics:**
- Database size: ~50MB (with test data)
- Blockchain ledger size: ~200MB (test-network)
- Average API response time: <500ms
- Frontend bundle size: ~800KB (gzipped)

---

## BAB VI: KESIMPULAN DAN SARAN

### 6.1 Kesimpulan (1 halaman)

**Poin-poin kesimpulan:**

1. **Sistem berhasil diimplementasikan:**
   - Hybrid architecture (PostgreSQL + Hyperledger Fabric) working correctly
   - All core workflows (kegiatan, usulan, verifikasi) functional
   - Blockchain integration successfully records all state transitions

2. **Blockchain memberikan nilai tambah:**
   - Immutable audit trail untuk accountability
   - Transaction IDs prove data recorded on-chain
   - Hash-based document integrity verification

3. **Hybrid approach optimal:**
   - PostgreSQL untuk fast queries & complex joins
   - Blockchain untuk immutability & transparency
   - Best of both worlds: performance + security

4. **MVP objectives achieved:**
   - All functional requirements met (100% test pass rate)
   - Demo-ready dalam 4 minggu
   - Dokumentasi lengkap untuk reproducibility

5. **Challenges overcome:**
   - Fabric networking configuration (TLS, discovery)
   - Chaincode validation logic (soft validation)
   - Transaction ID extraction from Fabric SDK
   - Frontend-backend integration

### 6.2 Saran (½ halaman)

**Untuk Pengembangan Lebih Lanjut:**

1. **Security Enhancement:**
   - Implement rate limiting & CSRF protection
   - Use HSM for key management
   - Add two-factor authentication (2FA)

2. **Scalability Improvements:**
   - Implement caching layer (Redis)
   - Use distributed file storage (MinIO/S3)
   - Deploy multi-organization Fabric network

3. **Feature Additions:**
   - Email notifications for workflow events
   - Advanced analytics dashboard
   - Export to PDF/Excel
   - Mobile app (React Native)

4. **Production Readiness:**
   - Implement CI/CD pipeline
   - Add comprehensive monitoring (Prometheus, Grafana)
   - Setup multi-environment deployment (dev, staging, prod)
   - Conduct security audit & penetration testing

5. **Legal & Compliance:**
   - Align with GDPR/privacy regulations
   - Integrate with official Permenpan RB guidelines
   - Add digital signature for SK

**Untuk Institusi yang Ingin Adopt:**
- Start with pilot program (1 department)
- Train users on new system
- Gradual migration dari sistem lama
- Setup dedicated DevOps team untuk maintenance

---

## DAFTAR PUSTAKA

1. Nakamoto, S. (2008). Bitcoin: A Peer-to-Peer Electronic Cash System. Retrieved from https://bitcoin.org/bitcoin.pdf

2. Androulaki, E., et al. (2018). Hyperledger Fabric: A Distributed Operating System for Permissioned Blockchains. In EuroSys '18.

3. Hyperledger Foundation. (2024). Hyperledger Fabric Documentation. Retrieved from https://hyperledger-fabric.readthedocs.io/

4. Kementerian PANRB. (2019). Peraturan Menteri PANRB tentang Jabatan Fungsional Dosen dan Angka Kreditnya.

5. PostgreSQL Global Development Group. (2024). PostgreSQL Documentation. Retrieved from https://www.postgresql.org/docs/

6. Vue.js Team. (2024). Vue.js Documentation. Retrieved from https://vuejs.org/guide/

7. Express.js Team. (2024). Express.js Documentation. Retrieved from https://expressjs.com/

8. NIST. (2015). Secure Hash Standard (SHS). FIPS PUB 180-4.

---

## LAMPIRAN

### Lampiran A: Source Code (Selected Snippets)
- Backend: server.js, fabricClient.js, kegiatan routes
- Chaincode: kegiatanContract.js
- Frontend: Dashboard.vue, KegiatanList.vue

### Lampiran B: Database Schema
- Complete schema-hybrid.sql
- ER Diagram

### Lampiran C: API Documentation
- Postman Collection export
- API request/response examples

### Lampiran D: Deployment Guide
- Step-by-step installation
- Docker commands
- Troubleshooting

### Lampiran E: Test Results
- Complete test case details
- Screenshots of test execution
- Performance test logs

---

**Total Pages:** ~20-25 halaman (excluding appendix)

---

## Tips Penulisan

1. **Use consistent terminology** throughout the report
2. **Include references** for all external sources
3. **Use diagrams** to explain complex concepts
4. **Provide code snippets** for key implementations (not entire files)
5. **Screenshots** should be clear & annotated
6. **Proofread** for grammar, spelling, typos
7. **Follow** your institution's thesis/report formatting guidelines

---

**Good luck with your report!** 📝
