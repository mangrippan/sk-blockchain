/**
 * Kegiatan Routes
 * /api/v1/kegiatan
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pool } = require('../../config/database');
const { auth, checkRole } = require('../../middleware/auth');
const { hashFileBuffer: generateFileHash } = require('../../utils/hashUtils');
const fabricClient = require('../../utils/fabricClient');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `kegiatan-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Kegiatan
 *   description: Kegiatan dosen endpoints
 */

/**
 * @swagger
 * /api/v1/kegiatan:
 *   get:
 *     summary: Get kegiatan list
 *     description: Retrieve list of kegiatan for current user (or all if admin/pimpinan)
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unverified, verified, rejected, revision_requested]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of kegiatan
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch data
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const conditions = ['k.deleted_at IS NULL'];
    const values = [];
    let paramCounter = 1;
    
    // Non-admin/pimpinan hanya lihat kegiatan sendiri
    if (userRole !== 'admin_sdm' && userRole !== 'pimpinan' && userRole !== 'superadmin') {
      conditions.push(`k.dosen_id = $${paramCounter}`);
      values.push(userId);
      paramCounter++;
    }
    
    if (status) {
      conditions.push(`k.status = $${paramCounter}`);
      values.push(status);
      paramCounter++;
    }
    
    // Search filter
    if (search) {
      conditions.push(`(
        ref.nama_kegiatan ILIKE $${paramCounter} OR 
        u.nama_lengkap ILIKE $${paramCounter} OR
        kat.nama_kategori ILIKE $${paramCounter}
      )`);
      values.push(`%${search}%`);
      paramCounter++;
    }
    
    const whereClause = 'WHERE ' + conditions.join(' AND ');
    
    const query = `
      SELECT k.*, 
             u.nama_lengkap as nama_dosen,
             u.nip_nidn,
             ref.kode_kegiatan, ref.nama_kegiatan, ref.poin_maksimal,
             kat.nama_kategori,
             v.nama_lengkap as verified_by_name
      FROM sk.kegiatan_dosen k
      JOIN sk.users u ON k.dosen_id = u.id
      JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
      JOIN sk.ref_kategori_kum kat ON ref.kategori_id = kat.id
      LEFT JOIN sk.users v ON k.verified_by = v.id
      ${whereClause}
      ORDER BY k.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sk.kegiatan_dosen k
      ${whereClause.replace(/LIMIT.*/, '')}
    `;
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    
    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: result.rows.length,
      },
    });
    
  } catch (error) {
    console.error('Get kegiatan error:', error);
    res.status(500).json({
      error: 'Failed to fetch kegiatan',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/kegiatan/stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve kegiatan statistics for the current user or all (admin)
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       500:
 *         description: Failed to fetch stats
 */
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const isAdmin = ['admin_sdm', 'pimpinan', 'superadmin'].includes(userRole);

    const userFilter = isAdmin ? '' : 'AND k.dosen_id = $1';
    const params = isAdmin ? [] : [userId];

    const statusQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE k.status = 'unverified') as pending,
        COUNT(*) FILTER (WHERE k.status = 'verified') as verified,
        COUNT(*) FILTER (WHERE k.status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE k.status = 'revision_requested') as revision,
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN k.status = 'verified' THEN k.poin_kum ELSE 0 END), 0) as total_poin
      FROM sk.kegiatan_dosen k
      WHERE k.deleted_at IS NULL ${userFilter}
    `;

    const statusResult = await pool.query(statusQuery, params);
    const stats = statusResult.rows[0];

    const recentQuery = `
      SELECT k.id, k.status, k.poin_kum, k.created_at,
             ref.nama_kegiatan,
             u.nama_lengkap as nama_dosen
      FROM sk.kegiatan_dosen k
      JOIN sk.users u ON k.dosen_id = u.id
      JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
      WHERE k.deleted_at IS NULL ${userFilter}
      ORDER BY k.created_at DESC
      LIMIT 5
    `;

    const recentResult = await pool.query(recentQuery, params);

    res.json({
      stats: {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        verified: parseInt(stats.verified),
        rejected: parseInt(stats.rejected),
        revision: parseInt(stats.revision),
        total_poin: parseFloat(stats.total_poin),
      },
      recent: recentResult.rows,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/kegiatan/{id}:
 *   get:
 *     summary: Get kegiatan detail
 *     description: Retrieve single kegiatan with full details
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kegiatan UUID
 *     responses:
 *       200:
 *         description: Kegiatan detail
 *       404:
 *         description: Kegiatan not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Failed to fetch data
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const query = `
      SELECT k.*, 
             u.nama_lengkap as nama_dosen, u.department,
             ref.kode_kegiatan, ref.nama_kegiatan, ref.poin_maksimal, ref.syarat_dokumen,
             kat.nama_kategori, kat.kode as kode_kategori,
             v.nama_lengkap as verified_by_name
      FROM sk.kegiatan_dosen k
      JOIN sk.users u ON k.dosen_id = u.id
      JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
      JOIN sk.ref_kategori_kum kat ON ref.kategori_id = kat.id
      LEFT JOIN sk.users v ON k.verified_by = v.id
      WHERE k.id = $1 AND k.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Kegiatan not found',
      });
    }
    
    const kegiatan = result.rows[0];
    
    // Check permission - dosen hanya bisa lihat punya sendiri
    if (userRole === 'dosen' && kegiatan.dosen_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own kegiatan',
      });
    }
    
    res.json({
      data: kegiatan,
    });
    
  } catch (error) {
    console.error('Get kegiatan by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch kegiatan',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/kegiatan:
 *   post:
 *     summary: Create new kegiatan
 *     description: Submit a new kegiatan with document proof
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ref_kegiatan_id
 *               - poin_kum
 *               - file_name
 *               - file_hash
 *             properties:
 *               ref_kegiatan_id:
 *                 type: integer
 *               poin_kum:
 *                 type: number
 *               deskripsi:
 *                 type: string
 *               file_name:
 *                 type: string
 *               file_path:
 *                 type: string
 *               file_hash:
 *                 type: string
 *               file_size:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Kegiatan created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create kegiatan
 */
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const {
      ref_kegiatan_id,
      deskripsi,
    } = req.body;
    
    // Validation
    if (!ref_kegiatan_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['ref_kegiatan_id'],
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        error: 'File is required',
        message: 'Please upload a file as proof',
      });
    }
    
    const userId = req.user.id;
    
    // Generate file hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const file_hash = generateFileHash(fileBuffer);
    
    // Get ref_kegiatan details for poin_kum
    const refResult = await pool.query(
      'SELECT poin_maksimal FROM sk.ref_kegiatan_kum WHERE id = $1',
      [ref_kegiatan_id]
    );
    
    if (refResult.rows.length === 0) {
      // Delete uploaded file if ref_kegiatan not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        error: 'Invalid ref_kegiatan_id',
      });
    }
    
    const poin_kum = refResult.rows[0].poin_maksimal;
    
    // Insert kegiatan
    const query = `
      INSERT INTO sk.kegiatan_dosen (
        dosen_id, ref_kegiatan_id, poin_kum, deskripsi,
        file_name, file_path, file_hash, file_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      userId,
      ref_kegiatan_id,
      poin_kum,
      deskripsi || null,
      req.file.originalname,
      req.file.path,
      file_hash,
      req.file.size,
    ];
    
    const result = await pool.query(query, values);
    const kegiatan = result.rows[0];
    
    // Log audit trail
    await pool.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values, ip_address, description)
       VALUES ($1, 'CREATE', 'kegiatan_dosen', $2, $3, $4, $5)`,
      [userId, kegiatan.id, JSON.stringify({ ref_kegiatan_id, poin_kum, file_hash }), req.ip, 'Kegiatan baru dibuat']
    );

    // Submit to blockchain (non-blocking, fallback if unavailable)
    if (fabricClient.isFabricEnabled()) {
      try {
        await fabricClient.recordKegiatanCreation(
          kegiatan.id, userId, file_hash, ref_kegiatan_id, poin_kum
        );
        // Update tx_id if successful
        const txResult = await pool.query(
          'UPDATE sk.kegiatan_dosen SET tx_id_fabric = $1 WHERE id = $2',
          [`fabric-${Date.now()}`, kegiatan.id]
        );
      } catch (fabricErr) {
        console.warn('⚠️  Blockchain recording failed (continuing without):', fabricErr.message);
      }
    }
    
    res.status(201).json({
      message: 'Kegiatan created successfully',
      data: kegiatan,
    });
    
  } catch (error) {
    console.error('Create kegiatan error:', error);
    
    // Delete uploaded file if error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Failed to create kegiatan',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/kegiatan/{id}/verify:
 *   put:
 *     summary: Verify kegiatan
 *     description: Verify or reject kegiatan (admin/pimpinan only)
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [verified, rejected, revision_requested]
 *               rejection_reason:
 *                 type: string
 *               catatan_penolakan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kegiatan status updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Kegiatan not found
 *       500:
 *         description: Failed to update status
 */
router.put('/:id/verify', auth, checkRole(['admin_sdm', 'pimpinan', 'superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, catatan_penolakan } = req.body;
    const userId = req.user.id;
    
    if (!status || !['verified', 'rejected', 'revision_requested'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed: ['verified', 'rejected', 'revision_requested'],
      });
    }
    
    // Check if kegiatan exists
    const checkQuery = 'SELECT id FROM sk.kegiatan_dosen WHERE id = $1 AND deleted_at IS NULL';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Kegiatan not found',
      });
    }
    
    // Update status
    const query = `
      UPDATE sk.kegiatan_dosen
      SET status = $1,
          verified_by = $2,
          verified_at = NOW(),
          rejection_reason = $3,
          catatan_penolakan = $4
      WHERE id = $5 AND deleted_at IS NULL
      RETURNING *
    `;
    
    const values = [
      status,
      userId,
      rejection_reason || null,
      catatan_penolakan || null,
      id,
    ];
    
    const result = await pool.query(query, values);
    
    // Log audit trail
    await pool.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values, ip_address, description)
       VALUES ($1, 'VERIFY', 'kegiatan_dosen', $2, $3, $4, $5)`,
      [userId, id, JSON.stringify({ status, rejection_reason, catatan_penolakan }), req.ip, `Kegiatan ${status}`]
    );

    // Record verification on blockchain
    if (fabricClient.isFabricEnabled()) {
      try {
        await fabricClient.recordKegiatanVerification(id, status, userId);
      } catch (fabricErr) {
        console.warn('⚠️  Blockchain verification recording failed:', fabricErr.message);
      }
    }

    res.json({
      message: `Kegiatan ${status} successfully`,
      data: result.rows[0],
    });
    
  } catch (error) {
    console.error('Verify kegiatan error:', error);
    res.status(500).json({
      error: 'Failed to update kegiatan status',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/kegiatan/{id}:
 *   delete:
 *     summary: Delete kegiatan (soft delete)
 *     description: Soft delete kegiatan (owner only)
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Kegiatan deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Kegiatan not found
 *       500:
 *         description: Failed to delete kegiatan
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Check ownership
    const checkQuery = 'SELECT dosen_id FROM sk.kegiatan_dosen WHERE id = $1 AND deleted_at IS NULL';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Kegiatan not found',
      });
    }
    
    // Only owner or admin can delete
    if (userRole === 'dosen' && checkResult.rows[0].dosen_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own kegiatan',
      });
    }
    
    // Soft delete
    const query = `
      UPDATE sk.kegiatan_dosen
      SET deleted_at = NOW()
      WHERE id = $1
    `;
    
    await pool.query(query, [id]);
    
    res.json({
      message: 'Kegiatan deleted successfully',
    });
    
  } catch (error) {
    console.error('Delete kegiatan error:', error);
    res.status(500).json({
      error: 'Failed to delete kegiatan',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/kegiatan/{id}/audit:
 *   get:
 *     summary: Get audit trail for kegiatan
 *     description: Retrieve audit log entries for a specific kegiatan
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Audit trail entries
 *       404:
 *         description: Kegiatan not found
 *       500:
 *         description: Failed to fetch audit trail
 */
router.get('/:id/audit', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check kegiatan exists and user has access
    const checkQuery = `
      SELECT dosen_id FROM sk.kegiatan_dosen WHERE id = $1 AND deleted_at IS NULL
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kegiatan not found' });
    }

    // Dosen only sees own kegiatan audit
    if (userRole === 'dosen' && checkResult.rows[0].dosen_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const query = `
      SELECT al.id, al.action, al.old_values, al.new_values,
             al.description, al.ip_address, al.created_at,
             u.nama_lengkap as user_name, u.role as user_role
      FROM sk.audit_logs al
      LEFT JOIN sk.users u ON al.user_id = u.id
      WHERE al.table_name = 'kegiatan_dosen' AND al.record_id = $1
      ORDER BY al.created_at DESC
    `;

    const result = await pool.query(query, [id]);

    res.json({
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit trail',
      message: error.message,
    });
  }
});

module.exports = router;
