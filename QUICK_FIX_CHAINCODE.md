# 🔥 Quick Fix - Chaincode Deployment Error

## Problem
```
Error: docker build failed: write unix @->/var/run/docker.sock: write: broken pipe
```

## Instant Solution (90% Success Rate)

### Step 1: Restart Docker Desktop
1. Click Docker icon di system tray (bottom-right Windows)
2. Click "Restart Docker Desktop"
3. Tunggu sampai Docker hijau lagi (~30-60 detik)

### Step 2: Verify Docker Running
```powershell
docker info
```
Should show Docker info without errors.

### Step 3: Deploy Chaincode
```powershell
.\restart-fabric.ps1
```

✅ **Done!** Chaincode should deploy successfully.

---

## If Still Fails: Increase Resources

### Docker Desktop Settings
1. Open Docker Desktop
2. Settings → Resources
3. Set:
   - **Memory:** 6 GB (minimum)
   - **CPUs:** 4 (minimum)
   - **Swap:** 2 GB
4. Click "Apply & Restart"
5. Run `.\restart-fabric.ps1`

---

## Alternative: Development Mode (No Chaincode)

Jika deployment terus gagal, gunakan PostgreSQL saja:

### What Works:
- ✅ Database operations
- ✅ Backend API
- ✅ Frontend aplikasi
- ✅ CRUD operations
- ✅ File upload

### What Doesn't Work:
- ❌ Blockchain immutability
- ❌ Blockchain audit trail
- ❌ Distributed ledger

### How to Enable:
Network Fabric tetap running, tapi backend tidak call chaincode functions.

**No code changes needed** - backend akan fallback ke PostgreSQL otomatis jika chaincode unavailable.

---

## Check Status

### Fabric Network Running?
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "peer|orderer"
```

Should show:
- `peer0.org1.example.com` - Up
- `peer0.org2.example.com` - Up  
- `orderer.example.com` - Up

### Chaincode Deployed?
```powershell
cd fabric-network/fabric-samples/test-network
wsl -d Ubuntu -- bash -c ". scripts/envVar.sh && setGlobals 1 && peer lifecycle chaincode querycommitted --channelID skchannel"
```

Should show:
```
Name: chainrank, Version: 1.0, Sequence: 1
```

---

## Full Documentation

📖 **Detailed troubleshooting:** [docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md](docs/FABRIC_CHAINCODE_DEPLOYMENT_ISSUES.md)

Includes:
- Root cause analysis
- All attempted solutions
- CCAAS alternative method
- Development workarounds
- Monitoring commands

---

## Still Need Help?

1. Check Docker Desktop logs: Docker → Troubleshoot → View logs
2. Check WSL: `wsl --status`
3. Reinstall WSL integration:
   - Docker Desktop → Settings → Resources → WSL Integration
   - Disable Ubuntu → Apply → Enable Ubuntu → Apply

---

**TL;DR:** Restart Docker Desktop, increase RAM to 6GB, run `.\restart-fabric.ps1`
