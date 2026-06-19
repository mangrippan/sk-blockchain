/**
 * Secure File Download Routes
 * /api/v1/files
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { pool } = require('../../config/database');
const { auth } = require('../../middleware/auth');

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/v1/files/kegiatan/{kegiatanId}:
 *   get:
 *     summary: Download kegiatan document
 *     description: Download kegiatan document with authorization check
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kegiatanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Kegiatan UUID
 *     responses:
 *       200:
 *         description: File download
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 */
router.get('/kegiatan/:kegiatanId', async (req, res) => {
  try {
    const { kegiatanId } = req.params;

    // Get kegiatan data to check ownership and file path
    const result = await pool.query(
      `SELECT k.*, k.file_path, k.dosen_id 
       FROM sk.kegiatan k
       WHERE k.id = $1 AND k.deleted_at IS NULL`,
      [kegiatanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kegiatan not found' });
    }

    const kegiatan = result.rows[0];

    // Authorization: dosen can only download their own files
    // admin_sdm, pimpinan, superadmin can download any file
    if (
      req.user.role === 'dosen' &&
      kegiatan.dosen_id !== req.user.id
    ) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only download your own documents'
      });
    }

    // Check if file exists
    if (!kegiatan.file_path) {
      return res.status(404).json({ error: 'No file attached to this kegiatan' });
    }

    const filePath = path.join(__dirname, '../../', kegiatan.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found on server',
        message: 'The file may have been deleted or moved'
      });
    }

    // Send file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });

  } catch (error) {
    console.error('Error downloading kegiatan file:', error);
    res.status(500).json({ 
      error: 'Failed to download file',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/v1/files/sk/{usulanId}:
 *   get:
 *     summary: Download SK document
 *     description: Download SK document with authorization check
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usulanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Usulan UUID
 *     responses:
 *       200:
 *         description: File download
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 */
router.get('/sk/:usulanId', async (req, res) => {
  try {
    const { usulanId } = req.params;

    // Get usulan data to check ownership and file path
    const result = await pool.query(
      `SELECT u.*, u.sk_file_path, u.dosen_id 
       FROM sk.usulan_kenaikan_pangkat u
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [usulanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usulan not found' });
    }

    const usulan = result.rows[0];

    // Authorization: dosen can only download their own SK
    // admin_sdm, pimpinan, superadmin can download any SK
    if (
      req.user.role === 'dosen' &&
      usulan.dosen_id !== req.user.id
    ) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only download your own SK documents'
      });
    }

    // Check if file exists
    if (!usulan.sk_file_path) {
      return res.status(404).json({ error: 'No SK document attached to this usulan' });
    }

    const filePath = path.join(__dirname, '../../', usulan.sk_file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found on server',
        message: 'The SK file may have been deleted or moved'
      });
    }

    // Send file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error('SK file download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download SK file' });
        }
      }
    });

  } catch (error) {
    console.error('Error downloading SK file:', error);
    res.status(500).json({ 
      error: 'Failed to download file',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/v1/files/dokumen/{dokumenId}:
 *   get:
 *     summary: Download administrative document
 *     description: Download a dokumen_administrasi file with authorization check
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dokumenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: File download
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 */
router.get('/dokumen/:dokumenId', async (req, res) => {
  try {
    const { dokumenId } = req.params;

    // Join document -> usulan to resolve file path and ownership
    const result = await pool.query(
      `SELECT d.document_url, d.file_name, u.dosen_id
       FROM sk.dokumen_administrasi d
       JOIN sk.usulan_kenaikan_pangkat u ON d.usulan_id = u.id
       WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [dokumenId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const dokumen = result.rows[0];

    // Authorization: dosen can only download their own documents
    if (req.user.role === 'dosen' && dokumen.dosen_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only download your own documents'
      });
    }

    if (!dokumen.document_url) {
      return res.status(404).json({ error: 'No file attached to this document' });
    }

    const filePath = path.join(__dirname, '../../', dokumen.document_url);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found on server',
        message: 'The file may have been deleted or moved'
      });
    }

    res.download(filePath, dokumen.file_name || path.basename(filePath), (err) => {
      if (err) {
        console.error('Document download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download document' });
        }
      }
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      error: 'Failed to download file',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
