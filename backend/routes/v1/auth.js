/**
 * Authentication Routes
 * /api/v1/auth
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');

/**
 * POST /api/v1/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { nip, nama, email, password, role } = req.body;
    
    // Validation
    if (!nip || !nama || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['nip', 'nama', 'email', 'password'],
      });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE nip = $1 OR email = $2',
      [nip, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'NIP or email already registered',
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (nip, nama, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nip, nama, email, role, created_at`,
      [nip, nama, email, password_hash, role || 'dosen']
    );
    
    const user = result.rows[0];
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        nip: user.nip,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        required: ['email', 'password'],
      });
    }
    
    // Find user
    const result = await pool.query(
      `SELECT id, nip, nama, email, password_hash, role, is_active
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password incorrect',
      });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (user.is_active === false) {
      return res.status(403).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Contact administrator.',
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password incorrect',
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        nip: user.nip,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      }
    );
    
    // Update last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        nip: user.nip,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', require('../../middleware/auth').auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nip, nama, email, role, department, jabatan, created_at, last_login
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }
    
    res.json({
      user: result.rows[0],
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      message: error.message,
    });
  }
});

module.exports = router;
