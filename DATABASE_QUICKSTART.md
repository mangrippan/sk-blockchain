# Database Quick Reference

## 🚀 Quick Start

### Start Database
```powershell
docker compose -f docker-compose.dev.yml up -d
```

### Stop Database
```powershell
docker compose -f docker-compose.dev.yml down
```

### Reset Database (Delete All Data)
```powershell
# Stop and remove containers + volumes
docker compose -f docker-compose.dev.yml down -v

# Start fresh
docker compose -f docker-compose.dev.yml up -d
```

---

## 📊 Database Connection Info

- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `chainrank_db`
- **User:** `postgres`
- **Password:** `postgres123` (sesuai .env)

---

## 🔧 Useful Commands

### Access PostgreSQL CLI
```powershell
docker exec -it chainrank_postgres_dev psql -U postgres -d chainrank_db
```

### Run SQL Query from Command Line
```powershell
docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT * FROM users;"
```

### Check Container Status
```powershell
docker ps -a --filter "name=chainrank_postgres_dev"
```

### View Container Logs
```powershell
docker logs chainrank_postgres_dev
```

### Check Database Size
```powershell
docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "\l+"
```

---

## 📋 Sample Data (Seed Data)

### Default Users
All users have password: `password123`

| NIP | Nama | Email | Role |
|-----|------|-------|------|
| 199001012020121001 | Admin System | admin@chainrank.test | admin |
| 198512152015041001 | Dr. Budi Santoso, M.Kom | budi.santoso@chainrank.test | dosen |
| 199003202019032002 | Siti Rahayu, M.T | siti.rahayu@chainrank.test | dosen |
| 199205102022031003 | Andi Wijaya, S.Kom., M.Cs | andi.wijaya@chainrank.test | dosen |
| 197808051998021001 | Prof. Dr. Ahmad Dahlan, M.Sc | ahmad.dahlan@chainrank.test | pimpinan |

### Sample Kegiatan
8 sample activities with different statuses:
- 4 verified
- 3 pending
- 1 rejected

---

## 🧪 Testing Queries

### List All Tables
```sql
\dt
```

### Count Users by Role
```sql
SELECT role, COUNT(*) FROM users GROUP BY role;
```

### List Kegiatan by Status
```sql
SELECT status, COUNT(*), SUM(poin_kum) as total_poin 
FROM kegiatan_dosen 
GROUP BY status;
```

### View Recent Activities
```sql
SELECT u.nama, k.jenis_kegiatan, k.poin_kum, k.status, k.created_at
FROM kegiatan_dosen k
JOIN users u ON k.user_id = u.id
ORDER BY k.created_at DESC
LIMIT 10;
```

### Check Audit Trail
```sql
SELECT u.nama, a.action, a.table_name, a.created_at
FROM audit_logs a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC;
```

---

## 🔍 PostgreSQL CLI Tips

Once inside `psql`:
- `\dt` - List all tables
- `\d table_name` - Describe table structure
- `\du` - List all users/roles
- `\l` - List all databases
- `\q` - Quit psql
- `\x` - Toggle expanded display (better for wide tables)

---

## 🛠️ Troubleshooting

### Container won't start
```powershell
# Check logs
docker logs chainrank_postgres_dev

# Check if port 5432 is already in use
netstat -ano | findstr :5432
```

### Database connection refused
```powershell
# Wait for health check to pass
docker ps -a --filter "name=chainrank_postgres_dev"

# Should show: (healthy) not (health: starting)
```

### Reset everything
```powershell
# Nuclear option: remove everything and start fresh
docker compose -f docker-compose.dev.yml down -v
docker volume rm chainrank_pgdata_dev
docker compose -f docker-compose.dev.yml up -d
```

---

## 📚 Next Steps

1. ✅ Database is running
2. ⏭️ Install backend dependencies: `cd backend && npm install`
3. ⏭️ Test database connection from Node.js
4. ⏭️ Build API endpoints
