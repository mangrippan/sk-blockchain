/**
 * Usulan Kenaikan Pangkat API Tests
 * Tests for /api/v1/usulan endpoints
 */

const request = require('supertest');
const express = require('express');
const usulanRouter = require('../routes/v1/usulan');
const { pool } = require('../config/database');
const { createTestUser, generateTestToken } = require('./setup');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/usulan', usulanRouter);

describe('Usulan Kenaikan Pangkat API', () => {
  let testDosen;
  let testAdmin;
  let dosenToken;
  let adminToken;
  let createdUsulanId;

  beforeAll(async () => {
    // Create test users
    testDosen = await createTestUser({
      nip_nidn: `DOSEN${Date.now()}`,
      email: `dosen_usulan_${Date.now()}@test.com`,
      role: 'dosen',
    });
    dosenToken = generateTestToken(testDosen.id, 'dosen');

    testAdmin = await createTestUser({
      nip_nidn: `ADMIN${Date.now()}`,
      email: `admin_usulan_${Date.now()}@test.com`,
      role: 'admin_sdm',
    });
    adminToken = generateTestToken(testAdmin.id, 'admin_sdm');

    // Insert some verified kegiatan for this dosen to have KUM points
    await pool.query(
      `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, deskripsi, poin_kum, status, file_name, file_path, file_hash)
       SELECT $1, rk.id, 'Test kegiatan for KUM', 50, 'verified', 'test.pdf', '/uploads/test.pdf', 'abc123hash'
       FROM sk.ref_kegiatan_kum rk WHERE rk.is_active = true LIMIT 3`,
      [testDosen.id]
    );
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdUsulanId) {
      await pool.query('DELETE FROM sk.usulan_kenaikan_pangkat WHERE id = $1', [createdUsulanId]);
    }
    await pool.query('DELETE FROM sk.kegiatan_dosen WHERE dosen_id = $1', [testDosen.id]);
    await pool.query('DELETE FROM sk.audit_logs WHERE user_id IN ($1, $2)', [testDosen.id, testAdmin.id]);
    await pool.query('DELETE FROM sk.users WHERE id IN ($1, $2)', [testDosen.id, testAdmin.id]);
  });

  // ==========================================
  // POST /api/v1/usulan - Create Usulan
  // ==========================================
  describe('POST /api/v1/usulan', () => {
    it('should create new usulan for dosen', async () => {
      const response = await request(app)
        .post('/api/v1/usulan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          jabatan_asal: 'Asisten Ahli',
          jabatan_tujuan: 'Lektor',
          periode_penilaian_mulai: '2024-01-01',
          periode_penilaian_selesai: '2025-12-31',
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('pending');

      createdUsulanId = response.body.data.id;
    });

    it('should reject if jabatan_tujuan is missing', async () => {
      const response = await request(app)
        .post('/api/v1/usulan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({
          jabatan_asal: 'Asisten Ahli',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject if not authenticated', async () => {
      await request(app)
        .post('/api/v1/usulan')
        .send({ jabatan_tujuan: 'Lektor' })
        .expect(401);
    });

    it('should reject if user is not dosen', async () => {
      await request(app)
        .post('/api/v1/usulan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ jabatan_tujuan: 'Lektor' })
        .expect(403);
    });
  });

  // ==========================================
  // GET /api/v1/usulan - List Usulan
  // ==========================================
  describe('GET /api/v1/usulan', () => {
    it('should list usulan for authenticated dosen', async () => {
      const response = await request(app)
        .get('/api/v1/usulan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/usulan?status=pending')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data[0].status).toBe('pending');
      }
    });

    it('should allow admin to see all usulan', async () => {
      const response = await request(app)
        .get('/api/v1/usulan')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should reject unauthenticated request', async () => {
      await request(app)
        .get('/api/v1/usulan')
        .expect(401);
    });
  });

  // ==========================================
  // GET /api/v1/usulan/:id - Detail Usulan
  // ==========================================
  describe('GET /api/v1/usulan/:id', () => {
    it('should get usulan detail for owner', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(createdUsulanId);
    });

    it('should allow admin to see any usulan', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(createdUsulanId);
    });

    it('should return 404 for non-existent usulan', async () => {
      await request(app)
        .get('/api/v1/usulan/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(404);
    });
  });

  // ==========================================
  // PUT /api/v1/usulan/:id/proses - Process Usulan
  // ==========================================
  describe('PUT /api/v1/usulan/:id/proses', () => {
    it('should process usulan (pending → diproses)', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .put(`/api/v1/usulan/${createdUsulanId}/proses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data.status).toBe('diproses');
    });

    it('should reject if dosen tries to process', async () => {
      if (!createdUsulanId) return;

      await request(app)
        .put(`/api/v1/usulan/${createdUsulanId}/proses`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(403);
    });

    it('should reject processing already-processed usulan', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .put(`/api/v1/usulan/${createdUsulanId}/proses`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should fail since already in 'diproses'
      expect(response.status).toBe(400);
    });
  });

  // ==========================================
  // PUT /api/v1/usulan/:id/terbitkan-sk - Issue SK
  // ==========================================
  describe('PUT /api/v1/usulan/:id/terbitkan-sk', () => {
    it('should issue SK for processed usulan', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .put(`/api/v1/usulan/${createdUsulanId}/terbitkan-sk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('sk_number', 'SK/2026/001')
        .field('sk_date', '2026-05-14')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data.status).toBe('sk_issued');
      expect(response.body.data.sk_number).toBe('SK/2026/001');
    });

    it('should reject if sk_number is missing', async () => {
      if (!createdUsulanId) return;

      await request(app)
        .put(`/api/v1/usulan/${createdUsulanId}/terbitkan-sk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('sk_date', '2026-05-14')
        .expect(400);
    });

    it('should reject if dosen tries to issue SK', async () => {
      if (!createdUsulanId) return;

      await request(app)
        .put(`/api/v1/usulan/${createdUsulanId}/terbitkan-sk`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .field('sk_number', 'SK/2026/002')
        .field('sk_date', '2026-05-14')
        .expect(403);
    });
  });

  // ==========================================
  // PUT /api/v1/usulan/:id/tolak - Reject Usulan
  // ==========================================
  describe('PUT /api/v1/usulan/:id/tolak', () => {
    let rejectableUsulanId;

    beforeAll(async () => {
      // Create a fresh usulan to reject
      const result = await pool.query(
        `INSERT INTO sk.usulan_kenaikan_pangkat (dosen_id, total_poin_diajukan, jabatan_tujuan, status)
         VALUES ($1, 150, 'Lektor', 'pending')
         RETURNING id`,
        [testDosen.id]
      );
      rejectableUsulanId = result.rows[0].id;
    });

    afterAll(async () => {
      if (rejectableUsulanId) {
        await pool.query('DELETE FROM sk.usulan_kenaikan_pangkat WHERE id = $1', [rejectableUsulanId]);
      }
    });

    it('should reject usulan with catatan', async () => {
      const response = await request(app)
        .put(`/api/v1/usulan/${rejectableUsulanId}/tolak`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ catatan_penolakan: 'Dokumen belum lengkap' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data.status).toBe('rejected');
    });

    it('should require catatan_penolakan', async () => {
      await request(app)
        .put(`/api/v1/usulan/${rejectableUsulanId}/tolak`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  // ==========================================
  // GET /api/v1/usulan/:id/audit - Audit Trail
  // ==========================================
  describe('GET /api/v1/usulan/:id/audit', () => {
    it('should get audit trail for usulan', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}/audit`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('blockchain');
      expect(response.body.data).toHaveProperty('database');
      expect(Array.isArray(response.body.data.database)).toBe(true);
    });

    it('should return 404 for non-existent usulan', async () => {
      await request(app)
        .get('/api/v1/usulan/00000000-0000-0000-0000-000000000000/audit')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(404);
    });
  });
});
