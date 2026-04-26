# Migration Checklist: MVP → Production

Panduan langkah-demi-langkah untuk mengupgrade sistem dari MVP (tugas kuliah) ke production-ready system.

---

## ✅ Pre-Migration Validation

Sebelum mulai migration, **WAJIB** pastikan semua ini sudah ada di MVP:

### Code Quality
- [ ] Semua function menggunakan `async/await` dengan proper error handling
- [ ] No hardcoded credentials (semua di `.env`)
- [ ] Business logic sudah dipisah ke `/services` (bukan di controller)
- [ ] API endpoints menggunakan versioning (`/api/v1/...`)
- [ ] Database menggunakan parameterized queries (bukan string concatenation)

### Database
- [ ] Schema punya `created_at`, `updated_at`, `deleted_at` columns
- [ ] Punya indexes untuk foreign keys & frequently queried columns
- [ ] Punya `audit_logs` table (walaupun belum dipakai full)
- [ ] User table punya `role` column

### Architecture
- [ ] Folder structure modular (controllers, services, routes, middleware terpisah)
- [ ] Config files terpisah per service (database.js, fabric.js, etc)
- [ ] Reusable components di frontend (bukan copy-paste code)

### Documentation
- [ ] README.md dengan setup instructions
- [ ] `.env.example` file exists
- [ ] API endpoints documented (minimal list endpoints)

**Jika ada yang belum ✅, FIX DULU sebelum lanjut migration!**

---

## 🔄 Migration Phases

### Phase 1: Security Enhancement (Week 1-2)

#### 1.1 Authentication & Authorization
- [ ] **Install packages:**
  ```bash
  npm install express-rate-limit helmet cors
  npm install express-validator
  ```

- [ ] **Implement rate limiting:**
  ```javascript
  // middleware/rateLimiter.js
  const rateLimit = require('express-rate-limit');
  
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: 'Too many login attempts, please try again later'
  });
  
  module.exports = { loginLimiter };
  ```

- [ ] **Add Helmet for security headers:**
  ```javascript
  // server.js
  const helmet = require('helmet');
  app.use(helmet());
  ```

- [ ] **Implement RBAC (Role-Based Access Control):**
  ```javascript
  // middleware/checkRole.js
  module.exports = (allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next();
    };
  };
  
  // Usage:
  router.post('/verify', auth, checkRole(['admin', 'pimpinan']), controller.verify);
  ```

- [ ] **Add refresh token mechanism:**
  - Generate refresh token saat login
  - Store di database (tabel `refresh_tokens`)
  - Endpoint `/api/v1/auth/refresh` untuk generate new access token

- [ ] **Input validation untuk semua endpoints:**
  ```javascript
  const { body, validationResult } = require('express-validator');
  
  router.post('/kegiatan',
    auth,
    [
      body('jenis_kegiatan').notEmpty().trim().escape(),
      body('poin_kum').isNumeric().isFloat({ min: 0 }),
      // ... more validations
    ],
    controller.create
  );
  ```

#### 1.2 Data Protection
- [ ] **Install encryption package:**
  ```bash
  npm install crypto-js
  ```

- [ ] **Encrypt sensitive data (NIP, NIK):**
  ```javascript
  // utils/encryption.js
  const CryptoJS = require('crypto-js');
  const SECRET = process.env.ENCRYPTION_SECRET;
  
  function encrypt(text) {
    return CryptoJS.AES.encrypt(text, SECRET).toString();
  }
  
  function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  ```

- [ ] **Update database to store encrypted values**

- [ ] **Add HTTPS/SSL:**
  - Development: self-signed certificate
  - Production: Let's Encrypt

#### 1.3 Security Testing
- [ ] Run `npm audit` dan fix vulnerabilities
- [ ] Test SQL injection (gunakan tools seperti sqlmap)
- [ ] Test XSS vulnerabilities
- [ ] Test authentication bypass attempts
- [ ] Test file upload dengan malicious files

---

### Phase 2: Scalability (Week 3-4)

#### 2.1 Database Optimization
- [ ] **Setup connection pooling (jika belum):**
  ```javascript
  const { Pool } = require('pg');
  const pool = new Pool({
    max: 20, // max connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  ```

- [ ] **Add missing indexes:**
  ```sql
  CREATE INDEX idx_kegiatan_created_at ON kegiatan_dosen(created_at);
  CREATE INDEX idx_kegiatan_blockchain_tx ON kegiatan_dosen(blockchain_tx_id);
  ```

- [ ] **Setup PostgreSQL replication:**
  - 1 Primary (write)
  - 1+ Replica (read)
  - Update app untuk read dari replica

- [ ] **Optimize slow queries:**
  - Enable `pg_stat_statements`
  - Identify slow queries
  - Add indexes atau optimize query

#### 2.2 Caching Layer
- [ ] **Install Redis:**
  ```bash
  npm install redis
  ```

- [ ] **Implement caching:**
  ```javascript
  // Cache user data
  await redis.set(`user:${userId}`, JSON.stringify(userData), 'EX', 3600);
  
  // Cache frequently accessed kegiatan
  await redis.set(`kegiatan:${id}`, JSON.stringify(kegiatan), 'EX', 1800);
  ```

- [ ] **Session management dengan Redis:**
  ```bash
  npm install express-session connect-redis
  ```

#### 2.3 Blockchain Scaling
- [ ] **Upgrade Fabric network:**
  - Add 2 more peers (total 3)
  - Add 2 more orderers (total 3, Raft consensus)
  - Update connection profiles

- [ ] **Implement connection pooling untuk Fabric:**
  ```javascript
  // utils/fabricClient.js
  // Reuse gateway connections instead of creating new each time
  ```

- [ ] **Use private data collections (jika ada data sensitive):**
  - Define collections in chaincode
  - Configure endorsement policies

#### 2.4 Load Balancing
- [ ] **Install Nginx:**
  ```bash
  # Ubuntu/Debian
  sudo apt install nginx
  ```

- [ ] **Configure Nginx as reverse proxy:**
  ```nginx
  upstream backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
  }
  
  server {
    listen 80;
    server_name chainrank.example.com;
    
    location /api {
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
      proxy_pass http://localhost:8080; # Vue.js frontend
    }
  }
  ```

- [ ] **Run multiple backend instances:**
  - Use PM2 cluster mode atau
  - Docker Compose dengan replicas

---

### Phase 3: Observability (Week 5-6)

#### 3.1 Logging
- [ ] **Install Winston:**
  ```bash
  npm install winston winston-daily-rotate-file
  ```

- [ ] **Setup structured logging:**
  ```javascript
  // utils/logger.js
  const winston = require('winston');
  
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });
  ```

- [ ] **Log important events:**
  - Login/logout
  - File uploads
  - Blockchain transactions
  - Errors & exceptions

- [ ] **Centralized logging (optional):**
  - Setup Loki atau ELK Stack
  - Send logs dari semua services

#### 3.2 Monitoring
- [ ] **Setup Prometheus:**
  ```bash
  npm install prom-client
  ```

- [ ] **Expose metrics:**
  ```javascript
  const promClient = require('prom-client');
  const register = new promClient.Registry();
  
  // Default metrics (CPU, memory, etc)
  promClient.collectDefaultMetrics({ register });
  
  // Custom metrics
  const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
  });
  
  // Expose /metrics endpoint
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  ```

- [ ] **Setup Grafana:**
  - Install Grafana
  - Add Prometheus as data source
  - Create dashboards (API latency, error rate, etc)

- [ ] **Database monitoring:**
  - Enable `pg_stat_statements`
  - Monitor connection pool usage
  - Track slow queries

- [ ] **Blockchain monitoring:**
  - Monitor peer health
  - Track transaction throughput
  - Alert on blockchain errors

#### 3.3 Error Tracking
- [ ] **Setup Sentry (optional):**
  ```bash
  npm install @sentry/node
  ```

- [ ] **Configure Sentry:**
  ```javascript
  const Sentry = require('@sentry/node');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  
  // Use in error handler
  app.use(Sentry.Handlers.errorHandler());
  ```

---

### Phase 4: Advanced Features (Week 7-8)

#### 4.1 Multiple User Roles
- [ ] **Extend user roles:**
  - Dosen
  - Admin Fakultas
  - Pimpinan
  - Super Admin

- [ ] **Implement permissions matrix:**
  ```javascript
  const permissions = {
    'dosen': ['create_kegiatan', 'read_own_kegiatan'],
    'admin': ['read_all_kegiatan', 'verify_kegiatan'],
    'pimpinan': ['read_all_kegiatan', 'verify_kegiatan', 'issue_sk'],
    'superadmin': ['*']
  };
  ```

- [ ] **Update chaincode untuk access control**

#### 4.2 Notifications
- [ ] **Install Nodemailer:**
  ```bash
  npm install nodemailer
  ```

- [ ] **Email notifications:**
  - Kegiatan diverifikasi
  - Kegiatan ditolak
  - SK terbit
  - KUM mencapai threshold

- [ ] **In-app notifications:**
  - Store di database
  - Real-time via WebSocket

#### 4.3 Real-time Updates
- [ ] **Install Socket.io:**
  ```bash
  npm install socket.io socket.io-client
  ```

- [ ] **Implement WebSocket:**
  - Real-time notification
  - Live status updates
  - Multi-user collaboration

#### 4.4 Export Features
- [ ] **Install export libraries:**
  ```bash
  npm install pdfkit exceljs
  ```

- [ ] **Implement export:**
  - Export kegiatan to PDF
  - Export laporan to Excel
  - Export audit trail

#### 4.5 Advanced Search
- [ ] **Full-text search:**
  - PostgreSQL: `to_tsvector` & `to_tsquery`
  - Atau gunakan Elasticsearch

- [ ] **Filtering & sorting:**
  - Filter by date range
  - Filter by status
  - Filter by poin range
  - Multi-column sorting

---

### Phase 5: DevOps & Deployment (Week 9-10)

#### 5.1 Containerization
- [ ] **Create Dockerfiles:**
  ```dockerfile
  # backend/Dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  EXPOSE 3000
  CMD ["node", "server.js"]
  ```

- [ ] **Docker Compose production:**
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:15
      volumes:
        - postgres_data:/var/lib/postgresql/data
      env_file: .env.prod
    
    redis:
      image: redis:7-alpine
    
    backend:
      build: ./backend
      depends_on:
        - postgres
        - redis
      env_file: .env.prod
    
    frontend:
      build: ./frontend
      ports:
        - "80:80"
    
    nginx:
      image: nginx:alpine
      volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf
      ports:
        - "443:443"
  ```

#### 5.2 CI/CD Pipeline
- [ ] **Create `.github/workflows/ci.yml`:**
  ```yaml
  name: CI/CD
  
  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: '18'
        - run: npm ci
        - run: npm test
        - run: npm run lint
    
    build:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Build Docker image
          run: docker build -t chainrank-backend .
        - name: Push to registry
          # ... push to Docker Hub atau registry lain
  ```

- [ ] **Automated deployment:**
  - Deploy to staging on push to `develop`
  - Deploy to production on push to `main` (with manual approval)

#### 5.3 Environment Setup
- [ ] **Setup 3 environments:**
  - Development (local)
  - Staging (pre-production)
  - Production

- [ ] **Environment-specific configs:**
  - `.env.development`
  - `.env.staging`
  - `.env.production`

#### 5.4 Backup Strategy
- [ ] **PostgreSQL backup:**
  ```bash
  # Daily automated backup
  0 2 * * * pg_dump chainrank_db | gzip > /backups/chainrank_$(date +\%Y\%m\%d).sql.gz
  ```

- [ ] **Fabric ledger backup:**
  - Backup peer data volume
  - Backup chaincode

- [ ] **File storage backup:**
  - S3 versioning enabled
  - Cross-region replication

- [ ] **Test restore procedure:**
  - Quarterly disaster recovery drill

---

## ✅ Post-Migration Validation

Setelah semua migration selesai, validate dengan checklist ini:

### Functionality
- [ ] Semua fitur MVP masih berfungsi
- [ ] New features berfungsi dengan baik
- [ ] No broken endpoints

### Performance
- [ ] API response time <500ms (95th percentile)
- [ ] Page load time <2s
- [ ] Database queries optimized
- [ ] No N+1 query problems

### Security
- [ ] No high/critical vulnerabilities (`npm audit`)
- [ ] HTTPS enabled
- [ ] RBAC berfungsi dengan benar
- [ ] Rate limiting aktif
- [ ] Input validation di semua endpoints

### Monitoring
- [ ] Grafana dashboards showing metrics
- [ ] Logs accessible via Loki/ELK
- [ ] Alerts configured (email/Slack)
- [ ] Error tracking berfungsi

### DevOps
- [ ] CI/CD pipeline berjalan
- [ ] Automated tests passing
- [ ] Docker builds successfully
- [ ] Deployments automated

### Documentation
- [ ] README updated
- [ ] API docs updated (Swagger)
- [ ] Deployment guide written
- [ ] Runbook for common issues

---

## 🎯 Success Metrics

Production system dianggap sukses jika mencapai:

- ✅ **Uptime:** >99.9%
- ✅ **API Response:** <500ms (P95)
- ✅ **Error Rate:** <0.1%
- ✅ **Security:** Zero high/critical vulnerabilities
- ✅ **Test Coverage:** >80% (backend, chaincode)
- ✅ **User Satisfaction:** >4.0/5.0

---

## 📞 Need Help?

Jika stuck selama migration:
1. Check error logs (Winston, Sentry)
2. Check monitoring (Grafana)
3. Review [plan-full.md](plan-full.md) untuk context
4. Google error message + stack trace
5. Ask in community (Stack Overflow, Hyperledger Discord)

---

**Good luck with your migration!** 🚀

*Document Version: 1.0*  
*Last Updated: April 26, 2026*
