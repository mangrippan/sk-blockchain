# Week 1 Progress: Setup Infrastruktur

## ✅ Completed

### 1.1 Repository Structure
```
UsulanKenaikanPangkatBlockchain/
├── .git/
├── .vscode/
│   ├── extensions.json    # VS Code extensions recommendations
│   └── settings.json       # Editor settings (Prettier, ESLint)
├── backend/
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers (thin)
│   ├── services/          # Business logic (thick)
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Helper functions
│   ├── models/            # Database models
│   └── validators/        # Input validation
├── frontend/              # Vue.js app (empty for now)
├── chaincode/             # Hyperledger Fabric chaincode
├── docs/                  # Additional documentation
├── uploads/               # File storage (development only)
│   └── .gitkeep
├── .env                   # Environment variables (NOT in git)
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── README.md              # Project overview
├── plan.md                # MVP roadmap
├── plan-full.md           # Production roadmap
└── MIGRATION.md           # Migration guide
```

### 1.2 Tools Verification

#### ✅ Installed:
- **Git:** v2.45.1 ✅
- **Node.js:** v23.1.0 ✅ (LTS recommended: v18 or v20, tapi v23 works)

#### ❌ Need to Install:
- **npm:** Error (execution policy issue)
- **Docker:** Not installed ❌
- **PostgreSQL:** Not installed ❌

---

## 🔧 Next Steps: Install Missing Tools

### Step 1: Fix npm Execution Policy (PowerShell Issue)

**Problem:** PowerShell execution policy blocking npm

**Solution:** Run PowerShell as Administrator, then:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Verify:**
```powershell
npm --version
```

### Step 2: Install Docker Desktop for Windows

**Download:** https://www.docker.com/products/docker-desktop/

**Installation:**
1. Download Docker Desktop installer
2. Run installer
3. Restart computer if required
4. Open Docker Desktop
5. Wait until "Docker Desktop is running"

**Verify:**
```powershell
docker --version
docker compose version
```

**Important for Hyperledger Fabric:**
- Docker Desktop Settings → Resources:
  - CPUs: Minimum 2, Recommended 4
  - Memory: Minimum 4GB, Recommended 8GB
  - Disk: Minimum 20GB free space

### Step 3: Install PostgreSQL 15

**Option A: Official Installer (Recommended)**
1. Download: https://www.postgresql.org/download/windows/
2. Run installer
3. During installation:
   - Port: `5432` (default)
   - Password: Set strong password (note it down!)
   - Locale: Default
4. Add to PATH (installer should do this automatically)

**Option B: Using Chocolatey (if you have it)**
```powershell
choco install postgresql15
```

**Verify:**
```powershell
psql --version
```

**Setup:**
```powershell
# Connect to PostgreSQL
psql -U postgres

# You'll be prompted for password
# Then in psql prompt:
CREATE DATABASE chainrank_db;
\q
```

### Step 4: Update .env with PostgreSQL Password

Edit `.env` file:
```env
DB_PASSWORD=your_actual_postgres_password_here
```

---

## 📝 Installation Checklist

Complete this checklist:

- [ ] Fix npm execution policy
- [ ] Verify `npm --version` works
- [ ] Install Docker Desktop
- [ ] Verify Docker is running
- [ ] Configure Docker resources (4GB RAM minimum)
- [ ] Install PostgreSQL 15
- [ ] Set PostgreSQL password
- [ ] Create `chainrank_db` database
- [ ] Update `.env` with DB password
- [ ] Test PostgreSQL connection:
  ```powershell
  psql -U postgres -d chainrank_db
  ```

---

## 🎯 When All Tools Installed

After completing the checklist above, you can proceed to:

### Next: Create Database Schema

Run this SQL script (save as `database/schema.sql`):

```sql
-- See the schema in the next file I'll create
```

---

## 📌 Important Notes

1. **PowerShell ExecutionPolicy:** Jika masih error, bisa gunakan:
   ```powershell
   # Alternative: Run npm via npx
   npx --version
   ```

2. **Docker on Windows:** 
   - Need Windows 10/11 Pro, Enterprise, or Education for Hyper-V
   - Or WSL 2 backend (works on Windows Home)

3. **PostgreSQL:**
   - Remember your password! You'll need it frequently
   - Default port 5432 must be available
   - Service "postgresql" should start automatically

4. **Next Session:**
   - Once all tools installed, we'll:
     - Initialize backend package.json
     - Create database schema
     - Setup Hyperledger Fabric test-network

---

## 🆘 Troubleshooting

### npm execution policy error
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Docker won't start
- Check if Hyper-V or WSL 2 is enabled
- Check if virtualization is enabled in BIOS
- Restart computer after installation

### PostgreSQL connection refused
- Check if service is running:
  ```powershell
  Get-Service -Name postgresql*
  ```
- Start service if stopped:
  ```powershell
  Start-Service -Name postgresql-x64-15
  ```

### Port already in use
- PostgreSQL default: 5432
- Backend will use: 3000
- Frontend dev server: 5173
- Check with: `netstat -ano | findstr :5432`

---

**Current Status:** Repository structure ✅ | Tools installation ⏳ | Ready to continue after tools installed

