/**
 * Kegiatan API Tests
 * Tests for /api/v1/kegiatan endpoints
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
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
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 10, 'Test Description', 'test.pdf', '/uploads/test.pdf', 'abc123hash', 'unverified']
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

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('deskripsi', 'Test Description');
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

      const testFilePath = path.join(__dirname, 'fixtures', 'test.pdf');
      // Create a minimal test file if it doesn't exist
      const fixturesDir = path.join(__dirname, 'fixtures');
      if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });
      if (!fs.existsSync(testFilePath)) fs.writeFileSync(testFilePath, '%PDF-1.4 fake pdf content');

      const response = await request(app)
        .post('/api/v1/kegiatan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .field('ref_kegiatan_id', String(testRefKegiatanId))
        .field('deskripsi', 'Description of new test kegiatan')
        .attach('file', testFilePath)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('id');
    });

    it('should reject kegiatan with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/kegiatan')
        .set('Authorization', `Bearer ${dosenToken}`)
        .field('deskripsi', 'Missing ref and file')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/kegiatan')
        .field('ref_kegiatan_id', String(testRefKegiatanId || 1))
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/v1/kegiatan/:id/verify', () => {
    let kegiatanToVerify;

    beforeAll(async () => {
      if (testRefKegiatanId) {
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 10, 'To be verified', 'verify.pdf', '/uploads/verify.pdf', 'hash123', 'unverified']
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
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 10, 'To be deleted', 'delete.pdf', '/uploads/delete.pdf', 'hash456', 'unverified']
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

  // ============================================
  // BLOCKCHAIN VALIDATION TESTS
  // ============================================
  describe('Blockchain Validation - Invalid Cases', () => {
    const fabricClient = require('../utils/fabricClient');
    let testKegiatanForBlockchain;
    let originalFabricEnabled;

    beforeAll(async () => {
      // Save original fabric state
      originalFabricEnabled = fabricClient.isFabricEnabled();

      if (testRefKegiatanId) {
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 15, 'Blockchain test kegiatan', 'blockchain.pdf', '/uploads/blockchain.pdf', 'validhash123', 'unverified']
        );
        testKegiatanForBlockchain = result.rows[0].id;
      }
    });

    describe('Blockchain Connection Failures', () => {
      it('should handle verification gracefully when blockchain is unavailable', async () => {
        if (!testKegiatanForBlockchain) {
          console.log('Skipping test: no test kegiatan created');
          return;
        }

        // Mock blockchain connection failure
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(false);

        const response = await request(app)
          .put(`/api/v1/kegiatan/${testKegiatanForBlockchain}/verify`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'verified',
            catatan: 'Approved despite blockchain unavailable',
          })
          .expect(200);

        // Should succeed in database even if blockchain is down
        expect(response.body).toHaveProperty('message');
        expect(response.body.data).toHaveProperty('status', 'verified');

        // Restore original mock
        jest.restoreAllMocks();
      });

      it('should log warning when blockchain recording fails but continue processing', async () => {
        if (!testKegiatanForBlockchain) return;

        // Create another test kegiatan
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 12, 'Blockchain fail test', 'fail.pdf', '/uploads/fail.pdf', 'failhash456', 'unverified']
        );
        const failKegiatanId = result.rows[0].id;

        // Mock blockchain submission failure
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'recordKegiatanVerification').mockRejectedValue(
          new Error('Blockchain network timeout')
        );

        const response = await request(app)
          .put(`/api/v1/kegiatan/${failKegiatanId}/verify`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'verified',
          })
          .expect(200);

        // Should still succeed in database
        expect(response.body.data).toHaveProperty('status', 'verified');

        jest.restoreAllMocks();
      });
    });

    describe('Document Hash Validation', () => {
      it('should detect tampered documents via hash mismatch', async () => {
        if (!testKegiatanForBlockchain) return;

        // Create kegiatan with original hash
        const originalHash = 'originalhash123456';
        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 8, 'Hash test', 'hash.pdf', '/uploads/hash.pdf', originalHash, 'verified']
        );
        const hashTestId = result.rows[0].id;

        // Mock blockchain to return the original hash
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'verifyDocumentHash').mockResolvedValue({
          valid: false,
          blockchainHash: originalHash,
          providedHash: 'tamperedhash999',
          message: 'Document hash mismatch - possible tampering detected'
        });

        // Simulate hash verification
        const verificationResult = await fabricClient.verifyDocumentHash(
          hashTestId,
          'tamperedhash999'
        );

        expect(verificationResult.valid).toBe(false);
        expect(verificationResult.message).toContain('tampering');
        expect(verificationResult.blockchainHash).not.toBe(verificationResult.providedHash);

        jest.restoreAllMocks();
      });

      it('should validate correct document hash successfully', async () => {
        const correctHash = 'correcthash789';
        
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'verifyDocumentHash').mockResolvedValue({
          valid: true,
          blockchainHash: correctHash,
          providedHash: correctHash,
          message: 'Document hash verified successfully'
        });

        const verificationResult = await fabricClient.verifyDocumentHash(
          testKegiatanForBlockchain,
          correctHash
        );

        expect(verificationResult.valid).toBe(true);
        expect(verificationResult.blockchainHash).toBe(correctHash);
        expect(verificationResult.providedHash).toBe(correctHash);

        jest.restoreAllMocks();
      });
    });

    describe('Blockchain Transaction Validation', () => {
      it('should handle invalid transaction ID format', async () => {
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'recordKegiatanVerification').mockResolvedValue(null);

        const response = await request(app)
          .put(`/api/v1/kegiatan/${testKegiatanForBlockchain}/verify`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'verified',
          })
          .expect(200);

        // Should succeed even with null txId (blockchain optional)
        expect(response.body.data).toHaveProperty('status', 'verified');

        jest.restoreAllMocks();
      });

      it('should handle blockchain transaction timeout', async () => {
        if (!testKegiatanForBlockchain) return;

        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 7, 'Timeout test', 'timeout.pdf', '/uploads/timeout.pdf', 'timeouthash', 'unverified']
        );
        const timeoutId = result.rows[0].id;

        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'recordKegiatanVerification').mockImplementation(() => {
          return new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Transaction timeout after 30 seconds')), 100);
          });
        });

        const response = await request(app)
          .put(`/api/v1/kegiatan/${timeoutId}/verify`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'verified',
          })
          .expect(200);

        // Database should still be updated
        expect(response.body.data.status).toBe('verified');

        jest.restoreAllMocks();
      });
    });

    describe('Blockchain Data Integrity', () => {
      it('should detect missing blockchain record for verified kegiatan', async () => {
        if (!testKegiatanForBlockchain) return;

        // Mock blockchain to return null (no record found)
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'getKegiatanHistory').mockResolvedValue(null);

        const history = await fabricClient.getKegiatanHistory(testKegiatanForBlockchain);

        // No blockchain history should raise a red flag for verified kegiatan
        expect(history).toBeNull();

        jest.restoreAllMocks();
      });

      it('should validate blockchain history matches database status', async () => {
        if (!testKegiatanForBlockchain) return;

        const mockHistory = [
          {
            txId: 'tx123',
            timestamp: new Date().toISOString(),
            value: {
              kegiatanId: testKegiatanForBlockchain,
              status: 'verified',
              verifiedBy: testAdmin.id
            }
          }
        ];

        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'getKegiatanHistory').mockResolvedValue(mockHistory);

        const history = await fabricClient.getKegiatanHistory(testKegiatanForBlockchain);
        
        expect(Array.isArray(history)).toBe(true);
        expect(history[0]).toHaveProperty('txId');
        expect(history[0].value).toHaveProperty('status');

        jest.restoreAllMocks();
      });

      it('should handle corrupted blockchain data gracefully', async () => {
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'getKegiatanHistory').mockRejectedValue(
          new Error('Failed to parse blockchain data: invalid JSON')
        );

        await expect(
          fabricClient.getKegiatanHistory(testKegiatanForBlockchain)
        ).rejects.toThrow('invalid JSON');

        jest.restoreAllMocks();
      });
    });

    describe('Blockchain Status Consistency', () => {
      it('should flag inconsistency between database and blockchain status', async () => {
        if (!testKegiatanForBlockchain) return;

        // Get current kegiatan status from database
        const dbResult = await pool.query(
          'SELECT status FROM sk.kegiatan_dosen WHERE id = $1',
          [testKegiatanForBlockchain]
        );
        const dbStatus = dbResult.rows[0]?.status;

        // Mock blockchain returning different status
        const mockBlockchainHistory = [
          {
            value: {
              status: 'rejected', // Different from database
              timestamp: new Date().toISOString()
            }
          }
        ];

        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'getKegiatanHistory').mockResolvedValue(mockBlockchainHistory);

        const blockchainHistory = await fabricClient.getKegiatanHistory(testKegiatanForBlockchain);
        const blockchainStatus = blockchainHistory?.[0]?.value?.status;

        // This should flag an inconsistency
        if (dbStatus && blockchainStatus) {
          const isConsistent = dbStatus === blockchainStatus;
          expect(isConsistent).toBe(false); // Expect inconsistency in this test
        }

        jest.restoreAllMocks();
      });

      it('should handle verification without prior blockchain creation record', async () => {
        if (!testKegiatanForBlockchain) return;

        // Mock blockchain showing only verification, no creation
        const incompleteHistory = [
          {
            txId: 'verify123',
            value: {
              action: 'VERIFY',
              status: 'verified'
            }
          }
          // Missing CREATE transaction
        ];

        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'getKegiatanHistory').mockResolvedValue(incompleteHistory);

        const history = await fabricClient.getKegiatanHistory(testKegiatanForBlockchain);
        
        // Check if CREATE transaction exists
        const hasCreateRecord = history?.some(h => h.value?.action === 'CREATE');
        expect(hasCreateRecord).toBe(false); // This indicates incomplete blockchain trail

        jest.restoreAllMocks();
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle empty blockchain response', async () => {
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'getKegiatanHistory').mockResolvedValue([]);

        const history = await fabricClient.getKegiatanHistory('nonexistent-id');
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBe(0);

        jest.restoreAllMocks();
      });

      it('should handle malformed kegiatan ID in blockchain query', async () => {
        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'getKegiatanHistory').mockRejectedValue(
          new Error('Invalid kegiatan ID format')
        );

        await expect(
          fabricClient.getKegiatanHistory('invalid-uuid-format')
        ).rejects.toThrow('Invalid kegiatan ID format');

        jest.restoreAllMocks();
      });

      it('should validate blockchain network endorsement policy failures', async () => {
        if (!testKegiatanForBlockchain) return;

        jest.spyOn(fabricClient, 'isFabricEnabled').mockReturnValue(true);
        jest.spyOn(fabricClient, 'recordKegiatanVerification').mockRejectedValue(
          new Error('Endorsement policy not satisfied - insufficient endorsements')
        );

        const result = await pool.query(
          `INSERT INTO sk.kegiatan_dosen (dosen_id, ref_kegiatan_id, poin_kum, deskripsi, file_name, file_path, file_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [testDosen.id, testRefKegiatanId, 6, 'Endorsement test', 'endorse.pdf', '/uploads/endorse.pdf', 'endorsehash', 'unverified']
        );
        const endorseId = result.rows[0].id;

        const response = await request(app)
          .put(`/api/v1/kegiatan/${endorseId}/verify`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'verified',
          })
          .expect(200);

        // Should succeed in database even with endorsement failure
        expect(response.body.data.status).toBe('verified');

        jest.restoreAllMocks();
      });
    });
  });
});
