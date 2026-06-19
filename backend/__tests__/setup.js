/**
 * Test Setup and Configuration
 * Initializes test environment and provides helper functions
 */

// Load environment variables first
require('dotenv').config();

const { pool } = require('../config/database');

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
process.env.NODE_ENV = 'test';
// Disable rate limiting in tests (registerLimiter caps at 3/hour, which otherwise
// trips suites that register several users). Forced off — dotenv above may have
// set it from .env, and the middleware reads this flag at require time.
process.env.RATE_LIMIT_ENABLED = 'false';

// Helper function to clean up database after tests
async function cleanupDatabase() {
  try {
    const testUsers = "SELECT id FROM sk.users WHERE email LIKE '%test%'";
    // Delete test data in reverse order of dependencies.
    await pool.query(`DELETE FROM sk.audit_logs WHERE user_id IN (${testUsers})`);
    // riwayat_jabatan_dosen references users via dosen_id AND changed_by; it is
    // created when an SK is issued and must be cleared before deleting users.
    await pool.query(`DELETE FROM sk.riwayat_jabatan_dosen WHERE dosen_id IN (${testUsers}) OR changed_by IN (${testUsers})`);
    // Unlock kegiatan first: used_in_usulan_id FK would block deleting the usulan.
    await pool.query(`UPDATE sk.kegiatan_dosen SET used_in_usulan_id = NULL WHERE dosen_id IN (${testUsers})`);
    // dokumen_administrasi + usulan_kegiatan_snapshot cascade on usulan delete.
    await pool.query(`DELETE FROM sk.usulan_kenaikan_pangkat WHERE dosen_id IN (${testUsers})`);
    await pool.query(`DELETE FROM sk.kegiatan_dosen WHERE dosen_id IN (${testUsers})`);
    await pool.query("DELETE FROM sk.users WHERE email LIKE '%test%'");
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Helper function to create a test user
async function createTestUser(userData = {}) {
  const bcrypt = require('bcrypt');
  const defaultUser = {
    nip_nidn: `TEST${Date.now()}`,
    nama_lengkap: 'Test User',
    email: `test${Date.now()}@test.com`,
    password_hash: await bcrypt.hash('password123', 10),
    role: 'dosen',
  };

  const user = { ...defaultUser, ...userData };

  const result = await pool.query(
    `INSERT INTO sk.users (nip_nidn, nama_lengkap, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nip_nidn, nama_lengkap, email, role`,
    [user.nip_nidn, user.nama_lengkap, user.email, user.password_hash, user.role]
  );

  return result.rows[0];
}

// Helper function to generate JWT token for testing.
// Must match how the login route signs tokens (routes/v1/auth.js) — the auth
// middleware verifies issuer/audience/algorithm, so omitting them yields a 401.
function generateTestToken(userId, role = 'dosen') {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: 'prima-api',
      audience: 'prima-app',
      algorithm: 'HS256',
    }
  );
}

// Cleanup before and after all tests
beforeAll(async () => {
  await cleanupDatabase();
});

afterAll(async () => {
  await cleanupDatabase();
  await pool.end();
});

module.exports = {
  cleanupDatabase,
  createTestUser,
  generateTestToken,
};
