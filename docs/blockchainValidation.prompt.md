# Plan: Implement SK Document Hash Blockchain Validation

## Problem

When `sk_document_hash` is manually changed in the `usulan_kenaikan_pangkat` database table, the system does NOT detect this as invalid/tampered. The blockchain stores the original `skHash` via `TerbitkanSkKenaikanPangkat`, but no endpoint or logic exists to compare the DB value against the blockchain value.

## Solution

Add a validation endpoint for usulan SK hash integrity (analogous to `kegiatan-blockchain-validation.example.js`) and integrate it into the audit trail response.

---

## Steps

### Phase 1: Chaincode — Add `VerifySkHash` function

1. **Add `VerifySkHash` to chaincode** — *new chaincode function*
   - File: `chaincode/lib/kegiatanContract.js`
   - Add after `VerifyUsulanSnapshot` (~line 465)
   - Reads USULAN_ record, compares provided `skHash` against stored `skHash`
   - Returns: `{ usulanId, storedHash, providedHash, isValid, message, verifiedAt }`
   - Pattern: follow `VerifyDocumentHash` (line ~188) and `VerifyUsulanSnapshot` (line ~444)

2. **Add test for `VerifySkHash`**
   - File: `chaincode/__tests__/kegiatanContract.test.js`
   - Add test cases: valid hash match, invalid hash mismatch, nonexistent usulan

### Phase 2: Backend — Expose validation via fabricClient

3. **Add `verifySkHash` wrapper in fabricClient** — *depends on step 1*
   - File: `backend/utils/fabricClient.js`
   - Add function: `async function verifySkHash(usulanId, skDocumentHash)`
   - Calls `evaluateTransaction('VerifySkHash', ...)`
   - Export from module
   - Pattern: follow `verifyUsulanSnapshot` (line ~321)

4. **Add `getUsulan` wrapper in fabricClient** (optional but useful)
   - File: `backend/utils/fabricClient.js`
   - Add function: `async function getUsulan(usulanId)`
   - Calls `evaluateTransaction('GetUsulan', ...)`
   - Returns parsed JSON of the full blockchain usulan record

### Phase 3: Backend — Add validation endpoint

5. **Add `GET /api/v1/usulan/:id/validate-blockchain` endpoint** — *depends on step 3*
   - File: `backend/routes/v1/usulan.js`
   - Add before the `/:id/audit` route
   - Logic:
     - Get usulan from DB (includes `sk_document_hash`)
     - If blockchain enabled and SK issued, call `fabricClient.verifySkHash(id, usulan.sk_document_hash)`
     - Also call `fabricClient.verifyUsulanSnapshot(id, calculatedSnapshotHash)` if snapshot exists
     - Return structured response with `valid`, `checks`, `details`, `errors`
   - Access: same as audit (dosen own, admin, pimpinan, superadmin, auditor)
   - Pattern: follow `kegiatan-blockchain-validation.example.js` structure

### Phase 4: Enhance audit trail with integrity status

6. **Add integrity check to `GET /:id/audit` response** — *depends on step 3*
   - File: `backend/routes/v1/usulan.js` (audit endpoint ~line 658)
   - After fetching blockchain history, also call `verifySkHash` if status is `sk_issued`
   - Add `integrity` field to response:
     ```json
     {
       "integrity": {
         "skHashValid": true,
         "snapshotHashValid": true,
         "blockchainHash": "...",
         "databaseHash": "...",
         "message": "..."
       }
     }
     ```
   - This ensures the audit trail itself reports validity status

### Phase 5: Frontend — Display validation status

7. **Add integrity badge/warning in UsulanDetail.vue** — *depends on step 6*
   - File: `frontend/src/views/usulan/UsulanDetail.vue`
   - Read `integrity` field from audit trail response
   - Show green badge if valid, red warning if invalid
   - Show hash comparison details on expand/click

8. **Add "Validate Blockchain" button in UsulanDetail.vue** — *parallel with step 7*
   - Call `GET /api/v1/usulan/:id/validate-blockchain`
   - Display full validation report modal/card

### Phase 6: Testing

9. **Backend unit/integration tests** — *depends on steps 5, 6*
   - File: `backend/__tests__/usulan.test.js`
   - Test: validate-blockchain returns valid when hashes match
   - Test: validate-blockchain returns invalid when sk_document_hash is tampered
   - Test: audit trail includes integrity field

---

## Relevant Files

- `chaincode/lib/kegiatanContract.js` — add `VerifySkHash` function (pattern: `VerifyDocumentHash` at line ~188, `VerifyUsulanSnapshot` at line ~444)
- `chaincode/__tests__/kegiatanContract.test.js` — add tests for new chaincode function
- `backend/utils/fabricClient.js` — add `verifySkHash()` and `getUsulan()` wrappers (pattern: `verifyUsulanSnapshot` at line ~321)
- `backend/routes/v1/usulan.js` — add `validate-blockchain` endpoint and enhance audit endpoint
- `backend/routes/v1/kegiatan-blockchain-validation.example.js` — reference implementation to follow
- `frontend/src/views/usulan/UsulanDetail.vue` — display integrity status
- `backend/__tests__/usulan.test.js` — add test coverage

## Verification

1. **Manual test — tamper detection:** Change `sk_document_hash` in DB → call `GET /api/v1/usulan/:id/validate-blockchain` → should return `valid: false` with `SK_HASH_MISMATCH` error
2. **Manual test — valid case:** Without tampering → same endpoint → should return `valid: true`
3. **Manual test — audit trail:** Call `GET /api/v1/usulan/:id/audit` → `integrity.skHashValid` should be `false` after tampering
4. **Unit tests:** `npm test -- usulan.test.js` passes
5. **Chaincode tests:** `cd chaincode && npm test` passes
6. **Frontend:** Navigate to usulan detail → see red warning badge when tampered

## Decisions

- New chaincode function `VerifySkHash` is a read-only query (evaluateTransaction), no new transaction needed
- Integrity check added inline to audit response (no extra API call needed from frontend for basic detection)
- Separate `/validate-blockchain` endpoint for full detailed validation report
- If Fabric is disabled, validation is skipped with a warning (graceful degradation)
- Only check SK hash if status is `sk_issued` (hash is null before that)

## Further Considerations

1. **Snapshot hash verification** — Should `validate-blockchain` also verify `snapshotHash`? Recommendation: Yes, verify both in the same call.
2. **Chaincode deployment** — Adding a new function requires redeploying chaincode. The user may need to run `deploy-cc.sh` again.
