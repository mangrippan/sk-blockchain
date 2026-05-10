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

// Helper function to clean up database after tests
async function cleanupDatabase() {
  try {
    // Delete test data in reverse order of dependencies
    await pool.query('DELETE FROM sk.kegiatan_dosen WHERE created_at > NOW() - INTERVAL \'1 hour\'');
    await pool.query('DELETE FROM sk.users WHERE email LIKE \'%test%\'');
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

// Helper function to generate JWT token for testing
function generateTestToken(userId, role = 'dosen') {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
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
