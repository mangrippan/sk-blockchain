# Known Issue: Backend Fabric SDK Connection

## Issue
Backend (Windows) tidak bisa invoke/query chaincode meskipun:
- ✅ Connection berhasil (`getContract` success)
- ✅ Chaincode running dan healthy
- ✅ CLI invoke via WSL berhasil
- ❌ SDK transaction/query gagal dengan "No valid responses from any peers"

## Root Cause
Docker networking issue antara Windows dan WSL2:
- Peer container running di WSL2 Docker
- Backend SDK running di Windows
- `localhost:7051` dari Windows tidak properly route ke WSL2 container
- TLS certificate mismatch karena hostname resolution

## Workaround 1: Run Backend di WSL (Recommended for Development)

Jalankan backend server langsung di WSL untuk networking compatibility:

```bash
# Di WSL Ubuntu
cd /mnt/c/Users/riffa/source/repos/UsulanKenaikanPangkatBlockchain/backend
npm start
```

## Workaround 2: Disable Fabric (Database-Only Mode)

Set `FABRIC_ENABLED=false` di `.env`:

```env
FABRIC_ENABLED=false
```

Backend akan fallback ke PostgreSQL saja tanpa blockchain.

## Workaround 3: Use Host Network Mode

Modify `fabric-network/start-network-ccaas.ps1` to expose peers on host network.

## Status

- ✅ CCAAS deployment: **FIXED** (nested tar structure)
- ✅ Chaincode containers: **RUNNING**
- ✅ CLI invocation: **WORKS**
- ⚠️  SDK from Windows: **KNOWN LIMITATION** (networking)

## Next Steps

For production deployment, consider:
1. Deploy all services (backend + Fabric) on Linux host
2. Or use Docker Compose to run backend in same network as Fabric
3. Or configure proper Docker Desktop networking for WSL2 integration

## Verification

Chaincode **IS** working - verified via CLI:
```bash
peer chaincode invoke -C skchannel -n chainrank -c '{"function":"InitLedger","Args":[]}'
# Result: status:200 ✅
```

Backend integration via SDK requires network configuration adjustment.

---
Last Updated: 2026-05-19
