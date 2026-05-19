# ChainRank Deployment Guide

**Purpose:** Complete guide untuk deploy ChainRank dari development ke production  
**Target:** System administrator, DevOps engineer  
**Difficulty:** Intermediate

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Deployment](#development-deployment)
3. [Production Deployment](#production-deployment)
4. [Docker Compose Full Stack](#docker-compose-full-stack)
5. [Fabric Network Setup](#fabric-network-setup)
6. [Environment Configuration](#environment-configuration)
7. [Database Migration](#database-migration)
8. [SSL/HTTPS Setup](#ssl-https-setup)
9. [Monitoring & Logging](#monitoring-logging)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware Requirements

**Minimum (Development):**
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB SSD
- Network: Broadband internet

**Recommended (Production):**
- CPU: 8+ cores
- RAM: 16GB+
- Disk: 200GB SSD
- Network: 100Mbps+ dedicated

### Software Requirements

**Required:**
- **OS:** Ubuntu 20.04+ / Windows 10+ / macOS 11+
- **Docker:** v20.10+
- **Docker Compose:** v2.0+
- **Node.js:** v18+
- **Git:** v2.30+

**Optional (Production):**
- **Nginx:** v1.18+ (reverse proxy)
- **Let's Encrypt:** For SSL certificates
- **PostgreSQL:** v15+ (if not using Docker)

### Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose git

# Windows: Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# macOS: Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Verify installations
docker --version
docker-compose --version
node --version
git --version
```

---

## Development Deployment

### Quick Start (Local Development)

#### 1. Clone Repository

```bash
git clone <repository-url>
cd UsulanKenaikanPangkatBlockchain
```

#### 2. Setup Database (Docker)

```bash
# Start PostgreSQL container
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready (check logs)
docker logs chainrank_postgres_dev

# Verify database is running
docker exec chainrank_postgres_dev psql -U postgres -d chainrank_db -c "SELECT 'OK';"
```

#### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env - update if needed:
# - DB_PORT=5434 (Docker PostgreSQL port)
# - JWT_SECRET=<generate strong secret>
# - FABRIC_ENABLED=false (for now)

# Start backend
npm start

# Backend should be running on http://localhost:3000
# Test: curl http://localhost:3000/api/v1/health
```

#### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend should be running on http://localhost:5173
```

#### 5. (Optional) Setup Hyperledger Fabric with CouchDB

```bash
cd fabric-network

# Windows PowerShell:
.\start-network.ps1

# Linux/macOS:
./start-network.sh

# Wait for network to start (~2-3 minutes)
# Verify: docker ps | grep peer
# Verify CouchDB: docker ps | grep couchdb

# Update backend/.env:
# FABRIC_ENABLED=true
```

**CouchDB State Database:**
- Network now uses CouchDB instead of LevelDB for rich queries
- Access CouchDB Web UI (Fauxton):
  - Org1: http://localhost:5984/_utils (admin/adminpw)
  - Org2: http://localhost:7984/_utils (admin/adminpw)
- Database `skchannel_chainrank` contains blockchain state data
- Supports rich queries (by dosenId, status, date range)

#### 6. Test Login

**Open browser:** http://localhost:5173

**Login credentials:**
- Email: `budi.santoso@chainrank.test`
- Password: `password123`

---

## Production Deployment

### Option 1: Docker Compose (Recommended for Small-Medium Scale)

#### 1. Prepare Server

```bash
# SSH to production server
ssh user@your-server.com

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Logout and login again for docker group to take effect
```

#### 2. Clone & Configure

```bash
# Clone repository
git clone <repository-url>
cd UsulanKenaikanPangkatBlockchain

# Create production .env
cd backend
cp .env.example .env
nano .env
```

**Production .env settings:**
```bash
# Database
DB_HOST=postgres  # Docker service name
DB_PORT=5432      # Internal Docker port
DB_NAME=chainrank_db
DB_USER=postgres
DB_PASSWORD=<strong-password>  # CHANGE THIS!
DB_SCHEMA=sk

# JWT
JWT_SECRET=<generate-with-crypto>  # MUST be strong!
JWT_EXPIRES_IN=2h  # Shorter for production

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-domain.com  # Your production domain

# Fabric
FABRIC_ENABLED=false  # or true if Fabric running
```

**Generate strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 3. Build & Deploy

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### 4. Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/chainrank
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

**Enable site:**
```bash
# Enable configuration
sudo ln -s /etc/nginx/sites-available/chainrank /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured by default
# Test renewal:
sudo certbot renew --dry-run
```

#### 6. Verify Deployment

```bash
# Check all services running
docker-compose ps

# Check backend health
curl http://localhost:3000/api/v1/health

# Check frontend
curl http://localhost:8080

# Check via domain (if Nginx configured)
curl https://your-domain.com
```

---

### Option 2: Manual Deployment (Native Installation)

#### 1. Install PostgreSQL

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 15
sudo apt install -y postgresql-15

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database & user
sudo -u postgres psql
```

**PostgreSQL commands:**
```sql
CREATE DATABASE chainrank_db;
CREATE USER chainrank WITH ENCRYPTED PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE chainrank_db TO chainrank;
\q
```

#### 2. Import Database Schema

```bash
# Navigate to project
cd UsulanKenaikanPangkatBlockchain/database

# Import schema
psql -U chainrank -d chainrank_db -f schema-hybrid.sql

# Import seed data (optional)
psql -U chainrank -d chainrank_db -f seed.sql
```

#### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm ci --only=production

# Configure .env
cp .env.example .env
nano .env

# Update settings:
# DB_HOST=localhost
# DB_PORT=5432
# NODE_ENV=production

# Install PM2 for process management
sudo npm install -g pm2

# Start backend with PM2
pm2 start server.js --name chainrank-backend
pm2 save
pm2 startup
```

#### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Build production bundle
npm run build

# Output will be in dist/
# Serve with Nginx (see Nginx config above)
```

#### 5. Configure Nginx for Frontend

```bash
# Copy built files to Nginx directory
sudo cp -r dist/* /var/www/chainrank/

# Create Nginx config
sudo nano /etc/nginx/sites-available/chainrank
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/chainrank;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        # ... (same proxy settings as before)
    }
}
```

---

## Docker Compose Full Stack

### docker-compose.yml Configuration

The provided [docker-compose.yml](../docker-compose.yml) includes:
- **PostgreSQL:** Database service
- **Backend:** Express.js API
- **Frontend:** Vue.js app with Nginx

**Usage:**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild images (after code changes)
docker-compose up -d --build

# Access services
# - Frontend: http://localhost:8080
# - Backend: http://localhost:3000
# - PostgreSQL: localhost:5434
```

### Customizing docker-compose.yml

**Change ports:**
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 8080 to your desired port
```

**Add environment variables:**
```yaml
services:
  backend:
    environment:
      - CUSTOM_VAR=value
```

**Use external database:**
```yaml
# Comment out postgres service
# Update backend environment:
services:
  backend:
    environment:
      DB_HOST: external-db.example.com
      DB_PORT: 5432
```

---

## Fabric Network Setup

### Development (Test Network)

```bash
cd fabric-network

# Start network
./start-network.ps1  # Windows
./start-network.sh   # Linux/macOS

# Deploy chaincode
# (Automatically deployed via start-network script)

# Verify network
docker ps | grep peer
docker ps | grep orderer

# Test chaincode
cd ../backend
node test-chaincode.js
```

### Production (Multi-Organization)

**Production Fabric setup is complex. High-level steps:**

1. **Plan Network Topology:**
   - Define organizations (e.g., University, Government, Auditor)
   - Determine peer count (minimum 2 per org for HA)
   - Choose consensus (Raft recommended for production)

2. **Setup Certificate Authority:**
   - Deploy Fabric CA for each organization
   - Generate identities (admin, peer, user)

3. **Deploy Peers & Orderers:**
   - Use Kubernetes or Docker Swarm for orchestration
   - Configure persistent volumes for ledger data
   - Setup load balancers

4. **Create Channel & Deploy Chaincode:**
   - Define channel configuration
   - Deploy chaincode to all peers
   - Test endorsement policy

5. **Configure Connection Profiles:**
   - Update backend connection-org1.json
   - Configure service discovery

**Recommended:** Use Hyperledger Fabric Operations Console or hire blockchain consultant for production setup.

---

## Environment Configuration

### Backend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `5432` | Yes |
| `DB_NAME` | Database name | `chainrank_db` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | `strong-password` | Yes |
| `DB_SCHEMA` | Schema name | `sk` | Yes |
| `JWT_SECRET` | JWT signing key | `64-char hex` | Yes |
| `JWT_EXPIRES_IN` | Token lifetime | `2h` | No |
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment | `production` | Yes |
| `CORS_ORIGIN` | Allowed origin | `https://domain.com` | Yes |
| `FABRIC_ENABLED` | Enable blockchain | `true` | No |
| `FABRIC_CHANNEL` | Fabric channel | `mychannel` | If Fabric enabled |
| `FABRIC_CHAINCODE` | Chaincode name | `chainrank` | If Fabric enabled |

### Frontend Environment Variables

**Build-time variables (set during `npm run build`):**

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.domain.com/api/v1` |

**Example:**
```bash
# Development
VITE_API_BASE_URL=http://localhost:3000/api/v1 npm run dev

# Production build
VITE_API_BASE_URL=https://api.your-domain.com/api/v1 npm run build
```

---

## Database Migration

### Initial Setup

```bash
cd database

# Option 1: Using psql
psql -U postgres -d chainrank_db -f schema-hybrid.sql
psql -U postgres -d chainrank_db -f seed.sql

# Option 2: Using Docker exec
docker exec -i chainrank_postgres_dev psql -U postgres -d chainrank_db < schema-hybrid.sql
```

### Backup & Restore

**Backup:**
```bash
# Backup to file
pg_dump -U postgres -d chainrank_db > backup-$(date +%Y%m%d).sql

# Or with Docker:
docker exec chainrank_postgres_dev pg_dump -U postgres chainrank_db > backup.sql
```

**Restore:**
```bash
# Restore from file
psql -U postgres -d chainrank_db < backup.sql

# Or with Docker:
docker exec -i chainrank_postgres_dev psql -U postgres -d chainrank_db < backup.sql
```

### Migration for Schema Changes

**Process:**
1. Create migration script (e.g., `migration-001-add-column.sql`)
2. Test on development database
3. Backup production database
4. Apply migration to production
5. Verify no errors

**Example migration:**
```sql
-- migration-001-add-audit-field.sql
BEGIN;

ALTER TABLE sk.kegiatan_dosen 
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

COMMIT;
```

**Apply:**
```bash
psql -U postgres -d chainrank_db -f migration-001-add-audit-field.sql
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (interactive)
sudo certbot --nginx

# Or non-interactive:
sudo certbot --nginx --non-interactive --agree-tos \
  --email admin@your-domain.com -d your-domain.com

# Auto-renewal is setup by default
# Test renewal:
sudo certbot renew --dry-run

# Cron job (already setup by certbot):
# 0 0,12 * * * root certbot renew --quiet
```

### Manual SSL Certificate

If using custom SSL certificate:

```bash
# Place certificate files
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.crt /etc/nginx/ssl/
sudo cp your-key.key /etc/nginx/ssl/

# Update Nginx config
sudo nano /etc/nginx/sites-available/chainrank
```

**Nginx SSL config:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/your-cert.crt;
    ssl_certificate_key /etc/nginx/ssl/your-key.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### Application Logs

**Backend logs (PM2):**
```bash
# View logs
pm2 logs chainrank-backend

# Save logs to file
pm2 logs chainrank-backend --lines 1000 > backend-logs.txt
```

**Docker logs:**
```bash
# View backend logs
docker logs chainrank_backend -f

# View frontend logs
docker logs chainrank_frontend -f

# View all services
docker-compose logs -f
```

### System Monitoring

**Basic monitoring with Docker stats:**
```bash
docker stats
```

**Advanced monitoring (Production):**

1. **Prometheus + Grafana** - Metrics & dashboards
2. **Loki + Promtail** - Log aggregation
3. **Alertmanager** - Alert notifications

**Quick setup with docker-compose:**
```yaml
# Add to docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Troubleshooting

### Database Connection Issues

**Symptom:** Backend cannot connect to database

**Solutions:**
```bash
# Check if PostgreSQL running
docker ps | grep postgres
# or
sudo systemctl status postgresql

# Check database credentials in .env
cat backend/.env | grep DB_

# Test connection manually
psql -h localhost -p 5434 -U postgres -d chainrank_db

# Check firewall
sudo ufw status
sudo ufw allow 5434/tcp  # If using Docker
```

### Frontend Cannot Reach Backend

**Symptom:** API calls fail with CORS or network errors

**Solutions:**
1. **Check CORS_ORIGIN in backend/.env:**
   ```bash
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

2. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

3. **Check VITE_API_BASE_URL (frontend):**
   ```bash
   # Must match backend URL
   VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
   ```

4. **If using Nginx, check proxy config:**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

### Docker Container Not Starting

**Symptom:** `docker-compose up` fails

**Solutions:**
```bash
# Check logs
docker-compose logs <service-name>

# Remove old containers & volumes
docker-compose down -v
docker-compose up -d --force-recreate

# Check disk space
df -h

# Check Docker daemon
sudo systemctl status docker
```

### Fabric Network Issues

**Symptom:** Blockchain transactions fail

**Solutions:**
1. **Check Fabric containers running:**
   ```bash
   docker ps | grep peer
   docker ps | grep orderer
   ```

2. **Check backend Fabric connection:**
   ```bash
   cd backend
   node test-chaincode.js
   ```

3. **Restart Fabric network:**
   ```bash
   cd fabric-network
   ./stop-network.sh
   ./start-network.sh
   ```

4. **Use fallback mode:**
   ```bash
   # backend/.env
   FABRIC_ENABLED=false
   ```

---

## Post-Deployment Checklist

### Security

- [ ] Change all default passwords
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable firewall (ufw/iptables)
- [ ] Setup SSL/HTTPS
- [ ] Disable unnecessary ports
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Setup fail2ban (SSH brute-force protection)

### Performance

- [ ] Enable gzip compression (Nginx)
- [ ] Configure database connection pooling
- [ ] Setup CDN for static assets (optional)
- [ ] Enable caching (Redis) for production
- [ ] Monitor resource usage (CPU, RAM, disk)

### Backup

- [ ] Automated database backups (daily)
- [ ] Backup uploaded files (daily)
- [ ] Offsite backup storage
- [ ] Test backup restoration process

### Monitoring

- [ ] Setup log rotation
- [ ] Configure error alerting
- [ ] Monitor uptime (e.g., UptimeRobot)
- [ ] Setup performance monitoring

---

## Additional Resources

- **Hyperledger Fabric Docs:** https://hyperledger-fabric.readthedocs.io/
- **Docker Docs:** https://docs.docker.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Vue.js Deployment:** https://vitejs.dev/guide/static-deploy.html
- **Let's Encrypt:** https://letsencrypt.org/getting-started/

---

**Deployment complete!** 🚀

For issues not covered here, check:
- [FABRIC_ISSUES.md](FABRIC_ISSUES.md)
- [README.md](../README.md)
- Create an issue on GitHub
