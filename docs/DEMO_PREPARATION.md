# Demo Preparation Checklist - ChainRank

**Purpose:** Step-by-step checklist untuk persiapan demo/presentasi ChainRank  
**Timeline:** 1-2 days before demo  
**Goal:** Confident, smooth demo tanpa technical issues

---

## 📅 Timeline Overview

### 2 Days Before Demo
- [ ] Complete manual testing (see [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md))
- [ ] Fix critical bugs
- [ ] Prepare demo script
- [ ] Create backup screenshots/videos

### 1 Day Before Demo
- [ ] Practice demo 3x
- [ ] Prepare demo environment
- [ ] Test in fresh environment
- [ ] Finalize slide presentation

### Demo Day
- [ ] Arrive early (30 minutes)
- [ ] Setup & verify all services running
- [ ] Backup plan ready
- [ ] Relax & confident! 🚀

---

## ✅ Pre-Demo Checklist

### 1. Technical Preparation

#### 1.1 Test All Services (30 minutes)
- [ ] **PostgreSQL** running and accessible
  ```powershell
  docker ps | findstr postgres
  docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT 'OK';"
  ```
- [ ] **Fabric Network** running (if using blockchain)
  ```powershell
  docker ps | findstr peer
  docker ps | findstr orderer
  ```
- [ ] **Backend** running on port 3000
  ```powershell
  curl http://localhost:3000/api/v1/health
  ```
- [ ] **Frontend** running on port 5173
  ```powershell
  # Open browser: http://localhost:5173
  ```

#### 1.2 Verify Test Data (15 minutes)
- [ ] Test accounts exist and credentials work:
  - Dosen: `budi.santoso@chainrank.test` / `password123`
  - Admin: `dewi.lestari@chainrank.test` / `password123`
- [ ] Database has reference data (kategori, jenis kegiatan)
- [ ] Clean up old test data (optional - for clean demo)
  ```sql
  -- Optional: Clear test kegiatan but keep seed data
  DELETE FROM sk.kegiatan_dosen WHERE user_id IN (
    SELECT id FROM sk.users WHERE email LIKE '%chainrank.test'
  );
  DELETE FROM sk.usulan_kenaikan_pangkat WHERE user_id IN (
    SELECT id FROM sk.users WHERE email LIKE '%chainrank.test'
  );
  ```

#### 1.3 Prepare Demo Files (10 minutes)
- [ ] Create folder: `demo-files/`
- [ ] Prepare 3-4 sample PDF files with clear names:
  - `kegiatan-1-bimbingan-mahasiswa.pdf`
  - `kegiatan-2-penelitian.pdf`
  - `kegiatan-3-pengabdian.pdf`
  - `sk-kenaikan-pangkat.pdf` (for SK issuance demo)
- [ ] Verify all files are <5MB and valid PDFs

#### 1.4 Browser Setup (5 minutes)
- [ ] Clear browser cache & cookies (optional - for clean demo)
- [ ] Open 2 browser windows/profiles:
  - **Window 1:** Dosen account (budi.santoso)
  - **Window 2:** Admin account (dewi.lestari)
- [ ] Install browser extensions (if needed):
  - JSON formatter (for API demo)
  - Screen recorder (for backup video)

#### 1.5 Backup Plan (20 minutes)
- [ ] Record backup demo video (5-10 minutes)
- [ ] Take screenshots of all key pages:
  - Login page
  - Dashboard (before & after KUM increase)
  - Kegiatan list & detail
  - Usulan list & detail
  - Verifikasi page (admin)
  - Audit trail timeline
  - Health check response (JSON)
- [ ] Prepare backup slides with screenshots (in case live demo fails)

---

## 📝 Demo Script (10-12 minutes)

### Introduction (1 minute)

**Script:**
> "Selamat pagi/siang. Saya akan mendemonstrasikan ChainRank, sistem kenaikan pangkat dosen berbasis blockchain. Sistem ini menggunakan Hyperledger Fabric untuk mencatat semua aktivitas secara immutable, sehingga data tidak bisa dimanipulasi."

**Actions:**
- [ ] Show architecture diagram (slide or README.md)
- [ ] Briefly explain hybrid approach (PostgreSQL + Fabric)

---

### Part 1: Health Check & System Status (1 minute)

**Script:**
> "Pertama, saya tunjukkan bahwa semua komponen sistem sudah running."

**Actions:**
- [ ] Open browser: `http://localhost:3000/api/v1/health`
- [ ] Point out:
  - ✅ Database: Connected
  - ✅ Fabric: Connected (or Disabled if fallback)
  - ✅ Uptime: [show uptime]
- [ ] Optional: Show Docker containers
  ```powershell
  docker ps --format "table {{.Names}}\t{{.Status}}"
  ```

**Key Points:**
- ✅ All services healthy
- ✅ System ready for demo

---

### Part 2: Dosen Workflow - Upload Kegiatan (3 minutes)

**Script:**
> "Sekarang saya login sebagai dosen untuk upload kegiatan."

**Actions:**
1. **Login as Dosen**
   - [ ] Navigate to http://localhost:5173
   - [ ] Login: `budi.santoso@chainrank.test` / `password123`
   - [ ] Show dashboard

2. **Show Initial State**
   - [ ] Point out: "Progress bar KUM saat ini 0 dari 200 poin (0%)"
   - [ ] Point out: "Belum ada kegiatan terverifikasi"

3. **Upload Kegiatan #1**
   - [ ] Click "Tambah Kegiatan"
   - [ ] Select Kategori: "Pendidikan"
   - [ ] Select Jenis: "Membimbing mahasiswa S1" (15 poin)
   - [ ] Deskripsi: "Membimbing 5 mahasiswa tugas akhir"
   - [ ] Upload file: `kegiatan-1-bimbingan-mahasiswa.pdf`
   - [ ] Submit → Success message
   - [ ] Show in list: Status "Belum Diverifikasi"

4. **View Detail**
   - [ ] Click kegiatan yang baru dibuat
   - [ ] Point out:
     - ✅ File uploaded
     - ✅ Status: Belum Diverifikasi
     - ✅ tx_id_fabric: [show transaction ID] → "Ini hash transaksi di blockchain"
     - ✅ Audit trail: "Created" event dengan timestamp

**Key Points:**
- ✅ Dosen bisa upload kegiatan dengan file PDF
- ✅ Setiap upload tercatat di blockchain (tx_id)
- ✅ Status awal: Belum Diverifikasi

---

### Part 3: Admin Workflow - Verifikasi Kegiatan (2 minutes)

**Script:**
> "Sekarang saya switch ke akun Admin SDM untuk verifikasi kegiatan."

**Actions:**
1. **Login as Admin** (Window 2 atau logout/login)
   - [ ] Logout from dosen account
   - [ ] Login: `dewi.lestari@chainrank.test` / `password123`
   - [ ] Navigate to "Verifikasi" page

2. **View Unverified Kegiatan**
   - [ ] Point out: "List kegiatan yang perlu diverifikasi"
   - [ ] Click detail kegiatan from budi.santoso

3. **Verify Kegiatan**
   - [ ] Click "Verifikasi" or "Setujui" button
   - [ ] Confirm
   - [ ] Show success message
   - [ ] Point out: "Status berubah menjadi Terverifikasi"
   - [ ] Show audit trail: "Verified" event dengan tx_id baru

**Key Points:**
- ✅ Admin bisa review dan verifikasi kegiatan
- ✅ Setiap verifikasi tercatat di blockchain (tx_id baru)
- ✅ Audit trail lengkap (Created → Verified)

---

### Part 4: Progress Bar KUM Update (1 minute)

**Script:**
> "Setelah diverifikasi, poin KUM dosen otomatis bertambah."

**Actions:**
1. **Return to Dosen Account**
   - [ ] Logout, login kembali as budi.santoso
   - [ ] Navigate to Dashboard

2. **Show Progress Update**
   - [ ] Point out: "Progress bar sekarang 15/200 (7.5%)"
   - [ ] Point out: "Kegiatan yang diverifikasi muncul dengan status Terverifikasi"
   - [ ] Optional: Upload 2-3 kegiatan lagi → Verify semua → Show progress increase

**Key Points:**
- ✅ Progress bar real-time update
- ✅ Hanya kegiatan terverifikasi yang dihitung
- ✅ Visual tracking menuju target KUM

---

### Part 5: Usulan Kenaikan Pangkat (2 minutes)

**Script:**
> "Setelah KUM cukup, dosen bisa mengajukan usulan kenaikan pangkat."

**Pre-requisite:** Ensure dosen has enough KUM (≥200). If not, quickly verify more kegiatan or adjust in demo script.

**Actions:**
1. **Create Usulan**
   - [ ] As dosen, navigate to "Usulan" page
   - [ ] Click "Ajukan Usulan Baru"
   - [ ] Select Jabatan Tujuan: "Lektor Kepala"
   - [ ] Optional: Upload dokumen pendukung
   - [ ] Submit
   - [ ] Point out: "Usulan tercatat dengan tx_id di blockchain"

2. **Admin Process Usulan**
   - [ ] Login as admin
   - [ ] Navigate to "Usulan" page
   - [ ] View usulan from budi.santoso
   - [ ] Click "Proses" button
   - [ ] Confirm → Status: "Diproses"

3. **Issue SK**
   - [ ] Click "Terbitkan SK" button
   - [ ] Upload file: `sk-kenaikan-pangkat.pdf`
   - [ ] Optional: Fill SK number & tanggal
   - [ ] Submit
   - [ ] Point out:
     - ✅ Status: "SK Terbit"
     - ✅ SK file uploaded
     - ✅ Hash SK tersimpan di blockchain (tx_id baru)

**Key Points:**
- ✅ Complete workflow: Ajukan → Proses → Terbitkan SK
- ✅ Setiap step tercatat di blockchain
- ✅ SK file hash on-chain (immutable)

---

### Part 6: Audit Trail & Blockchain Immutability (1 minute)

**Script:**
> "Seluruh history kegiatan dan usulan tersimpan di blockchain dan tidak bisa diubah."

**Actions:**
1. **View Audit Trail**
   - [ ] Navigate to Usulan Detail page
   - [ ] Point out timeline:
     - Created (with tx_id)
     - Processed (with tx_id)
     - SK Issued (with tx_id)
   - [ ] Optional: Navigate to Admin → Audit Trail page
   - [ ] Show all transactions in system

2. **Explain Blockchain Benefit**
   - [ ] "Semua tx_id ini adalah hash transaksi di Hyperledger Fabric"
   - [ ] "Data tidak bisa dihapus atau diubah karena sifat blockchain yang immutable"
   - [ ] "Jika ada manipulasi data, bisa terdeteksi dari hash yang tidak cocok"

**Key Points:**
- ✅ Complete audit trail for accountability
- ✅ Blockchain ensures data integrity
- ✅ Transparency for all stakeholders

---

### Part 7 (Optional): Tampering Detection Demo (1 minute)

**Only if you have time and implementation ready**

**Script:**
> "Saya akan demonstrasikan bagaimana sistem bisa detect jika file dimanipulasi."

**Actions:**
1. **Show Original Hash**
   - [ ] View kegiatan detail
   - [ ] Point out file hash: `abc123...` (example)

2. **Simulate Tampering**
   - [ ] (Pre-prepared) Show modified file with different hash
   - [ ] Explain: "Jika file diubah setelah upload, hash akan berbeda"
   - [ ] Compare hash: Original vs Modified → ❌ Mismatch

3. **Blockchain Prevents Manipulation**
   - [ ] "Hash di blockchain tidak bisa diubah"
   - [ ] "Jadi kita bisa detect tampering dengan membandingkan hash"

**Key Points:**
- ✅ File integrity verification via hash
- ✅ Blockchain prevents hash manipulation
- ✅ Tampering detection possible

---

### Closing (1 minute)

**Script:**
> "Demikian demo ChainRank. Sistem ini berhasil mengintegrasikan database tradisional dengan blockchain untuk mencatat kenaikan pangkat dosen secara transparan dan tidak bisa dimanipulasi. Terima kasih."

**Actions:**
- [ ] Recap key features:
  - ✅ Upload & verifikasi kegiatan
  - ✅ Progress tracking KUM
  - ✅ Usulan workflow
  - ✅ Blockchain audit trail
  - ✅ Document integrity
- [ ] Open for Q&A

---

## 🎬 Practice Checklist

### Practice Session 1 (30 minutes)
- [ ] Run through script slowly
- [ ] Note any stuck points
- [ ] Time each section
- [ ] Total time: [record time]

### Practice Session 2 (20 minutes)
- [ ] Run through at normal speed
- [ ] Focus on smooth transitions
- [ ] Practice speaking clearly
- [ ] Total time: [record time]

### Practice Session 3 (15 minutes)
- [ ] Full rehearsal with timer
- [ ] Simulate Q&A
- [ ] Backup plan if something breaks
- [ ] Total time: [record time] → Target: 10-12 minutes

**Goal:** Demo in 10-12 minutes (leave time for Q&A)

---

## 🛠️ Troubleshooting Guide (Backup Plans)

### Issue 1: Backend Not Starting
**Symptoms:** `npm start` fails, port already in use

**Solution:**
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Restart backend
cd backend
npm start
```

**Backup Plan:** Show screenshots + explain the flow

---

### Issue 2: Fabric Network Down
**Symptoms:** tx_id_fabric = null, health check shows Fabric: Disconnected

**Solution:**
```powershell
# Restart Fabric network
cd fabric-network
.\stop-network.ps1
.\start-network.ps1
```

**Backup Plan:** 
- Set `FABRIC_ENABLED=false`
- Explain: "Sistem bisa jalan tanpa blockchain (fallback mode)"
- Continue demo with database-only mode

---

### Issue 3: Frontend Not Loading
**Symptoms:** Blank page, cannot login

**Solution:**
```powershell
# Clear cache & restart
cd frontend
npm run dev
# Or hard refresh browser: Ctrl+Shift+R
```

**Backup Plan:** Use Postman to demo API endpoints

---

### Issue 4: Login Not Working
**Symptoms:** Invalid credentials error

**Solution:**
```powershell
# Reset test user passwords
cd backend
node seed-users.js
```

**Backup Plan:** Register new user on-the-fly (if registration enabled)

---

### Issue 5: Complete System Failure
**Worst case scenario: Nothing works**

**Backup Plan:**
1. Show backup video recording
2. Use slide presentation with screenshots
3. Explain architecture & code snippets
4. Show GitHub repository
5. Offer to re-demo later

**Key Message:** "Technical issues happen. What matters is understanding the concepts and implementation."

---

## 📋 Demo Day Checklist

### 2 Hours Before
- [ ] Arrive at venue / Setup workstation
- [ ] Test internet connection
- [ ] Test projector / screen sharing
- [ ] Start all services (PostgreSQL, Fabric, Backend, Frontend)
- [ ] Run quick smoke test (login, create kegiatan)
- [ ] Keep backup video ready

### 30 Minutes Before
- [ ] Clean up test data (optional - for fresh demo)
- [ ] Prepare demo files in easy-to-access folder
- [ ] Open all necessary browser tabs
- [ ] Close unnecessary apps (to avoid notifications)
- [ ] Silence phone
- [ ] Take deep breath! 😊

### During Demo
- [ ] Speak clearly and confidently
- [ ] Don't rush - better slow and clear
- [ ] If something breaks → Stay calm, use backup plan
- [ ] Engage with audience (eye contact, questions)
- [ ] Smile! You worked hard for this

### After Demo
- [ ] Answer Q&A confidently
- [ ] Thank the audience
- [ ] Note any feedback for improvements
- [ ] Celebrate! 🎉

---

## 💡 Pro Tips

### For Smooth Demo
1. **Disable auto-updates** - Windows, browser, VS Code
2. **Close Slack/Teams/Discord** - No distracting notifications
3. **Increase font size** - Audience can see clearly
4. **Use dual monitors** - Script on one, demo on projector
5. **Stay hydrated** - Keep water nearby

### For Q&A
**Common Questions & Answers:**

**Q: Mengapa pakai blockchain? Database biasa tidak cukup?**
A: "Blockchain memberikan immutability dan transparency. Data tidak bisa diubah setelah tercatat, sehingga meningkatkan trust dan accountability dalam proses kenaikan pangkat."

**Q: Bagaimana jika Fabric network down?**
A: "Sistem memiliki fallback mode. Bisa tetap jalan dengan database saja, tapi fitur blockchain (audit trail, immutability) akan disabled."

**Q: Apakah sistem ini scalable untuk ribuan dosen?**
A: "Ini MVP untuk proof of concept. Untuk production, perlu optimizations seperti caching (Redis), load balancing, dan multi-organization Fabric network. Roadmap lengkap ada di plan-full.md."

**Q: Berapa lama development?**
A: "Total 4 minggu mengikuti plan.md. Week 1: Infrastructure, Week 2: Backend, Week 3: Frontend, Week 4: Testing & Documentation."

**Q: Apa challenges terbesar?**
A: "Fabric networking issues (TLS, discovery settings) dan chaincode validation logic. Tapi berhasil di-resolve dengan testing yang comprehensive."

---

## ✅ Final Checklist Before Demo

- [ ] All services running & tested
- [ ] Test accounts working
- [ ] Demo files prepared
- [ ] Backup video/screenshots ready
- [ ] Practiced 3x (total time <12 minutes)
- [ ] Slide presentation finalized
- [ ] Q&A answers prepared
- [ ] Confident & ready! 🚀

---

**Good luck with your demo!** You've built something impressive. Trust your preparation and enjoy the moment! 🎉
