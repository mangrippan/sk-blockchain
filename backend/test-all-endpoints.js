/**
 * Comprehensive API Endpoint Tests
 * Tests all major endpoints in the ChainRank Backend MVP
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function runAllTests() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     🧪 ChainRank API - Comprehensive Endpoint Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  let dosenToken;
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await pool.query('SET search_path TO sk');

  // ==================== AUTH ENDPOINTS ====================
  console.log('📌 TESTING: Authentication Endpoints\n');

  // Test 1: Health Check
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('  ✅ GET /health - Server health check');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /health - FAILED:', error.message);
    results.failed++;
  }

  // Test 2: User Registration
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      nip: '199999012025031' + Date.now().toString().slice(-3),
      nama: 'Test Dosen Comprehensive',
      email: `test.comprehensive.${Date.now()}@test.com`,
      password: 'Test123!',
      role: 'dosen'
    });
    
    if (response.status === 201 && response.data.user) {
      console.log('  ✅ POST /api/v1/auth/register - User registration');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ POST /api/v1/auth/register - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 3: User Login
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'test.dosen@test.com',
      password: 'Test123!'
    });
    
    if (response.status === 200 && response.data.token) {
      dosenToken = response.data.token;
      console.log('  ✅ POST /api/v1/auth/login - User login');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ POST /api/v1/auth/login - FAILED:', error.response?.data || error.message);
    results.failed++;
    return; // Can't continue without token
  }

  // Test 4: Get Current User
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${dosenToken}` }
    });
    
    if (response.status === 200 && response.data.user) {
      console.log('  ✅ GET /api/v1/auth/me - Get current user info');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/auth/me - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // ==================== REFERENCE DATA ENDPOINTS ====================
  console.log('\n📌 TESTING: Reference Data Endpoints\n');

  // Test 5: Get Kategori KUM
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/ref/kategori`);
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`  ✅ GET /api/v1/ref/kategori - Found ${response.data.data.length} categories`);
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/ref/kategori - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 6: Get Kegiatan Types
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/ref/kegiatan`);
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`  ✅ GET /api/v1/ref/kegiatan - Found ${response.data.data.length} kegiatan types`);
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/ref/kegiatan - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 7: Get Kegiatan Type by ID
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/ref/kegiatan/1`);
    
    if (response.status === 200 && response.data.data) {
      console.log('  ✅ GET /api/v1/ref/kegiatan/:id - Get specific kegiatan type');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/ref/kegiatan/:id - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 8: Get Dokumen Types
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/ref/dokumen`);
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`  ✅ GET /api/v1/ref/dokumen - Found ${response.data.data.length} document types`);
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/ref/dokumen - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // ==================== KEGIATAN ENDPOINTS ====================
  console.log('\n📌 TESTING: Kegiatan Endpoints\n');

  let testKegiatanId;

  // Test 9: Get All Kegiatan
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/kegiatan`, {
      headers: { Authorization: `Bearer ${dosenToken}` }
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`  ✅ GET /api/v1/kegiatan - Found ${response.data.data.length} kegiatan for user`);
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/kegiatan - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 10: Get Dashboard Stats
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/kegiatan/stats/dashboard`, {
      headers: { Authorization: `Bearer ${dosenToken}` }
    });
    
    if (response.status === 200 && response.data.data) {
      console.log('  ✅ GET /api/v1/kegiatan/stats/dashboard - Dashboard statistics');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/kegiatan/stats/dashboard - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 11: Create Kegiatan with File Upload
  try {
    const testFile = path.join(__dirname, 'test-comprehensive.pdf');
    fs.writeFileSync(testFile, `Test document - ${new Date().toISOString()}`);

    const form = new FormData();
    form.append('ref_kegiatan_id', '1');
    form.append('deskripsi', 'Comprehensive test - Jurnal internasional');
    form.append('file', fs.createReadStream(testFile));

    const response = await axios.post(
      `${BASE_URL}/api/v1/kegiatan`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${dosenToken}`,
        },
      }
    );

    fs.unlinkSync(testFile);

    if (response.status === 201 && response.data.data) {
      testKegiatanId = response.data.data.id;
      console.log('  ✅ POST /api/v1/kegiatan - File upload & kegiatan creation');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ POST /api/v1/kegiatan - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 12: Get Kegiatan by ID
  if (testKegiatanId) {
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/kegiatan/${testKegiatanId}`, {
        headers: { Authorization: `Bearer ${dosenToken}` }
      });
      
      if (response.status === 200 && response.data.data) {
        console.log('  ✅ GET /api/v1/kegiatan/:id - Get specific kegiatan');
        results.passed++;
      }
    } catch (error) {
      console.log('  ❌ GET /api/v1/kegiatan/:id - FAILED:', error.response?.data || error.message);
      results.failed++;
    }

    // Test 13: Get Audit Trail
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/kegiatan/${testKegiatanId}/audit`, {
        headers: { Authorization: `Bearer ${dosenToken}` }
      });
      
      if (response.status === 200 && Array.isArray(response.data.data)) {
        console.log(`  ✅ GET /api/v1/kegiatan/:id/audit - Found ${response.data.data.length} audit entries`);
        results.passed++;
      }
    } catch (error) {
      console.log('  ❌ GET /api/v1/kegiatan/:id/audit - FAILED:', error.response?.data || error.message);
      results.failed++;
    }
  }

  // ==================== USULAN ENDPOINTS ====================
  console.log('\n📌 TESTING: Usulan Kenaikan Pangkat Endpoints\n');

  // Test 14: Get All Usulan
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/usulan`, {
      headers: { Authorization: `Bearer ${dosenToken}` }
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`  ✅ GET /api/v1/usulan - Found ${response.data.data.length} usulan for user`);
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ GET /api/v1/usulan - FAILED:', error.response?.data || error.message);
    results.failed++;
  }

  // Test 15: Create Usulan (if we have kegiatan)
  let usulanId;
  if (testKegiatanId) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/usulan`,
        {
          pangkat_tujuan: 'Lektor Kepala',
          golongan_tujuan: 'IV/b',
          jabatan_tujuan: 'Lektor Kepala',
          kegiatan_ids: [testKegiatanId]
        },
        {
          headers: {
            Authorization: `Bearer ${dosenToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 201 && response.data.data) {
        usulanId = response.data.data.id;
        console.log('  ✅ POST /api/v1/usulan - Create promotion proposal');
        results.passed++;
      }
    } catch (error) {
      console.log('  ❌ POST /api/v1/usulan - FAILED:', error.response?.data || error.message);
      results.failed++;
    }

    // Test 16: Get Usulan by ID
    if (usulanId) {
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/usulan/${usulanId}`, {
          headers: { Authorization: `Bearer ${dosenToken}` }
        });
        
        if (response.status === 200 && response.data.data) {
          console.log('  ✅ GET /api/v1/usulan/:id - Get specific usulan');
          results.passed++;
        }
      } catch (error) {
        console.log('  ❌ GET /api/v1/usulan/:id - FAILED:', error.response?.data || error.message);
        results.failed++;
      }

      // Test 17: Get Usulan Audit Trail
      try {
        const response = await axios.get(`${BASE_URL}/api/v1/usulan/${usulanId}/audit`, {
          headers: { Authorization: `Bearer ${dosenToken}` }
        });
        
        if (response.status === 200 && Array.isArray(response.data.data)) {
          console.log(`  ✅ GET /api/v1/usulan/:id/audit - Found ${response.data.data.length} audit entries`);
          results.passed++;
        }
      } catch (error) {
        console.log('  ❌ GET /api/v1/usulan/:id/audit - FAILED:', error.response?.data || error.message);
        results.failed++;
      }
    }
  }

  // ==================== FINAL SUMMARY ====================
  await pool.end();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const total = results.passed + results.failed;
  const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`  ✅ Passed: ${results.passed}/${total} tests`);
  console.log(`  ❌ Failed: ${results.failed}/${total} tests`);
  console.log(`  📈 Success Rate: ${percentage}%\n`);

  if (results.passed === total) {
    console.log('  🎉 ALL TESTS PASSED!\n');
  } else if (results.passed > 0) {
    console.log('  ⚠️  SOME TESTS FAILED - Review errors above\n');
  } else {
    console.log('  ❌ ALL TESTS FAILED - Check server status\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  return results.passed === total ? 0 : 1;
}

// Run tests
runAllTests()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n❌ Test suite crashed:', error);
    process.exit(1);
  });
