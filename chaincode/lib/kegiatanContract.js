'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * KegiatanContract - Smart Contract for Kegiatan Dosen
 * 
 * Stores document hashes and kegiatan metadata on the blockchain
 * for tamper-proof audit trail and integrity verification.
 */
class KegiatanContract extends Contract {

  constructor() {
    super('KegiatanContract');
  }

  /**
   * InitLedger - Initialize the ledger with sample data (optional)
   */
  async InitLedger(ctx) {
    console.info('============= START : Initialize Ledger ===========');
    console.info('============= END : Initialize Ledger ===========');
  }

  /**
   * CreateKegiatan - Record a new kegiatan hash on the blockchain
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan (from PostgreSQL)
   * @param {string} dosenId - ID of the dosen who owns the kegiatan
   * @param {string} fileHash - SHA-256 hash of the uploaded document
   * @param {string} refKegiatanId - Reference kegiatan ID
   * @param {string} poinKum - Point value
   * @param {string} timestamp - ISO timestamp of creation
   * @param {string} parentKegiatanId - Optional: Parent kegiatan ID if this is a revision (default: null)
   * @param {string} versi - Optional: Version number if this is a revision (default: 1)
   */
  async CreateKegiatan(ctx, kegiatanId, dosenId, fileHash, refKegiatanId, poinKum, timestamp, parentKegiatanId = null, versi = '1') {
    // Check if kegiatan already exists
    const exists = await this.KegiatanExists(ctx, kegiatanId);
    if (exists) {
      throw new Error(`Kegiatan ${kegiatanId} already exists`);
    }

    const kegiatan = {
      docType: 'kegiatan',
      id: kegiatanId,
      dosenId: dosenId,
      fileHash: fileHash,
      refKegiatanId: refKegiatanId,
      poinKum: parseFloat(poinKum),
      status: 'unverified',
      parentKegiatanId: parentKegiatanId,
      versi: parseInt(versi),
      createdAt: timestamp,
      updatedAt: timestamp,
      verifiedBy: null,
      verifiedAt: null,
    };

    await ctx.stub.putState(kegiatanId, Buffer.from(JSON.stringify(kegiatan)));
    
    // Emit event for off-chain listeners
    ctx.stub.setEvent('KegiatanCreated', Buffer.from(JSON.stringify({
      id: kegiatanId,
      fileHash: fileHash,
      dosenId: dosenId,
      parentKegiatanId: parentKegiatanId,
      versi: parseInt(versi),
    })));

    return JSON.stringify(kegiatan);
  }

  /**
   * ReadKegiatan - Retrieve kegiatan data from the blockchain
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   */
  async ReadKegiatan(ctx, kegiatanId) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    if (!kegiatanJSON || kegiatanJSON.length === 0) {
      throw new Error(`Kegiatan ${kegiatanId} does not exist`);
    }
    return kegiatanJSON.toString();
  }

  /**
   * VerifyKegiatan - Update kegiatan status to verified/rejected/revision_requested
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   * @param {string} newStatus - New status (verified/rejected/revision_requested)
   * @param {string} verifiedBy - User ID who verified
   * @param {string} timestamp - ISO timestamp of verification
   */
  async VerifyKegiatan(ctx, kegiatanId, newStatus, verifiedBy, timestamp) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    if (!kegiatanJSON || kegiatanJSON.length === 0) {
      throw new Error(`Kegiatan ${kegiatanId} does not exist`);
    }

    const kegiatan = JSON.parse(kegiatanJSON.toString());
    
    // Validate status
    const validStatuses = ['verified', 'rejected', 'revision_requested'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    const oldStatus = kegiatan.status;
    kegiatan.status = newStatus;
    kegiatan.verifiedBy = verifiedBy;
    kegiatan.verifiedAt = timestamp;
    kegiatan.updatedAt = timestamp;

    await ctx.stub.putState(kegiatanId, Buffer.from(JSON.stringify(kegiatan)));

    // Emit different events based on status
    if (newStatus === 'revision_requested') {
      ctx.stub.setEvent('KegiatanRevisionRequested', Buffer.from(JSON.stringify({
        id: kegiatanId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        verifiedBy: verifiedBy,
      })));
    } else {
      ctx.stub.setEvent('KegiatanVerified', Buffer.from(JSON.stringify({
        id: kegiatanId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        verifiedBy: verifiedBy,
      })));
    }

    return JSON.stringify(kegiatan);
  }

  /**
   * GetHistory - Get the full transaction history for a kegiatan
   * This is the key blockchain advantage: immutable audit trail
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   */
  async GetHistory(ctx, kegiatanId) {
    const iterator = await ctx.stub.getHistoryForKey(kegiatanId);
    const history = [];

    let result = await iterator.next();
    while (!result.done) {
      const record = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
      };

      if (!result.value.isDelete) {
        try {
          record.value = JSON.parse(result.value.value.toString('utf8'));
        } catch (err) {
          record.value = result.value.value.toString('utf8');
        }
      }

      history.push(record);
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(history);
  }

  /**
   * VerifyDocumentHash - Compare a document hash against the stored hash
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   * @param {string} documentHash - Hash to verify against stored hash
   */
  async VerifyDocumentHash(ctx, kegiatanId, documentHash) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    if (!kegiatanJSON || kegiatanJSON.length === 0) {
      throw new Error(`Kegiatan ${kegiatanId} does not exist`);
    }

    const kegiatan = JSON.parse(kegiatanJSON.toString());
    const isValid = kegiatan.fileHash === documentHash;

    return JSON.stringify({
      kegiatanId: kegiatanId,
      storedHash: kegiatan.fileHash,
      providedHash: documentHash,
      isValid: isValid,
      message: isValid ? 'Document integrity verified' : 'Document has been tampered!',
    });
  }

  /**
   * KegiatanExists - Check if a kegiatan exists on the ledger
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} kegiatanId - UUID of the kegiatan
   */
  async KegiatanExists(ctx, kegiatanId) {
    const kegiatanJSON = await ctx.stub.getState(kegiatanId);
    return kegiatanJSON && kegiatanJSON.length > 0;
  }

  /**
   * GetAllKegiatan - Get all kegiatan records (for admin/audit)
   * Uses range query with empty start/end keys
   */
  async GetAllKegiatan(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const results = [];

    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value).toString('utf8');
      try {
        const record = JSON.parse(strValue);
        if (record.docType === 'kegiatan') {
          results.push(record);
        }
      } catch (err) {
        // Skip non-JSON entries
      }
      result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(results);
  }

  // ============================================================
  // USULAN KENAIKAN PANGKAT FUNCTIONS
  // ============================================================

  /**
   * Syarat KUM minimal per jabatan
   */
  _getMinKUM(jabatanTujuan) {
    const syarat = {
      'Asisten Ahli': 100,
      'Lektor': 200,
      'Lektor Kepala': 300,
      'Guru Besar': 400,
    };
    return syarat[jabatanTujuan] || 0;
  }

  /**
   * AjukanUsulanKenaikanPangkat - Record a new promotion request on blockchain
   * 
   * @param {Context} ctx
   * @param {string} usulanId - UUID of the usulan
   * @param {string} hashNIP - Hashed NIP of the dosen
   * @param {string} totalKUM - Total accumulated KUM points
   * @param {string} jabatanTujuan - Target position
   * @param {string} idUsulanLama - Previous rejected usulan ID (null if first time)
   * @param {string} snapshotHash - SHA-256 hash of kegiatan snapshot (for integrity)
   * @param {string} timestamp - ISO timestamp
   */
  async AjukanUsulanKenaikanPangkat(ctx, usulanId, hashNIP, totalKUM, jabatanTujuan, idUsulanLama, snapshotHash, timestamp) {
    const key = 'USULAN_' + usulanId;

    // Check if already exists
    const existing = await ctx.stub.getState(key);
    if (existing && existing.length > 0) {
      throw new Error(`Usulan ${usulanId} already exists`);
    }

    // Note: KUM validation is handled by the application layer (database).
    // Blockchain records the event as-is for audit trail purposes.
    const minKUM = this._getMinKUM(jabatanTujuan);
    const kumMeetRequirement = parseFloat(totalKUM) >= minKUM;

    // Versioning: if resubmitting after rejection
    if (idUsulanLama && idUsulanLama !== 'null') {
      const oldKey = 'USULAN_' + idUsulanLama;
      const oldData = await ctx.stub.getState(oldKey);
      if (oldData && oldData.length > 0) {
        const oldUsulan = JSON.parse(oldData.toString());
        if (oldUsulan.status !== 'rejected') {
          throw new Error(`Usulan lama ${idUsulanLama} belum berstatus rejected`);
        }
      }
    }

    const usulan = {
      docType: 'usulan',
      id: usulanId,
      hashNIP: hashNIP,
      totalKUM: parseFloat(totalKUM),
      jabatanTujuan: jabatanTujuan,
      kumMeetRequirement: kumMeetRequirement,
      status: 'pending',
      idUsulanLama: idUsulanLama !== 'null' ? idUsulanLama : null,
      snapshotHash: snapshotHash || null,
      skHash: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      processedBy: null,
      processedAt: null,
      catatanPenolakan: null,
    };

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('UsulanCreated', Buffer.from(JSON.stringify({
      id: usulanId,
      hashNIP: hashNIP,
      jabatanTujuan: jabatanTujuan,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * ProsesUsulanKenaikanPangkat - Change status from Pending → Diproses
   */
  async ProsesUsulanKenaikanPangkat(ctx, usulanId, processedBy, timestamp) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    if (usulan.status !== 'pending') {
      throw new Error(`Usulan ${usulanId} is not in pending status (current: ${usulan.status})`);
    }

    usulan.status = 'diproses';
    usulan.processedBy = processedBy;
    usulan.processedAt = timestamp;
    usulan.updatedAt = timestamp;

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('UsulanProcessed', Buffer.from(JSON.stringify({
      id: usulanId,
      status: 'diproses',
      processedBy: processedBy,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * TolakUsulanKenaikanPangkat - Reject an usulan
   */
  async TolakUsulanKenaikanPangkat(ctx, usulanId, processedBy, catatanPenolakan, timestamp) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    if (!['pending', 'diproses'].includes(usulan.status)) {
      throw new Error(`Usulan ${usulanId} cannot be rejected (current: ${usulan.status})`);
    }

    usulan.status = 'rejected';
    usulan.processedBy = processedBy;
    usulan.processedAt = timestamp;
    usulan.catatanPenolakan = catatanPenolakan;
    usulan.updatedAt = timestamp;

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('UsulanRejected', Buffer.from(JSON.stringify({
      id: usulanId,
      status: 'rejected',
      processedBy: processedBy,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * TerbitkanSkKenaikanPangkat - Issue SK and lock hash on blockchain
   */
  async TerbitkanSkKenaikanPangkat(ctx, usulanId, skHash, processedBy, timestamp) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    if (usulan.status !== 'diproses') {
      throw new Error(`Usulan ${usulanId} must be in 'diproses' status to issue SK (current: ${usulan.status})`);
    }

    usulan.status = 'sk_issued';
    usulan.skHash = skHash;
    usulan.processedBy = processedBy;
    usulan.processedAt = timestamp;
    usulan.updatedAt = timestamp;

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(usulan)));

    ctx.stub.setEvent('SKIssued', Buffer.from(JSON.stringify({
      id: usulanId,
      skHash: skHash,
      processedBy: processedBy,
    })));

    return JSON.stringify(usulan);
  }

  /**
   * GetUsulan - Read usulan from blockchain (wraps GetAset for USULAN_ key)
   */
  async GetUsulan(ctx, usulanId) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }
    return data.toString();
  }

  /**
   * GetHistoriUsulan - Get full audit trail for an usulan
   */
  async GetHistoriUsulan(ctx, usulanId) {
    const key = 'USULAN_' + usulanId;
    return await this.GetHistory(ctx, key);
  }

  /**
   * VerifyUsulanSnapshot - Verify the integrity of kegiatan snapshot against stored hash
   * 
   * @param {Context} ctx
   * @param {string} usulanId - UUID of the usulan
   * @param {string} calculatedHash - Hash calculated from current snapshot data
   * @returns {object} Verification result with match status
   */
  async VerifyUsulanSnapshot(ctx, usulanId, calculatedHash) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    const storedHash = usulan.snapshotHash;
    const isValid = storedHash === calculatedHash;

    return JSON.stringify({
      usulanId: usulanId,
      storedHash: storedHash,
      calculatedHash: calculatedHash,
      isValid: isValid,
      message: isValid 
        ? 'Snapshot integrity verified - no tampering detected' 
        : 'WARNING: Snapshot hash mismatch - possible data tampering!',
      verifiedAt: new Date().toISOString(),
    });
  }

  /**
   * VerifySkHash - Verify the integrity of SK document hash against stored hash
   * 
   * @param {Context} ctx
   * @param {string} usulanId - UUID of the usulan
   * @param {string} providedHash - Hash to verify against stored skHash
   * @returns {object} Verification result with match status
   */
  async VerifySkHash(ctx, usulanId, providedHash) {
    const key = 'USULAN_' + usulanId;
    const data = await ctx.stub.getState(key);
    
    if (!data || data.length === 0) {
      throw new Error(`Usulan ${usulanId} does not exist`);
    }

    const usulan = JSON.parse(data.toString());
    const storedHash = usulan.skHash;
    
    // If SK hasn't been issued yet, skHash will be null
    if (!storedHash) {
      return JSON.stringify({
        usulanId: usulanId,
        storedHash: null,
        providedHash: providedHash,
        isValid: false,
        message: 'SK has not been issued yet - no hash stored on blockchain',
        verifiedAt: new Date().toISOString(),
      });
    }

    const isValid = storedHash === providedHash;

    return JSON.stringify({
      usulanId: usulanId,
      storedHash: storedHash,
      providedHash: providedHash,
      isValid: isValid,
      message: isValid 
        ? 'SK document hash verified - no tampering detected' 
        : 'WARNING: SK document hash mismatch - possible tampering detected!',
      verifiedAt: new Date().toISOString(),
    });
  }

  // ============================================================
  // COUCHDB RICH QUERY FUNCTIONS
  // ============================================================

  /**
   * QueryKegiatanByDosen - Query kegiatan berdasarkan dosenId menggunakan CouchDB rich query
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} dosenId - ID of the dosen
   * @returns {string} JSON array of kegiatan records
   */
  async QueryKegiatanByDosen(ctx, dosenId) {
    const queryString = {
      selector: {
        docType: 'kegiatan',
        dosenId: dosenId
      },
      sort: [{ createdAt: 'desc' }]
    };
    return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
  }

  /**
   * QueryKegiatanByStatus - Query kegiatan berdasarkan status
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} status - Status of the kegiatan (unverified/verified/rejected/revision_requested)
   * @returns {string} JSON array of kegiatan records
   */
  async QueryKegiatanByStatus(ctx, status) {
    const queryString = {
      selector: {
        docType: 'kegiatan',
        status: status
      }
    };
    return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
  }

  /**
   * QueryKegiatanByDateRange - Query kegiatan berdasarkan rentang tanggal
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {string} JSON array of kegiatan records
   */
  async QueryKegiatanByDateRange(ctx, startDate, endDate) {
    const queryString = {
      selector: {
        docType: 'kegiatan',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    };
    return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
  }

  /**
   * QueryUsulanByHashNIP - Query usulan berdasarkan hashed NIP
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} hashNIP - Hashed NIP of the dosen
   * @returns {string} JSON array of usulan records
   */
  async QueryUsulanByHashNIP(ctx, hashNIP) {
    const queryString = {
      selector: {
        docType: 'usulan',
        hashNIP: hashNIP
      },
      sort: [{ createdAt: 'desc' }]
    };
    return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
  }

  /**
   * getQueryResultForQueryString - Helper function to execute CouchDB rich query
   * 
   * @param {Context} ctx - Transaction context
   * @param {string} queryString - JSON query string for CouchDB
   * @returns {string} JSON array of results
   */
  async getQueryResultForQueryString(ctx, queryString) {
    const resultsIterator = await ctx.stub.getQueryResult(queryString);
    const results = [];
    
    let result = await resultsIterator.next();
    while (!result.done) {
      const record = JSON.parse(result.value.value.toString('utf8'));
      results.push({ Key: result.value.key, Record: record });
      result = await resultsIterator.next();
    }
    
    await resultsIterator.close();
    return JSON.stringify(results);
  }
}

module.exports = KegiatanContract;
