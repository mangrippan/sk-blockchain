# Database Setup Guide

## Quick Start

### 1. Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE prima_db;

# Connect to the new database
\c prima_db

# Run schema
\i 'C:/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/database/schema.sql'

# Verify tables created
\dt

# Check seed data
SELECT * FROM users;

# Exit
\q
```

### 2. Update .env

Edit `.env` file with your PostgreSQL password:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prima_db
DB_USER=postgres
DB_PASSWORD=your_actual_password_here
```

## Default Users

Schema includes 2 test users:

### Admin User
- **NIP:** 199001012020121001
- **Email:** admin@prima.test
- **Password:** admin123
- **Role:** admin

### Dosen User
- **NIP:** 199501012021031001
- **Email:** dosen@prima.test
- **Password:** dosen123
- **Role:** dosen

⚠️ **IMPORTANT:** Change these passwords in production!

## Schema Overview

### Tables

1. **users** - User accounts dengan role-based access
2. **kegiatan_dosen** - Kegiatan & dokumen dengan blockchain reference
3. **audit_logs** - Audit trail untuk compliance

### Views

1. **v_kegiatan_summary** - Summary kegiatan per user

## Useful Queries

### Check all kegiatan
```sql
SELECT 
  k.id,
  u.nama,
  k.jenis_kegiatan,
  k.poin_kum,
  k.status,
  k.blockchain_tx_id,
  k.created_at
FROM kegiatan_dosen k
JOIN users u ON k.user_id = u.id
WHERE k.deleted_at IS NULL
ORDER BY k.created_at DESC;
```

### Summary per user
```sql
SELECT * FROM v_kegiatan_summary;
```

### Check audit logs
```sql
SELECT 
  al.id,
  u.nama,
  al.action,
  al.table_name,
  al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;
```

## Migration & Updates

To add new features later, create migration files in `/database/migrations/`:

Example:
```
/database
  /migrations
    001_initial_schema.sql (this is already done)
    002_add_notification_table.sql (future)
    003_add_sk_table.sql (future)
```

## Backup & Restore

### Backup
```powershell
pg_dump -U postgres prima_db > backup_$(Get-Date -Format "yyyyMMdd").sql
```

### Restore
```powershell
psql -U postgres prima_db < backup_20260426.sql
```

## Troubleshooting

### Can't connect to database
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start if stopped
Start-Service -Name postgresql-x64-15
```

### Permission denied
```sql
-- Grant permissions (run as postgres user)
GRANT ALL PRIVILEGES ON DATABASE prima_db TO postgres;
```

### Need to reset everything
```sql
-- Drop all tables (CAREFUL!)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS kegiatan_dosen CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then run schema.sql again
```
