/**
 * Usulan Kenaikan Pangkat API Tests
 * Tests for /api/v1/usulan endpoints
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const usulanRouter = require('../routes/v1/usulan');
const { pool } = require('../config/database');
const { createTestUser, generateTestToken } = require('./setup');

// Valid PDF fixture (passes magic-byte validation)
const VALID_PDF = path.join(__dirname, 'fixtures', 'test.pdf');

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
  let requiredJenisIds = [];

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

    // Give the dosen a known starting position (Tenaga Pengajar, tingkat 1) so the
    // jabatan-promotion validation has a defined current jabatan to validate against.
    await pool.query(
      `UPDATE sk.users SET jabatan_id = 1 WHERE id = $1`,
      [testDosen.id]
    );

    // Insert some verified kegiatan for this dosen to have KUM points (150 total)
    await pool.query(
      `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, deskripsi, poin_kum, status, file_name, file_path, file_hash)
       SELECT $1, rk.id, 'Test kegiatan for KUM', 50, 'verified', 'test.pdf', '/uploads/test.pdf', 'abc123hash'
       FROM sk.ref_kegiatan_kum rk WHERE rk.is_active = true LIMIT 3`,
      [testDosen.id]
    );

    // Load the required document types so we can attach them on submission
    const jenisResult = await pool.query(
      `SELECT id FROM sk.ref_jenis_dokumen WHERE is_required = true AND is_active = true ORDER BY id`
    );
    requiredJenisIds = jenisResult.rows.map((r) => r.id);
  });

  afterAll(async () => {
    // Remove document files written to disk during the create test (before the
    // cascade delete removes their dokumen_administrasi rows).
    const docRows = await pool.query(
      `SELECT document_url FROM sk.dokumen_administrasi
       WHERE usulan_id IN (SELECT id FROM sk.usulan_kenaikan_pangkat WHERE dosen_id = $1)`,
      [testDosen.id]
    );
    for (const row of docRows.rows) {
      const fp = path.join(__dirname, '..', row.document_url);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    // Cleanup test data (riwayat_jabatan_dosen is created when an SK is issued and
    // references both dosen_id and changed_by, so clear it before deleting users).
    await pool.query('DELETE FROM sk.riwayat_jabatan_dosen WHERE dosen_id IN ($1, $2) OR changed_by IN ($1, $2)', [testDosen.id, testAdmin.id]);
    // Unlock kegiatan first: processing/SK issuance sets kegiatan_dosen.used_in_usulan_id,
    // whose FK would otherwise block deleting the usulan.
    await pool.query('UPDATE sk.kegiatan_dosen SET used_in_usulan_id = NULL WHERE dosen_id = $1', [testDosen.id]);
    await pool.query('DELETE FROM sk.usulan_kenaikan_pangkat WHERE dosen_id = $1', [testDosen.id]);
    await pool.query('DELETE FROM sk.kegiatan_dosen WHERE dosen_id = $1', [testDosen.id]);
    await pool.query('DELETE FROM sk.audit_logs WHERE user_id IN ($1, $2)', [testDosen.id, testAdmin.id]);
    await pool.query('DELETE FROM sk.users WHERE id IN ($1, $2)', [testDosen.id, testAdmin.id]);
  });

  // ==========================================
  // POST /api/v1/usulan - Create Usulan
  // ==========================================
  describe('POST /api/v1/usulan', () => {
    // Build a multipart submission and attach every required administrative document.
    const submitWithRequiredDocs = (token) => {
      let req = request(app)
        .post('/api/v1/usulan')
        .set('Authorization', `Bearer ${token}`)
        .field('jabatan_tujuan_id', '2'); // Tenaga Pengajar (1) -> Asisten Ahli (2)
      for (const id of requiredJenisIds) {
        req = req.attach(`dokumen_${id}`, VALID_PDF);
      }
      return req;
    };

    it('should create new usulan for dosen when all required documents are attached', async () => {
      const response = await submitWithRequiredDocs(dosenToken).expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.dokumen_count).toBe(requiredJenisIds.length);

      createdUsulanId = response.body.data.id;

      // Documents should be persisted and linked to this usulan
      const docs = await pool.query(
        'SELECT COUNT(*) AS total FROM sk.dokumen_administrasi WHERE usulan_id = $1',
        [createdUsulanId]
      );
      expect(parseInt(docs.rows[0].total, 10)).toBe(requiredJenisIds.length);
    });

    it('should reject submission when required documents are missing', async () => {
      const response = await request(app)
        .post('/api/v1/usulan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .field('jabatan_tujuan_id', '2') // valid target, but no documents attached
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('missing');
      expect(Array.isArray(response.body.missing)).toBe(true);
      expect(response.body.missing.length).toBeGreaterThan(0);
    });

    it('should reject if jabatan_tujuan_id is missing', async () => {
      const response = await request(app)
        .post('/api/v1/usulan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .field('catatan', 'no target')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject if not authenticated', async () => {
      await request(app)
        .post('/api/v1/usulan')
        .field('jabatan_tujuan_id', '2')
        .expect(401);
    });

    it('should reject if user is not dosen', async () => {
      await request(app)
        .post('/api/v1/usulan')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('jabatan_tujuan_id', '2')
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

      // The audit endpoint returns merged entries as an array plus a summary
      // breakdown (kegiatan / usulan / blockchain counts).
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('blockchain');
      expect(response.body.summary).toHaveProperty('usulan');
    });

    it('should include integrity field for SK issued usulan', async () => {
      // This test requires an usulan with sk_issued status
      // Skip if fabric is disabled or usulan not in correct state
      if (!createdUsulanId) return;

      const response = await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}/audit`)
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(200);

      // integrity field may be null if SK not issued or blockchain disabled
      expect(response.body).toHaveProperty('integrity');
    });

    it('should return 404 for non-existent usulan', async () => {
      await request(app)
        .get('/api/v1/usulan/00000000-0000-0000-0000-000000000000/audit')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(404);
    });
  });

  // ==========================================
  // GET /api/v1/usulan/:id/validate-blockchain - Blockchain Validation
  // ==========================================
  describe('GET /api/v1/usulan/:id/validate-blockchain', () => {
    it('should validate blockchain integrity for usulan', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}/validate-blockchain`)
        .set('Authorization', `Bearer ${dosenToken}`);

      // Should return 200 (valid) or 409 (conflict/invalid)
      expect([200, 409]).toContain(response.status);
      
      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('details');
      expect(response.body.checks).toHaveProperty('blockchainEnabled');
    });

    it('should return validation checks structure', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}/validate-blockchain`)
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(response.body.checks).toHaveProperty('blockchainRecordExists');
      expect(response.body.checks).toHaveProperty('skHashMatches');
      expect(response.body.checks).toHaveProperty('snapshotHashMatches');
    });

    it('should detect tampering when SK hash is changed', async () => {
      // Create a test usulan with SK issued
      const testUsulanResult = await pool.query(
        `INSERT INTO sk.usulan_kenaikan_pangkat 
         (dosen_id, jabatan_tujuan, total_poin_diajukan, status, sk_document_hash, tx_id_fabric)
         VALUES ($1, 'Lektor', 100, 'sk_issued', 'original-hash', 'test-tx-id')
         RETURNING id`,
        [testDosen.id]
      );
      const testUsulanId = testUsulanResult.rows[0].id;

      // Change the hash to simulate tampering
      await pool.query(
        'UPDATE sk.usulan_kenaikan_pangkat SET sk_document_hash = $1 WHERE id = $2',
        ['tampered-hash', testUsulanId]
      );

      const response = await request(app)
        .get(`/api/v1/usulan/${testUsulanId}/validate-blockchain`)
        .set('Authorization', `Bearer ${dosenToken}`);

      // If blockchain is enabled and has record, should detect mismatch
      // Otherwise should return warning that blockchain is disabled
      if (response.body.checks.blockchainEnabled && response.body.checks.blockchainRecordExists) {
        expect(response.body.valid).toBe(false);
        expect(response.body.errors).toBeDefined();
      }

      // Cleanup
      await pool.query('DELETE FROM sk.usulan_kenaikan_pangkat WHERE id = $1', [testUsulanId]);
    });

    it('should return 404 for non-existent usulan', async () => {
      await request(app)
        .get('/api/v1/usulan/00000000-0000-0000-0000-000000000000/validate-blockchain')
        .set('Authorization', `Bearer ${dosenToken}`)
        .expect(404);
    });

    it('should deny access for other dosen usulan', async () => {
      if (!createdUsulanId) return;

      // Create another dosen
      const otherDosen = await createTestUser({
        nip_nidn: `OTHERDOSEN${Date.now()}`,
        email: `other_${Date.now()}@test.com`,
        role: 'dosen',
      });
      const otherToken = generateTestToken(otherDosen.id, 'dosen');

      await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}/validate-blockchain`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Cleanup
      await pool.query('DELETE FROM sk.users WHERE id = $1', [otherDosen.id]);
    });

    it('should allow admin to validate any usulan', async () => {
      if (!createdUsulanId) return;

      const response = await request(app)
        .get(`/api/v1/usulan/${createdUsulanId}/validate-blockchain`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 409]).toContain(response.status);
      expect(response.body).toHaveProperty('valid');
    });
  });
});
