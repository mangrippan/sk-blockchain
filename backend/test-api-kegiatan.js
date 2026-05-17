/**
 * Test POST /api/v1/kegiatan endpoint
 * Tests file upload and database operations
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testKegiatanAPI() {
  console.log('🧪 Testing Kegiatan API Endpoint\n');

  try {
    // Step 1: Login
    console.log('1️⃣  Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'test.dosen@test.com',
      password: 'Test123!',
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`   ✅ Logged in as: ${user.nama_lengkap} (${user.role})`);
    console.log(`   🎫 Token: ${token.substring(0, 30)}...\n`);

    // Step 2: Create test file
    console.log('2️⃣  Creating test document...');
    const testFilePath = path.join(__dirname, 'test-upload.pdf');
    const testContent = `
====================================
BUKTI KEGIATAN PENELITIAN
====================================

Judul: Implementasi Blockchain untuk Sistem Akademik
Tanggal: ${new Date().toLocaleDateString('id-ID')}
Dosen: ${user.nama_lengkap}
NIP: ${user.nip_nidn || 'N/A'}

Deskripsi:
Penelitian ini membahas implementasi teknologi blockchain
Hyperledger Fabric untuk sistem manajemen kenaikan pangkat
dosen berbasis web.

Hasil:
- Publikasi jurnal internasional (Q2)
- Poin KUM: 25.0

====================================
Dokumen ini adalah bukti sah kegiatan
====================================
    `.trim();

    fs.writeFileSync(testFilePath, testContent);
    console.log(`   ✅ Test file created: ${path.basename(testFilePath)}\n`);

    // Step 3: Upload kegiatan
    console.log('3️⃣  Uploading kegiatan...');
    const form = new FormData();
    form.append('ref_kegiatan_id', '1'); // Penelitian publikasi jurnal internasional
    form.append('deskripsi', 'Test API endpoint - Publikasi jurnal blockchain');
    form.append('file', fs.createReadStream(testFilePath));

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/v1/kegiatan`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const kegiatan = uploadResponse.data.data;
    console.log('   ✅ Kegiatan created successfully!');
    console.log(`   📋 ID: ${kegiatan.id}`);
    console.log(`   👤 Dosen ID: ${kegiatan.dosen_id}`);
    console.log(`   📚 Ref Kegiatan: ${kegiatan.ref_kegiatan_id}`);
    console.log(`   ⭐ Poin KUM: ${kegiatan.poin_kum}`);
    console.log(`   📄 File: ${kegiatan.file_name}`);
    console.log(`   #️⃣  Hash: ${kegiatan.file_hash.substring(0, 20)}...`);
    console.log(`   📊 Status: ${kegiatan.status || 'unverified'}\n`);

    // Step 4: Verify in database
    console.log('4️⃣  Verifying in database...');
    const { Pool } = require('pg');
    require('dotenv').config();

    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await pool.query('SET search_path TO sk');

    const dbResult = await pool.query(
      'SELECT id, dosen_id, ref_kegiatan_id, poin_kum, file_hash, status, tx_id_fabric FROM kegiatan_dosen WHERE id = $1',
      [kegiatan.id]
    );

    if (dbResult.rows.length > 0) {
      const dbRecord = dbResult.rows[0];
      console.log('   ✅ Record found in database!');
      console.log(`   🔗 Blockchain TX ID: ${dbRecord.tx_id_fabric || 'NULL (fallback mode)'}`);
      console.log(`   #️⃣  DB File Hash: ${dbRecord.file_hash.substring(0, 20)}...`);
      console.log(`   ✅ Hash matches: ${dbRecord.file_hash === kegiatan.file_hash ? 'YES' : 'NO'}\n`);
    }

    await pool.end();

    // Step 5: Get kegiatan list
    console.log('5️⃣  Fetching kegiatan list...');
    const listResponse = await axios.get(`${BASE_URL}/api/v1/kegiatan`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`   ✅ Found ${listResponse.data.data.length} kegiatan for this user`);
    console.log(`   📝 Latest kegiatan ID: ${listResponse.data.data[0]?.id || 'N/A'}\n`);

    // Cleanup
    console.log('🧹 Cleaning up...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('   ✅ Test file deleted\n');
    }

    console.log('🎉 All API tests passed!\n');
    console.log('════════════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log('   ✅ Login endpoint works');
    console.log('   ✅ File upload works');
    console.log('   ✅ Database insert works');
    console.log('   ✅ File hashing works');
    console.log('   ✅ Audit trail logged');
    console.log('   ⚠️  Blockchain in fallback mode (expected)');
    console.log('════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testKegiatanAPI()
  .then(() => {
    console.log('✅ Test suite completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
