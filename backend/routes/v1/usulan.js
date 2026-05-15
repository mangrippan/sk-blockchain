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
const { generateFileHash } = require('../../utils/hashUtils');
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
 * GET /api/v1/usulan
 * List usulan - filtered by role
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

/**
 * GET /api/v1/usulan/:id
 * Detail usulan
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
 * POST /api/v1/usulan
 * Ajukan usulan kenaikan pangkat
 */
router.post('/', checkRole(['dosen', 'dosen_tetap']), async (req, res) => {
  try {
    const {
      jabatan_asal,
      jabatan_tujuan,
      periode_penilaian_mulai,
      periode_penilaian_selesai,
      referensi_id,
    } = req.body;

    if (!jabatan_tujuan) {
      return res.status(400).json({ error: 'jabatan_tujuan is required' });
    }

    // Calculate total verified KUM for this dosen
    const kumResult = await pool.query(
      `SELECT COALESCE(SUM(poin_kum), 0) as total_poin
       FROM sk.kegiatan_dosen
       WHERE dosen_id = $1 AND status = 'verified' AND deleted_at IS NULL`,
      [req.user.id]
    );
    const totalPoin = parseFloat(kumResult.rows[0].total_poin);

    // Create usulan
    const usulan = await Usulan.create({
      dosen_id: req.user.id,
      total_poin_diajukan: totalPoin,
      jabatan_asal,
      jabatan_tujuan,
      periode_penilaian_mulai,
      periode_penilaian_selesai,
    });

    // If referensi_id provided (resubmission), link it
    if (referensi_id) {
      await pool.query(
        `UPDATE sk.usulan_kenaikan_pangkat SET referensi_id = $1 WHERE id = $2`,
        [referensi_id, usulan.id]
      );
    }

    // Submit (draft → pending)
    const submitted = await Usulan.submit(usulan.id);

    // Record to blockchain
    const hashNIP = crypto.createHash('sha256').update(req.user.nip_nidn || '').digest('hex');
    const txResult = await fabricClient.recordUsulanCreation(
      usulan.id,
      hashNIP,
      totalPoin,
      jabatan_tujuan,
      referensi_id || null
    );

    if (txResult) {
      await Usulan.updateBlockchainTx(usulan.id, txResult);
    }

    // Audit log
    await pool.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.user.id, 'CREATE', 'usulan_kenaikan_pangkat', usulan.id, JSON.stringify({
        jabatan_tujuan, total_poin: totalPoin, blockchain_tx: txResult ? 'success' : 'skipped',
      })]
    );

    res.status(201).json({
      message: 'Usulan berhasil diajukan',
      data: submitted || usulan,
    });
  } catch (error) {
    console.error('Error creating usulan:', error);
    res.status(500).json({ error: 'Failed to create usulan', message: error.message });
  }
});

/**
 * PUT /api/v1/usulan/:id/proses
 * Admin: Process usulan (pending → diproses)
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
 * PUT /api/v1/usulan/:id/tolak
 * Admin: Reject usulan
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
 * PUT /api/v1/usulan/:id/terbitkan-sk
 * Admin: Issue SK (diproses → sk_issued) with SK document upload
 */
router.put('/:id/terbitkan-sk', checkRole(['admin_sdm', 'pimpinan', 'superadmin']), upload.single('sk_document'), async (req, res) => {
  try {
    const { sk_number, sk_date } = req.body;
    if (!sk_number || !sk_date) {
      return res.status(400).json({ error: 'sk_number and sk_date are required' });
    }

    let sk_document_url = null;
    let sk_document_hash = null;

    // Handle file upload
    if (req.file) {
      sk_document_url = `/uploads/sk/${req.file.filename}`;
      sk_document_hash = await generateFileHash(req.file.path);
    }

    const result = await Usulan.issueSK(req.params.id, {
      sk_document_url,
      sk_document_hash,
      sk_number,
      sk_date,
      processed_by: req.user.id,
    });

    if (!result) {
      return res.status(400).json({ error: 'Cannot issue SK. Usulan must be in "diproses" status.' });
    }

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
    await pool.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.user.id, 'ISSUE_SK', 'usulan_kenaikan_pangkat', req.params.id, JSON.stringify({
        status: 'sk_issued', sk_number, sk_document_hash,
        blockchain_tx: txResult ? 'success' : 'skipped',
      })]
    );

    res.json({ message: 'SK berhasil diterbitkan', data: result });
  } catch (error) {
    console.error('Error issuing SK:', error);
    res.status(500).json({ error: 'Failed to issue SK', message: error.message });
  }
});

/**
 * GET /api/v1/usulan/:id/audit
 * Get audit trail from blockchain
 */
router.get('/:id/audit', async (req, res) => {
  try {
    const usulan = await Usulan.findById(req.params.id);
    if (!usulan) {
      return res.status(404).json({ error: 'Usulan not found' });
    }

    // Dosen can only see their own
    if (req.user.role === 'dosen' && usulan.dosen_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get blockchain history
    const blockchainHistory = await fabricClient.getUsulanHistory(req.params.id);

    // Get DB audit logs as fallback/complement
    const dbAudit = await pool.query(
      `SELECT * FROM sk.audit_logs
       WHERE table_name = 'usulan_kenaikan_pangkat' AND record_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json({
      data: {
        blockchain: blockchainHistory || [],
        database: dbAudit.rows,
      },
    });
  } catch (error) {
    console.error('Error getting audit trail:', error);
    res.status(500).json({ error: 'Failed to get audit trail', message: error.message });
  }
});

module.exports = router;
