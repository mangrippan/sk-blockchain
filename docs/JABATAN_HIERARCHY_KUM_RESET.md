# Jabatan Hierarchy & KUM Reset Implementation

**Date**: May 18, 2026  
**Version**: 2.0  
**Status**: ✅ Completed

---

## 📋 Overview

Implementasi sistem hierarki jabatan akademik dan mekanisme reset KUM untuk memastikan:
1. ✅ Dosen tidak bisa loncat jabatan (harus naik bertahap)
2. ✅ Dosen tidak bisa pilih jabatan yang sudah lewat
3. ✅ KUM direset setelah SK issued (kegiatan lama tidak bisa dipakai lagi)
4. ✅ Jabatan otomatis diupdate setelah kenaikan disetujui

---

## 🎯 Problem Statement

### Masalah Sebelum Implementasi

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Jabatan stored as free text (`VARCHAR`) | Tidak ada validasi, data inconsistent |
| 2 | Tidak ada hierarchy jabatan | Dosen bisa loncat dari Lektor langsung ke Guru Besar |
| 3 | Tidak ada validasi jabatan tujuan | Dosen bisa pilih jabatan yang lebih rendah |
| 4 | KUM tidak direset setelah SK issued | Kegiatan lama bisa di-double count untuk usulan berikutnya |
| 5 | Jabatan tidak auto-update | Admin harus manual update jabatan user |

### Use Case yang Harus Dicegah

```
❌ SEBELUM:
Dosen (Asisten Ahli) → pilih Guru Besar → disetujui → langsung loncat 3 tingkat

❌ SEBELUM:
Dosen sudah SK issued → KUM 300 tetap available → ajukan usulan lagi pakai KUM yang sama

❌ SEBELUM:
Dosen (Lektor) → pilih Asisten Ahli → turun jabatan (tidak masuk akal)
```

---

## 🏗️ Solution Architecture

### 1. Reference Table: `ref_jabatan_akademik`

```sql
CREATE TABLE ref_jabatan_akademik (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(20) UNIQUE,
  nama VARCHAR(100),
  tingkat INT UNIQUE,           -- 1 = lowest, 5 = highest
  min_kum DECIMAL(8,2),          -- Minimum KUM required
  is_active BOOLEAN
);
```

**Data**:
| Kode | Nama | Tingkat | Min KUM |
|------|------|---------|---------|
| TP | Tenaga Pengajar | 1 | 0 |
| AA | Asisten Ahli | 2 | 100 |
| L | Lektor | 3 | 200 |
| LK | Lektor Kepala | 4 | 300 |
| GB | Guru Besar | 5 | 400 |

### 2. Foreign Key Integration

```sql
-- users table
ALTER TABLE users 
ADD COLUMN jabatan_id INT REFERENCES ref_jabatan_akademik(id);

-- usulan_kenaikan_pangkat table
ALTER TABLE usulan_kenaikan_pangkat
ADD COLUMN jabatan_asal_id INT REFERENCES ref_jabatan_akademik(id),
ADD COLUMN jabatan_tujuan_id INT REFERENCES ref_jabatan_akademik(id);
```

### 3. KUM Reset Mechanism

```sql
-- kegiatan_dosen table
ALTER TABLE kegiatan_dosen
ADD COLUMN used_in_usulan_id UUID REFERENCES usulan_kenaikan_pangkat(id);

-- Query KUM available (belum digunakan)
SELECT SUM(poin_kum) FROM kegiatan_dosen 
WHERE status = 'verified' 
  AND used_in_usulan_id IS NULL;
```

### 4. Validation Functions

**Function: `validate_usulan_jabatan(user_id, jabatan_tujuan_id)`**
```sql
-- Returns:
-- is_valid: BOOLEAN
-- message: TEXT
-- current_jabatan, target_jabatan, expected_jabatan: VARCHAR(100)

-- Rules:
1. Target must be current + 1 tingkat
2. Cannot skip levels
3. Cannot go backwards
4. Cannot promote if already at highest level (Guru Besar)
```

**Function: `get_next_jabatan(current_jabatan_id)`**
```sql
-- Returns next valid jabatan for promotion
-- NULL if already at highest level
```

---

## 📁 Files Changed

### Database

| File | Changes |
|------|---------|
| `database/migration-jabatan-hierarchy.sql` | **NEW** - Full migration script |
| `database/migration-add-snapshot.sql` | Existing (kegiatan snapshot) |

### Backend

| File | Changes |
|------|---------|
| `backend/routes/v1/ref.js` | Added `GET /ref/jabatan` and `GET /ref/jabatan/next/:userId` |
| `backend/routes/v1/usulan.js` | Updated `POST /` with jabatan validation + KUM filter |
| `backend/routes/v1/usulan.js` | Updated `PUT /:id/terbitkan-sk` with jabatan update + kegiatan lock |

### Frontend

| File | Changes |
|------|---------|
| `frontend/src/views/usulan/UsulanCreate.vue` | Complete redesign - auto-set jabatan, show hierarchy path |
| `frontend/src/api/ref.js` | Added `getJabatan()` and `getNextJabatan()` |

### Chaincode

| File | Changes |
|------|---------|
| `chaincode/lib/kegiatanContract.js` | No breaking changes (kept `_getMinKUM()` as fallback) |

---

## 🔄 Flow Comparison

### SEBELUM (Old Flow)

```
1. Dosen (Lektor) → Dashboard
   ├─ Total KUM: 300
   └─ Pilihan jabatan: Asisten Ahli, Lektor, Lektor Kepala, Guru Besar ❌

2. Dosen pilih Guru Besar ❌ (loncat 2 tingkat)
   └─ Submit → Berhasil ❌

3. Admin terbitkan SK
   └─ User jabatan: masih "Lektor" ❌ (tidak auto-update)

4. Dosen ajukan usulan lagi
   └─ KUM masih 300 ❌ (kegiatan lama bisa dipakai lagi)
```

### SESUDAH (New Flow)

```
1. Dosen (Lektor) → Dashboard
   ├─ Total KUM: 300 (hanya kegiatan unused)
   ├─ Jabatan saat ini: Lektor
   └─ Jabatan tujuan: Lektor Kepala ✅ (auto-set, tidak bisa ubah)

2. Validasi backend:
   ├─ validate_usulan_jabatan() → valid (Lektor → Lektor Kepala)
   ├─ Filter kegiatan: WHERE used_in_usulan_id IS NULL
   ├─ Total KUM: 300 >= 300 (min for Lektor Kepala) ✅
   └─ Submit → Berhasil ✅

3. Admin terbitkan SK:
   ├─ UPDATE users SET jabatan_id = 4 (Lektor Kepala) ✅
   ├─ UPDATE kegiatan SET used_in_usulan_id = usulan.id ✅
   └─ KUM reset ✅

4. Dosen (sekarang Lektor Kepala) ajukan usulan lagi:
   ├─ KUM available: 0 (kegiatan lama locked) ✅
   ├─ Jabatan tujuan: Guru Besar ✅ (auto-set)
   └─ Harus upload kegiatan baru min 400 poin ✅
```

---

## 🚀 Deployment Steps

### Step 1: Database Migration

```powershell
# Option 1: Copy file to container
docker cp database/migration-jabatan-hierarchy.sql chainrank_postgres_dev:/tmp/
docker exec -e PGPASSWORD=postgres123 chainrank_postgres_dev psql -U postgres -d chainrank_db -f /tmp/migration-jabatan-hierarchy.sql

# Option 2: Direct pipe
Get-Content database\migration-jabatan-hierarchy.sql | docker exec -i chainrank_postgres_dev psql -U postgres -d chainrank_db
```

**Expected Output**:
```
CREATE TABLE
INSERT 0 5
ALTER TABLE
CREATE INDEX
...
Migration completed successfully
```

### Step 2: Verify Migration

```sql
-- Check jabatan hierarchy
SELECT * FROM sk.ref_jabatan_akademik ORDER BY tingkat;

-- Check users with jabatan
SELECT u.nama_lengkap, j.nama as jabatan, j.tingkat 
FROM sk.users u
LEFT JOIN sk.ref_jabatan_akademik j ON u.jabatan_id = j.id
WHERE u.role = 'dosen';

-- Check kegiatan availability
SELECT 
  COUNT(*) FILTER (WHERE used_in_usulan_id IS NULL) as available,
  COUNT(*) FILTER (WHERE used_in_usulan_id IS NOT NULL) as locked,
  SUM(poin_kum) FILTER (WHERE used_in_usulan_id IS NULL) as available_kum
FROM sk.kegiatan_dosen
WHERE status = 'verified';
```

### Step 3: Restart Backend

```powershell
cd backend
npm start
```

**Test Endpoints**:
```bash
# Get all jabatan
curl http://localhost:5000/api/v1/ref/jabatan

# Get next jabatan for user
curl http://localhost:5000/api/v1/ref/jabatan/next/1 \
  -H "Authorization: Bearer <token>"
```

### Step 4: Restart Frontend

```powershell
cd frontend
npm run dev
```

**Test UI**:
1. Login as dosen
2. Navigate to "Ajukan Usulan"
3. Verify jabatan auto-set and cannot be changed
4. Verify KUM calculation excludes used kegiatan

### Step 5: Update Chaincode (Optional)

```bash
cd fabric-network
./install-cc.sh
# Or
./deploy-cc.sh
```

Note: Chaincode update is optional since there are no breaking changes.

---

## 🧪 Testing Scenarios

### Scenario 1: Normal Promotion Path

```
Initial State:
- User: Dr. Budi (Lektor, tingkat 3)
- KUM available: 350

Steps:
1. Login as Dr. Budi
2. Navigate to "Ajukan Usulan"
3. Verify:
   - Current: Lektor
   - Target: Lektor Kepala (auto-set)
   - KUM: 350 >= 300 ✅
4. Submit usulan
5. Login as admin → Approve → Terbitkan SK
6. Verify:
   - User jabatan updated to Lektor Kepala ✅
   - KUM available reset to 0 ✅
   - Kegiatan locked with used_in_usulan_id ✅
```

### Scenario 2: Insufficient KUM

```
Initial State:
- User: Dr. Ani (Asisten Ahli, tingkat 2)
- KUM available: 150

Steps:
1. Login as Dr. Ani
2. Navigate to "Ajukan Usulan"
3. Verify:
   - Current: Asisten Ahli
   - Target: Lektor (requires 200 KUM)
   - KUM: 150 < 200 ❌
4. Submit button disabled ✅
5. Error message: "KUM belum mencukupi" ✅
```

### Scenario 3: Already at Highest Level

```
Initial State:
- User: Prof. Ahmad (Guru Besar, tingkat 5)

Steps:
1. Login as Prof. Ahmad
2. Navigate to "Ajukan Usulan"
3. Verify:
   - Current: Guru Besar
   - Target: None (already at highest)
   - Error: "Sudah berada di jabatan tertinggi" ✅
4. Cannot submit usulan ✅
```

### Scenario 4: KUM Reset After SK Issued

```
Initial State:
- User: Dr. Budi (Lektor)
- Kegiatan: 5 items, total 350 KUM

Steps:
1. Submit usulan → Approved → SK issued
2. Check kegiatan:
   ```sql
   SELECT id, used_in_usulan_id, poin_kum 
   FROM kegiatan_dosen 
   WHERE dosen_id = <budi_id>;
   ```
   Result: All 5 kegiatan have used_in_usulan_id = usulan.id ✅

3. Check available KUM:
   ```sql
   SELECT SUM(poin_kum) FROM kegiatan_dosen
   WHERE dosen_id = <budi_id> AND used_in_usulan_id IS NULL;
   ```
   Result: 0 ✅

4. Upload new kegiatan → total 400 KUM
5. Submit new usulan for Guru Besar ✅
```

---

## 📊 Database Schema Changes

### New Table

```sql
CREATE TABLE sk.ref_jabatan_akademik (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  tingkat INT NOT NULL UNIQUE,
  min_kum DECIMAL(8,2) NOT NULL DEFAULT 0,
  deskripsi TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Altered Tables

```sql
-- users
ALTER TABLE sk.users 
ADD COLUMN jabatan_id INT REFERENCES ref_jabatan_akademik(id);

-- usulan_kenaikan_pangkat
ALTER TABLE sk.usulan_kenaikan_pangkat
ADD COLUMN jabatan_asal_id INT REFERENCES ref_jabatan_akademik(id),
ADD COLUMN jabatan_tujuan_id INT REFERENCES ref_jabatan_akademik(id);

-- kegiatan_dosen
ALTER TABLE sk.kegiatan_dosen
ADD COLUMN used_in_usulan_id UUID REFERENCES usulan_kenaikan_pangkat(id);
```

### New Indexes

```sql
CREATE INDEX idx_jabatan_tingkat ON ref_jabatan_akademik(tingkat);
CREATE INDEX idx_users_jabatan ON users(jabatan_id);
CREATE INDEX idx_usulan_jabatan_asal ON usulan_kenaikan_pangkat(jabatan_asal_id);
CREATE INDEX idx_usulan_jabatan_tujuan ON usulan_kenaikan_pangkat(jabatan_tujuan_id);
CREATE INDEX idx_kegiatan_used_in_usulan ON kegiatan_dosen(used_in_usulan_id);
```

### New Views

```sql
CREATE VIEW v_kegiatan_available_kum AS
SELECT k.*, 
       CASE WHEN k.used_in_usulan_id IS NULL THEN true ELSE false END as is_available
FROM kegiatan_dosen k
WHERE k.deleted_at IS NULL AND k.status = 'verified';
```

---

## 🔍 API Endpoints

### New Endpoints

#### 1. Get All Jabatan
```http
GET /api/v1/ref/jabatan?active_only=true
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "kode": "TP",
      "nama": "Tenaga Pengajar",
      "tingkat": 1,
      "min_kum": 0,
      "is_active": true
    },
    // ...
  ],
  "count": 5
}
```

#### 2. Get Next Jabatan for User
```http
GET /api/v1/ref/jabatan/next/:userId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "data": {
    "id": 4,
    "kode": "LK",
    "nama": "Lektor Kepala",
    "tingkat": 4,
    "min_kum": 300
  }
}
```

**Error Cases**:
```json
// No current jabatan
{
  "error": "User has no current jabatan assigned",
  "message": "Please contact admin to set your jabatan"
}

// Already at highest level
{
  "error": "Already at highest jabatan level",
  "message": "No further promotions available"
}
```

### Modified Endpoints

#### 3. Create Usulan
```http
POST /api/v1/usulan
Content-Type: application/json
Authorization: Bearer <token>

{
  "jabatan_tujuan_id": 4,  // Changed from jabatan_tujuan (string)
  "periode_penilaian_mulai": "2024-01-01",
  "periode_penilaian_selesai": "2025-12-31",
  "catatan": "Optional notes"
}
```

**New Validations**:
- ✅ User must have `jabatan_id` assigned
- ✅ `jabatan_tujuan_id` must be `current_tingkat + 1`
- ✅ KUM calculated from kegiatan where `used_in_usulan_id IS NULL`
- ✅ Total KUM must >= `min_kum` of target jabatan

**Error Responses**:
```json
// No jabatan assigned
{
  "error": "No current jabatan assigned",
  "message": "Please contact admin to set your jabatan before submitting usulan"
}

// Invalid jabatan target
{
  "error": "Invalid jabatan target",
  "message": "Cannot skip jabatan levels. Must promote one level at a time",
  "current_jabatan": "Lektor",
  "target_jabatan": "Guru Besar",
  "expected_jabatan": "Lektor Kepala"
}

// Insufficient KUM
{
  "error": "Insufficient KUM",
  "message": "You have 250 KUM, but Lektor Kepala requires minimum 300 KUM",
  "current_kum": 250,
  "required_kum": 300
}

// No available kegiatan
{
  "error": "No available kegiatan found",
  "message": "You must have verified kegiatan that have not been used in a previous usulan"
}
```

#### 4. Terbitkan SK
```http
PUT /api/v1/usulan/:id/terbitkan-sk
Content-Type: multipart/form-data
Authorization: Bearer <token>

sk_number: "123/SK/2026"
sk_date: "2026-05-18"
sk_document: <file>
```

**New Actions**:
1. ✅ Update `users.jabatan_id` to `usulan.jabatan_tujuan_id`
2. ✅ Update `users.jabatan_saat_ini` to jabatan name (backward compat)
3. ✅ Lock kegiatan: `UPDATE kegiatan SET used_in_usulan_id = usulan.id`
4. ✅ Record to blockchain

**Response**:
```json
{
  "message": "SK berhasil diterbitkan. Jabatan dosen telah diperbarui dan kegiatan telah dikunci.",
  "data": {
    "id": "uuid",
    "status": "sk_issued",
    "jabatan_baru": "Lektor Kepala"
  }
}
```

---

## 💡 Helper Functions

### PostgreSQL Functions

#### 1. `get_next_jabatan(current_jabatan_id)`
```sql
-- Returns the next jabatan in hierarchy
-- NULL if already at highest level

SELECT * FROM sk.get_next_jabatan(3);
-- Returns: {id: 4, kode: "LK", nama: "Lektor Kepala", ...}
```

#### 2. `validate_usulan_jabatan(user_id, jabatan_tujuan_id)`
```sql
-- Validates promotion path according to hierarchy rules

SELECT * FROM sk.validate_usulan_jabatan(1, 5);
-- Returns:
-- {
--   is_valid: false,
--   message: "Cannot skip jabatan levels...",
--   current_jabatan: "Lektor",
--   target_jabatan: "Guru Besar",
--   expected_jabatan: "Lektor Kepala"
-- }
```

#### 3. `check_usulan_snapshot_integrity(usulan_id)`
```sql
-- Verifies snapshot total matches usulan total

SELECT * FROM sk.check_usulan_snapshot_integrity('usulan-uuid');
-- Returns:
-- {
--   is_valid: true,
--   calculated_total: 350,
--   stored_total: 350,
--   snapshot_count: 5,
--   message: "Snapshot integrity verified"
-- }
```

---

## 🎨 Frontend Changes

### UsulanCreate.vue - Before

```vue
<select v-model="form.jabatan_tujuan">
  <option value="">-- Pilih Jabatan --</option>
  <option value="Asisten Ahli">Asisten Ahli</option>
  <option value="Lektor">Lektor</option>
  <option value="Lektor Kepala">Lektor Kepala</option>
  <option value="Guru Besar">Guru Besar</option>
</select>
```

### UsulanCreate.vue - After

```vue
<!-- Current & Next Jabatan Display -->
<div class="bg-blue-50 p-4 rounded">
  <div class="flex items-center gap-3">
    <div>
      <p class="text-sm text-blue-600">Jabatan Saat Ini</p>
      <p class="text-lg font-bold">{{ currentJabatan.nama }}</p>
    </div>
    <span>→</span>
    <div>
      <p class="text-sm text-green-600">Jabatan Tujuan</p>
      <p class="text-lg font-bold">{{ nextJabatan.nama }}</p>
    </div>
  </div>
</div>

<!-- Auto-set, read-only -->
<div class="px-4 py-3 border rounded bg-gray-50">
  <p class="font-medium">{{ nextJabatan.nama }}</p>
  <p class="text-xs text-gray-500">
    Minimum KUM: {{ nextJabatan.min_kum }}
  </p>
</div>
```

**Key Changes**:
- ✅ Auto-fetch current & next jabatan on mount
- ✅ Display hierarchy path visually
- ✅ No manual selection (auto-set from backend)
- ✅ Show KUM requirements
- ✅ Disable submit if KUM insufficient
- ✅ Better error messages

---

## 📈 Benefits

### For Users (Dosen)

| Before | After |
|--------|-------|
| Confusion about which jabatan to choose | Clear visual path (current → next) |
| Can accidentally choose wrong jabatan | Auto-set, no mistakes possible |
| Not clear about KUM requirements | Shows min KUM for target jabatan |
| Can submit even if KUM insufficient | Submit disabled with clear message |
| Old kegiatan can be reused | Must upload new kegiatan after promotion |

### For Admins

| Before | After |
|--------|-------|
| Manual jabatan validation | Automatic validation via database |
| Manual jabatan update after SK | Auto-update on SK issuance |
| Hard to track KUM usage | Clear tracking via `used_in_usulan_id` |
| Risk of data inconsistency | FK constraints ensure data integrity |

### For System

| Before | After |
|--------|-------|
| Free text jabatan (typos, inconsistency) | Normalized reference table |
| No hierarchy enforcement | Database-level validation |
| No audit trail for jabatan changes | Full audit via FK & timestamps |
| Complex business logic in code | Moved to database functions |
| Difficult to generate reports | Easy queries with JOINs |

---

## 🔐 Data Integrity Guarantees

1. **Referential Integrity**:
   - FK constraints ensure valid jabatan references
   - Cannot delete jabatan if users/usulan still reference it

2. **Hierarchy Enforcement**:
   - Database function validates tingkat progression
   - Application layer double-checks before submission

3. **KUM Accounting**:
   - `used_in_usulan_id` creates immutable link
   - View `v_kegiatan_available_kum` provides accurate count
   - Snapshot in `usulan_kegiatan_snapshot` preserves history

4. **Audit Trail**:
   - All jabatan changes logged in `audit_logs`
   - Timestamp tracking (`created_at`, `updated_at`)
   - Soft delete preservation (`deleted_at`)

---

## 🐛 Troubleshooting

### Issue: "User has no current jabatan assigned"

**Cause**: User's `jabatan_id` is NULL

**Solution**:
```sql
-- Check user jabatan
SELECT id, nama_lengkap, jabatan_saat_ini, jabatan_id 
FROM sk.users WHERE id = <user_id>;

-- Update manually (admin only)
UPDATE sk.users 
SET jabatan_id = (SELECT id FROM sk.ref_jabatan_akademik WHERE nama = 'Lektor')
WHERE id = <user_id>;
```

### Issue: "No available kegiatan found"

**Cause**: All kegiatan already used in previous usulan

**Solution**:
```sql
-- Check kegiatan status
SELECT id, poin_kum, used_in_usulan_id, status
FROM sk.kegiatan_dosen
WHERE dosen_id = <user_id> AND status = 'verified';

-- If incorrect, unlock kegiatan (admin only, use with caution!)
UPDATE sk.kegiatan_dosen 
SET used_in_usulan_id = NULL 
WHERE id = <kegiatan_id>;
```

### Issue: Migration fails on backfill

**Cause**: Existing `jabatan_saat_ini` values don't match ref table

**Solution**:
```sql
-- Check unmatched values
SELECT DISTINCT jabatan_saat_ini 
FROM sk.users 
WHERE jabatan_id IS NULL AND role = 'dosen';

-- Manual mapping
UPDATE sk.users 
SET jabatan_id = (SELECT id FROM sk.ref_jabatan_akademik WHERE kode = 'L')
WHERE jabatan_saat_ini = 'Some Custom Value';
```

---

## 📚 Related Documentation

- [Database Migration Guide](../database/README.md)
- [API Documentation](./API_TESTING_GUIDE.md)
- [Blockchain Integration](./BLOCKCHAIN_TIMESTAMP_FIX.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## ✅ Checklist for Production

- [ ] Run database migration on production DB
- [ ] Verify all existing users have `jabatan_id` assigned
- [ ] Verify all existing usulan have `jabatan_asal_id` and `jabatan_tujuan_id`
- [ ] Test all API endpoints with Postman/curl
- [ ] Test frontend flow with real user accounts
- [ ] Update API documentation
- [ ] Train admin staff on new SK issuance flow
- [ ] Inform dosen about new usulan submission process
- [ ] Monitor logs for any validation errors
- [ ] Setup database backup before deployment
- [ ] Prepare rollback script (if needed)

---

## 🔄 Rollback Plan (If Needed)

```sql
-- 1. Remove new columns (data preserved in old text columns)
ALTER TABLE sk.users DROP COLUMN IF EXISTS jabatan_id;
ALTER TABLE sk.usulan_kenaikan_pangkat 
  DROP COLUMN IF EXISTS jabatan_asal_id,
  DROP COLUMN IF EXISTS jabatan_tujuan_id;
ALTER TABLE sk.kegiatan_dosen DROP COLUMN IF EXISTS used_in_usulan_id;

-- 2. Drop functions
DROP FUNCTION IF EXISTS sk.get_next_jabatan(INT);
DROP FUNCTION IF EXISTS sk.validate_usulan_jabatan(INT, INT);
DROP FUNCTION IF EXISTS sk.check_usulan_snapshot_integrity(UUID);

-- 3. Drop views
DROP VIEW IF EXISTS sk.v_kegiatan_available_kum;

-- 4. Drop ref table
DROP TABLE IF EXISTS sk.ref_jabatan_akademik;

-- 5. Restore backend/frontend from git
git checkout HEAD~1 backend/routes/v1/ref.js
git checkout HEAD~1 backend/routes/v1/usulan.js
git checkout HEAD~1 frontend/src/views/usulan/UsulanCreate.vue
git checkout HEAD~1 frontend/src/api/ref.js
```

---

## 📝 Notes

- Migration is **backward compatible**: old `jabatan_saat_ini` and `jabatan_asal/tujuan` text fields are preserved
- New fields are **nullable** initially to allow gradual migration
- Backfill script attempts automatic mapping but manual review recommended
- Frontend gracefully handles users without `jabatan_id` (shows error message)
- Chaincode requires no changes (backward compatible)

---

**Implementation completed**: May 18, 2026  
**Tested by**: Development Team  
**Approved by**: Product Owner  
**Status**: ✅ Ready for Production
