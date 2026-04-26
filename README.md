# ChainRank - Sistem Kenaikan Pangkat Dosen Berbasis Blockchain

Sistem hybrid untuk pencatatan dan verifikasi kenaikan pangkat dosen menggunakan **PostgreSQL** (database) + **Hyperledger Fabric** (blockchain).

---

## 📚 Documentation Structure

Project ini memiliki **2 roadmap** berbeda sesuai kebutuhan:

### 1️⃣ [plan.md](plan.md) - **MVP untuk Tugas Kuliah**
- ⏱️ **Timeline:** 1 bulan (4 minggu)
- 🎯 **Tujuan:** Proof of Concept untuk tugas kuliah
- 👥 **Resource:** 1-2 orang
- 📦 **Scope:** Core features only (upload, hash, verify, audit trail)
- ✅ **Deliverable:** Working demo + dokumentasi + video

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

## 🛠️ Tech Stack

### Core Technologies
- **Frontend:** Vue.js 3, Pinia, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Blockchain:** Hyperledger Fabric v2.5+
- **Database:** PostgreSQL 15+
- **Storage:** MinIO / AWS S3

### Additional (Production only)
- **Caching:** Redis
- **Monitoring:** Prometheus + Grafana
- **Logging:** Loki / ELK Stack
- **Orchestration:** Kubernetes / Docker Swarm
- **CI/CD:** GitHub Actions

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ & npm
- PostgreSQL 15+
- Docker & Docker Compose
- Git

### Setup (MVP)
```bash
# 1. Clone repository
git clone <repo-url>
cd UsulanKenaikanPangkatBlockchain

# 2. Follow plan.md step-by-step
# Start with Week 1: Infrastructure Setup
```

Detailed setup instructions ada di [plan.md](plan.md) → Week 1.

---

## 📋 Project Status

- [ ] **Phase 1:** MVP Development (plan.md) - **IN PROGRESS**
- [ ] **Phase 2:** Production Enhancement (plan-full.md) - **NOT STARTED**

---

## 🤝 Contributing

Untuk development guidelines dan best practices, lihat:
- [plan.md](plan.md) - Section "Design Principles untuk Future-Proofing"
- [plan-full.md](plan-full.md) - Section "Compliance & Legal Considerations"

---

## 📝 License

[Your License Here]

---

## 📞 Contact

[Your Contact Info]

---

**Last Updated:** April 26, 2026  
**Current Focus:** MVP Development (Tugas Kuliah)
