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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
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

    // Get all verified kegiatan for this dosen with full details
    const kegiatanResult = await client.query(
      `SELECT k.id, k.poin_kum, k.file_hash, k.ref_kegiatan_id,
              k.tx_id_fabric, k.tx_id_verify_fabric, k.verified_at
       FROM sk.kegiatan_dosen k
       WHERE k.dosen_id = $1 AND k.status = 'verified' AND k.deleted_at IS NULL
       ORDER BY k.id`,
      [req.user.id]
    );
    
    const kegiatanList = kegiatanResult.rows;
    const totalPoin = kegiatanList.reduce((sum, k) => sum + parseFloat(k.poin_kum), 0);

    if (kegiatanList.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'No verified kegiatan found',
        message: 'You must have at least one verified kegiatan to submit usulan'
      });
    }

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
          kegiatan.tx_id_verify_fabric,
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

    // Submit (draft → pending)
    const submitted = await Usulan.submit(usulan.id);

    // Record to blockchain with snapshot hash
    const hashNIP = crypto.createHash('sha256').update(req.user.nip_nidn || '').digest('hex');
    const txResult = await fabricClient.recordUsulanCreation(
      usulan.id,
      hashNIP,
      totalPoin,
      jabatan_tujuan,
      referensi_id || null,
      snapshotHash
    );

    if (txResult) {
      await Usulan.updateBlockchainTx(usulan.id, txResult);
    }

    // Audit log
    await client.query(
      `INSERT INTO sk.audit_logs (user_id, action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.user.id, 'CREATE', 'usulan_kenaikan_pangkat', usulan.id, JSON.stringify({
        jabatan_tujuan, 
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
 * GET /api/v1/usulan/:id/snapshot
 * Get kegiatan snapshot for this usulan
 * Access: Dosen (own only), Admin, Pimpinan, Superadmin, Auditor (all)
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
 * GET /api/v1/usulan/:id/audit
 * Get complete audit trail: kegiatan + usulan + blockchain
 * Access: Dosen (own only), Admin, Pimpinan, Superadmin, Auditor (all)
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

    res.json({
      data: allEntries,
      summary: {
        total: allEntries.length,
        kegiatan: kegiatanEntries.length,
        usulan: usulanEntries.length,
        blockchain: blockchainEntries.length,
      }
    });
  } catch (error) {
    console.error('Error getting audit trail:', error);
    res.status(500).json({ error: 'Failed to get audit trail', message: error.message });
  }
});

module.exports = router;
