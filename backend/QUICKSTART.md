# 🚀 Prima Backend - Quick Start Guide

## 📋 Prerequisites

- Node.js v18+ (recommended)
- PostgreSQL 14+
- npm atau yarn

---

## ⚡ Quick Start

### 1️⃣ Install Dependencies

```bash
cd backend
npm install
```

### 2️⃣ Setup Environment Variables

Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi database:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prima_db
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

### 3️⃣ Setup Database

Pastikan PostgreSQL sudah running, lalu jalankan:

```bash
# Create database (jika belum ada)
psql -U postgres -c "CREATE DATABASE prima_db;"

# Import schema
psql -U postgres -d prima_db -f ../database/schema-hybrid.sql
```

### 4️⃣ Run Backend Server

**Development Mode** (dengan auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

Server akan berjalan di: **http://localhost:3000**

---

## 📚 API Documentation (Swagger)

Setelah server berjalan, buka Swagger UI di:

### **http://localhost:3000/api-docs**

Di sini Anda bisa:
- ✅ Melihat semua endpoint yang tersedia
- ✅ Mencoba API langsung dari browser
- ✅ Melihat request/response schema
- ✅ Test authentication dengan JWT token

---

## 🧪 Test Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Login (untuk mendapatkan JWT token)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prima.com","password":"admin123"}'
```

### Get Current User (dengan JWT token)
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 📦 Installed Packages

### Production Dependencies:
- **express** - Web framework
- **pg** - PostgreSQL client
- **dotenv** - Environment configuration
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing
- **multer** - File upload handling
- **crypto-js** - Encryption utilities
- **swagger-ui-express** - Swagger UI
- **swagger-jsdoc** - Swagger documentation generator

### Dev Dependencies:
- **nodemon** - Auto-reload on file changes

---

## 🛠️ Available Scripts

```bash
npm start       # Run server in production mode
npm run dev     # Run server in development mode with nodemon
npm test        # Run tests (belum diimplementasi)
```

---

## 🔐 Default Users (Seed Data)

Jika Anda sudah menjalankan schema database, terdapat 2 user default:

### Admin:
- **Email**: `admin@prima.com`
- **Password**: `admin123`
- **Role**: `admin`

### Dosen:
- **Email**: `dosen@prima.com`
- **Password**: `dosen123`
- **Role**: `dosen`

---

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `prima_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | (auto-generated) |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:5173` |

---

## 🐛 Troubleshooting

### Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solusi**: Pastikan PostgreSQL service sudah running
```bash
# Windows
net start postgresql-x64-14

# Linux/Mac
sudo systemctl start postgresql
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solusi**: Ganti port di `.env` atau stop aplikasi yang menggunakan port 3000

---

## 📞 Support

Untuk pertanyaan atau masalah, silahkan buat issue di repository ini.

---

**Happy Coding! 🎉**
