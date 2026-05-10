/**
 * Authentication API Tests
 * Tests for /api/v1/auth endpoints
 */

const request = require('supertest');
const express = require('express');
const authRouter = require('../routes/v1/auth');
const { createTestUser, generateTestToken } = require('./setup');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);

describe('Authentication API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        nip: `NIP${Date.now()}`,
        nama: 'John Doe Test',
        email: `john${Date.now()}@test.com`,
        password: 'password123',
        role: 'dosen',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body.user).toHaveProperty('role', newUser.role);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with missing required fields', async () => {
      const invalidUser = {
        email: `invalid${Date.now()}@test.com`,
        // Missing nip, nama, password
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with duplicate email', async () => {
      const user = {
        nip: `NIP${Date.now()}`,
        nama: 'Duplicate Test',
        email: `duplicate${Date.now()}@test.com`,
        password: 'password123',
      };

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(user)
        .expect(201);

      // Try to register with same email
      const duplicateUser = {
        ...user,
        nip: `NIP${Date.now() + 1}`, // Different NIP
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/user.*exists/i);
    });

    it('should accept any non-empty password', async () => {
      // Note: API doesn't validate password length currently
      const user = {
        nip: `NIP${Date.now()}`,
        nama: 'Any Password Test',
        email: `anypass${Date.now()}@test.com`,
        password: '123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(user)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;
    const testPassword = 'password123';

    beforeAll(async () => {
      const bcrypt = require('bcrypt');
      testUser = await createTestUser({
        email: `login${Date.now()}@test.com`,
        password_hash: await bcrypt.hash(testPassword, 10),
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let testUser;
    let testToken;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: `me${Date.now()}@test.com`,
      });
      testToken = generateTestToken(testUser.id, testUser.role);
    });

    it('should return current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/authorization|token/i);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
