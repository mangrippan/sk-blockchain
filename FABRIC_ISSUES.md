# Fabric Integration Issues (Known Issues)

## 🔴 Status: DEFERRED (Week 3/4 Fix)

**Decision:** Proceed with **Fallback Mode** (database-only) for Week 2 backend development, fix Fabric integration in Week 3/4.

---

## 📋 Issues Discovered (May 17, 2026)

### 1. Chaincode Connection Refused ❌

**Symptom:**
```
Error: connection to chainrank_1.0:... failed
dial tcp 172.19.0.8:9999: connect: connection refused
```

**Root Cause:**
- Chaincode-as-a-Service containers not reachable from peer containers
- Network connectivity issue between peer and chaincode containers  
- Possible Docker network configuration problem

**Impact:**
- Cannot invoke chaincode transactions
- Cannot query blockchain state

---

### 2. Certificate Authority Invalid Identity ❌

**Symptom:**
```
WARN [policies] invalid identity error="certificate signed by unknown authority"
identity="mspid=Org1MSP subject=CN=appUser"
```

**Root Cause:**
- appUser identity certificate not recognized by peer
- Possible MSP configuration mismatch
- CA certificates not properly imported

**Impact:**
- Discovery service access denied
- Identity validation failures

---

## 🔧 Attempted Fixes

### Attempt 1: Disable Discovery Service
- **Action:** Set `discovery: { enabled: false }` in fabricClient.js
- **Result:** Connected to gateway, but still can't reach peers
- **Status:** ❌ Partial success only

### Attempt 2: Check Container Status
- **Action:** Verified all containers running (peers, orderers, CAs, chaincode)
- **Result:** All containers up and healthy
- **Status:** ✅ Containers OK

### Attempt 3: Check Chaincode Logs
- **Action:** Examined peer0org1_chainrank_ccaas logs
- **Result:** Chaincode started OK, but peer can't connect to it
- **Status:** ⚠️ Chaincode running but unreachable

---

## 💡 Workaround: Fallback Mode

### Current Strategy
Use fabricClient's built-in fallback mode:
```javascript
// When FABRIC_ENABLED=false or connection fails:
// - submitTransaction() returns null
// - evaluateTransaction() returns null
// - Backend continues with database-only mode
```

### Benefits
1. ✅ **Non-blocking Development**
   - Backend API development continues
   - Frontend development can proceed
   - Testing & integration work continues

2. ✅ **Database Architecture Still Hybrid-Ready**
   - Schema includes `blockchain_tx_id` field
   - File hashing still implemented
   - Audit trail structure in place

3. ✅ **Easy to Re-enable Later**
   - Just fix Fabric network
   - Set `FABRIC_ENABLED=true`
   - No code changes needed

---

## 🔍 Root Cause Analysis Needed

### Investigation Tasks (Week 3/4)

1. **Network Configuration**
   - [ ] Check Docker network settings
   - [ ] Verify chaincode containers in correct network
   - [ ] Test peer-to-chaincode connectivity

2. **Chaincode-as-a-Service**
   - [ ] Review ccaas deployment script  
   - [ ] Verify chaincode address configuration
   - [ ] Test chaincode container direct access

3. **Certificate Authority**
   - [ ] Re-enroll appUser identity
   - [ ] Verify CA certificates
   - [ ] Check MSP configuration
   - [ ] Import missing certificates

4. **Alternative Approach**
   - [ ] Consider using standard chaincode deployment (not ccaas)
   - [ ] Test with Fabric test-network default setup
   - [ ] Simplify network to 1 org if needed

---

## 📊 Impact Assessment

| Feature | Without Fabric | With Fabric | Impact |
|---------|---------------|-------------|---------|
| Upload Kegiatan | ✅ DB only | ✅ DB + Hash | Low |
| Verify Kegiatan | ✅ DB status | ✅ DB + Blockchain | Medium |
| Audit Trail | ⚠️ DB logs only | ✅ Immutable blockchain | High |
| File Integrity | ⚠️ DB hash | ✅ Blockchain verify | High |
| Demo Value | ⚠️ Reduced | ✅ Full blockchain demo | High |

**Verdict:** Can proceed with MVP, but **must fix before final demo** for full blockchain value proposition.

---

## 🎯 Recommended Fix Timeline

### Week 2 (Current)
- ✅ Use fallback mode
- ✅ Complete backend API
- ✅ Complete frontend
- ✅ Test with database only

### Week 3
- 🔧 Deep dive Fabric network debugging
- 🔧 Fix chaincode connectivity
- 🔧 Fix certificate issues
- ✅ Re-test with Fabric enabled

### Week 4
- ✅ Integration testing with blockchain
- ✅ End-to-end testing
- ✅ Demo preparation
- ✅ Documentation update

---

## 📚 Reference Links

- [Hyperledger Fabric Chaincode-as-a-Service](https://hyperledger-fabric.readthedocs.io/en/latest/cc_launcher.html)
- [Fabric Network Troubleshooting](https://hyperledger-fabric.readthedocs.io/en/latest/troubleshooting.html)
- [MSP Configuration](https://hyperledger-fabric.readthedocs.io/en/latest/msp.html)
- [Identity Management](https://hyperledger-fabric.readthedocs.io/en/latest/identity/identity.html)

---

## ✅ Fallback Mode Configuration

### Current Setup (Working)
```env
# backend/.env
FABRIC_ENABLED=false  # Set to true after fixing issues

# When false:
# - Backend APIs work with database only
# - blockchain_tx_id remains NULL
# - file_hash still stored in DB
# - Audit logs in DB (not blockchain)
```

### Testing Fallback Mode
```bash
cd backend
node test-db.js  # ✅ Should work
npm start        # ✅ Server starts
# API endpoints work with DB only
```

---

**Status:** 📝 DOCUMENTED - Ready to proceed with Week 2 backend development  
**Priority:** 🟡 Medium - Must fix before final demo (Week 4)  
**Owner:** To be fixed in Week 3  
**Last Updated:** May 17, 2026
