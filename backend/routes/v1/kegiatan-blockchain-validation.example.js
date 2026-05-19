/**
 * Blockchain Validation Endpoint Examples
 * 
 * Endpoint tambahan untuk validasi blockchain integrity pada kegiatan.
 * Copy kode ini ke routes/v1/kegiatan.js untuk menambahkan fitur validasi blockchain.
 */

/**
 * @swagger
 * /api/v1/kegiatan/{id}/validate-blockchain:
 *   get:
 *     summary: Validate kegiatan blockchain integrity
 *     description: Check if kegiatan blockchain record matches database record
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
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 checks:
 *                   type: object
 *                 details:
 *                   type: object
 *       404:
 *         description: Kegiatan not found
 *       500:
 *         description: Validation error
 */
router.get('/:id/validate-blockchain', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get kegiatan from database
    const query = `
      SELECT k.*, 
             ref.nama_kegiatan,
             u.nama_lengkap as nama_dosen
      FROM sk.kegiatan_dosen k
      JOIN sk.users u ON k.dosen_id = u.id
      JOIN sk.ref_kegiatan_kum ref ON k.ref_kegiatan_id = ref.id
      WHERE k.id = $1 AND k.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Kegiatan not found',
      });
    }
    
    const kegiatan = result.rows[0];

    // Permission check
    if (userRole === 'dosen' && kegiatan.dosen_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only validate your own kegiatan',
      });
    }

    // Initialize validation results
    const validationResults = {
      valid: true,
      checks: {
        blockchainEnabled: false,
        blockchainRecordExists: false,
        documentHashMatches: false,
        statusConsistent: false,
        hasCompleteHistory: false,
      },
      details: {
        databaseStatus: kegiatan.status,
        databaseHash: kegiatan.file_hash,
        blockchainStatus: null,
        blockchainHash: null,
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
      const blockchainHistory = await fabricClient.getKegiatanHistory(id);
      
      if (!blockchainHistory || blockchainHistory.length === 0) {
        validationResults.valid = false;
        validationResults.checks.blockchainRecordExists = false;
        validationResults.errors.push('No blockchain record found for this kegiatan');
        
        if (kegiatan.status === 'verified' || kegiatan.status === 'rejected') {
          validationResults.inconsistencies.push(
            `Kegiatan is ${kegiatan.status} but has no blockchain record`
          );
        }
      } else {
        validationResults.checks.blockchainRecordExists = true;

        // 2. Verify document hash
        try {
          const hashVerification = await fabricClient.verifyDocumentHash(
            id,
            kegiatan.file_hash
          );
          
          if (hashVerification) {
            validationResults.checks.documentHashMatches = hashVerification.valid;
            validationResults.details.blockchainHash = hashVerification.blockchainHash;
            
            if (!hashVerification.valid) {
              validationResults.valid = false;
              validationResults.errors.push(
                'Document hash mismatch - possible tampering detected'
              );
              validationResults.details.inconsistencies.push({
                type: 'HASH_MISMATCH',
                database: kegiatan.file_hash,
                blockchain: hashVerification.blockchainHash,
              });
            }
          }
        } catch (hashError) {
          validationResults.warnings.push(
            `Hash verification failed: ${hashError.message}`
          );
        }

        // 3. Check status consistency
        const latestBlockchainRecord = blockchainHistory[blockchainHistory.length - 1];
        if (latestBlockchainRecord && latestBlockchainRecord.value) {
          validationResults.details.blockchainStatus = latestBlockchainRecord.value.status;
          
          if (latestBlockchainRecord.value.status !== kegiatan.status) {
            validationResults.valid = false;
            validationResults.checks.statusConsistent = false;
            validationResults.errors.push('Status mismatch between database and blockchain');
            validationResults.details.inconsistencies.push({
              type: 'STATUS_MISMATCH',
              database: kegiatan.status,
              blockchain: latestBlockchainRecord.value.status,
            });
          } else {
            validationResults.checks.statusConsistent = true;
          }
        }

        // 4. Check for complete history (CREATE + VERIFY if verified)
        const hasCreateRecord = blockchainHistory.some(
          h => h.value && h.value.action === 'CREATE'
        );
        
        if (!hasCreateRecord) {
          validationResults.checks.hasCompleteHistory = false;
          validationResults.warnings.push('No CREATE transaction found in blockchain');
        } else if (kegiatan.status === 'verified' || kegiatan.status === 'rejected') {
          const hasVerifyRecord = blockchainHistory.some(
            h => h.value && (h.value.action === 'VERIFY' || h.value.newStatus)
          );
          
          if (!hasVerifyRecord) {
            validationResults.checks.hasCompleteHistory = false;
            validationResults.warnings.push(
              `Kegiatan is ${kegiatan.status} but no VERIFY transaction found`
            );
          } else {
            validationResults.checks.hasCompleteHistory = true;
          }
        } else {
          validationResults.checks.hasCompleteHistory = true;
        }

        // Add blockchain history to details
        validationResults.details.blockchainHistory = blockchainHistory.map(h => ({
          txId: h.txId,
          timestamp: h.timestamp,
          action: h.value?.action || 'UNKNOWN',
          status: h.value?.status || h.value?.newStatus,
        }));
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
 * /api/v1/kegiatan/{id}/verify-hash:
 *   post:
 *     summary: Verify document hash against blockchain
 *     description: Check if a document hash matches the blockchain record
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
 *             properties:
 *               documentHash:
 *                 type: string
 *                 description: SHA-256 hash of the document to verify
 *     responses:
 *       200:
 *         description: Hash verification result
 *       400:
 *         description: Missing document hash
 *       404:
 *         description: Kegiatan not found
 */
router.post('/:id/verify-hash', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { documentHash } = req.body;

    if (!documentHash) {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['documentHash'],
      });
    }

    // Check if kegiatan exists
    const kegiatan = await Kegiatan.findById(id);
    if (!kegiatan) {
      return res.status(404).json({
        error: 'Kegiatan not found',
      });
    }

    // Check blockchain availability
    if (!fabricClient.isFabricEnabled()) {
      return res.json({
        valid: null,
        message: 'Blockchain validation unavailable (blockchain disabled)',
        fallbackCheck: documentHash === kegiatan.file_hash,
      });
    }

    try {
      // Verify hash against blockchain
      const verification = await fabricClient.verifyDocumentHash(id, documentHash);
      
      if (!verification) {
        return res.json({
          valid: null,
          message: 'No blockchain record found for verification',
          databaseHash: kegiatan.file_hash,
          providedHash: documentHash,
          databaseMatch: documentHash === kegiatan.file_hash,
        });
      }

      res.json({
        valid: verification.valid,
        message: verification.message,
        blockchainHash: verification.blockchainHash,
        providedHash: verification.providedHash,
        databaseHash: kegiatan.file_hash,
        allMatch: verification.valid && documentHash === kegiatan.file_hash,
        timestamp: new Date().toISOString(),
      });

    } catch (blockchainError) {
      console.error('Blockchain hash verification error:', blockchainError);
      
      res.json({
        valid: null,
        message: 'Blockchain verification failed',
        error: blockchainError.message,
        databaseHash: kegiatan.file_hash,
        providedHash: documentHash,
        databaseMatch: documentHash === kegiatan.file_hash,
      });
    }

  } catch (error) {
    console.error('Hash verification error:', error);
    res.status(500).json({
      error: 'Failed to verify document hash',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/v1/kegiatan/validate-all:
 *   get:
 *     summary: Validate all kegiatan blockchain integrity (Admin only)
 *     description: Batch validate blockchain records for all or filtered kegiatan
 *     tags: [Kegiatan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Batch validation results
 *       403:
 *         description: Forbidden (admin only)
 */
router.get('/validate-all', auth, checkRole(['admin_sdm', 'superadmin']), async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    // Check blockchain availability
    if (!fabricClient.isFabricEnabled()) {
      return res.json({
        message: 'Blockchain validation unavailable (blockchain disabled)',
        validated: 0,
      });
    }

    // Get kegiatan to validate
    let query = `
      SELECT id, status, file_hash, dosen_id
      FROM sk.kegiatan_dosen
      WHERE deleted_at IS NULL
    `;
    
    const params = [];
    if (status) {
      query += ` AND status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    
    const validationResults = {
      total: result.rows.length,
      valid: 0,
      invalid: 0,
      errors: 0,
      inconsistencies: [],
    };

    // Validate each kegiatan
    for (const kegiatan of result.rows) {
      try {
        const history = await fabricClient.getKegiatanHistory(kegiatan.id);
        
        if (!history || history.length === 0) {
          validationResults.invalid++;
          
          if (kegiatan.status === 'verified' || kegiatan.status === 'rejected') {
            validationResults.inconsistencies.push({
              kegiatanId: kegiatan.id,
              type: 'MISSING_BLOCKCHAIN_RECORD',
              status: kegiatan.status,
            });
          }
        } else {
          const latestRecord = history[history.length - 1];
          const blockchainStatus = latestRecord?.value?.status;
          
          if (blockchainStatus !== kegiatan.status) {
            validationResults.invalid++;
            validationResults.inconsistencies.push({
              kegiatanId: kegiatan.id,
              type: 'STATUS_MISMATCH',
              databaseStatus: kegiatan.status,
              blockchainStatus: blockchainStatus,
            });
          } else {
            validationResults.valid++;
          }
        }
      } catch (err) {
        validationResults.errors++;
        validationResults.inconsistencies.push({
          kegiatanId: kegiatan.id,
          type: 'VALIDATION_ERROR',
          error: err.message,
        });
      }
    }

    res.json({
      message: 'Batch validation completed',
      ...validationResults,
    });

  } catch (error) {
    console.error('Batch validation error:', error);
    res.status(500).json({
      error: 'Failed to validate kegiatan',
      message: error.message,
    });
  }
});

// Export router jika menggunakan module pattern
module.exports = router;
