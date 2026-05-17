# Manual Testing Guide - ChainRank

**Purpose:** Comprehensive manual testing checklist untuk memastikan semua fitur working sebelum demo/submission.  
**Timeline:** 2-3 hours untuk complete testing  
**Prerequisites:** Backend, Frontend, dan Fabric network harus running

---

## 🚀 Pre-Testing Setup

### 1. Start All Services

```powershell
# Terminal 1: Start PostgreSQL (Docker)
docker-compose -f docker-compose.dev.yml up -d

# Terminal 2: Start Fabric Network (Optional - untuk blockchain features)
cd fabric-network
.\start-network.ps1

# Terminal 3: Start Backend
cd backend
npm start

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

### 2. Verify Services Running

- [ ] PostgreSQL: `docker ps | findstr postgres` → Container running
- [ ] Fabric: `docker ps | findstr peer` → Peers & orderer running
- [ ] Backend: Open http://localhost:3000/api/v1/health → Status 200
- [ ] Frontend: Open http://localhost:5173 → Login page loads

### 3. Prepare Test Data

**Test Accounts (already seeded):**
- **Dosen:** `budi.santoso@chainrank.test` / `password123`
- **Admin SDM:** `dewi.lestari@chainrank.test` / `password123`
- **Superadmin:** `admin@chainrank.test` / `password123`

**Test Files:**
- Prepare 2-3 sample PDF files (<5MB) untuk upload testing
- Prepare 1 non-PDF file (untuk negative testing)
- Prepare 1 large file (>5MB) untuk size validation test

---

## ✅ Test Scenarios

### Scenario 1: Authentication & Authorization (15 minutes)

#### 1.1 User Registration (Optional - if enabled)
- [ ] Navigate to register page
- [ ] Fill valid user data
- [ ] Submit → User created successfully
- [ ] Verify email uniqueness validation (try duplicate email)

#### 1.2 Login Flow
- [ ] Login with **invalid credentials** → Error message shown
- [ ] Login with **valid dosen** credentials → Redirect to dashboard
- [ ] Verify JWT token saved in localStorage
- [ ] Refresh page → User stays logged in
- [ ] Logout → Token cleared, redirect to login

#### 1.3 Role-based Access
- [ ] Login as **dosen** → Sidebar shows: Dashboard, Kegiatan, Usulan, Profile
- [ ] Login as **admin** → Sidebar shows: Dashboard, Verifikasi, Usulan, Audit Trail
- [ ] Try accessing `/verifikasi` as dosen → Blocked or redirected
- [ ] Try accessing admin API endpoints as dosen → 403 Forbidden

**Expected Results:**
- ✅ Login works with correct credentials
- ✅ Invalid login shows error message
- ✅ Role-based menu displayed correctly
- ✅ Authorization enforced on routes & API

---

### Scenario 2: Kegiatan Workflow - Dosen (30 minutes)

#### 2.1 Upload Kegiatan
- [ ] Login as **dosen** (budi.santoso)
- [ ] Navigate to Dashboard or Kegiatan List
- [ ] Click "Tambah Kegiatan" button
- [ ] Select Kategori KUM (e.g., "Pendidikan")
- [ ] Select Jenis Kegiatan (e.g., "Membimbing mahasiswa")
- [ ] Fill Deskripsi (e.g., "Membimbing 5 mahasiswa S1")
- [ ] Upload PDF file
- [ ] Submit form
- [ ] **Verify:** Kegiatan appears in list with status "Belum Diverifikasi"
- [ ] **Verify:** Progress bar KUM = 0 (not yet verified)

#### 2.2 View Kegiatan Detail
- [ ] Click kegiatan yang baru dibuat
- [ ] **Verify:** All details displayed (kategori, deskripsi, file, poin KUM)
- [ ] **Verify:** Status badge shows "Belum Diverifikasi"
- [ ] **Verify:** tx_id_fabric shown (jika Fabric enabled)
- [ ] **Verify:** Download file link works
- [ ] **Verify:** Audit trail timeline shows "Created" event

#### 2.3 File Validation Testing
- [ ] Try upload **non-PDF file** (e.g., .docx, .jpg) → Rejected with error
- [ ] Try upload **file >5MB** → Rejected with error
- [ ] Try submit without file → Validation error
- [ ] Try submit without selecting kegiatan → Validation error

**Expected Results:**
- ✅ Valid kegiatan uploaded successfully
- ✅ Kegiatan appears in list with correct data
- ✅ File validation works (PDF only, <5MB)
- ✅ Blockchain tx_id saved (if Fabric enabled)

---

### Scenario 3: Verifikasi Kegiatan - Admin (20 minutes)

#### 3.1 View Unverified Kegiatan
- [ ] **Logout**, login as **admin SDM** (dewi.lestari)
- [ ] Navigate to "Verifikasi" page
- [ ] **Verify:** List of unverified kegiatan shown
- [ ] **Verify:** Filter by status "Belum Diverifikasi" works
- [ ] Click kegiatan detail → View full info

#### 3.2 Verify Kegiatan (Approve)
- [ ] Select kegiatan with status "Belum Diverifikasi"
- [ ] Click "Verifikasi" or "Setujui" button
- [ ] **Verify:** Status changes to "Terverifikasi"
- [ ] **Verify:** tx_id_fabric updated (new transaction ID)
- [ ] **Verify:** Kegiatan removed from "Belum Diverifikasi" list
- [ ] View audit trail → "Verified" event added

#### 3.3 Reject Kegiatan
- [ ] Upload another kegiatan as dosen
- [ ] Login as admin
- [ ] Select the new kegiatan
- [ ] Click "Tolak" button
- [ ] Enter catatan penolakan (e.g., "File tidak jelas")
- [ ] Submit
- [ ] **Verify:** Status changes to "Ditolak"
- [ ] **Verify:** Catatan penolakan displayed
- [ ] View audit trail → "Rejected" event with note

**Expected Results:**
- ✅ Admin can view unverified kegiatan
- ✅ Verify action changes status & saves tx_id
- ✅ Reject action saves rejection note
- ✅ Audit trail updated with new events

---

### Scenario 4: Progress Bar KUM (15 minutes)

#### 4.1 KUM Accumulation
- [ ] Login as **dosen**
- [ ] View Dashboard → Check initial KUM progress (e.g., 0/200)
- [ ] Upload 3-4 kegiatan with different poin KUM
- [ ] Login as admin → Verify all kegiatan
- [ ] **Logout & login as dosen**
- [ ] View Dashboard → **Verify:** Progress bar updated
- [ ] **Verify:** Total KUM = sum of verified kegiatan poin

#### 4.2 KUM Requirement Met
- [ ] If KUM >= target (e.g., 200):
  - [ ] **Verify:** Progress bar shows 100% (green)
  - [ ] **Verify:** Notification/message: "KUM memenuhi syarat kenaikan pangkat"
  - [ ] **Verify:** "Ajukan Usulan" button enabled/visible

**Expected Results:**
- ✅ Progress bar calculates KUM correctly
- ✅ Only verified kegiatan counted
- ✅ Progress bar visual updates (color, percentage)
- ✅ Notification shown when requirement met

---

### Scenario 5: Usulan Kenaikan Pangkat (25 minutes)

#### 5.1 Create Usulan
- [ ] Login as **dosen** with sufficient KUM (≥200)
- [ ] Navigate to "Usulan" page
- [ ] Click "Ajukan Usulan Baru"
- [ ] Select jabatan tujuan (e.g., "Lektor Kepala")
- [ ] Fill dokumen pendukung (if required)
- [ ] Submit usulan
- [ ] **Verify:** Usulan appears in list with status "Pending"
- [ ] **Verify:** tx_id_fabric saved (jika Fabric enabled)
- [ ] **Verify:** Total KUM displayed correctly

#### 5.2 Process Usulan - Admin
- [ ] Login as **admin SDM**
- [ ] Navigate to "Usulan" or "Verifikasi" page
- [ ] View usulan list → Filter "Pending"
- [ ] Click usulan detail
- [ ] Click "Proses" button
- [ ] **Verify:** Status changes to "Diproses"
- [ ] **Verify:** tx_id_fabric updated
- [ ] View audit trail → "Processed" event added

#### 5.3 Issue SK (SK Issuance)
- [ ] As admin, select usulan with status "Diproses"
- [ ] Click "Terbitkan SK" button
- [ ] Upload SK PDF file
- [ ] Optionally fill SK number & tanggal
- [ ] Submit
- [ ] **Verify:** Status changes to "SK Terbit"
- [ ] **Verify:** tx_id_fabric updated (SK hash saved to blockchain)
- [ ] Download SK file → Verify correct file
- [ ] View audit trail → "SK Issued" event with file hash

#### 5.4 Reject Usulan
- [ ] Create another usulan as dosen
- [ ] As admin, click "Tolak" button
- [ ] Enter catatan penolakan
- [ ] Submit
- [ ] **Verify:** Status changes to "Ditolak"
- [ ] **Verify:** Catatan penolakan displayed
- [ ] View audit trail → "Rejected" event

**Expected Results:**
- ✅ Usulan creation works only with sufficient KUM
- ✅ Admin can process/reject usulan
- ✅ SK upload & hash saving works
- ✅ All state transitions recorded in blockchain

---

### Scenario 6: Audit Trail & Blockchain Verification (20 minutes)

#### 6.1 View Audit Trail
- [ ] Navigate to Kegiatan Detail page
- [ ] **Verify:** Timeline shows all events (Created, Verified/Rejected)
- [ ] **Verify:** Each event shows timestamp, action, and tx_id
- [ ] Navigate to Usulan Detail page
- [ ] **Verify:** Timeline shows all events (Created, Processed, SK Issued)

#### 6.2 Blockchain Transaction ID Verification
- [ ] Check tx_id_fabric in database:
  ```sql
  SELECT id, deskripsi, status, tx_id_fabric 
  FROM sk.kegiatan_dosen 
  WHERE user_id = (SELECT id FROM sk.users WHERE email = 'budi.santoso@chainrank.test')
  ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] **Verify:** tx_id_fabric is not null for verified kegiatan
- [ ] **Verify:** tx_id format: 64-character hexadecimal string
- [ ] Navigate to Audit Trail page (Admin)
- [ ] Search by entity type "Kegiatan" or "Usulan"
- [ ] **Verify:** All transactions listed with tx_id

#### 6.3 Hash Verification (if UI implemented)
- [ ] View kegiatan detail with uploaded file
- [ ] **Verify:** "File Hash" displayed
- [ ] **Verify:** "Blockchain Hash" displayed (from audit trail)
- [ ] **Verify:** Both hashes match → ✅ File integrity valid
- [ ] (Advanced) Manually edit file → Re-check hash → ❌ Tampering detected

**Expected Results:**
- ✅ Audit trail displays complete history
- ✅ Transaction IDs are valid & saved
- ✅ Hash verification logic works (if implemented)

---

### Scenario 7: Error Handling & Edge Cases (15 minutes)

#### 7.1 Network Errors
- [ ] Stop backend server
- [ ] Try login → Error message shown
- [ ] Try any API call → Error handled gracefully
- [ ] Restart backend → App recovers

#### 7.2 Unauthorized Access
- [ ] Try accessing API endpoint without token (via Postman/curl):
  ```bash
  curl http://localhost:3000/api/v1/kegiatan
  ```
- [ ] **Expected:** 401 Unauthorized
- [ ] Try accessing admin endpoint as dosen:
  ```bash
  curl -H "Authorization: Bearer <dosen-token>" http://localhost:3000/api/v1/kegiatan/999/verify
  ```
- [ ] **Expected:** 403 Forbidden

#### 7.3 Invalid Data
- [ ] Try create kegiatan with missing required field
- [ ] Try create usulan with insufficient KUM
- [ ] Try upload usulan with invalid jabatan
- [ ] **Verify:** All validation errors shown to user

#### 7.4 Blockchain Fallback Mode
- [ ] Stop Fabric network: `.\stop-network.ps1`
- [ ] Set `FABRIC_ENABLED=false` in `.env`
- [ ] Restart backend
- [ ] **Verify:** App still works (database-only mode)
- [ ] Upload kegiatan → tx_id_fabric = null
- [ ] Verify health check shows "Fabric: Disabled"

**Expected Results:**
- ✅ Error messages user-friendly
- ✅ Authorization properly enforced
- ✅ Validation prevents invalid data
- ✅ Fallback mode works without blockchain

---

### Scenario 8: Document Tampering Detection (20 minutes)

**⚠️ CRITICAL DEMO FEATURE**

#### 8.1 Upload & Record Hash
- [ ] Login as dosen
- [ ] Upload kegiatan with test PDF file (keep a copy)
- [ ] Note the file hash displayed (or check in database)
- [ ] Admin verifies the kegiatan
- [ ] Download the uploaded file from the system

#### 8.2 Simulate Tampering
- [ ] Manually edit the downloaded PDF file (add text, change content)
- [ ] Calculate new hash of modified file:
  ```powershell
  Get-FileHash -Path "modified-file.pdf" -Algorithm SHA256
  ```
- [ ] Compare with original hash in database

#### 8.3 Detection (if UI implemented)
- [ ] View kegiatan detail page
- [ ] Click "Verify File Integrity" button (if exists)
- [ ] Upload the modified file
- [ ] **Expected:** ❌ Hash mismatch detected → "File has been tampered"
- [ ] Upload original file
- [ ] **Expected:** ✅ Hash match → "File integrity valid"

**Note:** If hash verification UI not implemented, demonstrate via:
1. Show hash in database
2. Show hash calculation command
3. Explain blockchain prevents hash modification

**Expected Results:**
- ✅ Original file hash matches blockchain
- ✅ Modified file detected as tampered
- ✅ Blockchain immutability demonstrated

---

## 📊 Testing Summary Checklist

After completing all scenarios, verify:

### Core Features
- [x] Authentication & Authorization working
- [x] Upload kegiatan (Dosen)
- [x] Verify/Reject kegiatan (Admin)
- [x] Progress bar KUM tracking
- [x] Create usulan
- [x] Process usulan (Admin)
- [x] Issue SK with file upload
- [x] Audit trail display

### Blockchain Integration
- [x] Transaction IDs saved to database
- [x] Transaction IDs are valid (64-char hex)
- [x] Audit trail retrieved from blockchain
- [x] File hash recorded on-chain
- [x] Fallback mode works (FABRIC_ENABLED=false)

### Data Validation
- [x] File type validation (PDF only)
- [x] File size validation (<5MB)
- [x] Required field validation
- [x] Role-based authorization
- [x] KUM requirement validation

### Error Handling
- [x] Network error handling
- [x] Invalid login error
- [x] Unauthorized access blocked
- [x] User-friendly error messages

---

## 🐛 Bug Tracking Template

**Use this template to document any bugs found during testing:**

```markdown
### Bug #[Number]: [Brief Title]

**Severity:** Critical / High / Medium / Low
**Found in Scenario:** [Scenario number]
**Date Found:** [Date]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Logs:**
[Attach screenshots or error logs]

**Fix Status:** ⏳ Pending / 🔄 In Progress / ✅ Fixed
```

---

## 📝 Test Results Template

**Document your test results:**

| Scenario | Status | Notes | Tester | Date |
|----------|--------|-------|--------|------|
| 1. Authentication | ✅ Pass | All login flows working | [Name] | [Date] |
| 2. Kegiatan Upload | ✅ Pass | File validation working | [Name] | [Date] |
| 3. Verifikasi | ✅ Pass | tx_id saved correctly | [Name] | [Date] |
| 4. Progress Bar KUM | ✅ Pass | Calculations accurate | [Name] | [Date] |
| 5. Usulan Workflow | ✅ Pass | All states working | [Name] | [Date] |
| 6. Audit Trail | ✅ Pass | History complete | [Name] | [Date] |
| 7. Error Handling | ✅ Pass | Graceful errors | [Name] | [Date] |
| 8. Tampering Detection | ⏳ Pending | UI not implemented | [Name] | [Date] |

**Overall Test Result:** ✅ PASS / ⚠️ PASS with Issues / ❌ FAIL

---

## 🎯 Next Steps After Testing

1. **Fix Critical Bugs** - Any bugs blocking demo must be fixed immediately
2. **Document Known Issues** - List any minor bugs in README or docs
3. **Practice Demo** - Use this guide as demo script
4. **Prepare Backup** - Take screenshots/videos in case live demo fails
5. **Final Verification** - Test in fresh environment (Docker from scratch)

---

**Testing Complete?** Proceed to [DEMO_PREPARATION.md](DEMO_PREPARATION.md) for demo practice!
