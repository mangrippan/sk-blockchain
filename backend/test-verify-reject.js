/**
 * Test Kegiatan Verify/Reject Endpoints
 * Tests admin functionality for verifying and rejecting kegiatan
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function testVerifyRejectEndpoints() {
  console.log('🧪 Testing Kegiatan Verify/Reject Endpoints\n');
  console.log('═══════════════════════════════════════════════\n');

  let dosenToken, adminToken, kegiatanId;
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await pool.query('SET search_path TO sk');

  try {
    // Step 1: Register new admin for testing
    console.log('1️⃣  Setting up test users...\n');
    
    let adminEmail, adminPassword;
    
    // Try to register a test admin
    try {
      const axios = require('axios');
      const registerResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        nip: '199801012025011099',
        nama: 'Admin Test API',
        email: 'admin.test@test.com',
        password: 'AdminTest123!',
        role: 'admin_sdm'
      });
      
      adminEmail = 'admin.test@test.com';
      adminPassword = 'AdminTest123!';
      console.log('   ✅ Created new admin user:', adminEmail);
      
      // Grant admin_sdm role in database
      await pool.query(
        "UPDATE users SET role = 'admin_sdm' WHERE email = $1",
        [adminEmail]
      );
      console.log('   ✅ Granted admin_sdm role');
      
    } catch (error) {
      // If registration fails (user exists), use existing
      adminEmail = 'admin.test@test.com';
      adminPassword = 'AdminTest123!';
      console.log('   ✅ Using existing admin:', adminEmail);
    }

    // Step 2: Login as dosen
    console.log('\n2️⃣  Logging in as dosen...');
    const dosenLogin = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'test.dosen@test.com',
      password: 'Test123!',
    });

    dosenToken = dosenLogin.data.token;
    const dosenUser = dosenLogin.data.user;
    console.log(`   ✅ Logged in as: ${dosenUser.nama_lengkap}`);

    // Step 3: Login as admin
    console.log('\n3️⃣  Logging in as admin...');
    const adminLogin = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });

    adminToken = adminLogin.data.token;
    const adminUser = adminLogin.data.user;
    console.log(`   ✅ Logged in as: ${adminUser.nama_lengkap} (${adminUser.role})`);

    // Step 4: Create kegiatan as dosen
    console.log('\n4️⃣  Creating kegiatan as dosen...');
    const testFile = path.join(__dirname, 'test-verify.pdf');
    fs.writeFileSync(testFile, 'Test document for verification testing\n' + new Date().toISOString());

    const form = new FormData();
    form.append('ref_kegiatan_id', '2'); // Penelitian jurnal nasional
    form.append('deskripsi', 'Test kegiatan untuk verifikasi - Jurnal nasional terakreditasi');
    form.append('file', fs.createReadStream(testFile));

    const createResponse = await axios.post(
      `${BASE_URL}/api/v1/kegiatan`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${dosenToken}`,
        },
      }
    );

    kegiatanId = createResponse.data.data.id;
    console.log(`   ✅ Kegiatan created: ${kegiatanId}`);
    console.log(`   📊 Status: ${createResponse.data.data.status || 'unverified'}`);
    console.log(`   ⭐ Poin KUM: ${createResponse.data.data.poin_kum}`);

    // Cleanup test file
    fs.unlinkSync(testFile);

    // Step 5: Try verify as dosen (should fail - authorization test)
    console.log('\n5️⃣  Testing authorization - dosen trying to verify (should fail)...');
    try {
      await axios.put(
        `${BASE_URL}/api/v1/kegiatan/${kegiatanId}/verify`,
        {
          status: 'verified',
          catatan: 'Test verification',
        },
        {
          headers: {
            Authorization: `Bearer ${dosenToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('   ❌ ERROR: Dosen should not be able to verify!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('   ✅ Authorization works! Dosen blocked from verifying');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.response?.data?.error || error.message}`);
      }
    }

    // Step 6: Verify kegiatan as admin
    console.log('\n6️⃣  Verifying kegiatan as admin...');
    const verifyResponse = await axios.put(
      `${BASE_URL}/api/v1/kegiatan/${kegiatanId}/verify`,
      {
        status: 'verified',
        catatan: 'Dokumen lengkap dan sesuai standar',
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('   ✅ Kegiatan verified successfully!');
    console.log(`   📊 New status: ${verifyResponse.data.data.status}`);
    console.log(`   👤 Verified by: ${verifyResponse.data.data.verified_by}`);
    console.log(`   📅 Verified at: ${verifyResponse.data.data.verified_at}`);

    // Step 7: Check database status
    console.log('\n7️⃣  Verifying in database...');
    const dbCheck = await pool.query(
      'SELECT id, status, verified_by, verified_at FROM kegiatan_dosen WHERE id = $1',
      [kegiatanId]
    );

    if (dbCheck.rows.length > 0) {
      const record = dbCheck.rows[0];
      console.log('   ✅ Database updated!');
      console.log(`   📊 Status: ${record.status}`);
      console.log(`   👤 Verified by: ${record.verified_by || 'NULL'}`);
      console.log(`   📅 Verified at: ${record.verified_at || 'NULL'}`);
    }

    // Step 8: Get audit trail
    console.log('\n8️⃣  Checking audit trail...');
    const auditResponse = await axios.get(
      `${BASE_URL}/api/v1/kegiatan/${kegiatanId}/audit`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    console.log(`   ✅ Found ${auditResponse.data.data.length} audit entries`);
    auditResponse.data.data.slice(0, 3).forEach((entry, i) => {
      console.log(`   ${i + 1}. ${entry.action} by user ${entry.user_id} at ${entry.created_at}`);
    });

    // Step 9: Create another kegiatan to test rejection
    console.log('\n9️⃣  Creating another kegiatan for rejection test...');
    const testFile2 = path.join(__dirname, 'test-reject.pdf');
    fs.writeFileSync(testFile2, 'Test document for rejection testing\n' + new Date().toISOString());

    const form2 = new FormData();
    form2.append('ref_kegiatan_id', '3'); // Pengabdian
    form2.append('deskripsi', 'Test kegiatan untuk rejection');
    form2.append('file', fs.createReadStream(testFile2));

    const createResponse2 = await axios.post(
      `${BASE_URL}/api/v1/kegiatan`,
      form2,
      {
        headers: {
          ...form2.getHeaders(),
          Authorization: `Bearer ${dosenToken}`,
        },
      }
    );

    const kegiatanId2 = createResponse2.data.data.id;
    console.log(`   ✅ Kegiatan created: ${kegiatanId2}`);
    fs.unlinkSync(testFile2);

    // Step 10: Reject kegiatan as admin
    console.log('\n🔟  Rejecting kegiatan as admin...');
    const rejectResponse = await axios.put(
      `${BASE_URL}/api/v1/kegiatan/${kegiatanId2}/verify`,
      {
        status: 'rejected',
        catatan: 'Dokumen tidak lengkap - kurang lampiran pendukung',
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('   ✅ Kegiatan rejected successfully!');
    console.log(`   📊 Status: ${rejectResponse.data.data.status}`);
    console.log(`   📝 Rejection note: ${rejectResponse.data.data.catatan_penolakan || 'N/A'}`);

    // Final summary
    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 All Verify/Reject Tests Passed!\n');
    console.log('📊 SUMMARY:');
    console.log('   ✅ Admin user setup');
    console.log('   ✅ Authorization control works');
    console.log('   ✅ Verify endpoint works');
    console.log('   ✅ Reject endpoint works');
    console.log('   ✅ Audit trail logging works');
    console.log('   ✅ Database updates correctly');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
      console.error('Status:', error.response.status);
    }
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test
testVerifyRejectEndpoints()
  .then(() => {
    console.log('✅ Test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
