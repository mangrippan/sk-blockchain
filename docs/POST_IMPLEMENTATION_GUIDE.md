# Post-Implementation Installation Guide

## Prerequisites
- Node.js v16 atau lebih tinggi
- PostgreSQL running
- Hyperledger Fabric network running (optional)

## Installation Steps

### 1. Install Dependencies

```powershell
cd backend
npm install
```

**New packages yang akan terinstall:**
- `express-rate-limit` - Rate limiting middleware
- `file-type` - File magic byte detection

### 2. Update Environment Variables

Copy `.env.example` ke `.env` jika belum ada, kemudian update:

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
JWT_SECRET=<generated_secret_from_above>
FABRIC_USER_ID=appUser
NODE_ENV=development
```

### 3. Remove Wallet Files from Git (If Previously Committed)

```powershell
# Remove from git tracking
git rm --cached fabric-config/wallet/*.id
git rm --cached fabric-config/wallet/*.json

# Commit the change
git commit -m "chore: remove sensitive wallet files from git"
```

### 4. Re-enroll Fabric Identities

```powershell
# Start Fabric network first
cd fabric-network
.\start-network-ccaas.ps1

# Enroll identities
cd ..\backend
node enroll-wallet.js
```

### 5. Database Migration (if needed)

No schema changes required for this security update.

### 6. Start the Server

```powershell
cd backend
npm run dev
```

### 7. Verify Installation

**Test endpoints:**

1. Health check:
   ```bash
   curl http://localhost:3000/health
   ```

2. Rate limiting:
   ```bash
   # Try 6 rapid login attempts (should get rate limited after 5)
   for($i=1; $i -le 6; $i++) {
     curl -X POST http://localhost:3000/api/v1/auth/login `
       -H "Content-Type: application/json" `
       -d '{"email":"test@test.com","password":"wrong"}'
   }
   ```

3. File upload validation:
   ```bash
   # Upload a valid PDF - should work
   curl -X POST http://localhost:3000/api/v1/kegiatan `
     -H "Authorization: Bearer YOUR_TOKEN" `
     -F "file=@test.pdf" `
     -F "ref_kegiatan_id=1"
   ```

4. Pagination limit:
   ```bash
   # Try to request 200 items (should be capped at 100)
   curl http://localhost:3000/api/v1/kegiatan?limit=200 `
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Frontend Changes Required

### 1. Update File Download URLs

**Before:**
```javascript
const fileUrl = `http://localhost:3000/uploads/${filename}`;
```

**After:**
```javascript
const fileUrl = `http://localhost:3000/api/v1/files/kegiatan/${kegiatanId}`;
// or
const fileUrl = `http://localhost:3000/api/v1/files/sk/${usulanId}`;

// Add JWT token to request
fetch(fileUrl, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### 2. Handle New Error Format

**Before:**
```javascript
{
  "error": "Some internal error with stack trace"
}
```

**After (Development):**
```javascript
{
  "error": "Internal Server Error",
  "correlationId": "abc123def456",
  "detail": "Actual error message",
  "stack": "..."
}
```

**After (Production):**
```javascript
{
  "error": "Internal Server Error",
  "correlationId": "abc123def456",
  "message": "An error occurred. Please contact support with the correlation ID."
}
```

### 3. Update Pagination Handling

**New pagination response format:**
```javascript
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

## Troubleshooting

### Issue: Rate limit errors
**Solution:** Wait 15 minutes or restart server (rate limit counter resets)

### Issue: File type validation errors
**Solution:** Ensure you're uploading actual PDF/JPEG/PNG files, not renamed executables

### Issue: JWT verification fails
**Solution:** Users need to re-login to get new tokens with issuer/audience claims

### Issue: Fabric identity not found
**Solution:** 
```powershell
cd backend
node enroll-wallet.js
```

### Issue: Database SSL errors in production
**Solution:** Set `DB_SSL=false` for local dev, or provide proper CA certificate

## Security Testing

Run these tests to verify security improvements:

1. **Brute force protection:**
   - Try 10 failed logins → should be blocked after 5

2. **File type bypass:**
   - Rename a .exe to .pdf and upload → should be rejected

3. **IDOR test:**
   - As dosen, try to access another dosen's file → should be denied
   - As dosen, try to query jabatan-next for another user → should be denied

4. **Pagination DoS:**
   - Request limit=999999 → should be capped at 100

5. **Chaincode access control:**
   - Try to call VerifyKegiatan without proper role → should be denied

## Rollback Plan

If issues occur, revert these commits:
```powershell
git log --oneline
# Find the commit before security implementation
git revert <commit-hash>
```

Or disable specific features:
- Rate limiting: Comment out `app.use(globalLimiter)` in server.js
- File validation: Remove `validateUploadedFile` middleware from routes
- JWT hardening: Remove algorithm/issuer/audience from jwt.verify/sign

## Support

For issues, check:
1. [SECURITY_HARDENING_PLAN.md](SECURITY_HARDENING_PLAN.md)
2. [SECURITY_IMPLEMENTATION_SUMMARY.md](SECURITY_IMPLEMENTATION_SUMMARY.md)
3. Server logs with correlation ID from error responses
