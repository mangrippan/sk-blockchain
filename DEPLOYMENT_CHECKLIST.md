# Post-Migration Checklist

## ✅ Verification Checklist

### Code Changes
- [x] LDAP services removed from all files
- [x] SkContext DbContext registered in Program.cs
- [x] PostgreSQL connection string configured
- [x] AccountService.Login() uses database authentication
- [x] AccountService.Authorize() fetches roles from database
- [x] AccountService.GetAuthorize() retrieves user from database
- [x] BCrypt password verification implemented
- [x] Unused code removed (QueryHakAkses, AccountViewModel)
- [x] LDAP configuration removed from appsettings

### Build Status
- [x] Project builds successfully
- [x] No compilation errors
- [x] Only minor warnings (nullability, unused parameters)

### Files Modified
1. [x] Program.cs
2. [x] appsettings.json
3. [x] appsettings.Development.json
4. [x] Services/AccountService.cs

### Files Created
1. [x] MIGRATION_NOTES.md - Complete migration documentation
2. [x] setup_users.sql - SQL script for user setup
3. [x] Utilities/PasswordHashUtility.cs - Password hash utility

---

## 🔄 Before Deployment

### Database Setup Required
- [ ] Verify users table exists in database (sk.users)
- [ ] Create test users with BCrypt hashed passwords
- [ ] Verify database connection (Host: 172.17.10.15, DB: aurora)
- [ ] Test database connectivity from application

### Testing Required
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test login with non-existent user
- [ ] Test role authorization for admin
- [ ] Test role authorization for dosen
- [ ] Test role authorization for reviewer
- [ ] Verify JWT token generation
- [ ] Test GetAuthorize endpoint

### Configuration Verification
- [ ] Verify Jwt:Key is set correctly
- [ ] Verify Jwt:Issuer is set correctly
- [ ] Verify Jwt:Audience is set correctly
- [ ] Verify Jwt:ExpiryInMinutes is appropriate
- [ ] Verify connection string credentials are correct

---

## 📝 Sample User Creation

Use this SQL to create a test user:

```sql
-- Generate hash in C# first:
-- using Backend.Utilities;
-- string hash = PasswordHashUtility.HashPassword("admin123");

INSERT INTO sk.users (nip_nidn, password_hash, nama_lengkap, role, jabatan_saat_ini)
VALUES (
    '123456789',
    '$2a$11$[YOUR_BCRYPT_HASH_HERE]',
    'Test Admin',
    'admin',
    'Administrator'
);
```

---

## 🚨 Rollback Plan (if needed)

If you need to rollback to LDAP:
1. Restore previous version of Program.cs
2. Restore previous version of AccountService.cs
3. Restore appsettings files with LDAP configuration
4. Re-add LDAP service registration

**However, this is NOT recommended as the new implementation is cleaner and more maintainable.**

---

## 📞 Support

If you encounter issues:

1. **Database Connection Issues**
   - Verify PostgreSQL server is running
   - Check network connectivity to 172.17.10.15
   - Verify credentials: aurora/Gunung@Mer4pi?
   - Check firewall rules

2. **Authentication Issues**
   - Verify user exists in sk.users table
   - Verify password is BCrypt hashed
   - Check JWT configuration in appsettings
   - Verify role mapping (admin=1, dosen=2, reviewer=3)

3. **Build Issues**
   - Run: `dotnet clean`
   - Run: `dotnet restore`
   - Run: `dotnet build`

---

## ✅ Final Status

**Migration Status**: COMPLETE ✅
**Build Status**: SUCCESS ✅
**Code Quality**: GOOD ✅
**Documentation**: COMPLETE ✅

**Ready for deployment after database setup and testing.**

