# CCAAS Deployment Method

## Apa itu CCAAS?

**CCAAS (Chaincode-as-a-Service)** adalah metode deployment chaincode alternatif di Hyperledger Fabric yang menjalankan chaincode sebagai external service (bukan di-build oleh peer).

## Status: ✅ FIXED (2026-05-19)

**Package structure bug resolved**: Script sekarang membuat nested tar yang benar (`metadata.json` + `code.tar.gz` berisi `connection.json`).

## Kenapa Menggunakan CCAAS?

### Masalah dengan Metode Standard:
- ❌ Docker build di WSL sering timeout/broken pipe
- ❌ npm install lambat di dalam Docker build WSL
- ❌ Resource intensive untuk peer build chaincode
- ❌ Sulit debugging di production

### Keuntungan CCAAS:
- ✅ Build Docker image di Windows langsung (lebih stabil)
- ✅ Tidak ada Docker build di WSL
- ✅ Container lifecycle dikelola manual (lebih kontrol)
- ✅ Cocok untuk development dan production
- ✅ Mudah restart/update chaincode tanpa redeploy network

## Files yang Digunakan

### 1. `start-network-ccaas.ps1`
Script untuk start Fabric network dengan CCAAS method:
- Start network + channel
- Build chaincode image di Windows
- Package sebagai CCAAS
- Install + Approve + Commit chaincode
- Start chaincode containers

### 2. `restart-fabric-ccaas.ps1`
Script untuk restart network dengan CCAAS method (di root folder).

## Cara Menggunakan

### Pertama Kali:
```powershell
cd fabric-network
.\start-network-ccaas.ps1
```

### Restart Network:
```powershell
.\restart-fabric-ccaas.ps1
```

### Cek Status Chaincode:
```powershell
docker ps --filter "name=prima"
```

### View Chaincode Logs:
```powershell
docker logs prima.org1.example.com
docker logs prima.org2.example.com
```

## Perbedaan dengan Metode Standard

| Aspek | Standard Method | CCAAS Method |
|-------|----------------|--------------|
| Build Location | Di WSL (peer builds) | Di Windows Docker |
| Package Type | `.tar.gz` with source | `.tar.gz` with connection.json |
| Chaincode Runtime | Di-manage oleh peer | External container |
| Debugging | Sulit | Mudah (lihat logs langsung) |
| Update Chaincode | Perlu redeploy | Restart container saja |
| WSL Dependency | Tinggi | Rendah |

## Package Structure (IMPORTANT)

CCAAS package **HARUS** memiliki struktur nested tar:

```
prima_ccaas.tar.gz
├── metadata.json         # {"type": "ccaas", "label": "prima_1.0"}
└── code.tar.gz          # Inner tar
    └── connection.json  # {"address": "prima.org1.example.com:9999", ...}
```

❌ **SALAH** (flat structure):
```
package.tar.gz
├── metadata.json
└── connection.json      # Langsung di root - tidak akan dikenali!
```

Script `start-network-ccaas.ps1` sudah diperbaiki untuk membuat struktur yang benar.

### Verify Package Structure

```powershell
# Extract and check outer tar
wsl -d Ubuntu -- tar tzf prima_ccaas.tar.gz
# Output seharusnya: metadata.json, code.tar.gz

# Extract and check inner tar
cd fabric-network/chaincode-ccaas
wsl -d Ubuntu -- tar xzf code.tar.gz
ls code/  # Should show connection.json
```

## Troubleshooting

### Chaincode container tidak start:
```powershell
# Cek network
docker network ls | Select-String "fabric_test"

# Restart container
docker restart prima.org1.example.com
```

### Connection error:
```powershell
# Cek logs
docker logs prima.org1.example.com

# Verify package ID
docker exec prima.org1.example.com env | Select-String "CHAINCODE_ID"
```

### Update chaincode code:
```powershell
# 1. Stop containers
docker stop prima.org1.example.com prima.org2.example.com

# 2. Rebuild image
docker build -t prima_ccaas:latest -f chaincode/Dockerfile chaincode

# 3. Restart containers (package ID tetap sama)
# Jalankan ulang start-network-ccaas.ps1 dari section "Start chaincode containers"
```

## Network Architecture

```
┌─────────────────────────────────────────────┐
│         Fabric Network (WSL)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Orderer  │  │ Peer Org1│  │ Peer Org2│ │
│  └──────────┘  └──────────┘  └──────────┘ │
│       │             │              │        │
│       └─────────────┴──────────────┘        │
│                     │                       │
└─────────────────────┼───────────────────────┘
                      │ gRPC
         ┌────────────┴────────────┐
         │   Docker Network        │
         │   (fabric_test)         │
         └────────────┬────────────┘
              ┌───────┴───────┐
    ┌─────────┴──────┐  ┌─────┴─────────┐
    │ prima.org1 │  │ prima.org2│
    │   (Container)  │  │   (Container) │
    └────────────────┘  └───────────────┘
         Built in Windows Docker
```

## Status Check Commands

```powershell
# All Fabric containers
docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "org|orderer|prima"

# CouchDB
curl http://localhost:5984/_utils  # Org1
curl http://localhost:7984/_utils  # Org2

# Chaincode health
docker exec prima.org1.example.com ps aux
```
