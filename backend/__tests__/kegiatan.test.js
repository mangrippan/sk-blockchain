/**
 * Kegiatan API Tests
 * Tests for /api/v1/kegiatan endpoints
 */

const request = require('supertest');
const express = require('express');
const kegiatanRouter = require('../routes/v1/kegiatan');
const { pool } = require('../config/database');
const { createTestUser, generateTestToken } = require('./setup');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/kegiatan', kegiatanRouter);

describe('Kegiatan API', () => {
  let testDosen;
  let testAdmin;
  let dosenToken;
  let adminToken;
  let testRefKegiatanId;

  beforeAll(async () => {
    // Create test users
    testDosen = await createTestUser({
      email: `dosen${Date.now()}@test.com`,
      role: 'dosen',
    });
    dosenToken = generateTestToken(testDosen.id, 'dosen');

    testAdmin = await createTestUser({
      email: `admin${Date.now()}@test.com`,
      role: 'admin_sdm',
    });
    adminToken = generateTestToken(testAdmin.id, 'admin_sdm');

    // Get a valid ref_kegiatan_id for testing
    const refResult = await pool.query(
      'SELECT id FROM sk.ref_kegiatan_kum WHERE is_active = true LIMIT 1'
    );
    if (refResult.rows.length > 0) {
      testRefKegiatanId = refResult.rows[0].id;
    }
  });

  describe('GET /api/v1/kegiatan', () => {
    it('should get kegiatan list for authenticated dosen', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter kegiatan by status', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan?status=unverified')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      if (response.body.data.length > 0) {
        expect(response.body.data[0].status).toBe('unverified');
      }
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan?limit=5&offset=0')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should allow admin to see all kegiatan', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/kegiatan/:id', () => {
    let testKegiatanId;

    beforeAll(async () => {
      if (testRefKegiatanId) {
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, judul, deskripsi, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 'Test Kegiatan', 'Test Description', 'unverified']
        );
        testKegiatanId = result.rows[0].id;
      }
    });

    it('should get kegiatan details by id', async () => {
      if (!testKegiatanId) {
        console.log('Skipping test: no test kegiatan created');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/kegiatan/${testKegiatanId}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('judul', 'Test Kegiatan');
    });

    it('should return 404 for non-existent kegiatan', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject unauthenticated request', async () => {
      if (!testKegiatanId) return;

      const response = await request(app)
        .get(`/api/v1/kegiatan/${testKegiatanId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/kegiatan', () => {
    it('should create new kegiatan', async () => {
      if (!testRefKegiatanId) {
        console.log('Skipping test: no ref_kegiatan available');
        return;
      }

      const newKegiatan = {
        ref_kegiatan_id: testRefKegiatanId,
        judul: 'New Test Kegiatan',
        deskripsi: 'Description of new test kegiatan',
        tanggal_mulai: '2024-01-01',
        tanggal_selesai: '2024-06-30',
      };

      const response = await request(app)
        .post('/api/v1/kegiatan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send(newKegiatan)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('judul', newKegiatan.judul);
    });

    it('should reject kegiatan with missing required fields', async () => {
      const invalidKegiatan = {
        judul: 'Missing ref_kegiatan_id',
      };

      const response = await request(app)
        .post('/api/v1/kegiatan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send(invalidKegiatan)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/kegiatan')
        .send({
          ref_kegiatan_id: testRefKegiatanId,
          judul: 'Test',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/v1/kegiatan/:id/verify', () => {
    let kegiatanToVerify;

    beforeAll(async () => {
      if (testRefKegiatanId) {
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, judul, deskripsi, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 'To Verify', 'To be verified', 'unverified']
        );
        kegiatanToVerify = result.rows[0].id;
      }
    });

    it('should allow admin to verify kegiatan', async () => {
      if (!kegiatanToVerify) {
        console.log('Skipping test: no kegiatan to verify');
        return;
      }

      const response = await request(app)
        .put(`/api/v1/kegiatan/${kegiatanToVerify}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'verified',
          catatan: 'Approved by admin',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('status', 'verified');
    });

    it('should reject verification by non-admin user', async () => {
      if (!kegiatanToVerify) return;

      const response = await request(app)
        .put(`/api/v1/kegiatan/${kegiatanToVerify}/verify`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          status: 'verified',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject unauthenticated request', async () => {
      if (!kegiatanToVerify) return;

      const response = await request(app)
        .put(`/api/v1/kegiatan/${kegiatanToVerify}/verify`)
        .send({
          status: 'verified',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/v1/kegiatan/:id', () => {
    let kegiatanToDelete;

    beforeEach(async () => {
      if (testRefKegiatanId) {
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, judul, deskripsi, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 'To Delete', 'To be deleted', 'unverified']
        );
        kegiatanToDelete = result.rows[0].id;
      }
    });

    it('should allow dosen to delete their own kegiatan', async () => {
      if (!kegiatanToDelete) {
        console.log('Skipping test: no kegiatan to delete');
        return;
      }

      const response = await request(app)
        .delete(`/api/v1/kegiatan/${kegiatanToDelete}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent kegiatan', async () => {
      const response = await request(app)
        .delete('/api/v1/kegiatan/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject unauthenticated request', async () => {
      if (!kegiatanToDelete) return;

      const response = await request(app)
        .delete(`/api/v1/kegiatan/${kegiatanToDelete}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/kegiatan/stats/dashboard', () => {
    it('should return dashboard stats for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan/stats/dashboard')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('total');
      expect(response.body.stats).toHaveProperty('pending');
      expect(response.body.stats).toHaveProperty('verified');
      expect(response.body.stats).toHaveProperty('rejected');
      expect(response.body.stats).toHaveProperty('total_poin');
      expect(response.body).toHaveProperty('recent');
      expect(Array.isArray(response.body.recent)).toBe(true);
    });

    it('should return all stats for admin', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan/stats/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(typeof response.body.stats.total).toBe('number');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan/stats/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/kegiatan/:id/audit', () => {
    let testKegiatanForAudit;

    beforeAll(async () => {
      if (testRefKegiatanId) {
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, 5.0, 'Audit test', 'test.pdf', '/tmp/test.pdf', 'abc123hash', 'unverified')
           RETURNING id`,
          [testDosen.id, testRefKegiatanId]
        );
        testKegiatanForAudit = result.rows[0].id;

        // Insert audit log entry
        await pool.query(
          `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, description)
           VALUES ($1, 'CREATE', 'kegiatan_dosen', $2, 'Test audit entry')`,
          [testDosen.id, testKegiatanForAudit]
        );
      }
    });

    it('should return audit trail for kegiatan', async () => {
      if (!testKegiatanForAudit) return;

      const response = await request(app)
        .get(`/api/v1/kegiatan/${testKegiatanForAudit}/audit`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');
    });

    it('should return 404 for non-existent kegiatan', async () => {
      const response = await request(app)
        .get('/api/v1/kegiatan/99999999-9999-9999-9999-999999999999/audit')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject unauthenticated request', async () => {
      if (!testKegiatanForAudit) return;

      const response = await request(app)
        .get(`/api/v1/kegiatan/${testKegiatanForAudit}/audit`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
