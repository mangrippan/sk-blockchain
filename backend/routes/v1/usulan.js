/**
 * Usulan Kenaikan Pangkat Routes
 * /api/v1/usulan
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pool } = require('../../config/database');
const { auth, checkRole } = require('../../middleware/auth');
const { hashFile: generateFileHash } = require('../../utils/hashUtils');
const fabricClient = require('../../utils/fabricClient');
const Usulan = require('../../models/Usulan');

// Configure multer for SK document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/sk');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `sk-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
  }
});

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Usulan
 *   description: Usulan kenaikan pangkat endpoints
 */

/**
 * @swagger
 * /api/v1/usulan:
 *   get:
 *     summary: List usulan kenaikan pangkat
 *     description: Retrieve list of usulan (filtered by user role)
 *     tags: [Usulan]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, diproses, ditolak, sk_issued]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of usulan
 *       500:
 *         description: Failed to list usulan
 */
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['u.deleted_at IS NULL'];
    const values = [];
    let paramCounter = 1;

    // Dosen can only see their own usulan
    if (req.user.role === 'dosen') {
      conditions.push(`u.dosen_id = $${paramCounter}`);
      values.push(req.user.id);
      paramCounter++;
    }

    if (status) {
      conditions.push(`u.status = $${paramCounter}`);
      values.push(status);
      paramCounter++;
    }

    const whereClause = conditions.join(' AND ');

    // Count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM sk.usulan_kenaikan_pangkat u WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Data
    values.push(parseInt(limit), offset);
    const dataResult = await pool.query(
      `SELECT u.*, 
              d.nama_lengkap as nama_dosen,
              d.nip_nidn,
              d.department,
              p.nama_lengkap as processed_by_name
       FROM sk.usulan_kenaikan_pangkat u
       JOIN sk.users d ON u.dosen_id = d.id
       LEFT JOIN sk.users p ON u.processed_by = p.id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      values
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error listing usulan:', error);
    res.status(500).json({ error: 'Failed to list usulan', message: error.message });
  }
});

// ==========================================
// SPECIFIC ROUTES - MUST COME BEFORE /:id
// ==========================================

/**
 * @swagger
 * /api/v1/usulan/{id}/snapshot:
 *   get:
 *     summary: Get kegiatan snapshot for usulan
 *     description: Retrieve the immutable kegiatan snapshot stored in blockchain
 *     tags: [Usulan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     responses:
 *       200:
 *         description: Kegiatan snapshot data
 *       403:
 *         description: Access denied
 *       404:
 *         description: Usulan or snapshot not found
 *       500:
 *         description: Failed to get snapshot
 */
router.get('/:id/snapshot', async (req, res) => {
  try {
    const usulan = await Usulan.findById(req.params.id);
    if (!usulan) {
      return res.status(404).json({ error: 'Usulan not found' });
    }

    // Dosen can only see their own
    if (req.user.role === 'dosen' && usulan.dosen_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get snapshot kegiatan
    const snapshotResult = await pool.query(
      `SELECT 
        s.id as snapshot_id,
        s.kegiatan_id,
        s.poin_kum,
        s.file_hash,
        s.tx_id_fabric as kegiatan_create_tx,
        s.tx_id_verify_fabric as kegiatan_verify_tx,
        s.status_saat_snapshot,
        s.verified_at_snapshot,
        s.created_at as snapshot_created_at,
        k.file_name,
        k.deskripsi,
        k.status as current_status,
        ref.kode_kegiatan,
        ref.nama_kegiatan,
        kat.nama_kategori
       FROM sk.usulan_kegiatan_snapshot s
       JOIN sk.kegiatan_dosen k ON s.kegiatan_id = k.id
       JOIN sk.ref_kegiatan_kum ref ON s.ref_kegiatan_id = ref.id
       JOIN sk.ref_kategori_kum kat ON ref.kategori_id = kat.id
       WHERE s.usulan_id = $1
       ORDER BY s.created_at, k.created_at`,
      [req.params.id]
    );

    const snapshot = snapshotResult.rows;
    const totalPoin = snapshot.reduce((sum, k) => sum + parseFloat(k.poin_kum), 0);

    res.json({
      data: {
        usulan_id: req.params.id,
        snapshot_hash: usulan.snapshot_hash,
        total_poin: totalPoin,
        kegiatan_count: snapshot.length,
        kegiatan: snapshot,
      },
    });
  } catch (error) {
    console.error('Error getting usulan snapshot:', error);
    res.status(500).json({ error: 'Failed to get usulan snapshot', message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/usulan/{id}/validate-blockchain:
 *   get:
 *     summary: Validate blockchain integrity
 *     description: Verify SK document hash and snapshot hash against blockchain records
 *     tags: [Usulan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     responses:
 *       200:
 *         description: Validation result with integrity checks
 *       403:
 *         description: Access denied
 *       404:
 *         description: Usulan not found
 *       500:
 *         description: Validation failed
 */
router.get('/:id/validate-blockchain', async (req, res) => {
  try {
    const usulan = await Usulan.findById(req.params.id);
    if (!usulan) {
      return res.status(404).json({ error: 'Usulan not found' });
    }

    // Permission check
    if (req.user.role === 'dosen' && usulan.dosen_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only validate your own usulan' 
      });
    }

    // Initialize validation results
    const validationResults = {
      valid: true,
      checks: {
        blockchainEnabled: false,
        blockchainRecordExists: false,
        skHashMatches: false,
        snapshotHashMatches: false,
      },
      details: {
        databaseStatus: usulan.status,
        databaseSkHash: usulan.sk_document_hash,
        databaseSnapshotHash: usulan.snapshot_hash,
        blockchainSkHash: null,
        blockchainSnapshotHash: null,
        inconsistencies: [],
      },
      warnings: [],
      errors: [],
    };

    // Check if blockchain is enabled
    if (!fabricClient.isFabricEnabled()) {
      validationResults.checks.blockchainEnabled = false;
      validationResults.warnings.push('Blockchain integration is disabled');
      
      return res.json({
        valid: true, // Valid in database-only mode
        message: 'Blockchain validation skipped (blockchain disabled)',
        ...validationResults,
      });
    }

    validationResults.checks.blockchainEnabled = true;

    try {
      // 1. Check if blockchain record exists
      const blockchainUsulan = await fabricClient.getUsulan(req.params.id);
      
      if (!blockchainUsulan) {
        validationResults.valid = false;
        validationResults.checks.blockchainRecordExists = false;
        validationResults.errors.push('No blockchain record found for this usulan');
      } else {
        validationResults.checks.blockchainRecordExists = true;

        // 2. Verify SK document hash (only if SK has been issued)
        if (usulan.status === 'sk_issued' && usulan.sk_document_hash) {
          try {
            const skHashVerification = await fabricClient.verifySkHash(
              req.params.id,
              usulan.sk_document_hash
            );
            
            if (skHashVerification) {
              validationResults.checks.skHashMatches = skHashVerification.isValid;
              validationResults.details.blockchainSkHash = skHashVerification.storedHash;
              
              if (!skHashVerification.isValid) {
                validationResults.valid = false;
                validationResults.errors.push(
                  'SK document hash mismatch - possible tampering detected'
                );
                validationResults.details.inconsistencies.push({
                  type: 'SK_HASH_MISMATCH',
                  database: usulan.sk_document_hash,
                  blockchain: skHashVerification.storedHash,
                });
              }
            }
          } catch (hashError) {
            validationResults.warnings.push(
              `SK hash verification failed: ${hashError.message}`
            );
          }
        } else if (usulan.status === 'sk_issued') {
          validationResults.warnings.push('SK issued but no SK document hash in database');
        } else {
          validationResults.checks.skHashMatches = null; // Not applicable yet
          validationResults.warnings.push('SK not yet issued - skipping SK hash validation');
        }

        // 3. Verify snapshot hash (if usulan has snapshot)
        if (usulan.snapshot_hash) {
          try {
            const snapshotVerification = await fabricClient.verifyUsulanSnapshot(
              req.params.id,
              usulan.snapshot_hash
            );
            
            if (snapshotVerification) {
              validationResults.checks.snapshotHashMatches = snapshotVerification.isValid;
              validationResults.details.blockchainSnapshotHash = snapshotVerification.storedHash;
              
              if (!snapshotVerification.isValid) {
                validationResults.valid = false;
                validationResults.errors.push(
                  'Snapshot hash mismatch - kegiatan data may have been tampered'
                );
                validationResults.details.inconsistencies.push({
                  type: 'SNAPSHOT_HASH_MISMATCH',
                  database: usulan.snapshot_hash,
                  blockchain: snapshotVerification.storedHash,
                });
              }
            }
          } catch (snapshotError) {
            validationResults.warnings.push(
              `Snapshot hash verification failed: ${snapshotError.message}`
            );
          }
        } else {
          validationResults.checks.snapshotHashMatches = null;
        }

        // 4. Add blockchain history
        try {
          const blockchainHistory = await fabricClient.getUsulanHistory(req.params.id);
          if (blockchainHistory) {
            validationResults.details.blockchainHistory = blockchainHistory.map(h => ({
              txId: h.txId,
              timestamp: h.timestamp,
              status: h.value?.status,
              skHash: h.value?.skHash,
            }));
          }
        } catch (historyError) {
          validationResults.warnings.push(
            `Failed to retrieve blockchain history: ${historyError.message}`
          );
        }
      }

    } catch (blockchainError) {
      validationResults.valid = false;
      validationResults.errors.push(
        `Blockchain validation error: ${blockchainError.message}`
      );
    }

    // Determine overall validation status
    const statusCode = validationResults.valid ? 200 : 409; // 409 Conflict for inconsistencies

    res.status(statusCode).json({
      valid: validationResults.valid,
      message: validationResults.valid 
        ? 'Blockchain validation passed' 
        : 'Blockchain validation failed - inconsistencies detected',
      ...validationResults,
    });

  } catch (error) {
    console.error('Blockchain validation error:', error);
    res.status(500).json({
      error: 'Failed to validate blockchain integrity',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/usulan/{id}/audit:
 *   get:
 *     summary: Get complete audit trail
 *     description: Retrieve audit trail including kegiatan history, usulan workflow, and blockchain records
 *     tags: [Usulan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     responses:
 *       200:
 *         description: Complete audit trail with integrity status
 *       403:
 *         description: Access denied
 *       404:
 *         description: Usulan not found
 *       500:
 *         description: Failed to get audit trail
 */
router.get('/:id/audit', async (req, res) => {
  try {
    const usulan = await Usulan.findById(req.params.id);
    if (!usulan) {
      return res.status(404).json({ error: 'Usulan not found' });
    }

    // Dosen can only see their own (Auditor can see all)
    if (req.user.role === 'dosen' && usulan.dosen_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 1. Get all verified kegiatan for this dosen (used in this usulan)
    const kegiatanAudit = await pool.query(
      `SELECT 
        al.action,
        al.old_values,
        al.new_values,
        al.user_id,
        al.created_at as timestamp,
        al.description,
        al.record_id as kegiatan_id,
        'kegiatan' as source,
        u.nama_lengkap as user_name
       FROM sk.audit_logs al
       LEFT JOIN sk.users u ON al.user_id = u.id
       WHERE al.table_name = 'kegiatan_dosen'
         AND al.record_id IN (
           SELECT id::text FROM sk.kegiatan_dosen 
           WHERE dosen_id = $1 AND status = 'verified' AND deleted_at IS NULL
         )
       ORDER BY al.created_at ASC`,
      [usulan.dosen_id]
    );

    // 2. Get blockchain history for usulan
    const blockchainHistory = await fabricClient.getUsulanHistory(req.params.id);

    // 3. Get DB audit logs for usulan
    const usulanAudit = await pool.query(
      `SELECT 
        al.action,
        al.old_values,
        al.new_values,
        al.user_id,
        al.created_at as timestamp,
        al.description,
        'usulan' as source,
        u.nama_lengkap as user_name
       FROM sk.audit_logs al
       LEFT JOIN sk.users u ON al.user_id = u.id
       WHERE al.table_name = 'usulan_kenaikan_pangkat' AND al.record_id = $1
       ORDER BY al.created_at ASC`,
      [req.params.id]
    );

    // 4. Format kegiatan entries
    const kegiatanEntries = kegiatanAudit.rows.map(entry => ({
      action: entry.action,
      timestamp: entry.timestamp,
      old_values: entry.old_values,
      new_values: entry.new_values,
      user_id: entry.user_id,
      user_name: entry.user_name,
      description: entry.description,
      kegiatan_id: entry.kegiatan_id,
      source: 'kegiatan',
      category: 'Kegiatan'
    }));

    // 5. Format blockchain entries
    const blockchainEntries = (blockchainHistory || []).map(entry => ({
      action: entry.action || entry.status || 'Blockchain Event',
      timestamp: entry.timestamp,
      txId: entry.txId,
      source: 'blockchain',
      category: 'Usulan',
      ...entry
    }));

    // 6. Format usulan entries
    const usulanEntries = usulanAudit.rows.map(entry => ({
      action: entry.action,
      timestamp: entry.timestamp,
      old_values: entry.old_values,
      new_values: entry.new_values,
      user_id: entry.user_id,
      user_name: entry.user_name,
      description: entry.description,
      source: 'database',
      category: 'Usulan'
    }));

    // 7. Merge all entries and sort by timestamp
    const allEntries = [...kegiatanEntries, ...blockchainEntries, ...usulanEntries].sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateA - dateB;
    });

    // 8. Check integrity if blockchain is enabled and SK has been issued
    let integrity = null;
    if (fabricClient.isFabricEnabled() && usulan.status === 'sk_issued' && usulan.sk_document_hash) {
      try {
        const skHashVerification = await fabricClient.verifySkHash(
          req.params.id,
          usulan.sk_document_hash
        );
        
        let snapshotHashVerification = null;
        if (usulan.snapshot_hash) {
          snapshotHashVerification = await fabricClient.verifyUsulanSnapshot(
            req.params.id,
            usulan.snapshot_hash
          );
        }

        integrity = {
          skHashValid: skHashVerification ? skHashVerification.isValid : null,
          snapshotHashValid: snapshotHashVerification ? snapshotHashVerification.isValid : null,
          blockchainSkHash: skHashVerification ? skHashVerification.storedHash : null,
          databaseSkHash: usulan.sk_document_hash,
          blockchainSnapshotHash: snapshotHashVerification ? snapshotHashVerification.storedHash : null,
          databaseSnapshotHash: usulan.snapshot_hash,
          message: (skHashVerification && !skHashVerification.isValid) || (snapshotHashVerification && !snapshotHashVerification.isValid)
            ? 'WARNING: Hash mismatch detected - possible data tampering!'
            : 'All hashes verified successfully',
        };
      } catch (integrityError) {
        console.warn('Integrity check failed:', integrityError.message);
        integrity = {
          error: `Integrity check failed: ${integrityError.message}`,
        };
      }
    }

    res.json({
      data: allEntries,
      summary: {
        total: allEntries.length,
        kegiatan: kegiatanEntries.length,
        usulan: usulanEntries.length,
        blockchain: blockchainEntries.length,
      },
      integrity,
    });
  } catch (error) {
    console.error('Error getting audit trail:', error);
    res.status(500).json({ error: 'Failed to get audit trail', message: error.message });
  }
});

// ==========================================
// GENERIC ROUTES - MUST COME AFTER SPECIFIC ROUTES ABOVE
// ==========================================

/**
 * @swagger
 * /api/v1/usulan/{id}:
 *   get:
 *     summary: Get usulan detail
 *     description: Retrieve detailed information about a specific usulan
 *     tags: [Usulan]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     responses:
 *       200:
 *         description: Usulan detail
 *       404:
 *         description: Usulan not found
 *       500:
 *         description: Failed to get usulan
 */
router.get('/:id', async (req, res) => {
  try {
    const usulan = await Usulan.findById(req.params.id);
    if (!usulan) {
      return res.status(404).json({ error: 'Usulan not found' });
    }

    // Dosen can only see their own
    if (req.user.role === 'dosen' && usulan.dosen_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: usulan });
  } catch (error) {
    console.error('Error getting usulan:', error);
    res.status(500).json({ error: 'Failed to get usulan', message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/usulan:
 *   post:
 *     summary: Submit usulan kenaikan pangkat
 *     description: Create new usulan and record snapshot hash to blockchain
 *     tags: [Usulan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jabatan_tujuan_id
 *               - kegiatan_ids
 *             properties:
 *               jabatan_tujuan_id:
 *                 type: integer
 *               kegiatan_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Usulan created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Failed to create usulan
 */
router.post('/', checkRole(['dosen', 'dosen_tetap']), async (req, res) => {
  console.log('🔍 POST /usulan handler started for user:', req.user?.id);
  const client = await pool.connect();
  console.log('✅ Database client acquired');
  try {
    await client.query('BEGIN');
    console.log('✅ Transaction BEGIN');
    
    const {
      jabatan_tujuan_id,
      periode_penilaian_mulai,
      periode_penilaian_selesai,
      referensi_id,
    } = req.body;

    if (!jabatan_tujuan_id) {
      return res.status(400).json({ error: 'jabatan_tujuan_id is required' });
    }

    // Get user's current jabatan
    const userResult = await client.query(
      `SELECT u.jabatan_id, j.nama as jabatan_nama, j.tingkat
       FROM sk.users u
       LEFT JOIN sk.ref_jabatan_akademik j ON u.jabatan_id = j.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    let currentJabatan = userResult.rows[0];
    
    // Default to jabatan_id = 1 (Tenaga Pengajar) if not assigned
    // This default is only used temporarily for validation and usulan creation
    // It does NOT update the database
    if (!currentJabatan.jabatan_id) {
      const defaultJabatanResult = await client.query(
        `SELECT id as jabatan_id, nama as jabatan_nama, tingkat
         FROM sk.ref_jabatan_akademik WHERE id = 1`
      );
      currentJabatan = defaultJabatanResult.rows[0];
    }

    // Validate jabatan using database function
    const validationResult = await client.query(
      'SELECT * FROM sk.validate_usulan_jabatan($1, $2)',
      [req.user.id, jabatan_tujuan_id]
    );

    const validation = validationResult.rows[0];
    
    if (!validation.is_valid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid jabatan target',
        message: validation.message,
        current_jabatan: validation.current_jabatan,
        target_jabatan: validation.target_jabatan,
        expected_jabatan: validation.expected_jabatan
      });
    }

    // Get target jabatan details (for min_kum)
    const jabatanResult = await client.query(
      'SELECT * FROM sk.ref_jabatan_akademik WHERE id = $1',
      [jabatan_tujuan_id]
    );
    const targetJabatan = jabatanResult.rows[0];

    // Get all verified kegiatan that haven't been used (KUM reset logic)
    const kegiatanResult = await client.query(
      `SELECT k.id, k.poin_kum, k.file_hash, k.ref_kegiatan_id,
              k.tx_id_fabric, k.verified_at
       FROM sk.kegiatan_dosen k
       WHERE k.dosen_id = $1 
         AND k.status = 'verified' 
         AND k.deleted_at IS NULL
         AND k.used_in_usulan_id IS NULL
       ORDER BY k.id`,
      [req.user.id]
    );
    
    const kegiatanList = kegiatanResult.rows;
    const totalPoin = kegiatanList.reduce((sum, k) => sum + parseFloat(k.poin_kum), 0);

    if (kegiatanList.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'No available kegiatan found',
        message: 'You must have verified kegiatan that have not been used in a previous usulan'
      });
    }

    // Check if KUM meets minimum requirement
    if (totalPoin < parseFloat(targetJabatan.min_kum)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Insufficient KUM',
        message: `You have ${totalPoin} KUM, but ${targetJabatan.nama} requires minimum ${targetJabatan.min_kum} KUM`,
        current_kum: totalPoin,
        required_kum: parseFloat(targetJabatan.min_kum)
      });
    }

    // Create usulan (using client to stay in transaction)
    const usulanResult = await client.query(
      `INSERT INTO sk.usulan_kenaikan_pangkat (
        dosen_id, total_poin_diajukan, jabatan_asal, jabatan_tujuan,
        jabatan_asal_id, jabatan_tujuan_id,
        periode_penilaian_mulai, periode_penilaian_selesai
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.user.id,
        totalPoin,
        currentJabatan.jabatan_nama,
        targetJabatan.nama,
        currentJabatan.jabatan_id,
        jabatan_tujuan_id,
        periode_penilaian_mulai,
        periode_penilaian_selesai,
      ]
    );
    const usulan = usulanResult.rows[0];

    // If referensi_id provided (resubmission), link it
    if (referensi_id) {
      await client.query(
        `UPDATE sk.usulan_kenaikan_pangkat SET referensi_id = $1 WHERE id = $2`,
        [referensi_id, usulan.id]
      );
    }

    // Create snapshot for each kegiatan
    for (const kegiatan of kegiatanList) {
      await client.query(
        `INSERT INTO sk.usulan_kegiatan_snapshot (
          usulan_id, kegiatan_id, poin_kum, file_hash, ref_kegiatan_id,
          tx_id_fabric, tx_id_verify_fabric, status_saat_snapshot, verified_at_snapshot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          usulan.id,
          kegiatan.id,
          kegiatan.poin_kum,
          kegiatan.file_hash,
          kegiatan.ref_kegiatan_id,
          kegiatan.tx_id_fabric,
          null, // tx_id_verify_fabric - not stored in kegiatan_dosen table
          'verified',
          kegiatan.verified_at,
        ]
      );
    }

    // Calculate snapshot hash (sorted by kegiatan_id for consistency)
    const snapshotData = kegiatanList.map(k => ({
      id: k.id,
      poin: k.poin_kum,
      hash: k.file_hash,
    }));
    const snapshotString = JSON.stringify(snapshotData);
    const snapshotHash = crypto.createHash('sha256').update(snapshotString).digest('hex');

    // Update usulan with snapshot hash
    await client.query(
      `UPDATE sk.usulan_kenaikan_pangkat SET snapshot_hash = $1 WHERE id = $2`,
      [snapshotHash, usulan.id]
    );

    // Submit (draft → pending) using client
    const submitResult = await client.query(
      `UPDATE sk.usulan_kenaikan_pangkat
       SET status = 'pending'
       WHERE id = $1 AND deleted_at IS NULL AND status = 'draft'
       RETURNING *`,
      [usulan.id]
    );
    const submitted = submitResult.rows[0];

    // Record to blockchain with snapshot hash (non-blocking)
    let txResult = null;
    try {
      const hashNIP = crypto.createHash('sha256').update(req.user.nip_nidn || '').digest('hex');
      txResult = await Promise.race([
        fabricClient.recordUsulanCreation(
          usulan.id,
          hashNIP,
          totalPoin,
          targetJabatan.nama,
          referensi_id || null,
          snapshotHash
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Blockchain timeout')), 5000)
        )
      ]);

      if (txResult) {
        await client.query(
          `UPDATE sk.usulan_kenaikan_pangkat SET tx_id_fabric = $1 WHERE id = $2`,
          [txResult, usulan.id]
        );
      }
    } catch (blockchainError) {
      console.warn('⚠️  Blockchain recording failed, continuing without it:', blockchainError.message);
      // Continue without blockchain - usulan still created in database
    }

    // Audit log
    await client.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.user.id, 'CREATE', 'usulan_kenaikan_pangkat', usulan.id, JSON.stringify({
        jabatan_tujuan: targetJabatan.nama,
        jabatan_tujuan_id: jabatan_tujuan_id,
        total_poin: totalPoin, 
        kegiatan_count: kegiatanList.length,
        snapshot_hash: snapshotHash,
        blockchain_tx: txResult ? 'success' : 'skipped',
      })]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Usulan berhasil diajukan',
      data: {
        ...submitted || usulan,
        snapshot_hash: snapshotHash,
        kegiatan_count: kegiatanList.length,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating usulan:', error);
    res.status(500).json({ error: 'Failed to create usulan', message: error.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/v1/usulan/{id}/proses:
 *   put:
 *     summary: Process usulan
 *     description: Change usulan status from pending to diproses (Admin only)
 *     tags: [Usulan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     responses:
 *       200:
 *         description: Usulan processed successfully
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Access denied
 *       404:
 *         description: Usulan not found
 *       500:
 *         description: Failed to process usulan
 */
router.put('/:id/proses', checkRole(['admin_sdm', 'pimpinan', 'superadmin']), async (req, res) => {
  try {
    const result = await Usulan.process(req.params.id, req.user.id);
    if (!result) {
      return res.status(400).json({ error: 'Cannot process this usulan. Check status.' });
    }

    // Record to blockchain
    const txResult = await fabricClient.recordUsulanProcess(req.params.id, req.user.id);
    if (txResult) {
      await Usulan.updateBlockchainTx(req.params.id, txResult);
    }

    // Audit log
    await pool.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.user.id, 'PROCESS', 'usulan_kenaikan_pangkat', req.params.id, JSON.stringify({
        status: 'diproses', blockchain_tx: txResult ? 'success' : 'skipped',
      })]
    );

    res.json({ message: 'Usulan sedang diproses', data: result });
  } catch (error) {
    console.error('Error processing usulan:', error);
    res.status(500).json({ error: 'Failed to process usulan', message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/usulan/{id}/tolak:
 *   put:
 *     summary: Reject usulan
 *     description: Reject usulan with reason (Admin only)
 *     tags: [Usulan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - catatan_penolakan
 *             properties:
 *               catatan_penolakan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usulan rejected successfully
 *       400:
 *         description: Invalid status or missing reason
 *       403:
 *         description: Access denied
 *       404:
 *         description: Usulan not found
 *       500:
 *         description: Failed to reject usulan
 */
router.put('/:id/tolak', checkRole(['admin_sdm', 'pimpinan', 'superadmin']), async (req, res) => {
  try {
    const { catatan_penolakan } = req.body;
    if (!catatan_penolakan) {
      return res.status(400).json({ error: 'catatan_penolakan is required' });
    }

    const result = await Usulan.reject(req.params.id, req.user.id, catatan_penolakan);
    if (!result) {
      return res.status(400).json({ error: 'Cannot reject this usulan. Check status.' });
    }

    // Record to blockchain
    const txResult = await fabricClient.recordUsulanRejection(
      req.params.id, req.user.id, catatan_penolakan
    );
    if (txResult) {
      await Usulan.updateBlockchainTx(req.params.id, txResult);
    }

    // Audit log
    await pool.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.user.id, 'REJECT', 'usulan_kenaikan_pangkat', req.params.id, JSON.stringify({
        status: 'rejected', catatan_penolakan, blockchain_tx: txResult ? 'success' : 'skipped',
      })]
    );

    res.json({ message: 'Usulan ditolak', data: result });
  } catch (error) {
    console.error('Error rejecting usulan:', error);
    res.status(500).json({ error: 'Failed to reject usulan', message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/usulan/{id}/terbitkan-sk:
 *   put:
 *     summary: Issue SK document
 *     description: Issue SK, upload document, record hash to blockchain, update user jabatan, and lock kegiatan (Admin only)
 *     tags: [Usulan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - sk_document
 *               - sk_nomor
 *             properties:
 *               sk_document:
 *                 type: string
 *                 format: binary
 *               sk_nomor:
 *                 type: string
 *               sk_tanggal:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: SK issued successfully with blockchain record
 *       400:
 *         description: Invalid status or missing document
 *       403:
 *         description: Access denied
 *       404:
 *         description: Usulan not found
 *       500:
 *         description: Failed to issue SK
 */
router.put('/:id/terbitkan-sk', checkRole(['admin_sdm', 'pimpinan', 'superadmin']), upload.single('sk_document'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { sk_number, sk_date } = req.body;
    if (!sk_number || !sk_date) {
      return res.status(400).json({ error: 'sk_number and sk_date are required' });
    }

    // Get usulan details including jabatan_tujuan_id and dosen_id
    const usulanResult = await client.query(
      `SELECT u.*, j.nama as jabatan_tujuan_nama
       FROM sk.usulan_kenaikan_pangkat u
       LEFT JOIN sk.ref_jabatan_akademik j ON u.jabatan_tujuan_id = j.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (usulanResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usulan not found' });
    }

    const usulan = usulanResult.rows[0];

    if (usulan.status !== 'diproses') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot issue SK. Usulan must be in "diproses" status.' });
    }

    let sk_document_url = null;
    let sk_document_hash = null;

    // Handle file upload
    if (req.file) {
      sk_document_url = `/uploads/sk/${req.file.filename}`;
      sk_document_hash = await generateFileHash(req.file.path);
    }

    // Issue SK
    const result = await Usulan.issueSK(req.params.id, {
      sk_document_url,
      sk_document_hash,
      sk_number,
      sk_date,
      processed_by: req.user.id,
    });

    if (!result) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Failed to issue SK' });
    }

    // Update user's jabatan to jabatan_tujuan
    if (usulan.jabatan_tujuan_id) {
      await client.query(
        `UPDATE sk.users 
         SET jabatan_id = $1, 
             jabatan_saat_ini = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [usulan.jabatan_tujuan_id, usulan.jabatan_tujuan_nama, usulan.dosen_id]
      );
    }

    // Lock all kegiatan used in this usulan (KUM reset)
    await client.query(
      `UPDATE sk.kegiatan_dosen 
       SET used_in_usulan_id = $1, updated_at = NOW()
       WHERE id IN (
         SELECT kegiatan_id 
         FROM sk.usulan_kegiatan_snapshot 
         WHERE usulan_id = $1
       )
       AND used_in_usulan_id IS NULL`,
      [req.params.id]
    );

    // Record to blockchain with SK hash
    const txResult = await fabricClient.recordUsulanSKIssued(
      req.params.id,
      sk_document_hash || 'no-document',
      req.user.id
    );
    if (txResult) {
      await Usulan.updateBlockchainTx(req.params.id, txResult);
    }

    // Audit log
    await client.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.user.id, 'ISSUE_SK', 'usulan_kenaikan_pangkat', req.params.id, JSON.stringify({
        status: 'sk_issued', 
        sk_number, 
        sk_document_hash,
        jabatan_updated: usulan.jabatan_tujuan_nama,
        kegiatan_locked: true,
        blockchain_tx: txResult ? 'success' : 'skipped',
      })]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'SK berhasil diterbitkan. Jabatan dosen telah diperbarui dan kegiatan telah dikunci.', 
      data: {
        ...result,
        jabatan_baru: usulan.jabatan_tujuan_nama,
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error issuing SK:', error);
    res.status(500).json({ error: 'Failed to issue SK', message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
