# Database Setup - RESOLVED ISSUES

## ✅ Quick Fix Summary (May 17, 2026)

### Problem Discovered
During review, found several database inconsistencies:
1. Multiple schema files (schema.sql, schema-hybrid.sql, schema-existing.sql)
2. Port conflict between Docker PostgreSQL and native Windows installation
3. Backend unable to connect to database
4. Inconsistent seed data (plan claimed 6 users, actually only 2)

### Solution Implemented

#### 1. Schema Consolidation ✅
- **Canonical Schema:** `database/schema-hybrid.sql`
- **Tables:** 8 tables in `sk` schema:
  ```
  - users
  - kegiatan_dosen
  - usulan_kenaikan_pangkat
  - dokumen_administrasi
  - audit_logs
  - ref_kegiatan_kum
  - ref_kategori_kum
  - ref_jenis_dokumen
  ```
- **Other schemas:** Archived (schema.sql, schema-existing.sql)

#### 2. Port Conflict Resolution ✅
**Problem:** Native PostgreSQL Windows (port 5432) conflicted with Docker container

**Solution:**
```yaml
# docker-compose.dev.yml
ports:
  - "5433:5432"  # Changed from 5432:5432
```

```env
# backend/.env
DB_PORT=5433  # Changed from 5432
```

**Result:** Docker PostgreSQL on port 5433, native on 5432 (both can coexist)

#### 3. Authentication Configuration ✅
```yaml
# docker-compose.dev.yml
environment:
  POSTGRES_HOST_AUTH_METHOD: md5
  POSTGRES_PASSWORD: postgres123
```

#### 4. Seed Data Loaded ✅
- **Users:** 5 (1 superadmin, 1 admin_sdm, 2 dosen, 1 pimpinan)
- **Kegiatan:** 12 (6 verified, 4 unverified, 2 rejected)
- **Ref Tables:** 9 kegiatan types, 4 categories

## 🚀 Current Working Setup

### Docker Container
```bash
# Start database
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker ps | Select-String postgres

# Expected: chainrank_postgres_dev on port 5433
```

### Backend Connection
```javascript
// config/database.js automatically sets:
// - search_path to 'sk'
// - port 5433
// - MD5 authentication

// Test connection:
const db = require('./config/database');
db.pool.query('SELECT COUNT(*) FROM users')
  .then(r => console.log('Users:', r.rows[0].count));
```

### Database Access from Host
```powershell
# Via docker exec (easiest)
docker exec -e PGPASSWORD=postgres123 chainrank_postgres_dev `
  psql -U postgres -d chainrank_db -c "SET search_path TO sk; SELECT COUNT(*) FROM users;"
```

## 📊 Data Verification

### Quick Check Script
```powershell
# Run from project root
docker exec -e PGPASSWORD=postgres123 chainrank_postgres_dev psql -U postgres -d chainrank_db -c "
SET search_path TO sk;
SELECT 'Users: ' || COUNT(*)::text FROM users
UNION ALL SELECT 'Kegiatan: ' || COUNT(*)::text FROM kegiatan_dosen
UNION ALL SELECT 'Ref Kegiatan: ' || COUNT(*)::text FROM ref_kegiatan_kum;
"
```

**Expected Output:**
```
 Users: 5
 Kegiatan: 12
 Ref Kegiatan: 9
```

## 🔧 Troubleshooting

### If Backend Can't Connect

**Check 1: Port**
```powershell
Get-NetTCPConnection -LocalPort 5433 -ErrorAction SilentlyContinue
# Should show Docker process
```

**Check 2: Container Running**
```powershell
docker ps | Select-String chainrank_postgres_dev
```

**Check 3: Environment Variables**
```powershell
cd backend
node -e "require('dotenv').config(); console.log('DB_PORT:', process.env.DB_PORT);"
# Should output: DB_PORT: 5433
```

**Check 4: Direct Connection Test**
```powershell
cd backend
node -e "const { Client } = require('pg'); const c = new Client({ host: 'localhost', port: 5433, database: 'chainrank_db', user: 'postgres', password: 'postgres123' }); c.connect().then(() => { console.log('✅ Connected!'); return c.end(); }).catch(e => console.error('❌', e.message));"
```

### If Data is Missing

**Reload Schema & Seed:**
```powershell
# Drop and recreate
docker exec chainrank_postgres_dev psql -U postgres -c "DROP DATABASE chainrank_db; CREATE DATABASE chainrank_db;"

# Load schema
Get-Content database/schema-hybrid.sql -Raw | docker exec -i chainrank_postgres_dev psql -U postgres -d chainrank_db

# Load seed
Get-Content database/seed.sql -Raw | docker exec -i chainrank_postgres_dev psql -U postgres -d chainrank_db

# Verify
docker exec -e PGPASSWORD=postgres123 chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SET search_path TO sk; SELECT COUNT(*) FROM users;"
```

## 📁 File Structure (Canonical)

```
database/
  ├── schema-hybrid.sql     ← CANONICAL SCHEMA (use this!)
  ├── seed.sql              ← Sample data
  ├── schema.sql            ← Archived (simple version)
  ├── schema-existing.sql   ← Archived (legacy)
  └── README.md             ← Setup guide
```

## ✅ Verification Checklist

Before proceeding to Minggu 2, verify:
- [ ] Docker PostgreSQL running on port 5433
- [ ] Backend can connect (`node backend/test-db.js` works)
- [ ] Users table has 5 records
- [ ] Kegiatan table has 12+ records
- [ ] Fabric network still running (8 containers)
- [ ] `.env` has correct `DB_PORT=5433`

## 🎯 Next Steps (Minggu 2)

With database working, proceed to:
1. Test API endpoint: `POST /api/v1/kegiatan`
2. Verify double-commit pattern (DB + Blockchain)
3. Test chaincode invocation from backend
4. Create Postman collection

---

**Status:** ✅ RESOLVED  
**Date:** May 17, 2026  
**Time to Fix:** ~1 hour  
**Lesson Learned:** Always check for port conflicts and use consistent schema from start!
