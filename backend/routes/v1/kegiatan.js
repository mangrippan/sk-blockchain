/**
 * Kegiatan Routes
 * /api/v1/kegiatan
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { auth, checkRole } = require('../../middleware/auth');
const { generateFileHash } = require('../../utils/hashUtils');

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
    const { status, limit = 20, offset = 0 } = req.query;
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
    
    const whereClause = 'WHERE ' + conditions.join(' AND ');
    
    const query = `
      SELECT k.*, 
             u.nama_lengkap as nama_dosen,
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
router.post('/', auth, async (req, res) => {
  try {
    const {
      ref_kegiatan_id,
      poin_kum,
      deskripsi,
      file_name,
      file_path,
      file_hash,
      file_size,
    } = req.body;
    
    // Validation
    if (!ref_kegiatan_id || !poin_kum || !file_name || !file_hash) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['ref_kegiatan_id', 'poin_kum', 'file_name', 'file_hash'],
      });
    }
    
    const userId = req.user.id;
    
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
      file_name,
      file_path || `/uploads/${file_name}`,
      file_hash,
      file_size || null,
    ];
    
    const result = await pool.query(query, values);
    const kegiatan = result.rows[0];
    
    // TODO: Submit to blockchain here (Minggu 2)
    // const txId = await fabricClient.submitTransaction('CreateKegiatan', ...);
    // await pool.query('UPDATE sk.kegiatan_dosen SET tx_id_fabric = $1 WHERE id = $2', [txId, kegiatan.id]);
    
    res.status(201).json({
      message: 'Kegiatan created successfully',
      data: kegiatan,
    });
    
  } catch (error) {
    console.error('Create kegiatan error:', error);
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

module.exports = router;
