# Backend Setup Complete! ✅

## 📦 Installed Dependencies

### Production:
- **express** - Web framework
- **pg** - PostgreSQL client
- **dotenv** - Environment variables
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **multer** - File upload handling
- **crypto-js** - Additional encryption utilities

### Development:
- **nodemon** - Auto-reload during development

---

## 📁 Created Files

### Configuration:
- `config/database.js` - PostgreSQL connection pool
- `server.js` - Main Express server
- `package.json` - Updated with scripts

### Utilities:
- `utils/hashUtils.js` - SHA-256 file hashing
- `utils/mockFabricClient.js` - Mock blockchain client (temporary)

### Middleware:
- `middleware/auth.js` - JWT authentication & role checking

### Routes (API v1):
- `routes/v1/auth.js` - Authentication endpoints
  - POST /api/v1/auth/register
  - POST /api/v1/auth/login
  - GET /api/v1/auth/me

---

## 🔧 Configuration Required

### 1. Update `.env` file dengan database server info:

```env
# Database Configuration (Remote Server)
DB_HOST=your_actual_server_host_or_ip
DB_PORT=5432
DB_NAME=prima_db
DB_USER=your_actual_db_username
DB_PASSWORD=your_actual_db_password
DB_POOL_SIZE=10
DB_SSL=false  # Set to true if server requires SSL

# JWT already configured with secure random secret ✅
JWT_SECRET=32a7ff6dcbc28ec13c41549b4c1fdfd57ce7158e42aa3e7e86771390737328cc
```

### 2. Make sure database schema is created on server:

The server should have these tables:
- `users` (with seed data: admin & dosen)
- `kegiatan_dosen`
- `audit_logs`

Schema file available in: `database/schema.sql`

---

## 🚀 How to Run

### Development Mode (with auto-reload):
```bash
cd backend
npm run dev
```

### Production Mode:
```bash
cd backend
npm start
```

---

## ✅ Test the Server

### 1. Start the server:
```bash
cd backend
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
🕐 Database server time: 2026-04-26T...
🚀 Prima Backend Server
📡 Running on: http://localhost:3000
```

### 2. Test health endpoint:
```bash
# In browser or new terminal:
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-26T...",
  "uptime": 1.234,
  "environment": "development"
}
```

### 3. Test login with seed user:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@prima.test",
    "password": "admin123"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nip": "199001012020121001",
    "nama": "Admin System",
    "email": "admin@prima.test",
    "role": "admin"
  }
}
```

---

## 📝 Available Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/` | API info | No |
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | User login | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |

---

## 🔄 Next Steps

1. ✅ Update `.env` with actual database credentials
2. ✅ Test server connection
3. ⏳ Setup Hyperledger Fabric test-network
4. ⏳ Create kegiatan routes (CRUD operations)
5. ⏳ Integrate Fabric client
6. ⏳ Add file upload functionality

---

## 🐛 Troubleshooting

### Server won't start:
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Or change port in .env:
PORT=3001
```

### Database connection fails:
- Check `.env` credentials
- Verify server firewall allows connection
- Test connection manually: `psql -h HOST -U USER -d prima_db`

### npm command not found:
```powershell
# Make sure execution policy is set
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

**Backend is ready to use!** 🎉

Test it now, then we'll setup Hyperledger Fabric next.
