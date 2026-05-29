/**
 * Reference Data Routes
 * /api/v1/ref
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { auth } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Reference Data
 *   description: Master data endpoints (kategori KUM, kegiatan KUM, jenis dokumen)
 */

/**
 * @swagger
 * /api/v1/ref/kategori:
 *   get:
 *     summary: Get all kategori KUM
 *     description: Retrieve list of kategori KUM (Pendidikan, Penelitian, Pengabdian, Penunjang)
 *     tags: [Reference Data]
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter only active categories
 *     responses:
 *       200:
 *         description: List of kategori KUM
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       kode:
 *                         type: string
 *                       nama_kategori:
 *                         type: string
 *                       deskripsi:
 *                         type: string
 *       500:
 *         description: Failed to fetch data
 */
router.get('/kategori', async (req, res) => {
  try {
    const activeOnly = req.query.active_only !== 'false'; // default true
    
    let query = 'SELECT * FROM sk.ref_kategori_kum';
    if (activeOnly) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY kode ASC';
    
    const result = await pool.query(query);
    
    res.json({
      data: result.rows,
      count: result.rows.length,
    });
    
  } catch (error) {
    console.error('Get kategori error:', error);
    res.status(500).json({
      error: 'Failed to fetch kategori',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/ref/kegiatan:
 *   get:
 *     summary: Get all kegiatan KUM
 *     description: Retrieve list of kegiatan KUM with their point values
 *     tags: [Reference Data]
 *     parameters:
 *       - in: query
 *         name: kategori_id
 *         schema:
 *           type: integer
 *         description: Filter by kategori ID
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter only active activities
 *     responses:
 *       200:
 *         description: List of kegiatan KUM
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       kode_kegiatan:
 *                         type: string
 *                       nama_kegiatan:
 *                         type: string
 *                       poin_maksimal:
 *                         type: number
 *                       kode_kategori:
 *                         type: string
 *                       nama_kategori:
 *                         type: string
 *       500:
 *         description: Failed to fetch data
 */
router.get('/kegiatan', async (req, res) => {
  try {
    const { kategori_id } = req.query;
    const activeOnly = req.query.active_only !== 'false'; // default true
    
    const conditions = [];
    const values = [];
    let paramCounter = 1;
    
    if (activeOnly) {
      conditions.push('k.is_active = true');
    }
    
    if (kategori_id) {
      conditions.push(`k.kategori_id = $${paramCounter}`);
      values.push(kategori_id);
      paramCounter++;
    }
    
    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ')
      : '';
    
    const query = `
      SELECT k.*, kat.nama_kategori, kat.kode as kode_kategori
      FROM sk.ref_kegiatan_kum k
      JOIN sk.ref_kategori_kum kat ON k.kategori_id = kat.id
      ${whereClause}
      ORDER BY k.kode_kegiatan ASC
    `;
    
    const result = await pool.query(query, values);
    
    res.json({
      data: result.rows,
      count: result.rows.length,
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
 * /api/v1/ref/kegiatan/{id}:
 *   get:
 *     summary: Get kegiatan by ID
 *     description: Retrieve single kegiatan KUM detail
 *     tags: [Reference Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kegiatan ID
 *     responses:
 *       200:
 *         description: Kegiatan detail
 *       404:
 *         description: Kegiatan not found
 *       500:
 *         description: Failed to fetch data
 */
router.get('/kegiatan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT k.*, kat.nama_kategori, kat.kode as kode_kategori
      FROM sk.ref_kegiatan_kum k
      JOIN sk.ref_kategori_kum kat ON k.kategori_id = kat.id
      WHERE k.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Kegiatan not found',
      });
    }
    
    res.json({
      data: result.rows[0],
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
 * /api/v1/ref/dokumen:
 *   get:
 *     summary: Get all jenis dokumen
 *     description: Retrieve list of document types for usulan
 *     tags: [Reference Data]
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter only active document types
 *     responses:
 *       200:
 *         description: List of jenis dokumen
 *       500:
 *         description: Failed to fetch data
 */
router.get('/dokumen', async (req, res) => {
  try {
    const activeOnly = req.query.active_only !== 'false'; // default true
    
    let query = 'SELECT * FROM sk.ref_jenis_dokumen';
    if (activeOnly) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY is_required DESC, kode ASC';
    
    const result = await pool.query(query);
    
    res.json({
      data: result.rows,
      count: result.rows.length,
    });
    
  } catch (error) {
    console.error('Get dokumen error:', error);
    res.status(500).json({
      error: 'Failed to fetch jenis dokumen',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/ref/jabatan:
 *   get:
 *     summary: Get all jabatan akademik
 *     description: Retrieve list of academic positions with hierarchy
 *     tags: [Reference Data]
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter only active positions
 *     responses:
 *       200:
 *         description: List of jabatan akademik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       kode:
 *                         type: string
 *                       nama:
 *                         type: string
 *                       tingkat:
 *                         type: integer
 *                       min_kum:
 *                         type: number
 *       500:
 *         description: Failed to fetch data
 */
router.get('/jabatan', async (req, res) => {
  try {
    const activeOnly = req.query.active_only !== 'false'; // default true
    
    let query = 'SELECT * FROM sk.ref_jabatan_akademik';
    if (activeOnly) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY tingkat ASC';
    
    const result = await pool.query(query);
    
    res.json({
      data: result.rows,
      count: result.rows.length,
    });
    
  } catch (error) {
    console.error('Get jabatan error:', error);
    res.status(500).json({
      error: 'Failed to fetch jabatan',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/ref/jabatan/next/{userId}:
 *   get:
 *     summary: Get next jabatan for user
 *     description: Get the next valid jabatan level for a user's promotion
 *     tags: [Reference Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Next jabatan detail
 *       404:
 *         description: User has no current jabatan or already at highest level
 *       500:
 *         description: Failed to fetch data
 */
router.get('/jabatan/next/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Authorization check: dosen can only check their own userId
    if (req.user.role === 'dosen' && userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own promotion path'
      });
    }
    
    // Get current jabatan
    const userResult = await pool.query(
      'SELECT jabatan_id FROM sk.users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentJabatanId = userResult.rows[0].jabatan_id;
    
    if (!currentJabatanId) {
      return res.status(404).json({ 
        error: 'User has no current jabatan assigned',
        message: 'Please contact admin to set your jabatan'
      });
    }
    
    // Get next jabatan using helper function
    const result = await pool.query(
      'SELECT * FROM sk.get_next_jabatan($1)',
      [currentJabatanId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Already at highest jabatan level',
        message: 'No further promotions available'
      });
    }
    
    res.json({
      data: result.rows[0],
    });
    
  } catch (error) {
    console.error('Get next jabatan error:', error);
    res.status(500).json({
      error: 'Failed to fetch next jabatan',
      message: error.message,
    });
  }
});

module.exports = router;
