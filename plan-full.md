# Rencana Pengembangan Proyek ChainRank - Production Version
## Sistem Pencatatan & Verifikasi Kenaikan Pangkat Dosen Berbasis Blockchain Hybrid

> **📌 Note:** Ini adalah **full production roadmap** (7-8 bulan). Untuk versi **MVP tugas kuliah (1 bulan)**, lihat [plan.md](plan.md).

Dokumen ini berisi peta jalan (roadmap) teknis untuk pembangunan sistem **ChainRank** yang production-ready. Proyek ini menggunakan arsitektur hybrid yang menggabungkan kecepatan database relasional (**PostgreSQL**) dengan integritas data **Hyperledger Fabric**.

---

## 🎯 Prerequisite: MVP Completion

Sebelum memulai fase production ini, **pastikan MVP sudah selesai** dengan kriteria:
- ✅ Basic hybrid system berjalan (PostgreSQL + Fabric)
- ✅ Core features working (upload, hash, verify, audit trail)
- ✅ Code mengikuti **design principles** dari [plan.md](plan.md)
- ✅ Database schema sudah extensible
- ✅ Architecture modular & reusable
- ✅ All configs in environment variables

Jika MVP belum selesai atau tidak mengikuti best practices, **fix dulu sebelum lanjut**!

---

## 📅 Jadwal Pengembangan (Phases)

### Fase 1: Setup Infrastruktur & Lingkungan Dasar
**Estimasi Waktu:** 2-3 minggu  
**Resource:** 1 Backend Developer, 1 DevOps Engineer

Fokus pada penyiapan pondasi sistem dan koordinasi antar layanan.
* [ ] **1.1 Repositori Proyek:** Inisialisasi Git untuk monorepo atau polyrepo (Backend & Frontend).
* [ ] **1.2 Skema Database Off-Chain:** Implementasi skema PostgreSQL dengan indexing yang optimal (Tabel: `users`, `kegiatan_dosen`, `dokumen_administrasi`, `usulan_pangkat`, `audit_logs`).
* [ ] **1.3 Fabric Development Network:** Konfigurasi Docker Compose untuk jaringan Hyperledger Fabric development (1 Peer, 1 Orderer, 1 CA) menggunakan Fabric Samples.
* [ ] **1.4 CI/CD Pipeline:** Setup GitHub Actions untuk automated testing dan build.
* [ ] **1.5 Environment Configuration:** Setup development, staging, dan production environments.

### Fase 2: Pengembangan Smart Contract (Chaincode)
**Estimasi Waktu:** 3-4 minggu  
**Resource:** 2 Blockchain Developers

Membangun logika bisnis utama yang akan berjalan secara on-chain.
* [ ] **2.1 Inisialisasi Chaincode:** Menggunakan Node.js untuk menulis kontrak pintar dengan structure yang modular.
* [ ] **2.2 Fungsi Transaksional:** Implementasi fungsi `CatatKegiatan`, `VerifikasiKegiatan`, `TolakKegiatan`, dan `TerbitkanSKPangkat`.
* [ ] **2.3 Fungsi Audit:** Implementasi fungsi `GetHistori` menggunakan API `getHistoryForKey`.
* [ ] **2.4 Access Control Logic:** Implementasi attribute-based access control (ABAC) di chaincode level.
* [ ] **2.5 Unit Testing:** Validasi logika kontrak menggunakan unit test lokal dengan coverage minimal 80%.
* [ ] **2.6 Chaincode Versioning:** Setup versioning strategy untuk chaincode updates.

### Fase 3: Backend & Mekanisme Integrasi Hybrid
**Estimasi Waktu:** 4-5 minggu  
**Resource:** 2 Backend Developers, 1 Security Engineer

Membangun API orkestrator yang menghubungkan SQL dan Blockchain.
* [ ] **3.1 API Boilerplate:** Setup Express.js dengan TypeScript untuk type safety.
* [ ] **3.2 Authentication & Authorization:** 
  - JWT Auth dengan refresh token mechanism
  - Role-Based Access Control (RBAC) untuk Dosen, Admin, Pimpinan, Super Admin
  - Password hashing dengan bcrypt (salt rounds: 12)
  - Session management dengan Redis
* [ ] **3.3 Modul Kriptografi:** 
  - Implementasi hash SHA-256 untuk file PDF dan data sensitif
  - Encryption data sensitif (NIP, NIK) menggunakan AES-256
  - Private key management untuk Fabric identity
* [ ] **3.4 Fabric Gateway Client:** Integrasi SDK `fabric-network` dengan connection pooling.
* [ ] **3.5 Logika Double-Commit:** Implementasi endpoint dengan proteksi transaksi (SQL Rollback jika Fabric gagal).
* [ ] **3.6 Error Handling:** Centralized error handling middleware dengan proper HTTP status codes.
* [ ] **3.7 Rate Limiting:** Implementasi rate limiting untuk mencegah abuse.
* [ ] **3.8 File Upload Handler:** Multer configuration dengan validasi file type, size, dan virus scanning integration.
* [ ] **3.9 Storage Integration:** 
  - Setup MinIO (self-hosted S3-compatible storage) atau AWS S3
  - Implementasi file retention policy (7 tahun sesuai regulasi)
  - Access control untuk file PDF dengan signed URLs
* [ ] **3.10 Audit Logging:** Log semua aktivitas sensitif (login, upload, verifikasi, penerbitan SK) ke database.

### Fase 4: Pengembangan Frontend (Vue.js)
**Estimasi Waktu:** 4-5 minggu  
**Resource:** 2 Frontend Developers, 1 UI/UX Designer

Membangun antarmuka pengguna yang reaktif dan informatif.
* [ ] **4.1 Dashboard Dosen:** 
  - Form input kegiatan dengan validasi real-time
  - Upload bukti fisik dengan drag & drop support
  - Monitoring status KUM dengan progress bar
  - Notifikasi real-time menggunakan WebSocket
* [ ] **4.2 Fitur Notifikasi KUM:** 
  - Logika frontend untuk mendeteksi ambang batas poin (200, 400, 550, 850)
  - Auto-trigger form dokumen pendukung saat threshold tercapai
  - Email notification integration
* [ ] **4.3 Dashboard Admin & Pimpinan:** 
  - Interface review dokumen dengan filtering & sorting
  - PDF preview dengan annotation tools
  - Bulk action untuk verifikasi multiple documents
  - Approval workflow visualization
* [ ] **4.4 Visualisasi Audit Trail:** 
  - Timeline component untuk riwayat aset dari blockchain
  - Export audit log ke PDF/Excel
  - Real-time hash verification display
* [ ] **4.5 Security Frontend:** 
  - Input sanitization untuk mencegah XSS
  - CSRF token implementation
  - Secure session storage (HttpOnly cookies)
* [ ] **4.6 Responsive Design:** Mobile-first approach dengan Tailwind CSS.
* [ ] **4.7 Accessibility (A11y):** WCAG 2.1 Level AA compliance.

### Fase 5: Pengujian Terintegrasi (Quality Assurance)
**Estimasi Waktu:** 3-4 minggu  
**Resource:** 2 QA Engineers, 1 Security Tester

Memastikan sistem tahan terhadap kegagalan dan manipulasi.
* [ ] **5.1 Unit Testing:** 
  - Backend: Jest dengan coverage minimal 80%
  - Frontend: Vitest dengan coverage minimal 75%
  - Chaincode: Mocha/Chai dengan coverage minimal 80%
* [ ] **5.2 Integration Testing:** 
  - API integration tests dengan Supertest
  - Database integration tests dengan test database
  - Blockchain integration tests dengan Fabric test network
* [ ] **5.3 End-to-End (E2E) Testing:** 
  - Menguji complete user journey dari upload dosen hingga terbit SK
  - Testing dengan Playwright atau Cypress
  - Cross-browser testing (Chrome, Firefox, Safari, Edge)
* [ ] **5.4 Performance Testing:** 
  - Load testing dengan k6 atau Artillery (target: 100 concurrent users)
  - Stress testing untuk blockchain throughput (target: 100 TPS)
  - Database query performance benchmarking
  - API response time optimization (target: <500ms untuk 95 percentile)
* [ ] **5.5 Security Testing:** 
  - Penetration testing
  - SQL injection & XSS vulnerability scanning
  - Authentication bypass attempts
  - File upload security testing
  - OWASP Top 10 vulnerability check
* [ ] **5.6 Fault Tolerance Testing:** 
  - Simulasi kegagalan node blockchain (peer down, orderer down)
  - SQL Rollback consistency check
  - Network partition testing
  - Database connection pool exhaustion
* [ ] **5.7 Integrity Check:** 
  - Simulasi modifikasi file manual untuk deteksi perbedaan hash
  - Blockchain tampering detection
  - Audit trail immutability verification
* [ ] **5.8 User Acceptance Testing (UAT):** Testing dengan user representatives dari setiap role.

### Fase 6: Infrastructure Scaling & Production Setup
**Estimasi Waktu:** 3-4 minggu  
**Resource:** 2 DevOps Engineers, 1 Backend Developer

* [ ] **6.1 Scalability Implementation:** 
  - Setup Hyperledger Fabric production network:
    - Minimal 3 peers untuk redundancy
    - 3 orderers dengan Raft consensus untuk high availability
    - Multiple CAs untuk certificate management
  - Database replication: PostgreSQL primary-replica setup
  - Load balancer: Nginx atau HAProxy untuk distribute traffic
  - Horizontal pod autoscaling (HPA) untuk backend services
* [ ] **6.2 Monitoring & Observability:** 
  - Prometheus + Grafana untuk metrics monitoring
  - Loki atau ELK Stack untuk centralized logging
  - Jaeger atau Zipkin untuk distributed tracing
  - Alerting rules untuk anomali sistem (Slack/Email integration)
  - Blockchain network health monitoring dashboard
  - Database performance monitoring (pg_stat_statements)
* [ ] **6.3 Backup & Disaster Recovery:** 
  - PostgreSQL automated backup (daily full + hourly incremental)
  - Fabric ledger backup strategy
  - Chaincode backup & versioning
  - File storage backup (MinIO/S3 cross-region replication)
  - Define RTO (Recovery Time Objective): 4 hours
  - Define RPO (Recovery Point Objective): 1 hour
  - Disaster recovery runbook documentation
  - Quarterly disaster recovery drill
* [ ] **6.4 Security Hardening:** 
  - SSL/TLS certificates (Let's Encrypt atau commercial CA)
  - Firewall rules & network segmentation
  - Database encryption at rest
  - Private key rotation policy
  - Security patch management process
  - Intrusion Detection System (IDS) setup

### Fase 7: Finalisasi & Deployment
**Estimasi Waktu:** 2-3 minggu  
**Resource:** 2 DevOps Engineers, 1 Backend Developer, 1 Documentation Writer

* [ ] **7.1 Code Quality:** 
  - Code refactoring dan cleanup
  - Static code analysis (SonarQube)
  - Dependency vulnerability scanning (npm audit, Snyk)
  - Performance optimization (query optimization, caching strategy with Redis)
* [ ] **7.2 Dokumentasi Teknis:** 
  - API Documentation dengan Swagger/OpenAPI 3.0
  - Postman collection untuk API testing
  - System architecture diagram
  - Database schema documentation
  - Chaincode function documentation
  - Deployment runbook
  - Troubleshooting guide
* [ ] **7.3 Dockerization & Orchestration:** 
  - Docker images untuk semua services (multi-stage builds)
  - Docker Compose untuk development environment
  - Kubernetes manifests untuk production (atau Docker Swarm)
  - Helm charts untuk easy deployment
  - Container image scanning untuk vulnerabilities
* [ ] **7.4 CI/CD Pipeline Enhancement:** 
  - Automated testing di pipeline (unit, integration, E2E)
  - Automated deployment ke staging setelah merge ke main
  - Manual approval gate untuk production deployment
  - Automated rollback mechanism
  - Blue-green deployment strategy
* [ ] **7.5 Data Migration (jika ada sistem lama):** 
  - Extract data dari sistem legacy
  - Transform data ke format baru
  - Load data dengan validation checks
  - Parallel running period: 1 bulan
  - Cutover planning & execution
* [ ] **7.6 Production Deployment:** 
  - Staging deployment & final testing
  - Production deployment dengan zero-downtime strategy
  - Smoke testing di production
  - Performance monitoring post-deployment

### Fase 8: User Training & Go-Live
**Estimasi Waktu:** 2-3 minggu  
**Resource:** 1 Project Manager, 2 Trainers, Support Team

* [ ] **8.1 Dokumentasi Pengguna:** 
  - User manual untuk Dosen (PDF & interactive web version)
  - User manual untuk Admin
  - User manual untuk Pimpinan
  - Quick start guide dengan screenshots
  - FAQ & troubleshooting guide
  - Video tutorial untuk setiap user role
* [ ] **8.2 Training Sessions:** 
  - Training untuk Dosen (2 sesi)
  - Training untuk Admin (2 sesi)
  - Training untuk Pimpinan (1 sesi)
  - Hands-on workshop
  - Q&A sessions
* [ ] **8.3 Soft Launch:** 
  - Pilot testing dengan selected departments (1-2 minggu)
  - Collect feedback dan bug reports
  - Quick fixes untuk critical issues
* [ ] **8.4 Go-Live Support:** 
  - Dedicated support team untuk 2 minggu pertama
  - Hotline & email support
  - On-site support (jika diperlukan)
  - Daily monitoring & incident response

### Fase 9: Post-Deployment & Maintenance
**Estimasi Waktu:** Ongoing  
**Resource:** 1 Backend Developer, 1 DevOps Engineer, 1 Support Engineer

* [ ] **9.1 Monitoring & Support:** 
  - 24/7 system monitoring
  - Incident response team (SLA: <4 hours for critical issues)
  - Regular system health checks (weekly)
  - Performance optimization based on usage patterns
* [ ] **9.2 Maintenance Windows:** 
  - Monthly maintenance window untuk updates
  - Security patch application (as needed)
  - Database maintenance (vacuum, reindex)
  - Log rotation & cleanup
* [ ] **9.3 Continuous Improvement:** 
  - Bug fix procedures (prioritization & sprint planning)
  - Feature enhancement based on user feedback
  - Quarterly system performance review
  - Annual security audit
* [ ] **9.4 Compliance & Audit:** 
  - Kesesuaian dengan regulasi kenaikan pangkat Kemendikbud
  - GDPR/UU PDP compliance check (jika applicable)
  - Annual compliance audit
  - Audit trail availability untuk minimum 7 tahun

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** Vue.js 3 (Composition API)
* **State Management:** Pinia
* **Styling:** Tailwind CSS
* **HTTP Client:** Axios
* **Real-time Communication:** Socket.io Client
* **Form Validation:** Vee-Validate + Yup
* **Testing:** Vitest, Playwright/Cypress
* **Build Tool:** Vite

### Backend
* **Runtime:** Node.js (LTS v20+)
* **Framework:** Express.js dengan TypeScript
* **Authentication:** JWT (jsonwebtoken), bcrypt
* **ORM:** Sequelize atau Prisma
* **Validation:** Joi atau Zod
* **File Upload:** Multer
* **Real-time:** Socket.io
* **Caching:** Redis
* **Task Queue:** Bull (untuk background jobs)
* **Testing:** Jest, Supertest

### Blockchain
* **Platform:** Hyperledger Fabric v2.5+
* **SDK:** fabric-network (Node.js SDK)
* **State Database:** CouchDB (untuk rich queries)
* **Chaincode:** Node.js (JavaScript/TypeScript)
* **Certificate Authority:** Fabric CA
* **Consensus:** Raft (untuk Orderer)

### Database
* **Primary:** PostgreSQL 15+
* **Connection Pool:** pg-pool
* **Migration:** Sequelize migrations atau Prisma Migrate
* **Backup:** pg_dump, WAL archiving

### Storage
* **Object Storage:** MinIO (self-hosted S3-compatible) atau AWS S3
* **CDN:** Cloudflare atau AWS CloudFront (untuk static assets)
* **File Retention:** 7 tahun (compliance requirement)

### DevOps & Infrastructure
* **Containerization:** Docker, Docker Compose
* **Orchestration:** Kubernetes atau Docker Swarm
* **CI/CD:** GitHub Actions atau GitLab CI
* **Monitoring:** Prometheus, Grafana
* **Logging:** Loki atau ELK Stack (Elasticsearch, Logstash, Kibana)
* **Tracing:** Jaeger atau Zipkin
* **Load Balancer:** Nginx atau HAProxy
* **Reverse Proxy:** Nginx
* **SSL/TLS:** Let's Encrypt

### Security
* **Encryption:** AES-256 (data at rest), TLS 1.3 (data in transit)
* **Secrets Management:** HashiCorp Vault atau AWS Secrets Manager
* **Vulnerability Scanning:** Snyk, npm audit, Trivy (container scanning)
* **Firewall:** iptables, cloud provider security groups

### Development Tools
* **Version Control:** Git (GitHub atau GitLab)
* **Code Quality:** ESLint, Prettier, SonarQube
* **API Documentation:** Swagger/OpenAPI 3.0
* **API Testing:** Postman, Insomnia
* **Load Testing:** k6, Artillery

---

## 📊 Timeline Summary

| Fase | Durasi | Kumulatif |
|------|--------|----------|
| Fase 1: Setup Infrastruktur | 2-3 minggu | 3 minggu |
| Fase 2: Smart Contract | 3-4 minggu | 7 minggu |
| Fase 3: Backend & Integration | 4-5 minggu | 12 minggu |
| Fase 4: Frontend Development | 4-5 minggu | 17 minggu |
| Fase 5: QA & Testing | 3-4 minggu | 21 minggu |
| Fase 6: Infrastructure Scaling | 3-4 minggu | 25 minggu |
| Fase 7: Finalisasi & Deployment | 2-3 minggu | 28 minggu |
| Fase 8: User Training & Go-Live | 2-3 minggu | 31 minggu |
| **Total Estimasi** | **~7-8 bulan** | |

## 👥 Resource Requirements

* **Backend Developers:** 2 (full-time)
* **Blockchain Developers:** 2 (full-time)
* **Frontend Developers:** 2 (full-time)
* **DevOps Engineers:** 2 (full-time)
* **QA Engineers:** 2 (full-time)
* **Security Engineer:** 1 (part-time/consultant)
* **UI/UX Designer:** 1 (part-time)
* **Project Manager:** 1 (full-time)
* **Documentation Writer:** 1 (part-time)
* **Support Team:** 2-3 (post go-live)

## 🎯 Success Metrics (KPI)

### Performance
* API response time: <500ms (95th percentile)
* Page load time: <2s
* Blockchain transaction throughput: >100 TPS
* System uptime: 99.9% (target SLA)

### Quality
* Code coverage: >80% (backend, chaincode), >75% (frontend)
* Critical bugs in production: <5 per quarter
* Security vulnerabilities: Zero high/critical severity

### User Adoption
* User training completion: >95%
* User satisfaction score: >4.0/5.0
* Support ticket resolution: <24 hours (non-critical), <4 hours (critical)

## ⚠️ Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Blockchain performance bottleneck | High | Medium | Early performance testing, optimize chaincode queries, consider private data collections |
| Security breach | High | Low | Regular security audits, penetration testing, security-first development |
| Data migration failure | High | Medium | Extensive testing, parallel running, rollback plan |
| Integration complexity | Medium | High | Early POC, modular architecture, comprehensive testing |
| User adoption resistance | Medium | Medium | Early user involvement, comprehensive training, change management |
| Scope creep | Medium | High | Clear requirements, change control process, agile sprints |

## 📚 Compliance & Legal Considerations

* **Regulasi Kenaikan Pangkat:** Kesesuaian dengan Permenristekdikti/Permendikbud terkait kenaikan pangkat dosen
* **Data Privacy:** Compliance dengan UU PDP (Perlindungan Data Pribadi) Indonesia
* **Data Retention:** Audit trail minimum 7 tahun sesuai regulasi arsip nasional
* **Digital Signature:** Integrasi tanda tangan digital yang sah (jika diperlukan)
* **Audit Requirements:** Sistem harus dapat diaudit oleh inspektorat perguruan tinggi

---

## 📝 Notes

* Estimasi waktu dapat berubah berdasarkan kompleksitas implementasi dan feedback dari stakeholder
* Resource allocation dapat disesuaikan berdasarkan prioritas dan budget
* Dokumentasi ini akan di-review setiap akhir sprint (2 minggu)
* Change requests harus melalui formal change control process

---

*Dokumen ini bersifat dinamis dan akan diperbarui sesuai dengan progres pengembangan proyek.*  
*Last Updated: April 26, 2026*  
*Version: 2.0*