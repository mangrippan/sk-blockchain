# Testing Guide - Blockchain Validation Kegiatan

Panduan testing untuk validasi blockchain pada modul kegiatan menggunakan berbagai tools.

## Prerequisites

1. Backend server running di http://localhost:3000
2. Blockchain network (Fabric) running (atau disabled untuk testing fallback)
3. Token autentikasi (JWT)
4. Test kegiatan yang sudah ada di database

## Setup Testing

### 1. Dapatkan Token Autentikasi

```bash
# Login sebagai admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Save token dari response
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Buat Test Kegiatan (Optional)

```bash
# Create kegiatan baru untuk testing
curl -X POST http://localhost:3000/api/v1/kegiatan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "ref_kegiatan_id=1" \
  -F "deskripsi=Test kegiatan untuk blockchain validation" \
  -F "file=@test-document.pdf"

# Save kegiatan ID dari response
export KEGIATAN_ID="123e4567-e89b-12d3-a456-426614174000"
```

## Test Cases

### Test 1: Validasi Blockchain Integrity

**Endpoint**: `GET /api/v1/kegiatan/:id/validate-blockchain`

```bash
# Test validasi blockchain untuk kegiatan tertentu
curl -X GET "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID/validate-blockchain" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (Valid)**:
```json
{
  "valid": true,
  "message": "Blockchain validation passed",
  "checks": {
    "blockchainEnabled": true,
    "blockchainRecordExists": true,
    "documentHashMatches": true,
    "statusConsistent": true,
    "hasCompleteHistory": true
  },
  "details": {
    "databaseStatus": "verified",
    "databaseHash": "abc123hash456",
    "blockchainStatus": "verified",
    "blockchainHash": "abc123hash456",
    "inconsistencies": [],
    "blockchainHistory": [
      {
        "txId": "tx123abc",
        "timestamp": "2026-05-19T10:00:00Z",
        "action": "CREATE",
        "status": "unverified"
      },
      {
        "txId": "tx456def",
        "timestamp": "2026-05-19T11:00:00Z",
        "action": "VERIFY",
        "status": "verified"
      }
    ]
  },
  "warnings": [],
  "errors": []
}
```

**Expected Response (Invalid - Blockchain Disabled)**:
```json
{
  "valid": true,
  "message": "Blockchain validation skipped (blockchain disabled)",
  "checks": {
    "blockchainEnabled": false,
    "blockchainRecordExists": false,
    "documentHashMatches": false,
    "statusConsistent": false,
    "hasCompleteHistory": false
  },
  "warnings": ["Blockchain integration is disabled"],
  "errors": []
}
```

**Expected Response (Invalid - Hash Mismatch)**:
```json
{
  "valid": false,
  "message": "Blockchain validation failed - inconsistencies detected",
  "checks": {
    "blockchainEnabled": true,
    "blockchainRecordExists": true,
    "documentHashMatches": false,
    "statusConsistent": true,
    "hasCompleteHistory": true
  },
  "details": {
    "databaseStatus": "verified",
    "databaseHash": "newHash999",
    "blockchainStatus": "verified",
    "blockchainHash": "originalHash123",
    "inconsistencies": [
      {
        "type": "HASH_MISMATCH",
        "database": "newHash999",
        "blockchain": "originalHash123"
      }
    ]
  },
  "warnings": [],
  "errors": ["Document hash mismatch - possible tampering detected"]
}
```

### Test 2: Verifikasi Document Hash

**Endpoint**: `POST /api/v1/kegiatan/:id/verify-hash`

```bash
# Test dengan hash yang benar
curl -X POST "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID/verify-hash" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentHash": "abc123hash456"
  }'
```

**Expected Response (Valid)**:
```json
{
  "valid": true,
  "message": "Document hash verified successfully",
  "blockchainHash": "abc123hash456",
  "providedHash": "abc123hash456",
  "databaseHash": "abc123hash456",
  "allMatch": true,
  "timestamp": "2026-05-19T12:00:00Z"
}
```

```bash
# Test dengan hash yang salah (tampering)
curl -X POST "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID/verify-hash" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentHash": "tamperedHash999"
  }'
```

**Expected Response (Invalid)**:
```json
{
  "valid": false,
  "message": "Document hash mismatch - possible tampering detected",
  "blockchainHash": "abc123hash456",
  "providedHash": "tamperedHash999",
  "databaseHash": "abc123hash456",
  "allMatch": false,
  "timestamp": "2026-05-19T12:00:00Z"
}
```

### Test 3: Batch Validation (Admin Only)

**Endpoint**: `GET /api/v1/kegiatan/validate-all`

```bash
# Validate semua kegiatan verified
curl -X GET "http://localhost:3000/api/v1/kegiatan/validate-all?status=verified&limit=100" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "message": "Batch validation completed",
  "total": 50,
  "valid": 45,
  "invalid": 3,
  "errors": 2,
  "inconsistencies": [
    {
      "kegiatanId": "123e4567-e89b-12d3-a456-426614174001",
      "type": "STATUS_MISMATCH",
      "databaseStatus": "verified",
      "blockchainStatus": "unverified"
    },
    {
      "kegiatanId": "123e4567-e89b-12d3-a456-426614174002",
      "type": "MISSING_BLOCKCHAIN_RECORD",
      "status": "verified"
    },
    {
      "kegiatanId": "123e4567-e89b-12d3-a456-426614174003",
      "type": "VALIDATION_ERROR",
      "error": "Blockchain connection timeout"
    }
  ]
}
```

## Run Unit Tests

```bash
cd backend

# Run semua kegiatan tests
npm test -- kegiatan.test.js

# Run hanya blockchain validation tests
npm test -- kegiatan.test.js -t "Blockchain Validation"

# Run specific test case
npm test -- kegiatan.test.js -t "should detect tampered documents"

# Run dengan coverage
npm test -- kegiatan.test.js --coverage

# Run dalam watch mode untuk development
npm test -- kegiatan.test.js --watch
```

## Test Scenarios

### Scenario 1: Normal Flow (Blockchain Active)

```bash
# 1. Create kegiatan
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/kegiatan \
  -H "Authorization: Bearer $TOKEN" \
  -F "ref_kegiatan_id=1" \
  -F "deskripsi=Normal flow test" \
  -F "file=@test.pdf")

KEGIATAN_ID=$(echo $RESPONSE | jq -r '.data.id')

# 2. Verify kegiatan (akan record ke blockchain)
curl -X PUT "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "verified"}'

# 3. Validate blockchain
curl -X GET "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID/validate-blockchain" \
  -H "Authorization: Bearer $TOKEN"

# Expected: All checks should pass
```

### Scenario 2: Blockchain Unavailable

```bash
# 1. Stop blockchain network
cd fabric-network
./stop-network.sh

# 2. Create dan verify kegiatan
# (Should succeed in database, warn about blockchain)

# 3. Check validation
curl -X GET "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID/validate-blockchain" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Warning about blockchain disabled
```

### Scenario 3: Document Tampering Detection

```bash
# 1. Get kegiatan dengan blockchain record
curl -X GET "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID" \
  -H "Authorization: Bearer $TOKEN"

ORIGINAL_HASH=$(echo $RESPONSE | jq -r '.data.file_hash')

# 2. Simulate tampering (manual database update)
psql -U postgres -d kenaikan_pangkat -c \
  "UPDATE sk.kegiatan_dosen SET file_hash = 'tamperedHash999' WHERE id = '$KEGIATAN_ID';"

# 3. Validate blockchain
curl -X GET "http://localhost:3000/api/v1/kegiatan/$KEGIATAN_ID/validate-blockchain" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Hash mismatch detected
```

## Postman Collection

Import collection berikut ke Postman untuk testing yang lebih mudah:

```json
{
  "info": {
    "name": "Blockchain Validation - Kegiatan",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Validate Blockchain Integrity",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/kegiatan/{{kegiatanId}}/validate-blockchain",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "kegiatan", "{{kegiatanId}}", "validate-blockchain"]
        }
      }
    },
    {
      "name": "Verify Document Hash",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"documentHash\": \"{{documentHash}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/kegiatan/{{kegiatanId}}/verify-hash",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "kegiatan", "{{kegiatanId}}", "verify-hash"]
        }
      }
    },
    {
      "name": "Batch Validate All (Admin)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/kegiatan/validate-all?status=verified&limit=50",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "kegiatan", "validate-all"],
          "query": [
            {
              "key": "status",
              "value": "verified"
            },
            {
              "key": "limit",
              "value": "50"
            }
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": "YOUR_JWT_TOKEN_HERE"
    },
    {
      "key": "kegiatanId",
      "value": "123e4567-e89b-12d3-a456-426614174000"
    },
    {
      "key": "documentHash",
      "value": "abc123hash456"
    }
  ]
}
```

## Troubleshooting

### Error: "Blockchain integration is disabled"
```bash
# Check .env file
cat .env | grep FABRIC_ENABLED

# Should be:
# FABRIC_ENABLED=true

# Restart backend
cd backend
npm start
```

### Error: "No blockchain record found"
```bash
# Check if blockchain network is running
cd fabric-network
docker ps | grep hyperledger

# Check chaincode logs
docker logs -f $(docker ps -q -f name=prima)

# Manually query blockchain
cd backend
node test-fabric-direct.js
```

### Error: "Insufficient endorsements"
```bash
# Check endorsement policy
cd fabric-network
peer lifecycle chaincode querycommitted --channelID primachannel --name prima

# Should show: OR('Org1MSP.peer','Org2MSP.peer')
```

## Monitoring & Alerts

### Setup Alert untuk Hash Mismatch

```bash
# Cron job untuk daily validation check
0 2 * * * curl -X GET "http://localhost:3000/api/v1/kegiatan/validate-all" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | \
  jq '.inconsistencies[] | select(.type == "HASH_MISMATCH")' | \
  mail -s "⚠️ Hash Mismatch Detected!" admin@example.com
```

### Prometheus Metrics (Future)

```javascript
// Add to server.js
const promClient = require('prom-client');

const blockchainValidationCounter = new promClient.Counter({
  name: 'blockchain_validation_total',
  help: 'Total blockchain validations',
  labelNames: ['result']
});

const hashMismatchCounter = new promClient.Counter({
  name: 'blockchain_hash_mismatch_total',
  help: 'Total hash mismatches detected'
});
```

---

**Last Updated**: 2026-05-19  
**Version**: 1.0.0
