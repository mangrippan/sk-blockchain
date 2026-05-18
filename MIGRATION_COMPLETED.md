# Migration Summary: jabatan_id Column

## ✅ Problem Solved
Error: `column "jabatan_id" does not exist`

## 📋 What Was Done

### 1. **Ran Migration File**
- Executed: `database/migration-jabatan-hierarchy.sql`
- This migration adds:
  - ✅ `ref_jabatan_akademik` table with hierarchy levels (1-5)
  - ✅ `jabatan_id` column to `users` table (FK to ref_jabatan_akademik)
  - ✅ `jabatan_asal_id` and `jabatan_tujuan_id` to `usulan_kenaikan_pangkat` table
  - ✅ `used_in_usulan_id` to `kegiatan_dosen` table (for KUM reset logic)
  - ✅ Helper functions: `get_next_jabatan()` and `validate_usulan_jabatan()`

### 2. **Reference Data Created**
**Jabatan Akademik Hierarchy:**
- Level 1: **TP** - Tenaga Pengajar (Min KUM: 0)
- Level 2: **AA** - Asisten Ahli (Min KUM: 100)
- Level 3: **L** - Lektor (Min KUM: 200)
- Level 4: **LK** - Lektor Kepala (Min KUM: 300)
- Level 5: **GB** - Guru Besar (Min KUM: 400)

### 3. **Existing Data Backfilled**
- Existing users mapped from `jabatan_saat_ini` (text) to `jabatan_id` (FK)
- All dosen users now have valid `jabatan_id`
- Sample mappings:
  - "Lektor" → jabatan_id = 3
  - "Lektor Kepala" → jabatan_id = 4

### 4. **Database Functions Added**
1. `get_next_jabatan(current_jabatan_id)` - Returns next level for promotion
2. `validate_usulan_jabatan(user_id, jabatan_tujuan_id)` - Validates promotion eligibility

## 🔍 Verification Complete
- ✅ `jabatan_id` column exists in `users` table
- ✅ All dosen users have `jabatan_id` assigned
- ✅ `ref_jabatan_akademik` table populated with 5 levels
- ✅ Helper functions working

## 🚀 Next Steps
The error should be resolved. The following endpoints now work:
- `GET /api/v1/ref/jabatan/next/:userId` - Get next jabatan for promotion
- `POST /api/v1/usulan` - Create usulan with jabatan validation
- Any query referencing `jabatan_id`

## 📝 Files Created/Modified
- ✅ Executed: `database/migration-jabatan-hierarchy.sql`
- ✅ Created: `backend/verify-migration.js` (for verification)

All systems ready! 🎉
